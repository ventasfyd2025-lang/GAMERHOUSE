'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserAuth } from '@/hooks/useUserAuth';
import { useClientSideFormat } from '@/hooks/useClientSideFormat';
import { collection, query, where, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  ShoppingBag,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  Home,
  ArrowLeft,
  Package
} from 'lucide-react';

interface OrderItem {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'pending_verification' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  shippingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    region: string;
    postalCode: string;
  };
  trackingNumber?: string;
  notes?: string;
  chatEnabled?: boolean;
}

const statusConfig = {
  pending: {
    label: 'Pendiente',
    color: 'text-amber-700 bg-amber-50 border border-amber-200',
    icon: Clock
  },
  pending_verification: {
    label: 'Verificando Pago',
    color: 'text-orange-700 bg-orange-50 border border-orange-200',
    icon: Clock
  },
  confirmed: {
    label: 'Confirmado',
    color: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
    icon: CheckCircle
  },
  preparing: {
    label: 'Preparando',
    color: 'text-yellow-700 bg-yellow-50 border border-yellow-200',
    icon: ShoppingBag
  },
  shipped: {
    label: 'Enviado',
    color: 'text-sky-700 bg-sky-50 border border-sky-200',
    icon: Truck
  },
  delivered: {
    label: 'Entregado',
    color: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
    icon: CheckCircle
  },
  cancelled: {
    label: 'Cancelado',
    color: 'text-red-700 bg-red-50 border border-red-200',
    icon: XCircle
  }
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(price);
};

export default function OrdersPage() {
  const { currentUser, userProfile, isRegistered, loading } = useUserAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const router = useRouter();
  const { formatDateTime, formatDate } = useClientSideFormat();

  // Mark admin messages as read when user visits this page
  useEffect(() => {
    if (currentUser?.email) {
      const markMessagesAsRead = async () => {
        try {
          const messagesQuery = query(
            collection(db, 'chat_messages'),
            where('userEmail', '==', currentUser.email),
            where('isAdmin', '==', true),
            where('read', '==', false)
          );

          const snapshot = await getDocs(messagesQuery);
          const batch = snapshot.docs.map(doc =>
            updateDoc(doc.ref, { read: true })
          );

          await Promise.all(batch);
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      };

      markMessagesAsRead();
    }
  }, [currentUser?.email]);

  useEffect(() => {
    if (!loading && !isRegistered) {
      router.push('/login');
      return;
    }

    if (currentUser) {
      loadOrders();
    }
  }, [currentUser, loading, isRegistered, router]);

  const loadOrders = async () => {
    if (!currentUser) return;
    
    try {
      setLoadingOrders(true);
      // Buscar pedidos por userId (uid o email)
      const ordersQuery = query(
        collection(db, 'gamerhouse_orders'),
        where('userId', '==', (currentUser as any).uid || currentUser.email)
      );
      
      const snapshot = await getDocs(ordersQuery);
      const ordersData: Order[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        ordersData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now())
        } as Order);
      });
      
      // Ordenar en el cliente
      ordersData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-200 border-t-primary mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg font-medium">Cargando tus pedidos...</p>
        </div>
      </div>
    );
  }

  if (!isRegistered) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur rounded-2xl border border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-100 border border-slate-200 text-primary shadow-inner">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Mis Pedidos</h1>
                <p className="text-slate-500 text-sm">Historial y seguimiento de tus compras</p>
              </div>
            </div>

            {/* Botón volver al home */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(to right, var(--primary), var(--primary-hover))' }}
            >
              <ArrowLeft className="h-5 w-5" />
              <Home className="h-5 w-5" />
              Volver al Home
            </Link>
          </div>
        </div>

        {loadingOrders ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-primary"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-12 text-center">
            <ShoppingBag className="h-20 w-20 text-primary mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No tienes pedidos aún</h3>
            <p className="text-lg text-slate-500 mb-8">¡Explora nuestra tienda y realiza tu primera compra!</p>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3 rounded-xl text-white font-semibold inline-flex items-center gap-2 shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(to right, var(--primary), var(--primary-hover))' }}
            >
              <ShoppingBag className="h-5 w-5" />
              Ir a la Tienda
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusInfo = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-[0_24px_60px_rgba(15,23,42,0.08)] overflow-hidden transition-shadow hover:shadow-[0_30px_80px_rgba(15,23,42,0.12)]"
                >
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-white to-slate-50 px-6 py-5 border-b border-slate-100">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          Pedido #{order.id.slice(-8).toUpperCase()}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${statusInfo.color}`}>
                          <StatusIcon className="h-4 w-4" />
                          {statusInfo.label}
                        </div>

                        <div className="text-right">
                          <p className="text-xl font-bold text-slate-900">
                            {formatPrice(order.total)}
                          </p>
                          <p className="text-sm text-slate-500">
                            {order.items.length} producto{order.items.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="p-6 bg-white">
                    {/* Items */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-4">Productos</h4>
                        <div className="space-y-4">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center gap-4">
                              {item.imagen && (
                                <img
                                  loading="lazy"
                                  src={item.imagen}
                                  alt={item.nombre}
                                  className="h-14 w-14 object-cover rounded-xl border border-slate-100"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-slate-900">{item.nombre}</p>
                                <p className="text-sm text-slate-500">
                                  Cantidad: {item.cantidad} × {formatPrice(item.precio)}
                                </p>
                              </div>
                              <p className="font-semibold text-slate-900">
                                {formatPrice(item.precio * item.cantidad)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 mb-4">Información de envío</h4>
                        <div className="text-sm text-slate-600 space-y-1">
                          <p><span className="font-semibold text-slate-900">Nombre:</span> {order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                          <p><span className="font-semibold text-slate-900">Email:</span> {order.shippingAddress.email}</p>
                          <p><span className="font-semibold text-slate-900">Teléfono:</span> {order.shippingAddress.phone}</p>
                          <p><span className="font-semibold text-slate-900">Dirección:</span> {order.shippingAddress.street}</p>
                          <p><span className="font-semibold text-slate-900">Ciudad:</span> {order.shippingAddress.city}, {order.shippingAddress.region}</p>
                          <p><span className="font-semibold text-slate-900">Código Postal:</span> {order.shippingAddress.postalCode}</p>
                          {order.trackingNumber && (
                            <p><span className="font-semibold text-slate-900">Seguimiento:</span> {order.trackingNumber}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/chat/${order.id}`}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium shadow-lg shadow-primary/30"
                          style={{ background: 'linear-gradient(to right, var(--primary), var(--primary-hover))' }}
                        >
                          <MessageSquare className="h-4 w-4" />
                          Estado del Pedido
                        </Link>

                        {order.status === 'shipped' && order.trackingNumber && (
                          <button
                            onClick={() => window.open(`https://www.correos.cl/SitePages/seguimiento/seguimiento.aspx?envio=${order.trackingNumber}`, '_blank')}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            <Truck className="h-4 w-4" />
                            Rastrear Envío
                          </button>
                        )}
                      </div>

                      <div className="text-sm text-slate-500">
                        Última actualización: {formatDate(order.updatedAt)}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
