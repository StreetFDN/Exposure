"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Loader2,
  Download,
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
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, formatToken, formatDate } from "@/lib/utils/format";
import { PortfolioChart } from "@/components/charts/portfolio-chart";

// ---------------------------------------------------------------------------
// Types (mapped from API response)
// ---------------------------------------------------------------------------

interface PortfolioItem {
  deal: {
    id: string;
    title: string;
    slug: string;
    projectName: string;
    featuredImageUrl: string | null;
    status: string;
    category: string | null;
    chain: string | null;
    tokenPrice: string;
    distributionTokenSymbol: string | null;
    raiseTokenSymbol: string | null;
  };
  contribution: {
    id: string;
    amount: string;
    amountUsd: string;
    currency: string;
    status: string;
    createdAt: string;
  };
  allocation: {
    finalAmount: string;
    allocationMethod: string;
    isFinalized: boolean;
  } | null;
  vesting: {
    totalAmount: string;
    claimedAmount: string;
    claimableAmount: string;
    nextUnlockAt: string | null;
    nextUnlockAmount: string | null;
    percentComplete: number;
  } | null;
  currentTokenPrice: string;
  currentValueUsd: string;
  roiPercent: number;
}

interface PortfolioSummary {
  totalInvestedUsd: string;
  currentValueUsd: string;
  totalPnlUsd: string;
  totalPnlPercent: number;
  activePositions: number;
  vestingPositions: number;
  completedPositions: number;
}

// Internal row type for sorting/filtering
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
  dealId: string;
  dealSlug: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function categoryVariant(cat: string | null): "default" | "success" | "warning" | "info" | "error" | "outline" {
  switch (cat?.toUpperCase()) {
    case "DEFI": return "default";
    case "INFRASTRUCTURE": return "info";
    case "LAYER_1": case "LAYER_2": return "warning";
    case "GAMEFI": case "GAMING": return "warning";
    case "AI": return "info";
    case "PRIVACY": return "error";
    case "DEX": return "success";
    default: return "outline";
  }
}

function statusToDisplay(status: string, hasVesting: boolean): { label: string; variant: "default" | "success" | "warning" | "info" | "error" | "outline" } {
  if (hasVesting) return { label: "Vesting", variant: "default" };
  switch (status) {
    case "OPEN": case "LIVE": return { label: "Live", variant: "success" };
    case "CLOSED": case "FUNDED": return { label: "Funded", variant: "info" };
    case "COMPLETED": return { label: "Completed", variant: "outline" };
    case "CANCELLED": return { label: "Cancelled", variant: "error" };
    default: return { label: status, variant: "outline" };
  }
}

function mapApiToRow(item: PortfolioItem): PortfolioRow {
  const contributed = parseFloat(item.contribution.amountUsd);
  const tokenPrice = parseFloat(item.deal.tokenPrice);
  const currentTokenPrice = parseFloat(item.currentTokenPrice);
  const currentValue = parseFloat(item.currentValueUsd);
  const pnlDollar = currentValue - contributed;
  const pnlPercent = item.roiPercent;
  const tokenSymbol = item.deal.distributionTokenSymbol || "TOKEN";
  const hasVesting = item.vesting !== null;

  // Calculate token count
  const allocatedUsd = item.allocation?.isFinalized
    ? parseFloat(item.allocation.finalAmount)
    : contributed;
  const tokensAllocated = tokenPrice > 0 ? allocatedUsd / tokenPrice : 0;

  // Vesting progress
  const vestingProgress = item.vesting ? item.vesting.percentComplete : 0;
  const claimable = item.vesting ? parseFloat(item.vesting.claimableAmount) : 0;

  const statusInfo = statusToDisplay(item.deal.status, hasVesting);

  // Build a simplified vesting schedule from the available data
  const unlocks: { date: string; percent: number; amount: number; claimed: boolean }[] = [];
  if (item.vesting) {
    const totalTokens = parseFloat(item.vesting.totalAmount);
    const claimedTokens = parseFloat(item.vesting.claimedAmount);
    if (claimedTokens > 0) {
      unlocks.push({
        date: item.contribution.createdAt,
        percent: totalTokens > 0 ? Math.round((claimedTokens / totalTokens) * 100) : 0,
        amount: Math.round(claimedTokens),
        claimed: true,
      });
    }
    if (claimable > 0) {
      unlocks.push({
        date: new Date().toISOString(),
        percent: totalTokens > 0 ? Math.round((claimable / totalTokens) * 100) : 0,
        amount: Math.round(claimable),
        claimed: false,
      });
    }
    const remaining = totalTokens - claimedTokens - claimable;
    if (remaining > 0 && item.vesting.nextUnlockAt) {
      unlocks.push({
        date: item.vesting.nextUnlockAt,
        percent: totalTokens > 0 ? Math.round((remaining / totalTokens) * 100) : 0,
        amount: Math.round(remaining),
        claimed: false,
      });
    }
  }

  return {
    id: item.contribution.id,
    project: item.deal.projectName || item.deal.title,
    icon: (item.deal.projectName || item.deal.title).substring(0, 2).toUpperCase(),
    category: item.deal.category || "Other",
    categoryVariant: categoryVariant(item.deal.category),
    contributed,
    tokenPrice,
    tokensAllocated: Math.round(tokensAllocated),
    tokenSymbol,
    currentValue,
    pnlDollar,
    pnlPercent,
    vestingProgress,
    claimable: Math.round(claimable),
    status: statusInfo.label,
    statusVariant: statusInfo.variant,
    vestingSchedule: {
      type: hasVesting ? "Vesting" : "N/A",
      tge: 0,
      cliff: "N/A",
      duration: "N/A",
      unlocks,
    },
    dealId: item.deal.id,
    dealSlug: item.deal.slug,
  };
}

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
// Loading skeleton
// ---------------------------------------------------------------------------

function PortfolioSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <div className="h-7 w-32 animate-pulse rounded bg-zinc-800" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-zinc-800" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-zinc-800/40 bg-zinc-900/30 p-5">
            <div className="h-3 w-20 animate-pulse rounded bg-zinc-800" />
            <div className="h-7 w-24 animate-pulse rounded bg-zinc-800" />
          </div>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="h-56 w-full animate-pulse rounded bg-zinc-800" />
        </CardContent>
      </Card>
      <Card>
        <div className="p-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-zinc-800/30 py-4">
              <div className="h-8 w-8 animate-pulse rounded-lg bg-zinc-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-zinc-800" />
                <div className="h-3 w-20 animate-pulse rounded bg-zinc-800" />
              </div>
              <div className="h-4 w-20 animate-pulse rounded bg-zinc-800" />
              <div className="h-4 w-16 animate-pulse rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PortfolioPage() {
  const [portfolioData, setPortfolioData] = useState<PortfolioRow[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [sortField, setSortField] = useState<SortField>("contributed");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    async function fetchPortfolio() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/users/me/portfolio");
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error?.message || "Failed to load portfolio");
        }
        const portfolio = json.data.portfolio;
        setSummary(portfolio.summary);
        setPortfolioData(portfolio.items.map(mapApiToRow));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load portfolio");
      } finally {
        setLoading(false);
      }
    }
    fetchPortfolio();
  }, []);

  const filteredData = useMemo(() => {
    let data = portfolioData;
    if (activeTab === "active") {
      data = data.filter(
        (d) => d.status === "Live" || d.status === "Vesting" || d.status === "Funded"
      );
    } else if (activeTab === "completed") {
      data = data.filter((d) => d.status === "Completed");
    }
    return sortData(data, sortField, sortDir);
  }, [portfolioData, activeTab, sortField, sortDir]);

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

  async function handleExport() {
    try {
      setExporting(true);
      const res = await fetch("/api/users/me/portfolio/export?format=csv");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      link.download = filenameMatch?.[1] || `portfolio-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // Could show an error toast
    } finally {
      setExporting(false);
    }
  }

  if (loading) return <PortfolioSkeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Alert variant="error" title="Error loading portfolio">
          {error}
        </Alert>
      </div>
    );
  }

  // Summary calculations from API data
  const totalInvested = summary ? parseFloat(summary.totalInvestedUsd) : 0;
  const totalCurrentValue = summary ? parseFloat(summary.currentValueUsd) : 0;
  const totalPnlDollar = summary ? parseFloat(summary.totalPnlUsd) : 0;
  const totalPnlPercent = summary ? summary.totalPnlPercent : 0;
  const totalClaimed = portfolioData.reduce((s, d) => {
    if (d.vestingSchedule.unlocks.length > 0) {
      return s + d.vestingSchedule.unlocks.filter((u) => u.claimed).reduce((a, u) => a + u.amount, 0);
    }
    return s;
  }, 0);
  const totalUnclaimed = portfolioData.reduce((s, d) => s + d.claimable, 0);

  // Generate chart data from portfolio value (simple approximation)
  const chartData = (() => {
    const data: { date: string; value: number }[] = [];
    const now = new Date();
    const baseValue = totalInvested > 0 ? totalInvested * 0.85 : 0;
    const targetValue = totalCurrentValue;
    for (let i = 90; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const progress = (90 - i) / 90;
      const value = baseValue + (targetValue - baseValue) * progress + (Math.random() - 0.45) * (totalInvested * 0.02);
      data.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: Math.max(0, Math.round(value * 100) / 100),
      });
    }
    if (data.length > 0) data[data.length - 1].value = totalCurrentValue;
    return data;
  })();

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Portfolio</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Track your investments, vesting, and claims across all deals.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExport}
          disabled={exporting}
          leftIcon={
            exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )
          }
        >
          {exporting ? "Exporting..." : "Export CSV"}
        </Button>
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
      {chartData.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <PortfolioChart data={chartData} />
          </CardContent>
        </Card>
      )}

      {/* Tabs + Table */}
      <Tabs defaultValue="all" onValueChange={(v) => setActiveTab(v)}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {filteredData.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-sm text-zinc-500">No positions found.</p>
              </CardContent>
            </Card>
          ) : (
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
                                  disabled
                                  title="Coming soon"
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
                                  {row.vestingSchedule.tge > 0 && (
                                    <div className="text-sm">
                                      <span className="text-zinc-500">TGE: </span>
                                      <span className="font-medium text-zinc-200">
                                        {row.vestingSchedule.tge}%
                                      </span>
                                    </div>
                                  )}
                                  {row.vestingSchedule.cliff !== "N/A" && (
                                    <div className="text-sm">
                                      <span className="text-zinc-500">Cliff: </span>
                                      <span className="font-medium text-zinc-200">
                                        {row.vestingSchedule.cliff}
                                      </span>
                                    </div>
                                  )}
                                  {row.vestingSchedule.duration !== "N/A" && (
                                    <div className="text-sm">
                                      <span className="text-zinc-500">Duration: </span>
                                      <span className="font-medium text-zinc-200">
                                        {row.vestingSchedule.duration}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {row.vestingSchedule.unlocks.length > 0 ? (
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
                                ) : (
                                  <p className="text-sm text-zinc-500">
                                    No vesting schedule data available for this position.
                                  </p>
                                )}
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
