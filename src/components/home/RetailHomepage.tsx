'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { useCategories } from '@/hooks/useCategories';
import { ShoppingCart, Zap, Sparkles, ArrowUpRight } from 'lucide-react';
import { getProductCategoryCandidates } from '@/utils/category';

export default function RetailHomepage() {
  const searchParams = useSearchParams();
  const { products, loading: productsLoading } = useProducts();
  const { categories } = useCategories();
  const { addItem } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categoryParam = searchParams.get('category') || 'all';
  const searchParam = searchParams.get('search') || '';

  useEffect(() => {
    setSelectedCategory(categoryParam);
    setSearchQuery(searchParam);
  }, [categoryParam, searchParam]);

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => (product.stock || 0) > 0);

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(product => {
        const cats = getProductCategoryCandidates(product);
        return cats.some(category =>
          category.toLowerCase().includes(selectedCategory.toLowerCase())
        );
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.nombre?.toLowerCase().includes(query) ||
        product.descripcion?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, selectedCategory, searchQuery]);

  const featuredProducts = useMemo(
    () => filteredProducts.slice(0, 4),
    [filteredProducts]
  );

  const bestSellers = useMemo(
    () => filteredProducts.slice(4, 8),
    [filteredProducts]
  );

  const activeCategoryLabel = useMemo(() => {
    if (selectedCategory === 'all') {
      return 'Todos los productos';
    }

    const match = categories.find(cat => cat.id === selectedCategory);
    return match?.name ?? selectedCategory;
  }, [selectedCategory, categories]);

  const handleAddToCart = (product: any) => {
    addItem(
      product.id,
      product.nombre,
      product.precioRebajado || product.precioNormal || product.precio,
      product.imagenes?.[0] || product.imagen || '/placeholder.png',
      1,
      product.sku
    );
  };

  const ProductCard = ({ product }: { product: any }) => {
    const precio = product.precioRebajado || product.precioNormal || product.precio;
    const precioOriginal = product.precioNormal || product.precio;
    const descuento =
      precioOriginal && precio
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
                <span>Serie gamer</span>
                <span className="text-yellow-300">{descuento > 0 ? 'Rare' : 'Base'}</span>
              </div>
            <div className="divider-neon" />
            <h3 className="product-title group-hover:text-white">
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
                <span className="hidden sm:inline">Agregar al carrito</span>
                <span className="sm:hidden">Agregar</span>
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
        <section className="hero-section overflow-hidden ring-1 ring-inset ring-yellow-300/20">
          <div className="hero-bg" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_0%,rgba(255,232,141,0.12),transparent_55%)] opacity-80" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,232,141,0.08)_0%,rgba(255,232,141,0)_55%)]" />

          <div className="relative px-6 sm:px-10 lg:px-16 py-12 sm:py-16 lg:py-20">
            <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
              <div className="flex-1 space-y-7">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="tag-legendary">Temporada 2025</span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/35 bg-yellow-300/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-yellow-100">
                    <Sparkles className="h-3.5 w-3.5" />
                    Coleccionables
                  </span>
                </div>

                <h1 className="hero-title text-balance">
                  Potencia tu setup y tu {''}
                  <span className="gradient-text-primary"> colección épica</span>
                </h1>

                <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-white/75">
                  Inspirados en cartas legendarias de Pokémon y Magic, combinamos hardware competitivo, boosters exclusivos y accesorios RGB para que cada partida se sienta única.
                </p>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className="btn-primary-web w-full sm:w-auto justify-center text-sm sm:text-base"
                  >
                    Ver mazo completo
                  </button>
                  <Link
                    href="/productos"
                    className="btn-secondary-web w-full sm:w-auto justify-center text-sm sm:text-base"
                  >
                    Buscar reliquias
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-6 text-xs text-white/70 sm:grid-cols-3 sm:text-sm">
                  <div className="flex items-center gap-3 rounded-2xl border border-yellow-300/15 bg-white/5 px-4 py-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-300 shadow-[0_0_14px_rgba(255,232,141,0.85)]" />
                    Envíos express a todo Chile
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-yellow-300/15 bg-white/5 px-4 py-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.7)]" />
                    Curaduría coleccionista
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-yellow-300/15 bg-white/5 px-4 py-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400 shadow-[0_0_14px_rgba(231,68,68,0.7)]" />
                    Soporte gamer 24/7
                  </div>
                </div>
              </div>

              <div className="flex-1 lg:max-w-sm">
                <div className="collectible-card">
                  <div className="collectible-card__inner space-y-6">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-white/45">
                      <span>Rare drop</span>
                      <span className="text-yellow-200">Semana 07</span>
                    </div>
                    <div className="divider-neon" />
                    <div className="space-y-4 text-sm text-white/70">
                      <div className="flex items-start gap-3">
                        <Zap className="mt-0.5 h-5 w-5 text-yellow-300" />
                        <div>
                          <p className="font-semibold text-white">Starter decks temáticos</p>
                          <p className="text-xs text-white/60">Bundles con boosters Pokémon, Magic y accesorios de protección premium.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Sparkles className="mt-0.5 h-5 w-5 text-yellow-200" />
                        <div>
                          <p className="font-semibold text-white">Hardware edición especial</p>
                          <p className="text-xs text-white/60">Teclados y controles con motivos neon y keycaps coleccionables.</p>
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/ofertas"
                      className="btn-outline-web justify-center text-sm"
                    >
                      Explorar drops activos
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-3xl border border-yellow-300/15 bg-[#05070f]/70 p-6 sm:p-8 backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-yellow-200/70">
                Categorías
              </p>
              <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
                Explora por categoría
              </h2>
              <div className="divider-neon w-20" />
            </div>
            <p className="text-sm text-white/55">Viendo: {activeCategoryLabel}</p>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-1 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`chip-option ${selectedCategory === 'all' ? 'chip-option-active' : ''} shrink-0`}
            >
              🏠 Todos
            </button>
            {categories.map(
              cat =>
                cat.id !== 'all' && (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`chip-option ${selectedCategory === cat.id ? 'chip-option-active' : ''} shrink-0`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    {cat.name}
                  </button>
                )
            )}
          </div>
        </section>

        {featuredProducts.length > 0 && (
          <section className="space-y-8 rounded-3xl border border-yellow-300/15 bg-[#05070f]/70 p-6 sm:p-8 backdrop-blur-xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-300/15">
                  <Zap className="h-5 w-5 text-yellow-300" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-white">
                    Destacados
                  </h2>
                  <p className="text-sm text-white/55">
                    Selección curada por la comunidad gamer.
                  </p>
                </div>
              </div>
              <Link
                href="/ofertas"
                className="text-sm font-semibold text-yellow-200 transition-colors hover:text-yellow-100"
              >
                Ver todas las ofertas
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {bestSellers.length > 0 && (
          <section className="space-y-8 rounded-3xl border border-yellow-300/15 bg-[#05070f]/70 p-6 sm:p-8 backdrop-blur-xl">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-semibold text-white">
                Los más vendidos
              </h2>
              <p className="text-sm text-white/55">
                Los favoritos de nuestros clientes en las últimas semanas.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              {bestSellers.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-8 rounded-3xl border border-yellow-300/15 bg-[#05070f]/70 p-6 sm:p-8 backdrop-blur-xl">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
              {searchQuery ? `Resultados para “${searchQuery}”` : 'Catálogo completo'}
            </h2>
            <div className="h-1 w-20 rounded-full bg-gradient-to-r from-yellow-300/80 to-transparent" />
          </div>

          {productsLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="card-dark text-center text-white/65">
                Estamos cargando las últimas novedades...
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="card-dark text-center">
              <h3 className="text-lg font-semibold text-white">
                Sin resultados
              </h3>
              <p className="mt-2 text-sm text-white/60">
                Ajusta tus filtros o prueba otra búsqueda para encontrar el producto perfecto.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        <section className="hero-section overflow-hidden ring-1 ring-inset ring-yellow-300/15">
          <div className="hero-bg opacity-60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,232,141,0.12),transparent_65%)]" />
          <div className="relative px-6 sm:px-10 lg:px-16 py-12 sm:py-16 lg:py-20 text-center space-y-6">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white">
              ¿Listo para tu próximo upgrade?
            </h3>
            <p className="mx-auto max-w-2xl text-sm sm:text-base text-white/70">
              Revisa nuevas promociones, configura alertas personalizadas y recibe asesoría para armar tu setup ideal.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <Link
                href="/productos"
                className="btn-primary-web w-full sm:w-auto justify-center text-sm sm:text-base"
              >
                Ver catálogo completo
              </Link>
              <Link
                href="/contacto"
                className="btn-secondary-web w-full sm:w-auto justify-center text-sm sm:text-base"
              >
                Hablar con un asesor
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
