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

  // Filter products
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
      <div className="group relative bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-cyan-500 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/50">
        {/* Image */}
        <div className="relative h-64 w-full overflow-hidden bg-gray-800">
          <Image
            src={product.imagenes?.[0] || product.imagen || '/placeholder.png'}
            alt={product.nombre}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
          {descuento > 0 && (
            <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
              -{descuento}%
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-white line-clamp-2 mb-2">
            {product.nombre}
          </h3>

          {/* Price */}
          <div className="mb-3">
            <div className="text-xl font-bold text-cyan-400">
              ${precio?.toLocaleString() || 'N/A'}
            </div>
            {precioOriginal && precio && precioOriginal > precio && (
              <div className="text-xs text-gray-500 line-through">
                ${precioOriginal.toLocaleString()}
              </div>
            )}
          </div>

          {/* Stock */}
          <div className="mb-3 text-xs text-gray-400">
            Stock: {product.stock || 0}
          </div>

          {/* Add to cart button */}
          <button
            onClick={() => handleAddToCart(product)}
            disabled={!product.stock}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-2 rounded font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ShoppingCart size={16} />
            {product.stock ? 'Agregar' : 'Agotado'}
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
        <div className="mb-16">
          <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border border-cyan-500/30 p-12 flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Bienvenido a GAMERHOUSE
              </h1>
              <p className="text-xl text-gray-300 mb-6">
                La tienda definitiva para gamers y coleccionistas
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-bold transition-colors"
                >
                  Ver Todo
                </button>
                <Link
                  href="/productos"
                  className="px-6 py-3 border border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 rounded-lg font-bold transition-colors"
                >
                  Explorar Más
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex text-8xl opacity-20">
              🎮
            </div>
          </div>
        </div>

        {/* Categories Filter */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Categorías</h2>
          <div className="flex gap-3 overflow-x-auto pb-4 scroll-smooth">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-cyan-500 text-black'
                  : 'bg-gray-800 hover:bg-gray-700 text-white'
              }`}
            >
              Todos
            </button>
            {categories.map(
              cat =>
                cat.id !== 'all' && (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                      selectedCategory === cat.id
                        ? 'bg-cyan-500 text-black'
                        : 'bg-gray-800 hover:bg-gray-700 text-white'
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
          <h2 className="text-3xl font-bold mb-6">
            {searchQuery ? `Resultados para: "${searchQuery}"` : 'Todos los Productos'}
          </h2>

          {productsLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-400">Cargando productos...</div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-400">No hay productos disponibles</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="mt-16 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border border-cyan-500/30 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">¿Buscas algo específico?</h3>
          <p className="text-gray-300 mb-6">Explora nuestro catálogo completo con filtros avanzados</p>
          <Link
            href="/productos"
            className="inline-block px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg font-bold transition-all"
          >
            Ver Catálogo Completo
          </Link>
        </div>
      </div>
    </div>
  );
}
