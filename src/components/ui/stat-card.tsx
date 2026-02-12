import * as React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Descriptive label (e.g. "Total Raised") */
  label: string;
  /** The primary metric value */
  value: string | number;
  /** Optional percentage or absolute change */
  change?: number;
  /** Whether `change` is a percentage */
  changeIsPercent?: boolean;
  /** Optional icon shown on the right */
  icon?: React.ReactNode;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    { className, label, value, change, changeIsPercent = true, icon, ...props },
    ref
  ) => {
    const isPositive = change !== undefined && change >= 0;
    const isNegative = change !== undefined && change < 0;

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-5",
          className
        )}
        {...props}
      >
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {label}
          </span>
          <span className="text-2xl font-bold tabular-nums text-zinc-50">
            {value}
          </span>
          {change !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                isPositive && "text-emerald-400",
                isNegative && "text-rose-400"
              )}
            >
              {isPositive ? (
                <ArrowUp className="h-3 w-3" aria-hidden="true" />
              ) : (
                <ArrowDown className="h-3 w-3" aria-hidden="true" />
              )}
              {Math.abs(change).toFixed(changeIsPercent ? 1 : 0)}
              {changeIsPercent && "%"}
            </span>
          )}
        </div>

        {icon && (
          <span
            className="shrink-0 rounded-lg bg-zinc-800 p-2.5 text-zinc-400"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>
    );
  }
);

StatCard.displayName = "StatCard";

export { StatCard };
