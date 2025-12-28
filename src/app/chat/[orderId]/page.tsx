'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useUserAuth } from '@/hooks/useUserAuth';
import { useClientSideFormat } from '@/hooks/useClientSideFormat';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import optimizeImageFile from '@/utils/imageProcessing';
import { db, storage } from '@/lib/firebase';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserIcon,
  CheckIcon,
  PhotoIcon,
  XMarkIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ChatMessage {
  id: string;
  orderId: string;
  userId: string;
  message: string;
  isAdmin: boolean;
  timestamp: Date;
  read: boolean;
  userEmail?: string;
  userName?: string;
  imageUrl?: string;
  imageFileName?: string;
}

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
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
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
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200', 
    icon: ClockIcon,
    description: 'Tu pedido ha sido recibido y está siendo procesado'
  },
  confirmed: { 
    label: 'Confirmado', 
    color: 'text-red-600 bg-yellow-50 border-orange-200', 
    icon: CheckCircleIcon,
    description: 'Tu pedido ha sido confirmado y será preparado pronto'
  },
  preparing: { 
    label: 'Preparando', 
    color: 'text-yellow-500 bg-yellow-50 border-yellow-300', 
    icon: CheckCircleIcon,
    description: 'Estamos preparando tu pedido para el envío'
  },
  shipped: { 
    label: 'Enviado', 
    color: 'text-sky-700 bg-sky-50 border-sky-200', 
    icon: TruckIcon,
    description: 'Tu pedido está en camino'
  },
  delivered: { 
    label: 'Entregado', 
    color: 'text-green-600 bg-green-50 border-green-200', 
    icon: CheckCircleIcon,
    description: '¡Tu pedido ha sido entregado exitosamente!'
  },
  cancelled: {
    label: 'Cancelado',
    color: 'text-rose-700 bg-rose-50 border-rose-200',
    icon: XCircleIcon,
    description: 'Este pedido ha sido cancelado'
  },
  pending_verification: {
    label: 'Pendiente de verificación',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    icon: ClockIcon,
    description: 'Hemos recibido tu comprobante de pago y estamos verificando la transferencia'
  }
};

