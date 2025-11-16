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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {mainBannerConfig?.active && mainBannerConfig.slides?.length ? (
            <MainBanner
              config={mainBannerConfig}
              onResetFilters={() => router.push('/productos')}
            />
          ) : (
            <div className="surface-card relative overflow-hidden p-10 sm:p-12">
              <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_10%_20%,rgba(236,72,153,0.12),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(248,181,0,0.25),transparent_55%)]" />
              <div className="relative z-10 grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
                <div className="section-heading">
                  <span className="section-heading__eyebrow">Gaming & collectibles</span>
                  <h1 className="section-heading__title">Bienvenido a GAMER HOUSE</h1>
                  <p className="section-heading__description">
                    Curamos lanzamientos oficiales y pre-orders de Pokémon, One Piece, Yu-Gi-Oh! y más. Compra seguro con envíos a todo Chile.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href="/productos" className="btn-solid">
                      Explorar catálogo
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                    <Link href="/contacto" className="btn-soft">
                      Hablar con un asesor
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="stat-pill">
                    <span>Productos activos</span>
                    <strong>+{products.length || 0}</strong>
                  </div>
                  <div className="stat-pill">
                    <span>Pre-venta</span>
                    <strong>{products.filter((p) => p.nuevo).length || 0}</strong>
                  </div>
                  <div className="stat-pill">
                    <span>Ofertas vivas</span>
                    <strong>{products.filter((p) => p.oferta).length || 0}</strong>
                  </div>
                  <div className="stat-pill">
                    <span>Marcas</span>
                    <strong>{activeCategories.length}</strong>
                  </div>
                </div>
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
          <div className="section-heading mb-8">
            <span className="section-heading__eyebrow">Explora por categoría</span>
            <h2 className="section-heading__title text-3xl sm:text-4xl">Categorías estrella</h2>
            <p className="section-heading__description">
              Curadas según lanzamientos recientes y colecciones populares de la comunidad.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {activeCategories.map((category) => {
              const catInfo = CATEGORY_ICONS[category.id] || { Icon: Sparkles, color: 'from-gray-400 to-gray-600' };
              const { Icon } = catInfo;
              return (
                <Link key={category.id} href={`/categoria/${category.id}`} className="group">
                  <div className="surface-card relative h-40 overflow-hidden p-6 transition hover:-translate-y-1">
                    <div className={`absolute inset-0 opacity-70 bg-gradient-to-br ${catInfo.color}`} />
                    <div className="relative z-10 flex h-full flex-col items-start justify-between text-white">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                        <Icon className="h-6 w-6" />
                      </span>
                      <h3 className="text-lg font-semibold">
                        {category.name || category.id}
                      </h3>
                    </div>
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
        <section className="bg-gradient-to-br from-[#0f172a] via-[#1f2035] to-[#241926] text-white py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="section-heading mb-8">
              <span className="section-heading__eyebrow text-yellow-200">Bonos temporales</span>
              <h2 className="section-heading__title text-white">Ofertas activas</h2>
              <p className="section-heading__description text-white/80">
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
