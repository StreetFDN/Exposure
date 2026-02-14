"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
  Globe,
  Target,
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
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils/cn";
import {
  formatCurrency,
  formatLargeNumber,
  formatPercent,
} from "@/lib/utils/format";

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

const dealStatusColor: Record<string, string> = {
  COMPLETED: "text-emerald-600",
  DISTRIBUTING: "text-sky-600",
  SETTLEMENT: "text-sky-600",
  FCFS: "text-sky-600",
  GUARANTEED_ALLOCATION: "text-sky-600",
  REGISTRATION_OPEN: "text-amber-600",
  APPROVED: "text-zinc-500",
  UNDER_REVIEW: "text-zinc-500",
  DRAFT: "text-zinc-500",
  CANCELLED: "text-red-600",
};

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                          */
/* -------------------------------------------------------------------------- */

function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-5 gap-px bg-zinc-200">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white p-5">
            <div className="h-2.5 w-20 animate-pulse rounded bg-zinc-200" />
            <div className="mt-3 h-6 w-24 animate-pulse rounded bg-zinc-200" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="border border-zinc-200 p-6">
          <div className="h-3 w-40 animate-pulse rounded bg-zinc-200" />
          <div className="mt-4 h-[280px] animate-pulse rounded bg-zinc-200" />
        </div>
        <div className="border border-zinc-200 p-6">
          <div className="h-3 w-40 animate-pulse rounded bg-zinc-200" />
          <div className="mt-4 h-[280px] animate-pulse rounded bg-zinc-200" />
        </div>
      </div>
      <div className="border border-zinc-200">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 border-b border-zinc-200 px-5 py-4">
            <div className="h-3 w-32 animate-pulse rounded bg-zinc-200" />
            <div className="h-3 w-20 animate-pulse rounded bg-zinc-200" />
            <div className="h-3 w-16 animate-pulse rounded bg-zinc-200" />
            <div className="h-3 w-14 animate-pulse rounded bg-zinc-200" />
            <div className="h-3 w-14 animate-pulse rounded bg-zinc-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Custom tooltip                                                            */
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
    <div className="border border-zinc-200 bg-white px-3 py-2">
      <p className="mb-1 text-xs font-normal text-zinc-500">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-normal text-zinc-800">
          <span
            className="mr-1.5 inline-block h-1.5 w-1.5"
            style={{ backgroundColor: entry.color }}
          />
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

  useEffect(() => { fetchAnalytics(selectedRange); }, [selectedRange, fetchAnalytics]);

  const handleRangeChange = (range: string) => { setSelectedRange(range); };

  return (
    <div className="flex flex-col gap-8">
      {/* Header + date range */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-light text-zinc-900">Analytics</h1>
          <p className="mt-1 text-sm font-normal text-zinc-500">Platform performance and insights</p>
        </div>
        <div className="flex items-center gap-0 border border-zinc-200">
          {dateRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => handleRangeChange(range.value)}
              className={cn(
                "px-4 py-2 text-xs uppercase tracking-widest transition-colors",
                selectedRange === range.value
                  ? "bg-zinc-100 text-zinc-800"
                  : "text-zinc-500 hover:text-zinc-600"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <BarChart3 className="mb-6 h-8 w-8 text-zinc-400" />
          <h2 className="font-serif text-2xl font-light text-zinc-800">Unable to load analytics</h2>
          <p className="mt-3 max-w-sm text-sm font-normal leading-relaxed text-zinc-500">{error}</p>
          <button onClick={() => fetchAnalytics(selectedRange)} className="mt-8 border border-zinc-300 px-6 py-2.5 text-sm font-normal text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-800">Retry</button>
        </div>
      )}

      {/* Loading state */}
      {loading && <AnalyticsSkeleton />}

      {/* Content */}
      {!loading && analytics && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-5 gap-px bg-zinc-200">
            {[
              { label: `Total Raised (${selectedRange})`, value: formatCurrency(analytics.kpis.totalRaised) },
              { label: "New Users", value: formatLargeNumber(analytics.kpis.newUsers), sub: `of ${formatLargeNumber(analytics.kpis.totalUsers)} total` },
              { label: "Conversion Rate", value: formatPercent(analytics.kpis.conversionRate), sub: "Users with contributions / total" },
              { label: "Avg Contribution", value: formatCurrency(analytics.kpis.avgContribution) },
              { label: "Revenue", value: formatCurrency(analytics.kpis.revenue), sub: "2.5% platform fee" },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white p-5">
                <p className="text-xs uppercase tracking-widest text-zinc-500">{kpi.label}</p>
                <p className="mt-2 font-serif text-2xl font-light text-zinc-800">{kpi.value}</p>
                {kpi.sub && <p className="mt-1 text-xs font-normal text-zinc-400">{kpi.sub}</p>}
              </div>
            ))}
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-2 gap-6">
            {/* Raise Volume BarChart */}
            <div className="border border-zinc-200 p-6">
              <h3 className="text-xs uppercase tracking-widest text-zinc-500">Raise Volume Over Time</h3>
              <p className="mt-0.5 text-xs font-normal text-zinc-400">Monthly capital raised in USD</p>
              {analytics.raiseVolumeChart.length === 0 ? (
                <div className="mt-6 flex h-[280px] items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-zinc-400">
                    <BarChart3 className="h-6 w-6" />
                    <span className="text-sm font-normal">No raise volume data for this period</span>
                  </div>
                </div>
              ) : (
                <div className="mt-6 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.raiseVolumeChart}>
                      <XAxis dataKey="month" stroke="transparent" tick={{ fill: "#71717a", fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis stroke="transparent" tick={{ fill: "#71717a", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(value: number) => `$${(value / 1_000_000).toFixed(1)}M`} />
                      <Tooltip content={<ChartTooltip formatter={(value: number) => formatCurrency(value)} />} />
                      <Bar dataKey="amount" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* User Signups LineChart */}
            <div className="border border-zinc-200 p-6">
              <h3 className="text-xs uppercase tracking-widest text-zinc-500">User Signups</h3>
              <p className="mt-0.5 text-xs font-normal text-zinc-400">Monthly new user registrations</p>
              {analytics.signupsChart.length === 0 ? (
                <div className="mt-6 flex h-[280px] items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-zinc-400">
                    <Users className="h-6 w-6" />
                    <span className="text-sm font-normal">No signup data for this period</span>
                  </div>
                </div>
              ) : (
                <div className="mt-6 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.signupsChart}>
                      <XAxis dataKey="month" stroke="transparent" tick={{ fill: "#71717a", fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis stroke="transparent" tick={{ fill: "#71717a", fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip formatter={(value: number) => value.toLocaleString()} />} />
                      <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: "#10b981" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-2 gap-6">
            {/* Contributions by Chain PieChart */}
            <div className="border border-zinc-200 p-6">
              <h3 className="text-xs uppercase tracking-widest text-zinc-500">Contributions by Chain</h3>
              {analytics.chainDistribution.length === 0 ? (
                <div className="mt-6 flex h-[280px] items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-zinc-400">
                    <PieChartIcon className="h-6 w-6" />
                    <span className="text-sm font-normal">No chain distribution data</span>
                  </div>
                </div>
              ) : (
                <div className="mt-6 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.chainDistribution}
                        dataKey="amount"
                        nameKey="chain"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        strokeWidth={0}
                        label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {analytics.chainDistribution.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip formatter={(value: number) => formatCurrency(value)} />} />
                      <Legend formatter={(value: string) => <span className="text-xs font-normal text-zinc-500">{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Tier Distribution */}
            <div className="border border-zinc-200 p-6">
              <h3 className="text-xs uppercase tracking-widest text-zinc-500">Tier Distribution</h3>
              {analytics.tierDistribution.length === 0 ? (
                <div className="mt-6 flex h-[280px] items-center justify-center text-zinc-400">
                  <p className="text-sm font-normal">No tier data available</p>
                </div>
              ) : (
                <div className="mt-6 flex flex-col gap-5">
                  {["DIAMOND", "PLATINUM", "GOLD", "SILVER", "BRONZE"]
                    .map((tier) => analytics.tierDistribution.find((t) => t.tier === tier))
                    .filter(Boolean)
                    .map((tier) => (
                      <div key={tier!.tier} className="flex items-center gap-4">
                        <span className="w-20 text-sm font-normal text-zinc-500">{tierLabel[tier!.tier] || tier!.tier}</span>
                        <div className="flex-1">
                          <div className="h-1.5 w-full bg-zinc-200">
                            <div className={cn("h-full transition-all", tierColor[tier!.tier] || "bg-zinc-500")} style={{ width: `${Math.max(1, tier!.pct)}%` }} />
                          </div>
                        </div>
                        <div className="flex w-28 items-center justify-end gap-2">
                          <span className="text-sm tabular-nums text-zinc-600">{formatLargeNumber(tier!.count)}</span>
                          <span className="text-xs tabular-nums text-zinc-400">({formatPercent(tier!.pct)})</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Geographic Distribution */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Globe className="h-4 w-4 text-zinc-500" />
              <h2 className="text-xs uppercase tracking-widest text-zinc-500">Geographic Distribution</h2>
            </div>
            {analytics.geoDistribution.length === 0 ? (
              <div className="flex flex-col items-center gap-3 border border-zinc-200 py-16 text-zinc-500">
                <Globe className="h-6 w-6" />
                <p className="font-serif text-lg font-normal text-zinc-500">No geographic data available</p>
                <p className="text-sm font-normal">Country data will appear as users register with location information</p>
              </div>
            ) : (
              <div className="border border-zinc-200">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200">
                      <th className="w-8 px-5 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500">#</th>
                      <th className="px-5 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500">Country</th>
                      <th className="px-5 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500">Users</th>
                      <th className="px-5 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500">Contributions</th>
                      <th className="px-5 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500">Avg Per User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.geoDistribution.map((row, idx) => (
                      <tr key={row.country} className="border-b border-zinc-200 transition-colors hover:bg-zinc-50">
                        <td className="px-5 py-4 text-sm tabular-nums text-zinc-400">{idx + 1}</td>
                        <td className="px-5 py-4 text-sm font-normal text-zinc-700">{row.country}</td>
                        <td className="px-5 py-4 text-sm tabular-nums text-zinc-600">{formatLargeNumber(row.users)}</td>
                        <td className="px-5 py-4 font-mono text-sm text-zinc-800">{formatCurrency(row.contributions)}</td>
                        <td className="px-5 py-4 text-sm font-normal text-zinc-500">{formatCurrency(row.users > 0 ? Math.round(row.contributions / row.users) : 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top Performing Deals */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-zinc-500" />
              <h2 className="text-xs uppercase tracking-widest text-zinc-500">Top Performing Deals</h2>
            </div>
            {analytics.topDeals.length === 0 ? (
              <div className="flex flex-col items-center gap-3 border border-zinc-200 py-16 text-zinc-500">
                <TrendingUp className="h-6 w-6" />
                <p className="font-serif text-lg font-normal text-zinc-500">No deals data available</p>
              </div>
            ) : (
              <div className="border border-zinc-200">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200">
                      {["Deal Name", "Raised", "Status", "Contributors", "Avg Contribution", "Oversubscription"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topDeals.map((deal) => (
                      <tr key={deal.id} className="border-b border-zinc-200 transition-colors hover:bg-zinc-50">
                        <td className="px-5 py-4 text-sm font-normal text-zinc-800">{deal.title}</td>
                        <td className="px-5 py-4 font-mono text-sm text-zinc-700">{formatCurrency(deal.raised)}</td>
                        <td className="px-5 py-4"><span className={cn("text-xs uppercase tracking-wider", dealStatusColor[deal.status] || "text-zinc-500")}>{dealStatusLabel[deal.status] || deal.status}</span></td>
                        <td className="px-5 py-4 text-sm tabular-nums text-zinc-600">{formatLargeNumber(deal.contributorCount)}</td>
                        <td className="px-5 py-4 text-sm font-normal text-zinc-500">{deal.avgContribution > 0 ? formatCurrency(deal.avgContribution) : "---"}</td>
                        <td className="px-5 py-4">
                          {deal.oversubscription > 0 ? (
                            <span className={cn("font-mono text-sm", deal.oversubscription >= 2 ? "text-emerald-600" : deal.oversubscription >= 1 ? "text-amber-600" : "text-zinc-500")}>{deal.oversubscription}x</span>
                          ) : (
                            <span className="text-sm text-zinc-400">---</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
