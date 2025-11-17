'use client';

import { useMemo } from 'react';
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
  'pokemon-tcg': { Icon: Sparkles, color: 'from-sky-200 to-cyan-400' },
  'one-piece-tcg': { Icon: Waves, color: 'from-cyan-300 to-sky-500' },
  'star-wars-unlimited': { Icon: Wand2, color: 'from-indigo-200 to-sky-400' },
  'yu-gi-oh': { Icon: Moon, color: 'from-purple-200 to-indigo-400' },
  'dragon-ball': { Icon: Flame, color: 'from-amber-200 to-orange-300' },
  'digimon': { Icon: Grid3x3, color: 'from-rose-200 to-amber-300' },
  'magic-the-gathering': { Icon: Zap, color: 'from-violet-200 to-purple-400' },
  'accesorios': { Icon: Headphones, color: 'from-slate-200 to-slate-400' },
};

export default function GamerHouseHomepage() {
  const { products, loading: productsLoading } = useProducts();
  const { categories } = useCategories();
  const { addItem } = useCart();
  const { mainBannerConfig } = useConfig();
  const shouldRenderMainBanner = Boolean(mainBannerConfig?.active && (mainBannerConfig?.slides?.length ?? 0) > 0);
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
        className="block bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col group-hover:-translate-y-2 group-hover:border-cyan-200"
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
          <h3 className="font-semibold text-slate-800 line-clamp-2 text-sm">
            {product.nombre}
          </h3>

          {/* Pricing */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-sky-700">
                ${product.precio?.toLocaleString() || 'N/D'}
              </span>
              {hasDiscount && (
                <span className="text-sm text-slate-400 line-through">
                  ${product.precioOriginal?.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Stock Info */}
          {product.stock > 0 && (
            <p className="text-xs text-slate-500 font-semibold">
              Stock disponible: {product.stock}
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
                : 'bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-500 hover:brightness-110 hover:shadow-lg hover:scale-105 active:scale-95'
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {shouldRenderMainBanner && (
            <MainBanner
              config={mainBannerConfig}
              onResetFilters={() => router.push('/productos')}
            />
          )}
        </div>
      </section>

      {/* Dynamic Banner */}
      <DynamicBanner />

      {/* Featured Products */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-heading mb-8">
            <span className="section-heading__eyebrow">Selección curada</span>
            <h2 className="section-heading__title text-3xl sm:text-4xl">Destacados</h2>
            <p className="section-heading__description">
              Productos con stock disponible y recomendados por nuestro equipo.
            </p>
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
        <section className="bg-gradient-to-br from-[#e6f9ff] via-[#cbecff] to-[#e3f4ff] text-slate-900 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="section-heading mb-8">
              <span className="section-heading__eyebrow text-slate-500">Bonos temporales</span>
              <h2 className="section-heading__title text-slate-900">Ofertas activas</h2>
              <p className="section-heading__description text-slate-600">
                Descuentos dinámicos para rotar inventario y darle aire a tus colecciones.
              </p>
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
              <Link href="/productos?filter=ofertas" className="btn-solid">
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
