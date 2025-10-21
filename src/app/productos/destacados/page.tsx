'use client';

import Link from 'next/link';
import { useProducts } from '@/hooks/useProducts';
import { useHomepageConfig } from '@/hooks/useHomepageConfig';
import { useCart } from '@/context/CartContext';
import UnifiedHeader from '@/components/UnifiedHeader';
import { HeartIcon } from '@heroicons/react/24/outline';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(price);
};

export default function ProductosDestacados() {
  const { products, loading: productsLoading } = useProducts();
  const { homepageConfig, loading: homepageLoading } = useHomepageConfig();
  const { addItem } = useCart();

  // Filtrar productos con stock
  const productsInStock = products.filter(p => (p.stock || 0) > 0);

  // Filtrar productos destacados
  const featuredProducts = homepageConfig.featuredProducts.length > 0
    ? productsInStock.filter(p => homepageConfig.featuredProducts.includes(p.id))
    : [];

  const handleAddToCart = (product: any) => {
    addItem(product.id, product.nombre, product.precio, product.imagen, 1, product.sku);
  };

  if (productsLoading || homepageLoading) {
    return (
      <div className="min-h-screen bg-dark">
        <UnifiedHeader />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 pb-16">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-dark-light rounded w-1/3"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-dark/80 rounded-lg shadow-md p-4 space-y-4">
                  <div className="h-48 bg-dark-light rounded"></div>
                  <div className="h-4 bg-dark-light rounded w-3/4"></div>
                  <div className="h-6 bg-dark-light rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      <UnifiedHeader />
      
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            ⭐ Productos Destacados
          </h1>
          <p className="text-primary/80">
            Descubre nuestra selección especial de productos destacados
          </p>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No hay productos destacados
            </h3>
            <p className="text-primary/60 mb-6">
              Aún no se han configurado productos destacados desde el panel de administración
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary transition-colors"
            >
              Ver todos los productos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div key={product.id} className="bg-dark/80 rounded-lg shadow-md hover:shadow-xl shadow-cyan-500/30 transition-all duration-300 overflow-hidden group">
                {/* Image */}
                <div className="relative h-48 bg-dark-light">
                  {product.imagen ? (
                    <img
                      src={product.imagen}
                      alt={product.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary/50 text-6xl">
                      📦
                    </div>
                  )}
                  {product.oferta && (
                    <span className="absolute top-2 left-2 bg-pink text-white text-xs font-bold px-2 py-1 rounded-full">
                      OFERTA
                    </span>
                  )}
                  <button className="absolute top-2 right-2 p-2 bg-dark/80/80 rounded-full hover:bg-dark/80 transition-colors">
                    <HeartIcon className="h-5 w-5 text-primary/80" />
                  </button>
                </div>
                
                {/* Content */}
                <div className="p-4 space-y-3">
                  <div className="text-xs text-primary uppercase tracking-wide font-semibold">
                    {product.categoria}
                  </div>
                  <h3 className="font-bold text-white line-clamp-2">
                    {product.nombre}
                  </h3>
                  <p className="text-sm text-primary/80 line-clamp-2">
                    {product.descripcion}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold text-white">
                      {formatPrice(product.precio)}
                    </div>
                    {product.stock > 0 ? (
                      <span className="text-sm text-green-600 font-medium">
                        En stock
                      </span>
                    ) : (
                      <span className="text-sm text-pink font-medium">
                        Sin stock
                      </span>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock <= 0}
                    className="w-full py-3 px-4 bg-primary hover:bg-primary disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105"
                  >
                    <span>🛒</span>
                    <span>{product.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
