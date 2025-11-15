'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';

export default function CartPageClient() {
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCart();


  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };


  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--surface-alt)] flex items-center justify-center px-4 py-16">
        <div className="modern-card w-full max-w-xl p-12 text-center space-y-6">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-50 text-red-500">
            <ShoppingBag className="h-10 w-10" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-900">Tu carrito está vacío</h1>
            <p className="text-base text-slate-500">
              Explora nuestras categorías y guarda tus productos favoritos para completar la compra cuando quieras.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full px-8 py-3 text-base font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(120deg, var(--primary), var(--primary-hover))', boxShadow: '0 25px 45px -35px rgba(220, 38, 38, 0.8)' }}
          >
            🛍️ Explorar productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-alt)] py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="modern-card p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              🛒
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Resumen</p>
              <h1 className="text-2xl font-semibold text-slate-900">Carrito de compras</h1>
              <p className="text-sm text-slate-500">
                {items.length} {items.length === 1 ? 'producto' : 'productos'} seleccionados
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="modern-chip">Entrega en todo Chile</span>
            <span className="modern-chip">Soporte 24/7</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="modern-card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative h-24 w-full overflow-hidden rounded-2xl bg-slate-100 sm:h-24 sm:w-24">
                    {item.imagen ? (
                      <Image
                        src={item.imagen}
                        alt={item.nombre}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 96px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl">📦</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <Link
                      href={`/producto/${item.productId}`}
                      className="text-base font-semibold text-slate-900 hover:text-red-500 transition-colors"
                    >
                      {item.nombre}
                    </Link>
                    {item.sku && <p className="text-xs uppercase tracking-[0.35em] text-slate-400">SKU {item.sku}</p>}
                    <p className="text-sm font-medium text-slate-500">{formatPrice(item.precio)} c/u</p>
                  </div>

                  <div className="flex w-full items-center justify-between gap-4 sm:w-auto">
                    <div className="flex items-center rounded-full border border-slate-200 bg-white px-2 py-1">
                      <button
                        onClick={() => handleQuantityChange(item.productId, item.cantidad - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50"
                        aria-label="Reducir cantidad"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-base font-semibold text-slate-900">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.productId, item.cantidad + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">Total</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {formatPrice(item.precio * item.cantidad)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:border-rose-200 hover:text-rose-600"
                      aria-label="Eliminar del carrito"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="modern-card sticky top-8 p-6 space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Resumen</p>
                <h2 className="text-xl font-semibold text-slate-900">Total del pedido</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatPrice(getTotalPrice())}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Envío estimado</span>
                  <span className="font-semibold text-slate-900">Se calcula en checkout</span>
                </div>
                <div className="h-px w-full bg-slate-100" />
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-slate-900">Total</span>
                  <span className="text-2xl font-bold text-slate-900">{formatPrice(getTotalPrice())}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-base font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(120deg, var(--primary), var(--primary-hover))', boxShadow: '0 30px 70px -45px rgba(220, 38, 38, 0.9)' }}
              >
                💳 Finalizar compra
              </Link>

              <button
                onClick={clearCart}
                className="w-full rounded-2xl border border-slate-200 px-5 py-3 text-base font-semibold text-slate-600 transition hover:border-slate-300"
              >
                🗑️ Vaciar carrito
              </button>

              <Link
                href="/"
                className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
              >
                ← Seguir comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
