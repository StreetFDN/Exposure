"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContributionProgressProps {
  raised: number;
  softCap: number;
  hardCap: number;
  currency?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContributionProgress({
  raised,
  softCap,
  hardCap,
  currency = "USD",
  className,
}: ContributionProgressProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const raisedPct = hardCap > 0 ? Math.min((raised / hardCap) * 100, 100) : 0;
  const softCapPct = hardCap > 0 ? Math.min((softCap / hardCap) * 100, 100) : 0;
  const softCapMet = raised >= softCap;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Labels */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-xs text-zinc-500">Total Raised</span>
          <p className="font-serif text-xl font-light text-zinc-100">
            {formatCurrency(raised, currency)}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-zinc-500">Hard Cap</span>
          <p className="text-sm font-medium text-zinc-300">
            {formatCurrency(hardCap, currency)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-zinc-400 transition-all duration-1000 ease-out"
            style={{ width: animated ? `${raisedPct}%` : "0%" }}
          />
        </div>

        {/* Soft cap marker */}
        <div
          className="absolute top-0 h-3"
          style={{ left: `${softCapPct}%` }}
        >
          <div className="h-full w-px bg-zinc-500" />
        </div>
      </div>

      {/* Percentage + soft cap label */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-zinc-300">
          {raisedPct.toFixed(1)}% raised
        </span>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs",
              softCapMet ? "text-emerald-400" : "text-zinc-500"
            )}
          >
            Soft cap: {formatCurrency(softCap, currency)}
            {softCapMet ? " (met)" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
