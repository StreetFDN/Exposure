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
// Variant styles and icons
// ---------------------------------------------------------------------------

const variantStyles: Record<ToastVariant, string> = {
  success: "border-emerald-500/30 text-emerald-300",
  error: "border-rose-500/30 text-rose-300",
  info: "border-sky-500/30 text-sky-300",
  warning: "border-amber-500/30 text-amber-300",
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
    }, 300); // match animation duration
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
        "pointer-events-auto flex w-80 items-start gap-3 rounded-lg border bg-zinc-900 px-4 py-3 shadow-lg shadow-black/30",
        "transition-all duration-300 ease-out",
        exiting
          ? "translate-x-full opacity-0"
          : "translate-x-0 opacity-100 animate-in slide-in-from-right",
        variantStyles[variant]
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p className="flex-1 text-sm leading-snug text-zinc-100">{message}</p>
      <button
        onClick={handleDismiss}
        className="shrink-0 rounded p-0.5 text-zinc-400 transition-colors hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
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
