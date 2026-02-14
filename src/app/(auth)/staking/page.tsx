"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatToken, formatDate, formatAddress } from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StakingPosition {
  id: string;
  amount: string;
  lockPeriod: string;
  apy: string;
  stakedAt: string;
  unlockAt: string | null;
  isActive: boolean;
  txHash: string | null;
  chain: string;
  rewards: {
    id: string;
    amount: string;
    claimedAt: string | null;
    txHash: string | null;
  }[];
  createdAt: string;
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
  positions: StakingPosition[];
}

interface TierData {
  tierLevel: string;
  displayName: string;
  stakedAmount: string;
  lockPeriod: string | null;
  allocationMultiplier: number;
  lotteryWeight: number;
  color: string;
  benefits: string[];
  memberCount: number;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const LOCK_OPTIONS = [
  { label: "None", value: "NONE", days: 0, multiplier: "1.0x", bonus: "No bonus" },
  { label: "30d", value: "THIRTY_DAYS", days: 30, multiplier: "1.2x", bonus: "+20%" },
  { label: "90d", value: "NINETY_DAYS", days: 90, multiplier: "1.5x", bonus: "+50%" },
  { label: "180d", value: "ONE_EIGHTY_DAYS", days: 180, multiplier: "2.0x", bonus: "+100%" },
  { label: "365d", value: "THREE_SIXTY_FIVE_DAYS", days: 365, multiplier: "3.0x", bonus: "+200%" },
];

const LOCK_PERIOD_LABELS: Record<string, string> = {
  NONE: "None",
  THIRTY_DAYS: "30 days",
  NINETY_DAYS: "90 days",
  ONE_EIGHTY_DAYS: "180 days",
  THREE_SIXTY_FIVE_DAYS: "365 days",
};

function tierDisplayName(tier: string): string {
  return tier.charAt(0) + tier.slice(1).toLowerCase();
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function StakingSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
      <div className="mb-16">
        <div className="h-8 w-24 animate-pulse rounded bg-zinc-200" />
        <div className="mt-3 h-4 w-80 animate-pulse rounded bg-zinc-200" />
      </div>
      <div className="mb-16 grid grid-cols-4 gap-px border border-zinc-200">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-8">
            <div className="h-3 w-20 animate-pulse rounded bg-zinc-200" />
            <div className="mt-4 h-9 w-28 animate-pulse rounded bg-zinc-200" />
          </div>
        ))}
      </div>
      <div className="mb-12 h-1 w-full animate-pulse rounded-full bg-zinc-200" />
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-zinc-200" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded bg-zinc-200" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StakingPage() {
  const [stakingData, setStakingData] = useState<StakingData | null>(null);
  const [tiers, setTiers] = useState<TierData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stakeAmount, setStakeAmount] = useState("");
  const [selectedLock, setSelectedLock] = useState(2);
  const [staking, setStaking] = useState(false);
  const [stakeError, setStakeError] = useState<string | null>(null);
  const [stakeSuccess, setStakeSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const [stakingRes, tiersRes] = await Promise.all([
          fetch("/api/staking"),
          fetch("/api/staking/tiers"),
        ]);
        const [stakingJson, tiersJson] = await Promise.all([
          stakingRes.json(),
          tiersRes.json(),
        ]);

        if (!stakingJson.success) {
          throw new Error(
            stakingJson.error?.message || "Failed to load staking data"
          );
        }

        setStakingData(stakingJson.data.staking);
        setTiers(
          tiersJson.success
            ? tiersJson.data.tiers.filter(
                (t: TierData) => t.tierLevel !== "NONE"
              )
            : []
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load staking data"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <StakingSkeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="flex flex-col items-center justify-center py-24">
          <p className="font-serif text-xl font-normal text-zinc-500">
            Unable to load staking
          </p>
          <p className="mt-2 text-sm font-normal text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  const totalStaked = parseFloat(stakingData?.totalStaked || "0");
  const currentTier = stakingData?.currentTier || "BRONZE";
  const pendingRewards = parseFloat(stakingData?.pendingRewards || "0");
  const totalRewardsEarned = parseFloat(
    stakingData?.totalRewardsEarned || "0"
  );
  const positions = stakingData?.positions || [];

  // Tier progress
  const tierOrder = tiers.map((t) => t.tierLevel);
  const currentTierIndex = tierOrder.indexOf(currentTier);
  const nextTier =
    currentTierIndex >= 0 && currentTierIndex < tiers.length - 1
      ? tiers[currentTierIndex + 1]
      : null;
  const nextTierThreshold = nextTier
    ? parseFloat(nextTier.stakedAmount)
    : totalStaked;
  const currentTierThreshold =
    currentTierIndex >= 0 ? parseFloat(tiers[currentTierIndex].stakedAmount) : 0;
  const progressRange = nextTierThreshold - currentTierThreshold;
  const progressValue = progressRange > 0
    ? Math.min(100, ((totalStaked - currentTierThreshold) / progressRange) * 100)
    : 100;

  // Estimated tier after staking
  function getEstimatedTier(): string {
    const amount = totalStaked + (parseFloat(stakeAmount) || 0);
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (amount >= parseFloat(tiers[i].stakedAmount))
        return tiers[i].displayName;
    }
    return "None";
  }

  async function handleStake() {
    const amount = parseFloat(stakeAmount);
    if (!amount || amount <= 0) return;

    setStaking(true);
    setStakeError(null);
    setStakeSuccess(null);

    try {
      const res = await fetch("/api/staking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          lockPeriod: LOCK_OPTIONS[selectedLock].value,
          txHash: "0x" + "0".repeat(64),
          chain: "ETHEREUM",
        }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || "Staking failed");
      }
      setStakeSuccess("Position created successfully.");
      setStakeAmount("");

      const refreshRes = await fetch("/api/staking");
      const refreshJson = await refreshRes.json();
      if (refreshJson.success) {
        setStakingData(refreshJson.data.staking);
      }
    } catch (err) {
      setStakeError(err instanceof Error ? err.message : "Staking failed");
    } finally {
      setStaking(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
      {/* Header */}
      <div className="mb-16">
        <h1 className="font-serif text-3xl font-light text-zinc-900">
          Staking
        </h1>
        <p className="mt-2 text-sm font-normal text-zinc-500">
          Stake EXPO tokens to unlock higher tiers, allocation multipliers, and
          priority access.
        </p>
      </div>

      {/* Current Position Stats */}
      <div className="mb-12 grid grid-cols-2 gap-px border border-zinc-200 lg:grid-cols-4">
        <div className="p-8">
          <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
            Total Staked
          </span>
          <p className="mt-3 font-serif text-3xl font-light tabular-nums text-zinc-900">
            {totalStaked.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-normal text-zinc-400">EXPO</p>
        </div>
        <div className="p-8">
          <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
            Current Tier
          </span>
          <p className="mt-3 font-serif text-3xl font-light text-zinc-900">
            {tierDisplayName(currentTier)}
          </p>
        </div>
        <div className="p-8">
          <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
            Pending Rewards
          </span>
          <p className="mt-3 font-serif text-3xl font-light tabular-nums text-zinc-900">
            {pendingRewards.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-normal text-zinc-400">EXPO</p>
        </div>
        <div className="p-8">
          <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
            Total Earned
          </span>
          <p className="mt-3 font-serif text-3xl font-light tabular-nums text-zinc-900">
            {totalRewardsEarned.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-normal text-zinc-400">EXPO</p>
        </div>
      </div>

      {/* Tier Progress Bar */}
      {nextTier && (
        <div className="mb-16">
          <div className="mb-2 flex items-center justify-between text-xs font-normal text-zinc-500">
            <span>{tierDisplayName(currentTier)}</span>
            <span>{nextTier.displayName}</span>
          </div>
          <div className="h-px w-full bg-zinc-200">
            <div
              className="h-px bg-zinc-500 transition-all"
              style={{ width: `${progressValue}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-normal text-zinc-400">
            Stake{" "}
            {formatToken(
              Math.max(0, nextTierThreshold - totalStaked),
              0,
              "EXPO"
            )}{" "}
            more to reach {nextTier.displayName}
          </p>
        </div>
      )}

      {/* Two-column: Tiers + Stake Form */}
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
        {/* Tier Table */}
        <div>
          <h2 className="mb-6 font-serif text-lg font-normal text-zinc-900">
            Tier Requirements
          </h2>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-4 gap-4 border-b border-zinc-200 pb-3">
              <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
                Tier
              </span>
              <span className="text-right text-xs font-normal uppercase tracking-widest text-zinc-500">
                Required
              </span>
              <span className="text-right text-xs font-normal uppercase tracking-widest text-zinc-500">
                Multiplier
              </span>
              <span className="text-right text-xs font-normal uppercase tracking-widest text-zinc-500">
                Tickets
              </span>
            </div>
            {tiers.map((tier) => {
              const isCurrent = tier.tierLevel === currentTier;
              return (
                <div
                  key={tier.tierLevel}
                  className={cn(
                    "grid grid-cols-4 items-center gap-4 border-b border-zinc-200 py-4 transition-colors",
                    isCurrent && "border-zinc-300"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-normal",
                        isCurrent ? "text-zinc-800" : "text-zinc-500"
                      )}
                    >
                      {tier.displayName}
                    </span>
                    {isCurrent && (
                      <span className="border border-zinc-300 px-1.5 py-px text-[10px] font-normal text-zinc-500">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-right text-sm font-normal tabular-nums text-zinc-500">
                    {formatToken(parseFloat(tier.stakedAmount), 0, "EXPO")}
                  </p>
                  <p className="text-right text-sm font-normal tabular-nums text-zinc-500">
                    {tier.allocationMultiplier}x
                  </p>
                  <p className="text-right text-sm font-normal tabular-nums text-zinc-500">
                    {tier.lotteryWeight}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stake Form */}
        <div>
          <h2 className="mb-6 font-serif text-lg font-normal text-zinc-900">
            Stake EXPO
          </h2>

          {stakeError && (
            <p className="mb-4 text-sm font-normal text-zinc-500">
              {stakeError}
            </p>
          )}
          {stakeSuccess && (
            <p className="mb-4 text-sm font-normal text-zinc-500">
              {stakeSuccess}
            </p>
          )}

          {/* Amount Input */}
          <div className="mb-6">
            <label className="mb-2 block text-xs font-normal uppercase tracking-widest text-zinc-500">
              Amount
            </label>
            <div className="flex items-center border border-zinc-200 transition-colors focus-within:border-zinc-400">
              <input
                type="number"
                placeholder="0.00"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="flex-1 bg-transparent px-4 py-3 text-sm font-normal text-zinc-700 outline-none placeholder:text-zinc-400"
              />
              <span className="pr-4 text-sm font-normal text-zinc-500">
                EXPO
              </span>
            </div>
          </div>

          {/* Lock Period */}
          <div className="mb-8">
            <label className="mb-3 block text-xs font-normal uppercase tracking-widest text-zinc-500">
              Lock Period
            </label>
            <div className="grid grid-cols-5 gap-px border border-zinc-200">
              {LOCK_OPTIONS.map((opt, idx) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedLock(idx)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-3 text-center transition-colors",
                    selectedLock === idx
                      ? "bg-zinc-100 text-zinc-800"
                      : "text-zinc-500 hover:text-zinc-600"
                  )}
                >
                  <span className="text-sm font-normal">{opt.label}</span>
                  <span className="text-[10px] font-normal">{opt.multiplier}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {stakeAmount && parseFloat(stakeAmount) > 0 && (
            <div className="mb-8 border border-zinc-200 p-6">
              <p className="text-xs font-normal text-zinc-500">
                Estimated tier after staking
              </p>
              <p className="mt-2 font-serif text-xl font-normal text-zinc-800">
                {getEstimatedTier()}
              </p>
              <p className="mt-1 text-xs font-normal text-zinc-400">
                {formatToken(
                  totalStaked + parseFloat(stakeAmount),
                  0,
                  "EXPO"
                )}{" "}
                total staked
              </p>
            </div>
          )}

          {/* Stake Button */}
          <button
            onClick={handleStake}
            disabled={
              !stakeAmount || parseFloat(stakeAmount) <= 0 || staking
            }
            className="w-full border border-violet-500 bg-violet-500 py-3 text-sm font-normal text-white transition-colors hover:bg-violet-600 disabled:opacity-40 disabled:hover:bg-violet-500"
          >
            {staking ? "Staking..." : "Stake EXPO"}
          </button>
        </div>
      </div>

      {/* Staking History */}
      <div className="mt-16">
        <h2 className="mb-6 font-serif text-lg font-normal text-zinc-900">
          History
        </h2>
        {positions.length === 0 ? (
          <p className="py-12 text-center font-serif text-sm font-normal text-zinc-400">
            No staking positions yet
          </p>
        ) : (
          <div>
            <div className="grid grid-cols-5 gap-4 border-b border-zinc-200 pb-3">
              <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
                Date
              </span>
              <span className="text-right text-xs font-normal uppercase tracking-widest text-zinc-500">
                Amount
              </span>
              <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
                Lock Period
              </span>
              <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
                Tx Hash
              </span>
              <span className="text-right text-xs font-normal uppercase tracking-widest text-zinc-500">
                Status
              </span>
            </div>
            {positions.map((pos) => (
              <div
                key={pos.id}
                className="grid grid-cols-5 items-center gap-4 border-b border-zinc-200 py-4"
              >
                <p className="text-sm font-normal text-zinc-500">
                  {formatDate(pos.createdAt)}
                </p>
                <p className="text-right text-sm font-normal tabular-nums text-zinc-600">
                  +{formatToken(parseFloat(pos.amount), 0, "EXPO")}
                </p>
                <p className="text-sm font-normal text-zinc-500">
                  {LOCK_PERIOD_LABELS[pos.lockPeriod] || pos.lockPeriod}
                </p>
                <p className="text-sm font-normal text-zinc-400">
                  {pos.txHash ? formatAddress(pos.txHash, 8, 6) : "--"}
                </p>
                <div className="text-right">
                  <span
                    className={cn(
                      "inline-block border px-2 py-0.5 text-xs font-normal",
                      pos.isActive
                        ? "border-zinc-300 text-zinc-500"
                        : "border-zinc-200 text-zinc-400"
                    )}
                  >
                    {pos.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
