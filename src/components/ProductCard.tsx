'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useUserAuth } from '@/hooks/useUserAuth';
import { useNotification } from '@/context/NotificationContext';
import { useTheme } from '@/context/ThemeContext';

interface ProductCardProps {
  product: Product;
  customHeight?: string;
}

const ProductCard = memo(function ProductCard({ product, customHeight }: ProductCardProps) {
  const { addItem } = useCart();
  const { currentUser, loading } = useUserAuth();
  const { addNotification } = useNotification();
  const { theme } = useTheme();
  const router = useRouter();

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

    if (!currentUser && !loading) {
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
    }

    addItem(
      product.id,
      product.nombre || 'Producto',
      product.precio || 0,
      product.imagen || '',
      1,
      product.sku,
    );

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

  const currentPrice = product.precio || 0;
  const originalPrice = product.precioOriginal || (product.oferta ? Math.round(currentPrice * 1.3) : null);

  const cardHeightClass = customHeight || 'h-full';
  const discountPercentage = originalPrice
    ? Math.max(0, Math.round(((originalPrice - currentPrice) / originalPrice) * 100))
    : null;

  // Theme-based styles
  const isDark = theme === 'dark';

  const cardBgGradient = isDark
    ? 'from-yellow-300/40 via-amber-300/20 to-red-500/30'
    : 'from-gray-100 via-gray-50 to-white';

  const cardBorder = isDark
    ? 'border-yellow-300/25'
    : 'border-gray-200';

  const cardHoverShadow = isDark
    ? 'hover:shadow-[0_35px_110px_-45px_rgba(255,232,141,0.9)]'
    : 'hover:shadow-xl hover:border-gamerhouse-red/50';

  const overlayGradient = isDark
    ? 'from-[#05070d]/95'
    : 'from-white/80';

  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const textMutedColor = isDark ? 'text-white/55' : 'text-gray-600';
  const badgeBg = isDark
    ? 'border-yellow-300/35 bg-yellow-300/10 text-yellow-100'
    : 'border-red-300/30 bg-red-50 text-red-700';

  const buttonClass = isDark
    ? 'btn-primary-web'
    : 'bg-gradient-to-r from-gamerhouse-red to-red-700 text-white hover:from-red-700 hover:to-red-800';

  return (
    <Link href={`/producto/${product.id}`} className="block h-full group">
      <div
        className={`relative ${cardHeightClass} rounded-[16px] md:rounded-[28px] bg-gradient-to-br ${cardBgGradient} border ${cardBorder} p-[1.5px] transition-transform duration-500 hover:scale-[1.015] ${cardHoverShadow}`}
      >
        <div className={`h-full overflow-hidden flex flex-col ${isDark ? 'product-card-web' : 'bg-white rounded-[15px] md:rounded-[27px]'}`}>
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
              <div className={`flex h-full w-full items-center justify-center ${isDark ? 'bg-slate-900/80' : 'bg-gray-200'}`}>
                <span className="text-4xl">{isDark ? '📦' : '🛍️'}</span>
              </div>
            )}

            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-t ${overlayGradient} via-transparent to-transparent opacity-90 mix-blend-soft-light`} />

            {mostrarOferta && (
              <span className={`product-badge left-4 right-auto ${isDark ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' : 'bg-red-500 text-white'}`}>
                Oferta
              </span>
            )}

            {mostrarNuevo && (
              <span className={`product-badge ${isDark ? '' : 'bg-yellow-400 text-gray-900'}`}>
                Nuevo
              </span>
            )}

            {product.stock === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                <span className={`rounded-full border ${isDark ? 'border-yellow-300/50 bg-yellow-300/20 text-yellow-100' : 'border-gray-400 bg-gray-100 text-gray-700'} px-4 py-1 text-sm font-semibold uppercase tracking-[0.2em]`}>
                  Agotado
                </span>
              </div>
            )}

            {product.stock > 0 && (
              <span className={`absolute left-4 bottom-4 inline-flex items-center gap-2 rounded-full border ${isDark ? 'border-yellow-300/35 bg-yellow-300/10 text-yellow-100' : 'border-red-300/35 bg-red-50 text-red-700'} px-3 py-1 text-xs font-semibold backdrop-blur-md`}>
                <span className={`h-2 w-2 rounded-full ${isDark ? 'bg-yellow-200 shadow-[0_0_12px_rgba(255,232,141,0.85)]' : 'bg-red-500'}`} />
                Stock: {product.stock}
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-3 p-4 md:p-5">
            <div className={`flex items-center justify-between text-[10px] uppercase tracking-[0.35em] ${isDark ? 'text-white/45' : 'text-gray-500'}`}>
              <span>Serie gamer</span>
              <span className={isDark ? 'text-yellow-300' : 'text-gamerhouse-red'}>
                {mostrarNuevo ? 'Legendary' : mostrarOferta ? 'Rare' : 'Base'}
              </span>
            </div>
            <div className={isDark ? 'divider-neon' : 'h-px bg-gray-200'} />

            <h3 className={`product-title ${textColor} ${isDark ? 'group-hover:text-white' : 'group-hover:text-gamerhouse-red'}`}>
              {product.nombre || 'Producto sin nombre'}
            </h3>

            {product.descripcion && (
              <p className={`hidden text-sm ${textMutedColor} line-clamp-2 lg:block`}>
                {product.descripcion}
              </p>
            )}

            <div className="mt-auto space-y-2">
              <div className="flex items-baseline gap-2">
                <span className={`product-price ${isDark ? '' : 'text-gamerhouse-red'}`}>
                  {formatPrice(currentPrice)}
                </span>
                {originalPrice && (
                  <span className={`text-xs line-through ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                    {formatPrice(originalPrice)}
                  </span>
                )}
              </div>

              {discountPercentage && (
                <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] ${badgeBg}`}>
                  {discountPercentage}% OFF
                </span>
              )}

              {product.stock > 0 && product.stock <= 5 && (
                <p className={`text-xs font-medium ${isDark ? 'text-yellow-200/80' : 'text-red-600'}`}>
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
                  className={`${buttonClass} w-full justify-center text-xs sm:text-sm py-2.5 rounded-lg font-semibold transition-all`}
                >
                  Agregar al carrito
                </button>
              ) : (
                <button
                  disabled
                  className={`pagination-button w-full cursor-not-allowed text-xs font-semibold uppercase tracking-[0.2em] ${isDark ? 'border-yellow-300/20 text-yellow-200' : 'border-gray-300 text-gray-500'}`}
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
