"use client";

import { useState } from "react";
import {
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  PieChart,
  ArrowRight,
  Globe,
  Layers,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatLargeNumber, formatPercent } from "@/lib/utils/format";

/* -------------------------------------------------------------------------- */
/*  Placeholder data                                                          */
/* -------------------------------------------------------------------------- */

const dateRanges = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
  { label: "YTD", value: "ytd" },
  { label: "All", value: "all" },
];

const kpis = [
  {
    label: "Total Raised (30d)",
    value: "$8.4M",
    description: "+23.5% vs prior period",
    icon: <DollarSign className="h-5 w-5" />,
  },
  {
    label: "New Users",
    value: "2,847",
    description: "+18.2% vs prior period",
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: "Conversion Rate",
    value: "12.4%",
    description: "Viewed to Contributed",
    icon: <Target className="h-5 w-5" />,
  },
  {
    label: "Avg Contribution",
    value: "$4,280",
    description: "+5.1% vs prior period",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    label: "Revenue",
    value: "$336K",
    description: "4% avg platform fee",
    icon: <TrendingUp className="h-5 w-5" />,
  },
];

const funnelData = [
  { stage: "Viewed Deal", count: 48_200, pct: 100 },
  { stage: "Registered", count: 12_840, pct: 26.6 },
  { stage: "Contributed", count: 5_978, pct: 12.4 },
  { stage: "Claimed", count: 4_210, pct: 8.7 },
];

const geoData = [
  { country: "United States", users: 4_820, contributions: 14_200_000 },
  { country: "United Kingdom", users: 2_310, contributions: 6_800_000 },
  { country: "Germany", users: 1_890, contributions: 5_100_000 },
  { country: "Singapore", users: 1_540, contributions: 8_400_000 },
  { country: "Canada", users: 1_280, contributions: 3_200_000 },
  { country: "Australia", users: 980, contributions: 2_600_000 },
  { country: "Japan", users: 870, contributions: 3_800_000 },
  { country: "South Korea", users: 760, contributions: 2_100_000 },
  { country: "France", users: 640, contributions: 1_400_000 },
  { country: "Switzerland", users: 520, contributions: 4_200_000 },
];

const topDeals = [
  {
    name: "Quantum Bridge",
    raised: 6_000_000,
    fillTime: "4h 23m",
    contributors: 4_821,
    avgContribution: 1_244,
    oversubscription: 3.2,
  },
  {
    name: "Nexus Protocol",
    raised: 2_450_000,
    fillTime: "In progress",
    contributors: 1_284,
    avgContribution: 1_908,
    oversubscription: 1.8,
  },
  {
    name: "Prism Finance",
    raised: 3_200_000,
    fillTime: "In progress",
    contributors: 2_156,
    avgContribution: 1_484,
    oversubscription: 2.1,
  },
  {
    name: "Onchain Labs",
    raised: 1_800_000,
    fillTime: "12h 08m",
    contributors: 943,
    avgContribution: 1_909,
    oversubscription: 1.5,
  },
  {
    name: "NeuralDAO",
    raised: 3_500_000,
    fillTime: "Upcoming",
    contributors: 0,
    avgContribution: 0,
    oversubscription: 0,
  },
];

const tierDistribution = [
  { tier: "Diamond", count: 142, pct: 0.8 },
  { tier: "Platinum", count: 680, pct: 3.7 },
  { tier: "Gold", count: 2_140, pct: 11.6 },
  { tier: "Silver", count: 4_890, pct: 26.5 },
  { tier: "Bronze", count: 10_587, pct: 57.4 },
];

