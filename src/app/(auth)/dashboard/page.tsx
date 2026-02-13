"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  Clock,
  Shield,
  Gift,
  Zap,
  CalendarClock,
  ExternalLink,
  ChevronRight,
  Crown,
  Star,
  Lock,
  Coins,
  DollarSign,
  Rocket,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Countdown } from "@/components/ui/countdown";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils/cn";
import {
  formatCurrency,
  formatAddress,
  formatRelativeTime,
  formatToken,
  formatPercent,
  formatDate,
} from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserProfile {
  walletAddress: string;
  displayName: string | null;
  tierLevel: string;
  stats: {
    totalContributedUsd: string;
    portfolioValueUsd: string;
    totalPnlPercent: number;
    activeDeals: number;
    dealsParticipated: number;
    stakingBalance: string;
    referralCount: number;
    referralEarnings: string;
  };
}

interface PortfolioItem {
  deal: {
    id: string;
    title: string;
    slug: string;
    projectName: string;
    status: string;
    distributionTokenSymbol: string | null;
    tokenPrice: string;
  };
  contribution: {
    amountUsd: string;
    createdAt: string;
  };
  vesting: {
    totalAmount: string;
    claimedAmount: string;
    claimableAmount: string;
    nextUnlockAt: string | null;
    percentComplete: number;
  } | null;
  currentValueUsd: string;
  roiPercent: number;
}

interface PortfolioData {
  summary: {
    totalInvestedUsd: string;
    currentValueUsd: string;
    totalPnlUsd: string;
    totalPnlPercent: number;
    activePositions: number;
    vestingPositions: number;
    completedPositions: number;
  };
  items: PortfolioItem[];
}

interface ContributionEntry {
  id: string;
  amount: string;
  amountUsd: string;
  currency: string;
  status: string;
  createdAt: string;
  txHash: string | null;
  deal: {
    title: string;
    distributionTokenSymbol: string | null;
  };
}

interface StakingData {
  currentTier: string;
  totalStaked: string;
  totalRewardsEarned: string;
  pendingRewards: string;
  nextTierRequirement: {
    tier: string;
    amountRequired: string;
    amountNeeded: string;
  } | null;
  positions: {
    id: string;
    amount: string;
    lockPeriod: string;
    unlockAt: string | null;
  }[];
}

// ---------------------------------------------------------------------------
// Tier benefits configuration (static)
// ---------------------------------------------------------------------------

const TIER_BENEFITS: Record<string, string[]> = {
  BRONZE: [
    "1x allocation multiplier",
    "Community round access",
    "1 lottery ticket per round",
  ],
  SILVER: [
    "2x allocation multiplier",
    "Priority access to deals",
    "3 lottery tickets per round",
  ],
  GOLD: [
    "4x allocation multiplier",
    "Guaranteed allocation",
    "8 lottery tickets per round",
    "Early access to new deals",
  ],
  PLATINUM: [
    "8x allocation multiplier",
    "Guaranteed allocation",
    "20 lottery tickets per round",
    "Strategic round access",
  ],
  DIAMOND: [
    "16x allocation multiplier",
    "Guaranteed allocation",
    "50 lottery tickets per round",
    "All deal tiers including private rounds",
  ],
};

const TIER_ORDER = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"];
const TIER_THRESHOLDS: Record<string, number> = {
  BRONZE: 1000,
  SILVER: 5000,
  GOLD: 15000,
  PLATINUM: 50000,
  DIAMOND: 150000,
};

function getNextTierInfo(currentTier: string) {
  const idx = TIER_ORDER.indexOf(currentTier);
  if (idx < 0 || idx >= TIER_ORDER.length - 1) return null;
  const nextTier = TIER_ORDER[idx + 1];
  return { tier: nextTier, threshold: TIER_THRESHOLDS[nextTier] };
}

function tierDisplayName(tier: string): string {
  return tier.charAt(0) + tier.slice(1).toLowerCase();
}

// ---------------------------------------------------------------------------
// Skeleton Components
// ---------------------------------------------------------------------------

function StatsRowSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-800/40 bg-zinc-800/40 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex flex-col gap-2 bg-zinc-950 p-6">
          <div className="h-3 w-20 animate-pulse rounded bg-zinc-800" />
          <div className="h-7 w-28 animate-pulse rounded bg-zinc-800" />
          <div className="h-3 w-24 animate-pulse rounded bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

function DealTableSkeleton() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div className="h-5 w-24 animate-pulse rounded bg-zinc-800" />
        <div className="h-8 w-20 animate-pulse rounded bg-zinc-800" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-8 w-8 animate-pulse rounded-md bg-zinc-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-zinc-800" />
                <div className="h-3 w-20 animate-pulse rounded bg-zinc-800" />
              </div>
              <div className="h-4 w-16 animate-pulse rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivitySkeleton() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div className="h-5 w-28 animate-pulse rounded bg-zinc-800" />
        <div className="h-8 w-24 animate-pulse rounded bg-zinc-800" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="h-7 w-7 animate-pulse rounded-md bg-zinc-800" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-40 animate-pulse rounded bg-zinc-800" />
                <div className="h-3 w-16 animate-pulse rounded bg-zinc-800" />
              </div>
              <div className="h-4 w-20 animate-pulse rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TierSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-24 animate-pulse rounded bg-zinc-800" />
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-6 w-20 animate-pulse rounded bg-zinc-800" />
          <div className="h-5 w-20 animate-pulse rounded bg-zinc-800" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-3 w-28 animate-pulse rounded bg-zinc-800" />
            <div className="h-3 w-32 animate-pulse rounded bg-zinc-800" />
          </div>
          <div className="h-2 w-full animate-pulse rounded-full bg-zinc-800" />
        </div>
        <div className="space-y-2 border-t border-zinc-800/40 pt-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-zinc-800" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [contributions, setContributions] = useState<ContributionEntry[]>([]);
  const [staking, setStaking] = useState<StakingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const [userRes, portfolioRes, contributionsRes, stakingRes] =
          await Promise.all([
            fetch("/api/users/me"),
            fetch("/api/users/me/portfolio"),
            fetch("/api/contributions?limit=5"),
            fetch("/api/staking"),
          ]);

        const [userData, portfolioData, contributionsData, stakingData] =
          await Promise.all([
            userRes.json(),
            portfolioRes.json(),
            contributionsRes.json(),
            stakingRes.json(),
          ]);

        if (!userData.success) {
          throw new Error(userData.error?.message || "Failed to load user data");
        }

        setUser(userData.data.user);
        setPortfolio(portfolioData.success ? portfolioData.data.portfolio : null);
        setContributions(
          contributionsData.success ? contributionsData.data.contributions : []
        );
        setStaking(stakingData.success ? stakingData.data.staking : null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Alert variant="error" title="Error loading dashboard">
          {error}
        </Alert>
      </div>
    );
  }

  // Derive display values
  const walletDisplay = user
    ? formatAddress(user.walletAddress)
    : "";
  const portfolioValue = portfolio
    ? parseFloat(portfolio.summary.currentValueUsd)
    : 0;
  const totalPnlPercent = portfolio ? portfolio.summary.totalPnlPercent : 0;
  const activeDealsCount = user ? user.stats.activeDeals : 0;
  const currentTier = user?.tierLevel || "BRONZE";
  const totalStaked = staking ? parseFloat(staking.totalStaked) : 0;

  // Derive active deals from portfolio items
  const activeDeals = portfolio
    ? portfolio.items
        .filter((item) => item.deal.status !== "COMPLETED" && item.deal.status !== "CANCELLED")
        .slice(0, 4)
    : [];

  // Derive pending claims count
  const pendingClaims = portfolio
    ? portfolio.items.reduce((sum, item) => {
        if (item.vesting && parseFloat(item.vesting.claimableAmount) > 0) {
          return sum + parseFloat(item.vesting.claimableAmount);
        }
        return sum;
      }, 0)
    : 0;
  const pendingClaimDeals = portfolio
    ? portfolio.items.filter(
        (item) => item.vesting && parseFloat(item.vesting.claimableAmount) > 0
      ).length
    : 0;

  // Upcoming events from vesting schedules
  const upcomingEvents = portfolio
    ? portfolio.items
        .filter((item) => item.vesting?.nextUnlockAt)
        .map((item) => ({
          id: item.deal.id,
          title: `${item.deal.projectName || item.deal.title} vesting unlock`,
          date: new Date(item.vesting!.nextUnlockAt!),
          icon: Lock,
          type: "unlock" as const,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 4)
    : [];

  // Tier progress
  const nextTierInfo = getNextTierInfo(currentTier);
  const progressToNext = nextTierInfo
    ? Math.min(100, (totalStaked / nextTierInfo.threshold) * 100)
    : 100;
  const currentBenefits = TIER_BENEFITS[currentTier] || [];
  const nextBenefits = nextTierInfo
    ? TIER_BENEFITS[nextTierInfo.tier] || []
    : [];

  // Status label for active deals
  const liveCount = activeDeals.filter(
    (d) => d.deal.status === "OPEN" || d.deal.status === "LIVE"
  ).length;
  const vestingCount = activeDeals.filter(
    (d) => d.vesting !== null
  ).length;
  const fundedCount = activeDeals.filter(
    (d) => d.deal.status === "FUNDED" || d.deal.status === "CLOSED"
  ).length;
  const statusParts = [
    liveCount > 0 && `${liveCount} live`,
    vestingCount > 0 && `${vestingCount} vesting`,
    fundedCount > 0 && `${fundedCount} funded`,
  ].filter(Boolean);

  // Activity type icon mapping
  function getActivityIcon(type: string) {
    switch (type) {
      case "CONFIRMED":
        return DollarSign;
      case "PENDING":
        return Clock;
      default:
        return DollarSign;
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome */}
      <div>
        <h1 className="font-serif text-2xl font-light text-zinc-100">
          Welcome back{user?.displayName ? `, ${user.displayName}` : ""}
        </h1>
        <p className="mt-1 text-sm font-light text-zinc-500">
          {loading ? (
            <span className="inline-block h-4 w-24 animate-pulse rounded bg-zinc-800" />
          ) : (
            walletDisplay
          )}
        </p>
      </div>

      {/* Stats Row */}
      {loading ? (
        <StatsRowSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-800/40 bg-zinc-800/40 lg:grid-cols-4">
          <div className="flex flex-col gap-1 bg-zinc-950 p-6">
            <span className="text-xs font-light uppercase tracking-wider text-zinc-600">
              Portfolio Value
            </span>
            <span className="font-serif text-2xl font-light tabular-nums text-zinc-100">
              {formatCurrency(portfolioValue)}
            </span>
            <span className="text-xs font-light text-zinc-500">
              {totalPnlPercent >= 0 ? "+" : ""}
              {totalPnlPercent.toFixed(1)}% all time
            </span>
          </div>
          <div className="flex flex-col gap-1 bg-zinc-950 p-6">
            <span className="text-xs font-light uppercase tracking-wider text-zinc-600">
              Active Deals
            </span>
            <span className="font-serif text-2xl font-light tabular-nums text-zinc-100">
              {activeDealsCount}
            </span>
            <span className="text-xs font-light text-zinc-500">
              {statusParts.length > 0 ? statusParts.join(", ") : "No active deals"}
            </span>
          </div>
          <div className="flex flex-col gap-1 bg-zinc-950 p-6">
            <span className="text-xs font-light uppercase tracking-wider text-zinc-600">
              Pending Claims
            </span>
            <span className="font-serif text-2xl font-light tabular-nums text-zinc-100">
              {pendingClaims > 0
                ? pendingClaims.toLocaleString("en-US", { maximumFractionDigits: 0 })
                : "0"}
            </span>
            <span className="text-xs font-light text-zinc-500">
              {pendingClaimDeals > 0
                ? `Across ${pendingClaimDeals} deal${pendingClaimDeals > 1 ? "s" : ""}`
                : "No pending claims"}
            </span>
          </div>
          <div className="flex flex-col gap-1 bg-zinc-950 p-6">
            <span className="text-xs font-light uppercase tracking-wider text-zinc-600">
              Tier Status
            </span>
            <span className="font-serif text-2xl font-light tabular-nums text-zinc-100">
              {tierDisplayName(currentTier)}
            </span>
            <span className="text-xs font-light text-zinc-500">
              {TIER_BENEFITS[currentTier]?.[0] || ""}
            </span>
          </div>
        </div>
      )}

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left Column -- 3/5 */}
        <div className="space-y-6 lg:col-span-3">
          {/* Active Deals */}
          {loading ? (
            <DealTableSkeleton />
          ) : (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Active Deals</CardTitle>
                <Link href="/portfolio">
                  <Button variant="ghost" size="sm">
                    View All <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {activeDeals.length === 0 ? (
                  <p className="py-6 text-center text-sm font-light text-zinc-500">
                    No active deals yet. Browse available deals to get started.
                  </p>
                ) : (
                  <>
                    {/* Table header */}
                    <div className="grid grid-cols-5 gap-4 border-b border-zinc-800/40 pb-2 text-[10px] font-light uppercase tracking-wider text-zinc-600">
                      <span className="col-span-2">Project</span>
                      <span>Contributed</span>
                      <span>Value</span>
                      <span className="text-right">PnL</span>
                    </div>

                    {/* Table rows */}
                    <div className="divide-y divide-zinc-800/30">
                      {activeDeals.map((item) => {
                        const contributed = parseFloat(item.contribution.amountUsd);
                        const currentValue = parseFloat(item.currentValueUsd);
                        const pnl = item.roiPercent;
                        const tokenSymbol =
                          item.deal.distributionTokenSymbol || "TOKEN";
                        const statusLabel =
                          item.deal.status === "OPEN" || item.deal.status === "LIVE"
                            ? "Live"
                            : item.vesting
                            ? "Vesting"
                            : item.deal.status === "FUNDED" || item.deal.status === "CLOSED"
                            ? "Funded"
                            : item.deal.status;

                        return (
                          <div
                            key={item.deal.id}
                            className="grid grid-cols-5 items-center gap-4 py-3.5"
                          >
                            <div className="col-span-2 flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-800/60 text-xs font-medium text-zinc-400">
                                {(item.deal.projectName || item.deal.title).charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-zinc-200">
                                  {item.deal.projectName || item.deal.title}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-light text-zinc-600">
                                    {tokenSymbol}
                                  </span>
                                  <span className="rounded-sm border border-zinc-800 px-1.5 py-px text-[10px] font-light text-zinc-500">
                                    {statusLabel}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-light text-zinc-300">
                                {formatCurrency(contributed)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-light text-zinc-300">
                                {formatCurrency(currentValue)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p
                                className={cn(
                                  "text-sm font-light",
                                  pnl >= 0 ? "text-emerald-800" : "text-rose-800"
                                )}
                                style={{
                                  color: pnl >= 0 ? "#6ee7b7" : "#fda4af",
                                  opacity: 0.7,
                                }}
                              >
                                {pnl >= 0 ? "+" : ""}
                                {formatPercent(pnl)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Events */}
          {loading ? (
            <Card>
              <CardHeader>
                <div className="h-5 w-32 animate-pulse rounded bg-zinc-800" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="h-8 w-8 animate-pulse rounded-md bg-zinc-800" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-48 animate-pulse rounded bg-zinc-800" />
                        <div className="h-3 w-24 animate-pulse rounded bg-zinc-800" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <p className="py-6 text-center text-sm font-light text-zinc-500">
                    No upcoming events
                  </p>
                ) : (
                  <div className="relative space-y-0">
                    {upcomingEvents.map((event, idx) => {
                      const IconComponent = event.icon;
                      return (
                        <div key={event.id} className="flex gap-4 pb-6 last:pb-0">
                          {/* Timeline line */}
                          <div className="relative flex flex-col items-center">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-800/60 bg-zinc-900/50 text-zinc-500">
                              <IconComponent className="h-3.5 w-3.5" />
                            </div>
                            {idx < upcomingEvents.length - 1 && (
                              <div className="mt-1 h-full w-px bg-zinc-800/40" />
                            )}
                          </div>
                          {/* Content */}
                          <div className="flex flex-1 items-start justify-between gap-3 pt-0.5">
                            <div>
                              <p className="text-sm font-light text-zinc-300">
                                {event.title}
                              </p>
                              <p className="mt-0.5 text-xs font-light text-zinc-600">
                                {event.date.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                            <Countdown
                              targetDate={event.date}
                              className="shrink-0 text-xs"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column -- 2/5 */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recent Activity */}
          {loading ? (
            <ActivitySkeleton />
          ) : (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <Link href="/portfolio">
                  <Button variant="ghost" size="sm">
                    All Activity <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {contributions.length === 0 ? (
                  <p className="py-6 text-center text-sm font-light text-zinc-500">
                    No recent activity
                  </p>
                ) : (
                  <div className="divide-y divide-zinc-800/30">
                    {contributions.map((activity) => {
                      const IconComponent = getActivityIcon(activity.status);
                      const amountUsd = parseFloat(activity.amountUsd);
                      return (
                        <div
                          key={activity.id}
                          className="flex items-center gap-3 py-3"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-800/50 text-zinc-500">
                            <IconComponent className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-light text-zinc-300">
                              Contributed to {activity.deal.title}
                            </p>
                            <p className="text-xs font-light text-zinc-600">
                              {formatRelativeTime(activity.createdAt)}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-light text-zinc-300">
                              {formatCurrency(amountUsd)}
                            </p>
                            {activity.txHash && (
                              <a
                                href="#"
                                className="inline-flex items-center gap-1 text-xs font-light text-zinc-600 hover:text-zinc-400"
                              >
                                Tx <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tier Progress */}
          {loading ? (
            <TierSkeleton />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Tier Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Current Tier */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-zinc-500" />
                    <span className="font-serif text-lg font-light text-zinc-100">
                      {tierDisplayName(currentTier)}
                    </span>
                  </div>
                  <span className="rounded-md border border-zinc-800 px-2 py-0.5 text-[11px] font-light text-zinc-500">
                    Current Tier
                  </span>
                </div>

                {/* Progress */}
                {nextTierInfo ? (
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-light text-zinc-500">
                        {formatToken(totalStaked, 0, "EXPO")} staked
                      </span>
                      <span className="font-light text-zinc-600">
                        {formatToken(nextTierInfo.threshold, 0, "EXPO")} for{" "}
                        {tierDisplayName(nextTierInfo.tier)}
                      </span>
                    </div>
                    <Progress value={progressToNext} color="default" />
                    <p className="mt-2 text-center text-xs font-light text-zinc-600">
                      Stake{" "}
                      <span className="text-zinc-400">
                        {formatToken(
                          Math.max(0, nextTierInfo.threshold - totalStaked),
                          0,
                          "EXPO"
                        )}
                      </span>{" "}
                      more to reach {tierDisplayName(nextTierInfo.tier)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <Progress value={100} color="default" />
                    <p className="mt-2 text-center text-xs font-light text-zinc-600">
                      You have reached the highest tier
                    </p>
                  </div>
                )}

                {/* Benefits Comparison */}
                <div className="space-y-3 border-t border-zinc-800/40 pt-4">
                  <p className="text-xs font-light uppercase tracking-wider text-zinc-600">
                    Current benefits
                  </p>
                  <ul className="space-y-1.5">
                    {currentBenefits.map((b) => (
                      <li
                        key={b}
                        className="flex items-center gap-2 text-sm font-light text-zinc-400"
                      >
                        <Star className="h-3 w-3 text-zinc-600" />
                        {b}
                      </li>
                    ))}
                  </ul>

                  {nextTierInfo && nextBenefits.length > 0 && (
                    <>
                      <p className="text-xs font-light uppercase tracking-wider text-zinc-600">
                        {tierDisplayName(nextTierInfo.tier)} unlocks
                      </p>
                      <ul className="space-y-1.5">
                        {nextBenefits.map((b) => (
                          <li
                            key={b}
                            className="flex items-center gap-2 text-sm font-light text-zinc-600"
                          >
                            <Lock className="h-3 w-3 text-zinc-700" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>

                <Link href="/staking" className="block">
                  <button className="w-full rounded-md border border-zinc-700 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-600 hover:text-zinc-100">
                    <span className="inline-flex items-center gap-2">
                      <Coins className="h-4 w-4" />
                      Stake More EXPO
                    </span>
                  </button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
