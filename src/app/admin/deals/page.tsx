"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  XCircle,
  ChevronRight,
  ArrowRight,
  Loader2,
  SkipForward,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
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
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*  Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

function DealsSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 animate-pulse bg-zinc-200" />
        <div className="h-9 w-28 animate-pulse bg-zinc-200" />
      </div>
      <div className="flex gap-4">
        <div className="h-9 w-36 animate-pulse bg-zinc-200" />
        <div className="h-9 w-36 animate-pulse bg-zinc-200" />
        <div className="h-9 w-56 animate-pulse bg-zinc-200" />
      </div>
      <div className="border border-zinc-200">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse border-b border-zinc-200 bg-white" />
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

  const fetchPhases = useCallback(
    async (dealId: string) => {
      if (dealPhases[dealId]) return;
      try {
        const res = await fetch(`/api/deals/${dealId}/phase`);
        const json = await res.json();
        if (res.ok && json.success && json.data.phases) {
          setDealPhases((prev) => ({ ...prev, [dealId]: json.data.phases }));
        }
      } catch {
        /* non-critical */
      }
    },
    [dealPhases]
  );

  const toggleExpand = useCallback(
    (dealId: string) => {
      setExpandedDealId((prev) => {
        const next = prev === dealId ? null : dealId;
        if (next) fetchPhases(dealId);
        return next;
      });
    },
    [fetchPhases]
  );

  const handleCancel = useCallback(
    async (dealId: string) => {
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
    },
    [fetchDeals]
  );

  const handlePhaseTransition = useCallback(
    async (dealId: string, action: string) => {
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
    },
    [fetchDeals]
  );

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
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="font-serif text-lg font-normal text-zinc-500">Failed to load deals</p>
        <p className="text-sm font-normal text-zinc-400">{error}</p>
        <button
          onClick={fetchDeals}
          className="border border-zinc-200 px-4 py-2 text-sm font-normal text-zinc-500 transition-colors hover:text-zinc-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-light text-zinc-900">Deals</h1>
          <p className="mt-1 text-sm font-normal text-zinc-500">
            {total} total deals across all statuses
          </p>
        </div>
        <Link
          href="/admin/deals/create"
          className="flex items-center gap-2 border border-zinc-200 px-4 py-2 text-sm font-normal text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
        >
          <Plus className="h-3.5 w-3.5" />
          Create Deal
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-zinc-200 bg-transparent px-3 py-2 text-sm font-normal text-zinc-500 outline-none transition-colors focus:border-zinc-400"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REGISTRATION_OPEN">Registration</option>
          <option value="GUARANTEED_ALLOCATION">Guaranteed</option>
          <option value="FCFS">FCFS</option>
          <option value="SETTLEMENT">Settlement</option>
          <option value="DISTRIBUTING">Distributing</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-zinc-200 bg-transparent px-3 py-2 text-sm font-normal text-zinc-500 outline-none transition-colors focus:border-zinc-400"
        >
          <option value="">All Categories</option>
          <option value="DEFI">DeFi</option>
          <option value="INFRASTRUCTURE">Infrastructure</option>
          <option value="GAMING">Gaming</option>
          <option value="AI">AI</option>
          <option value="NFT">NFT</option>
          <option value="SOCIAL">Social</option>
          <option value="OTHER">Other</option>
        </select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search deals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-zinc-200 bg-transparent py-2 pl-9 pr-3 text-sm font-normal text-zinc-600 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-zinc-200">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="w-8 px-3 py-3" />
              <th className="px-4 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500">Chain</th>
              <th className="px-4 py-3 text-right text-xs font-normal uppercase tracking-widest text-zinc-500">Raised</th>
              <th className="px-4 py-3 text-right text-xs font-normal uppercase tracking-widest text-zinc-500">Target</th>
              <th className="px-4 py-3 text-right text-xs font-normal uppercase tracking-widest text-zinc-500">Contributors</th>
              <th className="px-4 py-3 text-right text-xs font-normal uppercase tracking-widest text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deals.length === 0 && (
              <tr>
                <td colSpan={8} className="py-16 text-center text-sm font-normal text-zinc-400">
                  No deals found
                </td>
              </tr>
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
                  <tr
                    className="cursor-pointer border-b border-zinc-200 transition-colors hover:bg-zinc-50"
                    onClick={() => toggleExpand(deal.id)}
                  >
                    <td className="px-3 py-4">
                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 text-zinc-400 transition-transform",
                          isExpanded && "rotate-90"
                        )}
                      />
                    </td>
                    <td className="px-4 py-4 text-sm font-normal text-zinc-700">{deal.title}</td>
                    <td className="px-4 py-4 text-xs font-normal text-zinc-500">
                      {statusLabelMap[deal.status] ?? deal.status}
                    </td>
                    <td className="px-4 py-4 text-xs font-normal text-zinc-500">{deal.chain}</td>
                    <td className="px-4 py-4 text-right font-mono text-sm text-zinc-600">
                      {formatCurrency(raised)}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-sm text-zinc-500">
                      {formatCurrency(cap)}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-zinc-500">
                      {formatLargeNumber(deal.contributorCount)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Dropdown>
                          <DropdownTrigger className="p-1 text-zinc-500 transition-colors hover:text-zinc-600">
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </DropdownTrigger>
                          <DropdownMenu align="right">
                            <DropdownItem icon={<Eye className="h-4 w-4" />} onClick={() => { window.location.href = `/deals/${deal.slug}`; }}>View</DropdownItem>
                            <DropdownItem icon={<Edit className="h-4 w-4" />} onClick={() => { window.location.href = `/admin/deals/${deal.id}/edit`; }}>Edit</DropdownItem>
                            <DropdownSeparator />
                            {nextAction && (
                              <DropdownItem icon={<SkipForward className="h-4 w-4" />} onClick={() => handlePhaseTransition(deal.id, nextAction.action)}>
                                {nextAction.label}
                              </DropdownItem>
                            )}
                            {deal.status !== "CANCELLED" && deal.status !== "COMPLETED" && (
                              <DropdownItem icon={<XCircle className="h-4 w-4" />} className="text-red-600 hover:!text-red-500" onClick={() => handleCancel(deal.id)}>Cancel</DropdownItem>
                            )}
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="border-b border-zinc-200">
                      <td colSpan={8} className="p-0">
                        <div className="border-t border-zinc-200 bg-white px-6 py-6">
                          <div className="mb-6 grid grid-cols-2 gap-px border border-zinc-200 bg-zinc-200 sm:grid-cols-4">
                            {[
                              { label: "Raised", value: formatCurrency(raised) },
                              { label: "Contributors", value: formatLargeNumber(deal.contributorCount) },
                              { label: "Fill Rate", value: `${pct}%` },
                              { label: "Created", value: formatDate(deal.createdAt) },
                            ].map((s) => (
                              <div key={s.label} className="bg-white p-4">
                                <p className="text-xs uppercase tracking-widest text-zinc-500">{s.label}</p>
                                <p className="mt-1 font-serif text-xl text-zinc-700">{s.value}</p>
                              </div>
                            ))}
                          </div>

                          <div className="mb-6">
                            <p className="mb-3 text-xs uppercase tracking-widest text-zinc-500">Phase Timeline</p>
                            {phases.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-2">
                                {phases.map((phase, idx) => {
                                  const now = new Date();
                                  const endsAt = new Date(phase.endsAt);
                                  const ps = phase.isActive ? "active" : endsAt < now ? "completed" : "upcoming";
                                  return (
                                    <div key={phase.id} className="flex items-center gap-2">
                                      <div className={cn("flex items-center gap-2 border px-3 py-1.5 text-xs", ps === "completed" && "border-emerald-200 text-emerald-600", ps === "active" && "border-violet-200 text-violet-600", ps === "upcoming" && "border-zinc-200 text-zinc-500")}>
                                        <span className={cn("h-1 w-1 rounded-full", ps === "completed" && "bg-emerald-600", ps === "active" && "bg-violet-600", ps === "upcoming" && "bg-zinc-400")} />
                                        {phase.name}
                                      </div>
                                      {idx < phases.length - 1 && <ArrowRight className="h-3 w-3 text-zinc-300" />}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs font-normal text-zinc-400">No phases configured</p>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            {nextAction && (
                              <button onClick={() => handlePhaseTransition(deal.id, nextAction.action)} disabled={isLoading} className="border border-violet-200 px-4 py-2 text-xs text-violet-600 transition-colors hover:bg-violet-50 disabled:opacity-50">
                                {isLoading && <Loader2 className="mr-1.5 inline h-3 w-3 animate-spin" />}
                                {nextAction.label}
                              </button>
                            )}
                            <button onClick={() => { window.location.href = `/admin/deals/${deal.id}/edit`; }} className="border border-zinc-200 px-4 py-2 text-xs text-zinc-500 transition-colors hover:text-zinc-700">Edit Deal</button>
                            {deal.status !== "CANCELLED" && deal.status !== "COMPLETED" && (
                              <button onClick={() => handleCancel(deal.id)} disabled={isLoading} className="border border-red-200 px-4 py-2 text-xs text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50">Cancel Deal</button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
