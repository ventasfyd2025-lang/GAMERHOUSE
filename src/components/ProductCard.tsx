'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useUserAuth } from '@/hooks/useUserAuth';
import { useNotification } from '@/context/NotificationContext';

interface ProductCardProps {
  product: Product;
  customHeight?: string;
}

const ProductCard = memo(function ProductCard({ product, customHeight }: ProductCardProps) {
  const { addItem } = useCart();
  const { currentUser, loading } = useUserAuth();
  const { addNotification } = useNotification();
  const router = useRouter();

  // Verificar si las etiquetas están activas basadas en duración
  const isEtiquetaActiva = (timestamp: string | undefined, duracionHoras: number | undefined): boolean => {
    if (!timestamp || !duracionHoras) return false;

    const inicio = new Date(timestamp);
    const ahora = new Date();
    const horasTranscurridas = (ahora.getTime() - inicio.getTime()) / (1000 * 60 * 60);

    return horasTranscurridas < duracionHoras;
  };

  const mostrarNuevo = product.nuevo && isEtiquetaActiva(
    product.nuevoDesde,
    product.nuevoDuracionHoras
  );

  const mostrarOferta = product.oferta && isEtiquetaActiva(
    product.ofertaDesde,
    product.ofertaDuracionHoras
  );

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Verificar si el usuario está logueado
    if (!currentUser && !loading) {
      // Mostrar modal de confirmación para login
      const shouldLogin = window.confirm(
        '¿Deseas iniciar sesión para agregar productos al carrito?\n\n' +
        'Si inicias sesión podrás:\n' +
        '• Guardar tus productos\n' +
        '• Realizar compras más rápido\n' +
        '• Ver el historial de pedidos\n\n' +
        'Presiona OK para ir al login o Cancelar para continuar como invitado.'
      );
      
      if (shouldLogin) {
        router.push('/login');
        return;
      }
      // Si decide continuar como invitado, procede a agregar al carrito
    }
    
    addItem(
      product.id,
      product.nombre || 'Producto',
      product.precio || 0,
      product.imagen || '',
      1,
      product.sku,
    );

    // Show notification using unified system
    addNotification({
      type: 'success',
      title: 'Producto agregado al carrito',
      message: currentUser ? undefined : 'Agregado como invitado',
      duration: 3000
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  // Get price and original price
  const currentPrice = product.precio || 0;
  const originalPrice = product.precioOriginal || (product.oferta ? Math.round(currentPrice * 1.3) : null);

  const cardHeightClass = customHeight || 'h-full';
  const discountPercentage = originalPrice
    ? Math.max(0, Math.round(((originalPrice - currentPrice) / originalPrice) * 100))
    : null;

  return (
    <Link href={`/producto/${product.id}`} className="block h-full group">
      <div
        className={`relative ${cardHeightClass} rounded-[28px] bg-gradient-to-br from-yellow-300/40 via-amber-300/20 to-red-500/30 p-[1.5px] transition-transform duration-500 hover:scale-[1.015] hover:shadow-[0_35px_110px_-45px_rgba(255,232,141,0.9)]`}
      >
        <div className="product-card-web h-full overflow-hidden flex flex-col">
          <div className="relative aspect-[4/3] overflow-hidden">
            {product.imagen ? (
              <Image
                src={product.imagen}
                alt={product.nombre || 'Producto'}
                fill
                className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-900/80">
                <span className="text-4xl text-white/50">📦</span>
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05070d]/95 via-transparent to-transparent opacity-90 mix-blend-soft-light" />

            {mostrarOferta && (
              <span className="product-badge left-4 right-auto bg-gradient-to-r from-red-500 to-red-600 text-white">
                Oferta
              </span>
            )}

            {mostrarNuevo && (
              <span className="product-badge">
                Nuevo
              </span>
            )}

            {product.stock === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                <span className="rounded-full border border-yellow-300/50 bg-yellow-300/20 px-4 py-1 text-sm font-semibold text-yellow-100 uppercase tracking-[0.2em]">
                  Agotado
                </span>
              </div>
            )}

            {product.stock > 0 && (
              <span className="absolute left-4 bottom-4 inline-flex items-center gap-2 rounded-full border border-yellow-300/35 bg-yellow-300/10 px-3 py-1 text-xs font-semibold text-yellow-100 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-yellow-200 shadow-[0_0_12px_rgba(255,232,141,0.85)]" />
                Stock: {product.stock}
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-3 p-5">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-white/45">
              <span>Serie gamer</span>
              <span className="text-yellow-300">
                {mostrarNuevo ? 'Legendary' : mostrarOferta ? 'Rare' : 'Base'}
              </span>
            </div>
            <div className="divider-neon" />

            <h3 className="product-title group-hover:text-white">
              {product.nombre || 'Producto sin nombre'}
            </h3>

            {product.descripcion && (
              <p className="hidden text-sm text-white/55 line-clamp-2 lg:block">
                {product.descripcion}
              </p>
            )}

            <div className="mt-auto space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="product-price">
                  {formatPrice(currentPrice)}
                </span>
                {originalPrice && (
                  <span className="text-xs text-white/40 line-through">
                    {formatPrice(originalPrice)}
                  </span>
                )}
              </div>

              {discountPercentage && (
                <span className="inline-flex items-center gap-1 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-yellow-200">
                  {discountPercentage}% OFF
                </span>
              )}

              {product.stock > 0 && product.stock <= 5 && (
                <p className="text-xs font-medium text-yellow-200/80">
                  Quedan {product.stock} unidades
                </p>
              )}

              {product.stock > 0 ? (
                <button
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleAddToCart(event);
                  }}
                  className="btn-primary-web w-full justify-center text-xs sm:text-sm py-2.5"
                >
                  Agregar al carrito
                </button>
              ) : (
                <button
                  disabled
                  className="pagination-button w-full cursor-not-allowed border-yellow-300/20 text-xs font-semibold uppercase tracking-[0.2em] text-yellow-200"
                >
                  No disponible
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
});

export default ProductCard;
