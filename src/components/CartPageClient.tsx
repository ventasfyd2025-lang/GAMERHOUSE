'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { Minus, Plus, Trash2, ShoppingBag, ShoppingCart, Package, CreditCard, Trash, XCircle } from 'lucide-react';

export default function CartPageClient() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    getTotalDiscount,
    getTotalPrice,
    applyDiscount,
    removeDiscount,
    appliedDiscount,
    discountsByProduct,
    discountLoading
  } = useCart();

  const [discountCode, setDiscountCode] = useState('');


  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const subtotal = getSubtotal();
  const totalDiscount = getTotalDiscount();
  const finalTotal = getTotalPrice();
  const hasDiscount = totalDiscount > 0;

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleDiscountSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const applied = await applyDiscount(discountCode);
    if (applied) {
      setDiscountCode('');
    }
  };

  const handleRemoveDiscount = () => {
    removeDiscount();
    setDiscountCode('');
  };

  const discountLabel = appliedDiscount
    ? appliedDiscount.tipo === 'porcentaje'
      ? `-${appliedDiscount.descuento}%`
      : `-${formatPrice(appliedDiscount.descuento)}`
    : null;


  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--surface-alt)] flex items-center justify-center px-4 py-16">
        <div className="modern-card w-full max-w-xl p-12 text-center space-y-6">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-50 text-red-500">
            <ShoppingBag className="h-10 w-10" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-900">Tu carrito está vacío</h1>
            <p className="text-base text-slate-600">
              Explora nuestras categorías y guarda tus productos favoritos para completar la compra cuando quieras.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 text-base font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(120deg, var(--primary), var(--primary-hover))', boxShadow: '0 25px 45px -35px rgba(220, 38, 38, 0.8)' }}
          >
            <ShoppingBag className="h-5 w-5" />
            Explorar productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-alt)] py-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="modern-card p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Resumen</p>
              <h1 className="text-2xl font-semibold text-slate-900">Carrito de compras</h1>
              <p className="text-sm text-slate-600">
                {items.length} {items.length === 1 ? 'producto' : 'productos'} seleccionados
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span className="modern-chip">Entrega en todo Chile</span>
            <span className="modern-chip">Soporte 24/7</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            {items.map((item) => {
              const productDiscountTotal = discountsByProduct[item.productId] || 0;
              const quantity = Math.max(item.cantidad, 1);
              const unitDiscount = productDiscountTotal > 0 ? productDiscountTotal / quantity : 0;
              const finalUnitPrice = Math.max(item.precio - unitDiscount, 0);
              const originalTotal = item.precio * item.cantidad;
              const finalItemTotal = Math.max(originalTotal - productDiscountTotal, 0);
              const gallery = item.imagenes && item.imagenes.length > 0
                ? item.imagenes
                : item.imagen
                  ? [item.imagen]
                  : [];
              const mainImage = gallery[0];
              const secondaryImages = gallery.slice(1, 4);
              const canDecrease = item.cantidad > 1;
              const canIncrease = item.maxStock === undefined || item.cantidad < item.maxStock;

              return (
                <div key={item.id} className="modern-card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                  <div className="flex flex-col gap-2 sm:w-28">
                    <div className="relative h-28 w-full overflow-hidden rounded-2xl bg-slate-100">
                      {mainImage ? (
                        <Image
                          src={mainImage}
                          alt={item.nombre}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 120px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    {secondaryImages.length > 0 && (
                      <div className="flex gap-2">
                        {secondaryImages.map((thumb, index) => (
                          <div key={`${item.id}-thumb-${index}`} className="relative h-12 w-12 overflow-hidden rounded-xl bg-slate-100">
                            <Image src={thumb} alt={`${item.nombre} adicional`} fill className="object-cover" sizes="48px" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <Link
                      href={`/producto/${item.productId}`}
                      className="text-base font-semibold text-slate-900 hover:text-red-500 transition-colors"
                    >
                      {item.nombre}
                    </Link>
                    {item.sku && <p className="text-xs uppercase tracking-[0.35em] text-slate-500">SKU {item.sku}</p>}
                    <div className="text-sm text-slate-600 space-y-1">
                      {unitDiscount > 0 ? (
                        <>
                          <p className="line-through text-slate-400">{formatPrice(item.precio)} c/u</p>
                          <p className="font-semibold text-slate-900">{formatPrice(finalUnitPrice)} c/u</p>
                          <p className="text-emerald-600 font-medium">Ahorro {formatPrice(unitDiscount)} por unidad</p>
                        </>
                      ) : (
                        <p className="font-semibold text-slate-900">{formatPrice(item.precio)} c/u</p>
                      )}
                      {item.descripcion && (
                        <p className="text-xs text-slate-500 line-clamp-2">{item.descripcion}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center rounded-full border border-slate-200 bg-white px-2 py-1">
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.cantidad - 1)}
                          disabled={!canDecrease}
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-slate-600 hover:bg-slate-50 ${!canDecrease ? 'opacity-40 cursor-not-allowed' : ''}`}
                          aria-label="Reducir cantidad"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center text-base font-semibold text-slate-900">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.cantidad + 1)}
                          disabled={!canIncrease}
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-slate-600 hover:bg-slate-50 ${!canIncrease ? 'opacity-40 cursor-not-allowed' : ''}`}
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      {item.maxStock !== undefined && (
                        <p className="text-xs text-slate-500">Stock disponible: {item.maxStock}</p>
                      )}
                    </div>
                    <div className="text-right min-w-[160px]">
                      <p className="text-sm text-slate-400">Total</p>
                      {productDiscountTotal > 0 ? (
                        <div className="space-y-1">
                          <p className="text-sm line-through text-slate-400">{formatPrice(originalTotal)}</p>
                          <p className="text-lg font-semibold text-slate-900">{formatPrice(finalItemTotal)}</p>
                          <p className="text-xs font-medium text-emerald-600">Ahorro {formatPrice(productDiscountTotal)}</p>
                        </div>
                      ) : (
                        <p className="text-lg font-semibold text-slate-900">
                          {formatPrice(originalTotal)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="self-end rounded-full border border-slate-200 p-2 text-slate-400 transition hover:border-rose-200 hover:text-rose-600"
                      aria-label="Eliminar del carrito"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>

          <div>
            <div className="modern-card sticky top-8 p-6 space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Resumen</p>
                <h2 className="text-xl font-semibold text-slate-900">Total del pedido</h2>
              </div>

              <form onSubmit={handleDiscountSubmit} className="space-y-3">
                <label className="text-sm font-medium text-slate-700">¿Tienes un cupón?</label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={appliedDiscount ? appliedDiscount.codigo : discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    placeholder="INGRESA TU CÓDIGO"
                    disabled={!!appliedDiscount || discountLoading}
                    className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-slate-700 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                  />
                  {appliedDiscount ? (
                    <button
                      type="button"
                      onClick={handleRemoveDiscount}
                      className="rounded-2xl border border-rose-200 px-6 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Quitar cupón
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!discountCode || discountLoading}
                      className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      {discountLoading ? 'Validando...' : 'Aplicar'}
                    </button>
                  )}
                </div>

                {appliedDiscount && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-emerald-800">Cupón {appliedDiscount.codigo}</p>
                      <p className="text-xs">{discountLabel} aplicado en productos seleccionados</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-widest text-emerald-600">Ahorro</p>
                      <p className="text-base font-semibold">{formatPrice(totalDiscount)}</p>
                    </div>
                  </div>
                )}
              </form>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
                </div>
                {hasDiscount && (
                  <div className="flex items-center justify-between text-sm text-emerald-600">
                    <span>Descuento aplicado</span>
                    <span className="font-semibold">- {formatPrice(totalDiscount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Envío estimado</span>
                  <span className="font-semibold text-slate-900">Se calcula en checkout</span>
                </div>
                <div className="h-px w-full bg-slate-100" />
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-slate-900">Total</span>
                  <span className="text-2xl font-bold text-slate-900">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(120deg, var(--primary), var(--primary-hover))', boxShadow: '0 30px 70px -45px rgba(220, 38, 38, 0.9)' }}
              >
                <CreditCard className="h-5 w-5" />
                Finalizar compra
              </Link>

              <button
                onClick={clearCart}
                className="w-full rounded-2xl border border-slate-200 px-5 py-3 text-base font-semibold text-slate-600 transition hover:border-slate-300 inline-flex items-center justify-center gap-2"
              >
                <Trash className="h-4 w-4" />
                Vaciar carrito
              </button>

              <Link
                href="/"
                className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
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
