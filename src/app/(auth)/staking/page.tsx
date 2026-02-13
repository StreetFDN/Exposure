"use client";

import { useState, useEffect } from "react";
import {
  Coins,
  Lock,
  Crown,
  Ticket,
  ExternalLink,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Countdown } from "@/components/ui/countdown";
import { Alert } from "@/components/ui/alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
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

interface TierInfo {
  name: string;
  requiredStake: number;
  lockPeriod: string;
  multiplier: string;
  lotteryTickets: number;
  color: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
}

// ---------------------------------------------------------------------------
// Lock options (static config)
// ---------------------------------------------------------------------------

const LOCK_OPTIONS = [
  { label: "None", value: "NONE", days: 0, multiplier: "1.0x", bonus: "No bonus" },
  { label: "30 days", value: "THIRTY_DAYS", days: 30, multiplier: "1.2x", bonus: "+20% bonus" },
  { label: "90 days", value: "NINETY_DAYS", days: 90, multiplier: "1.5x", bonus: "+50% bonus" },
  { label: "180 days", value: "ONE_EIGHTY_DAYS", days: 180, multiplier: "2.0x", bonus: "+100% bonus" },
  { label: "365 days", value: "THREE_SIXTY_FIVE_DAYS", days: 365, multiplier: "3.0x", bonus: "+200% bonus" },
];

