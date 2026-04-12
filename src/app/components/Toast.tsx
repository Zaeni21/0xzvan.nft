"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "success" | "error" | "loading" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => number;
  dismiss: (id: number) => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
  loading: (msg: string) => number;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let counter = 0;

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info"): number => {
    const id = ++counter;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (type !== "loading") {
      setTimeout(() => dismiss(id), type === "error" ? 5000 : 3500);
    }
    return id;
  }, [dismiss]);

  const success = useCallback((msg: string) => { toast(msg, "success"); }, [toast]);
  const error = useCallback((msg: string) => { toast(msg, "error"); }, [toast]);
  const loading = useCallback((msg: string) => toast(msg, "loading"), [toast]);

  const icons: Record<ToastType, string> = {
    success: "✅",
    error: "❌",
    loading: "⏳",
    info: "ℹ️",
  };

  const colors: Record<ToastType, string> = {
    success: "bg-white border-green-200",
    error: "bg-white border-red-200",
    loading: "bg-white border-blue-200",
    info: "bg-white border-gray-200",
  };

  return (
    <ToastContext.Provider value={{ toast, dismiss, success, error, loading }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-4 left-4 sm:left-auto sm:w-80 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-lg pointer-events-auto
              ${colors[t.type]} animate-in slide-in-from-bottom-4 duration-300`}
          >
            <span className="text-base mt-0.5 shrink-0">{icons[t.type]}</span>
            <p className="text-sm text-gray-800 flex-1 leading-snug">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-gray-300 hover:text-gray-500 text-lg leading-none shrink-0 mt-0.5"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
