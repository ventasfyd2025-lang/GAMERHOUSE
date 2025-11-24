'use client';

import { useMemo, useState, useEffect, Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Zap } from 'lucide-react';
import DynamicBanner from '../DynamicBanner';
import BannerShowcase from '../BannerShowcase';
import { useProductSections } from '@/hooks/useProductSections';

export default function GamerHouseHomepage() {
  const { products, loading: productsLoading } = useProducts();
  const { addItem } = useCart();
  const { sections: productSections } = useProductSections();
  const PAGE_SIZE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = useMemo(() => (products.length > 0 ? Math.ceil(products.length / PAGE_SIZE) : 1), [products.length]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedProducts = useMemo(() => {
    if (!products.length) {
      return [];
    }
    const start = (currentPage - 1) * PAGE_SIZE;
    return products.slice(start, start + PAGE_SIZE);
  }, [products, currentPage]);

  const productMap = useMemo(() => {
    const map = new Map<string, any>();
    products.forEach((product) => {
      map.set(product.id, product);
    });
    return map;
  }, [products]);

  const normalizeValue = (value?: string | null) => value?.toString().toLowerCase().trim();

  const getProductsByCategory = useMemo(() => {
    return (categoryId?: string) => {
      if (!categoryId) {
        return [] as any[];
      }
      const normalized = normalizeValue(categoryId);
      return products.filter((product) => {
        const categories = [product.categoria, ...(product.categorias || [])]
          .map((cat) => normalizeValue(typeof cat === 'string' ? cat : undefined))
          .filter(Boolean);
        return categories.includes(normalized);
      });
    };
  }, [products]);

  const getSectionProducts = useMemo(() => {
    return (section: any) => {
      if (!products.length) {
        return [] as any[];
      }

      if (section.selectedProducts && section.selectedProducts.length > 0) {
        const selected = section.selectedProducts
          .map((id: string) => productMap.get(id))
          .filter(Boolean);
        if (selected.length > 0) {
          return selected;
        }
      }

      if (section.categoryId) {
        const categoryMatches = getProductsByCategory(section.categoryId);
        if (categoryMatches.length > 0) {
          return categoryMatches;
        }
      }

      if (section.type === 'new') {
        return products.filter((product) => product.nuevo);
      }

      if (section.type === 'bestsellers') {
        return products.slice(0, 8);
      }

      return products;
    };
  }, [productMap, products, getProductsByCategory]);

  const homepageSections = useMemo(() => {
    return productSections
      .filter((section) => section.enabled)
      .map((section) => ({
        ...section,
        products: getSectionProducts(section).slice(0, 4)
      }))
      .filter((section) => section.products.length > 0);
  }, [productSections, getSectionProducts]);

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
        className="group block bg-white rounded-xl sm:rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-yellow-300 transition-all duration-300 h-full flex flex-col"
      >
        {/* Image */}
        <div className="relative w-full aspect-[3/4] xs:aspect-[4/5] sm:aspect-square bg-slate-100 overflow-hidden">
          <Image
            src={product.imagenes?.[0] || product.imagen || '/placeholder.png'}
            alt={product.nombre}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {hasDiscount && (
            <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg shadow-red-600/20">
              -{discountPercent}%
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-sm">
              <span className="text-white font-bold border border-white/30 px-4 py-2 rounded-lg">AGOTADO</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2.5 p-3 sm:p-5 flex-1">
          <h3 className="font-semibold text-slate-900 line-clamp-2 text-xs sm:text-base group-hover:text-amber-500 transition-colors">
            {product.nombre}
          </h3>

          {/* Pricing */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-xl font-bold text-amber-500">
                ${product.precio?.toLocaleString() || 'N/D'}
              </span>
              {hasDiscount && (
                <span className="text-xs sm:text-sm text-slate-400 line-through">
                  ${product.precioOriginal?.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Stock Info */}
          {product.stock > 0 && (
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
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
            className={`mt-auto w-full py-2.5 px-3 rounded-lg font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wide ${product.stock === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 shadow-lg shadow-amber-200/60 hover:-translate-y-0.5'
              }`}
          >
            <ShoppingCart className="h-4 w-4" />
            {product.stock === 0 ? 'Sin Stock' : 'Agregar'}
          </button>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-yellow-300 selection:text-slate-900">
      <DynamicBanner />

      {homepageSections.map((section, index) => (
        <Fragment key={section.id}>
          <section className="py-8 sm:py-12 relative bg-gradient-to-br from-white via-amber-50/30 to-slate-50 rounded-3xl">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-amber-200/40 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-8 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="space-y-2">
                  <span className="text-amber-500 text-xs font-bold tracking-[0.2em] uppercase flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    {section.name}
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight">
                    {section.description || section.name}
                  </h2>
                </div>
                <Link href={`/categoria/${section.categoryId || 'todas'}`} className="text-sm text-slate-500 hover:text-amber-500 transition-colors flex items-center gap-1">
                  Ver todo <span className="text-lg">›</span>
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {section.products.map((product: any) => (
                  <ProductCard key={`${section.id}-${product.id}`} product={product} />
                ))}
              </div>
            </div>
          </section>

          {index === 0 && (
            <BannerShowcase className="py-6" slots={['middle']} />
          )}

        </Fragment>
      ))}

      {/* Catálogo completo */}
      <section className="py-8 sm:py-16 relative overflow-hidden bg-white">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-10 relative z-10">
          <div className="text-center space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-400 text-xs font-bold tracking-wider uppercase border border-yellow-400/20">
              Explora Todo
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 uppercase tracking-tight">
              Catálogo <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-rose-500">Completo</span>
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-base">
              Encuentra las mejores cartas, accesorios y productos exclusivos para tu colección.
            </p>
          </div>

          {productsLoading ? (
            <div className="text-center py-20">
              <div className="inline-block w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-500 font-medium">Cargando arsenal...</p>
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="text-center py-20 bg-slate-100 rounded-2xl border border-slate-200">
              <p className="text-gray-400">No hay productos disponibles en este momento.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
                {paginatedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between pt-8 border-t border-slate-200">
                <p className="text-sm text-slate-500 text-center sm:text-left">
                  Mostrando página <span className="font-bold text-slate-900">{currentPage}</span> de{' '}
                  <span className="font-bold text-slate-900">{totalPages}</span>
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-5 py-2.5 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    ← Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 text-white border border-transparent text-sm font-bold hover:from-amber-300 hover:to-rose-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-200/60"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <BannerShowcase className="py-8" slots={['footer']} />

    </div>
  );
}
