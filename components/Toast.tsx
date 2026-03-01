import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[70] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const bgColors = {
    success: 'bg-white border-green-100',
    error: 'bg-white border-red-100',
    info: 'bg-white border-indigo-100',
  };

  const textColors = {
    success: 'text-slate-800',
    error: 'text-slate-800',
    info: 'text-slate-800',
  };

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    info: AlertCircle,
  }[toast.type];

  const iconColor = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-indigo-500',
  }[toast.type];

  return (
    <div 
      className={`
        pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border w-80 animate-slide-in-right backdrop-blur-sm
        ${bgColors[toast.type]}
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor} mt-0.5`} />
      <div className={`flex-1 text-sm font-medium leading-snug ${textColors[toast.type]}`}>
        {toast.message}
      </div>
      <button 
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ToastContainer;