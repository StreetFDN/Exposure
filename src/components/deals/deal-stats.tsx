"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, formatPercent, formatLargeNumber } from "@/lib/utils/format";
import {
  DollarSign,
  Target,
  TrendingUp,
  Unlock,
  Clock,
  Layers,
  Shield,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DealStatsData {
  tokenPrice: string;
  totalRaise: string;
  hardCap: string;
  fdv?: string | null;
  tgeUnlockPercent: string;
  vestingDurationDays: number;
  allocationMethod: string;
  minTierRequired?: string | null;
}

export interface DealStatsProps {
  stats: DealStatsData;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ALLOCATION_LABELS: Record<string, string> = {
  GUARANTEED: "Guaranteed",
  PRO_RATA: "Pro-Rata",
  LOTTERY: "Lottery",
  FCFS: "FCFS",
  HYBRID: "Hybrid",
};

export function DealStats({ stats, className }: DealStatsProps) {
  const items = [
    {
      label: "Token Price",
      value: formatCurrency(stats.tokenPrice),
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      label: "Total Raise",
      value: `$${formatLargeNumber(stats.totalRaise)}`,
      icon: <Target className="h-4 w-4" />,
    },
    {
      label: "Hard Cap",
      value: `$${formatLargeNumber(stats.hardCap)}`,
      icon: <Target className="h-4 w-4" />,
    },
    {
      label: "FDV",
      value: stats.fdv ? `$${formatLargeNumber(stats.fdv)}` : "--",
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      label: "TGE Unlock",
      value: formatPercent(stats.tgeUnlockPercent),
      icon: <Unlock className="h-4 w-4" />,
    },
    {
      label: "Vesting Period",
      value:
        stats.vestingDurationDays > 0
          ? `${stats.vestingDurationDays} days`
          : "None",
      icon: <Clock className="h-4 w-4" />,
    },
    {
      label: "Allocation",
      value: ALLOCATION_LABELS[stats.allocationMethod] ?? stats.allocationMethod,
      icon: <Layers className="h-4 w-4" />,
    },
    {
      label: "Min Tier",
      value: stats.minTierRequired ?? "None",
      icon: <Shield className="h-4 w-4" />,
    },
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200",
        className
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col gap-1 bg-white p-3"
        >
          <div className="flex items-center gap-1.5 text-zinc-500">
            {item.icon}
            <span className="text-xs">{item.label}</span>
          </div>
          <span className="text-sm font-semibold text-zinc-900">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
