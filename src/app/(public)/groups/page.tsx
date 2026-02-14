"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  ArrowRight,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatLargeNumber } from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Groups" },
  { value: "OPEN", label: "Open to Join" },
  { value: "FULL", label: "Full" },
];

const TIER_OPTIONS = [
  { value: "ALL", label: "Any Tier" },
  { value: "BRONZE", label: "Bronze+" },
  { value: "SILVER", label: "Silver+" },
  { value: "GOLD", label: "Gold+" },
  { value: "PLATINUM", label: "Platinum+" },
  { value: "DIAMOND", label: "Diamond" },
];

const CATEGORY_OPTIONS = [
  { value: "ALL", label: "All Categories" },
  { value: "VC", label: "VC Syndicates" },
  { value: "DEFI", label: "DeFi Focus" },
  { value: "AI", label: "AI / Deep Tech" },
  { value: "GAMING", label: "Gaming / NFT" },
  { value: "INFRA", label: "Infrastructure" },
];

// ---------------------------------------------------------------------------
// Types for the API response
// ---------------------------------------------------------------------------

interface GroupData {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  memberCount: number;
  maxMembers: number;
  dealCount: number;
  totalRaised: string;
  minTierRequired: string | null;
  carryPercent: string;
  status: string;
  isPublic: boolean;
  lead: {
    id: string;
    walletAddress: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  _count: {
    members: number;
  };
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
// Loading skeleton
// ---------------------------------------------------------------------------

function GroupCardSkeleton() {
  return (
    <div className="border border-zinc-200 p-8 animate-pulse">
      <div className="mb-6">
        <div className="mb-2 h-5 w-36 bg-zinc-200" />
        <div className="h-3 w-48 bg-zinc-200" />
      </div>
      <div className="mb-6 h-4 w-full bg-zinc-200" />
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="h-4 w-20 bg-zinc-200" />
        <div className="h-4 w-20 bg-zinc-200" />
        <div className="h-4 w-20 bg-zinc-200" />
        <div className="h-4 w-20 bg-zinc-200" />
      </div>
      <div className="mb-6 h-1 w-full bg-zinc-200" />
      <div className="h-10 w-full bg-zinc-200" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function GroupsPage() {
  const isAuthenticated = useHasSession();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [tierFilter, setTierFilter] = React.useState("ALL");
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");
  const [currentPage, setCurrentPage] = React.useState(1);

  const perPage = 6;

  const [groups, setGroups] = React.useState<GroupData[]>([]);
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

  // Fetch groups from API
  React.useEffect(() => {
    const controller = new AbortController();

    async function fetchGroups() {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("limit", String(perPage));

        if (statusFilter === "OPEN" || statusFilter === "FULL") {
          params.set("status", "ACTIVE");
        }

        if (debouncedSearch) {
          params.set("search", debouncedSearch);
        }

        params.set("isPublic", "true");

        const res = await fetch(`/api/groups?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch groups (${res.status})`);
        }

        const json = await res.json();

        if (!json.success) {
          throw new Error(json.error || "Failed to fetch groups");
        }

        let apiGroups: GroupData[] = json.data.groups;

        if (statusFilter === "OPEN") {
          apiGroups = apiGroups.filter((g) => g.memberCount < g.maxMembers);
        } else if (statusFilter === "FULL") {
          apiGroups = apiGroups.filter((g) => g.memberCount >= g.maxMembers);
        }

        if (tierFilter !== "ALL") {
          const tierOrder = [
            "BRONZE",
            "SILVER",
            "GOLD",
            "PLATINUM",
            "DIAMOND",
          ];
          const minIdx = tierOrder.indexOf(tierFilter);
          apiGroups = apiGroups.filter((g) => {
            if (!g.minTierRequired) return true;
            return tierOrder.indexOf(g.minTierRequired) >= minIdx;
          });
        }

        setGroups(apiGroups);
        setTotalPages(json.data.totalPages || 1);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchGroups();
    return () => controller.abort();
  }, [
    currentPage,
    statusFilter,
    tierFilter,
    categoryFilter,
    debouncedSearch,
  ]);

  return (
    <div className="min-h-screen bg-white">
      {/* ----------------------------------------------------------------- */}
      {/* Page header                                                       */}
      {/* ----------------------------------------------------------------- */}
      <div className="mx-auto max-w-6xl px-6 pt-20 pb-12">
        <h1 className="font-serif text-5xl font-light tracking-tight text-zinc-900">
          Investment Groups
        </h1>
        <p className="mt-3 max-w-lg font-sans text-base font-normal leading-relaxed text-zinc-500">
          Join private groups led by verified VCs and syndicates. Pool capital,
          access exclusive deal flow.
        </p>

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
                  Sign up and complete verification to join groups
                </p>
                <p className="mt-0.5 text-xs font-normal text-zinc-500">
                  Browse groups freely. To apply and invest, complete KYC
                  verification through our quick onboarding process.
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
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search groups or leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full border border-zinc-200 bg-transparent pl-10 pr-4 font-sans text-sm font-normal text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-300"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 border border-zinc-200 bg-white px-3 pr-8 font-sans text-xs font-normal text-zinc-500 outline-none transition-colors hover:border-zinc-300 focus:border-zinc-300"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 border border-zinc-200 bg-white px-3 pr-8 font-sans text-xs font-normal text-zinc-500 outline-none transition-colors hover:border-zinc-300 focus:border-zinc-300"
            >
              {TIER_OPTIONS.map((o) => (
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
              className="h-10 border border-zinc-200 bg-white px-3 pr-8 font-sans text-xs font-normal text-zinc-500 outline-none transition-colors hover:border-zinc-300 focus:border-zinc-300"
            >
              {CATEGORY_OPTIONS.map((o) => (
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
            <p className="font-sans text-sm font-normal text-zinc-500">
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
              <GroupCardSkeleton key={i} />
            ))}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Group cards grid                                                   */}
      {/* ----------------------------------------------------------------- */}
      {!isLoading && !error && groups.length > 0 && (
        <div className="mx-auto max-w-6xl px-6 pb-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <GroupCardInline
                key={group.id}
                group={group}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-16 flex items-center justify-center gap-3">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="flex h-10 items-center gap-2 border border-zinc-200 px-4 font-sans text-xs font-normal text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700 disabled:opacity-30 disabled:hover:border-zinc-200"
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
                      className={`flex h-10 w-10 items-center justify-center font-sans text-xs font-normal transition-colors ${
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
                className="flex h-10 items-center gap-2 border border-zinc-200 px-4 font-sans text-xs font-normal text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700 disabled:opacity-30 disabled:hover:border-zinc-200"
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
      {!isLoading && !error && groups.length === 0 && (
        <div className="mx-auto max-w-6xl px-6 pb-24">
          <div className="flex flex-col items-center justify-center border border-dashed border-zinc-200 px-8 py-24 text-center">
            <Users className="mb-6 h-8 w-8 text-zinc-300" />
            <h3 className="font-serif text-xl font-light text-zinc-600">
              No groups found
            </h3>
            <p className="mt-2 max-w-xs font-sans text-sm font-normal text-zinc-500">
              Try adjusting your filters or search query to find what you are
              looking for.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setTierFilter("ALL");
                setCategoryFilter("ALL");
                setCurrentPage(1);
              }}
              className="mt-8 border border-zinc-200 px-6 py-2.5 font-sans text-xs font-normal text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700"
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
// Inline Group Card
// ---------------------------------------------------------------------------

function GroupCardInline({
  group,
  isAuthenticated,
}: {
  group: GroupData;
  isAuthenticated: boolean;
}) {
  const isFull = group.memberCount >= group.maxMembers;
  const fillPercent = (group.memberCount / group.maxMembers) * 100;
  const leadName = group.lead?.displayName || "Anonymous";
  const leadWallet = group.lead?.walletAddress
    ? `${group.lead.walletAddress.slice(0, 6)}...${group.lead.walletAddress.slice(-4)}`
    : "";

  return (
    <div className="group flex flex-col border border-zinc-200 p-8 transition-colors duration-200 hover:border-zinc-300">
      {/* Name + Lead */}
      <div className="mb-4">
        <h3 className="font-sans text-base font-medium text-zinc-800">
          {group.name}
        </h3>
        <p className="mt-1 text-xs font-normal text-zinc-500">
          Led by{" "}
          <span className="text-zinc-500">{leadName}</span>
          {leadWallet && (
            <span className="ml-1 text-zinc-400">{leadWallet}</span>
          )}
        </p>
      </div>

      {/* Description */}
      <p className="mb-6 line-clamp-2 font-sans text-sm font-normal leading-relaxed text-zinc-500">
        {group.description}
      </p>

      {/* Stats grid */}
      <div className="mb-6 grid grid-cols-2 gap-4 border-t border-zinc-200 pt-6">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
            Members
          </span>
          <span className="font-serif text-sm font-normal text-zinc-700">
            {group.memberCount}
            <span className="text-zinc-400">/{group.maxMembers}</span>
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
            Deals
          </span>
          <span className="font-serif text-sm font-normal text-zinc-700">
            {group.dealCount}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
            Raised
          </span>
          <span className="font-serif text-sm font-normal text-zinc-700">
            ${formatLargeNumber(group.totalRaised)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
            Carry
          </span>
          <span className="font-serif text-sm font-normal text-zinc-700">
            {group.carryPercent}%
          </span>
        </div>
      </div>

      {/* Badges row */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {group.minTierRequired && (
          <span className="border border-zinc-200 px-2.5 py-1 text-[10px] font-normal uppercase tracking-widest text-zinc-500">
            {group.minTierRequired}+
          </span>
        )}
        {isFull && (
          <span className="border border-zinc-200 px-2.5 py-1 text-[10px] font-normal uppercase tracking-widest text-zinc-500">
            Full
          </span>
        )}
      </div>

      {/* Capacity bar */}
      <div className="mb-6">
        <div className="h-1 w-full bg-zinc-200">
          <div
            className="h-full bg-zinc-400 transition-all"
            style={{ width: `${Math.min(fillPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* CTA */}
      <div className="mt-auto">
        {!isAuthenticated ? (
          <Link href="/onboarding">
            <button className="flex w-full items-center justify-center gap-2 border border-zinc-200 py-3 font-sans text-xs font-normal text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700">
              <Shield className="h-3.5 w-3.5" />
              Verify to Join
            </button>
          </Link>
        ) : (
          <Link href={`/groups/${group.slug}`}>
            <button
              className={`w-full py-3 font-sans text-xs font-normal transition-colors ${
                isFull
                  ? "border border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-600"
                  : "bg-violet-500 text-white hover:bg-violet-400"
              }`}
            >
              {isFull ? "View Group" : "Apply to Join"}
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
