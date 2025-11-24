'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import DynamicBanner from '@/components/DynamicBanner';
import BannerShowcase from '@/components/BannerShowcase';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import { ProductCardSkeleton } from '@/components/home/SkeletonLoader';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useProductSections } from '@/hooks/useProductSections';
import { useHomepageConfig } from '@/hooks/useHomepageConfig';
import { productMatchesCategory, productMatchesSubcategory, formatCategoryLabel, normalizeCategoryValue } from '@/utils/category';
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
  const searchParam = searchParams.get('search') || '';

  useEffect(() => {
    setSearchTerm(searchParam);
  }, [searchParam]);

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

  const normalizedSelectedCategory = useMemo(() => normalizeCategoryValue(selectedCategory), [selectedCategory]);

  const selectedCategoryName = useMemo(() => {
    if (selectedCategory === 'all') {
      return null;
    }
    const match = categories.find((cat) => {
      const candidates = [cat.id, (cat as any)?.slug, cat.name, (cat as any)?.nombre];
      return candidates.some((value) => typeof value === 'string' && normalizeCategoryValue(value) === normalizedSelectedCategory);
    });
    return match?.name || (match as any)?.nombre || formatCategoryLabel(selectedCategory);
  }, [categories, normalizedSelectedCategory, selectedCategory]);

  const selectedSubcategoryLabel = selectedSubcategory ? formatCategoryLabel(selectedSubcategory) : null;

  const hasActiveFilters = Boolean(
    selectedCategory !== 'all' ||
    selectedSubcategory ||
    searchTerm.trim() !== '' ||
    specialFilter ||
    minPrice.trim() !== '' ||
    maxPrice.trim() !== '' ||
    manualProductIds.length > 0 ||
    sectionParam
  );

  const heroEyebrow = hasActiveFilters ? 'Resultados filtrados' : 'Catálogo gamer';

  const heroTitle = useMemo(() => {
    if (searchTerm.trim() !== '') {
      return `Resultados para “${searchTerm.trim()}”`;
    }
    if (selectedSubcategoryLabel) {
      return `${selectedCategoryName ? `${selectedCategoryName} · ` : ''}${selectedSubcategoryLabel}`;
    }
    if (selectedCategoryName) {
      return `Categoría: ${selectedCategoryName}`;
    }
    if (specialFilter === 'ofertas') {
      return 'Ofertas y promociones';
    }
    if (specialFilter === 'nuevos') {
      return 'Novedades recientes';
    }
    if (specialFilter === 'destacados') {
      return 'Selección destacada';
    }
    if (activeSectionTitle) {
      return activeSectionTitle;
    }
    return 'Todos los productos disponibles';
  }, [searchTerm, selectedSubcategoryLabel, selectedCategoryName, specialFilter, activeSectionTitle]);

  const heroDescription = useMemo(() => {
    const total = filteredProducts.length;
    const label = total === 1 ? 'producto' : 'productos';
    if (searchTerm.trim() !== '') {
      return `Encontramos ${total} ${label} que coinciden con tu búsqueda. Ajusta los filtros para afinar aún más.`;
    }
    if (selectedSubcategoryLabel) {
      return `${total} ${label} dentro de ${selectedCategoryName ? `${selectedCategoryName} › ` : ''}${selectedSubcategoryLabel}.`;
    }
    if (selectedCategoryName) {
      return `${total} ${label} disponibles en ${selectedCategoryName}.`;
    }
    if (specialFilter === 'ofertas') {
      return `${total} ${label} con precios rebajados en este momento.`;
    }
    if (specialFilter === 'nuevos') {
      return `${total} ${label} recién llegados para que seas el primero en conseguirlos.`;
    }
    if (specialFilter === 'destacados') {
      return `${total} ${label} seleccionados por el equipo para destacarse en la tienda.`;
    }
    if (manualProductIds.length > 0 && activeSectionTitle) {
      return `${total} ${label} elegidos manualmente para esta sección.`;
    }
    return 'Filtra por categoría, preventa, ofertas o rango de precios para encontrar tu próxima adquisición. Mostramos 20 productos por página.';
  }, [
    filteredProducts.length,
    searchTerm,
    selectedCategoryName,
    selectedSubcategoryLabel,
    specialFilter,
    manualProductIds.length,
    activeSectionTitle,
  ]);

  const filteredInStock = useMemo(() => filteredProducts.filter((product) => product.stock > 0).length, [filteredProducts]);

  return (
    <Layout>
      <main className="w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12 space-y-6 sm:space-y-8">
        <DynamicBanner />
        <BannerShowcase className="py-6" slots={['middle']} />

        <section className="flex flex-col gap-5 sm:gap-6">
          <div className="sm:hidden space-y-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-5 shadow-sm">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-slate-500">{heroEyebrow}</span>
            <h1 className="text-xl font-semibold text-slate-900">{heroTitle}</h1>
            <p className="text-sm text-slate-500">
              {heroDescription}
            </p>
          </div>

          <div className="hidden sm:block surface-card relative overflow-hidden px-4 sm:px-10 py-6 sm:py-10">
            <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_35%_0%,rgba(255,232,141,0.25),transparent_55%)]" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4 sm:space-y-5">
                <span className="section-heading__eyebrow text-[0.55rem] sm:text-[0.65rem] tracking-[0.45em]">{heroEyebrow}</span>
                <h1 className="section-heading__title text-2xl sm:text-[2.75rem]">
                  {heroTitle}
                </h1>
                <p className="section-heading__description text-sm sm:text-base">
                  {heroDescription}
                </p>

                <div className="flex flex-wrap gap-2.5 text-[0.7rem] sm:text-sm">
                  <span className="chip-pill px-3 py-1 sm:px-3.5 sm:py-1.5">+{filteredProducts.length} resultados</span>
                  <span className="chip-pill px-3 py-1 sm:px-3.5 sm:py-1.5">{filteredInStock} con stock disponible</span>
                </div>

                {activeSectionTitle && (
                  <div className="glass-panel mt-4 sm:mt-6 px-4 py-3 text-sm">
                    <p className="font-semibold text-slate-900">
                      Estás revisando la sección “{activeSectionTitle}”.
                    </p>
                    {activeSectionDescription && (
                      <p className="mt-2 text-slate-600">
                        {activeSectionDescription}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => refetch()}
                className="btn-soft w-full justify-center text-xs sm:text-base sm:w-auto"
              >
                ↻ Refrescar lista
              </button>
            </div>
          </div>

          <section className="hidden sm:block glass-panel p-4 sm:p-8">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
              <div className="section-heading">
                <span className="section-heading__eyebrow text-[0.55rem] sm:text-[0.65rem] tracking-[0.45em]">Curar resultados</span>
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">Filtra tu búsqueda</h2>
              </div>
            </div>
            <form className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col gap-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Buscar
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Nombre, descripción o SKU"
                  className="form-input text-sm sm:text-base"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Categoría
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="form-input text-sm sm:text-base"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {subcategoryOptions.length > 0 && (
                <label className="flex flex-col gap-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Subcategoría
                  <select
                    value={selectedSubcategory}
                    onChange={(event) => setSelectedSubcategory(event.target.value)}
                    className="form-input text-sm sm:text-base"
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

              <label className="flex flex-col gap-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Rango de precio (CLP)
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                  <input
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(event) => setMinPrice(event.target.value)}
                    placeholder="Mínimo"
                    className="form-input text-sm sm:text-base"
                  />
                  <input
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                    placeholder="Máximo"
                    className="form-input text-sm sm:text-base"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Filtro especial
                <select
                  value={specialFilter}
                  onChange={(event) => setSpecialFilter(event.target.value as typeof specialFilter)}
                  className="form-input text-sm"
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
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-6">
              <ProductCardSkeleton count={8} />
            </div>
          </section>
        )}

        {productsError && (
          <section className="glass-panel border border-rose-100 bg-rose-50/60">
            <h2 className="text-lg font-semibold text-rose-700 mb-2">Error al cargar productos</h2>
            <p className="text-sm text-rose-600 mb-4">{productsError}</p>
            <button
              onClick={() => refetch()}
              className="btn-solid w-full justify-center sm:w-auto"
            >
              Reintentar carga
            </button>
          </section>
        )}

        {!productsLoading && !productsError && (
          <section className="space-y-6">
            <div className="surface-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4">
              <div className="text-sm text-slate-600">
                {filteredProducts.length} producto{filteredProducts.length === 1 ? '' : 's'} encontrados · Página {page} de {Math.max(totalPages, 1)}
              </div>
              {priceSummary && (
                <div className="text-xs text-slate-500">
                  Rango de precios mostrado: {priceSummary.min.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })} – {priceSummary.max.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}
                </div>
              )}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="surface-card text-center px-6 sm:px-10 py-12 space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                  <Search className="h-5 w-5" />
                </div>
                <p className="text-sm sm:text-base text-slate-600">
                  No encontramos resultados con los filtros actuales. Ajusta la búsqueda para descubrir más productos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-6">
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

        <BannerShowcase className="py-8" slots={['footer']} />
      </main>
    </Layout>
  );
}
