'use client';

import { useCallback, useState } from 'react';
import { collection, getDocs, limit, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Discount, DiscountValidation } from '@/types';

type TimestampLike = Timestamp | { toDate: () => Date } | Date | string | number | null | undefined;

const toDate = (value: TimestampLike): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    const date = value.toDate();
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
};

const formatDateValue = (rawValue: TimestampLike): string => {
  const parsed = toDate(rawValue);
  return parsed ? parsed.toISOString() : '';
};

export function useDiscounts() {
  const [loading, setLoading] = useState(false);

  const normalizeCode = useCallback((code: string) => code?.trim().toUpperCase() || '', []);

  const validateDiscount = useCallback(
    async (rawCode: string): Promise<DiscountValidation> => {
      const codigo = normalizeCode(rawCode);
      if (!codigo) {
        return { valido: false, mensaje: 'Ingresa un código válido' };
      }

      setLoading(true);
      try {
        const discountsRef = collection(db, 'discounts');
        const discountQuery = query(discountsRef, where('codigo', '==', codigo), limit(1));
        const snapshot = await getDocs(discountQuery);

        if (snapshot.empty) {
          return { valido: false, mensaje: 'Cupón inexistente' };
        }

        const docSnap = snapshot.docs[0];
        const data = docSnap.data();

        const productosAplicables = Array.isArray(data.productosAplicables)
          ? data.productosAplicables.filter((id: unknown): id is string => typeof id === 'string')
          : [];

        if (!data.activo) {
          return { valido: false, mensaje: 'Este cupón está inactivo' };
        }

        if (!productosAplicables.length) {
          return { valido: false, mensaje: 'Este cupón no tiene productos asignados' };
        }

        const startDate = toDate(data.fechaInicio);
        const endDate = toDate(data.fechaFin);
        const now = new Date();

        if (startDate && now < startDate) {
          return { valido: false, mensaje: 'Este cupón aún no está disponible' };
        }
        if (endDate && now > endDate) {
          return { valido: false, mensaje: 'Este cupón expiró' };
        }

        if (typeof data.descuento !== 'number' || data.descuento <= 0) {
          return { valido: false, mensaje: 'Cupón mal configurado' };
        }

        if (!['porcentaje', 'fijo'].includes(data.tipo)) {
          return { valido: false, mensaje: 'Tipo de descuento inválido' };
        }

        const discount: Discount = {
          id: docSnap.id,
          codigo,
          descripcion: typeof data.descripcion === 'string' ? data.descripcion : undefined,
          descuento: data.descuento,
          tipo: data.tipo,
          productosAplicables,
          fechaInicio: formatDateValue(data.fechaInicio),
          fechaFin: formatDateValue(data.fechaFin),
          activo: Boolean(data.activo),
          createdAt: formatDateValue(data.createdAt),
          updatedAt: formatDateValue(data.updatedAt)
        };

        return { valido: true, mensaje: 'Cupón válido', descuento: discount };
      } catch (error) {
        console.error('Error validating discount:', error);
        return {
          valido: false,
          mensaje: 'Hubo un problema validando el cupón. Inténtalo nuevamente.'
        };
      } finally {
        setLoading(false);
      }
    },
    [normalizeCode]
  );

  const calculateDiscount = useCallback(
    (productId: string, precioOriginal: number, discount?: Discount | null) => {
      if (!discount || !productId || precioOriginal <= 0) {
        return 0;
      }

      if (!discount.productosAplicables.includes(productId)) {
        return 0;
      }

      let amount = 0;
      if (discount.tipo === 'porcentaje') {
        amount = (precioOriginal * discount.descuento) / 100;
      } else {
        amount = discount.descuento;
      }

      if (amount > precioOriginal) {
        amount = precioOriginal;
      }

      return Math.max(0, Math.round(amount * 100) / 100);
    },
    []
  );

  return {
    loading,
    validateDiscount,
    calculateDiscount,
    normalizeCode
  };
}
