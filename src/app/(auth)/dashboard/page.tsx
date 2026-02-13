"use client";

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
import { cn } from "@/lib/utils/cn";
import {
  formatCurrency,
  formatAddress,
  formatRelativeTime,
  formatToken,
  formatPercent,
} from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Placeholder Data
// ---------------------------------------------------------------------------

const WALLET_ADDRESS = "0x7a3B...9f4E";
const FULL_ADDRESS = "0x7a3B1c2D8e5F6a9B0c1D2e3F4a5B6c7D8e9f4E";

const ACTIVE_DEALS = [
  {
    id: "1",
    name: "Aether Protocol",
    status: "Live" as const,
    contributed: 2500,
    currentValue: 3875,
    pnl: 55,
    vestingProgress: 35,
    tokenSymbol: "AETH",
  },
  {
    id: "2",
    name: "NexusVault",
    status: "Vesting" as const,
    contributed: 5000,
    currentValue: 7200,
    pnl: 44,
    vestingProgress: 62,
    tokenSymbol: "NXV",
  },
  {
    id: "3",
    name: "Photon Chain",
    status: "Live" as const,
    contributed: 1000,
    currentValue: 880,
    pnl: -12,
    vestingProgress: 15,
    tokenSymbol: "PHO",
  },
  {
    id: "4",
    name: "OmniLedger",
    status: "Funded" as const,
    contributed: 3000,
    currentValue: 3450,
    pnl: 15,
    vestingProgress: 85,
    tokenSymbol: "OMNI",
  },
];

const UPCOMING_EVENTS = [
  {
    id: "1",
    icon: Rocket,
    title: "Solaris Network opens for contributions",
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    type: "opening" as const,
  },
  {
    id: "2",
    icon: Lock,
    title: "NexusVault vesting unlock (25%)",
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    type: "unlock" as const,
  },
  {
    id: "3",
    icon: CalendarClock,
    title: "ZKBridge registration deadline",
    date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    type: "deadline" as const,
  },
  {
    id: "4",
    icon: Gift,
    title: "Aether Protocol cliff unlock",
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    type: "unlock" as const,
  },
];

const RECENT_ACTIVITY = [
  {
    id: "1",
    icon: DollarSign,
    description: "Contributed to Aether Protocol",
    amount: "$2,500.00",
    time: new Date(Date.now() - 2 * 60 * 60 * 1000),
    txHash: "0x1a2b3c...4d5e",
    type: "contribution" as const,
  },
  {
    id: "2",
    icon: Gift,
    description: "Claimed 1,250 NXV tokens",
    amount: "1,250 NXV",
    time: new Date(Date.now() - 8 * 60 * 60 * 1000),
    txHash: "0x5f6a7b...8c9d",
    type: "claim" as const,
  },
  {
    id: "3",
    icon: Coins,
    description: "Staked 10,000 EXPO",
    amount: "10,000 EXPO",
    time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    txHash: "0x9e0f1a...2b3c",
    type: "staking" as const,
  },
  {
    id: "4",
    icon: DollarSign,
    description: "Contributed to NexusVault",
    amount: "$5,000.00",
    time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    txHash: "0x4d5e6f...7a8b",
    type: "contribution" as const,
  },
  {
    id: "5",
    icon: Zap,
    description: "Earned staking reward",
    amount: "42.5 EXPO",
    time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    txHash: "0x8c9d0e...1f2a",
    type: "reward" as const,
  },
];

