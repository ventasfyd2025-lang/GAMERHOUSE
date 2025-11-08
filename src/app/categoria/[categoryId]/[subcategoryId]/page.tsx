'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { useCategories } from '@/hooks/useCategories';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { productMatchesCategory, productMatchesSubcategory, formatCategoryLabel } from '@/utils/category';
import { getPaginationRange } from '@/lib/pagination';

const ITEMS_PER_PAGE = 20;

export default function SubcategoryPage() {
  const params = useParams();
  const categoryId = params.categoryId as string;
  const subcategoryId = params.subcategoryId as string;

  const { products, loading: productsLoading } = useProducts();
  const { categories } = useCategories();
  const { addItem } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Get category and subcategory info
  const categoryInfo = useMemo(() => {
    return categories.find(cat => cat.id === categoryId);
  }, [categoryId, categories]);

  const subcategoryInfo = useMemo(() => {
    return categoryInfo?.subcategorias?.find(sub => {
      const value = sub.nombre || sub.id || '';
      return value.toLowerCase() === subcategoryId.toLowerCase();
    });
  }, [categoryInfo, subcategoryId]);

  // Filter products for this category and subcategory
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => (product.stock || 0) > 0);

    // Filter by category
    filtered = filtered.filter(product =>
      productMatchesCategory(product, categoryId)
    );

    // Filter by subcategory
    filtered = filtered.filter(product =>
      productMatchesSubcategory(product, subcategoryId)
    );

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.nombre?.toLowerCase().includes(query) ||
        product.descripcion?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, categoryId, subcategoryId, searchQuery]);

  const totalPages = useMemo(() => {
    if (filteredProducts.length === 0) return 0;
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
    if (filteredProducts.length === 0) return [];
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
                <span>TCG Card</span>
                <span className="text-yellow-300">{descuento > 0 ? 'Oferta' : 'Regular'}</span>
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

  if (!categoryInfo && !productsLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white pt-32 pb-24 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <h1 className="text-3xl font-bold">Categoría no encontrada</h1>
          <p className="text-white/60">La categoría o subcategoría que buscas no existe.</p>
          <Link href="/" className="inline-flex items-center gap-2 text-yellow-300 hover:text-yellow-200">
            <ArrowLeft size={18} />
            Volver a inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-24 text-white">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(255,232,141,0.09),transparent_45%),radial-gradient(circle_at_88%_8%,rgba(231,68,68,0.12),transparent_55%)]" />
        <div className="absolute inset-x-0 top-1/3 h-96 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_65%)] blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
        {/* Breadcrumb y Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Link href="/" className="hover:text-white transition-colors">
              Inicio
            </Link>
            <span>/</span>
            <Link
              href={`/categoria/${categoryId}`}
              className="hover:text-white transition-colors"
            >
              {categoryInfo?.name || formatCategoryLabel(categoryId)}
            </Link>
            <span>/</span>
            <span>{subcategoryInfo?.nombre || subcategoryId}</span>
          </div>

          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              {subcategoryInfo?.nombre || subcategoryId}
            </h1>
            <div className="divider-neon w-20 mt-4" />
            <p className="text-white/60 mt-2">
              {categoryInfo?.name} / {filteredProducts.length} productos encontrados
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="rounded-3xl border border-yellow-300/15 bg-[#05070f]/70 p-4 backdrop-blur-xl">
          <input
            type="text"
            placeholder="Buscar en esta subcategoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-white placeholder-white/40 outline-none"
          />
        </div>

        {/* Products Grid */}
        <section className="space-y-8 rounded-3xl border border-yellow-300/15 bg-[#05070f]/70 p-6 sm:p-8 backdrop-blur-xl">
          {productsLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="card-dark text-center text-white/65">
                Cargando productos...
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="card-dark text-center py-12">
              <h3 className="text-lg font-semibold text-white">
                Sin resultados
              </h3>
              <p className="mt-2 text-sm text-white/60">
                Ajusta tus filtros o prueba otra búsqueda.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                {paginatedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex flex-col items-center gap-4 text-sm text-white/60">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="pagination-button h-10 px-4 font-semibold"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
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
                    >
                      →
                    </button>
                  </div>
                  <span>
                    Página {currentPage} de {totalPages}
                  </span>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
