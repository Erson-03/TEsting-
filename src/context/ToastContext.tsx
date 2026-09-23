import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

type ToastTone = "success" | "error" | "info";
type ToastItem = { id: number; message: string; tone: ToastTone };
type ToastContextValue = { showToast: (message: string, tone?: ToastTone) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  function dismiss(id: number) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function showToast(message: string, tone: ToastTone = "success") {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => dismiss(id), 3500);
  }

  const value = useMemo(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {items.map((item) => {
          const Icon = item.tone === "success" ? CheckCircle2 : item.tone === "error" ? CircleAlert : Info;
          return (
            <div key={item.id} className={`toast toast-${item.tone}`}>
              <Icon size={18} />
              <span>{item.message}</span>
              <button type="button" onClick={() => dismiss(item.id)} aria-label="Dismiss notification">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside ToastProvider.");
  return value;
}
