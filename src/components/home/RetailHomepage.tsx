'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { useCategories } from '@/hooks/useCategories';
import { ShoppingCart, Search, Zap } from 'lucide-react';
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

  // Filter products - only show in stock
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => (p.stock || 0) > 0);

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(p => {
        const cats = getProductCategoryCandidates(p);
        return cats.some(c => c.toLowerCase().includes(selectedCategory.toLowerCase()));
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.nombre?.toLowerCase().includes(query) ||
        p.descripcion?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, selectedCategory, searchQuery]);

  // Get featured products
  const featuredProducts = useMemo(() => {
    return filteredProducts.slice(0, 4);
  }, [filteredProducts]);

  // Get best sellers
  const bestSellers = useMemo(() => {
    return filteredProducts.slice(4, 8);
  }, [filteredProducts]);

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
    const descuento = precioOriginal && precio ? Math.round(((precioOriginal - precio) / precioOriginal) * 100) : 0;

    return (
      <div className="group relative h-full overflow-hidden rounded-xl border border-purple-500/20 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm hover:border-cyan-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20">
        {/* Image Container */}
        <div className="relative h-72 w-full overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800">
          <Image
            src={product.imagenes?.[0] || product.imagen || '/placeholder.png'}
            alt={product.nombre}
            fill
            className="object-cover transition-all duration-500 group-hover:scale-125 group-hover:brightness-110"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Discount Badge */}
          {descuento > 0 && (
            <div className="absolute top-4 right-4 bg-gradient-to-r from-red-600 to-pink-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
              -{descuento}%
            </div>
          )}

          {/* Stock Badge */}
          <div className="absolute bottom-3 left-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold opacity-90">
            {product.stock} en stock
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col h-48">
          {/* Title */}
          <h3 className="text-sm font-bold text-white line-clamp-2 mb-3 group-hover:text-cyan-300 transition-colors">
            {product.nombre}
          </h3>

          {/* Price Section */}
          <div className="mb-auto">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                ${precio?.toLocaleString() || 'N/A'}
              </span>
              {precioOriginal && precio && precioOriginal > precio && (
                <span className="text-sm text-gray-400 line-through">
                  ${precioOriginal.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={() => handleAddToCart(product)}
            className="w-full mt-4 py-3 px-4 rounded-lg font-bold text-white text-sm
              bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600
              hover:from-cyan-600 hover:via-blue-600 hover:to-purple-700
              shadow-lg hover:shadow-2xl hover:shadow-cyan-500/50
              transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5
              flex items-center justify-center gap-2"
          >
            <ShoppingCart size={18} />
            Agregar al carrito
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              🎮 GAMERHOUSE
            </div>

            {/* Search */}
            <div className="hidden md:flex flex-1 mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Link href="/carrito" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                🛒
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-20">
          <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 group">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 via-blue-900/40 to-cyan-900/40 opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]" />

            {/* Content */}
            <div className="relative p-16 md:p-24 flex items-center justify-between min-h-96">
              <div className="flex-1 z-10">
                <div className="mb-4 inline-block px-4 py-2 rounded-full border border-cyan-500/50 bg-cyan-500/10">
                  <span className="text-cyan-300 text-sm font-semibold">🎮 Gaming & Collectibles</span>
                </div>

                <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
                  <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    GAMERHOUSE
                  </span>
                </h1>

                <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed font-light">
                  La tienda definitiva para gamers, coleccionistas y entusiastas de la tecnología
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-cyan-500/50 transform hover:scale-105"
                  >
                    Ver Catálogo
                  </button>
                  <Link
                    href="/productos"
                    className="px-8 py-4 border-2 border-purple-500 text-purple-300 hover:bg-purple-500/10 rounded-lg font-bold text-lg transition-all duration-300 backdrop-blur-sm"
                  >
                    Explorar Más
                  </Link>
                </div>
              </div>

              {/* Decorative Element */}
              <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 text-9xl opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                🎮
              </div>
            </div>
          </div>
        </div>

        {/* Categories Filter */}
        <div className="mb-16">
          <h2 className="text-3xl font-black mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Explora por Categoría
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-4 scroll-smooth">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-3 rounded-lg font-bold transition-all duration-300 whitespace-nowrap backdrop-blur-sm border ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/50'
                  : 'bg-slate-800/50 border-slate-700 text-gray-200 hover:border-cyan-500/50 hover:bg-slate-700/50'
              }`}
            >
              🏠 Todos
            </button>
            {categories.map(
              cat =>
                cat.id !== 'all' && (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-6 py-3 rounded-lg font-bold transition-all duration-300 whitespace-nowrap backdrop-blur-sm border ${
                      selectedCategory === cat.id
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/50'
                        : 'bg-slate-800/50 border-slate-700 text-gray-200 hover:border-cyan-500/50 hover:bg-slate-700/50'
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                )
            )}
          </div>
        </div>

        {/* Featured Section */}
        {featuredProducts.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="text-yellow-400" size={24} />
              <h2 className="text-3xl font-bold">Destacados</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* Best Sellers */}
        {bestSellers.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-6">Los Más Vendidos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestSellers.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* All Products Grid */}
        <div>
          <div className="mb-8">
            <h2 className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              {searchQuery ? `Resultados para: "${searchQuery}"` : 'Catálogo Completo'}
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-cyan-500 to-purple-500 rounded mt-3"></div>
          </div>

          {productsLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-gray-400">Cargando productos...</div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-gray-400">No hay productos disponibles en esta categoría</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="mt-20 relative rounded-2xl overflow-hidden border border-purple-500/30 group">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 via-blue-900/30 to-cyan-900/30 group-hover:from-purple-900/50 group-hover:via-blue-900/50 group-hover:to-cyan-900/50 transition-all duration-500" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(168,85,247,0.1),transparent_50%)]" />

          {/* Content */}
          <div className="relative p-12 md:p-16 text-center">
            <h3 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              ¿Necesitas algo más?
            </h3>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Accede a nuestro catálogo completo con filtros avanzados, búsqueda inteligente y las mejores ofertas
            </p>
            <Link
              href="/productos"
              className="inline-block px-10 py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-700 rounded-lg font-bold text-lg text-white transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-cyan-500/50 transform hover:scale-105 hover:-translate-y-1"
            >
              Explorar Catálogo Completo →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
