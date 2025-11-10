'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { useCategories } from '@/hooks/useCategories';
import { ShoppingCart, ArrowLeft, ChevronDown } from 'lucide-react';
import { productMatchesCategory, productMatchesSubcategory, formatCategoryLabel } from '@/utils/category';
import { getPaginationRange } from '@/lib/pagination';

const ITEMS_PER_PAGE = 20;

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.categoryId as string;

  const { products, loading: productsLoading } = useProducts();
  const { categories } = useCategories();
  const { addItem } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const categoryInfo = useMemo(() => {
    return categories.find(cat => cat.id === categoryId);
  }, [categoryId, categories]);

  const subcategories = useMemo(() => {
    return categoryInfo?.subcategorias?.filter(sub => sub.activa !== false) ?? [];
  }, [categoryInfo]);

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => (product.stock || 0) > 0);

    if (categoryId && categoryId !== 'all') {
      filtered = filtered.filter(product => productMatchesCategory(product, categoryId));
    }

    if (selectedSubcategory) {
      filtered = filtered.filter(product => productMatchesSubcategory(product, selectedSubcategory));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.nombre?.toLowerCase().includes(query) || product.descripcion?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, categoryId, selectedSubcategory, searchQuery]);

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
  }, [selectedSubcategory, searchQuery]);

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
      <Link href={`/producto/${product.id}`} className="block h-full group">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 h-full flex flex-col group-hover:-translate-y-2 group-hover:border-gamerhouse-red/50">
          {/* Image */}
          <div className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
            <Image
              src={product.imagenes?.[0] || product.imagen || '/placeholder.png'}
              alt={product.nombre}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
            {hasDiscount && (
              <div className="absolute top-3 right-3 bg-gamerhouse-red text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
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
          <div className="flex flex-col gap-3 p-5 flex-1 bg-white">
            <h3 className="font-bold text-gray-900 line-clamp-2 text-sm leading-tight">
              {product.nombre}
            </h3>

            {/* Pricing */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-gamerhouse-red">
                  ${product.precio?.toLocaleString() || 'N/D'}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-gray-400 line-through">
                    ${product.precioOriginal?.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Stock Info */}
            {product.stock > 0 && (
              <p className="text-xs font-semibold text-gamerhouse-navy">
                📦 Stock: {product.stock}
              </p>
            )}

            {/* Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddToCart(product);
              }}
              disabled={product.stock === 0}
              className={`mt-auto w-full py-3 px-3 rounded-lg font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 text-sm transform ${
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
      </Link>
    );
  };

  if (!categoryInfo && !productsLoading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 pt-32 pb-24 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <h1 className="text-3xl font-bold">Categoría no encontrada</h1>
          <p className="text-gray-600">La categoría que buscas no existe.</p>
          <Link href="/" className="inline-flex items-center gap-2 text-gamerhouse-red hover:text-red-700 font-semibold">
            <ArrowLeft className="h-5 w-5" />
            Volver a inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 text-gray-900">
      {/* Hero Header Section */}
      <div className="bg-gradient-to-r from-gamerhouse-navy to-gamerhouse-red text-white py-12 sm:py-16 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gamerhouse-gold hover:text-yellow-300 font-semibold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a inicio
          </Link>

          <div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              {categoryInfo?.name || formatCategoryLabel(categoryId)}
            </h1>
            <div className="h-1 w-20 bg-gamerhouse-gold mt-4"></div>
            <p className="text-gray-100 mt-2 text-lg">
              {filteredProducts.length} productos encontrados
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb Link */}
        <div></div>

        {/* Search Bar */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-lg">
          <input
            type="text"
            placeholder="Buscar en esta categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 border border-gray-300 focus:border-gamerhouse-red focus:ring-2 focus:ring-gamerhouse-red/20 outline-none transition-all"
          />
        </div>

        {/* Subcategories Filter */}
        {subcategories.length > 0 && (
          <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-lg">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gamerhouse-navy mb-4">
              Filtrar por Subcategoría
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedSubcategory('')}
                className={`px-5 py-2.5 rounded-full font-semibold transition-all transform hover:scale-105 ${
                  !selectedSubcategory
                    ? 'bg-gamerhouse-red text-white shadow-lg'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                Todas
              </button>
              {subcategories.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubcategory(sub.nombre || sub.id)}
                  className={`px-5 py-2.5 rounded-full font-semibold transition-all transform hover:scale-105 ${
                    selectedSubcategory === (sub.nombre || sub.id)
                      ? 'bg-gamerhouse-red text-white shadow-lg'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  {sub.nombre || sub.id}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <section className="space-y-8">
          {productsLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center space-y-3">
                <div className="inline-block animate-spin">
                  <div className="h-12 w-12 border-4 border-gamerhouse-gold border-t-gamerhouse-red rounded-full"></div>
                </div>
                <p className="text-lg font-semibold text-gray-600">Cargando productos...</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-gradient-to-r from-gamerhouse-navy/10 to-gamerhouse-red/10 rounded-xl border border-gamerhouse-navy/20 text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gamerhouse-navy">
                Sin resultados
              </h3>
              <p className="mt-3 text-gray-600">
                No encontramos productos que coincidan con tus filtros o búsqueda.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Intenta ajustar tus filtros o prueba con otros términos.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {paginatedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex flex-col items-center gap-6">
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    <button
                      type="button"
                      className="px-4 py-2 h-10 font-bold border border-gamerhouse-navy rounded-lg text-gamerhouse-navy hover:bg-gamerhouse-navy hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      ← Anterior
                    </button>
                    {getPaginationRange(currentPage, totalPages).map((pageNumber, index) => {
                      const isEllipsis = pageNumber === '...';
                      return (
                        <button
                          type="button"
                          key={isEllipsis ? `ellipsis-${index}` : `page-${pageNumber}`}
                          className={`px-3.5 py-2 font-bold rounded-lg transition-all ${
                            pageNumber === currentPage
                              ? 'bg-gradient-to-r from-gamerhouse-red to-red-700 text-white shadow-lg'
                              : isEllipsis
                              ? 'text-gray-400 cursor-default'
                              : 'border border-gray-300 text-gray-900 hover:border-gamerhouse-red hover:text-gamerhouse-red'
                          }`}
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
                      className="px-4 py-2 h-10 font-bold border border-gamerhouse-navy rounded-lg text-gamerhouse-navy hover:bg-gamerhouse-navy hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente →
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    Página <span className="text-gamerhouse-red font-bold">{currentPage}</span> de <span className="text-gamerhouse-navy font-bold">{totalPages}</span>
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
