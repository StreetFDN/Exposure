"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  ArrowRight,
  Briefcase,
  Users,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatLargeNumber } from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "APPROVED", label: "Upcoming" },
  { value: "REGISTRATION_OPEN", label: "Registration Open" },
  { value: "GUARANTEED_ALLOCATION", label: "Active" },
  { value: "FCFS", label: "FCFS" },
  { value: "COMPLETED", label: "Completed" },
];

const CATEGORY_OPTIONS = [
  { value: "ALL", label: "All Categories" },
  { value: "DEFI", label: "DeFi" },
  { value: "GAMING", label: "Gaming" },
  { value: "AI", label: "AI" },
  { value: "INFRASTRUCTURE", label: "Infrastructure" },
  { value: "NFT", label: "NFT" },
  { value: "SOCIAL", label: "Social" },
];

const CHAIN_OPTIONS = [
  { value: "ALL", label: "All Chains" },
  { value: "ETHEREUM", label: "Ethereum" },
  { value: "BASE", label: "Base" },
  { value: "ARBITRUM", label: "Arbitrum" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "ending_soon", label: "Ending Soon" },
  { value: "most_raised", label: "Most Raised" },
  { value: "highest_roi", label: "Highest ROI" },
];

// ---------------------------------------------------------------------------
// Status / category / chain label maps
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Upcoming",
  REGISTRATION_OPEN: "Registration Open",
  GUARANTEED_ALLOCATION: "Active",
  FCFS: "FCFS",
  SETTLEMENT: "Settlement",
  DISTRIBUTING: "Distributing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const CATEGORY_LABELS: Record<string, string> = {
  DEFI: "DeFi",
  GAMING: "Gaming",
  AI: "AI",
  INFRASTRUCTURE: "Infra",
  NFT: "NFT",
  SOCIAL: "Social",
  OTHER: "Other",
};

const CHAIN_LABELS: Record<string, string> = {
  ETHEREUM: "Ethereum",
  BASE: "Base",
  ARBITRUM: "Arbitrum",
};

// ---------------------------------------------------------------------------
// Map front-end sort to API sort params
// ---------------------------------------------------------------------------

function getSortParams(sortBy: string): { sortBy: string; sortOrder: string } {
  switch (sortBy) {
    case "ending_soon":
      return { sortBy: "contributionOpenAt", sortOrder: "asc" };
    case "most_raised":
      return { sortBy: "totalRaised", sortOrder: "desc" };
    case "highest_roi":
      return { sortBy: "hardCap", sortOrder: "desc" };
    case "newest":
    default:
      return { sortBy: "createdAt", sortOrder: "desc" };
  }
}

// ---------------------------------------------------------------------------
// Helper: check if user has a session cookie (client-side)
// ---------------------------------------------------------------------------

function useHasSession(): boolean {
  const [hasSession, setHasSession] = React.useState(false);

  React.useEffect(() => {
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const sessionCookie = cookies.find((c) =>
      c.startsWith("exposure_session=")
    );
    setHasSession(!!sessionCookie);
  }, []);

  return hasSession;
}

// ---------------------------------------------------------------------------
// Deal type (inline, same shape as DealCardDeal)
// ---------------------------------------------------------------------------

interface Deal {
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
  fdv: string | null;
  contributorCount: number;
  allocationMethod: string;
  minTierRequired: string | null;
  registrationOpenAt: string | null;
  contributionOpenAt: string | null;
  contributionCloseAt: string | null;
  featuredImageUrl: string | null;
  isFeatured: boolean;
}

// ---------------------------------------------------------------------------
// Compact countdown
// ---------------------------------------------------------------------------

