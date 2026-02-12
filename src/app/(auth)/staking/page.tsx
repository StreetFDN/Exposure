"use client";

import { useState } from "react";
import {
  Coins,
  Lock,
  Crown,
  Ticket,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Countdown } from "@/components/ui/countdown";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";
import { formatToken, formatDate } from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Placeholder Data
// ---------------------------------------------------------------------------

const CURRENT_POSITION = {
  stakedAmount: 10000,
  currentTier: "Gold" as const,
  lockExpiry: new Date(Date.now() + 47 * 24 * 60 * 60 * 1000), // 47 days from now
  accumulatedRewards: 342.5,
  walletBalance: 5420,
};

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

const TIERS: TierInfo[] = [
  {
    name: "Bronze",
    requiredStake: 1000,
    lockPeriod: "None",
    multiplier: "1x",
    lotteryTickets: 1,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    iconColor: "text-orange-400",
  },
  {
    name: "Silver",
    requiredStake: 5000,
    lockPeriod: "30 days",
    multiplier: "1.5x",
    lotteryTickets: 3,
    color: "text-zinc-300",
    bgColor: "bg-zinc-400/10",
    borderColor: "border-zinc-400/30",
    iconColor: "text-zinc-300",
  },
  {
    name: "Gold",
    requiredStake: 10000,
    lockPeriod: "90 days",
    multiplier: "2x",
    lotteryTickets: 5,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    iconColor: "text-amber-400",
  },
  {
    name: "Platinum",
    requiredStake: 25000,
    lockPeriod: "180 days",
    multiplier: "4x",
    lotteryTickets: 15,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    iconColor: "text-cyan-400",
  },
  {
    name: "Diamond",
    requiredStake: 50000,
    lockPeriod: "365 days",
    multiplier: "8x",
    lotteryTickets: 50,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/30",
    iconColor: "text-violet-400",
  },
];

const LOCK_OPTIONS = [
  { label: "None", days: 0, multiplier: "1.0x", bonus: "No bonus" },
  { label: "30 days", days: 30, multiplier: "1.2x", bonus: "+20% bonus" },
  { label: "90 days", days: 90, multiplier: "1.5x", bonus: "+50% bonus" },
  { label: "180 days", days: 180, multiplier: "2.0x", bonus: "+100% bonus" },
  { label: "365 days", days: 365, multiplier: "3.0x", bonus: "+200% bonus" },
];

const STAKING_HISTORY = [
  {
    id: "1",
    date: "2025-12-15",
    action: "Stake",
    amount: 10000,
    lockPeriod: "90 days",
    txHash: "0xa1b2c3d4e5f6...7890",
    status: "Confirmed",
  },
  {
    id: "2",
    date: "2025-11-01",
    action: "Unstake",
    amount: 5000,
    lockPeriod: "30 days",
    txHash: "0xb2c3d4e5f6a1...8901",
    status: "Confirmed",
  },
  {
    id: "3",
    date: "2025-10-10",
    action: "Stake",
    amount: 5000,
    lockPeriod: "30 days",
    txHash: "0xc3d4e5f6a1b2...9012",
    status: "Confirmed",
  },
  {
    id: "4",
    date: "2025-09-05",
    action: "Stake",
    amount: 8000,
    lockPeriod: "90 days",
    txHash: "0xd4e5f6a1b2c3...0123",
    status: "Confirmed",
  },
  {
    id: "5",
    date: "2025-08-20",
    action: "Unstake",
    amount: 8000,
    lockPeriod: "None",
    txHash: "0xe5f6a1b2c3d4...1234",
    status: "Confirmed",
  },
];

const CURRENT_TIER_INDEX = 2; // Gold

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StakingPage() {
  const [stakeAmount, setStakeAmount] = useState("");
  const [selectedLock, setSelectedLock] = useState(2); // 90 days default

  const lockExpired = CURRENT_POSITION.lockExpiry <= new Date();

  // Calculate estimated tier after staking
  function getEstimatedTier() {
    const amount =
      CURRENT_POSITION.stakedAmount + (parseFloat(stakeAmount) || 0);
    for (let i = TIERS.length - 1; i >= 0; i--) {
      if (amount >= TIERS[i].requiredStake) return TIERS[i].name;
    }
    return "None";
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
                {CURRENT_POSITION.stakedAmount.toLocaleString()}
              </span>
              <span className="text-sm text-zinc-400">EXPO</span>
            </div>
            {/* Current Tier */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Current Tier
              </span>
              <div className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-amber-400" />
                <Badge variant="warning" size="md">
                  Gold
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
                <Countdown targetDate={CURRENT_POSITION.lockExpiry} />
              )}
            </div>
            {/* Rewards */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Accumulated Rewards
              </span>
              <span className="text-2xl font-bold tabular-nums text-zinc-50">
                {CURRENT_POSITION.accumulatedRewards.toLocaleString()}
              </span>
              <span className="text-sm text-zinc-400">EXPO</span>
            </div>
            {/* Unstake */}
            <div className="flex items-end">
              <Button
                variant={lockExpired ? "default" : "secondary"}
                disabled={!lockExpired}
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
        {/* Tier Ladder — 2/5 */}
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
                {[...TIERS].reverse().map((tier, idx) => {
                  const tierIdx = TIERS.length - 1 - idx;
                  const isCurrent = tierIdx === CURRENT_TIER_INDEX;
                  const isBelow = tierIdx < CURRENT_TIER_INDEX;
                  const isAbove = tierIdx > CURRENT_TIER_INDEX;

                  return (
                    <div key={tier.name} className="flex gap-4 pb-1 last:pb-0">
                      {/* Vertical line + node */}
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
                        {idx < TIERS.length - 1 && (
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
                      {/* Content */}
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
                        {isAbove && tierIdx === CURRENT_TIER_INDEX + 1 && (
                          <p className="mt-1 text-xs text-violet-400">
                            Stake{" "}
                            {formatToken(
                              tier.requiredStake - CURRENT_POSITION.stakedAmount,
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

        {/* Stake Form — 3/5 */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Stake EXPO</CardTitle>
              <CardDescription>
                Choose an amount and lock period to stake your tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-violet-400"
                        onClick={() =>
                          setStakeAmount(
                            String(CURRENT_POSITION.walletBalance)
                          )
                        }
                      >
                        Max
                      </Button>
                    </div>
                  }
                  helperText={`Wallet balance: ${formatToken(CURRENT_POSITION.walletBalance, 0, "EXPO")}`}
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
                        CURRENT_POSITION.stakedAmount +
                          parseFloat(stakeAmount),
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
                disabled={!stakeAmount || parseFloat(stakeAmount) <= 0}
              >
                <Coins className="h-5 w-5" />
                Stake EXPO
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
              {STAKING_HISTORY.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.action === "Stake" ? "success" : "warning"
                      }
                      size="sm"
                    >
                      {row.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {row.action === "Unstake" ? "-" : "+"}
                    {formatToken(row.amount, 0, "EXPO")}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {row.lockPeriod}
                  </TableCell>
                  <TableCell>
                    <a
                      href="#"
                      className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-violet-400"
                    >
                      {row.txHash}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant="success" size="sm">
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
