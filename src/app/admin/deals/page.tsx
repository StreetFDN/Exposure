"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Eye,
  Pause,
  XCircle,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Users,
  DollarSign,
  Clock,
  Zap,
  AlertTriangle,
  Loader2,
  SkipForward,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/dropdown";
import { formatCurrency, formatDate, formatLargeNumber } from "@/lib/utils/format";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface ApiDeal {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  projectName: string;
  category: string;
  status: string;
  chain: string;
  tokenPrice: string;
  totalRaise: string;
  totalRaised: string;
  hardCap: string;
  softCap: string | null;
  contributorCount: number;
  allocationMethod: string;
  minTierRequired: string | null;
  registrationOpenAt: string | null;
  contributionOpenAt: string | null;
  contributionCloseAt: string | null;
  featuredImageUrl: string | null;
  bannerImageUrl: string | null;
  isFeatured: boolean;
  requiresKyc: boolean;
  requiresAccreditation: boolean;
  distributionTokenSymbol: string | null;
  raiseTokenSymbol: string | null;
  description: string;
  projectWebsite: string | null;
  projectTwitter: string | null;
  projectDiscord: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DealPhase {
  id: string;
  name: string;
  order: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Variant maps                                                               */
/* -------------------------------------------------------------------------- */

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

const statusLabelMap: Record<string, string> = {
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

const categoryVariantMap: Record<string, "default" | "success" | "info" | "warning" | "outline"> = {
  DEFI: "default",
  INFRASTRUCTURE: "info",
  GAMING: "success",
  AI: "warning",
  NFT: "outline",
  SOCIAL: "outline",
  OTHER: "outline",
};

const chainVariantMap: Record<string, "default" | "info" | "success" | "warning"> = {
  ETHEREUM: "default",
  ARBITRUM: "info",
  BASE: "success",
};

/* -------------------------------------------------------------------------- */
/*  Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

function DealsSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 rounded bg-zinc-800" />
          <div className="mt-2 h-4 w-64 rounded bg-zinc-800" />
        </div>
        <div className="h-10 w-32 rounded bg-zinc-800" />
      </div>
      <div className="flex gap-4">
        <div className="h-10 w-48 rounded bg-zinc-800" />
        <div className="h-10 w-48 rounded bg-zinc-800" />
        <div className="h-10 w-64 rounded bg-zinc-800" />
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 border-b border-zinc-800 bg-zinc-900/30" />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function DealsManagementPage() {
  const [deals, setDeals] = useState<ApiDeal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDealId, setExpandedDealId] = useState<string | null>(null);
  const [dealPhases, setDealPhases] = useState<Record<string, DealPhase[]>>({});

  // Fetch deals
  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("limit", "50");
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/deals?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load deals");
      }

      setDeals(json.data.deals);
      setTotal(json.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Fetch phases when a deal is expanded
  const fetchPhases = useCallback(async (dealId: string) => {
    if (dealPhases[dealId]) return; // already fetched
    try {
      const res = await fetch(`/api/deals/${dealId}/phase`);
      const json = await res.json();
      if (res.ok && json.success && json.data.phases) {
        setDealPhases((prev) => ({ ...prev, [dealId]: json.data.phases }));
      }
    } catch {
      // Phases fetch failure is non-critical
    }
  }, [dealPhases]);

  // Toggle expand
  const toggleExpand = useCallback((dealId: string) => {
    setExpandedDealId((prev) => {
      const next = prev === dealId ? null : dealId;
      if (next) fetchPhases(dealId);
      return next;
    });
  }, [fetchPhases]);

  // Action: Cancel deal
  const handleCancel = useCallback(async (dealId: string) => {
    if (!confirm("Are you sure you want to cancel this deal?")) return;
    try {
      setActionLoading(dealId);
      const res = await fetch(`/api/deals/${dealId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to cancel deal");
      }
      await fetchDeals();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel deal");
    } finally {
      setActionLoading(null);
    }
  }, [fetchDeals]);

  // Action: Phase transition
  const handlePhaseTransition = useCallback(async (dealId: string, action: string) => {
    try {
      setActionLoading(dealId);
      const res = await fetch(`/api/deals/${dealId}/phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.data?.message || "Phase transition failed");
      }
      // Clear cached phases so they refetch
      setDealPhases((prev) => {
        const copy = { ...prev };
        delete copy[dealId];
        return copy;
      });
      await fetchDeals();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Phase transition failed");
    } finally {
      setActionLoading(null);
    }
  }, [fetchDeals]);

  // Determine next phase action based on current deal status
  function getNextPhaseAction(status: string): { label: string; action: string } | null {
    const map: Record<string, { label: string; action: string }> = {
      DRAFT: { label: "Open Registration", action: "open_registration" },
      APPROVED: { label: "Open Registration", action: "open_registration" },
      REGISTRATION_OPEN: { label: "Close Registration", action: "close_registration" },
      GUARANTEED_ALLOCATION: { label: "Open Contributions", action: "open_contributions" },
      FCFS: { label: "Close Contributions", action: "close_contributions" },
      SETTLEMENT: { label: "Start Distribution", action: "start_distribution" },
      DISTRIBUTING: { label: "Complete Deal", action: "complete" },
    };
    return map[status] ?? null;
  }

  if (loading) return <DealsSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertTriangle className="h-10 w-10 text-rose-400" />
        <h2 className="text-lg font-semibold text-zinc-200">Failed to load deals</h2>
        <p className="text-sm text-zinc-500">{error}</p>
        <button
          onClick={fetchDeals}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Manage Deals</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {total} total deals across all statuses
          </p>
        </div>
        <Link href="/admin/deals/create">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Create Deal</Button>
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-48">
          <Select
            label="Status"
            placeholder="All Statuses"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "", label: "All Statuses" },
              { value: "DRAFT", label: "Draft" },
              { value: "UNDER_REVIEW", label: "Under Review" },
              { value: "APPROVED", label: "Approved" },
              { value: "REGISTRATION_OPEN", label: "Registration" },
              { value: "GUARANTEED_ALLOCATION", label: "Guaranteed" },
              { value: "FCFS", label: "FCFS" },
              { value: "SETTLEMENT", label: "Settlement" },
              { value: "DISTRIBUTING", label: "Distributing" },
              { value: "COMPLETED", label: "Completed" },
              { value: "CANCELLED", label: "Cancelled" },
            ]}
          />
        </div>
        <div className="w-48">
          <Select
            label="Category"
            placeholder="All Categories"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: "", label: "All Categories" },
              { value: "DEFI", label: "DeFi" },
              { value: "INFRASTRUCTURE", label: "Infrastructure" },
              { value: "GAMING", label: "Gaming" },
              { value: "AI", label: "AI" },
              { value: "NFT", label: "NFT" },
              { value: "SOCIAL", label: "Social" },
              { value: "OTHER", label: "Other" },
            ]}
          />
        </div>
        <div className="w-64">
          <Input
            label="Search"
            placeholder="Search by deal name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftAddon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Data table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-8" />
              <TableHead>Deal Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Chain</TableHead>
              <TableHead>Raised / Target</TableHead>
              <TableHead>Contributors</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deals.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-sm text-zinc-500">
                  No deals found
                </TableCell>
              </TableRow>
            )}
            {deals.map((deal) => {
              const isExpanded = expandedDealId === deal.id;
              const raised = parseFloat(deal.totalRaised);
              const cap = parseFloat(deal.hardCap);
              const pct = cap > 0 ? Math.round((raised / cap) * 100) : 0;
              const phases = dealPhases[deal.id] || [];
              const isLoading = actionLoading === deal.id;
              const nextAction = getNextPhaseAction(deal.status);

              return (
                <Fragment key={deal.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => toggleExpand(deal.id)}
                  >
                    <TableCell>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 text-zinc-600 transition-transform",
                          isExpanded && "rotate-90"
                        )}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-zinc-50">
                      {deal.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariantMap[deal.status] ?? "outline"}>
                        {statusLabelMap[deal.status] ?? deal.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={categoryVariantMap[deal.category] ?? "outline"}>
                        {deal.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={chainVariantMap[deal.chain] ?? "outline"}>
                        {deal.chain}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-zinc-400">
                          {formatCurrency(raised)} /{" "}
                          {formatCurrency(cap)}
                        </span>
                        <Progress value={pct} className="w-24" />
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatLargeNumber(deal.contributorCount)}
                    </TableCell>
                    <TableCell className="text-zinc-500">
                      {formatDate(deal.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Dropdown>
                          <DropdownTrigger className="rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50">
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </DropdownTrigger>
                          <DropdownMenu align="right">
                            <DropdownItem
                              icon={<Eye className="h-4 w-4" />}
                              onClick={() => {
                                window.location.href = `/deals/${deal.slug}`;
                              }}
                            >
                              View
                            </DropdownItem>
                            <DropdownItem
                              icon={<Edit className="h-4 w-4" />}
                              onClick={() => {
                                window.location.href = `/admin/deals/${deal.id}/edit`;
                              }}
                            >
                              Edit
                            </DropdownItem>
                            <DropdownSeparator />
                            {nextAction && (
                              <DropdownItem
                                icon={<SkipForward className="h-4 w-4" />}
                                onClick={() => handlePhaseTransition(deal.id, nextAction.action)}
                              >
                                {nextAction.label}
                              </DropdownItem>
                            )}
                            {deal.status !== "CANCELLED" && deal.status !== "COMPLETED" && (
                              <DropdownItem
                                icon={<XCircle className="h-4 w-4" />}
                                className="text-rose-400 hover:!text-rose-300"
                                onClick={() => handleCancel(deal.id)}
                              >
                                Cancel
                              </DropdownItem>
                            )}
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded detail row */}
                  {isExpanded && (
                    <TableRow key={`${deal.id}-detail`} className="hover:bg-transparent bg-zinc-800/20">
                      <TableCell colSpan={9} className="p-0">
                        <div className="border-t border-zinc-800 p-6">
                          {/* Quick stats */}
                          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                              <DollarSign className="h-5 w-5 text-violet-400" />
                              <div>
                                <p className="text-xs text-zinc-500">Raised</p>
                                <p className="font-semibold text-zinc-50">
                                  {formatCurrency(raised)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                              <Users className="h-5 w-5 text-emerald-400" />
                              <div>
                                <p className="text-xs text-zinc-500">
                                  Contributors
                                </p>
                                <p className="font-semibold text-zinc-50">
                                  {formatLargeNumber(deal.contributorCount)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                              <Zap className="h-5 w-5 text-amber-400" />
                              <div>
                                <p className="text-xs text-zinc-500">Fill Rate</p>
                                <p className="font-semibold text-zinc-50">{pct}%</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                              <Clock className="h-5 w-5 text-sky-400" />
                              <div>
                                <p className="text-xs text-zinc-500">Created</p>
                                <p className="font-semibold text-zinc-50">
                                  {formatDate(deal.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Phase timeline */}
                          <div className="mb-6">
                            <h4 className="mb-3 text-sm font-medium text-zinc-300">
                              Phase Timeline
                            </h4>
                            {phases.length > 0 ? (
                              <div className="flex items-center gap-2">
                                {phases.map((phase, idx) => {
                                  const now = new Date();
                                  const startsAt = new Date(phase.startsAt);
                                  const endsAt = new Date(phase.endsAt);
                                  const phaseStatus = phase.isActive
                                    ? "active"
                                    : endsAt < now
                                      ? "completed"
                                      : "upcoming";
                                  return (
                                    <div key={phase.id} className="flex items-center gap-2">
                                      <div
                                        className={cn(
                                          "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium",
                                          phaseStatus === "completed" &&
                                            "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                                          phaseStatus === "active" &&
                                            "border-violet-500/30 bg-violet-500/10 text-violet-400",
                                          phaseStatus === "upcoming" &&
                                            "border-zinc-800 bg-zinc-800/50 text-zinc-500"
                                        )}
                                      >
                                        <span
                                          className={cn(
                                            "h-1.5 w-1.5 rounded-full",
                                            phaseStatus === "completed" && "bg-emerald-400",
                                            phaseStatus === "active" && "bg-violet-400",
                                            phaseStatus === "upcoming" && "bg-zinc-600"
                                          )}
                                        />
                                        {phase.name}
                                      </div>
                                      {idx < phases.length - 1 && (
                                        <ArrowRight className="h-3 w-3 text-zinc-700" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-zinc-600">
                                No phases configured yet
                              </p>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-3">
                            {nextAction && (
                              <Button
                                size="sm"
                                onClick={() => handlePhaseTransition(deal.id, nextAction.action)}
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : null}
                                {nextAction.label}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                window.location.href = `/admin/deals/${deal.id}/edit`;
                              }}
                            >
                              Edit Deal
                            </Button>
                            {deal.status !== "CANCELLED" && deal.status !== "COMPLETED" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCancel(deal.id)}
                                disabled={isLoading}
                              >
                                Cancel Deal
                              </Button>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
