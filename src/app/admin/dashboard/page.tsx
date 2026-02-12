"use client";

import { useState } from "react";
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
/*  Placeholder data                                                          */
/* -------------------------------------------------------------------------- */

const stats = [
  {
    label: "Total Raised",
    value: "$48.2M",
    description: "+12.3% from last month",
    icon: <DollarSign className="h-5 w-5" />,
  },
  {
    label: "Active Raises",
    value: "12",
    description: "3 launching this week",
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    label: "Total Users",
    value: "18,439",
    description: "+842 this month",
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: "KYC Completion Rate",
    value: "73.2%",
    description: "Target: 80%",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    label: "Platform Revenue",
    value: "$1.93M",
    description: "+8.7% from last month",
    icon: <Wallet className="h-5 w-5" />,
  },
  {
    label: "Pending Applications",
    value: "24",
    description: "6 high priority",
    icon: <FileText className="h-5 w-5" />,
  },
];

const recentDeals = [
  {
    name: "Nexus Protocol",
    status: "Live",
    statusVariant: "success" as const,
    raised: 2_450_000,
    target: 3_000_000,
    contributors: 1_284,
    date: "2026-02-10",
  },
  {
    name: "AetherFi",
    status: "Registration",
    statusVariant: "info" as const,
    raised: 0,
    target: 5_000_000,
    contributors: 0,
    date: "2026-02-09",
  },
  {
    name: "Onchain Labs",
    status: "Completed",
    statusVariant: "default" as const,
    raised: 1_800_000,
    target: 1_800_000,
    contributors: 943,
    date: "2026-02-07",
  },
  {
    name: "ZeroLayer",
    status: "Live",
    statusVariant: "success" as const,
    raised: 890_000,
    target: 2_000_000,
    contributors: 512,
    date: "2026-02-06",
  },
  {
    name: "MetaVault",
    status: "Paused",
    statusVariant: "warning" as const,
    raised: 340_000,
    target: 1_500_000,
    contributors: 187,
    date: "2026-02-04",
  },
];

const actionItems = [
  {
    label: "Pending KYC Reviews",
    count: 47,
    severity: "warning" as const,
    href: "/admin/compliance",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  {
    label: "Flagged Transactions",
    count: 8,
    severity: "error" as const,
    href: "/admin/compliance",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  {
    label: "Pending Applications",
    count: 24,
    severity: "info" as const,
    href: "/admin/applications",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    label: "Expiring Deals",
    count: 3,
    severity: "warning" as const,
    href: "/admin/deals",
    icon: <Clock className="h-4 w-4" />,
  },
];

const systemHealth = {
  api: "operational" as const,
  rpc: [
    { chain: "Ethereum", status: "operational" as const },
    { chain: "Arbitrum", status: "operational" as const },
    { chain: "Base", status: "degraded" as const },
    { chain: "Polygon", status: "operational" as const },
  ],
  indexerLag: 3,
  queueDepth: 142,
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
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

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function AdminDashboardPage() {
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
        {stats.map((s) => (
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
            <div className="flex h-[300px] items-center justify-center rounded-lg bg-violet-500/5 border border-violet-500/10">
              <div className="flex flex-col items-center gap-2 text-zinc-500">
                <TrendingUp className="h-8 w-8 text-violet-500/40" />
                <span className="text-sm font-medium">Line Chart — Recharts Integration Pending</span>
                <span className="text-xs text-zinc-600">Monthly raise volume in USD</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex flex-col items-center gap-2 text-zinc-500">
                <Users className="h-8 w-8 text-emerald-500/40" />
                <span className="text-sm font-medium">Line Chart — Recharts Integration Pending</span>
                <span className="text-xs text-zinc-600">Cumulative users + KYC completions</span>
              </div>
            </div>
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
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Deal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Raised / Target</TableHead>
                  <TableHead>Contributors</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDeals.map((deal) => {
                  const pct =
                    deal.target > 0
                      ? Math.round((deal.raised / deal.target) * 100)
                      : 0;
                  return (
                    <TableRow key={deal.name}>
                      <TableCell className="font-medium text-zinc-50">
                        {deal.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={deal.statusVariant}>{deal.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-zinc-400">
                            {formatCurrency(deal.raised)} / {formatCurrency(deal.target)}
                          </span>
                          <Progress value={pct} className="w-24" />
                        </div>
                      </TableCell>
                      <TableCell>{formatLargeNumber(deal.contributors)}</TableCell>
                      <TableCell className="text-zinc-500">
                        {formatDate(deal.date)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
