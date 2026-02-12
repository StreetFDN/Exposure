"use client";

import { useState } from "react";
import {
  Gift,
  Clock,
  CheckCircle2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Countdown } from "@/components/ui/countdown";
import { cn } from "@/lib/utils/cn";
import {
  formatCurrency,
  formatToken,
  formatDate,
} from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Placeholder Data
// ---------------------------------------------------------------------------

interface ClaimDeal {
  id: string;
  name: string;
  icon: string;
  tokenSymbol: string;
  totalAllocation: number;
  claimed: number;
  claimable: number;
  locked: number;
  nextUnlockDate: Date;
  nextUnlockAmount: number;
  vestingType: string;
  tokenPrice: number;
}

const CLAIM_DEALS: ClaimDeal[] = [
  {
    id: "1",
    name: "Aether Protocol",
    icon: "AE",
    tokenSymbol: "AETH",
    totalAllocation: 100000,
    claimed: 35000,
    claimable: 12500,
    locked: 52500,
    nextUnlockDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
    nextUnlockAmount: 25000,
    vestingType: "Linear with Cliff",
    tokenPrice: 0.031,
  },
  {
    id: "2",
    name: "NexusVault",
    icon: "NX",
    tokenSymbol: "NXV",
    totalAllocation: 50000,
    claimed: 29750,
    claimable: 5000,
    locked: 15250,
    nextUnlockDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    nextUnlockAmount: 4250,
    vestingType: "Monthly Cliff",
    tokenPrice: 0.144,
  },
  {
    id: "3",
    name: "ZKBridge",
    icon: "ZK",
    tokenSymbol: "ZKB",
    totalAllocation: 50000,
    claimed: 12500,
    claimable: 7500,
    locked: 30000,
    nextUnlockDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    nextUnlockAmount: 12500,
    vestingType: "Linear with Cliff",
    tokenPrice: 0.042,
  },
  {
    id: "4",
    name: "OmniLedger",
    icon: "OL",
    tokenSymbol: "OMNI",
    totalAllocation: 20000,
    claimed: 16800,
    claimable: 2000,
    locked: 1200,
    nextUnlockDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    nextUnlockAmount: 1200,
    vestingType: "Monthly Cliff",
    tokenPrice: 0.1725,
  },
  {
    id: "5",
    name: "Quantum Swap",
    icon: "QS",
    tokenSymbol: "QSWP",
    totalAllocation: 16666,
    claimed: 6664,
    claimable: 1666,
    locked: 8336,
    nextUnlockDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    nextUnlockAmount: 1666,
    vestingType: "Monthly Cliff",
    tokenPrice: 0.14,
  },
];

// Calendar events — dates that have unlocks
interface CalendarEvent {
  date: Date;
  amount: number;
  symbol: string;
  deal: string;
}

const CALENDAR_EVENTS: CalendarEvent[] = [
  {
    date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    amount: 4250,
    symbol: "NXV",
    deal: "NexusVault",
  },
  {
    date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    amount: 1666,
    symbol: "QSWP",
    deal: "Quantum Swap",
  },
  {
    date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
    amount: 25000,
    symbol: "AETH",
    deal: "Aether Protocol",
  },
  {
    date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    amount: 1200,
    symbol: "OMNI",
    deal: "OmniLedger",
  },
  {
    date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    amount: 12500,
    symbol: "ZKB",
    deal: "ZKBridge",
  },
];

// Summary calculations
const totalClaimableValue = CLAIM_DEALS.reduce(
  (s, d) => s + d.claimable * d.tokenPrice,
  0
);
const totalClaimedAllTime = 98432;
const nextUnlock = CLAIM_DEALS.reduce(
  (earliest, d) =>
    d.nextUnlockDate < earliest ? d.nextUnlockDate : earliest,
  CLAIM_DEALS[0].nextUnlockDate
);

