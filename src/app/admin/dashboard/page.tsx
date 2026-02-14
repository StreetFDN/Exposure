"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency, formatLargeNumber } from "@/lib/utils/format";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface DashboardStats {
  totalRaised: string;
  totalRaisedFormatted: string;
  activeRaises: number;
  completedRaises: number;
  totalDeals: number;
  totalUsers: number;
  totalContributors: number;
  kycCompletionRate: number;
  pendingApplications: number;
  usersByTier: Record<string, number>;
  usersByKycStatus: Record<string, number>;
  activeStakers: number;
  totalStaked: string;
  totalStakedFormatted: string;
  unresolvedFlags: number;
  highSeverityFlags: number;
  recentDeals: {
    id: string;
    title: string;
    status: string;
    totalRaised: string;
    hardCap: string;
    contributorCount: number;
    percentRaised: number;
  }[];
  dailyVolumeUsd: { date: string; volume: string }[];
  recentActivity: { type: string; message: string; timestamp: string }[];
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const statusLabel: Record<string, string> = {
  DRAFT: "Draft",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REGISTRATION_OPEN: "Registration",
  GUARANTEED_ALLOCATION: "Guaranteed",
  FCFS: "FCFS",
  SETTLEMENT: "Settlement",
  DISTRIBUTING: "Distributing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

/* -------------------------------------------------------------------------- */
/*  Chart tooltip                                                              */
/* -------------------------------------------------------------------------- */

function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="border border-zinc-200 bg-white px-3 py-2">
      <p className="text-xs font-normal text-zinc-500">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-sm font-normal text-zinc-700">
          {typeof entry.value === "number" && entry.value > 100
            ? formatCurrency(entry.value)
            : entry.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                           */
/* -------------------------------------------------------------------------- */

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <div className="h-8 w-40 animate-pulse bg-zinc-200" />
        <div className="mt-3 h-4 w-64 animate-pulse bg-zinc-200" />
      </div>
      <div className="grid grid-cols-1 gap-px bg-zinc-200 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse bg-white" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="h-[340px] animate-pulse bg-zinc-200" />
        <div className="h-[340px] animate-pulse bg-zinc-200" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/stats");
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Failed to load dashboard data");
        }
        setStats(json.data.stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="font-serif text-lg font-normal text-zinc-500">
          Unable to load dashboard
        </p>
        <p className="text-sm font-normal text-zinc-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="border border-zinc-200 px-4 py-2 text-sm font-normal text-zinc-500 transition-colors hover:text-zinc-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const volumeChartData = stats.dailyVolumeUsd.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    volume: parseFloat(d.volume),
  }));

  const tierChartData = Object.entries(stats.usersByTier).map(
    ([tier, count]) => ({ tier, users: count })
  );

  const kpis = [
    {
      label: "Total Raised",
      value: stats.totalRaisedFormatted,
      sub: `${stats.completedRaises} completed`,
    },
    {
      label: "Active Deals",
      value: stats.activeRaises.toString(),
      sub: `${stats.totalDeals} total`,
    },
    {
      label: "Total Users",
      value: formatLargeNumber(stats.totalUsers),
      sub: `${stats.totalContributors} contributors`,
    },
    {
      label: "Pending KYC",
      value: (stats.usersByKycStatus.PENDING ?? 0).toString(),
      sub: `${stats.kycCompletionRate}% completion`,
    },
  ];

  const actions = [
    {
      label: "Pending KYC Reviews",
      count: stats.usersByKycStatus.PENDING ?? 0,
      href: "/admin/compliance",
    },
    {
      label: "Unresolved Flags",
      count: stats.unresolvedFlags,
      href: "/admin/compliance",
    },
    {
      label: "Pending Applications",
      count: stats.pendingApplications,
      href: "/admin/applications",
    },
    {
      label: "High Severity Flags",
      count: stats.highSeverityFlags,
      href: "/admin/compliance",
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      {/* Page header */}
      <div>
        <h1 className="font-serif text-2xl font-light text-zinc-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm font-normal text-zinc-500">
          Platform overview and key metrics
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-px border border-zinc-200 bg-zinc-200 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white p-6">
            <p className="text-xs uppercase tracking-widest text-zinc-500">
              {kpi.label}
            </p>
            <p className="mt-2 font-serif text-3xl font-light text-zinc-900">
              {kpi.value}
            </p>
            <p className="mt-1 text-sm font-normal text-zinc-500">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-xs uppercase tracking-widest text-zinc-500">
            Raise Volume
          </h2>
          <div className="border border-zinc-200 p-6">
            {volumeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={volumeChartData}>
                  <XAxis
                    dataKey="date"
                    stroke="transparent"
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="transparent"
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${formatLargeNumber(v)}`}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="volume" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center">
                <p className="text-sm font-normal text-zinc-400">
                  No volume data available
                </p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-xs uppercase tracking-widest text-zinc-500">
            User Distribution by Tier
          </h2>
          <div className="border border-zinc-200 p-6">
            {tierChartData.some((d) => d.users > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={tierChartData}>
                  <XAxis
                    dataKey="tier"
                    stroke="transparent"
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="transparent"
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="users" fill="#a1a1aa" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center">
                <p className="text-sm font-normal text-zinc-400">
                  No tier data available
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Deals + Action Required */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest text-zinc-500">
              Recent Deals
            </h2>
            <Link
              href="/admin/deals"
              className="text-xs font-normal text-zinc-500 transition-colors hover:text-zinc-600"
            >
              View all
            </Link>
          </div>
          <div className="border border-zinc-200">
            {stats.recentDeals.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="px-4 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500">
                      Deal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-normal uppercase tracking-widest text-zinc-500">
                      Raised
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-normal uppercase tracking-widest text-zinc-500">
                      Target
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentDeals.map((deal) => {
                    const raised = parseFloat(deal.totalRaised);
                    const cap = parseFloat(deal.hardCap);
                    return (
                      <tr
                        key={deal.id}
                        className="border-b border-zinc-200 last:border-b-0 transition-colors hover:bg-zinc-50"
                      >
                        <td className="px-4 py-4 text-sm font-normal text-zinc-700">
                          {deal.title}
                        </td>
                        <td className="px-4 py-4 text-xs font-normal text-zinc-500">
                          {statusLabel[deal.status] ?? deal.status}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-sm text-zinc-600">
                          {formatCurrency(raised)}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-sm text-zinc-500">
                          {formatCurrency(cap)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex h-32 items-center justify-center">
                <p className="text-sm font-normal text-zinc-400">No deals yet</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-xs uppercase tracking-widest text-zinc-500">
            Action Required
          </h2>
          <div className="flex flex-col gap-px border border-zinc-200 bg-zinc-200">
            {actions.map((item) => (
              <Link key={item.label} href={item.href}>
                <div className="flex items-center justify-between bg-white px-4 py-4 transition-colors hover:bg-zinc-50">
                  <span className="text-sm font-normal text-zinc-500">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-xl text-zinc-700">
                      {item.count}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div>
        <h2 className="mb-4 text-xs uppercase tracking-widest text-zinc-500">
          System Health
        </h2>
        <div className="grid grid-cols-1 gap-px border border-zinc-200 bg-zinc-200 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "API Status", value: "Operational" },
            { label: "Ethereum RPC", value: "Operational" },
            { label: "Arbitrum RPC", value: "Operational" },
            { label: "Base RPC", value: "Operational" },
          ].map((h) => (
            <div key={h.label} className="flex items-center gap-3 bg-white px-4 py-4">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <div>
                <p className="text-xs uppercase tracking-widest text-zinc-500">
                  {h.label}
                </p>
                <p className="text-sm font-normal text-zinc-600">{h.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
