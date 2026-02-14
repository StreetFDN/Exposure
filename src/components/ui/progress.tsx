"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const progressFillVariants = cva(
  "h-full rounded-full transition-all duration-500 ease-out",
  {
    variants: {
      colorVariant: {
        default: "bg-violet-500",
        success: "bg-emerald-500",
        warning: "bg-amber-500",
        error: "bg-rose-500",
      },
    },
    defaultVariants: {
      colorVariant: "default",
    },
  }
);

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressFillVariants> {
  /** Value between 0 and 100 */
  value: number;
  /** Optional label shown above the bar */
  label?: string;
  /** Whether to show percentage text */
  showPercentage?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value,
      label,
      showPercentage = false,
      colorVariant,
      ...props
    },
    ref
  ) => {
    const clamped = Math.max(0, Math.min(100, value));

    return (
      <div ref={ref} className={cn("flex flex-col gap-1.5", className)} {...props}>
        {(label || showPercentage) && (
          <div className="flex items-center justify-between text-sm">
            {label && <span className="font-medium text-zinc-700">{label}</span>}
            {showPercentage && (
              <span className="tabular-nums text-zinc-500">
                {Math.round(clamped)}%
              </span>
            )}
          </div>
        )}
        <div
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label ?? "Progress"}
          className="h-1 w-full overflow-hidden rounded-full bg-zinc-200"
        >
          <div
            className={progressFillVariants({ colorVariant })}
            style={{ width: `${clamped}%` }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress };
