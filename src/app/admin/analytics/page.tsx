"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowRight,
  Globe,
  Layers,
  Target,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
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
/*  Types (matching API response shape)                                       */
/* -------------------------------------------------------------------------- */

interface AnalyticsData {
  kpis: {
    totalRaised: number;
    newUsers: number;
    totalUsers: number;
    conversionRate: number;
    avgContribution: number;
    revenue: number;
    allTimeRaised: number;
  };
  raiseVolumeChart: { month: string; amount: number }[];
  signupsChart: { month: string; count: number }[];
  topDeals: {
    id: string;
    title: string;
    raised: number;
    contributorCount: number;
    avgContribution: number;
    oversubscription: number;
    status: string;
    chain: string;
  }[];
  tierDistribution: {
    tier: string;
    count: number;
    pct: number;
  }[];
  geoDistribution: {
    country: string;
    users: number;
    contributions: number;
  }[];
  chainDistribution: {
    chain: string;
    amount: number;
    count: number;
  }[];
  range: string;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const dateRanges = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
  { label: "YTD", value: "ytd" },
  { label: "All", value: "all" },
];

const tierColor: Record<string, string> = {
  DIAMOND: "bg-emerald-500",
  PLATINUM: "bg-violet-500",
  GOLD: "bg-amber-500",
  SILVER: "bg-sky-500",
  BRONZE: "bg-zinc-500",
};

const tierLabel: Record<string, string> = {
  DIAMOND: "Diamond",
  PLATINUM: "Platinum",
  GOLD: "Gold",
  SILVER: "Silver",
  BRONZE: "Bronze",
};

const PIE_COLORS = ["#8b5cf6", "#a1a1aa", "#0ea5e9", "#10b981", "#f59e0b"];

const dealStatusLabel: Record<string, string> = {
  COMPLETED: "Completed",
  DISTRIBUTING: "Distributing",
  SETTLEMENT: "Settlement",
  FCFS: "In progress",
  GUARANTEED_ALLOCATION: "In progress",
  REGISTRATION_OPEN: "Registration",
  APPROVED: "Approved",
  UNDER_REVIEW: "Under Review",
  DRAFT: "Draft",
  CANCELLED: "Cancelled",
};

const dealStatusVariant: Record<string, "success" | "info" | "warning" | "outline" | "error"> = {
  COMPLETED: "success",
  DISTRIBUTING: "info",
  SETTLEMENT: "info",
  FCFS: "info",
  GUARANTEED_ALLOCATION: "info",
  REGISTRATION_OPEN: "warning",
  APPROVED: "outline",
  UNDER_REVIEW: "outline",
  DRAFT: "outline",
  CANCELLED: "error",
};

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                          */
/* -------------------------------------------------------------------------- */

function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="card" height="100px" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton variant="card" height="380px" />
        <Skeleton variant="card" height="380px" />
      </div>
      <Skeleton variant="card" height="300px" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton variant="card" height="300px" />
        <Skeleton variant="card" height="300px" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Custom dark tooltip                                                       */
