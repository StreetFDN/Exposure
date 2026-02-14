"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  formatCurrency,
  formatAddress,
  formatRelativeTime,
  formatToken,
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
// Helpers
// ---------------------------------------------------------------------------

function tierDisplayName(tier: string): string {
  return tier.charAt(0) + tier.slice(1).toLowerCase();
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
      <div className="mb-16">
        <div className="h-8 w-64 animate-pulse rounded bg-zinc-200" />
        <div className="mt-3 h-4 w-32 animate-pulse rounded bg-zinc-200" />
      </div>
      <div className="mb-16 grid grid-cols-2 gap-px border border-zinc-200 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-8">
            <div className="h-3 w-24 animate-pulse rounded bg-zinc-200" />
            <div className="mt-4 h-9 w-32 animate-pulse rounded bg-zinc-200" />
            <div className="mt-2 h-3 w-20 animate-pulse rounded bg-zinc-200" />
          </div>
        ))}
      </div>
      <div className="space-y-0">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b border-zinc-200 py-5"
          >
            <div className="space-y-2">
              <div className="h-4 w-48 animate-pulse rounded bg-zinc-200" />
              <div className="h-3 w-24 animate-pulse rounded bg-zinc-200" />
            </div>
            <div className="h-4 w-20 animate-pulse rounded bg-zinc-200" />
          </div>
        ))}
      </div>
    </div>
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
          throw new Error(
            userData.error?.message || "Failed to load user data"
          );
        }

        setUser(userData.data.user);
        setPortfolio(
          portfolioData.success ? portfolioData.data.portfolio : null
        );
        setContributions(
          contributionsData.success
            ? contributionsData.data.contributions
            : []
        );
        setStaking(stakingData.success ? stakingData.data.staking : null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="flex flex-col items-center justify-center py-24">
          <p className="font-serif text-xl font-normal text-zinc-500">
            Unable to load your dashboard
          </p>
          <p className="mt-2 text-sm font-normal text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------

  const portfolioValue = portfolio
    ? parseFloat(portfolio.summary.currentValueUsd)
    : 0;
  const totalInvested = portfolio
    ? parseFloat(portfolio.summary.totalInvestedUsd)
    : 0;
  const totalPnlPercent = portfolio ? portfolio.summary.totalPnlPercent : 0;
  const activeDealsCount = user ? user.stats.activeDeals : 0;
  const currentTier = user?.tierLevel || "BRONZE";
  const totalStaked = staking ? parseFloat(staking.totalStaked) : 0;
  const referralCount = user ? user.stats.referralCount : 0;

  const upcomingEvents = portfolio
    ? portfolio.items
        .filter((item) => item.vesting?.nextUnlockAt)
        .map((item) => ({
          id: item.deal.id,
          title: item.deal.projectName || item.deal.title,
          date: new Date(item.vesting!.nextUnlockAt!),
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 3)
    : [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
      {/* ----------------------------------------------------------------- */}
      {/* Welcome                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="mb-16">
        <h1 className="font-serif text-3xl font-light text-zinc-900">
          {getGreeting()}
          {user?.displayName ? `, ${user.displayName}` : ""}
        </h1>
        <p className="mt-2 text-sm font-normal text-zinc-500">
          {user ? formatAddress(user.walletAddress) : ""}
        </p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Stats Grid                                                         */}
      {/* ----------------------------------------------------------------- */}
      <div className="mb-16 grid grid-cols-2 gap-px border border-zinc-200 lg:grid-cols-4">
        <div className="p-8">
          <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
            Portfolio Value
          </span>
          <p className="mt-3 font-serif text-3xl font-light tabular-nums text-zinc-900">
            {formatCurrency(portfolioValue)}
          </p>
          <p className="mt-1 text-xs font-normal text-zinc-500">
            {totalPnlPercent >= 0 ? "+" : ""}
            {totalPnlPercent.toFixed(1)}% all time
          </p>
        </div>

        <div className="p-8">
          <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
            Total Invested
          </span>
          <p className="mt-3 font-serif text-3xl font-light tabular-nums text-zinc-900">
            {formatCurrency(totalInvested)}
          </p>
          <p className="mt-1 text-xs font-normal text-zinc-500">
            {user?.stats.dealsParticipated || 0} deals
          </p>
        </div>

        <div className="p-8">
          <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
            Active Deals
          </span>
          <p className="mt-3 font-serif text-3xl font-light tabular-nums text-zinc-900">
            {activeDealsCount}
          </p>
          <p className="mt-1 text-xs font-normal text-zinc-500">
            {formatToken(totalStaked, 0, "EXPO")} staked
          </p>
        </div>

        <div className="p-8">
          <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
            Tier &middot; Referrals
          </span>
          <p className="mt-3 font-serif text-3xl font-light tabular-nums text-zinc-900">
            {tierDisplayName(currentTier)}
          </p>
          <p className="mt-1 text-xs font-normal text-zinc-500">
            {referralCount} referral{referralCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Two-column: Activity + Quick Actions                               */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="font-serif text-lg font-normal text-zinc-900">
              Recent Activity
            </h2>
            <Link
              href="/portfolio"
              className="text-xs font-normal text-zinc-500 transition-colors hover:text-zinc-600"
            >
              View all
            </Link>
          </div>

          {contributions.length === 0 ? (
            <p className="py-12 text-center font-serif text-sm font-normal text-zinc-400">
              No recent activity
            </p>
          ) : (
            <div>
              {contributions.map((activity) => {
                const amountUsd = parseFloat(activity.amountUsd);
                return (
                  <div
                    key={activity.id}
                    className="group flex items-center justify-between border-b border-zinc-200 py-5 transition-colors hover:border-zinc-300"
                  >
                    <div>
                      <p className="text-sm font-normal text-zinc-600">
                        Contributed to{" "}
                        <span className="text-zinc-800">
                          {activity.deal.title}
                        </span>
                      </p>
                      <p className="mt-1 text-xs font-normal text-zinc-400">
                        {formatRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-normal tabular-nums text-zinc-600">
                        {formatCurrency(amountUsd)}
                      </span>
                      {activity.txHash && (
                        <a
                          href="#"
                          className="text-zinc-400 transition-colors hover:text-zinc-500"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions + Upcoming */}
        <div>
          <h2 className="mb-6 font-serif text-lg font-normal text-zinc-900">
            Quick Actions
          </h2>
          <div className="space-y-0">
            <Link
              href="/portfolio"
              className="block border-b border-zinc-200 py-4 text-sm font-normal text-zinc-500 transition-colors hover:text-zinc-700"
            >
              View Portfolio
            </Link>
            <Link
              href="/staking"
              className="block border-b border-zinc-200 py-4 text-sm font-normal text-zinc-500 transition-colors hover:text-zinc-700"
            >
              Stake EXPO
            </Link>
            <Link
              href="/claims"
              className="block border-b border-zinc-200 py-4 text-sm font-normal text-zinc-500 transition-colors hover:text-zinc-700"
            >
              Claim Tokens
            </Link>
            <Link
              href="/referrals"
              className="block border-b border-zinc-200 py-4 text-sm font-normal text-zinc-500 transition-colors hover:text-zinc-700"
            >
              Invite Friends
            </Link>
          </div>

          {upcomingEvents.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-6 font-serif text-lg font-normal text-zinc-900">
                Upcoming Unlocks
              </h2>
              <div className="space-y-0">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="border-b border-zinc-200 py-4"
                  >
                    <p className="text-sm font-normal text-zinc-600">
                      {event.title}
                    </p>
                    <p className="mt-1 text-xs font-normal text-zinc-400">
                      {event.date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
