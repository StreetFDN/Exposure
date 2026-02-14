"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Types
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

interface PortfolioRow {
  id: string;
  project: string;
  icon: string;
  contributed: number;
  tokenSymbol: string;
  tokensAllocated: number;
  currentValue: number;
  pnlPercent: number;
  allocationPct: number;
  status: string;
  vestingProgress: number;
  dealSlug: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusLabel(status: string, hasVesting: boolean): string {
  if (hasVesting) return "Vesting";
  switch (status) {
    case "OPEN":
    case "LIVE":
      return "Live";
    case "CLOSED":
    case "FUNDED":
      return "Funded";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

function mapApiToRow(
  item: PortfolioItem,
  totalPortfolioValue: number
): PortfolioRow {
  const contributed = parseFloat(item.contribution.amountUsd);
  const tokenPrice = parseFloat(item.deal.tokenPrice);
  const currentValue = parseFloat(item.currentValueUsd);
  const tokenSymbol = item.deal.distributionTokenSymbol || "TOKEN";
  const hasVesting = item.vesting !== null;

  const allocatedUsd = item.allocation?.isFinalized
    ? parseFloat(item.allocation.finalAmount)
    : contributed;
  const tokensAllocated = tokenPrice > 0 ? allocatedUsd / tokenPrice : 0;

  const allocationPct =
    totalPortfolioValue > 0 ? (currentValue / totalPortfolioValue) * 100 : 0;

  return {
    id: item.contribution.id,
    project: item.deal.projectName || item.deal.title,
    icon: (item.deal.projectName || item.deal.title)
      .substring(0, 2)
      .toUpperCase(),
    contributed,
    tokenSymbol,
    tokensAllocated: Math.round(tokensAllocated),
    currentValue,
    pnlPercent: item.roiPercent,
    allocationPct,
    status: statusLabel(item.deal.status, hasVesting),
    vestingProgress: item.vesting ? item.vesting.percentComplete : 0,
    dealSlug: item.deal.slug,
  };
}

type SortField =
  | "project"
  | "contributed"
  | "currentValue"
  | "pnlPercent"
  | "allocationPct";
type SortDir = "asc" | "desc";

function sortData(data: PortfolioRow[], field: SortField, dir: SortDir) {
  return [...data].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return dir === "asc" ? aVal - bVal : bVal - aVal;
    }
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    if (aStr < bStr) return dir === "asc" ? -1 : 1;
    if (aStr > bStr) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function PortfolioSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
      <div className="mb-16">
        <div className="h-8 w-32 animate-pulse rounded bg-zinc-200" />
        <div className="mt-3 h-4 w-64 animate-pulse rounded bg-zinc-200" />
      </div>
      <div className="mb-16 grid grid-cols-3 gap-px border border-zinc-200">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-8">
            <div className="h-3 w-24 animate-pulse rounded bg-zinc-200" />
            <div className="mt-4 h-9 w-32 animate-pulse rounded bg-zinc-200" />
          </div>
        ))}
      </div>
      <div className="space-y-0">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b border-zinc-200 py-5"
          >
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 animate-pulse rounded bg-zinc-200" />
              <div className="h-4 w-32 animate-pulse rounded bg-zinc-200" />
            </div>
            <div className="flex gap-8">
              <div className="h-4 w-20 animate-pulse rounded bg-zinc-200" />
              <div className="h-4 w-20 animate-pulse rounded bg-zinc-200" />
              <div className="h-4 w-16 animate-pulse rounded bg-zinc-200" />
            </div>
          </div>
        ))}
      </div>
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
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">(
    "all"
  );

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
        const totalVal = parseFloat(portfolio.summary.currentValueUsd);
        setSummary(portfolio.summary);
        setPortfolioData(
          portfolio.items.map((item: PortfolioItem) =>
            mapApiToRow(item, totalVal)
          )
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load portfolio"
        );
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
        (d) =>
          d.status === "Live" || d.status === "Vesting" || d.status === "Funded"
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
    if (sortField !== field)
      return <ArrowUpDown className="ml-1 h-3 w-3 text-zinc-300" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-zinc-500" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-zinc-500" />
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
      link.download =
        filenameMatch?.[1] ||
        `portfolio-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // silently handle
    } finally {
      setExporting(false);
    }
  }

  if (loading) return <PortfolioSkeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="flex flex-col items-center justify-center py-24">
          <p className="font-serif text-xl font-normal text-zinc-500">
            Unable to load your portfolio
          </p>
          <p className="mt-2 text-sm font-normal text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  const totalInvested = summary ? parseFloat(summary.totalInvestedUsd) : 0;
  const totalCurrentValue = summary ? parseFloat(summary.currentValueUsd) : 0;
  const totalPnlPercent = summary ? summary.totalPnlPercent : 0;

  const tabs: { key: "all" | "active" | "completed"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
      {/* Header */}
      <div className="mb-16 flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light text-zinc-900">
            Portfolio
          </h1>
          <p className="mt-2 text-sm font-normal text-zinc-500">
            Track your investments, vesting, and claims across all deals.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="text-xs font-normal text-zinc-500 transition-colors hover:text-zinc-600 disabled:opacity-50"
        >
          {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="mb-16 grid grid-cols-3 gap-px border border-zinc-200">
        <div className="p-8">
          <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
            Total Invested
          </span>
          <p className="mt-3 font-serif text-3xl font-light tabular-nums text-zinc-900">
            {formatCurrency(totalInvested)}
          </p>
        </div>
        <div className="p-8">
          <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
            Current Value
          </span>
          <p className="mt-3 font-serif text-3xl font-light tabular-nums text-zinc-900">
            {formatCurrency(totalCurrentValue)}
          </p>
        </div>
        <div className="p-8">
          <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
            Total Return
          </span>
          <p className="mt-3 font-serif text-3xl font-light tabular-nums text-zinc-900">
            {totalPnlPercent >= 0 ? "+" : ""}
            {totalPnlPercent.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex items-center gap-6 border-b border-zinc-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "pb-3 text-sm font-normal transition-colors",
              activeTab === tab.key
                ? "border-b border-zinc-900 text-zinc-900"
                : "text-zinc-500 hover:text-zinc-600"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Holdings Table */}
      {filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <p className="font-serif text-lg font-normal text-zinc-500">
            Your portfolio is empty
          </p>
          <p className="mt-2 text-sm font-normal text-zinc-400">
            Browse available deals to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 border-b border-zinc-200 pb-3">
            <div className="col-span-3">
              <button
                onClick={() => handleSort("project")}
                className="inline-flex items-center text-xs font-normal uppercase tracking-widest text-zinc-500 hover:text-zinc-600"
              >
                Asset <SortIcon field="project" />
              </button>
            </div>
            <div className="col-span-2 text-right">
              <button
                onClick={() => handleSort("contributed")}
                className="inline-flex items-center text-xs font-normal uppercase tracking-widest text-zinc-500 hover:text-zinc-600"
              >
                Invested <SortIcon field="contributed" />
              </button>
            </div>
            <div className="col-span-2 text-right">
              <button
                onClick={() => handleSort("currentValue")}
                className="inline-flex items-center text-xs font-normal uppercase tracking-widest text-zinc-500 hover:text-zinc-600"
              >
                Value <SortIcon field="currentValue" />
              </button>
            </div>
            <div className="col-span-2 text-right">
              <button
                onClick={() => handleSort("allocationPct")}
                className="inline-flex items-center text-xs font-normal uppercase tracking-widest text-zinc-500 hover:text-zinc-600"
              >
                Allocation <SortIcon field="allocationPct" />
              </button>
            </div>
            <div className="col-span-1 text-right">
              <button
                onClick={() => handleSort("pnlPercent")}
                className="inline-flex items-center text-xs font-normal uppercase tracking-widest text-zinc-500 hover:text-zinc-600"
              >
                PnL <SortIcon field="pnlPercent" />
              </button>
            </div>
            <div className="col-span-2 text-right">
              <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
                Status
              </span>
            </div>
          </div>

          {/* Rows */}
          {filteredData.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-12 items-center gap-4 border-b border-zinc-200 py-5 transition-colors hover:border-zinc-300"
            >
              <div className="col-span-3 flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-zinc-200 text-[10px] font-normal text-zinc-500">
                  {row.icon}
                </div>
                <div>
                  <p className="text-sm font-normal text-zinc-700">
                    {row.project}
                  </p>
                  <p className="text-xs font-normal text-zinc-400">
                    {row.tokenSymbol}
                  </p>
                </div>
              </div>
              <div className="col-span-2 text-right">
                <p className="text-sm font-normal tabular-nums text-zinc-600">
                  {formatCurrency(row.contributed)}
                </p>
              </div>
              <div className="col-span-2 text-right">
                <p className="text-sm font-normal tabular-nums text-zinc-600">
                  {formatCurrency(row.currentValue)}
                </p>
              </div>
              <div className="col-span-2 text-right">
                <p className="text-sm font-normal tabular-nums text-zinc-500">
                  {row.allocationPct.toFixed(1)}%
                </p>
              </div>
              <div className="col-span-1 text-right">
                <p
                  className={cn(
                    "text-sm font-normal tabular-nums",
                    row.pnlPercent >= 0 ? "text-zinc-600" : "text-zinc-500"
                  )}
                >
                  {row.pnlPercent >= 0 ? "+" : ""}
                  {row.pnlPercent.toFixed(1)}%
                </p>
              </div>
              <div className="col-span-2 text-right">
                <span className="inline-block border border-zinc-200 px-2 py-0.5 text-xs font-normal text-zinc-500">
                  {row.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
