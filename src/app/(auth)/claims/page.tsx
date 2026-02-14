"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatToken, formatDate } from "@/lib/utils/format";
import { Countdown } from "@/components/ui/countdown";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PortfolioItem {
  deal: {
    id: string;
    title: string;
    slug: string;
    projectName: string;
    status: string;
    tokenPrice: string;
    distributionTokenSymbol: string | null;
  };
  contribution: {
    id: string;
    amountUsd: string;
    createdAt: string;
  };
  vesting: {
    totalAmount: string;
    claimedAmount: string;
    claimableAmount: string;
    nextUnlockAt: string | null;
    nextUnlockAmount: string | null;
    percentComplete: number;
  } | null;
  currentValueUsd: string;
  roiPercent: number;
}

interface ClaimDeal {
  id: string;
  dealId: string;
  name: string;
  icon: string;
  tokenSymbol: string;
  totalAllocation: number;
  claimed: number;
  claimable: number;
  locked: number;
  nextUnlockDate: Date | null;
  tokenPrice: number;
  vestingPercent: number;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ClaimsSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
      <div className="mb-16">
        <div className="h-8 w-20 animate-pulse rounded bg-zinc-200" />
        <div className="mt-3 h-4 w-64 animate-pulse rounded bg-zinc-200" />
      </div>
      <div className="mb-16 grid grid-cols-3 gap-px border border-zinc-200">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-8">
            <div className="h-3 w-24 animate-pulse rounded bg-zinc-200" />
            <div className="mt-4 h-9 w-28 animate-pulse rounded bg-zinc-200" />
          </div>
        ))}
      </div>
      <div className="space-y-0">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="border-b border-zinc-200 py-8"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-5 w-32 animate-pulse rounded bg-zinc-200" />
                <div className="h-3 w-24 animate-pulse rounded bg-zinc-200" />
              </div>
              <div className="h-8 w-24 animate-pulse rounded bg-zinc-200" />
            </div>
            <div className="mt-4 h-1 w-full animate-pulse rounded-full bg-zinc-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ClaimsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimDeals, setClaimDeals] = useState<ClaimDeal[]>([]);

  useEffect(() => {
    async function fetchClaims() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/users/me/portfolio");
        const json = await res.json();
        if (!json.success) {
          throw new Error(
            json.error?.message || "Failed to load claims data"
          );
        }

        const items: PortfolioItem[] = json.data.portfolio.items;
        const vestingItems = items.filter((item) => item.vesting !== null);

        const deals: ClaimDeal[] = vestingItems.map((item) => {
          const vesting = item.vesting!;
          const totalTokens = parseFloat(vesting.totalAmount);
          const claimedTokens = parseFloat(vesting.claimedAmount);
          const claimableTokens = parseFloat(vesting.claimableAmount);
          const lockedTokens = Math.max(
            0,
            totalTokens - claimedTokens - claimableTokens
          );
          const tokenPrice = parseFloat(item.deal.tokenPrice);
          const tokenSymbol =
            item.deal.distributionTokenSymbol || "TOKEN";

          return {
            id: item.contribution.id,
            dealId: item.deal.id,
            name: item.deal.projectName || item.deal.title,
            icon: (item.deal.projectName || item.deal.title)
              .substring(0, 2)
              .toUpperCase(),
            tokenSymbol,
            totalAllocation: Math.round(totalTokens),
            claimed: Math.round(claimedTokens),
            claimable: Math.round(claimableTokens),
            locked: Math.round(lockedTokens),
            nextUnlockDate: vesting.nextUnlockAt
              ? new Date(vesting.nextUnlockAt)
              : null,
            tokenPrice,
            vestingPercent: vesting.percentComplete,
          };
        });

        setClaimDeals(deals);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load claims data"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchClaims();
  }, []);

  if (loading) return <ClaimsSkeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="flex flex-col items-center justify-center py-24">
          <p className="font-serif text-xl font-normal text-zinc-500">
            Unable to load claims
          </p>
          <p className="mt-2 text-sm font-normal text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  // Summary calculations
  const totalClaimableValue = claimDeals.reduce(
    (s, d) => s + d.claimable * d.tokenPrice,
    0
  );
  const totalClaimedAllTime = claimDeals.reduce((s, d) => s + d.claimed, 0);
  const nextUnlock = claimDeals.reduce(
    (earliest: Date | null, d) => {
      if (!d.nextUnlockDate) return earliest;
      if (!earliest) return d.nextUnlockDate;
      return d.nextUnlockDate < earliest ? d.nextUnlockDate : earliest;
    },
    null
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
      {/* Header */}
      <div className="mb-16">
        <h1 className="font-serif text-3xl font-light text-zinc-900">
          Claims
        </h1>
        <p className="mt-2 text-sm font-normal text-zinc-500">
          Manage and claim your vested token allocations.
        </p>
      </div>

      {/* Summary */}
      <div className="mb-16 grid grid-cols-3 gap-px border border-zinc-200">
        <div className="p-8">
          <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
            Claimable Value
          </span>
          <p className="mt-3 font-serif text-3xl font-light tabular-nums text-zinc-900">
            {formatCurrency(totalClaimableValue)}
          </p>
          <p className="mt-1 text-xs font-normal text-zinc-400">
            {claimDeals.filter((d) => d.claimable > 0).length} deal
            {claimDeals.filter((d) => d.claimable > 0).length !== 1
              ? "s"
              : ""}
          </p>
        </div>
        <div className="p-8">
          <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
            Total Claimed
          </span>
          <p className="mt-3 font-serif text-3xl font-light tabular-nums text-zinc-900">
            {totalClaimedAllTime.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-normal text-zinc-400">tokens</p>
        </div>
        <div className="p-8">
          <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
            Next Unlock
          </span>
          <p className="mt-3 font-serif text-xl font-normal text-zinc-900">
            {nextUnlock ? formatDate(nextUnlock) : "None scheduled"}
          </p>
        </div>
      </div>

      {/* Claims List */}
      {claimDeals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <p className="font-serif text-lg font-normal text-zinc-500">
            No claims available
          </p>
          <p className="mt-2 text-sm font-normal text-zinc-400">
            Contribute to deals with vesting to start earning tokens.
          </p>
        </div>
      ) : (
        <div>
          {claimDeals.map((deal) => {
            const claimedPct =
              deal.totalAllocation > 0
                ? (deal.claimed / deal.totalAllocation) * 100
                : 0;
            const claimablePct =
              deal.totalAllocation > 0
                ? (deal.claimable / deal.totalAllocation) * 100
                : 0;

            return (
              <div
                key={deal.id}
                className="border-b border-zinc-200 py-8"
              >
                {/* Top row: name + claim button */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-normal text-zinc-800">
                      {deal.name}
                    </h3>
                    <p className="mt-1 text-xs font-normal text-zinc-400">
                      {deal.tokenSymbol} &middot;{" "}
                      {formatToken(deal.totalAllocation, 0)} total allocation
                    </p>
                  </div>
                  {deal.claimable > 0 ? (
                    <button
                      disabled
                      title="Coming soon"
                      className="border border-violet-500 bg-violet-500 px-4 py-1.5 text-xs font-normal text-white opacity-80 transition-colors hover:bg-violet-600"
                    >
                      Claim {deal.claimable.toLocaleString()} {deal.tokenSymbol}
                    </button>
                  ) : (
                    <span className="text-xs font-normal text-zinc-300">
                      Nothing to claim
                    </span>
                  )}
                </div>

                {/* Vesting progress bar (thin h-1) */}
                <div className="mt-5">
                  <div className="flex h-px w-full overflow-hidden bg-zinc-200">
                    <div
                      className="h-full bg-zinc-500 transition-all"
                      style={{ width: `${claimedPct}%` }}
                    />
                    <div
                      className="h-full bg-violet-500 transition-all"
                      style={{ width: `${claimablePct}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-6 text-xs font-normal text-zinc-400">
                    <span>
                      {deal.claimed.toLocaleString()} claimed ({claimedPct.toFixed(0)}%)
                    </span>
                    <span>
                      {deal.claimable.toLocaleString()} claimable ({claimablePct.toFixed(0)}%)
                    </span>
                    <span>
                      {deal.locked.toLocaleString()} locked
                    </span>
                  </div>
                </div>

                {/* Next unlock */}
                {deal.nextUnlockDate && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs font-normal text-zinc-400">
                      Next unlock: {formatDate(deal.nextUnlockDate)}
                    </p>
                    <Countdown
                      targetDate={deal.nextUnlockDate}
                      className="text-xs font-normal text-zinc-500"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
