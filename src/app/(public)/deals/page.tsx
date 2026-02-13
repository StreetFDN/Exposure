"use client";

import * as React from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Shield, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DealCard } from "@/components/deals/deal-card";
import type { DealCardDeal } from "@/components/deals/deal-card";

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
    // Check for the session cookie on the client
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const sessionCookie = cookies.find((c) =>
      c.startsWith("exposure_session=")
    );
    setHasSession(!!sessionCookie);
  }, []);

  return hasSession;
}

// ---------------------------------------------------------------------------
// Loading skeleton for deal cards
// ---------------------------------------------------------------------------

function DealCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-900/40 animate-pulse">
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <div className="h-5 w-32 rounded bg-zinc-800" />
            <div className="h-3 w-20 rounded bg-zinc-800" />
          </div>
          <div className="h-5 w-20 rounded bg-zinc-800" />
        </div>
        <div className="h-4 w-full rounded bg-zinc-800" />
        <div className="h-4 w-3/4 rounded bg-zinc-800" />
        <div className="flex flex-col gap-1.5">
          <div className="h-1 rounded-full bg-zinc-800" />
          <div className="flex justify-between">
            <div className="h-3 w-20 rounded bg-zinc-800" />
            <div className="h-3 w-16 rounded bg-zinc-800" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 border-t border-zinc-800/40 pt-3">
          <div className="flex flex-col gap-1">
            <div className="h-2.5 w-10 rounded bg-zinc-800" />
            <div className="h-4 w-14 rounded bg-zinc-800" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="h-2.5 w-10 rounded bg-zinc-800" />
            <div className="h-4 w-14 rounded bg-zinc-800" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="h-2.5 w-10 rounded bg-zinc-800" />
            <div className="h-4 w-14 rounded bg-zinc-800" />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-zinc-800/40 pt-3">
          <div className="h-3 w-16 rounded bg-zinc-800" />
          <div className="h-3 w-20 rounded bg-zinc-800" />
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

  // API data state
  const [deals, setDeals] = React.useState<DealCardDeal[]>([]);
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

        // Map API response to DealCardDeal shape
        const apiDeals = json.data.deals.map((d: Record<string, unknown>) => ({
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
        })) as DealCardDeal[];

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
  }, [currentPage, statusFilter, categoryFilter, chainFilter, sortBy, debouncedSearch]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-serif text-4xl font-light text-zinc-100">Deals</h1>
        <p className="mt-2 font-light text-zinc-500">
          Explore curated investment opportunities
        </p>
      </div>

      {/* Verification banner for non-authenticated users */}
      {!isAuthenticated && (
        <div className="mb-8 flex flex-col items-start gap-4 rounded-xl border border-zinc-800/40 bg-zinc-900/30 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 shrink-0 text-zinc-500" />
            <div>
              <p className="text-sm font-medium text-zinc-200">
                Sign up and complete verification to invest
              </p>
              <p className="text-xs font-light text-zinc-500">
                Browse deals freely. To participate, complete KYC verification through our quick onboarding process.
              </p>
            </div>
          </div>
          <Link href="/onboarding" className="shrink-0">
            <button className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-600 hover:text-zinc-100">
              Get Verified
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </Link>
        </div>
      )}

      {/* Filter bar */}
      <div className="mb-8 flex flex-col gap-3 rounded-xl border border-zinc-800/40 bg-zinc-900/30 p-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            leftAddon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:flex">
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          />
          <Select
            options={CATEGORY_OPTIONS}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
          />
          <Select
            options={CHAIN_OPTIONS}
            value={chainFilter}
            onChange={(e) => {
              setChainFilter(e.target.value);
              setCurrentPage(1);
            }}
          />
          <Select
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-8 rounded-xl border border-red-900/50 bg-red-950/20 p-5">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => setCurrentPage(currentPage)}
            className="mt-2 text-sm text-red-300 underline hover:text-red-200"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: perPage }).map((_, i) => (
            <DealCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Results */}
      {!isLoading && !error && deals.length > 0 && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                leftIcon={<ChevronLeft className="h-4 w-4" />}
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-light transition-colors ${
                        page === currentPage
                          ? "bg-zinc-800 text-zinc-50"
                          : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                rightIcon={<ChevronRight className="h-4 w-4" />}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!isLoading && !error && deals.length === 0 && (
        <EmptyState
          icon={<SlidersHorizontal className="h-6 w-6" />}
          title="No deals found"
          description="Try adjusting your filters or search query to find what you're looking for."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setCategoryFilter("ALL");
                setChainFilter("ALL");
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          }
        />
      )}
    </div>
  );
}
