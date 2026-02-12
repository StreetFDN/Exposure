"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const alertVariants = cva(
  "relative flex gap-3 rounded-lg border p-4 text-sm",
  {
    variants: {
      variant: {
        info: "border-sky-500/20 bg-sky-500/10 text-sky-300",
        success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
        warning: "border-amber-500/20 bg-amber-500/10 text-amber-300",
        error: "border-rose-500/20 bg-rose-500/10 text-rose-300",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

const iconMap: Record<string, React.ElementType> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  description?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = "info",
      title,
      description,
      dismissible = false,
      onDismiss,
      children,
      ...props
    },
    ref
  ) => {
    const [dismissed, setDismissed] = React.useState(false);
    const Icon = iconMap[variant ?? "info"];

    if (dismissed) return null;

    const handleDismiss = () => {
      setDismissed(true);
      onDismiss?.();
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="flex-1 space-y-1">
          {title && <p className="font-medium leading-tight">{title}</p>}
          {description && (
            <p className="opacity-90 leading-relaxed">{description}</p>
          )}
          {children}
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="shrink-0 self-start rounded p-0.5 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = "Alert";

export { Alert };
