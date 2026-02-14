"use client";

import * as React from "react";
import Link from "next/link";
import { Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatLargeNumber } from "@/lib/utils/format";
import type { DealStatus, DealCategory, Chain, AllocationMethod, TierLevel } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DealCardDeal {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  projectName: string;
  category: DealCategory;
  status: DealStatus;
  chain: Chain;
  tokenPrice: string;
  totalRaise: string;
  totalRaised: string;
  hardCap: string;
  fdv?: string | null;
  contributorCount: number;
  allocationMethod: AllocationMethod;
  minTierRequired: TierLevel | null;
  registrationOpenAt: string | null;
  contributionOpenAt: string | null;
  contributionCloseAt: string | null;
  featuredImageUrl: string | null;
  isFeatured: boolean;
}

export interface DealCardProps {
  deal: DealCardDeal;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "info" | "outline" }
> = {
  DRAFT: { label: "Draft", variant: "outline" },
  UNDER_REVIEW: { label: "Under Review", variant: "outline" },
  APPROVED: { label: "Upcoming", variant: "outline" },
  REGISTRATION_OPEN: { label: "Registration Open", variant: "outline" },
  GUARANTEED_ALLOCATION: { label: "Guaranteed", variant: "outline" },
  FCFS: { label: "FCFS", variant: "outline" },
  SETTLEMENT: { label: "Settlement", variant: "outline" },
  DISTRIBUTING: { label: "Distributing", variant: "outline" },
  COMPLETED: { label: "Completed", variant: "outline" },
  CANCELLED: { label: "Cancelled", variant: "outline" },
};

const CATEGORY_LABELS: Record<string, string> = {
  DEFI: "DeFi",
  GAMING: "Gaming",
  AI: "AI",
  INFRASTRUCTURE: "Infra",
  NFT: "NFT",
  SOCIAL: "Social",
  OTHER: "Other",
};

const CHAIN_LABELS: Record<string, string> = {
  ETHEREUM: "Ethereum",
  BASE: "Base",
  ARBITRUM: "Arbitrum",
};

function getCountdownTarget(deal: DealCardDeal): string | null {
  if (
    deal.status === "REGISTRATION_OPEN" ||
    deal.status === "GUARANTEED_ALLOCATION" ||
    deal.status === "FCFS"
  ) {
    return deal.contributionCloseAt;
  }
  if (deal.status === "APPROVED") {
    return deal.registrationOpenAt ?? deal.contributionOpenAt;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DealCard({ deal, className }: DealCardProps) {
  const statusConfig = STATUS_CONFIG[deal.status] ?? STATUS_CONFIG.DRAFT;
  const raiseProgress =
    (parseFloat(deal.totalRaised) / parseFloat(deal.hardCap)) * 100;
  const countdownTarget = getCountdownTarget(deal);

  return (
    <Link
      href={`/deals/${deal.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white",
        "transition-colors duration-150",
        "hover:border-zinc-300 hover:bg-zinc-50/60",
        className
      )}
    >
      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Header: Name + Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-medium text-zinc-900 transition-colors group-hover:text-zinc-800">
              {deal.projectName}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-normal text-zinc-500">
                {CATEGORY_LABELS[deal.category]}
              </span>
              <span className="text-zinc-300">&middot;</span>
              <span className="text-xs font-normal text-zinc-500">
                {CHAIN_LABELS[deal.chain]}
              </span>
            </div>
          </div>
          <span className="shrink-0 rounded-md border border-zinc-200 px-2 py-0.5 text-[11px] font-normal text-zinc-500">
            {statusConfig.label}
          </span>
        </div>

        {/* Description */}
        {deal.shortDescription && (
          <p className="line-clamp-2 text-sm font-normal leading-relaxed text-zinc-500">
            {deal.shortDescription}
          </p>
        )}

        {/* Progress */}
        <div className="flex flex-col gap-1.5">
          <div className="h-1 overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-zinc-500 transition-all"
              style={{ width: `${Math.min(raiseProgress, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-normal text-zinc-500">
            <span>
              {formatCurrency(deal.totalRaised)} raised
            </span>
            <span>{formatCurrency(deal.hardCap)}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 border-t border-zinc-200 pt-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-normal uppercase tracking-wider text-zinc-400">
              Price
            </span>
            <span className="text-sm font-normal text-zinc-700">
              {formatCurrency(deal.tokenPrice)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-normal uppercase tracking-wider text-zinc-400">
              Raise
            </span>
            <span className="text-sm font-normal text-zinc-700">
              ${formatLargeNumber(deal.totalRaise)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-normal uppercase tracking-wider text-zinc-400">
              FDV
            </span>
            <span className="text-sm font-normal text-zinc-700">
              {deal.fdv ? `$${formatLargeNumber(deal.fdv)}` : "--"}
            </span>
          </div>
        </div>

        {/* Countdown / Contributors */}
        <div className="flex items-center justify-between border-t border-zinc-200 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-normal text-zinc-500">
            <Users className="h-3.5 w-3.5" />
            <span>{deal.contributorCount.toLocaleString()}</span>
          </div>
          {countdownTarget ? (
            <CompactCountdown targetDate={countdownTarget} />
          ) : (
            <span className="text-xs font-normal text-zinc-400">
              {deal.status === "COMPLETED" ? "Ended" : "TBA"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Compact inline countdown for card footer
// ---------------------------------------------------------------------------

function CompactCountdown({ targetDate }: { targetDate: string }) {
  const target = React.useMemo(() => new Date(targetDate), [targetDate]);

  const [label, setLabel] = React.useState(() => calcLabel(target));

  React.useEffect(() => {
    const timer = setInterval(() => setLabel(calcLabel(target)), 1000);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Clock className="h-3.5 w-3.5 text-zinc-400" />
      <span className="font-mono font-normal text-zinc-500">{label}</span>
    </div>
  );
}

function calcLabel(target: Date): string {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return "Ended";

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  const s = Math.floor((diff / 1000) % 60);
  const pad = (n: number) => String(n).padStart(2, "0");

  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m`;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
