'use client';

import { useState, useEffect, useMemo } from 'react';

export const dynamic = 'force-dynamic';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useUserAuth } from '@/hooks/useUserAuth';
import { useNotification } from '@/context/NotificationContext';
import Layout from '@/components/Layout';
import OfferPopup from '@/components/OfferPopup';
import { useOfferPopup } from '@/hooks/useOfferPopup';
import { ChevronLeftIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Package, XCircle } from 'lucide-react';

const formatDescriptionHtml = (raw?: string): string => {
  if (!raw) {
    return '';
  }

  const normalized = raw
    .replace(/\r\n?/g, '\n')
    .replace(/\\n/g, '\n');
  const sanitized = normalized
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on[a-z]+="[^"]*"/gi, '');

  const trimmed = sanitized.trim();
  if (!trimmed) {
    return '';
  }

  const hasBlockTags = /<(p|ul|ol|li|table|h\d|blockquote|img|br)/i.test(trimmed);
  if (hasBlockTags) {
    return trimmed.replace(/\n/g, '<br />');
  }

  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) {
    return trimmed.replace(/\n/g, '<br />');
  }

  return paragraphs
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br />')}</p>`)
    .join('');
};

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const { currentUser, loading: authLoading } = useUserAuth();
  const { addNotification } = useNotification();
  const { popupConfig } = useOfferPopup();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const descriptionHtml = useMemo(
    () => formatDescriptionHtml(product?.descripcion),
    [product?.descripcion]
  );
  const galleryImages = useMemo(() => {
    if (!product) return [] as string[];
    if (Array.isArray(product.imagenes) && product.imagenes.length > 0) {
      return product.imagenes;
    }
    return product?.imagen ? [product.imagen] : [];
  }, [product]);

  useEffect(() => {
    const loadProduct = async () => {
      if (!params.id) {
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // First try Firebase
        try {
          const productDoc = await getDoc(doc(db, 'gamerhouse_products', params.id as string));

          if (productDoc.exists()) {
            const firebaseData = productDoc.data();

            // Map Firebase fields to Product interface
            const productData: Product = {
              id: productDoc.id,
              sku: firebaseData.sku || '',
              nombre: firebaseData.nombre,
              precio: firebaseData.precioRebajado || firebaseData.precioNormal || 0,
              precioOriginal: firebaseData.precioNormal,
              descripcion: firebaseData.descripcion,
              imagen: firebaseData.imagenes?.[0],
              imagenes: firebaseData.imagenes,
              stock: firebaseData.stock || 0,
              categoria: firebaseData.categorias?.[0] || 'Sin categoría',
              categorias: firebaseData.categorias || [],
              marca: firebaseData.marca || '',
              activo: firebaseData.publicado !== false,
              oferta: firebaseData.precioRebajado ? true : false
            };

            console.log('Producto cargado:', productData.nombre);
            console.log('Precios:', { normal: firebaseData.precioNormal, rebajado: firebaseData.precioRebajado });
            console.log('Categorías:', productData.categorias);
            console.log('Imágenes del producto:', {
              imagen: productData.imagen,
              imagenes: productData.imagenes,
              totalImagenes: productData.imagenes?.length || 0
            });

            setProduct(productData);
            return;
          }
        } catch (firebaseErr) {
          console.error('Firebase error:', firebaseErr);
          // Firebase error, trying mock data
        }
        
        // If Firebase fails or product not found, try mock data
        const { mockProducts } = await import('@/utils/mockProducts');
        const mockProduct = mockProducts.find(p => p.id === params.id);
        
        if (mockProduct) {
          setProduct(mockProduct);
        } else {
          setError('Producto no encontrado');
        }
      } catch (err) {
        setError('Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [params.id]);

  useEffect(() => {
    if (galleryImages.length === 0) {
      setSelectedImageIndex(0);
      return;
    }
    setSelectedImageIndex((prev) => Math.min(prev, galleryImages.length - 1));
  }, [galleryImages.length]);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 0)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Verificar si el usuario está logueado
    if (!currentUser && !authLoading) {
      // Mostrar modal de confirmación para login
      const shouldLogin = window.confirm(
        '¿Deseas iniciar sesión para agregar productos al carrito?\n\n' +
        'Si inicias sesión podrás:\n' +
        '• Guardar tus productos\n' +
        '• Realizar compras más rápido\n' +
        '• Ver el historial de pedidos\n\n' +
        'Presiona OK para ir al login o Cancelar para continuar como invitado.'
      );
      
      if (shouldLogin) {
        router.push('/login');
        return;
      }
      // Si decide continuar como invitado, procede a agregar al carrito
    }

    const gallery = product.imagenes && product.imagenes.length > 0
      ? product.imagenes
      : product.imagen
        ? [product.imagen]
        : undefined;
    addItem(product.id, product.nombre, product.precio, product.imagen, quantity, product.sku, product.stock, {
      descripcion: product.descripcion,
      imagenes: gallery
    });
    addNotification({
      type: 'success',
      title: `${product.nombre} agregado`,
      message: currentUser ? 'Revisa tu carrito cuando quieras' : 'Guardado como invitado',
      duration: 3500,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center bg-[var(--surface-alt)] px-4 py-16">
          <div className="modern-card flex items-center gap-3 px-8 py-6 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-200 border-t-transparent" />
            <span className="text-sm font-medium">Cargando producto...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center bg-[var(--surface-alt)] px-4 py-16">
          <div className="modern-card w-full max-w-lg p-10 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
              <XCircle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {error || 'Producto no encontrado'}
            </h1>
            <p className="text-sm text-slate-500">
              El producto que buscas no está disponible. Revisa nuestras categorías para seguir explorando.
            </p>
            <Link 
              href="/" 
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-[var(--surface-alt)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
          <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-slate-700">Inicio</Link>
            <span>/</span>
            <Link href={`/?category=${product.categoria}`} className="capitalize hover:text-slate-700">
              {product.categoria}
            </Link>
            <span>/</span>
            <span className="text-slate-600">{product.nombre}</span>
          </nav>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Product Image Gallery */}
          <div className="space-y-5">
            {/* Main Image */}
            <div className="relative aspect-square overflow-hidden rounded-[24px] bg-white shadow-[0_35px_90px_-55px_rgba(15,23,42,0.4)]">
              {(() => {
                const images = product.imagenes && product.imagenes.length > 0
                  ? product.imagenes
                  : product.imagen
                    ? [product.imagen]
                    : [];

                return images.length > 0 ? (
                  <Image
                    src={images[selectedImageIndex] || images[0]}
                    alt={product.nombre}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <Package className="h-12 w-12" />
                  </div>
                );
              })()}

              {/* Badges */}
              <div className="absolute left-5 top-5 flex flex-col gap-2">
                {product.nuevo && (
                  <span className="modern-chip border-green-200 bg-green-50 text-green-600">Nuevo</span>
                )}
                {product.oferta && (
                  <span className="modern-chip border-rose-200 bg-rose-50 text-rose-600">Oferta especial</span>
                )}
              </div>

              {/* Navigation Arrows */}
              {(() => {
                const images = product.imagenes && product.imagenes.length > 0
                  ? product.imagenes
                  : product.imagen
                    ? [product.imagen]
                    : [];

                return images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIndex((prev) =>
                        prev === 0 ? images.length - 1 : prev - 1
                      )}
                      className="absolute left-5 top-1/2 -translate-y-1/2 rounded-full border border-white/60 bg-white/90 p-2 text-slate-700 shadow-lg shadow-slate-900/10"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex((prev) =>
                        prev === images.length - 1 ? 0 : prev + 1
                      )}
                      className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full border border-white/60 bg-white/90 p-2 text-slate-700 shadow-lg shadow-slate-900/10"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                );
              })()}
            </div>

            {/* Thumbnail Gallery */}
            {(() => {
              const images = product.imagenes && product.imagenes.length > 0
                ? product.imagenes
                : product.imagen
                  ? [product.imagen]
                  : [];

              return images.length > 1 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square overflow-hidden rounded-2xl border transition ${
                        selectedImageIndex === index
                          ? 'border-red-200 shadow-lg shadow-red-200/60'
                          : 'border-transparent'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.nombre} - imagen ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 33vw, 120px"
                      />
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 mb-2">
                {product.nombre}
              </h1>
              <p className="text-sm text-slate-600 capitalize">
                Categoría: {product.categoria}
              </p>
              {product.sku && (
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-[0.3em]">
                  SKU: {product.sku}
                </p>
              )}
            </div>

            <div className="space-y-2">
              {product.oferta && product.precioOriginal && product.precioOriginal > product.precio ? (
                <>
                  <div className="text-lg text-slate-400 line-through">
                    {formatPrice(product.precioOriginal)}
                  </div>
                  <div className="text-4xl font-bold text-slate-900">
                    {formatPrice(product.precio)}
                  </div>
                  <div className="modern-chip border-rose-200 bg-rose-50 text-rose-600">
                    {Math.round(((product.precioOriginal - product.precio) / product.precioOriginal) * 100)}% OFF
                  </div>
                </>
              ) : (
                <div className="text-4xl font-bold text-slate-900">
                  {formatPrice(product.precio)}
                </div>
              )}
            </div>

            {descriptionHtml && (
              <div className="modern-card p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Descripción</h3>
                <div
                  className="prose prose-slate max-w-none text-slate-600 [&>p]:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                />
              </div>
            )}

            {/* Stock Info */}
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Stock disponible:</span>
              <span className={`font-semibold ${
                product.stock > 10 ? 'text-emerald-600' : 
                product.stock > 0 ? 'text-amber-600' : 'text-rose-600'
              }`}>
                {product.stock > 0 ? `${product.stock} unidades` : 'Sin stock'}
              </span>
            </div>

            {product.stock > 0 && (
              <>
                {/* Quantity Selector */}
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Cantidad</span>
                  <div className="flex items-center rounded-full border border-slate-200 bg-white">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center text-lg font-semibold text-slate-900">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stock}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <div className="space-y-3">
                  <button
                    onClick={handleAddToCart}
                    className="w-full rounded-2xl bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 text-base font-semibold text-white shadow-[0_35px_80px_-45px_rgba(220,38,38,0.8)] transition-transform hover:-translate-y-0.5"
                  >
                    Agregar al carrito ({formatPrice(product.precio * quantity)})
                  </button>
                  
                  <Link
                    href="/carrito"
                    className="flex w-full items-center justify-center rounded-2xl border border-slate-200 px-6 py-4 text-base font-semibold text-slate-600 transition hover:border-slate-300"
                  >
                    Ver carrito
                  </Link>
                </div>
              </>
            )}

            {product.stock === 0 && (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-600">
                Este producto no está disponible en este momento
              </div>
            )}

            {/* Back Button */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </div>

      {/* Offer Popup */}
      <OfferPopup
        title={popupConfig.title}
        description={popupConfig.description}
        buttonText={popupConfig.buttonText}
        buttonLink={popupConfig.buttonLink}
        isActive={popupConfig.active}
        size={popupConfig.size}
        position={popupConfig.position}
        mediaUrl={popupConfig.mediaUrl}
        isVideo={popupConfig.isVideo}
        popupType={popupConfig.popupType}
        onClose={() => {}}
      />
    </Layout>
  );
}
