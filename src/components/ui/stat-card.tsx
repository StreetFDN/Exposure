import * as React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Descriptive label (e.g. "Total Raised") */
  label: string;
  /** The primary metric value */
  value: string | number | React.ReactNode;
  /** Optional percentage or absolute change */
  change?: number;
  /** Whether `change` is a percentage */
  changeIsPercent?: boolean;
  /** Optional icon shown on the right */
  icon?: React.ReactNode;
  /** Optional description text */
  description?: string;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    { className, label, value, change, changeIsPercent = true, icon, description, ...props },
    ref
  ) => {
    const isPositive = change !== undefined && change >= 0;
    const isNegative = change !== undefined && change < 0;

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-5",
          className
        )}
        {...props}
      >
        <span className="text-xs font-normal uppercase tracking-wider text-zinc-400">
          {label}
        </span>
        <span className="font-serif text-2xl font-light tabular-nums text-zinc-900">
          {value}
        </span>
        {change !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-normal",
              isPositive && "text-emerald-600",
              isNegative && "text-rose-600"
            )}
            style={{ opacity: 0.7 }}
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
        {description && (
          <span className="text-xs font-normal text-zinc-500">{description}</span>
        )}
      </div>
    );
  }
);

StatCard.displayName = "StatCard";

export { StatCard };
