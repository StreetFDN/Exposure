import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icon rendered above the title */
  icon?: React.ReactNode;
  /** Heading text */
  title: string;
  /** Supporting text */
  description?: string;
  /** Optional action (e.g. a Button) */
  action?: React.ReactNode;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 px-6 py-12 text-center",
          className
        )}
        {...props}
      >
        {icon && (
          <span className="text-zinc-600" aria-hidden="true">
            {icon}
          </span>
        )}
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-zinc-300">{title}</h3>
          {description && (
            <p className="max-w-sm text-sm text-zinc-500">{description}</p>
          )}
        </div>
        {action && <div className="mt-2">{action}</div>}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";

export { EmptyState };
