'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { useCategories } from '@/hooks/useCategories';
import { ShoppingCart, Zap, ArrowUpRight, Menu, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { productMatchesCategory, productMatchesSubcategory } from '@/utils/category';
import { useConfig } from '@/hooks/useConfig';
import { getPaginationRange } from '@/lib/pagination';
import MainBanner from '@/components/home/MainBanner';

const ITEMS_PER_PAGE = 20;

// TCG Categories for featured sections
const TCG_CATEGORIES = [
  { id: 'pokemon-tcg', name: 'Pokémon TCG', emoji: '🎴', color: 'from-yellow-400 to-red-500' },
  { id: 'one-piece-tcg', name: 'One Piece TCG', emoji: '⛵', color: 'from-blue-400 to-red-500' },
  { id: 'star-wars-unlimited', name: 'Star Wars Unlimited', emoji: '⚔️', color: 'from-blue-600 to-yellow-600' },
  { id: 'yu-gi-oh', name: 'Yu-Gi-Oh!', emoji: '🌙', color: 'from-purple-500 to-blue-600' },
  { id: 'dragon-ball', name: 'Dragon Ball', emoji: '🔵', color: 'from-orange-400 to-red-500' },
  { id: 'digimon', name: 'Digimon', emoji: '🟥', color: 'from-red-500 to-pink-600' },
  { id: 'magic-the-gathering', name: 'Magic The Gathering', emoji: '✨', color: 'from-indigo-600 to-purple-800' },
  { id: 'mitos-y-leyendas', name: 'Mitos y Leyendas', emoji: '🏛️', color: 'from-amber-600 to-orange-700' },
];

export default function HunterCardHomepage() {
  const searchParams = useSearchParams();
  const { products, loading: productsLoading } = useProducts();
  const { categories } = useCategories();
  const { addItem } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeSinglesTab, setActiveSinglesTab] = useState(0);
  const { mainBannerConfig } = useConfig();

  const heroSlide = useMemo(() => {
    if (!mainBannerConfig?.active) return undefined;
    return mainBannerConfig.slides?.find(slide => slide.imageUrl) ?? mainBannerConfig.slides?.[0];
  }, [mainBannerConfig]);

  const categoryParam = searchParams.get('category') || 'all';
  const searchParam = searchParams.get('search') || '';
  const subcategoryParam = searchParams.get('subcategory') || '';

  useEffect(() => {
    setSelectedCategory(categoryParam);
    setSearchQuery(searchParam);
    setSelectedSubcategory(subcategoryParam);
  }, [categoryParam, searchParam, subcategoryParam]);

  // Get products for a specific category (used in Singles sections)
  const getProductsByCategory = (categoryId: string) => {
    return products
      .filter(product => (product.stock || 0) > 0)
      .filter(product => {
        if (categoryId === 'all') return true;
        // Match category by name
        const productCategory = product.categoria?.toLowerCase() || '';
        const catName = categoryId.toLowerCase();
        return productCategory.includes(catName) || catName.includes(productCategory);
      })
      .slice(0, 4);
  };

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
    const precio = product.precio;
    const precioOriginal = product.precioOriginal;
    const descuento =
      precioOriginal && precio && precioOriginal > precio
        ? Math.round(((precioOriginal - precio) / precioOriginal) * 100)
        : 0;

    return (
      <Link href={`/producto/${product.id}`} className="block h-full group">
        <div className="relative h-full rounded-[28px] bg-gradient-to-br from-yellow-300/40 via-amber-300/20 to-red-500/30 p-[1.5px] transition-transform duration-500 group-hover:scale-[1.015] group-hover:shadow-[0_35px_110px_-45px_rgba(255,232,141,0.9)]">
          <div className="product-card-web h-full overflow-hidden">
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={product.imagenes?.[0] || product.imagen || '/placeholder.png'}
                alt={product.nombre}
                fill
                className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05070d]/95 via-transparent to-transparent opacity-90 mix-blend-soft-light" />
              {descuento > 0 && (
                <span className="product-badge">
                  -{descuento}%
                </span>
              )}
              <span className="absolute left-4 bottom-4 inline-flex items-center gap-2 rounded-full border border-yellow-300/35 bg-yellow-300/10 px-3 py-1 text-xs font-semibold text-yellow-100 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-yellow-200 shadow-[0_0_12px_rgba(255,232,141,0.85)]" />
                Stock: {product.stock}
              </span>
            </div>

            <div className="flex h-full flex-col gap-3 p-5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-white/45">
                <span>TCG Card</span>
                <span className="text-yellow-300">{descuento > 0 ? 'Oferta' : 'Regular'}</span>
              </div>
              <div className="divider-neon" />
              <h3 className="product-title group-hover:text-white line-clamp-2">
                {product.nombre}
              </h3>

              {product.descripcion && (
                <p className="hidden text-sm text-white/55 line-clamp-2 lg:block">
                  {product.descripcion}
                </p>
              )}

              <div className="mt-auto space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="product-price">
                    ${precio?.toLocaleString() || 'N/D'}
                  </span>
                  {precioOriginal && precio && precioOriginal > precio && (
                    <span className="text-xs sm:text-sm text-white/40 line-through">
                      ${precioOriginal.toLocaleString()}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleAddToCart(product);
                  }}
                  className="btn-primary-web w-full justify-center text-xs sm:text-sm py-2.5 sm:py-3"
                >
                  <ShoppingCart size={18} />
                  <span className="hidden sm:inline">Agregar</span>
                  <span className="sm:hidden">+</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="relative min-h-screen pb-24 text-white">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(255,232,141,0.09),transparent_45%),radial-gradient(circle_at_88%_8%,rgba(231,68,68,0.12),transparent_55%)]" />
        <div className="absolute inset-x-0 top-1/3 h-96 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_65%)] blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16 lg:space-y-20">
        {/* Main Banner */}
        <MainBanner
          config={mainBannerConfig}
          onResetFilters={() => {
            setSelectedCategory('all');
            setSelectedSubcategory('');
            setExpandedCategory(null);
          }}
        />

        {/* Featured Categories Grid */}
        <section className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-yellow-300" />
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Nuestros Juegos TCG
              </h2>
            </div>
            <div className="divider-neon w-20" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TCG_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/categoria/${cat.id}`}
                className="group relative h-32 rounded-2xl overflow-hidden cursor-pointer"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-60 group-hover:opacity-75 transition-opacity`} />
                <div className="absolute inset-0 bg-slate-950/40" />
                <div className="relative h-full flex items-center justify-between px-6">
                  <div>
                    <span className="text-4xl mb-2">{cat.emoji}</span>
                    <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-yellow-300 transition-colors">
                      {cat.name}
                    </h3>
                  </div>
                  <ChevronRight className="h-6 w-6 text-white/60 group-hover:text-white transition-all group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Últimas Novedades */}
        <section className="space-y-8 rounded-3xl border border-yellow-300/15 bg-[#05070f]/70 p-6 sm:p-8 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-yellow-300" />
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-white">
                Últimas Novedades
              </h2>
              <p className="text-sm text-white/55">
                Los productos más recientes en HunterCard TCG
              </p>
            </div>
          </div>

          {productsLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="card-dark text-center text-white/65">
                Cargando productos...
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              {products
                .filter(p => (p.stock || 0) > 0)
                .slice(0, 4)
                .map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
            </div>
          )}

          <Link
            href="/productos"
            className="inline-flex items-center gap-2 text-yellow-300 hover:text-yellow-200 font-semibold transition-colors"
          >
            Ver todos los productos
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </section>

        {/* Singles por Categoría - Tabs */}
        <section className="space-y-8 rounded-3xl border border-yellow-300/15 bg-[#05070f]/70 p-6 sm:p-8 backdrop-blur-xl">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
              Singles Destacados
            </h2>
            <p className="text-sm text-white/55">
              Cartas individuales de nuestras categorías principales
            </p>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto gap-2 pb-4 -mx-6 px-6 sm:pb-0 sm:mx-0 sm:px-0 sm:flex-wrap">
            {TCG_CATEGORIES.slice(0, 6).map((cat, idx) => (
              <button
                key={cat.id}
                onClick={() => setActiveSinglesTab(idx)}
                className={`chip-option whitespace-nowrap ${
                  activeSinglesTab === idx ? 'chip-option-active' : ''
                }`}
              >
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {getProductsByCategory(TCG_CATEGORIES[activeSinglesTab].id).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <Link
            href={`/categoria/${TCG_CATEGORIES[activeSinglesTab].id}`}
            className="inline-flex items-center gap-2 text-yellow-300 hover:text-yellow-200 font-semibold transition-colors"
          >
            Ver todos los {TCG_CATEGORIES[activeSinglesTab].name}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </section>

        {/* Ofertas Especiales */}
        <section className="space-y-8 rounded-3xl border border-yellow-300/15 bg-gradient-to-br from-red-900/20 via-[#05070f]/70 to-[#05070f]/70 p-6 sm:p-8 backdrop-blur-xl ring-1 ring-red-500/20">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🔥</span>
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-white">
                Remate Final 2025
              </h2>
              <p className="text-sm text-white/55">
                Descuentos especiales en artículos seleccionados
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {products
              .filter(p => (p.stock || 0) > 0 && p.precioOriginal && p.precioOriginal > p.precio)
              .slice(0, 4)
              .map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
          </div>

          <Link
            href="/?discount=true"
            className="inline-flex items-center gap-2 text-yellow-300 hover:text-yellow-200 font-semibold transition-colors"
          >
            Ver todas las ofertas
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </section>

        {/* Info Footer Section */}
        <section className="hero-section overflow-hidden ring-1 ring-inset ring-yellow-300/15">
          <div className="hero-bg opacity-60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,232,141,0.12),transparent_65%)]" />
          <div className="relative px-6 sm:px-10 lg:px-16 py-12 sm:py-16 lg:py-20 text-center space-y-6">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white">
              La mejor tienda de TCG en Chile
            </h3>
            <p className="mx-auto max-w-2xl text-sm sm:text-base text-white/70">
              Descubre nuestra amplia selección de Trading Card Games. Con ubicaciones en Santiago Centro y Las Condes, ofrecemos los mejores precios y atención personalizada.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <Link
                href="/productos"
                className="btn-primary-web w-full sm:w-auto justify-center text-sm sm:text-base"
              >
                Explorar catálogo
              </Link>
              <Link
                href="/contacto"
                className="btn-secondary-web w-full sm:w-auto justify-center text-sm sm:text-base"
              >
                Contactar
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
