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
  APPROVED: { label: "Upcoming", variant: "info" },
  REGISTRATION_OPEN: { label: "Registration Open", variant: "default" },
  GUARANTEED_ALLOCATION: { label: "Guaranteed", variant: "success" },
  FCFS: { label: "FCFS", variant: "warning" },
  SETTLEMENT: { label: "Settlement", variant: "outline" },
  DISTRIBUTING: { label: "Distributing", variant: "info" },
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

function getGradientByCategory(category: DealCategory): string {
  const gradients: Record<string, string> = {
    DEFI: "from-violet-600/40 to-blue-600/40",
    GAMING: "from-emerald-600/40 to-cyan-600/40",
    AI: "from-fuchsia-600/40 to-violet-600/40",
    INFRASTRUCTURE: "from-amber-600/40 to-orange-600/40",
    NFT: "from-pink-600/40 to-rose-600/40",
    SOCIAL: "from-sky-600/40 to-indigo-600/40",
    OTHER: "from-zinc-600/40 to-zinc-500/40",
  };
  return gradients[category] ?? gradients.OTHER;
}

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
        "group flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900",
        "transition-all duration-200",
        "hover:-translate-y-1 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5",
        className
      )}
    >
      {/* Image / Gradient Banner */}
      <div className="relative h-40 w-full overflow-hidden">
        {deal.featuredImageUrl ? (
          <img
            src={deal.featuredImageUrl}
            alt={deal.projectName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className={cn(
              "h-full w-full bg-gradient-to-br",
              getGradientByCategory(deal.category)
            )}
          />
        )}

        {/* Overlay badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge variant={statusConfig.variant} size="sm">
            {statusConfig.label}
          </Badge>
          <Badge variant="outline" size="sm">
            {CATEGORY_LABELS[deal.category]}
          </Badge>
        </div>

        {/* Chain badge */}
        <div className="absolute right-3 top-3">
          <Badge variant="outline" size="sm">
            {CHAIN_LABELS[deal.chain]}
          </Badge>
        </div>

        {/* Min tier badge */}
        {deal.minTierRequired && (
          <div className="absolute bottom-3 right-3">
            <Badge variant="warning" size="sm">
              {deal.minTierRequired} Tier
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Title & description */}
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-zinc-50 transition-colors group-hover:text-violet-400">
            {deal.projectName}
          </h3>
          {deal.shortDescription && (
            <p className="line-clamp-2 text-sm text-zinc-400">
              {deal.shortDescription}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="flex flex-col gap-1.5">
          <Progress value={raiseProgress} color="default" />
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>
              {formatCurrency(deal.totalRaised)} raised
            </span>
            <span>{formatCurrency(deal.hardCap)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 border-t border-zinc-800 pt-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">
              Price
            </span>
            <span className="text-sm font-medium text-zinc-50">
              {formatCurrency(deal.tokenPrice)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">
              Raise
            </span>
            <span className="text-sm font-medium text-zinc-50">
              ${formatLargeNumber(deal.totalRaise)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">
              FDV
            </span>
            <span className="text-sm font-medium text-zinc-50">
              {deal.fdv ? `$${formatLargeNumber(deal.fdv)}` : "--"}
            </span>
          </div>
        </div>

        {/* Countdown / Contributors */}
        <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Users className="h-3.5 w-3.5" />
            <span>{deal.contributorCount.toLocaleString()}</span>
          </div>
          {countdownTarget ? (
            <CompactCountdown targetDate={countdownTarget} />
          ) : (
            <span className="text-xs text-zinc-500">
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
      <Clock className="h-3.5 w-3.5 text-zinc-500" />
      <span className="font-mono text-zinc-300">{label}</span>
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
