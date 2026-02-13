"use client";

import { useState, useEffect } from "react";
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
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils/cn";
import {
  formatCurrency,
  formatToken,
  formatDate,
} from "@/lib/utils/format";

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
  nextUnlockAmount: number;
  vestingType: string;
  tokenPrice: number;
}

interface CalendarEvent {
  date: Date;
  amount: number;
  symbol: string;
  deal: string;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ClaimsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-between">
        <div>
          <div className="h-7 w-20 animate-pulse rounded bg-zinc-800" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-zinc-800" />
        </div>
        <div className="h-10 w-40 animate-pulse rounded bg-zinc-800" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-zinc-800/40 bg-zinc-900/30 p-5">
            <div className="h-3 w-24 animate-pulse rounded bg-zinc-800" />
            <div className="h-7 w-28 animate-pulse rounded bg-zinc-800" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-lg bg-zinc-800" />
                  <div className="space-y-2">
                    <div className="h-5 w-32 animate-pulse rounded bg-zinc-800" />
                    <div className="h-3 w-24 animate-pulse rounded bg-zinc-800" />
                  </div>
                </div>
                <div className="h-3 w-full animate-pulse rounded-full bg-zinc-800" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimDeals, setClaimDeals] = useState<ClaimDeal[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [totalClaimedAllTime, setTotalClaimedAllTime] = useState(0);

  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());

  useEffect(() => {
    async function fetchClaims() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/users/me/portfolio");
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error?.message || "Failed to load claims data");
        }

        const items: PortfolioItem[] = json.data.portfolio.items;

        // Filter to items with vesting data
        const vestingItems = items.filter((item) => item.vesting !== null);

        // Map to ClaimDeal format
        const deals: ClaimDeal[] = vestingItems.map((item) => {
          const vesting = item.vesting!;
          const totalTokens = parseFloat(vesting.totalAmount);
          const claimedTokens = parseFloat(vesting.claimedAmount);
          const claimableTokens = parseFloat(vesting.claimableAmount);
          const lockedTokens = Math.max(0, totalTokens - claimedTokens - claimableTokens);
          const tokenPrice = parseFloat(item.deal.tokenPrice);
          const tokenSymbol = item.deal.distributionTokenSymbol || "TOKEN";

          return {
            id: item.contribution.id,
            dealId: item.deal.id,
            name: item.deal.projectName || item.deal.title,
            icon: (item.deal.projectName || item.deal.title).substring(0, 2).toUpperCase(),
            tokenSymbol,
            totalAllocation: Math.round(totalTokens),
            claimed: Math.round(claimedTokens),
            claimable: Math.round(claimableTokens),
            locked: Math.round(lockedTokens),
            nextUnlockDate: vesting.nextUnlockAt ? new Date(vesting.nextUnlockAt) : null,
            nextUnlockAmount: 0, // Not available from API
            vestingType: "Vesting",
            tokenPrice,
          };
        });

        // Build calendar events from next unlock dates
        const events: CalendarEvent[] = deals
          .filter((d) => d.nextUnlockDate)
          .map((d) => ({
            date: d.nextUnlockDate!,
            amount: d.locked > 0 ? d.locked : d.claimable,
            symbol: d.tokenSymbol,
            deal: d.name,
          }));

        // Calculate total claimed all time
        const totalClaimed = deals.reduce((sum, d) => sum + d.claimed, 0);

        setClaimDeals(deals);
        setCalendarEvents(events);
        setTotalClaimedAllTime(totalClaimed);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load claims data");
      } finally {
        setLoading(false);
      }
    }
    fetchClaims();
  }, []);

  if (loading) return <ClaimsSkeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Alert variant="error" title="Error loading claims">
          {error}
        </Alert>
      </div>
    );
  }

  // Summary calculations
  const totalClaimableValue = claimDeals.reduce(
    (s, d) => s + d.claimable * d.tokenPrice,
    0
  );
  const nextUnlock = claimDeals.reduce(
    (earliest: Date | null, d) => {
      if (!d.nextUnlockDate) return earliest;
      if (!earliest) return d.nextUnlockDate;
      return d.nextUnlockDate < earliest ? d.nextUnlockDate : earliest;
    },
    null
  );
  const nextUnlockEvent = calendarEvents.find(
    (e) => nextUnlock && e.date.getTime() === nextUnlock.getTime()
  );

  // Calendar
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

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  function getEventsForDay(day: number): CalendarEvent[] {
    return calendarEvents.filter((e) => {
      const d = e.date;
      return (
        d.getFullYear() === calYear &&
        d.getMonth() === calMonth &&
        d.getDate() === day
      );
    });
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
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
        <Button
          size="lg"
          leftIcon={<Zap className="h-5 w-5" />}
          disabled={totalClaimableValue <= 0}
          title={totalClaimableValue <= 0 ? "No tokens to claim" : "Coming soon"}
        >
          Claim All ({formatCurrency(totalClaimableValue)})
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Claimable Value"
          value={formatCurrency(totalClaimableValue)}
          icon={<Gift className="h-5 w-5" />}
          description={`${claimDeals.reduce((s, d) => s + d.claimable, 0).toLocaleString()} tokens across ${claimDeals.filter((d) => d.claimable > 0).length} deals`}
        />
        <StatCard
          label="Total Claimed All Time"
          value={formatToken(totalClaimedAllTime, 0, "tokens")}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          label="Next Unlock"
          value={nextUnlock ? formatDate(nextUnlock) : "No upcoming unlocks"}
          icon={<Clock className="h-5 w-5" />}
          description={
            nextUnlockEvent
              ? `${nextUnlockEvent.amount.toLocaleString()} ${nextUnlockEvent.symbol}`
              : undefined
          }
        />
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-50">Your Allocations</h2>

        {claimDeals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-zinc-500">
                No vesting allocations found. Contribute to deals to start earning tokens.
              </p>
            </CardContent>
          </Card>
        ) : (
          claimDeals.map((deal) => {
            const claimedPct = deal.totalAllocation > 0 ? (deal.claimed / deal.totalAllocation) * 100 : 0;
            const claimablePct = deal.totalAllocation > 0 ? (deal.claimable / deal.totalAllocation) * 100 : 0;
            const lockedPct = deal.totalAllocation > 0 ? (deal.locked / deal.totalAllocation) * 100 : 0;

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
                        <Button size="sm" disabled title="Coming soon">
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
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${claimedPct}%` }}
                        />
                        <div
                          className="h-full bg-violet-500 transition-all"
                          style={{ width: `${claimablePct}%` }}
                        />
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
                    {deal.nextUnlockDate && (
                      <div className="flex items-center justify-between rounded-lg bg-zinc-950/50 px-4 py-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-zinc-500" />
                          <span className="text-zinc-400">Next unlock:</span>
                          <span className="font-medium text-zinc-200">
                            {formatDate(deal.nextUnlockDate)}
                          </span>
                          {deal.nextUnlockAmount > 0 && (
                            <>
                              <span className="text-zinc-500">--</span>
                              <span className="font-medium text-violet-400">
                                {formatToken(deal.nextUnlockAmount, 0, deal.tokenSymbol)}
                              </span>
                            </>
                          )}
                        </div>
                        <Countdown
                          targetDate={deal.nextUnlockDate}
                          className="text-xs"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
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
