'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { useCategories } from '@/hooks/useCategories';
import { useConfig } from '@/hooks/useConfig';
import { ShoppingCart, ArrowRight, Sparkles, Waves, Wand2, Moon, Flame, Grid3x3, Zap, Headphones } from 'lucide-react';
import DynamicBanner from '../DynamicBanner';
import MainBanner from './MainBanner';

interface CategoryIcon {
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const CATEGORY_ICONS: Record<string, CategoryIcon> = {
  'pokemon-tcg': { Icon: Sparkles, color: 'from-yellow-400 to-red-500' },
  'one-piece-tcg': { Icon: Waves, color: 'from-blue-400 to-red-500' },
  'star-wars-unlimited': { Icon: Wand2, color: 'from-blue-600 to-yellow-600' },
  'yu-gi-oh': { Icon: Moon, color: 'from-purple-500 to-blue-600' },
  'dragon-ball': { Icon: Flame, color: 'from-orange-400 to-red-500' },
  'digimon': { Icon: Grid3x3, color: 'from-red-500 to-pink-600' },
  'magic-the-gathering': { Icon: Zap, color: 'from-indigo-600 to-purple-800' },
  'accesorios': { Icon: Headphones, color: 'from-gray-500 to-gray-700' },
};

export default function GamerHouseHomepage() {
  const { products, loading: productsLoading } = useProducts();
  const { categories } = useCategories();
  const { addItem } = useCart();
  const { mainBannerConfig } = useConfig();
  const router = useRouter();

  const activeCategories = useMemo(
    () => categories.filter(cat => cat.active !== false).slice(0, 8),
    [categories]
  );

  const handleAddToCart = (product: any) => {
    addItem(
      product.id,
      product.nombre,
      product.precio,
      product.imagenes?.[0] || product.imagen || '/placeholder.png',
      1,
      product.sku
    );
  };

  const ProductCard = ({ product }: { product: any }) => {
    const hasDiscount = product.precioOriginal && product.precioOriginal > product.precio;
    const discountPercent = hasDiscount
      ? Math.round(((product.precioOriginal - product.precio) / product.precioOriginal) * 100)
      : 0;

    return (
      <Link
        href={`/producto/${product.id}`}
        className="block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col group-hover:-translate-y-2 group-hover:border-gamerhouse-red/50"
      >
        {/* Image */}
        <div className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          <Image
            src={product.imagenes?.[0] || product.imagen || '/placeholder.png'}
            alt={product.nombre}
            fill
            className="object-cover group-hover:scale-110 transition-transform"
          />
          {hasDiscount && (
            <div className="absolute top-2 right-2 bg-gamerhouse-red text-white px-3 py-1 rounded-full text-sm font-bold">
              -{discountPercent}%
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold">AGOTADO</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3 p-4 flex-1">
          <h3 className="font-semibold text-gray-800 line-clamp-2 text-sm">
            {product.nombre}
          </h3>

          {/* Pricing */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-gamerhouse-red">
                ${product.precio?.toLocaleString() || 'N/D'}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-400 line-through">
                  ${product.precioOriginal?.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Stock Info */}
          {product.stock > 0 && (
            <p className="text-xs text-gamerhouse-navy font-semibold">
              📦 Stock: {product.stock}
            </p>
          )}

          {/* Button */}
          <button
            onClick={(event) => {
              event.preventDefault();
              handleAddToCart(product);
            }}
            disabled={product.stock === 0}
            className={`mt-auto w-full py-2 px-3 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 text-sm transform ${
              product.stock === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-gamerhouse-red to-red-700 hover:from-red-700 hover:to-red-800 hover:shadow-lg hover:scale-105 active:scale-95'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            Comprar
          </button>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--surface-alt)]">
      {/* Hero or Configurable Banner */}
      <section className="py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {mainBannerConfig?.active && mainBannerConfig.slides?.length ? (
            <MainBanner
              config={mainBannerConfig}
              onResetFilters={() => router.push('/productos')}
            />
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-[0_45px_120px_-60px_rgba(15,23,42,0.4)]">
              <div className="max-w-2xl space-y-4">
                <span className="eyebrow-text">Gaming & collectibles</span>
                <h1 className="text-4xl sm:text-5xl font-bold text-slate-900">
                  Bienvenido a GAMER HOUSE
                </h1>
                <p className="text-lg sm:text-xl text-slate-600">
                  Tu tienda especializada en Trading Card Games. Los mejores precios en TCG, accesorios y más.
                </p>
                <Link
                  href="/productos"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-500 to-red-600 px-8 py-3 font-semibold text-white shadow-[0_30px_70px_-45px_rgba(220,38,38,0.8)] transition hover:-translate-y-0.5"
                >
                  Explorar Catálogo
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Dynamic Banner */}
      <DynamicBanner />

      {/* Categories Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <span className="eyebrow-text">Explora por categoría</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900">CATEGORÍAS</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {activeCategories.map((category) => {
              const catInfo = CATEGORY_ICONS[category.id] || { Icon: Sparkles, color: 'from-gray-400 to-gray-600' };
              const { Icon } = catInfo;
              return (
                <Link key={category.id} href={`/categoria/${category.id}`} className="group">
                  <div className={`relative rounded-2xl p-6 h-40 flex flex-col items-center justify-center text-white overflow-hidden shadow-[0_35px_85px_-55px_rgba(15,23,42,0.7)] bg-gradient-to-br ${catInfo.color}`}>
                    <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/20" />
                    <Icon className="w-12 h-12 mb-2 relative z-10" />
                    <h3 className="font-bold text-center text-sm sm:text-base relative z-10">
                      {category.name || category.id}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <span className="eyebrow-text">Selección curada</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900">DESTACADOS</h2>
          </div>

          {productsLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Cargando productos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products
                .filter(p => (p.stock || 0) > 0)
                .slice(0, 8)
                .map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
            </div>
          )}
        </div>
      </section>

      {/* Offers Section */}
      {products.some(p => p.precioOriginal && p.precioOriginal > p.precio) && (
        <section className="bg-gamerhouse-red text-white py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold mb-2">¡OFERTAS!</h2>
              <div className="h-1 w-20 bg-gamerhouse-gold"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products
                .filter(p => (p.stock || 0) > 0 && p.precioOriginal && p.precioOriginal > p.precio)
                .slice(0, 4)
                .map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
            </div>

            <div className="text-center mt-8">
              <Link
                href="/productos"
                className="inline-flex items-center gap-2 bg-gamerhouse-gold text-gamerhouse-navy px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
              >
                Ver todas las ofertas
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
