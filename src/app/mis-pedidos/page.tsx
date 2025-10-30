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
  ArrowLeft
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
    color: 'text-yellow-600 bg-yellow-50',
    icon: Clock
  },
  pending_verification: {
    label: 'Verificando Pago',
    color: 'text-red-600 bg-yellow-50',
    icon: Clock
  },
  confirmed: {
    label: 'Confirmado',
    color: 'text-green-600 bg-green-50',
    icon: CheckCircle
  },
  preparing: {
    label: 'Preparando',
    color: 'text-yellow-500 bg-yellow-50',
    icon: ShoppingBag
  },
  shipped: {
    label: 'Enviado',
    color: 'text-primary bg-darklight',
    icon: Truck
  },
  delivered: {
    label: 'Entregado',
    color: 'text-green-600 bg-green-50',
    icon: CheckCircle
  },
  cancelled: {
    label: 'Cancelado',
    color: 'text-pink bg-darklight',
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
      <div className="min-h-screen bg-gradient-to-br from-dark-light via-dark-light to-dark-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-primary/80 text-lg font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isRegistered) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-light via-dark-light to-dark-light py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-dark/80/90 backdrop-blur-sm rounded-xl shadow-xl shadow-red-600/30 p-6 border border-dark-light mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20" style={{ backgroundColor: 'var(--primary)' }}>
                <span className="text-white text-lg">📦</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Mis Pedidos</h1>
                <p className="text-primary/80 text-sm">Historial y seguimiento de tus compras</p>
              </div>
            </div>

            {/* Botón volver al home */}
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg shadow-red-600/20 gap-2"
              style={{ background: 'linear-gradient(to right, var(--primary), var(--primary-hover))' }}
            >
              <ArrowLeft className="h-5 w-5" />
              <Home className="h-5 w-5" />
              Volver al Home
            </Link>
          </div>
        </div>

        {loadingOrders ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-dark/80/90 backdrop-blur-sm rounded-xl shadow-xl shadow-red-600/30 p-12 border border-dark-light text-center">
            <ShoppingBag className="h-24 w-24 text-orange-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">No tienes pedidos aún</h3>
            <p className="text-lg text-primary/80 mb-8">¡Explora nuestra tienda y realiza tu primera compra!</p>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg shadow-red-600/20"
              style={{ background: 'linear-gradient(to right, var(--primary), var(--primary-hover))' }}
            >
              🛍️ Ir a la Tienda
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusInfo = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = statusInfo.icon;

              return (
                <div key={order.id} className="bg-dark/80/90 backdrop-blur-sm rounded-xl shadow-xl shadow-red-600/30 border border-dark-light overflow-hidden hover:shadow-2xl transition-all">
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-dark-light to-dark-light px-6 py-4 border-b border-dark-light">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            Pedido #{order.id.slice(-8).toUpperCase()}
                          </h3>
                          <p className="text-sm text-primary/80">
                            {formatDateTime(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                          <StatusIcon className="h-4 w-4 mr-1" />
                          {statusInfo.label}
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-bold text-white">
                            {formatPrice(order.total)}
                          </p>
                          <p className="text-sm text-primary/80">
                            {order.items.length} producto{order.items.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="p-6">
                    {/* Items */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-white mb-3">Productos</h4>
                        <div className="space-y-3">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              {item.imagen && (
                                <img
                                  loading="lazy"
                                  src={item.imagen}
                                  alt={item.nombre}
                                  className="h-12 w-12 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-white">{item.nombre}</p>
                                <p className="text-sm text-primary/80">
                                  Cantidad: {item.cantidad} × {formatPrice(item.precio)}
                                </p>
                              </div>
                              <p className="font-medium text-white">
                                {formatPrice(item.precio * item.cantidad)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-white mb-3">Información de Envío</h4>
                        <div className="text-sm text-primary/80 space-y-1">
                          <p><span className="font-medium">Nombre:</span> {order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                          <p><span className="font-medium">Email:</span> {order.shippingAddress.email}</p>
                          <p><span className="font-medium">Teléfono:</span> {order.shippingAddress.phone}</p>
                          <p><span className="font-medium">Dirección:</span> {order.shippingAddress.street}</p>
                          <p><span className="font-medium">Ciudad:</span> {order.shippingAddress.city}, {order.shippingAddress.region}</p>
                          <p><span className="font-medium">Código Postal:</span> {order.shippingAddress.postalCode}</p>
                          {order.trackingNumber && (
                            <p><span className="font-medium">Seguimiento:</span> {order.trackingNumber}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 pt-4 border-t border-primary/30">
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-3">
                          <Link
                            href={`/chat/${order.id}`}
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Estado del Pedido
                          </Link>
                          
                          {order.status === 'shipped' && order.trackingNumber && (
                            <button
                              onClick={() => window.open(`https://www.correos.cl/SitePages/seguimiento/seguimiento.aspx?envio=${order.trackingNumber}`, '_blank')}
                              className="flex items-center px-4 py-2 border border-primary/40 text-primary rounded-lg hover:bg-dark transition-colors"
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Rastrear Envío
                            </button>
                          )}
                        </div>

                        <div className="text-sm text-primary/60">
                          Última actualización: {formatDate(order.updatedAt)}
                        </div>
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