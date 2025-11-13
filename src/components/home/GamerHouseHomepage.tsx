'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { useCategories } from '@/hooks/useCategories';
import { ShoppingCart, ArrowRight, Sparkles, Waves, Wand2, Moon, Flame, Grid3x3, Zap, Headphones } from 'lucide-react';
import DynamicBanner from '../DynamicBanner';

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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col group-hover:-translate-y-2 group-hover:border-gamerhouse-red/50">
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
            onClick={() => handleAddToCart(product)}
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
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-white via-blue-50 to-cyan-100 text-gray-900 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-gamerhouse-navy">
              Bienvenido a GAMER HOUSE
            </h1>
            <p className="text-lg sm:text-xl text-gray-700 mb-8">
              Tu tienda especializada en Trading Card Games. Los mejores precios en TCG, accesorios y más.
            </p>
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-gamerhouse-red to-red-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all hover:shadow-lg hover:scale-105 transform"
            >
              Explorar Catálogo
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Dynamic Banner */}
      <DynamicBanner />

      {/* Categories Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gamerhouse-navy mb-2">CATEGORÍAS</h2>
            <div className="h-1 w-20 bg-gamerhouse-red"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {activeCategories.map((category) => {
              const catInfo = CATEGORY_ICONS[category.id] || { Icon: Sparkles, color: 'from-gray-400 to-gray-600' };
              const { Icon } = catInfo;
              return (
                <Link
                  key={category.id}
                  href={`/categoria/${category.id}`}
                  className="group"
                >
                  <div className={`bg-gradient-to-br ${catInfo.color} rounded-lg p-6 h-40 flex flex-col items-center justify-center text-white hover:shadow-lg transition-shadow cursor-pointer relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                    <Icon className="w-12 h-12 mb-2 relative z-10" />
                    <h3 className="font-bold text-center text-sm sm:text-base relative z-10 group-hover:underline">
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
      <section className="py-12 sm:py-16 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gamerhouse-navy mb-2">DESTACADOS</h2>
            <div className="h-1 w-20 bg-gamerhouse-red"></div>
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
