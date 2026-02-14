"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, formatDate } from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReferralStats {
  total: number;
  active: number;
  pending: number;
  totalEarned: string;
  pendingRewards: string;
  lifetimeVolume: string;
}

interface RewardStructure {
  registrationBonus: string;
  contributionPercent: number;
  stakingPercent: number;
  maxRewardPerReferral: string;
  vestingPeriod: string;
}

interface ApiReferral {
  id: string;
  userId: string;
  walletAddress: string;
  displayName: string | null;
  status: "ACTIVE" | "PENDING";
  joinedAt: string;
  firstContributionAt: string | null;
  totalContributed: string;
  rewardEarned: string;
  rewardStatus: string;
  tier: string;
}

interface ReferralData {
  referralCode: string;
  referralLink: string;
  stats: ReferralStats;
  rewardStructure: RewardStructure;
  referrals: ApiReferral[];
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ReferralsSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
      <div className="mb-16">
        <div className="h-8 w-28 animate-pulse rounded bg-zinc-200" />
        <div className="mt-3 h-4 w-72 animate-pulse rounded bg-zinc-200" />
      </div>
      <div className="mb-12 h-14 animate-pulse rounded bg-zinc-200" />
      <div className="mb-16 grid grid-cols-4 gap-px border border-zinc-200">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-8">
            <div className="h-3 w-20 animate-pulse rounded bg-zinc-200" />
            <div className="mt-4 h-9 w-20 animate-pulse rounded bg-zinc-200" />
          </div>
        ))}
      </div>
      <div className="space-y-0">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b border-zinc-200 py-5"
          >
            <div className="h-4 w-32 animate-pulse rounded bg-zinc-200" />
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

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const fetchReferrals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/referrals");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load referrals");
      }
      setData(json.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load referrals"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(data?.referralLink || "");
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // fail silently
    }
  };

  if (loading) return <ReferralsSkeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="flex flex-col items-center justify-center py-24">
          <p className="font-serif text-xl font-normal text-zinc-500">
            Unable to load referrals
          </p>
          <p className="mt-2 text-sm font-normal text-zinc-400">{error}</p>
          <button
            onClick={fetchReferrals}
            className="mt-4 text-xs font-normal text-zinc-500 transition-colors hover:text-zinc-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const referralLink = data?.referralLink || "";
  const referralCode = data?.referralCode || "";
  const referrals = data?.referrals || [];
  const rewardStructure = data?.rewardStructure;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
      {/* Header */}
      <div className="mb-16">
        <h1 className="font-serif text-3xl font-light text-zinc-900">
          Referrals
        </h1>
        <p className="mt-2 text-sm font-normal text-zinc-500">
          Invite friends, earn commission on every contribution they make.
        </p>
      </div>

      {/* Referral Code + Link */}
      <div className="mb-12 flex items-center justify-between border border-zinc-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
            Your Code
          </span>
          <code className="font-mono text-sm font-normal tracking-wide text-zinc-700">
            {referralCode}
          </code>
        </div>
        <div className="flex items-center gap-3">
          <code className="hidden text-xs font-normal text-zinc-500 sm:block">
            {referralLink}
          </code>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-xs font-normal text-zinc-500 transition-colors hover:text-zinc-700"
          >
            {linkCopied ? (
              <>
                <Check className="h-3 w-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> Copy Link
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-16 grid grid-cols-2 gap-px border border-zinc-200 lg:grid-cols-4">
        <div className="p-8">
          <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
            Total Referrals
          </span>
          <p className="mt-3 font-serif text-3xl font-light tabular-nums text-zinc-900">
            {stats?.total ?? 0}
          </p>
        </div>
        <div className="p-8">
          <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
            Active
          </span>
          <p className="mt-3 font-serif text-3xl font-light tabular-nums text-zinc-900">
            {stats?.active ?? 0}
          </p>
        </div>
        <div className="p-8">
          <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
            Total Earned
          </span>
          <p className="mt-3 font-serif text-3xl font-light tabular-nums text-zinc-900">
            {formatCurrency(parseFloat(stats?.totalEarned ?? "0"))}
          </p>
        </div>
        <div className="p-8">
          <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
            Pending Rewards
          </span>
          <p className="mt-3 font-serif text-3xl font-light tabular-nums text-zinc-900">
            {formatCurrency(parseFloat(stats?.pendingRewards ?? "0"))}
          </p>
        </div>
      </div>

      {/* Two-column: Referral List + Reward Structure */}
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-3">
        {/* Referral List */}
        <div className="lg:col-span-2">
          <h2 className="mb-6 font-serif text-lg font-normal text-zinc-900">
            Your Referrals
          </h2>

          {referrals.length === 0 ? (
            <p className="py-12 text-center font-serif text-sm font-normal text-zinc-400">
              No referrals yet. Share your link to get started.
            </p>
          ) : (
            <div>
              {/* Table header */}
              <div className="grid grid-cols-5 gap-4 border-b border-zinc-200 pb-3">
                <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
                  Wallet
                </span>
                <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
                  Status
                </span>
                <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
                  Joined
                </span>
                <span className="text-right text-xs font-normal uppercase tracking-widest text-zinc-500">
                  Contributions
                </span>
                <span className="text-right text-xs font-normal uppercase tracking-widest text-zinc-500">
                  Your Earnings
                </span>
              </div>
              {referrals.map((ref) => {
                const contributed = parseFloat(ref.totalContributed);
                const earned = parseFloat(ref.rewardEarned);
                return (
                  <div
                    key={ref.id}
                    className="grid grid-cols-5 items-center gap-4 border-b border-zinc-200 py-4"
                  >
                    <p className="truncate font-mono text-sm font-normal text-zinc-600">
                      {ref.displayName || ref.walletAddress}
                    </p>
                    <div>
                      <span
                        className={cn(
                          "inline-block border px-2 py-0.5 text-xs font-normal",
                          ref.status === "ACTIVE"
                            ? "border-zinc-300 text-zinc-500"
                            : "border-zinc-200 text-zinc-400"
                        )}
                      >
                        {ref.status === "ACTIVE" ? "Active" : "Pending"}
                      </span>
                    </div>
                    <p className="text-sm font-normal text-zinc-500">
                      {formatDate(ref.joinedAt)}
                    </p>
                    <p className="text-right text-sm font-normal tabular-nums text-zinc-500">
                      {contributed > 0 ? formatCurrency(contributed) : "--"}
                    </p>
                    <p className="text-right text-sm font-normal tabular-nums text-zinc-600">
                      {earned > 0 ? formatCurrency(earned) : "--"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Reward Structure */}
        <div>
          <h2 className="mb-6 font-serif text-lg font-normal text-zinc-900">
            Reward Structure
          </h2>
          {rewardStructure && (
            <div className="space-y-0">
              <div className="flex items-center justify-between border-b border-zinc-200 py-4">
                <span className="text-sm font-normal text-zinc-500">
                  Contribution Commission
                </span>
                <span className="text-sm font-normal tabular-nums text-zinc-600">
                  {rewardStructure.contributionPercent}%
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-200 py-4">
                <span className="text-sm font-normal text-zinc-500">
                  Staking Commission
                </span>
                <span className="text-sm font-normal tabular-nums text-zinc-600">
                  {rewardStructure.stakingPercent}%
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-200 py-4">
                <span className="text-sm font-normal text-zinc-500">
                  Max per Referral
                </span>
                <span className="text-sm font-normal tabular-nums text-zinc-600">
                  {formatCurrency(
                    parseFloat(rewardStructure.maxRewardPerReferral)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-200 py-4">
                <span className="text-sm font-normal text-zinc-500">
                  Vesting Period
                </span>
                <span className="text-sm font-normal text-zinc-600">
                  {rewardStructure.vestingPeriod}
                </span>
              </div>
              <div className="flex items-center justify-between py-4">
                <span className="text-sm font-normal text-zinc-500">
                  Lifetime Volume
                </span>
                <span className="text-sm font-normal tabular-nums text-zinc-600">
                  {formatCurrency(
                    parseFloat(stats?.lifetimeVolume ?? "0")
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
