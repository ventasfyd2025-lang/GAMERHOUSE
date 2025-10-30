'use client';

import { useState } from 'react';
import { useStockManager, StockAlert } from '@/hooks/useStockManager';
import {
  ExclamationTriangleIcon,
  XMarkIcon,
  CheckIcon,
  BellIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';

interface StockAlertsProps {
  className?: string;
}

export default function StockAlerts({ className }: StockAlertsProps) {
  const { stockAlerts, acknowledgeAlert, loading } = useStockManager();
  const [isExpanded, setIsExpanded] = useState(false);

  const getSeverityColor = (severity: StockAlert['severity']) => {
    switch (severity) {
      case 'out':
        return 'bg-slate-800 border-pink text-pink';
      case 'critical':
        return 'bg-slate-800 border-yellow-300500 text-yellow-300800';
      case 'low':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      default:
        return 'bg-slate-800 border-gray-500 text-white';
    }
  };

  const getSeverityIcon = (severity: StockAlert['severity']) => {
    switch (severity) {
      case 'out':
        return <NoSymbolIcon className="h-5 w-5 text-pink" />;
      case 'critical':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-300600" />;
      case 'low':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
      default:
        return <BellIcon className="h-5 w-5 text-yellow-300/80" />;
    }
  };

  const getSeverityText = (severity: StockAlert['severity']) => {
    switch (severity) {
      case 'out':
        return 'Sin Stock';
      case 'critical':
        return 'Stock Crítico';
      case 'low':
        return 'Stock Bajo';
      default:
        return 'Alerta';
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId);
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  if (stockAlerts.length === 0) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-green-800 font-medium">
            Todos los productos tienen stock suficiente
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900/80 border border-yellow-300/30 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div
        className="p-4 border-b border-yellow-300/30 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BellIcon className="h-5 w-5 text-pink" />
            <h3 className="text-lg font-semibold text-white">
              Alertas de Stock
            </h3>
            <span className="bg-slate-800 text-pink text-xs font-medium px-2.5 py-0.5 rounded-full">
              {stockAlerts.length}
            </span>
          </div>
          <XMarkIcon
            className={`h-5 w-5 text-yellow-300/50 transform transition-transform ${
              isExpanded ? 'rotate-45' : ''
            }`}
          />
        </div>
      </div>

      {/* Alerts List */}
      {isExpanded && (
        <div className="divide-y divide-gray-200">
          {stockAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 border-l-4 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    {getSeverityIcon(alert.severity)}
                    <span className="font-medium text-sm">
                      {getSeverityText(alert.severity)}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-white mb-1">
                    {alert.productName}
                  </h4>

                  <div className="text-sm text-yellow-300/80 space-y-1">
                    <p>
                      <span className="font-medium">Stock actual:</span> {alert.currentStock} unidades
                    </p>
                    <p>
                      <span className="font-medium">Stock mínimo:</span> {alert.minStock} unidades
                    </p>
                    <p className="text-xs text-yellow-300/60">
                      {new Date(alert.createdAt).toLocaleString('es-CL')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleAcknowledge(alert.id)}
                  disabled={loading}
                  className="ml-4 flex-shrink-0 bg-slate-800 hover:bg-slate-800 text-white px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Marcando...' : 'Marcar como visto'}
                </button>
              </div>

              {/* Quick Actions */}
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="text-xs bg-orange-100 hover:bg-amber-200 text-secondary px-2 py-1 rounded transition-colors">
                  Ver Producto
                </button>
                <button className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded transition-colors">
                  Reabastecer
                </button>
                <button className="text-xs bg-yellow-100 hover:bg-amber-200 text-amber-800 px-2 py-1 rounded transition-colors">
                  Ver Historial
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer with summary */}
      {!isExpanded && stockAlerts.length > 0 && (
        <div className="p-3 bg-slate-900 rounded-b-lg">
          <div className="flex items-center justify-between text-sm text-yellow-300/80">
            <div className="flex space-x-4">
              <span>
                Sin stock: {stockAlerts.filter(a => a.severity === 'out').length}
              </span>
              <span>
                Crítico: {stockAlerts.filter(a => a.severity === 'critical').length}
              </span>
              <span>
                Bajo: {stockAlerts.filter(a => a.severity === 'low').length}
              </span>
            </div>
            <span className="text-red-600 hover:text-secondary cursor-pointer">
              Ver detalles
            </span>
          </div>
        </div>
      )}
    </div>
  );
}