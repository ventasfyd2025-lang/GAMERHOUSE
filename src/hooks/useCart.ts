'use client';

import { useState, useEffect, useCallback } from 'react';
import { CartItem, Discount } from '@/types';
import { useStockManager } from './useStockManager';
import { useNotification } from '@/context/NotificationContext';
import { useUserAuth } from './useUserAuth';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useDiscounts } from './useDiscounts';

const sanitizeDiscountMap = (raw: unknown): Record<string, number> => {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  return Object.entries(raw as Record<string, unknown>).reduce((acc, [productId, value]) => {
    const numericValue = typeof value === 'number' ? value : Number(value);
    if (!isNaN(numericValue)) {
      acc[productId] = Math.round(numericValue * 100) / 100;
    }
    return acc;
  }, {} as Record<string, number>);
};

const sanitizeStoredDiscount = (raw: unknown): Discount | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const data = raw as Partial<Discount>;
  if (!data.codigo || typeof data.codigo !== 'string') {
    return null;
  }

  if (typeof data.descuento !== 'number' || !data.tipo || (data.tipo !== 'porcentaje' && data.tipo !== 'fijo')) {
    return null;
  }

  return {
    id: typeof data.id === 'string' ? data.id : 'local',
    codigo: data.codigo,
    descripcion: typeof data.descripcion === 'string' ? data.descripcion : undefined,
    descuento: data.descuento,
    tipo: data.tipo,
    productosAplicables: Array.isArray(data.productosAplicables)
      ? data.productosAplicables.filter((id): id is string => typeof id === 'string')
      : [],
    fechaInicio: typeof data.fechaInicio === 'string' ? data.fechaInicio : '',
    fechaFin: typeof data.fechaFin === 'string' ? data.fechaFin : '',
    activo: data.activo ?? true,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : undefined,
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined
  };
};

const formatCurrencyCLP = (value: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP'
  }).format(value);
};

