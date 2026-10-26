import React, { createContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToast } from './useToast';

export const ToastContext = createContext(null);
export { useToast };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', title = null, duration = 5000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);

    setToasts((prev) => {
      // Deduplicate identical message
      if (prev.some((t) => t.message === message)) {
        return prev;
      }
      return [...prev, { id, message, type, title }];
    });

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, title = 'Success') => addToast(msg, 'success', title),
    error: (msg, title = 'Error') => addToast(msg, 'error', title, 6000),
    warning: (msg, title = 'Warning') => addToast(msg, 'warning', title),
    info: (msg, title = 'Information') => addToast(msg, 'info', title)
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none no-print">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-xl border flex items-start space-x-3 transition-all duration-200 animate-in slide-in-from-bottom-5 ${
              t.type === 'success'
                ? 'bg-slate-900 border-emerald-500/50 text-emerald-300'
                : t.type === 'error'
                ? 'bg-slate-900 border-rose-500/50 text-rose-300'
                : t.type === 'warning'
                ? 'bg-slate-900 border-amber-500/50 text-amber-300'
                : 'bg-slate-900 border-sky-500/50 text-sky-300'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
            </div>
            <div className="flex-1 text-xs">
              {t.title && <div className="font-semibold text-white mb-0.5 text-sm">{t.title}</div>}
              <div className="text-slate-200 leading-relaxed break-words">{t.message}</div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