/* -------------------------------------------------------------------------- */

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
  formatter?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 shadow-xl">
      <p className="mb-1 text-xs text-zinc-400">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium text-zinc-50">
          <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
          {formatter ? formatter(entry.value) : entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function AnalyticsDashboardPage() {
  const [selectedRange, setSelectedRange] = useState("30d");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (range: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to fetch analytics");
      setAnalytics(json.data.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(selectedRange);
  }, [selectedRange, fetchAnalytics]);

  const handleRangeChange = (range: string) => {
    setSelectedRange(range);
  };

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
              onClick={() => handleRangeChange(range.value)}
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

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 py-12">
          <AlertTriangle className="h-8 w-8 text-rose-400" />
          <p className="text-sm text-rose-300">{error}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchAnalytics(selectedRange)}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Loading state */}
      {loading && <AnalyticsSkeleton />}

      {/* Content */}
      {!loading && analytics && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label={`Total Raised (${selectedRange})`}
              value={formatCurrency(analytics.kpis.totalRaised)}
              icon={<DollarSign className="h-5 w-5" />}
            />
            <StatCard
              label="New Users"
              value={formatLargeNumber(analytics.kpis.newUsers)}
              description={`of ${formatLargeNumber(analytics.kpis.totalUsers)} total`}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label="Conversion Rate"
              value={formatPercent(analytics.kpis.conversionRate)}
              description="Users with contributions / total"
              icon={<Target className="h-5 w-5" />}
            />
            <StatCard
              label="Avg Contribution"
              value={formatCurrency(analytics.kpis.avgContribution)}
              icon={<BarChart3 className="h-5 w-5" />}
            />
            <StatCard
              label="Revenue"
              value={formatCurrency(analytics.kpis.revenue)}
              description="2.5% platform fee"
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Raise Volume BarChart */}
            <Card>
              <CardHeader>
                <CardTitle>Raise Volume Over Time</CardTitle>
                <CardDescription>Monthly capital raised in USD</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.raiseVolumeChart.length === 0 ? (
                  <div className="flex h-[300px] items-center justify-center rounded-lg border border-violet-500/10 bg-violet-500/5">
                    <div className="flex flex-col items-center gap-2 text-zinc-500">
                      <BarChart3 className="h-8 w-8 text-violet-500/40" />
                      <span className="text-sm font-medium">
                        No raise volume data for this period
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.raiseVolumeChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis
                          dataKey="month"
                          stroke="#71717a"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#71717a"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value: number) =>
                            `$${(value / 1_000_000).toFixed(1)}M`
                          }
                        />
                        <Tooltip
                          content={
                            <ChartTooltip
                              formatter={(value: number) =>
                                formatCurrency(value)
                              }
                            />
                          }
                        />
                        <Bar
                          dataKey="amount"
                          fill="#8b5cf6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Signups LineChart */}
            <Card>
              <CardHeader>
                <CardTitle>User Signups</CardTitle>
                <CardDescription>Monthly new user registrations</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.signupsChart.length === 0 ? (
                  <div className="flex h-[300px] items-center justify-center rounded-lg border border-emerald-500/10 bg-emerald-500/5">
                    <div className="flex flex-col items-center gap-2 text-zinc-500">
                      <Users className="h-8 w-8 text-emerald-500/40" />
                      <span className="text-sm font-medium">
                        No signup data for this period
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.signupsChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis
                          dataKey="month"
                          stroke="#71717a"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#71717a"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          content={
                            <ChartTooltip
                              formatter={(value: number) =>
                                value.toLocaleString()
                              }
                            />
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, fill: "#10b981" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Contributions by Chain PieChart */}
            <Card>
              <CardHeader>
                <CardTitle>Contributions by Chain</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.chainDistribution.length === 0 ? (
                  <div className="flex h-[300px] items-center justify-center rounded-lg border border-sky-500/10 bg-sky-500/5">
                    <div className="flex flex-col items-center gap-2 text-zinc-500">
                      <PieChartIcon className="h-8 w-8 text-sky-500/40" />
                      <span className="text-sm font-medium">
                        No chain distribution data
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.chainDistribution}
                          dataKey="amount"
                          nameKey="chain"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, percent }: { name?: string; percent?: number }) =>
                            `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {analytics.chainDistribution.map((_, idx) => (
                            <Cell
                              key={idx}
                              fill={PIE_COLORS[idx % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          content={
                            <ChartTooltip
                              formatter={(value: number) =>
                                formatCurrency(value)
                              }
                            />
                          }
                        />
                        <Legend
                          formatter={(value: string) => (
                            <span className="text-zinc-400 text-xs">
                              {value}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tier Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Tier Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.tierDistribution.length === 0 ? (
                  <div className="flex h-[300px] items-center justify-center rounded-lg border border-zinc-800 text-zinc-500">
                    <p className="text-sm">No tier data available</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {/* Sort to show Diamond first, Bronze last */}
                    {["DIAMOND", "PLATINUM", "GOLD", "SILVER", "BRONZE"]
                      .map((tier) =>
                        analytics.tierDistribution.find((t) => t.tier === tier)
                      )
                      .filter(Boolean)
                      .map((tier) => (
                        <div key={tier!.tier} className="flex items-center gap-4">
                          <span className="w-20 text-sm font-medium text-zinc-300">
                            {tierLabel[tier!.tier] || tier!.tier}
                          </span>
                          <div className="flex-1">
                            <div className="h-6 w-full overflow-hidden rounded-md bg-zinc-800">
                              <div
                                className={cn(
                                  "h-full rounded-md transition-all",
                                  tierColor[tier!.tier] || "bg-zinc-500"
                                )}
                                style={{
                                  width: `${Math.max(1, tier!.pct)}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex w-28 items-center justify-end gap-2">
                            <span className="text-sm tabular-nums text-zinc-300">
                              {formatLargeNumber(tier!.count)}
                            </span>
                            <span className="text-xs tabular-nums text-zinc-500">
                              ({formatPercent(tier!.pct)})
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
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
              {analytics.geoDistribution.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-zinc-500">
                  <Globe className="h-8 w-8" />
                  <p className="text-sm">No geographic data available</p>
                  <p className="text-xs">
                    Country data will appear as users register with location
                    information
                  </p>
                </div>
              ) : (
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
                      {analytics.geoDistribution.map((row, idx) => (
                        <TableRow key={row.country}>
                          <TableCell className="text-zinc-500">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-medium text-zinc-200">
                            {row.country}
                          </TableCell>
                          <TableCell>
                            {formatLargeNumber(row.users)}
                          </TableCell>
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
              )}
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
              {analytics.topDeals.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-zinc-500">
                  <TrendingUp className="h-8 w-8" />
                  <p className="text-sm">No deals data available</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-zinc-800">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Deal Name</TableHead>
                        <TableHead>Raised</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Contributors</TableHead>
                        <TableHead>Avg Contribution</TableHead>
                        <TableHead>Oversubscription</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.topDeals.map((deal) => (
                        <TableRow key={deal.id}>
                          <TableCell className="font-medium text-zinc-50">
                            {deal.title}
                          </TableCell>
                          <TableCell className="font-semibold text-zinc-200">
                            {formatCurrency(deal.raised)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                dealStatusVariant[deal.status] || "outline"
                              }
                            >
                              {dealStatusLabel[deal.status] || deal.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatLargeNumber(deal.contributorCount)}
                          </TableCell>
                          <TableCell>
                            {deal.avgContribution > 0
                              ? formatCurrency(deal.avgContribution)
                              : "---"}
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
                              "---"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