export function useCartState() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [reservedOrderId, setReservedOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [discountsByProduct, setDiscountsByProduct] = useState<Record<string, number>>({});
  const { reserveStock, releaseStock, confirmSale, loading: stockLoading } = useStockManager();
  const { addNotification } = useNotification();
  const { currentUser } = useUserAuth();
  const { validateDiscount, calculateDiscount, normalizeCode, loading: discountLoading } = useDiscounts();

  const buildDiscountMap = useCallback((cartItems: CartItem[], discount: Discount | null) => {
    if (!discount) {
      return {};
    }

    return cartItems.reduce((acc, item) => {
      const unitDiscount = calculateDiscount(item.productId, item.precio, discount);
      if (unitDiscount > 0) {
        const totalDiscount = Math.round(unitDiscount * item.cantidad * 100) / 100;
        acc[item.productId] = totalDiscount;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [calculateDiscount]);

  const formatDiscountLabel = useCallback((discount: Discount) => {
    return discount.tipo === 'porcentaje'
      ? `-${discount.descuento}%`
      : `-${formatCurrencyCLP(discount.descuento)}`;
  }, []);

  // Load cart from Firebase or localStorage
  useEffect(() => {
    const loadCart = async () => {
      try {
        // Verificar si es un usuario real (no invitado) con uid
        const userId = currentUser && 'uid' in currentUser ? currentUser.uid : null;

        if (userId) {
          // Usuario autenticado - cargar desde Firebase
          const cartRef = doc(db, 'carts', userId);
          const cartDoc = await getDoc(cartRef);

          if (cartDoc.exists()) {
            const data = cartDoc.data();
            setItems(data.items || []);
            setAppliedDiscount(sanitizeStoredDiscount(data.appliedDiscount) || null);
            setDiscountsByProduct(sanitizeDiscountMap(data.discountsByProduct));
          } else {
            setItems([]);
            setAppliedDiscount(null);
            setDiscountsByProduct({});
          }
        } else {
          // Usuario no autenticado o invitado - cargar desde localStorage
          const savedCart = localStorage.getItem('cart');
          if (savedCart) {
            try {
              const parsed = JSON.parse(savedCart);
              if (Array.isArray(parsed)) {
                setItems(parsed);
                setAppliedDiscount(null);
                setDiscountsByProduct({});
              } else {
                setItems(parsed.items || []);
                setAppliedDiscount(sanitizeStoredDiscount(parsed.appliedDiscount));
                setDiscountsByProduct(sanitizeDiscountMap(parsed.discountsByProduct));
              }
            } catch {
              setItems([]);
              setAppliedDiscount(null);
              setDiscountsByProduct({});
            }
          } else {
            setItems([]);
            setAppliedDiscount(null);
            setDiscountsByProduct({});
          }
        }
      } catch (error) {
        console.error('Error loading cart:', error);
        setItems([]);
        setAppliedDiscount(null);
        setDiscountsByProduct({});
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, [currentUser]);

  // Save cart to Firebase or localStorage whenever items change
  useEffect(() => {
    if (isLoading) return; // No guardar durante la carga inicial

    const saveCart = async () => {
      try {
        const userId = currentUser && 'uid' in currentUser ? currentUser.uid : null;

        if (userId) {
          // Usuario autenticado - guardar en Firebase
          const cartRef = doc(db, 'carts', userId);
          await setDoc(cartRef, {
            items,
            appliedDiscount: appliedDiscount || null,
            discountsByProduct,
            updatedAt: new Date()
          });
        } else {
          // Usuario no autenticado - guardar en localStorage
          localStorage.setItem('cart', JSON.stringify({
            items,
            appliedDiscount,
            discountsByProduct
          }));
        }
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    };

    saveCart();
  }, [items, currentUser, isLoading, appliedDiscount, discountsByProduct]);

  // Recalcular descuentos cuando el carrito cambia
  useEffect(() => {
    if (!appliedDiscount) {
      if (Object.keys(discountsByProduct).length > 0) {
        setDiscountsByProduct({});
      }
      return;
    }

    const updatedMap = buildDiscountMap(items, appliedDiscount);
    const currentKeys = Object.keys(discountsByProduct);
    const newKeys = Object.keys(updatedMap);
    const sameLength = currentKeys.length === newKeys.length;
    const hasDifferences = !sameLength
      || currentKeys.some(key => updatedMap[key] !== discountsByProduct[key]);

    if (hasDifferences) {
      setDiscountsByProduct(updatedMap);
    }
  }, [items, appliedDiscount, buildDiscountMap, discountsByProduct]);

  const addItem = useCallback((
    productId: string,
    nombre: string,
    precio: number,
    imagen?: string,
    cantidad: number = 1,
    sku?: string,
    maxStock?: number,
  ) => {
    let feedback: 'added' | 'updated' | 'limitReached' | 'partial' = 'added';
    let appliedCantidad = cantidad;

    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.productId === productId);
      const currentCantidad = existingItem?.cantidad ?? 0;
      let allowedIncrease = cantidad;

      if (maxStock !== undefined) {
        const remaining = maxStock - currentCantidad;
        if (remaining <= 0) {
          feedback = 'limitReached';
          appliedCantidad = 0;
          return prevItems;
        }
        if (cantidad > remaining) {
          allowedIncrease = remaining;
          appliedCantidad = remaining;
          feedback = 'partial';
        }
      }

      if (allowedIncrease <= 0) {
        return prevItems;
      }

      if (existingItem) {
        feedback = feedback === 'partial' ? 'partial' : 'updated';
        return prevItems.map(item =>
          item.productId === productId
            ? { ...item, cantidad: item.cantidad + allowedIncrease }
            : item
        );
      }

      const newItem: CartItem = {
        id: `${Date.now()}-${productId}-${allowedIncrease}`,
        productId,
        nombre,
        precio,
        cantidad: allowedIncrease,
        imagen,
        sku,
      };
      return [...prevItems, newItem];
    });

    setTimeout(() => {
      switch (feedback) {
        case 'limitReached':
          addNotification({
            type: 'warning',
            title: 'Sin stock disponible',
            message: `No quedan unidades disponibles de ${nombre}.`,
            duration: 3000,
          });
          break;
        case 'partial':
          addNotification({
            type: 'warning',
            title: 'Stock limitado',
            message: `Solo se agregaron ${appliedCantidad} unidad(es) de ${nombre} por stock disponible.`,
            duration: 3000,
          });
          break;
        case 'updated':
          addNotification({
            type: 'success',
            title: 'Producto actualizado',
            message: `Se agregaron ${appliedCantidad} unidad(es) más de ${nombre}.`,
            duration: 3000,
          });
          break;
        default:
          addNotification({
            type: 'success',
            title: '¡Producto agregado!',
            message: `${nombre} se agregó al carrito`,
            duration: 3000,
          });
      }
    }, 0);
  }, [addNotification]);

  const removeItem = useCallback((productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, cantidad: number) => {
    if (cantidad <= 0) {
      removeItem(productId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId
          ? { ...item, cantidad }
          : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(async () => {
    setItems([]);
    setAppliedDiscount(null);
    setDiscountsByProduct({});

    const userId = currentUser && 'uid' in currentUser ? currentUser.uid : null;

    // Eliminar carrito de Firebase si el usuario está autenticado
    if (userId) {
      try {
        const cartRef = doc(db, 'carts', userId);
        await deleteDoc(cartRef);
      } catch (error) {
        console.error('Error clearing cart from Firebase:', error);
      }
    }

    // Limpiar localStorage también
    localStorage.removeItem('cart');
  }, [currentUser]);

  const applyDiscount = useCallback(async (code: string) => {
    if (!code) {
      addNotification({
        type: 'warning',
        title: 'Ingresa un cupón',
        message: 'Escribe el código que quieres aplicar.',
        duration: 3000
      });
      return false;
    }

    if (items.length === 0) {
      addNotification({
        type: 'warning',
        title: 'Carrito vacío',
        message: 'Agrega productos antes de aplicar un cupón.',
        duration: 3000
      });
      return false;
    }

    if (appliedDiscount) {
      addNotification({
        type: 'info',
        title: 'Cupón ya aplicado',
        message: 'Quita el cupón actual antes de ingresar uno nuevo.',
        duration: 3000
      });
      return false;
    }

    if (discountLoading) {
      return false;
    }

    const validation = await validateDiscount(code);

    if (!validation.valido || !validation.descuento) {
      addNotification({
        type: 'error',
        title: 'Cupón inválido',
        message: validation.mensaje || 'Revisa el código e inténtalo nuevamente.',
        duration: 3500
      });
      return false;
    }

    const normalizedDiscount: Discount = {
      ...validation.descuento,
      codigo: normalizeCode(validation.descuento.codigo)
    };

    const discountMap = buildDiscountMap(items, normalizedDiscount);

    if (Object.keys(discountMap).length === 0) {
      addNotification({
        type: 'warning',
        title: 'Cupón sin coincidencias',
        message: 'El código no aplica a los productos de tu carrito.',
        duration: 3500
      });
      return false;
    }

    setAppliedDiscount(normalizedDiscount);
    setDiscountsByProduct(discountMap);

    addNotification({
      type: 'success',
      title: 'Cupón aplicado',
      message: `${normalizedDiscount.codigo} (${formatDiscountLabel(normalizedDiscount)}) activado correctamente.`,
      duration: 3500
    });

    return true;
  }, [addNotification, items, appliedDiscount, discountLoading, validateDiscount, normalizeCode, buildDiscountMap, formatDiscountLabel]);

  const removeDiscount = useCallback(() => {
    if (!appliedDiscount && Object.keys(discountsByProduct).length === 0) {
      return;
    }

    const previousCode = appliedDiscount?.codigo;
    setAppliedDiscount(null);
    setDiscountsByProduct({});

    addNotification({
      type: 'info',
      title: 'Cupón eliminado',
      message: previousCode ? `Se quitó ${previousCode} del carrito.` : 'Se eliminaron los descuentos aplicados.',
      duration: 3000
    });
  }, [appliedDiscount, discountsByProduct, addNotification]);

  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.cantidad, 0);
  }, [items]);

  const getSubtotal = useCallback(() => {
    return items.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  }, [items]);

  const getTotalDiscount = useCallback(() => {
    const total = Object.values(discountsByProduct).reduce((sum, amount) => sum + amount, 0);
    return Math.round(total * 100) / 100;
  }, [discountsByProduct]);

  const getTotalPrice = useCallback(() => {
    const subtotal = getSubtotal();
    const discountTotal = getTotalDiscount();
    const finalAmount = subtotal - discountTotal;
    return finalAmount > 0 ? finalAmount : 0;
  }, [getSubtotal, getTotalDiscount]);

  // Reserve stock during checkout
  const reserveCartStock = useCallback(async (orderId: string) => {
    if (items.length === 0) return false;

    try {
      const stockItems = items.map(item => ({
        productId: item.productId,
        quantity: item.cantidad,
        productName: item.nombre
      }));

      await reserveStock(stockItems, orderId);
      setReservedOrderId(orderId);
      return true;
    } catch (error) {
      console.error('Error reserving cart stock:', error);
      throw error;
    }
  }, [items, reserveStock]);

  // Release reserved stock (if checkout fails)
  const releaseCartStock = useCallback(async () => {
    if (!reservedOrderId || items.length === 0) return false;

    try {
      const stockItems = items.map(item => ({
        productId: item.productId,
        quantity: item.cantidad,
        productName: item.nombre
      }));

      await releaseStock(stockItems, reservedOrderId);
      setReservedOrderId(null);
      return true;
    } catch (error) {
      console.error('Error releasing cart stock:', error);
      throw error;
    }
  }, [items, reservedOrderId, releaseStock]);

  // Confirm sale (convert reservation to confirmed sale)
  const confirmCartSale = useCallback(async () => {
    if (!reservedOrderId) return false;

    try {
      await confirmSale(reservedOrderId);
      setReservedOrderId(null);
      clearCart(); // Clear cart after successful sale
      return true;
    } catch (error) {
      console.error('Error confirming cart sale:', error);
      throw error;
    }
  }, [reservedOrderId, confirmSale, clearCart]);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyDiscount,
    removeDiscount,
    getTotalItems,
    getSubtotal,
    getTotalDiscount,
    getTotalPrice,
    appliedDiscount,
    discountsByProduct,
    discountLoading,
    reserveCartStock,
    releaseCartStock,
    confirmCartSale,
    reservedOrderId,
    stockLoading
  };
}
