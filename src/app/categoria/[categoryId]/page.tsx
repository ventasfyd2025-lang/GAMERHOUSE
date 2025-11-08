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
      <Link href={`/producto/${product.id}`} className="block h-full">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
          {/* Image */}
          <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
            <Image
              src={product.imagenes?.[0] || product.imagen || '/placeholder.png'}
              alt={product.nombre}
              fill
              className="object-cover hover:scale-110 transition-transform"
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
            <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm">
              {product.nombre}
            </h3>

            {/* Pricing */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gamerhouse-red">
                  ${product.precio?.toLocaleString() || 'N/D'}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-gray-500 line-through">
                    ${product.precioOriginal?.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Stock Info */}
            {product.stock > 0 && (
              <p className="text-xs text-gray-600">
                Stock: {product.stock}
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
              className={`mt-auto w-full py-2 px-3 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2 text-sm ${
                product.stock === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-gamerhouse-red hover:bg-red-700'
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
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gamerhouse-red hover:text-red-700 font-semibold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a inicio
          </Link>

          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gamerhouse-navy tracking-tight">
              {categoryInfo?.name || formatCategoryLabel(categoryId)}
            </h1>
            <div className="h-1 w-20 bg-gamerhouse-red mt-4"></div>
            <p className="text-gray-600 mt-2">
              {filteredProducts.length} productos encontrados
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="rounded-lg border border-gray-300 bg-white p-4">
          <input
            type="text"
            placeholder="Buscar en esta categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-gray-900 placeholder-gray-500 outline-none"
          />
        </div>

        {/* Subcategories Filter */}
        {subcategories.length > 0 && (
          <div className="rounded-lg border border-gray-300 bg-white p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gamerhouse-navy">
              Subcategorías
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSubcategory('')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  !selectedSubcategory
                    ? 'bg-gamerhouse-red text-white'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Todas
              </button>
              {subcategories.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubcategory(sub.nombre || sub.id)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    selectedSubcategory === (sub.nombre || sub.id)
                      ? 'bg-gamerhouse-red text-white'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
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
              <div className="text-center text-gray-600">
                Cargando productos...
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-gray-50 rounded-lg border border-gray-300 text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900">
                Sin resultados
              </h3>
              <p className="mt-2 text-sm text-gray-600">
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
                <div className="mt-8 flex flex-col items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 h-10 font-semibold border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className={`px-3 py-2 font-semibold rounded-lg ${
                            pageNumber === currentPage
                              ? 'bg-gamerhouse-red text-white'
                              : isEllipsis
                              ? 'text-gray-500 cursor-default'
                              : 'border border-gray-300 text-gray-900 hover:bg-gray-100'
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
                      className="px-4 py-2 h-10 font-semibold border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