const TIER_DATA = {
  currentTier: "Gold",
  currentStaked: 10000,
  nextTier: "Platinum",
  requiredForNext: 25000,
  benefits: {
    current: [
      "2x allocation multiplier",
      "Priority access to deals",
      "5 lottery tickets per round",
    ],
    next: [
      "4x allocation multiplier",
      "Guaranteed allocation",
      "15 lottery tickets per round",
      "Early access to new deals",
    ],
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const progressToNext =
    (TIER_DATA.currentStaked / TIER_DATA.requiredForNext) * 100;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome */}
      <div>
        <h1 className="font-serif text-2xl font-light text-zinc-100">Welcome back</h1>
        <p className="mt-1 text-sm font-light text-zinc-500">
          {WALLET_ADDRESS}
        </p>
      </div>

      {/* Stats Row — clean typography-driven numbers */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-800/40 bg-zinc-800/40 lg:grid-cols-4">
        <div className="flex flex-col gap-1 bg-zinc-950 p-6">
          <span className="text-xs font-light uppercase tracking-wider text-zinc-600">
            Portfolio Value
          </span>
          <span className="font-serif text-2xl font-light tabular-nums text-zinc-100">
            {formatCurrency(15405)}
          </span>
          <span className="text-xs font-light text-zinc-500">+12.4% all time</span>
        </div>
        <div className="flex flex-col gap-1 bg-zinc-950 p-6">
          <span className="text-xs font-light uppercase tracking-wider text-zinc-600">
            Active Deals
          </span>
          <span className="font-serif text-2xl font-light tabular-nums text-zinc-100">
            4
          </span>
          <span className="text-xs font-light text-zinc-500">2 live, 1 vesting, 1 funded</span>
        </div>
        <div className="flex flex-col gap-1 bg-zinc-950 p-6">
          <span className="text-xs font-light uppercase tracking-wider text-zinc-600">
            Pending Claims
          </span>
          <span className="font-serif text-2xl font-light tabular-nums text-zinc-100">
            3,820
          </span>
          <span className="text-xs font-light text-zinc-500">Across 3 deals</span>
        </div>
        <div className="flex flex-col gap-1 bg-zinc-950 p-6">
          <span className="text-xs font-light uppercase tracking-wider text-zinc-600">
            Tier Status
          </span>
          <span className="font-serif text-2xl font-light tabular-nums text-zinc-100">
            Gold
          </span>
          <span className="text-xs font-light text-zinc-500">2x allocation</span>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left Column -- 3/5 */}
        <div className="space-y-6 lg:col-span-3">
          {/* Active Deals — table-like */}
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
              {/* Table header */}
              <div className="grid grid-cols-5 gap-4 border-b border-zinc-800/40 pb-2 text-[10px] font-light uppercase tracking-wider text-zinc-600">
                <span className="col-span-2">Project</span>
                <span>Contributed</span>
                <span>Value</span>
                <span className="text-right">PnL</span>
              </div>

              {/* Table rows */}
              <div className="divide-y divide-zinc-800/30">
                {ACTIVE_DEALS.map((deal) => (
                  <div
                    key={deal.id}
                    className="grid grid-cols-5 items-center gap-4 py-3.5"
                  >
                    <div className="col-span-2 flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-800/60 text-xs font-medium text-zinc-400">
                        {deal.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{deal.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-light text-zinc-600">{deal.tokenSymbol}</span>
                          <span className="rounded-sm border border-zinc-800 px-1.5 py-px text-[10px] font-light text-zinc-500">
                            {deal.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-light text-zinc-300">
                        {formatCurrency(deal.contributed)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-light text-zinc-300">
                        {formatCurrency(deal.currentValue)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          "text-sm font-light",
                          deal.pnl >= 0 ? "text-emerald-800" : "text-rose-800"
                        )}
                        style={{
                          color: deal.pnl >= 0 ? "#6ee7b7" : "#fda4af",
                          opacity: 0.7,
                        }}
                      >
                        {deal.pnl >= 0 ? "+" : ""}
                        {formatPercent(deal.pnl)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-0">
                {UPCOMING_EVENTS.map((event, idx) => {
                  const IconComponent = event.icon;
                  return (
                    <div key={event.id} className="flex gap-4 pb-6 last:pb-0">
                      {/* Timeline line */}
                      <div className="relative flex flex-col items-center">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-800/60 bg-zinc-900/50 text-zinc-500">
                          <IconComponent className="h-3.5 w-3.5" />
                        </div>
                        {idx < UPCOMING_EVENTS.length - 1 && (
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
            </CardContent>
          </Card>
        </div>

        {/* Right Column -- 2/5 */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recent Activity — clean list */}
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
              <div className="divide-y divide-zinc-800/30">
                {RECENT_ACTIVITY.map((activity) => {
                  const IconComponent = activity.icon;
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
                          {activity.description}
                        </p>
                        <p className="text-xs font-light text-zinc-600">
                          {formatRelativeTime(activity.time)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-light text-zinc-300">
                          {activity.amount}
                        </p>
                        <a
                          href="#"
                          className="inline-flex items-center gap-1 text-xs font-light text-zinc-600 hover:text-zinc-400"
                        >
                          Tx <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tier Progress */}
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
                    {TIER_DATA.currentTier}
                  </span>
                </div>
                <span className="rounded-md border border-zinc-800 px-2 py-0.5 text-[11px] font-light text-zinc-500">
                  Current Tier
                </span>
              </div>

              {/* Progress */}
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-light text-zinc-500">
                    {formatToken(TIER_DATA.currentStaked, 0, "EXPO")} staked
                  </span>
                  <span className="font-light text-zinc-600">
                    {formatToken(TIER_DATA.requiredForNext, 0, "EXPO")} for{" "}
                    {TIER_DATA.nextTier}
                  </span>
                </div>
                <Progress value={progressToNext} color="default" />
                <p className="mt-2 text-center text-xs font-light text-zinc-600">
                  Stake{" "}
                  <span className="text-zinc-400">
                    {formatToken(
                      TIER_DATA.requiredForNext - TIER_DATA.currentStaked,
                      0,
                      "EXPO"
                    )}
                  </span>{" "}
                  more to reach {TIER_DATA.nextTier}
                </p>
              </div>

              {/* Benefits Comparison */}
              <div className="space-y-3 border-t border-zinc-800/40 pt-4">
                <p className="text-xs font-light uppercase tracking-wider text-zinc-600">
                  Current benefits
                </p>
                <ul className="space-y-1.5">
                  {TIER_DATA.benefits.current.map((b) => (
                    <li
                      key={b}
                      className="flex items-center gap-2 text-sm font-light text-zinc-400"
                    >
                      <Star className="h-3 w-3 text-zinc-600" />
                      {b}
                    </li>
                  ))}
                </ul>

                <p className="text-xs font-light uppercase tracking-wider text-zinc-600">
                  {TIER_DATA.nextTier} unlocks
                </p>
                <ul className="space-y-1.5">
                  {TIER_DATA.benefits.next.map((b) => (
                    <li
                      key={b}
                      className="flex items-center gap-2 text-sm font-light text-zinc-600"
                    >
                      <Lock className="h-3 w-3 text-zinc-700" />
                      {b}
                    </li>
                  ))}
                </ul>
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
        </div>
      </div>
    </div>
  );
}
