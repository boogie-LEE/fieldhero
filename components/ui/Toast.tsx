"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

type Toast = { id: string; message: string; type: "success" | "error" };
const ToastCtx = createContext<{ push: (m: string, t?: "success" | "error") => void }>({ push: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed top-3 right-3 z-[100] flex flex-col gap-2 max-w-[calc(100vw-24px)]">
        {toasts.map((t) => (
          <div key={t.id} className="flex items-center gap-2.5 rounded-lg bg-slate-900 text-white px-4 py-3 text-sm shadow-lg animate-in">
            {t.type === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              : <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}>
              <X className="h-3.5 w-3.5 opacity-60" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
