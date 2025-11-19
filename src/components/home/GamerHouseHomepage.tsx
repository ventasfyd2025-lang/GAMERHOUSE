'use client';

import { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { ShoppingCart } from 'lucide-react';
import DynamicBanner from '../DynamicBanner';
import BannerShowcase from '../BannerShowcase';

export default function GamerHouseHomepage() {
  const { products, loading: productsLoading } = useProducts();
  const { addItem } = useCart();
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

  const offerProducts = useMemo(() => {
    return products
      .filter((product) => (product.precioOriginal && product.precioOriginal > product.precio) || product.oferta)
      .slice(0, 4);
  }, [products]);

  const newProducts = useMemo(() => {
    return products
      .filter((product) => product.nuevo)
      .slice(0, 4);
  }, [products]);

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
        className="group block bg-white rounded-xl sm:rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col"
      >
        {/* Image */}
        <div className="relative w-full aspect-[3/4] xs:aspect-[4/5] sm:aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          <Image
            src={product.imagenes?.[0] || product.imagen || '/placeholder.png'}
            alt={product.nombre}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
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
        <div className="flex flex-col gap-2.5 p-3 sm:p-5 flex-1">
          <h3 className="font-semibold text-slate-800 line-clamp-2 text-xs sm:text-base">
            {product.nombre}
          </h3>

          {/* Pricing */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-xl font-bold text-sky-700">
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
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold">
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
            className={`mt-auto w-full py-2 px-2.5 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center gap-1.5 text-xs sm:text-base transform ${
              product.stock === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-500 hover:brightness-110 hover:shadow-lg hover:scale-[1.02] active:scale-95'
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
      <DynamicBanner />
      <BannerShowcase className="py-6" maxItems={2} />

      {/* Ofertas destacadas */}
      {offerProducts.length > 0 && (
        <section className="py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6">
            <div className="section-heading">
              <span className="section-heading__eyebrow">Ofertas</span>
              <h2 className="section-heading__title text-2xl sm:text-3xl">Ofertas pastel en stock</h2>
              <p className="section-heading__description text-sm">
                Seleccionamos productos con precio rebajado para que armes tu setup gamer sin salirte del presupuesto.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {offerProducts.map((product) => (
                <ProductCard key={`offer-${product.id}`} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      <BannerShowcase className="py-6" startIndex={1} maxItems={1} />

      {/* Nuevos lanzamientos */}
      {newProducts.length > 0 && (
        <section className="py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6">
            <div className="section-heading">
              <span className="section-heading__eyebrow">Novedades</span>
              <h2 className="section-heading__title text-2xl sm:text-3xl">Lanzamientos pastel recién llegados</h2>
              <p className="section-heading__description text-sm">
                Productos marcados como nuevos dentro de las últimas horas para que no te pierdas ningún drop oficial.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {newProducts.map((product) => (
                <ProductCard key={`new-${product.id}`} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      <BannerShowcase className="py-6" startIndex={2} maxItems={2} />

      {/* Catálogo completo */}
      <section className="py-8 sm:py-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-8">
          <div className="section-heading">
            <span className="section-heading__eyebrow">Catálogo completo</span>
            <h2 className="section-heading__title text-3xl sm:text-4xl">Todos los productos</h2>
            <p className="section-heading__description">
              Mostramos 20 productos por página para mantener la experiencia ligera.
            </p>
          </div>

          {productsLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Cargando productos...</p>
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No hay productos disponibles.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-6">
                {paginatedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Página <span className="font-semibold text-slate-800">{currentPage}</span> de{' '}
                  <span className="font-semibold text-slate-800">{totalPages}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-full border border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-50"
                  >
                    ← Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-full border border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-50"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <BannerShowcase className="py-8" startIndex={4} />
    </div>
  );
}
