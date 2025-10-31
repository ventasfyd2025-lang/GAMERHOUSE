'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import { ProductCardSkeleton } from '@/components/home/SkeletonLoader';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useProductSections } from '@/hooks/useProductSections';
import { useHomepageConfig } from '@/hooks/useHomepageConfig';
import { productMatchesCategory, productMatchesSubcategory } from '@/utils/category';
import { getPaginationRange } from '@/lib/pagination';

const ITEMS_PER_PAGE = 20;

export default function AllProductsPage() {
  return (
    <Suspense fallback={<div>Cargando productos...</div>}>
      <AllProductsPageContent />
    </Suspense>
  );
}

function AllProductsPageContent() {
  const searchParams = useSearchParams();
  const { products, loading: productsLoading, error: productsError, refetch } = useProducts();
  const { categories } = useCategories();
  const { sections: productSections } = useProductSections();
  const { homepageConfig } = useHomepageConfig();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [page, setPage] = useState(1);
  const [manualProductIds, setManualProductIds] = useState<string[]>([]);
  const [specialFilter, setSpecialFilter] = useState<'ofertas' | 'nuevos' | 'destacados' | ''>('');
  const [activeSectionTitle, setActiveSectionTitle] = useState<string | null>(null);
  const [activeSectionDescription, setActiveSectionDescription] = useState<string | null>(null);

  const sectionParam = searchParams.get('section');
  const filterParam = searchParams.get('filter');
  const categoryParam = searchParams.get('category');

  useEffect(() => {
    const section = sectionParam
      ? productSections.find((candidate) => candidate.id === sectionParam)
      : undefined;

    if (!section) {
      setManualProductIds([]);
      setActiveSectionTitle(null);
      setActiveSectionDescription(null);

      if (categoryParam) {
        setSelectedCategory(categoryParam);
      }

      if (filterParam === 'ofertas' || filterParam === 'nuevos' || filterParam === 'destacados') {
        setSpecialFilter(filterParam);
      } else {
        setSpecialFilter('');
      }

      return;
    }

    setActiveSectionTitle(section.name || null);
    setActiveSectionDescription(section.description || null);

    const selectedIds = Array.isArray(section.selectedProducts)
      ? section.selectedProducts.filter((id): id is string => typeof id === 'string')
      : [];

    if (selectedIds.length > 0) {
      setManualProductIds(selectedIds);
      setSpecialFilter('');
    } else {
      if (section.type === 'featured') {
        const homepageFeatured = Array.isArray(homepageConfig?.featuredProducts)
          ? homepageConfig.featuredProducts.filter((id): id is string => typeof id === 'string')
          : [];
        if (homepageFeatured.length > 0) {
          setManualProductIds(homepageFeatured);
          setSpecialFilter('');
        } else {
          setManualProductIds([]);
          setSpecialFilter('destacados');
        }
      } else if (section.type === 'bestsellers') {
        setManualProductIds([]);
        setSpecialFilter('ofertas');
      } else if (section.type === 'new') {
        setManualProductIds([]);
        setSpecialFilter('nuevos');
      } else {
        setManualProductIds([]);
        setSpecialFilter('');
      }
    }

    if (section.type === 'category' && section.categoryId) {
      setSelectedCategory(section.categoryId);
    } else if (!categoryParam) {
      setSelectedCategory('all');
    }

    setSelectedSubcategory('');
  }, [sectionParam, productSections, homepageConfig?.featuredProducts, filterParam, categoryParam]);

  const filteredProducts = useMemo(() => {
    let data = [...products];

    if (manualProductIds.length > 0) {
      const allowed = new Set(manualProductIds);
      data = data.filter((product) => allowed.has(product.id));
    }

    if (selectedCategory !== 'all') {
      data = data.filter((product) => productMatchesCategory(product, selectedCategory));
    }

    if (selectedSubcategory) {
      data = data.filter((product) => productMatchesSubcategory(product, selectedSubcategory));
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.trim().toLowerCase();
      data = data.filter((product) =>
        product.nombre?.toLowerCase?.().includes(term) ||
        product.descripcion?.toLowerCase?.().includes(term) ||
        product.sku?.toLowerCase?.().includes(term)
      );
    }

    const min = Number(minPrice);
    const max = Number(maxPrice);
    if (!Number.isNaN(min) && minPrice.trim() !== '') {
      data = data.filter((product) => (product.precio || 0) >= min);
    }
    if (!Number.isNaN(max) && maxPrice.trim() !== '') {
      data = data.filter((product) => (product.precio || 0) <= max);
    }

    if (manualProductIds.length === 0) {
      if (specialFilter === 'ofertas') {
        data = data.filter((product) => product.oferta);
      } else if (specialFilter === 'nuevos') {
        data = data.filter((product) => product.nuevo);
      } else if (specialFilter === 'destacados') {
        const featuredIds = Array.isArray(homepageConfig?.featuredProducts)
          ? homepageConfig.featuredProducts.filter((id): id is string => typeof id === 'string')
          : [];
        if (featuredIds.length > 0) {
          const featuredSet = new Set(featuredIds);
          data = data.filter((product) => featuredSet.has(product.id));
        } else {
          data = data.filter((product) => product.oferta || product.nuevo);
        }
      }
    }

    return data;
  }, [
    products,
    selectedCategory,
    selectedSubcategory,
    searchTerm,
    minPrice,
    maxPrice,
    manualProductIds,
    specialFilter,
    homepageConfig?.featuredProducts,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedSubcategory, searchTerm, minPrice, maxPrice, manualProductIds, specialFilter, sectionParam]);

  useEffect(() => {
    setSelectedSubcategory('');
  }, [selectedCategory]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, page]);

  const paginationSegments = useMemo(() => getPaginationRange(page, totalPages), [page, totalPages]);

  const priceSummary = useMemo(() => {
    if (filteredProducts.length === 0) {
      return null;
    }
    const prices = filteredProducts.map((product) => product.precio || 0);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { min, max };
  }, [filteredProducts]);

  const categoryOptions = useMemo(() => {
    const mapped = categories
      .filter((cat) => cat.id !== 'all')
      .map((cat) => ({ value: cat.id, label: cat.name }));
    return [{ value: 'all', label: 'Todas las categorías' }, ...mapped];
  }, [categories]);

  const subcategoryOptions = useMemo(() => {
    if (selectedCategory === 'all') return [];
    const category = categories.find((cat) => cat.id === selectedCategory);
    if (!category?.subcategorias) return [];
    return category.subcategorias
      .filter((sub) => sub.activa)
      .map((sub) => ({ value: sub.nombre, label: sub.nombre }));
  }, [categories, selectedCategory]);

  return (
    <Layout>
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 space-y-8">
        <section className="flex flex-col gap-6">
          <header className="hero-section overflow-hidden ring-1 ring-inset ring-yellow-300/20">
            <div className="hero-bg opacity-70" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_0%,rgba(255,232,141,0.12),transparent_55%)]" />
            <div className="relative px-6 sm:px-10 py-10 space-y-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="tag-legendary">Catálogo gamer</span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-yellow-100">
                      +{filteredProducts.length} productos activos
                    </span>
                  </div>

                  <h1 className="text-[2.5rem] sm:text-4xl font-semibold text-white leading-tight">
                    Todos los productos disponibles
                  </h1>
                  <p className="max-w-2xl text-sm sm:text-base text-white/70">
                    Filtra por categoría, poderes especiales u ofertas destacadas y construye tu mazo ideal. Mostramos hasta 20 artículos por página para mantener la experiencia ágil.
                  </p>

                  {activeSectionTitle && (
                    <div className="card-dark px-5 py-4 text-sm">
                      <p className="font-semibold text-white">
                        Estás revisando la sección “{activeSectionTitle}”.
                      </p>
                      {activeSectionDescription && (
                        <p className="mt-2 text-white/70">
                          {activeSectionDescription}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => refetch()}
                  className="btn-secondary-web w-full justify-center text-sm sm:text-base sm:w-auto"
                >
                  ↻ Refrescar lista
                </button>
              </div>
            </div>
          </header>

          <section className="card-dark">
            <h2 className="text-lg font-semibold text-white/90 mb-4">Refina tu búsqueda</h2>
            <form className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                Buscar
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Nombre, descripción o SKU"
                  className="input-web"
                />
              </label>

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                Categoría
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="input-web"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {subcategoryOptions.length > 0 && (
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                  Subcategoría
                  <select
                    value={selectedSubcategory}
                    onChange={(event) => setSelectedSubcategory(event.target.value)}
                    className="input-web"
                  >
                    <option value="">Todas</option>
                    {subcategoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                Rango de precio (CLP)
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(event) => setMinPrice(event.target.value)}
                    placeholder="Mínimo"
                    className="input-web"
                  />
                  <input
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                    placeholder="Máximo"
                    className="input-web"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                Filtro especial
                <select
                  value={specialFilter}
                  onChange={(event) => setSpecialFilter(event.target.value as typeof specialFilter)}
                  className="input-web"
                >
                  <option value="">Todos</option>
                  <option value="destacados">Destacados</option>
                  <option value="ofertas">Ofertas</option>
                  <option value="nuevos">Nuevos</option>
                </select>
              </label>
            </form>
          </section>
        </section>

        {productsLoading && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ProductCardSkeleton count={8} />
            </div>
          </section>
        )}

        {productsError && (
          <section className="card-dark border-yellow-300/20">
            <h2 className="text-lg font-semibold text-white mb-2">Error al cargar productos</h2>
            <p className="text-sm text-white/70 mb-4">{productsError}</p>
            <button
              onClick={() => refetch()}
              className="btn-secondary-web w-full justify-center sm:w-auto"
            >
              Reintentar carga
            </button>
          </section>
        )}

        {!productsLoading && !productsError && (
          <section className="space-y-6">
            <div className="card-dark flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-white/70">
                {filteredProducts.length} producto{filteredProducts.length === 1 ? '' : 's'} encontrados · Página {page} de {Math.max(totalPages, 1)}
              </div>
              {priceSummary && (
                <div className="text-xs text-white/60">
                  Rango de precios mostrado: {priceSummary.min.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })} – {priceSummary.max.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}
                </div>
              )}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="hero-section overflow-hidden ring-1 ring-inset ring-yellow-300/15 text-center">
                <div className="hero-bg opacity-60" />
                <div className="relative px-6 sm:px-10 py-12 space-y-4">
                  <div className="text-5xl">🔍</div>
                  <p className="text-sm sm:text-base text-white/75">
                    No encontramos resultados con los filtros actuales. Ajusta la búsqueda para descubrir más productos.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="pagination-button h-10 px-4 font-semibold"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    aria-label="Página anterior"
                  >
                    ←
                  </button>
                  {paginationSegments.map((segment, index) => {
                    const isEllipsis = segment === '...';
                    return (
                      <button
                        type="button"
                        key={isEllipsis ? `ellipsis-${index}` : `page-${segment}`}
                        className={`pagination-button ${segment === page ? 'pagination-button-active' : ''}`}
                        onClick={() => {
                          if (!isEllipsis) {
                            setPage(segment as number);
                          }
                        }}
                        disabled={isEllipsis}
                      >
                        {segment}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    className="pagination-button h-10 px-4 font-semibold"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages}
                    aria-label="Página siguiente"
                  >
                    →
                  </button>
                </div>
                <span className="text-sm text-white/60">
                  Página {page} de {totalPages}
                </span>
              </div>
            )}

            {filteredProducts.length > ITEMS_PER_PAGE && (
              <div className="text-center text-xs text-white/50">
                Mostrando los primeros {ITEMS_PER_PAGE} resultados. Refina los filtros para ubicar productos específicos.
              </div>
            )}
          </section>
        )}
      </main>
    </Layout>
  );
}
