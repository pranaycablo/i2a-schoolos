import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = { ...toast, id };
    setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5

    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => {
          const config = {
            success: {
              icon: CheckCircle2,
              colorClass: 'text-emerald-500',
              borderClass: 'border-emerald-200 dark:border-emerald-900',
            },
            error: {
              icon: AlertCircle,
              colorClass: 'text-rose-500',
              borderClass: 'border-rose-200 dark:border-rose-900',
            },
            warning: {
              icon: AlertTriangle,
              colorClass: 'text-amber-500',
              borderClass: 'border-amber-200 dark:border-amber-900',
            },
            info: {
              icon: Info,
              colorClass: 'text-blue-500',
              borderClass: 'border-blue-200 dark:border-blue-900',
            },
          }[t.type];

          const Icon = config.icon;

          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto p-3.5 rounded-2xl bg-white dark:bg-slate-900 border ${config.borderClass} shadow-xl flex items-start gap-3 animate-fade-in`}
            >
              <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${config.colorClass}`} />
              <div className="flex-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.title}</h4>
                {t.message && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label="Dismiss notification"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-md focus-ring"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback if provider not in tree
    return {
      addToast: (t: Omit<ToastItem, 'id'>) => console.log('Toast:', t),
      removeToast: () => {},
    };
  }
  return ctx;
};