function CompactCountdown({ targetDate }: { targetDate: string }) {
  const target = React.useMemo(() => new Date(targetDate), [targetDate]);
  const [label, setLabel] = React.useState(() => calcLabel(target));

  React.useEffect(() => {
    const timer = setInterval(() => setLabel(calcLabel(target)), 1000);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <span className="font-mono text-xs font-normal text-zinc-500">{label}</span>
  );
}

function calcLabel(target: Date): string {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  const s = Math.floor((diff / 1000) % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m`;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function getCountdownTarget(deal: Deal): string | null {
  if (
    deal.status === "REGISTRATION_OPEN" ||
    deal.status === "GUARANTEED_ALLOCATION" ||
    deal.status === "FCFS"
  ) {
    return deal.contributionCloseAt;
  }
  if (deal.status === "APPROVED") {
    return deal.registrationOpenAt ?? deal.contributionOpenAt;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function DealCardSkeleton() {
  return (
    <div className="border border-zinc-200 p-8 animate-pulse">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-2 h-5 w-36 bg-zinc-200" />
          <div className="h-3 w-20 bg-zinc-200" />
        </div>
        <div className="h-5 w-20 bg-zinc-200" />
      </div>
      <div className="mb-6 h-4 w-full bg-zinc-200" />
      <div className="mb-6 h-4 w-3/4 bg-zinc-200" />
      <div className="mb-6">
        <div className="mb-2 h-1 w-full bg-zinc-200" />
        <div className="flex justify-between">
          <div className="h-3 w-20 bg-zinc-200" />
          <div className="h-3 w-16 bg-zinc-200" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-6 border-t border-zinc-200 pt-6">
        <div>
          <div className="mb-1 h-2.5 w-10 bg-zinc-200" />
          <div className="h-5 w-16 bg-zinc-200" />
        </div>
        <div>
          <div className="mb-1 h-2.5 w-10 bg-zinc-200" />
          <div className="h-5 w-16 bg-zinc-200" />
        </div>
        <div>
          <div className="mb-1 h-2.5 w-10 bg-zinc-200" />
          <div className="h-5 w-16 bg-zinc-200" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DealsPage() {
  const isAuthenticated = useHasSession();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");
  const [chainFilter, setChainFilter] = React.useState("ALL");
  const [sortBy, setSortBy] = React.useState("newest");
  const [currentPage, setCurrentPage] = React.useState(1);

  const perPage = 6;

  const [deals, setDeals] = React.useState<Deal[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch deals from API
  React.useEffect(() => {
    const controller = new AbortController();

    async function fetchDeals() {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("limit", String(perPage));

        if (statusFilter !== "ALL") {
          params.set("status", statusFilter);
        }
        if (categoryFilter !== "ALL") {
          params.set("category", categoryFilter);
        }
        if (chainFilter !== "ALL") {
          params.set("chain", chainFilter);
        }
        if (debouncedSearch) {
          params.set("search", debouncedSearch);
        }

        const sort = getSortParams(sortBy);
        params.set("sortBy", sort.sortBy);
        params.set("sortOrder", sort.sortOrder);

        const res = await fetch(`/api/deals?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch deals (${res.status})`);
        }

        const json = await res.json();

        if (!json.success) {
          throw new Error(json.error || "Failed to fetch deals");
        }

        const apiDeals: Deal[] = json.data.deals.map(
          (d: Record<string, unknown>) => ({
            id: d.id,
            title: d.title,
            slug: d.slug,
            shortDescription: d.shortDescription ?? null,
            projectName: d.projectName,
            category: d.category,
            status: d.status,
            chain: d.chain,
            tokenPrice: String(d.tokenPrice),
            totalRaise: String(d.totalRaise),
            totalRaised: String(d.totalRaised),
            hardCap: String(d.hardCap),
            fdv: d.fdv != null ? String(d.fdv) : null,
            contributorCount: d.contributorCount ?? 0,
            allocationMethod: d.allocationMethod,
            minTierRequired: d.minTierRequired ?? null,
            registrationOpenAt: d.registrationOpenAt ?? null,
            contributionOpenAt: d.contributionOpenAt ?? null,
            contributionCloseAt: d.contributionCloseAt ?? null,
            featuredImageUrl: d.featuredImageUrl ?? null,
            isFeatured: d.isFeatured ?? false,
          })
        );

        setDeals(apiDeals);
        setTotalPages(json.data.totalPages || 1);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDeals();
    return () => controller.abort();
  }, [
    currentPage,
    statusFilter,
    categoryFilter,
    chainFilter,
    sortBy,
    debouncedSearch,
  ]);

  return (
    <div className="min-h-screen bg-white">
      {/* ----------------------------------------------------------------- */}
      {/* Page header                                                       */}
      {/* ----------------------------------------------------------------- */}
      <div className="mx-auto max-w-6xl px-6 pt-20 pb-12">
        <h1 className="font-serif text-5xl font-light tracking-tight text-zinc-900">
          Deals
        </h1>
        <p className="mt-3 max-w-lg font-sans text-base font-light leading-relaxed text-zinc-500">
          Curated investment opportunities across DeFi, AI, gaming, and
          infrastructure. Browse freely, invest with confidence.
        </p>

        {/* Thin decorative rule */}
        <div className="mt-8 h-px w-full bg-zinc-200" />
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Verification banner                                                */}
      {/* ----------------------------------------------------------------- */}
      {!isAuthenticated && (
        <div className="mx-auto max-w-6xl px-6 pb-10">
          <div className="flex flex-col items-start gap-6 border border-zinc-200 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Shield className="h-4 w-4 shrink-0 text-zinc-500" />
              <div>
                <p className="text-sm font-medium text-zinc-700">
                  Sign up and complete verification to invest
                </p>
                <p className="mt-0.5 text-xs font-light text-zinc-500">
                  Browse deals freely. To participate, complete KYC verification
                  through our quick onboarding process.
                </p>
              </div>
            </div>
            <Link href="/onboarding" className="shrink-0">
              <Button
                variant="outline"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Get Verified
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Filter bar                                                         */}
      {/* ----------------------------------------------------------------- */}
      <div className="mx-auto max-w-6xl px-6 pb-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search deals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full border border-zinc-200 bg-transparent pl-10 pr-4 font-sans text-sm font-light text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-300"
            />
          </div>

          {/* Inline filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 border border-zinc-200 bg-white px-3 pr-8 font-sans text-xs font-light text-zinc-500 outline-none transition-colors hover:border-zinc-300 focus:border-zinc-300"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 border border-zinc-200 bg-white px-3 pr-8 font-sans text-xs font-light text-zinc-500 outline-none transition-colors hover:border-zinc-300 focus:border-zinc-300"
            >
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              value={chainFilter}
              onChange={(e) => {
                setChainFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 border border-zinc-200 bg-white px-3 pr-8 font-sans text-xs font-light text-zinc-500 outline-none transition-colors hover:border-zinc-300 focus:border-zinc-300"
            >
              {CHAIN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 border border-zinc-200 bg-white px-3 pr-8 font-sans text-xs font-light text-zinc-500 outline-none transition-colors hover:border-zinc-300 focus:border-zinc-300"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Error state                                                        */}
      {/* ----------------------------------------------------------------- */}
      {error && (
        <div className="mx-auto max-w-6xl px-6 pb-12">
          <div className="border border-zinc-200 p-8">
            <p className="font-sans text-sm font-light text-zinc-500">
              {error}
            </p>
            <button
              onClick={() => setCurrentPage(currentPage)}
              className="mt-3 font-sans text-xs font-normal text-zinc-500 underline underline-offset-4 transition-colors hover:text-zinc-600"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Loading skeletons                                                  */}
      {/* ----------------------------------------------------------------- */}
      {isLoading && (
        <div className="mx-auto max-w-6xl px-6 pb-16">
          <div className="grid gap-px border border-zinc-200 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: perPage }).map((_, i) => (
              <DealCardSkeleton key={i} />
            ))}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Deal cards grid                                                    */}
      {/* ----------------------------------------------------------------- */}
      {!isLoading && !error && deals.length > 0 && (
        <div className="mx-auto max-w-6xl px-6 pb-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3">
            {deals.map((deal) => (
              <DealCardInline key={deal.id} deal={deal} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-16 flex items-center justify-center gap-3">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="flex h-10 items-center gap-2 border border-zinc-200 px-4 font-sans text-xs font-light text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-600 disabled:opacity-30 disabled:hover:border-zinc-200"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`flex h-10 w-10 items-center justify-center font-sans text-xs font-light transition-colors ${
                        page === currentPage
                          ? "border border-zinc-900 text-zinc-900"
                          : "text-zinc-400 hover:text-zinc-600"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="flex h-10 items-center gap-2 border border-zinc-200 px-4 font-sans text-xs font-light text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-600 disabled:opacity-30 disabled:hover:border-zinc-200"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Empty state                                                        */}
      {/* ----------------------------------------------------------------- */}
      {!isLoading && !error && deals.length === 0 && (
        <div className="mx-auto max-w-6xl px-6 pb-24">
          <div className="flex flex-col items-center justify-center border border-dashed border-zinc-200 px-8 py-24 text-center">
            <Briefcase className="mb-6 h-8 w-8 text-zinc-300" />
            <h3 className="font-serif text-xl font-light text-zinc-400">
              No deals found
            </h3>
            <p className="mt-2 max-w-xs font-sans text-sm font-light text-zinc-500">
              Try adjusting your filters or search query to find what you are
              looking for.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setCategoryFilter("ALL");
                setChainFilter("ALL");
                setCurrentPage(1);
              }}
              className="mt-8 border border-zinc-200 px-6 py-2.5 font-sans text-xs font-light text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline Deal Card
// ---------------------------------------------------------------------------

function DealCardInline({ deal }: { deal: Deal }) {
  const raiseProgress =
    (parseFloat(deal.totalRaised) / parseFloat(deal.hardCap)) * 100;
  const countdownTarget = getCountdownTarget(deal);

  return (
    <Link
      href={`/deals/${deal.slug}`}
      className="group flex flex-col border border-zinc-200 p-8 transition-colors duration-200 hover:border-zinc-300"
    >
      {/* Header: name + status */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-sans text-base font-medium text-zinc-800 transition-colors group-hover:text-zinc-900">
            {deal.projectName}
          </h3>
          <p className="mt-1 text-xs font-light uppercase tracking-widest text-zinc-500">
            {CATEGORY_LABELS[deal.category] || deal.category}
            {" / "}
            {CHAIN_LABELS[deal.chain] || deal.chain}
          </p>
        </div>
        <span className="shrink-0 border border-zinc-200 px-2.5 py-1 text-[10px] font-light uppercase tracking-widest text-zinc-500 transition-colors group-hover:border-zinc-300">
          {STATUS_LABELS[deal.status] || deal.status}
        </span>
      </div>

      {/* Description */}
      {deal.shortDescription && (
        <p className="mb-6 line-clamp-2 font-sans text-sm font-light leading-relaxed text-zinc-500">
          {deal.shortDescription}
        </p>
      )}

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-1 w-full bg-zinc-200">
          <div
            className="h-full bg-zinc-400 transition-all"
            style={{ width: `${Math.min(raiseProgress, 100)}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-sans text-xs font-light text-zinc-500">
            {formatCurrency(deal.totalRaised)} raised
          </span>
          <span className="font-sans text-xs font-light text-zinc-400">
            {formatCurrency(deal.hardCap)}
          </span>
        </div>
      </div>

      {/* Key metrics */}
      <div className="mb-6 grid grid-cols-3 gap-6 border-t border-zinc-200 pt-6">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-light uppercase tracking-widest text-zinc-400">
            Price
          </span>
          <span className="font-serif text-sm font-normal text-zinc-600">
            {formatCurrency(deal.tokenPrice)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-light uppercase tracking-widest text-zinc-400">
            Raise
          </span>
          <span className="font-serif text-sm font-normal text-zinc-600">
            ${formatLargeNumber(deal.totalRaise)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-light uppercase tracking-widest text-zinc-400">
            FDV
          </span>
          <span className="font-serif text-sm font-normal text-zinc-600">
            {deal.fdv ? `$${formatLargeNumber(deal.fdv)}` : "--"}
          </span>
        </div>
      </div>

      {/* Footer: contributors + countdown */}
      <div className="mt-auto flex items-center justify-between border-t border-zinc-200 pt-6">
        <div className="flex items-center gap-1.5">
          <Users className="h-3 w-3 text-zinc-400" />
          <span className="font-sans text-xs font-light text-zinc-500">
            {deal.contributorCount.toLocaleString()}
          </span>
        </div>
        {countdownTarget ? (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-zinc-400" />
            <CompactCountdown targetDate={countdownTarget} />
          </div>
        ) : (
          <span className="font-sans text-xs font-light text-zinc-400">
            {deal.status === "COMPLETED" ? "Ended" : "TBA"}
          </span>
        )}
      </div>
    </Link>
  );
}
