'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { useCategories } from '@/hooks/useCategories';
import { ShoppingCart, Zap, ArrowUpRight, Menu, ChevronDown, ChevronRight } from 'lucide-react';
import { productMatchesCategory, productMatchesSubcategory } from '@/utils/category';
import { useConfig } from '@/hooks/useConfig';
import { getPaginationRange } from '@/lib/pagination';
import MainBanner from '@/components/home/MainBanner';

const ITEMS_PER_PAGE = 20;

export default function RetailHomepage() {
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
  const { mainBannerConfig } = useConfig();

  const heroSlide = useMemo(() => {
    if (!mainBannerConfig?.active) return undefined;
    return mainBannerConfig.slides?.find(slide => slide.imageUrl) ?? mainBannerConfig.slides?.[0];
  }, [mainBannerConfig]);

  const heroImage = heroSlide?.imageUrl || '/banner-hero-gamerhouse.jpg';
  const heroTitle = heroSlide?.title || 'Potencia tu setup con energía coleccionable';
  const heroSubtitle = heroSlide?.subtitle || 'Hardware competitivo, boosters exclusivos y accesorios con estética neon inspirada en cartas legendarias.';

  const heroLink = useMemo(() => {
    if (!heroSlide) return { href: '/productos', label: 'Explorar catálogo' };
    const linkType = heroSlide.linkType || 'product';
    if (linkType === 'product' && heroSlide.productId) {
      return { href: `/producto/${heroSlide.productId}`, label: 'Ver producto destacado' };
    }
    if (linkType === 'category' && heroSlide.categoryId) {
      return { href: `/?category=${heroSlide.categoryId}`, label: 'Ver categoría destacada' };
    }
    if (linkType === 'url' && heroSlide.customUrl) {
      return { href: heroSlide.customUrl, label: 'Ver más detalles' };
    }
    return { href: '/productos', label: 'Explorar catálogo' };
  }, [heroSlide]);

  const heroLinkIsExternal = useMemo(() => heroLink.href.startsWith('http'), [heroLink.href]);

  const categoryParam = searchParams.get('category') || 'all';
  const searchParam = searchParams.get('search') || '';

  const subcategoryParam = searchParams.get('subcategory') || '';

  useEffect(() => {
    setSelectedCategory(categoryParam);
    setSearchQuery(searchParam);
    setSelectedSubcategory(subcategoryParam);
  }, [categoryParam, searchParam, subcategoryParam]);

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => (product.stock || 0) > 0);

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(product =>
        productMatchesCategory(product, selectedCategory)
      );
    }

    if (selectedSubcategory) {
      filtered = filtered.filter(product => productMatchesSubcategory(product, selectedSubcategory));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.nombre?.toLowerCase().includes(query) ||
        product.descripcion?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, selectedCategory, selectedSubcategory, searchQuery]);

  const featuredProducts = useMemo(() => filteredProducts.slice(0, 4), [filteredProducts]);

  const bestSellers = useMemo(() => filteredProducts.slice(4, 8), [filteredProducts]);

  const totalPages = useMemo(() => {
    if (filteredProducts.length === 0) {
      return 0;
    }
    return Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  }, [filteredProducts.length]);

  useEffect(() => {
    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
      return;
    }

    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedProducts = useMemo(() => {
    if (filteredProducts.length === 0) {
      return [];
    }

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSubcategory, searchQuery]);

  const activeCategoryLabel = useMemo(() => {
    if (selectedCategory === 'all') {
      return 'Todos los productos';
    }

    const match = categories.find(cat => cat.id === selectedCategory);
    if (!match) {
      return selectedCategory;
    }

    if (!selectedSubcategory) {
      return match.name;
    }

    const subLabel = match.subcategorias?.find(sub => {
      const value = sub.nombre || sub.id;
      if (!value) return false;
      return value.toLowerCase() === selectedSubcategory.toLowerCase();
    })?.nombre;

    return subLabel ? `${match.name} · ${subLabel}` : match.name;
  }, [selectedCategory, selectedSubcategory, categories]);

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
        <MainBanner
          config={mainBannerConfig}
          onResetFilters={() => {
            setSelectedCategory('all');
            setSelectedSubcategory('');
            setExpandedCategory(null);
          }}
        />

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
            <div className="flex flex-col items-end gap-2 text-sm text-white/60">
              <span>Viendo: {activeCategoryLabel}</span>
              <button
                type="button"
                onClick={() => setIsCategoryMenuOpen(prev => !prev)}
                className="chip-option gap-2"
              >
                <Menu className="h-4 w-4" />
                {isCategoryMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                <ChevronDown className={`h-4 w-4 transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {isCategoryMenuOpen && (
            <div className="card-dark space-y-4">
              <button
                type="button"
                className={`chip-option w-full justify-between ${selectedCategory === 'all' ? 'chip-option-active' : ''}`}
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedSubcategory('');
                  setExpandedCategory(null);
                  setIsCategoryMenuOpen(false);
                }}
              >
                <span className="flex items-center gap-2">
                  <span>🏠</span>
                  Todos los productos
                </span>
              </button>

              {categories.filter(cat => cat.id !== 'all').map(category => {
                const subcategories = category.subcategorias?.filter(sub => sub.activa !== false) ?? [];
                const isExpanded = expandedCategory === category.id;

                return (
                  <div key={category.id} className="space-y-2">
                    <button
                      type="button"
                      className={`chip-option w-full justify-between ${selectedCategory === category.id && !selectedSubcategory ? 'chip-option-active' : ''}`}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setSelectedSubcategory('');
                        if (subcategories.length > 0) {
                          setExpandedCategory(prev => (prev === category.id ? null : category.id));
                        } else {
                          setExpandedCategory(null);
                          setIsCategoryMenuOpen(false);
                        }
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <span>{category.icon ?? '🎮'}</span>
                        {category.name}
                      </span>
                      {subcategories.length > 0 && (
                        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      )}
                    </button>

                    {isExpanded && subcategories.length > 0 && (
                      <div className="space-y-2 pl-4">
                        {subcategories.map(sub => {
                          const subValue = sub.nombre || sub.id || '';
                          return (
                            <button
                              type="button"
                              key={sub.id ?? sub.nombre}
                              className={`chip-option w-full justify-between text-sm ${selectedSubcategory && subValue.toLowerCase() === selectedSubcategory.toLowerCase() ? 'chip-option-active' : ''}`}
                              onClick={() => {
                                setSelectedCategory(category.id);
                                setSelectedSubcategory(subValue);
                                setIsCategoryMenuOpen(false);
                              }}
                            >
                              <span className="flex items-center gap-2">
                                <ChevronRight className="h-4 w-4 text-yellow-200" />
                                {sub.nombre || sub.id}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
              {paginatedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {!productsLoading && filteredProducts.length > 0 && totalPages > 1 && (
            <div className="mt-8 flex flex-col items-center gap-4 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="pagination-button h-10 px-4 font-semibold"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                >
                  ←
                </button>
                {getPaginationRange(currentPage, totalPages).map((pageNumber, index) => {
                  const isEllipsis = pageNumber === '...';
                  return (
                  <button
                    type="button"
                    key={isEllipsis ? `ellipsis-${index}` : `page-${pageNumber}`}
                    className={`pagination-button ${pageNumber === currentPage ? 'pagination-button-active' : ''}`}
                    onClick={() => {
                      if (!isEllipsis) {
                        setCurrentPage(pageNumber as number);
                      }
                    }}
                    disabled={isEllipsis}
                  >
                    {pageNumber}
                  </button>
                  );
                })}
                <button
                  type="button"
                  className="pagination-button h-10 px-4 font-semibold"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Página siguiente"
                >
                  →
                </button>
              </div>
              <span>
                Página {currentPage} de {totalPages}
              </span>
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
