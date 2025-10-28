'use client';

import { useNotification } from '@/context/NotificationContext';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export default function NotificationDisplay() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] space-y-2 pointer-events-none w-full max-w-sm px-4 sm:px-0">
      {notifications.map((notification) => {
        const getIcon = () => {
          switch (notification.type) {
            case 'success':
              return <CheckCircle className="h-5 w-5 text-green-500" strokeWidth={2.5} />;
            case 'error':
              return <AlertTriangle className="h-5 w-5 text-pink" strokeWidth={2.5} />;
            case 'warning':
              return <AlertTriangle className="h-5 w-5 text-yellow-500" strokeWidth={2.5} />;
            case 'info':
              return <Info className="h-5 w-5 text-orange-500" strokeWidth={2.5} />;
            default:
              return <Info className="h-5 w-5 text-primary/60" strokeWidth={2.5} />;
          }
        };

        const getBgColor = () => {
          switch (notification.type) {
            case 'success':
              return 'bg-green-50 border-green-200';
            case 'error':
              return 'bg-dark-light border-dark-light';
            case 'warning':
              return 'bg-yellow-50 border-yellow-200';
            case 'info':
              return 'bg-blue-50 border-blue-200';
            default:
              return 'bg-dark border-primary/30';
          }
        };

        return (
          <div
            key={notification.id}
            className={`w-full ${getBgColor()} border rounded-lg shadow-xl shadow-yellow-400/30 p-4 animate-slide-in-right pointer-events-auto min-h-[4rem]`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getIcon()}
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-white">
                  {notification.title}
                </p>
                {notification.message && (
                  <p className="mt-1 text-sm text-primary/60">
                    {notification.message}
                  </p>
                )}
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className="inline-flex text-primary/50 hover:text-primary/80 focus:outline-none"
                  onClick={() => removeNotification(notification.id)}
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}