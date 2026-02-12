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
import { StatCard } from "@/components/ui/stat-card";
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
// Status helpers
// ---------------------------------------------------------------------------

function dealStatusVariant(status: string) {
  switch (status) {
    case "Live":
      return "success";
    case "Vesting":
      return "default";
    case "Funded":
      return "info";
    default:
      return "outline";
  }
}

function eventTypeColor(type: string) {
  switch (type) {
    case "opening":
      return "text-emerald-400";
    case "unlock":
      return "text-violet-400";
    case "deadline":
      return "text-amber-400";
    default:
      return "text-zinc-400";
  }
}

function activityIconBg(type: string) {
  switch (type) {
    case "contribution":
      return "bg-violet-500/15 text-violet-400";
    case "claim":
      return "bg-emerald-500/15 text-emerald-400";
    case "staking":
      return "bg-sky-500/15 text-sky-400";
    case "reward":
      return "bg-amber-500/15 text-amber-400";
    default:
      return "bg-zinc-800 text-zinc-400";
  }
}

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
        <h1 className="text-2xl font-bold text-zinc-50">Welcome back</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {WALLET_ADDRESS}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Portfolio Value"
          value={formatCurrency(15405)}
          icon={<Wallet className="h-5 w-5" />}
          description="+12.4% all time"
        />
        <StatCard
          label="Active Deals"
          value="4"
          icon={<TrendingUp className="h-5 w-5" />}
          description="2 live, 1 vesting, 1 funded"
        />
        <StatCard
          label="Pending Claims"
          value="3,820 tokens"
          icon={<Clock className="h-5 w-5" />}
          description="Across 3 deals"
        />
        <StatCard
          label="Tier Status"
          value={
            <span className="flex items-center gap-2">
              Gold
              <Badge variant="warning" size="sm">
                <Crown className="mr-1 h-3 w-3" />
                Gold
              </Badge>
            </span>
          }
          icon={<Shield className="h-5 w-5" />}
        />
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left Column — 3/5 */}
        <div className="space-y-6 lg:col-span-3">
          {/* Active Deals */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Active Deals</CardTitle>
              <Link href="/portfolio">
                <Button variant="ghost" size="sm">
                  View All <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {ACTIVE_DEALS.map((deal) => (
                <div
                  key={deal.id}
                  className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold text-zinc-300">
                        {deal.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-50">{deal.name}</p>
                        <p className="text-xs text-zinc-500">{deal.tokenSymbol}</p>
                      </div>
                    </div>
                    <Badge variant={dealStatusVariant(deal.status) as any} size="sm">
                      {deal.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-zinc-500">Contributed</p>
                      <p className="font-medium text-zinc-200">
                        {formatCurrency(deal.contributed)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Current Value</p>
                      <p className="font-medium text-zinc-200">
                        {formatCurrency(deal.currentValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">PnL</p>
                      <p
                        className={cn(
                          "font-medium",
                          deal.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                        )}
                      >
                        {deal.pnl >= 0 ? "+" : ""}
                        {formatPercent(deal.pnl)}
                      </p>
                    </div>
                  </div>
                  <Progress
                    value={deal.vestingProgress}
                    label="Vesting"
                    showPercentage
                    color={deal.vestingProgress > 50 ? "success" : "default"}
                  />
                </div>
              ))}
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
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900",
                            eventTypeColor(event.type)
                          )}
                        >
                          <IconComponent className="h-4 w-4" />
                        </div>
                        {idx < UPCOMING_EVENTS.length - 1 && (
                          <div className="mt-1 h-full w-px bg-zinc-800" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex flex-1 items-start justify-between gap-3 pt-1">
                        <div>
                          <p className="text-sm font-medium text-zinc-200">
                            {event.title}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500">
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

        {/* Right Column — 2/5 */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Link href="/portfolio">
                <Button variant="ghost" size="sm">
                  All Activity <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-1">
              {RECENT_ACTIVITY.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-zinc-800/40"
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        activityIconBg(activity.type)
                      )}
                    >
                      <IconComponent className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-zinc-200">
                        {activity.description}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatRelativeTime(activity.time)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium text-zinc-300">
                        {activity.amount}
                      </p>
                      <a
                        href="#"
                        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-violet-400"
                      >
                        Tx <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
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
                  <Crown className="h-5 w-5 text-amber-400" />
                  <span className="text-lg font-bold text-zinc-50">
                    {TIER_DATA.currentTier}
                  </span>
                </div>
                <Badge variant="warning">Current Tier</Badge>
              </div>

              {/* Progress */}
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-zinc-400">
                    {formatToken(TIER_DATA.currentStaked, 0, "EXPO")} staked
                  </span>
                  <span className="text-zinc-500">
                    {formatToken(TIER_DATA.requiredForNext, 0, "EXPO")} for{" "}
                    {TIER_DATA.nextTier}
                  </span>
                </div>
                <Progress value={progressToNext} color="default" />
                <p className="mt-2 text-center text-xs text-zinc-500">
                  Stake{" "}
                  <span className="font-medium text-violet-400">
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
              <div className="space-y-3 border-t border-zinc-800 pt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Current benefits
                </p>
                <ul className="space-y-1.5">
                  {TIER_DATA.benefits.current.map((b) => (
                    <li
                      key={b}
                      className="flex items-center gap-2 text-sm text-zinc-300"
                    >
                      <Star className="h-3.5 w-3.5 text-amber-400" />
                      {b}
                    </li>
                  ))}
                </ul>

                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  {TIER_DATA.nextTier} unlocks
                </p>
                <ul className="space-y-1.5">
                  {TIER_DATA.benefits.next.map((b) => (
                    <li
                      key={b}
                      className="flex items-center gap-2 text-sm text-zinc-500"
                    >
                      <Lock className="h-3.5 w-3.5 text-zinc-600" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              <Link href="/staking" className="block">
                <Button className="w-full" variant="default">
                  <Coins className="h-4 w-4" />
                  Stake More EXPO
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
