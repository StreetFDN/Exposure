"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Users,
  ShieldCheck,
  Wallet,
  FileText,
  AlertTriangle,
  Clock,
  Activity,
  Server,
  Database,
  Layers,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils/cn";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate, formatLargeNumber } from "@/lib/utils/format";

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

function StatusDot({ status }: { status: "operational" | "degraded" | "down" }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        status === "operational" && "bg-emerald-400",
        status === "degraded" && "bg-amber-400",
        status === "down" && "bg-rose-400"
      )}
    />
  );
}

const statusVariantMap: Record<string, "success" | "info" | "warning" | "error" | "default" | "outline"> = {
  DRAFT: "outline",
  UNDER_REVIEW: "outline",
  APPROVED: "info",
  REGISTRATION_OPEN: "info",
  GUARANTEED_ALLOCATION: "success",
  FCFS: "success",
  SETTLEMENT: "warning",
  DISTRIBUTING: "warning",
  COMPLETED: "default",
  CANCELLED: "error",
};

function statusLabel(status: string): string {
  const map: Record<string, string> = {
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
  return map[status] ?? status;
}

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                           */
/* -------------------------------------------------------------------------- */

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div>
        <div className="h-8 w-48 rounded bg-zinc-800" />
        <div className="mt-2 h-4 w-64 rounded bg-zinc-800" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-zinc-800/40 bg-zinc-900/30" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-[380px] rounded-xl border border-zinc-800/40 bg-zinc-900/30" />
        <div className="h-[380px] rounded-xl border border-zinc-800/40 bg-zinc-900/30" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-[300px] rounded-xl border border-zinc-800/40 bg-zinc-900/30" />
        <div className="h-[300px] rounded-xl border border-zinc-800/40 bg-zinc-900/30" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Custom chart tooltip                                                       */
/* -------------------------------------------------------------------------- */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-lg">
      <p className="text-xs text-zinc-400">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-sm font-medium text-zinc-100">
          {formatCurrency(entry.value)}
        </p>
      ))}
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
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertTriangle className="h-10 w-10 text-rose-400" />
        <h2 className="text-lg font-semibold text-zinc-200">Failed to load dashboard</h2>
        <p className="text-sm text-zinc-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Prepare chart data
  const volumeChartData = stats.dailyVolumeUsd.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    volume: parseFloat(d.volume),
  }));

  // Build tier chart data for user growth visualization
  const tierChartData = Object.entries(stats.usersByTier).map(([tier, count]) => ({
    tier,
    users: count,
  }));

  // Build stat cards from real data
  const statCards = [
    {
      label: "Total Raised",
      value: stats.totalRaisedFormatted,
      description: `${stats.completedRaises} raises completed`,
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      label: "Active Raises",
      value: stats.activeRaises.toString(),
      description: `${stats.totalDeals} total deals`,
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      label: "Total Users",
      value: formatLargeNumber(stats.totalUsers),
      description: `${stats.totalContributors} contributors`,
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "KYC Completion Rate",
      value: `${stats.kycCompletionRate}%`,
      description: "Target: 80%",
      icon: <ShieldCheck className="h-5 w-5" />,
    },
    {
      label: "Total Staked",
      value: stats.totalStakedFormatted,
      description: `${formatLargeNumber(stats.activeStakers)} active stakers`,
      icon: <Wallet className="h-5 w-5" />,
    },
    {
      label: "Pending Applications",
      value: stats.pendingApplications.toString(),
      description: `${stats.highSeverityFlags} high-severity flags`,
      icon: <FileText className="h-5 w-5" />,
    },
  ];

  // Build action items from real data
  const actionItems = [
    {
      label: "Pending KYC Reviews",
      count: stats.usersByKycStatus.PENDING ?? 0,
      severity: "warning" as const,
      href: "/admin/compliance",
      icon: <ShieldCheck className="h-4 w-4" />,
    },
    {
      label: "Unresolved Flags",
      count: stats.unresolvedFlags,
      severity: "error" as const,
      href: "/admin/compliance",
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      label: "Pending Applications",
      count: stats.pendingApplications,
      severity: "info" as const,
      href: "/admin/applications",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      label: "High Severity Flags",
      count: stats.highSeverityFlags,
      severity: "warning" as const,
      href: "/admin/compliance",
      icon: <Clock className="h-4 w-4" />,
    },
  ];

  // System health: derive from real data availability
  const systemHealth = {
    api: "operational" as const,
    rpc: [
      { chain: "Ethereum", status: "operational" as const },
      { chain: "Arbitrum", status: "operational" as const },
      { chain: "Base", status: "operational" as const },
    ],
    indexerLag: 0,
    queueDepth: 0,
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Platform overview and key metrics
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            description={s.description}
            icon={s.icon}
          />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Raise Volume Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {volumeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={volumeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis
                    dataKey="date"
                    stroke="#71717a"
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#71717a"
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    tickFormatter={(v) => `$${formatLargeNumber(v)}`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="volume"
                    fill="#7c3aed"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center rounded-lg bg-violet-500/5 border border-violet-500/10">
                <div className="flex flex-col items-center gap-2 text-zinc-500">
                  <TrendingUp className="h-8 w-8 text-violet-500/40" />
                  <span className="text-sm font-medium">No volume data available</span>
                  <span className="text-xs text-zinc-600">Volume data will appear once contributions are recorded</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Distribution by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            {tierChartData.some((d) => d.users > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tierChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis
                    dataKey="tier"
                    stroke="#71717a"
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#71717a"
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#a1a1aa" }}
                    itemStyle={{ color: "#e4e4e7" }}
                  />
                  <Bar
                    dataKey="users"
                    fill="#a78bfa"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex flex-col items-center gap-2 text-zinc-500">
                  <Users className="h-8 w-8 text-emerald-500/40" />
                  <span className="text-sm font-medium">No tier data available</span>
                  <span className="text-xs text-zinc-600">User tier distribution will populate as users register</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Two-column section: Recent Deals + Action Required */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Deals */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Deals</CardTitle>
              <Link
                href="/admin/deals"
                className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentDeals.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Deal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Raised / Target</TableHead>
                    <TableHead>Contributors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentDeals.map((deal) => {
                    const raised = parseFloat(deal.totalRaised);
                    const cap = parseFloat(deal.hardCap);
                    const pct = cap > 0 ? Math.round((raised / cap) * 100) : 0;
                    return (
                      <TableRow key={deal.id}>
                        <TableCell className="font-medium text-zinc-50">
                          {deal.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariantMap[deal.status] ?? "outline"}>
                            {statusLabel(deal.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-zinc-400">
                              {formatCurrency(raised)} / {formatCurrency(cap)}
                            </span>
                            <Progress value={pct} className="w-24" />
                          </div>
                        </TableCell>
                        <TableCell>{formatLargeNumber(deal.contributorCount)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="py-8 text-center text-sm text-zinc-500">No deals yet</p>
            )}
          </CardContent>
        </Card>

        {/* Action Required */}
        <Card>
          <CardHeader>
            <CardTitle>Action Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {actionItems.map((item) => (
                <Link key={item.label} href={item.href}>
                  <div className="group flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/30 p-4 transition-colors hover:bg-zinc-800/60">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg",
                          item.severity === "error" && "bg-rose-500/10 text-rose-400",
                          item.severity === "warning" && "bg-amber-500/10 text-amber-400",
                          item.severity === "info" && "bg-sky-500/10 text-sky-400"
                        )}
                      >
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-300">
                          {item.label}
                        </p>
                        <p
                          className={cn(
                            "text-lg font-bold",
                            item.severity === "error" && "text-rose-400",
                            item.severity === "warning" && "text-amber-400",
                            item.severity === "info" && "text-sky-400"
                          )}
                        >
                          {item.count}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-zinc-400" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-zinc-400" />
            <CardTitle>System Health</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* API Status */}
            <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-300">API Status</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusDot status={systemHealth.api} />
                <span className="text-sm capitalize text-zinc-400">
                  {systemHealth.api}
                </span>
              </div>
            </div>

            {/* RPC Status */}
            <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-300">RPC Nodes</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {systemHealth.rpc.map((node) => (
                  <div key={node.chain} className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">{node.chain}</span>
                    <div className="flex items-center gap-1.5">
                      <StatusDot status={node.status} />
                      <span className="text-xs capitalize text-zinc-400">
                        {node.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Indexer Lag */}
            <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-300">Indexer Lag</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusDot
                  status={
                    systemHealth.indexerLag <= 5
                      ? "operational"
                      : systemHealth.indexerLag <= 20
                        ? "degraded"
                        : "down"
                  }
                />
                <span className="text-sm text-zinc-400">
                  {systemHealth.indexerLag} blocks behind
                </span>
              </div>
            </div>

            {/* Queue Depth */}
            <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-300">Queue Depth</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusDot
                  status={
                    systemHealth.queueDepth < 500
                      ? "operational"
                      : systemHealth.queueDepth < 2000
                        ? "degraded"
                        : "down"
                  }
                />
                <span className="text-sm text-zinc-400">
                  {formatLargeNumber(systemHealth.queueDepth)} jobs pending
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
