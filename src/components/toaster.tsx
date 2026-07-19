"use client";

import { useToastStore, type ToastType } from "@/store/toast-store";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="size-4 text-emerald-400" />,
  error: <AlertCircle className="size-4 text-red-400" />,
  info: <Info className="size-4 text-blue-400" />,
  warning: <AlertTriangle className="size-4 text-amber-400" />,
};

const bgMap: Record<ToastType, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10",
  error: "border-red-500/30 bg-red-500/10",
  info: "border-blue-500/30 bg-blue-500/10",
  warning: "border-amber-500/30 bg-amber-500/10",
};

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: { id: string; message: string; type: ToastType; duration?: number }; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 200);
    }, (toast.duration ?? 3000) - 200);
    return () => clearTimeout(timer);
  }, [toast.duration, onDismiss]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2.5 rounded-lg border shadow-lg backdrop-blur-sm transition-all duration-200",
        bgMap[toast.type],
        visible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
      )}
    >
      {iconMap[toast.type]}
      <span className="text-xs font-medium text-foreground flex-1">{toast.message}</span>
      <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
        <X className="size-3" />
      </button>
    </div>
  );
}
