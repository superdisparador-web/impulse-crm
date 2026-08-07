"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import Toast, { type ToastType } from "./Toast";

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, "id">) => void;
  success: (title: string, description?: string, duration?: number) => void;
  error: (title: string, description?: string, duration?: number) => void;
  warning: (title: string, description?: string, duration?: number) => void;
  info: (title: string, description?: string, duration?: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, description, duration = 3500 }: Omit<ToastItem, "id">) => {
      const id = crypto.randomUUID();

      setToasts((current) => [
        ...current,
        {
          id,
          type,
          title,
          description,
          duration,
        },
      ]);

      window.setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      success: (title, description, duration) =>
        showToast({
          type: "success",
          title,
          description,
          duration,
        }),
      error: (title, description, duration) =>
        showToast({
          type: "error",
          title,
          description,
          duration,
        }),
      warning: (title, description, duration) =>
        showToast({
          type: "warning",
          title,
          description,
          duration,
        }),
      info: (title, description, duration) =>
        showToast({
          type: "info",
          title,
          description,
          duration,
        }),
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-[380px] flex-col gap-3 sm:right-6 sm:top-6">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              id={toast.id}
              type={toast.type}
              title={toast.title}
              description={toast.description}
              onClose={removeToast}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
