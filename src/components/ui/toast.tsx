"use client";

import * as React from "react";
import { X, CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useToastStore, type ToastVariant } from "@/lib/stores/toast-store";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUTO_DISMISS_MS = 5_000;

// ---------------------------------------------------------------------------
// Variant styles — left accent border approach
// ---------------------------------------------------------------------------

const variantBorder: Record<ToastVariant, string> = {
  success: "border-l-emerald-500",
  error: "border-l-red-500",
  info: "border-l-sky-500",
  warning: "border-l-amber-500",
};

const variantTextColor: Record<ToastVariant, string> = {
  success: "text-emerald-600",
  error: "text-red-600",
  info: "text-sky-600",
  warning: "text-amber-600",
};

const variantIcons: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

// ---------------------------------------------------------------------------
// Single toast item
// ---------------------------------------------------------------------------

function ToastItem({
  id,
  message,
  variant,
}: {
  id: string;
  message: string;
  variant: ToastVariant;
}) {
  const removeToast = useToastStore((s) => s.removeToast);
  const [exiting, setExiting] = React.useState(false);

  React.useEffect(() => {
    const dismissTimer = setTimeout(() => {
      setExiting(true);
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(dismissTimer);
  }, []);

  React.useEffect(() => {
    if (!exiting) return;
    const removeTimer = setTimeout(() => {
      removeToast(id);
    }, 300);
    return () => clearTimeout(removeTimer);
  }, [exiting, id, removeToast]);

  const handleDismiss = () => {
    setExiting(true);
  };

  const Icon = variantIcons[variant];

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto flex w-80 items-start gap-3 rounded border border-zinc-200 border-l-2 bg-white px-4 py-3 shadow-lg",
        "transition-all duration-300 ease-out",
        exiting
          ? "translate-x-full opacity-0"
          : "translate-x-0 opacity-100 animate-toast-in",
        variantBorder[variant]
      )}
    >
      <Icon
        className={cn("mt-0.5 h-4 w-4 shrink-0", variantTextColor[variant])}
        aria-hidden="true"
      />
      <p className="flex-1 text-sm leading-snug text-zinc-800">{message}</p>
      <button
        onClick={handleDismiss}
        className="shrink-0 rounded p-0.5 text-zinc-400 transition-colors hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast container — renders all active toasts
// ---------------------------------------------------------------------------

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          message={toast.message}
          variant={toast.variant}
        />
      ))}
    </div>
  );
}