const tierColor: Record<string, string> = {
  Diamond: "bg-emerald-500",
  Platinum: "bg-violet-500",
  Gold: "bg-amber-500",
  Silver: "bg-sky-500",
  Bronze: "bg-zinc-500",
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function AnalyticsDashboardPage() {
  const [selectedRange, setSelectedRange] = useState("30d");

  return (
    <div className="flex flex-col gap-8">
      {/* Header + date range */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Analytics</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Platform performance and insights
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          {dateRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setSelectedRange(range.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                selectedRange === range.value
                  ? "bg-violet-500/15 text-violet-400"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            description={kpi.description}
            icon={kpi.icon}
          />
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Raise Volume Over Time</CardTitle>
            <CardDescription>Monthly capital raised in USD</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-violet-500/10 bg-violet-500/5">
              <div className="flex flex-col items-center gap-2 text-zinc-500">
                <BarChart3 className="h-8 w-8 text-violet-500/40" />
                <span className="text-sm font-medium">
                  Bar Chart — Recharts Integration Pending
                </span>
                <span className="text-xs text-zinc-600">
                  Jan: $2.1M | Feb: $3.4M | Mar: $4.8M | Apr: $6.2M | ...
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Signups &amp; KYC Completions</CardTitle>
            <CardDescription>Daily new users and verified KYC</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-emerald-500/10 bg-emerald-500/5">
              <div className="flex flex-col items-center gap-2 text-zinc-500">
                <Users className="h-8 w-8 text-emerald-500/40" />
                <span className="text-sm font-medium">
                  Dual Line Chart — Recharts Integration Pending
                </span>
                <span className="text-xs text-zinc-600">
                  Signups (green) vs KYC completions (blue)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deal Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Deal Conversion Funnel</CardTitle>
          <CardDescription>User journey from viewing a deal to claiming tokens</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center">
            <div className="flex w-full max-w-3xl items-end justify-center gap-4">
              {funnelData.map((stage, idx) => {
                const widthPct = 100 - idx * 20;
                return (
                  <div key={stage.stage} className="flex flex-1 flex-col items-center gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl font-bold text-zinc-50">
                        {formatLargeNumber(stage.count)}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {formatPercent(stage.pct)}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "w-full rounded-lg transition-all",
                        idx === 0 && "bg-violet-500/20",
                        idx === 1 && "bg-violet-500/35",
                        idx === 2 && "bg-violet-500/55",
                        idx === 3 && "bg-violet-500/80"
                      )}
                      style={{
                        height: `${Math.max(40, (stage.pct / 100) * 160)}px`,
                      }}
                    />
                    <span className="text-sm font-medium text-zinc-400">
                      {stage.stage}
                    </span>
                    {idx < funnelData.length - 1 && (
                      <div className="absolute">
                        <ArrowRight className="h-4 w-4 text-zinc-700" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Contributions by Chain */}
        <Card>
          <CardHeader>
            <CardTitle>Contributions by Chain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-sky-500/10 bg-sky-500/5">
              <div className="flex flex-col items-center gap-2 text-zinc-500">
                <PieChart className="h-8 w-8 text-sky-500/40" />
                <span className="text-sm font-medium">
                  Pie Chart — Recharts Integration Pending
                </span>
                <span className="text-xs text-zinc-600">
                  Ethereum: 42% | Arbitrum: 28% | Base: 18% | Polygon: 12%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tier Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Tier Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {tierDistribution.map((tier) => (
                <div key={tier.tier} className="flex items-center gap-4">
                  <span className="w-20 text-sm font-medium text-zinc-300">
                    {tier.tier}
                  </span>
                  <div className="flex-1">
                    <div className="h-6 w-full overflow-hidden rounded-md bg-zinc-800">
                      <div
                        className={cn(
                          "h-full rounded-md transition-all",
                          tierColor[tier.tier]
                        )}
                        style={{ width: `${tier.pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex w-28 items-center justify-end gap-2">
                    <span className="text-sm tabular-nums text-zinc-300">
                      {formatLargeNumber(tier.count)}
                    </span>
                    <span className="text-xs tabular-nums text-zinc-500">
                      ({formatPercent(tier.pct)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Distribution */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-zinc-400" />
            <CardTitle>Geographic Distribution</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-zinc-800">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Contributions</TableHead>
                  <TableHead>Avg Per User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {geoData.map((row, idx) => (
                  <TableRow key={row.country}>
                    <TableCell className="text-zinc-500">{idx + 1}</TableCell>
                    <TableCell className="font-medium text-zinc-200">
                      {row.country}
                    </TableCell>
                    <TableCell>{formatLargeNumber(row.users)}</TableCell>
                    <TableCell className="font-medium text-zinc-50">
                      {formatCurrency(row.contributions)}
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {formatCurrency(
                        row.users > 0
                          ? Math.round(row.contributions / row.users)
                          : 0
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Deals */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-zinc-400" />
            <CardTitle>Top Performing Deals</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-zinc-800">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Deal Name</TableHead>
                  <TableHead>Raised</TableHead>
                  <TableHead>Fill Time</TableHead>
                  <TableHead>Contributors</TableHead>
                  <TableHead>Avg Contribution</TableHead>
                  <TableHead>Oversubscription</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topDeals.map((deal) => (
                  <TableRow key={deal.name}>
                    <TableCell className="font-medium text-zinc-50">
                      {deal.name}
                    </TableCell>
                    <TableCell className="font-semibold text-zinc-200">
                      {formatCurrency(deal.raised)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          deal.fillTime === "Upcoming"
                            ? "outline"
                            : deal.fillTime === "In progress"
                              ? "info"
                              : "success"
                        }
                      >
                        {deal.fillTime}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatLargeNumber(deal.contributors)}</TableCell>
                    <TableCell>
                      {deal.avgContribution > 0
                        ? formatCurrency(deal.avgContribution)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {deal.oversubscription > 0 ? (
                        <span
                          className={cn(
                            "font-semibold",
                            deal.oversubscription >= 2
                              ? "text-emerald-400"
                              : deal.oversubscription >= 1
                                ? "text-amber-400"
                                : "text-zinc-400"
                          )}
                        >
                          {deal.oversubscription}x
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
