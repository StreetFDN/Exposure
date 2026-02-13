"use client";

import React, { useState, useMemo } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Coins,
  Gift,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, formatToken, formatDate } from "@/lib/utils/format";
import { PortfolioChart } from "@/components/charts/portfolio-chart";

// ---------------------------------------------------------------------------
// Placeholder Data
// ---------------------------------------------------------------------------

interface PortfolioRow {
  id: string;
  project: string;
  icon: string;
  category: string;
  categoryVariant: "default" | "success" | "warning" | "info" | "error" | "outline";
  contributed: number;
  tokenPrice: number;
  tokensAllocated: number;
  tokenSymbol: string;
  currentValue: number;
  pnlDollar: number;
  pnlPercent: number;
  vestingProgress: number;
  claimable: number;
  status: string;
  statusVariant: "default" | "success" | "warning" | "info" | "error" | "outline";
  vestingSchedule: {
    type: string;
    tge: number;
    cliff: string;
    duration: string;
    unlocks: { date: string; percent: number; amount: number; claimed: boolean }[];
  };
}

const PORTFOLIO_DATA: PortfolioRow[] = [
  {
    id: "1",
    project: "Aether Protocol",
    icon: "AE",
    category: "DeFi",
    categoryVariant: "default",
    contributed: 2500,
    tokenPrice: 0.025,
    tokensAllocated: 100000,
    tokenSymbol: "AETH",
    currentValue: 3875,
    pnlDollar: 1375,
    pnlPercent: 55,
    vestingProgress: 35,
    claimable: 12500,
    status: "Live",
    statusVariant: "success",
    vestingSchedule: {
      type: "Linear with Cliff",
      tge: 10,
      cliff: "3 months",
      duration: "12 months",
      unlocks: [
        { date: "2025-09-01", percent: 10, amount: 10000, claimed: true },
        { date: "2025-12-01", percent: 25, amount: 25000, claimed: true },
        { date: "2026-03-01", percent: 25, amount: 25000, claimed: false },
        { date: "2026-06-01", percent: 20, amount: 20000, claimed: false },
        { date: "2026-09-01", percent: 20, amount: 20000, claimed: false },
      ],
    },
  },
  {
    id: "2",
    project: "NexusVault",
    icon: "NX",
    category: "Infrastructure",
    categoryVariant: "info",
    contributed: 5000,
    tokenPrice: 0.10,
    tokensAllocated: 50000,
    tokenSymbol: "NXV",
    currentValue: 7200,
    pnlDollar: 2200,
    pnlPercent: 44,
    vestingProgress: 62,
    claimable: 5000,
    status: "Vesting",
    statusVariant: "default",
    vestingSchedule: {
      type: "Monthly Cliff",
      tge: 15,
      cliff: "1 month",
      duration: "10 months",
      unlocks: [
        { date: "2025-06-01", percent: 15, amount: 7500, claimed: true },
        { date: "2025-07-01", percent: 8.5, amount: 4250, claimed: true },
        { date: "2025-08-01", percent: 8.5, amount: 4250, claimed: true },
        { date: "2025-09-01", percent: 8.5, amount: 4250, claimed: true },
        { date: "2025-10-01", percent: 8.5, amount: 4250, claimed: true },
        { date: "2025-11-01", percent: 8.5, amount: 4250, claimed: true },
        { date: "2025-12-01", percent: 8.5, amount: 4250, claimed: true },
        { date: "2026-01-01", percent: 8.5, amount: 4250, claimed: false },
        { date: "2026-02-01", percent: 8.5, amount: 4250, claimed: false },
        { date: "2026-03-01", percent: 8.5, amount: 4250, claimed: false },
        { date: "2026-04-01", percent: 8.5, amount: 4250, claimed: false },
      ],
    },
  },
  {
    id: "3",
    project: "Photon Chain",
    icon: "PH",
    category: "Layer 1",
    categoryVariant: "warning",
    contributed: 1000,
    tokenPrice: 0.005,
    tokensAllocated: 200000,
    tokenSymbol: "PHO",
    currentValue: 880,
    pnlDollar: -120,
    pnlPercent: -12,
    vestingProgress: 15,
    claimable: 0,
    status: "Live",
    statusVariant: "success",
    vestingSchedule: {
      type: "Linear",
      tge: 5,
      cliff: "6 months",
      duration: "18 months",
      unlocks: [
        { date: "2025-11-01", percent: 5, amount: 10000, claimed: true },
        { date: "2026-05-01", percent: 10, amount: 20000, claimed: false },
        { date: "2026-11-01", percent: 25, amount: 50000, claimed: false },
        { date: "2027-05-01", percent: 30, amount: 60000, claimed: false },
        { date: "2027-11-01", percent: 30, amount: 60000, claimed: false },
      ],
    },
  },
  {
    id: "4",
    project: "OmniLedger",
    icon: "OL",
    category: "DeFi",
    categoryVariant: "default",
    contributed: 3000,
    tokenPrice: 0.15,
    tokensAllocated: 20000,
    tokenSymbol: "OMNI",
    currentValue: 3450,
    pnlDollar: 450,
    pnlPercent: 15,
    vestingProgress: 85,
    claimable: 2000,
    status: "Vesting",
    statusVariant: "default",
    vestingSchedule: {
      type: "Monthly Cliff",
      tge: 20,
      cliff: "None",
      duration: "6 months",
      unlocks: [
        { date: "2025-04-01", percent: 20, amount: 4000, claimed: true },
        { date: "2025-05-01", percent: 16, amount: 3200, claimed: true },
        { date: "2025-06-01", percent: 16, amount: 3200, claimed: true },
        { date: "2025-07-01", percent: 16, amount: 3200, claimed: true },
        { date: "2025-08-01", percent: 16, amount: 3200, claimed: true },
        { date: "2025-09-01", percent: 16, amount: 3200, claimed: false },
      ],
    },
  },
  {
    id: "5",
    project: "ZKBridge",
    icon: "ZK",
    category: "Privacy",
    categoryVariant: "error",
    contributed: 1500,
    tokenPrice: 0.03,
    tokensAllocated: 50000,
    tokenSymbol: "ZKB",
    currentValue: 2100,
    pnlDollar: 600,
    pnlPercent: 40,
    vestingProgress: 50,
    claimable: 7500,
    status: "Live",
    statusVariant: "success",
    vestingSchedule: {
      type: "Linear with Cliff",
      tge: 10,
      cliff: "2 months",
      duration: "8 months",
      unlocks: [
        { date: "2025-10-01", percent: 10, amount: 5000, claimed: true },
        { date: "2025-12-01", percent: 15, amount: 7500, claimed: true },
        { date: "2026-02-01", percent: 25, amount: 12500, claimed: false },
        { date: "2026-04-01", percent: 25, amount: 12500, claimed: false },
        { date: "2026-06-01", percent: 25, amount: 12500, claimed: false },
      ],
    },
  },
  {
    id: "6",
    project: "Solaris Network",
    icon: "SN",
    category: "GameFi",
    categoryVariant: "warning",
    contributed: 750,
    tokenPrice: 0.008,
    tokensAllocated: 93750,
    tokenSymbol: "SOL",
    currentValue: 1125,
    pnlDollar: 375,
    pnlPercent: 50,
    vestingProgress: 0,
    claimable: 0,
    status: "Funded",
    statusVariant: "info",
    vestingSchedule: {
      type: "TGE + Linear",
      tge: 25,
      cliff: "None",
      duration: "6 months",
      unlocks: [
        { date: "2026-04-01", percent: 25, amount: 23437, claimed: false },
        { date: "2026-06-01", percent: 25, amount: 23437, claimed: false },
        { date: "2026-08-01", percent: 25, amount: 23438, claimed: false },
        { date: "2026-10-01", percent: 25, amount: 23438, claimed: false },
      ],
    },
  },
  {
    id: "7",
    project: "DataMesh AI",
    icon: "DM",
    category: "AI",
    categoryVariant: "info",
    contributed: 4000,
    tokenPrice: 0.50,
    tokensAllocated: 8000,
    tokenSymbol: "DMAI",
    currentValue: 6800,
    pnlDollar: 2800,
    pnlPercent: 70,
    vestingProgress: 100,
    claimable: 0,
    status: "Completed",
    statusVariant: "outline",
    vestingSchedule: {
      type: "Linear",
      tge: 20,
      cliff: "1 month",
      duration: "4 months",
      unlocks: [
        { date: "2025-03-01", percent: 20, amount: 1600, claimed: true },
        { date: "2025-04-01", percent: 20, amount: 1600, claimed: true },
        { date: "2025-05-01", percent: 20, amount: 1600, claimed: true },
        { date: "2025-06-01", percent: 20, amount: 1600, claimed: true },
        { date: "2025-07-01", percent: 20, amount: 1600, claimed: true },
      ],
    },
  },
  {
    id: "8",
    project: "Quantum Swap",
    icon: "QS",
    category: "DEX",
    categoryVariant: "success",
    contributed: 2000,
    tokenPrice: 0.12,
    tokensAllocated: 16666,
    tokenSymbol: "QSWP",
    currentValue: 2333,
    pnlDollar: 333,
    pnlPercent: 16.65,
    vestingProgress: 40,
    claimable: 1666,
    status: "Live",
    statusVariant: "success",
    vestingSchedule: {
      type: "Monthly Cliff",
      tge: 10,
      cliff: "None",
      duration: "10 months",
      unlocks: [
        { date: "2025-08-01", percent: 10, amount: 1666, claimed: true },
        { date: "2025-09-01", percent: 10, amount: 1666, claimed: true },
        { date: "2025-10-01", percent: 10, amount: 1666, claimed: true },
        { date: "2025-11-01", percent: 10, amount: 1666, claimed: true },
        { date: "2025-12-01", percent: 10, amount: 1666, claimed: false },
        { date: "2026-01-01", percent: 10, amount: 1666, claimed: false },
        { date: "2026-02-01", percent: 10, amount: 1668, claimed: false },
        { date: "2026-03-01", percent: 10, amount: 1668, claimed: false },
        { date: "2026-04-01", percent: 10, amount: 1668, claimed: false },
        { date: "2026-05-01", percent: 10, amount: 1668, claimed: false },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Portfolio value over time (sample data)
// ---------------------------------------------------------------------------

const PORTFOLIO_CHART_DATA = (() => {
  const data: { date: string; value: number }[] = [];
  const now = new Date();
  let value = 12000;
  for (let i = 90; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const change = (Math.random() - 0.42) * 400;
    value = Math.max(8000, value + change);
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: Math.round(value * 100) / 100,
    });
  }
  data[data.length - 1].value = 27763;
  return data;
})();

// ---------------------------------------------------------------------------
// Sort helpers
// ---------------------------------------------------------------------------

type SortField =
  | "project"
  | "contributed"
  | "tokenPrice"
  | "tokensAllocated"
  | "currentValue"
  | "pnlPercent"
  | "vestingProgress"
  | "claimable";

type SortDir = "asc" | "desc";

function sortData(data: PortfolioRow[], field: SortField, dir: SortDir) {
  return [...data].sort((a, b) => {
    const aRaw = a[field];
    const bRaw = b[field];
    let aVal: number | string = typeof aRaw === "number" ? aRaw : String(aRaw).toLowerCase();
    let bVal: number | string = typeof bRaw === "number" ? bRaw : String(bRaw).toLowerCase();
    if (aVal < bVal) return dir === "asc" ? -1 : 1;
    if (aVal > bVal) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PortfolioPage() {
  const [sortField, setSortField] = useState<SortField>("contributed");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const filteredData = useMemo(() => {
    let data = PORTFOLIO_DATA;
    if (activeTab === "active") {
      data = data.filter(
        (d) => d.status === "Live" || d.status === "Vesting" || d.status === "Funded"
      );
    } else if (activeTab === "completed") {
      data = data.filter((d) => d.status === "Completed");
    }
    return sortData(data, sortField, sortDir);
  }, [activeTab, sortField, sortDir]);

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 text-zinc-600" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-violet-400" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-violet-400" />
    );
  }

  // Summary calculations
  const totalInvested = PORTFOLIO_DATA.reduce((s, d) => s + d.contributed, 0);
  const totalCurrentValue = PORTFOLIO_DATA.reduce((s, d) => s + d.currentValue, 0);
  const totalPnlDollar = totalCurrentValue - totalInvested;
  const totalPnlPercent = (totalPnlDollar / totalInvested) * 100;
  const totalClaimed = 28520; // placeholder
  const totalUnclaimed = PORTFOLIO_DATA.reduce((s, d) => s + d.claimable, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Portfolio</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Track your investments, vesting, and claims across all deals.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Total Invested"
          value={formatCurrency(totalInvested)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          label="Current Value"
          value={formatCurrency(totalCurrentValue)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="Total PnL"
          value={
            <span
              className={cn(
                totalPnlDollar >= 0 ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {totalPnlDollar >= 0 ? "+" : ""}
              {formatCurrency(totalPnlDollar)}
            </span>
          }
          description={`${totalPnlPercent >= 0 ? "+" : ""}${totalPnlPercent.toFixed(1)}%`}
          icon={<Coins className="h-5 w-5" />}
        />
        <StatCard
          label="Total Claimed"
          value={formatToken(totalClaimed, 0, "tokens")}
          icon={<Gift className="h-5 w-5" />}
        />
        <StatCard
          label="Unclaimed"
          value={formatToken(totalUnclaimed, 0, "tokens")}
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      {/* Portfolio Value Chart */}
      <Card>
        <CardContent className="pt-6">
          <PortfolioChart data={PORTFOLIO_CHART_DATA} />
        </CardContent>
      </Card>

      {/* Tabs + Table */}
      <Tabs defaultValue="all" onValueChange={(v) => setActiveTab(v)}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {/* Using a single content area since filtering is via state */}
        <TabsContent value={activeTab}>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("project")}
                    >
                      <span className="inline-flex items-center">
                        Project <SortIcon field="project" />
                      </span>
                    </TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-right"
                      onClick={() => handleSort("contributed")}
                    >
                      <span className="inline-flex items-center justify-end">
                        Contributed <SortIcon field="contributed" />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-right"
                      onClick={() => handleSort("tokenPrice")}
                    >
                      <span className="inline-flex items-center justify-end">
                        Token Price <SortIcon field="tokenPrice" />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-right"
                      onClick={() => handleSort("tokensAllocated")}
                    >
                      <span className="inline-flex items-center justify-end">
                        Tokens <SortIcon field="tokensAllocated" />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-right"
                      onClick={() => handleSort("currentValue")}
                    >
                      <span className="inline-flex items-center justify-end">
                        Value <SortIcon field="currentValue" />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-right"
                      onClick={() => handleSort("pnlPercent")}
                    >
                      <span className="inline-flex items-center justify-end">
                        PnL <SortIcon field="pnlPercent" />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("vestingProgress")}
                    >
                      <span className="inline-flex items-center">
                        Vesting <SortIcon field="vestingProgress" />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-right"
                      onClick={() => handleSort("claimable")}
                    >
                      <span className="inline-flex items-center justify-end">
                        Claimable <SortIcon field="claimable" />
                      </span>
                    </TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((row) => (
                    <React.Fragment key={row.id}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() =>
                          setExpandedRow(expandedRow === row.id ? null : row.id)
                        }
                      >
                        <TableCell className="w-8 pr-0">
                          {expandedRow === row.id ? (
                            <ChevronDown className="h-4 w-4 text-zinc-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-zinc-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-zinc-300">
                              {row.icon}
                            </div>
                            <span className="font-medium text-zinc-100">
                              {row.project}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.categoryVariant} size="sm">
                            {row.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCurrency(row.contributed)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-zinc-400">
                          ${row.tokenPrice.toFixed(row.tokenPrice < 0.01 ? 4 : 2)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.tokensAllocated.toLocaleString()} {row.tokenSymbol}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCurrency(row.currentValue)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div
                            className={cn(
                              "flex flex-col items-end tabular-nums",
                              row.pnlDollar >= 0
                                ? "text-emerald-400"
                                : "text-rose-400"
                            )}
                          >
                            <span className="text-sm font-medium">
                              {row.pnlDollar >= 0 ? "+" : ""}
                              {formatCurrency(row.pnlDollar)}
                            </span>
                            <span className="text-xs">
                              {row.pnlPercent >= 0 ? "+" : ""}
                              {row.pnlPercent.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-24">
                            <Progress
                              value={row.vestingProgress}
                              showPercentage
                              color={
                                row.vestingProgress === 100
                                  ? "success"
                                  : "default"
                              }
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {row.claimable > 0 ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-sm tabular-nums text-violet-400">
                                {row.claimable.toLocaleString()}
                              </span>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                Claim
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-zinc-600">--</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.statusVariant} size="sm">
                            {row.status}
                          </Badge>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Vesting Detail */}
                      {expandedRow === row.id && (
                        <TableRow key={`${row.id}-detail`} className="bg-zinc-950/50 hover:bg-zinc-950/50">
                          <TableCell colSpan={11} className="p-0">
                            <div className="border-t border-zinc-800 px-6 py-5">
                              <div className="mb-4 flex items-center gap-6">
                                <div className="text-sm">
                                  <span className="text-zinc-500">
                                    Vesting Type:{" "}
                                  </span>
                                  <span className="font-medium text-zinc-200">
                                    {row.vestingSchedule.type}
                                  </span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-zinc-500">TGE: </span>
                                  <span className="font-medium text-zinc-200">
                                    {row.vestingSchedule.tge}%
                                  </span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-zinc-500">Cliff: </span>
                                  <span className="font-medium text-zinc-200">
                                    {row.vestingSchedule.cliff}
                                  </span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-zinc-500">
                                    Duration:{" "}
                                  </span>
                                  <span className="font-medium text-zinc-200">
                                    {row.vestingSchedule.duration}
                                  </span>
                                </div>
                              </div>
                              <div className="overflow-hidden rounded-lg border border-zinc-800">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-zinc-800 bg-zinc-900">
                                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">
                                        Unlock Date
                                      </th>
                                      <th className="px-4 py-2 text-right text-xs font-medium uppercase text-zinc-500">
                                        Percent
                                      </th>
                                      <th className="px-4 py-2 text-right text-xs font-medium uppercase text-zinc-500">
                                        Tokens
                                      </th>
                                      <th className="px-4 py-2 text-center text-xs font-medium uppercase text-zinc-500">
                                        Status
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {row.vestingSchedule.unlocks.map(
                                      (unlock, i) => (
                                        <tr
                                          key={i}
                                          className="border-b border-zinc-800/50 last:border-0"
                                        >
                                          <td className="px-4 py-2 text-zinc-300">
                                            {formatDate(unlock.date)}
                                          </td>
                                          <td className="px-4 py-2 text-right tabular-nums text-zinc-300">
                                            {unlock.percent}%
                                          </td>
                                          <td className="px-4 py-2 text-right tabular-nums text-zinc-300">
                                            {unlock.amount.toLocaleString()}{" "}
                                            {row.tokenSymbol}
                                          </td>
                                          <td className="px-4 py-2 text-center">
                                            {unlock.claimed ? (
                                              <Badge
                                                variant="success"
                                                size="sm"
                                              >
                                                Claimed
                                              </Badge>
                                            ) : new Date(unlock.date) <=
                                              new Date() ? (
                                              <Badge
                                                variant="default"
                                                size="sm"
                                              >
                                                Claimable
                                              </Badge>
                                            ) : (
                                              <Badge
                                                variant="outline"
                                                size="sm"
                                              >
                                                Locked
                                              </Badge>
                                            )}
                                          </td>
                                        </tr>
                                      )
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