const getTimelineSteps = (status: string) => {
  const steps = [
    { key: 'pending', label: 'Pedido recibido' },
    { key: 'pending_verification', label: 'Verificando pago' },
    { key: 'confirmed', label: 'Confirmado' },
    { key: 'preparing', label: 'Preparando' },
    { key: 'shipped', label: 'Enviado' },
    { key: 'delivered', label: 'Entregado' }
  ];

  const statusOrder = ['pending', 'pending_verification', 'confirmed', 'preparing', 'shipped', 'delivered'];
  const currentIndex = statusOrder.indexOf(status);
  
  return steps.map((step, index) => ({
    ...step,
    completed: index <= currentIndex,
    current: index === currentIndex
  }));
};

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const { currentUser, isRegistered, loading: authLoading } = useUserAuth();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [orderLoading, setOrderLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { formatTime } = useClientSideFormat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      setOrderLoading(true);
      const orderDoc = await getDoc(doc(db, 'gamerhouse_orders', orderId));
      if (orderDoc.exists()) {
        const data = orderDoc.data();
        setOrder({
          id: orderDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Order);
      }
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setOrderLoading(false);
    }
  }, [orderId]);

  const loadMessages = useCallback(() => {
    if (!currentUser || !isRegistered || !orderId) return undefined;

    // Use userEmail for consistent filtering across all user types
    const userEmail = currentUser.email;
    const messagesQuery = query(
      collection(db, 'chat_messages'),
      where('orderId', '==', orderId),
      where('userEmail', '==', userEmail)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const chatMessages: ChatMessage[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        chatMessages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as ChatMessage);
      });

      // Ordenar por timestamp en el cliente
      chatMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      setMessages(chatMessages);
      
      // Mark admin messages as read
      const unreadAdminMessages = chatMessages.filter(msg => !msg.read && msg.isAdmin);
      unreadAdminMessages.forEach(msg => {
        updateDoc(doc(db, 'chat_messages', msg.id), { read: true });
      });
    }, (error) => {
      console.error('Error loading messages:', error);
    });

    return unsubscribe;
  }, [currentUser, isRegistered, orderId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!authLoading && (!currentUser || !isRegistered)) {
      router.push('/login');
      return;
    }

    if (!currentUser || !isRegistered) return;

    loadOrder();
    const unsubscribe = loadMessages();

    return () => {
      unsubscribe?.();
    };
  }, [authLoading, currentUser, isRegistered, loadMessages, loadOrder, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || !currentUser || !isRegistered || sendingMessage || !orderId) return;

    const userId = 'uid' in currentUser ? currentUser.uid : null;
    if (!userId) {
      console.error('No UID available for current user. Unable to send message.');
      return;
    }

    setSendingMessage(true);
    setUploadingImage(true);

    try {
      let imageUrl = '';
      let imageFileName = '';

      // Upload image if selected
      if (selectedImage) {
        const optimizedImage = await optimizeImageFile(selectedImage);
        const timestamp = new Date().getTime();
        const fileName = `chat-images/${orderId}/${timestamp}-${optimizedImage.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, optimizedImage);
        imageUrl = await getDownloadURL(storageRef);
        imageFileName = selectedImage.name; // Keep original name for display
      }

      const messageData = {
        orderId,
        userId,
        userEmail: currentUser.email,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        message: newMessage.trim() || (imageUrl ? 'Imagen compartida' : ''),
        isAdmin: false,
        timestamp: serverTimestamp(),
        read: false,
        ...(imageUrl && { imageUrl, imageFileName })
      };

      await addDoc(collection(db, 'chat_messages'), messageData);
      setNewMessage('');
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
      setUploadingImage(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona solo archivos de imagen');
        return;
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen debe ser menor a 5MB');
        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (authLoading || orderLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-slate-50 to-white px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-xl shadow-slate-200/60">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Pedido no encontrado</h1>
          <p className="text-slate-600">Verifica el enlace o comunícate con soporte si crees que es un error.</p>
          <Link href="/mis-pedidos" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-secondary transition-colors">
            <ArrowLeftIcon className="h-4 w-4" />
            Volver a mis pedidos
          </Link>
        </div>
      </div>
    );
  }

  const timelineSteps = getTimelineSteps(order.status);

  // Protección defensiva para estados no definidos
  const currentStatusConfig = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = currentStatusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/mis-pedidos"
                className="text-primary hover:text-secondary transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  Chat - Pedido #{orderId.slice(-8).toUpperCase()}
                </h1>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${currentStatusConfig.color}`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {currentStatusConfig.label}
                </div>
              </div>
            </div>
            
            <Link
              href="/"
              className="text-red-500 hover:text-red-600 font-medium text-sm"
            >
              Volver a la tienda
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timeline & Order Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Timeline */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Estado del Pedido</h3>
              
              <div className="space-y-4">
                {timelineSteps.map((step, index) => (
                  <div key={step.key} className="flex items-center">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      step.completed 
                        ? 'bg-primary text-white' 
                        : step.current
                        ? 'bg-yellow-100 border-2 border-primary text-primary'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {step.completed ? (
                        <CheckIcon className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className="ml-4">
                      <p className={`text-sm font-medium ${
                        step.completed || step.current ? 'text-slate-900' : 'text-slate-500'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={`mt-4 p-3 rounded-lg border ${currentStatusConfig.color}`}>
                <p className="text-sm text-slate-700">{currentStatusConfig.description}</p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Resumen del Pedido</h3>
              
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    {item.imagen && (
                      <Image
                        src={item.imagen}
                        alt={item.nombre}
                        width={48}
                        height={48}
                        className="h-12 w-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{item.nombre}</p>
                      <p className="text-xs text-slate-500">
                        {item.cantidad} × {formatPrice(item.precio)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-3 mt-4">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="bg-white/90 border-b border-slate-100 rounded-t-2xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-primary/10 text-primary border border-primary/20">
                      <ShieldCheckIcon className="h-6 w-6" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Soporte Gamer House</p>
                    <h3 className="font-semibold text-slate-900">Especialistas en pedidos</h3>
                    <div className="flex items-center space-x-1 text-slate-500 text-sm">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <p>En línea</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ChatBubbleLeftRightIcon className="h-8 w-8 text-primary" />
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-2">¡Hola! 👋</h4>
                    <p className="text-sm text-slate-600 mb-1">Estamos aquí para ayudarte con tu pedido</p>
                    <p className="text-xs text-slate-500">Escríbenos cualquier pregunta o inquietud</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isAdmin ? 'justify-start' : 'justify-end'} items-end space-x-2`}
                    >
                      {message.isAdmin && (
                        <div className="w-8 h-8 bg-primary/15 text-primary border border-primary/30 rounded-full flex items-center justify-center flex-shrink-0">
                          <ShieldCheckIcon className="h-4 w-4" />
                        </div>
                      )}
                      
                      <div className={`max-w-xs lg:max-w-md ${message.isAdmin ? 'order-2' : 'order-1'}`}>
                        {message.isAdmin && (
                          <div className="text-xs text-slate-500 mb-1 px-3">Soporte Gamer House</div>
                        )}
                        
                        <div
                          className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
                            message.isAdmin
                              ? 'bg-white text-slate-900 border border-slate-200'
                              : 'bg-gradient-to-r from-primary to-secondary text-white shadow-primary/30'
                          }`}
                        >
                          {message.imageUrl ? (
                            <div className="space-y-2">
                              <div className="relative">
                                <Image
                                  src={message.imageUrl}
                                  alt={message.imageFileName || 'Imagen compartida'}
                                  width={250}
                                  height={200}
                                  className="rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(message.imageUrl, '_blank')}
                                />
                              </div>
                              {message.message && message.message !== 'Imagen compartida' && (
                                <p className="whitespace-pre-wrap">{message.message}</p>
                              )}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{message.message}</p>
                          )}
                        </div>
                        
                        <div className={`flex items-center mt-1 px-3 ${message.isAdmin ? 'justify-start' : 'justify-end'}`}>
                          <span className="text-xs text-slate-400">
                            {formatTime(message.timestamp, {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {!message.isAdmin && (
                            <div className="ml-2">
                              {message.read ? (
                                <div className="flex space-x-1">
                                  <CheckIcon className="h-3 w-3 text-primary" />
                                  <CheckIcon className="h-3 w-3 text-primary -ml-1" />
                                </div>
                              ) : (
                                <CheckIcon className="h-3 w-3 text-slate-400" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {!message.isAdmin && (
                        <div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <UserIcon className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-slate-100 p-4 bg-white rounded-b-2xl">
                {/* Image Preview */}
                {imagePreview && (
                  <div className="mb-4 relative inline-block">
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-48 max-h-32 rounded-lg object-cover border-2 border-orange-200"
                      />
                      <button
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{selectedImage?.name}</p>
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <div className="relative">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Escribe tu mensaje sobre el pedido..."
                        className="w-full resize-none border border-slate-200 rounded-2xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent max-h-24"
                        rows={2}
                        disabled={sendingMessage || uploadingImage}
                      />

                      {/* Image Upload Button */}
                      <div className="absolute bottom-3 right-3">
                        <input
                          type="file"
                          id="imageUpload"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          disabled={sendingMessage || uploadingImage}
                        />
                        <label
                          htmlFor="imageUpload"
                          className={`cursor-pointer p-1.5 rounded-full transition-colors ${
                            sendingMessage || uploadingImage
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-500 hover:text-primary hover:bg-primary/10'
                          }`}
                        >
                          <PhotoIcon className="h-5 w-5" />
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={sendMessage}
                    disabled={(!newMessage.trim() && !selectedImage) || sendingMessage || uploadingImage}
                    className="bg-gradient-to-r from-primary to-secondary text-slate-900 px-5 py-3 rounded-2xl font-semibold shadow-lg shadow-primary/30 transition-all duration-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed hover:-translate-y-0.5"
                  >
                    {sendingMessage || uploadingImage ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      <PaperAirplaneIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-500 mt-3 text-center">
                  Responderemos lo antes posible durante horario laboral • Puedes enviar imágenes (máx. 5MB)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