// ---------------------------------------------------------------------------
// Calendar Helpers
// ---------------------------------------------------------------------------

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ClaimsPage() {
  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  function prevMonth() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  }

  function nextMonth() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  }

  // Build calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  // Map events to day numbers for current month view
  function getEventsForDay(day: number): CalendarEvent[] {
    return CALENDAR_EVENTS.filter((e) => {
      const d = e.date;
      return (
        d.getFullYear() === calYear &&
        d.getMonth() === calMonth &&
        d.getDate() === day
      );
    });
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Claims</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage and claim your vested token allocations.
          </p>
        </div>
        <Button size="lg" leftIcon={<Zap className="h-5 w-5" />}>
          Claim All ({formatCurrency(totalClaimableValue)})
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Claimable Value"
          value={formatCurrency(totalClaimableValue)}
          icon={<Gift className="h-5 w-5" />}
          description={`${CLAIM_DEALS.reduce((s, d) => s + d.claimable, 0).toLocaleString()} tokens across ${CLAIM_DEALS.filter((d) => d.claimable > 0).length} deals`}
        />
        <StatCard
          label="Total Claimed All Time"
          value={formatToken(totalClaimedAllTime, 0, "tokens")}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          label="Next Unlock"
          value={formatDate(nextUnlock)}
          icon={<Clock className="h-5 w-5" />}
          description={`${CALENDAR_EVENTS.find((e) => e.date.getTime() === nextUnlock.getTime())?.amount.toLocaleString()} ${CALENDAR_EVENTS.find((e) => e.date.getTime() === nextUnlock.getTime())?.symbol}`}
        />
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-50">Your Allocations</h2>

        {CLAIM_DEALS.map((deal) => {
          const claimedPct = (deal.claimed / deal.totalAllocation) * 100;
          const claimablePct = (deal.claimable / deal.totalAllocation) * 100;
          const lockedPct = (deal.locked / deal.totalAllocation) * 100;

          return (
            <Card key={deal.id}>
              <CardContent className="p-6">
                <div className="flex flex-col gap-5">
                  {/* Header Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold text-zinc-300">
                        {deal.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-50">
                          {deal.name}
                        </h3>
                        <p className="text-xs text-zinc-500">
                          {deal.tokenSymbol} -- {deal.vestingType}
                        </p>
                      </div>
                    </div>
                    {deal.claimable > 0 && (
                      <Button size="sm">
                        Claim {deal.claimable.toLocaleString()} {deal.tokenSymbol}
                      </Button>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-zinc-500">Total Allocation</p>
                      <p className="text-sm font-medium tabular-nums text-zinc-200">
                        {formatToken(deal.totalAllocation, 0, deal.tokenSymbol)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Claimed</p>
                      <p className="text-sm font-medium tabular-nums text-emerald-400">
                        {formatToken(deal.claimed, 0, deal.tokenSymbol)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Claimable Now</p>
                      <p className="text-sm font-medium tabular-nums text-violet-400">
                        {formatToken(deal.claimable, 0, deal.tokenSymbol)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Locked</p>
                      <p className="text-sm font-medium tabular-nums text-zinc-400">
                        {formatToken(deal.locked, 0, deal.tokenSymbol)}
                      </p>
                    </div>
                  </div>

                  {/* Segmented Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-800">
                      {/* Claimed — green */}
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${claimedPct}%` }}
                      />
                      {/* Claimable — violet */}
                      <div
                        className="h-full bg-violet-500 transition-all"
                        style={{ width: `${claimablePct}%` }}
                      />
                      {/* Locked — zinc */}
                      <div
                        className="h-full bg-zinc-700 transition-all"
                        style={{ width: `${lockedPct}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Claimed ({claimedPct.toFixed(0)}%)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-violet-500" />
                        Claimable ({claimablePct.toFixed(0)}%)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-zinc-700" />
                        Locked ({lockedPct.toFixed(0)}%)
                      </span>
                    </div>
                  </div>

                  {/* Next Unlock */}
                  <div className="flex items-center justify-between rounded-lg bg-zinc-950/50 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-zinc-500" />
                      <span className="text-zinc-400">Next unlock:</span>
                      <span className="font-medium text-zinc-200">
                        {formatDate(deal.nextUnlockDate)}
                      </span>
                      <span className="text-zinc-500">--</span>
                      <span className="font-medium text-violet-400">
                        {formatToken(deal.nextUnlockAmount, 0, deal.tokenSymbol)}
                      </span>
                    </div>
                    <Countdown
                      targetDate={deal.nextUnlockDate}
                      className="text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Vesting Calendar */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Vesting Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center text-sm font-medium text-zinc-200">
              {monthNames[calMonth]} {calYear}
            </span>
            <Button variant="ghost" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="py-2 text-center text-xs font-medium uppercase tracking-wider text-zinc-500"
              >
                {d}
              </div>
            ))}

            {/* Calendar cells */}
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-20" />;
              }

              const events = getEventsForDay(day);
              const isToday =
                day === now.getDate() &&
                calMonth === now.getMonth() &&
                calYear === now.getFullYear();

              return (
                <div
                  key={day}
                  className={cn(
                    "flex h-20 flex-col rounded-lg border p-1.5 transition-colors",
                    events.length > 0
                      ? "border-violet-500/30 bg-violet-500/5"
                      : "border-zinc-800/50 bg-zinc-900/50",
                    isToday && "ring-1 ring-violet-500"
                  )}
                >
                  <span
                    className={cn(
                      "mb-0.5 text-xs tabular-nums",
                      isToday
                        ? "font-bold text-violet-400"
                        : events.length > 0
                        ? "font-medium text-zinc-200"
                        : "text-zinc-600"
                    )}
                  >
                    {day}
                  </span>
                  {events.map((e, i) => (
                    <div
                      key={i}
                      className="truncate rounded bg-violet-500/20 px-1 py-0.5 text-[10px] font-medium text-violet-300"
                    >
                      {e.amount.toLocaleString()} {e.symbol}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