const TIER_DISPLAY: Record<string, { color: string; bgColor: string; borderColor: string; iconColor: string }> = {
  BRONZE: { color: "text-orange-400", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/30", iconColor: "text-orange-400" },
  SILVER: { color: "text-zinc-300", bgColor: "bg-zinc-400/10", borderColor: "border-zinc-400/30", iconColor: "text-zinc-300" },
  GOLD: { color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/30", iconColor: "text-amber-400" },
  PLATINUM: { color: "text-cyan-400", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-500/30", iconColor: "text-cyan-400" },
  DIAMOND: { color: "text-violet-400", bgColor: "bg-violet-500/10", borderColor: "border-violet-500/30", iconColor: "text-violet-400" },
};

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
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <div className="h-7 w-24 animate-pulse rounded bg-zinc-800" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-zinc-800" />
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 animate-pulse rounded bg-zinc-800" />
                <div className="h-8 w-24 animate-pulse rounded bg-zinc-800" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-800" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 animate-pulse rounded bg-zinc-800" />
                      <div className="h-3 w-40 animate-pulse rounded bg-zinc-800" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <div className="h-64 w-full animate-pulse rounded bg-zinc-800" />
            </CardContent>
          </Card>
        </div>
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
  const [selectedLock, setSelectedLock] = useState(2); // 90 days default
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
          throw new Error(stakingJson.error?.message || "Failed to load staking data");
        }

        setStakingData(stakingJson.data.staking);
        setTiers(tiersJson.success ? tiersJson.data.tiers.filter((t: TierData) => t.tierLevel !== "NONE") : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load staking data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <StakingSkeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Alert variant="error" title="Error loading staking">
          {error}
        </Alert>
      </div>
    );
  }

  const totalStaked = parseFloat(stakingData?.totalStaked || "0");
  const currentTier = stakingData?.currentTier || "BRONZE";
  const pendingRewards = parseFloat(stakingData?.pendingRewards || "0");
  const totalRewardsEarned = parseFloat(stakingData?.totalRewardsEarned || "0");
  const positions = stakingData?.positions || [];

  // Find the first position with a lock end that hasn't expired (for lock display)
  const activeLockedPosition = positions.find(
    (p) => p.unlockAt && new Date(p.unlockAt) > new Date()
  );
  const lockExpiry = activeLockedPosition ? new Date(activeLockedPosition.unlockAt!) : null;
  const lockExpired = !lockExpiry || lockExpiry <= new Date();

  // Find current tier index in the tiers array
  const tierOrder = tiers.map((t) => t.tierLevel);
  const currentTierIndex = tierOrder.indexOf(currentTier);

  // Build tier display info
  const displayTiers: TierInfo[] = tiers.map((t) => ({
    name: t.displayName,
    requiredStake: parseFloat(t.stakedAmount),
    lockPeriod: t.lockPeriod || "None",
    multiplier: `${t.allocationMultiplier}x`,
    lotteryTickets: t.lotteryWeight,
    ...(TIER_DISPLAY[t.tierLevel] || TIER_DISPLAY.BRONZE),
  }));

  // Estimated tier after staking
  function getEstimatedTier() {
    const amount = totalStaked + (parseFloat(stakeAmount) || 0);
    for (let i = displayTiers.length - 1; i >= 0; i--) {
      if (amount >= displayTiers[i].requiredStake) return displayTiers[i].name;
    }
    return "None";
  }

  // Handle stake submit
  async function handleStake() {
    const amount = parseFloat(stakeAmount);
    if (!amount || amount <= 0) return;

    setStaking(true);
    setStakeError(null);
    setStakeSuccess(null);

    try {
      // In a real implementation, the txHash would come from a wallet transaction
      // For now, show an informational message
      const res = await fetch("/api/staking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          lockPeriod: LOCK_OPTIONS[selectedLock].value,
          txHash: "0x" + "0".repeat(64), // Placeholder
          chain: "ETHEREUM",
        }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || "Staking failed");
      }
      setStakeSuccess("Staking position created successfully!");
      setStakeAmount("");

      // Refresh staking data
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
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Staking</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Stake EXPO tokens to unlock higher tiers, allocation multipliers, and
          priority access to deals.
        </p>
      </div>

      {/* Current Position */}
      <Card>
        <CardHeader>
          <CardTitle>Your Staking Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {/* Staked Amount */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Staked Amount
              </span>
              <span className="text-3xl font-bold tabular-nums text-zinc-50">
                {totalStaked.toLocaleString()}
              </span>
              <span className="text-sm text-zinc-400">EXPO</span>
            </div>
            {/* Current Tier */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Current Tier
              </span>
              <div className="flex items-center gap-2">
                <Crown className={cn("h-6 w-6", TIER_DISPLAY[currentTier]?.iconColor || "text-zinc-400")} />
                <Badge
                  variant={
                    currentTier === "GOLD" ? "warning" :
                    currentTier === "PLATINUM" ? "info" :
                    currentTier === "DIAMOND" ? "default" :
                    "outline"
                  }
                  size="md"
                >
                  {tierDisplayName(currentTier)}
                </Badge>
              </div>
            </div>
            {/* Lock Period */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Lock Remaining
              </span>
              {lockExpired ? (
                <span className="text-lg font-medium text-emerald-400">
                  Unlocked
                </span>
              ) : (
                <Countdown targetDate={lockExpiry!} />
              )}
            </div>
            {/* Rewards */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Accumulated Rewards
              </span>
              <span className="text-2xl font-bold tabular-nums text-zinc-50">
                {totalRewardsEarned.toLocaleString()}
              </span>
              <span className="text-sm text-zinc-400">EXPO</span>
            </div>
            {/* Unstake */}
            <div className="flex items-end">
              <Button
                variant={lockExpired ? "default" : "secondary"}
                disabled={!lockExpired || totalStaked <= 0}
                className="w-full"
              >
                <Lock className="h-4 w-4" />
                {lockExpired ? "Unstake" : "Locked"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Tier Ladder */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Tier Ladder</CardTitle>
              <CardDescription>
                Stake more to unlock higher tiers and benefits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-0">
                {[...displayTiers].reverse().map((tier, idx) => {
                  const tierIdx = displayTiers.length - 1 - idx;
                  const isCurrent = tierIdx === currentTierIndex;
                  const isBelow = tierIdx < currentTierIndex;
                  const isAbove = tierIdx > currentTierIndex;

                  return (
                    <div key={tier.name} className="flex gap-4 pb-1 last:pb-0">
                      <div className="relative flex flex-col items-center">
                        <div
                          className={cn(
                            "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                            isCurrent
                              ? `${tier.borderColor} ${tier.bgColor} shadow-lg shadow-violet-500/20 ring-2 ring-violet-500/30`
                              : isBelow
                              ? "border-zinc-700 bg-zinc-800"
                              : "border-zinc-800 bg-zinc-900"
                          )}
                        >
                          <Crown
                            className={cn(
                              "h-4 w-4",
                              isCurrent
                                ? tier.iconColor
                                : isBelow
                                ? "text-zinc-500"
                                : "text-zinc-600"
                            )}
                          />
                        </div>
                        {idx < displayTiers.length - 1 && (
                          <div
                            className={cn(
                              "h-full w-0.5",
                              isBelow || isCurrent
                                ? "bg-violet-500/40"
                                : "bg-zinc-800"
                            )}
                            style={{ minHeight: "2rem" }}
                          />
                        )}
                      </div>
                      <div
                        className={cn(
                          "flex flex-1 flex-col gap-1 rounded-lg border p-3 transition-all",
                          isCurrent
                            ? `${tier.borderColor} ${tier.bgColor}`
                            : "border-transparent"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              "font-semibold",
                              isCurrent ? tier.color : isBelow ? "text-zinc-400" : "text-zinc-500"
                            )}
                          >
                            {tier.name}
                          </span>
                          {isCurrent && (
                            <Badge variant="success" size="sm">
                              You are here
                            </Badge>
                          )}
                          {isBelow && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                          <span>
                            {formatToken(tier.requiredStake, 0, "EXPO")}
                          </span>
                          <span>Lock: {tier.lockPeriod}</span>
                          <span>{tier.multiplier} alloc</span>
                          <span>
                            <Ticket className="mr-0.5 inline h-3 w-3" />
                            {tier.lotteryTickets}
                          </span>
                        </div>
                        {isAbove && tierIdx === currentTierIndex + 1 && (
                          <p className="mt-1 text-xs text-violet-400">
                            Stake{" "}
                            {formatToken(
                              Math.max(0, tier.requiredStake - totalStaked),
                              0,
                              "EXPO"
                            )}{" "}
                            more to reach this tier
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stake Form */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Stake EXPO</CardTitle>
              <CardDescription>
                Choose an amount and lock period to stake your tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {stakeError && (
                <Alert variant="error">{stakeError}</Alert>
              )}
              {stakeSuccess && (
                <Alert variant="success">{stakeSuccess}</Alert>
              )}

              {/* Amount Input */}
              <div>
                <Input
                  label="Amount"
                  type="number"
                  placeholder="0.00"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  rightAddon={
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-300">EXPO</span>
                    </div>
                  }
                />
              </div>

              {/* Lock Period */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300">
                  Lock Period
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                  {LOCK_OPTIONS.map((opt, idx) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setSelectedLock(idx)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border p-3 transition-all",
                        selectedLock === idx
                          ? "border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/30"
                          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                      )}
                    >
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          selectedLock === idx
                            ? "text-violet-400"
                            : "text-zinc-200"
                        )}
                      >
                        {opt.label}
                      </span>
                      <span className="text-xs font-medium text-zinc-400">
                        {opt.multiplier}
                      </span>
                      <span
                        className={cn(
                          "text-[10px]",
                          selectedLock === idx
                            ? "text-violet-300"
                            : "text-zinc-500"
                        )}
                      >
                        {opt.bonus}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {stakeAmount && parseFloat(stakeAmount) > 0 && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                  <p className="text-sm text-zinc-400">
                    After staking, your tier will be:
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Crown className="h-5 w-5 text-violet-400" />
                    <span className="text-lg font-bold text-zinc-50">
                      {getEstimatedTier()}
                    </span>
                    <Badge variant="default" size="sm">
                      {formatToken(
                        totalStaked + parseFloat(stakeAmount),
                        0,
                        "EXPO"
                      )}{" "}
                      total
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                disabled={!stakeAmount || parseFloat(stakeAmount) <= 0 || staking}
                onClick={handleStake}
              >
                {staking ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Staking...
                  </>
                ) : (
                  <>
                    <Coins className="h-5 w-5" />
                    Stake EXPO
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Staking History */}
      <Card>
        <CardHeader>
          <CardTitle>Staking History</CardTitle>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              No staking positions yet. Stake EXPO to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Lock Period</TableHead>
                  <TableHead>Tx Hash</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((pos) => (
                  <TableRow key={pos.id}>
                    <TableCell>{formatDate(pos.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant="success" size="sm">
                        Stake
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      +{formatToken(parseFloat(pos.amount), 0, "EXPO")}
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {LOCK_PERIOD_LABELS[pos.lockPeriod] || pos.lockPeriod}
                    </TableCell>
                    <TableCell>
                      {pos.txHash ? (
                        <a
                          href="#"
                          className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-violet-400"
                        >
                          {formatAddress(pos.txHash, 8, 6)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-zinc-600">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={pos.isActive ? "success" : "outline"} size="sm">
                        {pos.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
