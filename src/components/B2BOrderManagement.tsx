'use client';

import { useState } from 'react';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useProducts } from '@/hooks/useProducts';
import { useUserAuth } from '@/hooks/useUserAuth';
import { PurchaseOrder, B2BCustomer, PurchaseOrderItem, B2BQuote } from '@/types';
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface B2BOrderManagementProps {
  className?: string;
}

export default function B2BOrderManagement({ className }: B2BOrderManagementProps) {
  const {
    purchaseOrders,
    b2bCustomers,
    quotes,
    loading,
    createPurchaseOrder,
    createQuote,
    createB2BCustomer,
    updatePOStatus,
    convertQuoteToPO,
    deletePurchaseOrder,
    deleteQuote
  } = usePurchaseOrders();

  const { products } = useProducts();
  const { currentUser } = useUserAuth();

  const [activeTab, setActiveTab] = useState<'orders' | 'quotes' | 'customers'>('orders');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [createMode, setCreateMode] = useState<'po' | 'quote'>('po');

  // Create PO/Quote form state
  const [formData, setFormData] = useState({
    customerId: '',
    items: [] as PurchaseOrderItem[],
    requestedDeliveryDate: '',
    notes: '',
    internalNotes: '',
    paymentTerms: '',
    shipping: 0,
    discount: 0
  });

  // Customer form state
  const [customerData, setCustomerData] = useState({
    companyName: '',
    businessType: '',
    rut: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      region: '',
      postalCode: '',
      country: 'Chile'
    },
    contactPerson: {
      name: '',
      position: '',
      email: '',
      phone: ''
    },
    creditLimit: 0,
    creditTerms: 30,
    discount: 0,
    isActive: true
  });

  // New item state
  const [newItem, setNewItem] = useState({
    productId: '',
    quantity: 1,
    specifications: ''
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-darklight text-white';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-orange-100 text-secondary';
      case 'processing': return 'bg-yellow-100 text-amber-800';
      case 'shipped': return 'bg-yellow-100 text-secondary';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-darklight text-pink';
      case 'sent': return 'bg-orange-100 text-secondary';
      case 'viewed': return 'bg-yellow-100 text-amber-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-darklight text-pink';
      case 'expired': return 'bg-darklight text-white';
      default: return 'bg-darklight text-white';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const addItemToOrder = () => {
    if (!newItem.productId || newItem.quantity <= 0) return;

    const product = products.find(p => p.id === newItem.productId);
    if (!product) return;

    const unitPrice = product.precio;
    const totalPrice = unitPrice * newItem.quantity;

    const item: PurchaseOrderItem = {
      id: `${Date.now()}-${newItem.productId}`,
      productId: newItem.productId,
      productName: product.nombre,
      sku: product.sku,
      quantity: newItem.quantity,
      unitPrice,
      totalPrice,
      specifications: newItem.specifications
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));

    setNewItem({
      productId: '',
      quantity: 1,
      specifications: ''
    });
  };

  const removeItemFromOrder = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const handleCreateOrder = async () => {
    if (!formData.customerId || formData.items.length === 0 || !currentUser) return;

    try {
      if (createMode === 'po') {
        await createPurchaseOrder(
          formData.customerId,
          formData.items,
          formData,
          (currentUser as any)?.uid || currentUser.email
        );
      } else {
        await createQuote(
          formData.customerId,
          formData.items,
          formData,
          (currentUser as any)?.uid || currentUser.email
        );
      }

      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating order/quote:', error);
      alert('Error al crear: ' + (error as Error).message);
    }
  };

  const handleCreateCustomer = async () => {
    try {
      await createB2BCustomer(customerData);
      setShowCustomerModal(false);
      resetCustomerForm();
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Error al crear cliente: ' + (error as Error).message);
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      items: [],
      requestedDeliveryDate: '',
      notes: '',
      internalNotes: '',
      paymentTerms: '',
      shipping: 0,
      discount: 0
    });
    setNewItem({
      productId: '',
      quantity: 1,
      specifications: ''
    });
  };

  const resetCustomerForm = () => {
    setCustomerData({
      companyName: '',
      businessType: '',
      rut: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        region: '',
        postalCode: '',
        country: 'Chile'
      },
      contactPerson: {
        name: '',
        position: '',
        email: '',
        phone: ''
      },
      creditLimit: 0,
      creditTerms: 30,
      discount: 0,
      isActive: true
    });
  };

  if (loading) {
    return (
      <div className={`bg-dark/80 rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-darklight rounded w-1/4"></div>
          <div className="h-32 bg-darklight rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-dark/80 rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-primary/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            Gestión B2B
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowCustomerModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <BuildingOfficeIcon className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </button>
            <button
              onClick={() => {
                setCreateMode('quote');
                setShowCreateModal(true);
              }}
              className="flex items-center px-4 py-2 bg-red-700 text-white rounded-md hover:bg-orange-700"
            >
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Nueva Cotización
            </button>
            <button
              onClick={() => {
                setCreateMode('po');
                setShowCreateModal(true);
              }}
              className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-orange-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nueva Orden
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 font-medium text-sm rounded-md ${
              activeTab === 'orders'
                ? 'bg-orange-100 text-secondary'
                : 'text-primary/60 hover:text-primary'
            }`}
          >
            Órdenes de Compra ({purchaseOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('quotes')}
            className={`px-4 py-2 font-medium text-sm rounded-md ${
              activeTab === 'quotes'
                ? 'bg-orange-100 text-secondary'
                : 'text-primary/60 hover:text-primary'
            }`}
          >
            Cotizaciones ({quotes.length})
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 font-medium text-sm rounded-md ${
              activeTab === 'customers'
                ? 'bg-orange-100 text-secondary'
                : 'text-primary/60 hover:text-primary'
            }`}
          >
            Clientes B2B ({b2bCustomers.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Purchase Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {purchaseOrders.length === 0 ? (
              <div className="text-center py-8 text-primary/60">
                No hay órdenes de compra registradas
              </div>
            ) : (
              purchaseOrders.map((order) => (
                <div key={order.id} className="border border-primary/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-white">
                        {order.poNumber}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updatePOStatus(order.id, 'confirmed', (currentUser as any)?.uid || currentUser?.email)}
                        disabled={order.status !== 'pending'}
                        className="text-green-600 hover:text-green-800 disabled:opacity-50"
                      >
                        <CheckIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => deletePurchaseOrder(order.id)}
                        className="text-pink hover:text-pink"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-primary">Cliente:</span>
                      <div>{order.customerInfo.companyName}</div>
                      <div className="text-primary/60">{order.customerInfo.email}</div>
                    </div>
                    <div>
                      <span className="font-medium text-primary">Total:</span>
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(order.total)}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-primary">Fecha:</span>
                      <div>{new Date(order.createdAt).toLocaleDateString('es-CL')}</div>
                      {order.requestedDeliveryDate && (
                        <div className="text-primary/60">
                          Entrega: {new Date(order.requestedDeliveryDate).toLocaleDateString('es-CL')}
                        </div>
                      )}
                    </div>
                  </div>

                  {order.items.length > 0 && (
                    <div className="mt-3">
                      <span className="font-medium text-primary">Productos:</span>
                      <div className="mt-1 text-sm text-primary/80">
                        {order.items.map((item, index) => (
                          <div key={item.id}>
                            {item.productName} × {item.quantity} = {formatCurrency(item.totalPrice)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Quotes Tab */}
        {activeTab === 'quotes' && (
          <div className="space-y-4">
            {quotes.length === 0 ? (
              <div className="text-center py-8 text-primary/60">
                No hay cotizaciones registradas
              </div>
            ) : (
              quotes.map((quote) => (
                <div key={quote.id} className="border border-primary/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-white">
                        {quote.quoteNumber}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(quote.status)}`}>
                        {quote.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {quote.status === 'accepted' && !quote.convertedToPO && (
                        <button
                          onClick={() => convertQuoteToPO(quote.id, (currentUser as any)?.uid || currentUser?.email || '')}
                          className="text-red-600 hover:text-secondary"
                          title="Convertir a Orden de Compra"
                        >
                          <DocumentDuplicateIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteQuote(quote.id)}
                        className="text-pink hover:text-pink"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-primary">Cliente:</span>
                      <div>{quote.customerInfo.companyName}</div>
                      <div className="text-primary/60">{quote.customerInfo.email}</div>
                    </div>
                    <div>
                      <span className="font-medium text-primary">Total:</span>
                      <div className="text-xl font-bold text-red-600">
                        {formatCurrency(quote.total)}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-primary">Válida hasta:</span>
                      <div>{new Date(quote.validUntil).toLocaleDateString('es-CL')}</div>
                      {quote.convertedToPO && (
                        <div className="text-green-600 text-xs">
                          Convertida a PO
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            {b2bCustomers.length === 0 ? (
              <div className="text-center py-8 text-primary/60">
                No hay clientes B2B registrados
              </div>
            ) : (
              b2bCustomers.map((customer) => (
                <div key={customer.id} className="border border-primary/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-white">
                      {customer.companyName}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      customer.isActive ? 'bg-green-100 text-green-800' : 'bg-darklight text-pink'
                    }`}>
                      {customer.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-primary">Contacto:</span>
                      <div>{customer.contactPerson.name}</div>
                      <div className="text-primary/60">{customer.email}</div>
                    </div>
                    <div>
                      <span className="font-medium text-primary">Crédito:</span>
                      <div>{formatCurrency(customer.creditLimit)}</div>
                      <div className="text-primary/60">{customer.creditTerms} días</div>
                    </div>
                    <div>
                      <span className="font-medium text-primary">Descuento:</span>
                      <div>{customer.discount}%</div>
                    </div>
                    <div>
                      <span className="font-medium text-primary">Estadísticas:</span>
                      <div>{customer.totalOrders} órdenes</div>
                      <div className="text-primary/60">{formatCurrency(customer.totalValue)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Order/Quote Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark/80 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-white mb-4">
              {createMode === 'po' ? 'Nueva Orden de Compra' : 'Nueva Cotización'}
            </h3>

            <div className="space-y-4">
              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Cliente
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                  className="w-full px-3 py-2 border border-primary/40 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Seleccionar cliente...</option>
                  {b2bCustomers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.companyName} - {customer.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Products */}
              <div className="border border-primary/30 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Agregar Productos</h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                  <select
                    value={newItem.productId}
                    onChange={(e) => setNewItem(prev => ({ ...prev, productId: e.target.value }))}
                    className="px-3 py-2 border border-primary/40 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Seleccionar producto...</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.nombre} - {formatCurrency(product.precio)}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    placeholder="Cantidad"
                    className="px-3 py-2 border border-primary/40 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />

                  <input
                    type="text"
                    value={newItem.specifications}
                    onChange={(e) => setNewItem(prev => ({ ...prev, specifications: e.target.value }))}
                    placeholder="Especificaciones"
                    className="px-3 py-2 border border-primary/40 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />

                  <button
                    onClick={addItemToOrder}
                    className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-orange-700"
                  >
                    Agregar
                  </button>
                </div>

                {/* Items List */}
                {formData.items.length > 0 && (
                  <div className="space-y-2">
                    {formData.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-dark p-2 rounded">
                        <div className="flex-1">
                          <span className="font-medium">{item.productName}</span>
                          <span className="mx-2">×</span>
                          <span>{item.quantity}</span>
                          <span className="ml-2 text-primary/60">= {formatCurrency(item.totalPrice)}</span>
                          {item.specifications && (
                            <div className="text-sm text-primary/80">{item.specifications}</div>
                          )}
                        </div>
                        <button
                          onClick={() => removeItemFromOrder(item.id)}
                          className="text-pink hover:text-pink"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Fecha de entrega solicitada
                  </label>
                  <input
                    type="date"
                    value={formData.requestedDeliveryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, requestedDeliveryDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-primary/40 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Envío
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.shipping}
                    onChange={(e) => setFormData(prev => ({ ...prev, shipping: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-primary/40 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-primary/40 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateOrder}
                disabled={!formData.customerId || formData.items.length === 0}
                className="flex-1 bg-red-700 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50"
              >
                {createMode === 'po' ? 'Crear Orden de Compra' : 'Crear Cotización'}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="flex-1 bg-gray-300 text-primary py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark/80 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-white mb-4">
              Nuevo Cliente B2B
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Nombre de la empresa
                  </label>
                  <input
                    type="text"
                    value={customerData.companyName}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-3 py-2 border border-primary/40 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Tipo de negocio
                  </label>
                  <input
                    type="text"
                    value={customerData.businessType}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, businessType: e.target.value }))}
                    className="w-full px-3 py-2 border border-primary/40 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    RUT
                  </label>
                  <input
                    type="text"
                    value={customerData.rut}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, rut: e.target.value }))}
                    className="w-full px-3 py-2 border border-primary/40 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={customerData.email}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-primary/40 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Límite de crédito
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={customerData.creditLimit}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, creditLimit: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-primary/40 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Términos de crédito (días)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={customerData.creditTerms}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, creditTerms: parseInt(e.target.value) || 30 }))}
                    className="w-full px-3 py-2 border border-primary/40 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Contact Person */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-white mb-3">Persona de Contacto</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={customerData.contactPerson.name}
                      onChange={(e) => setCustomerData(prev => ({
                        ...prev,
                        contactPerson: { ...prev.contactPerson, name: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-primary/40 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-1">
                      Cargo
                    </label>
                    <input
                      type="text"
                      value={customerData.contactPerson.position}
                      onChange={(e) => setCustomerData(prev => ({
                        ...prev,
                        contactPerson: { ...prev.contactPerson, position: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-primary/40 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-1">
                      Email de contacto
                    </label>
                    <input
                      type="email"
                      value={customerData.contactPerson.email}
                      onChange={(e) => setCustomerData(prev => ({
                        ...prev,
                        contactPerson: { ...prev.contactPerson, email: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-primary/40 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-1">
                      Teléfono de contacto
                    </label>
                    <input
                      type="tel"
                      value={customerData.contactPerson.phone}
                      onChange={(e) => setCustomerData(prev => ({
                        ...prev,
                        contactPerson: { ...prev.contactPerson, phone: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-primary/40 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateCustomer}
                disabled={!customerData.companyName || !customerData.email}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Crear Cliente
              </button>
              <button
                onClick={() => {
                  setShowCustomerModal(false);
                  resetCustomerForm();
                }}
                className="flex-1 bg-gray-300 text-primary py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}