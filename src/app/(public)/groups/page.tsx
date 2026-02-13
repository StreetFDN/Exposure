"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  Users,
  TrendingUp,
  DollarSign,
  Crown,
  Shield,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
// Tier badge helpers
// ---------------------------------------------------------------------------

const TIER_COLORS: Record<string, "warning" | "default" | "info" | "success" | "error" | "outline"> = {
  BRONZE: "warning",
  SILVER: "outline",
  GOLD: "warning",
  PLATINUM: "info",
  DIAMOND: "success",
};

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
// Loading skeleton for group cards
// ---------------------------------------------------------------------------

function GroupCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 animate-pulse">
      <div className="relative h-24 bg-zinc-800" />
      <div className="flex flex-1 flex-col p-4 pt-8">
        <div className="mb-2">
          <div className="h-5 w-32 rounded bg-zinc-800" />
          <div className="mt-1 h-3 w-40 rounded bg-zinc-800" />
        </div>
        <div className="mb-4 h-4 w-full rounded bg-zinc-800" />
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="h-4 w-20 rounded bg-zinc-800" />
          <div className="h-4 w-20 rounded bg-zinc-800" />
          <div className="h-4 w-20 rounded bg-zinc-800" />
          <div className="h-4 w-20 rounded bg-zinc-800" />
        </div>
        <div className="mb-4 h-2 w-full rounded-full bg-zinc-800" />
        <div className="mt-auto h-8 w-full rounded bg-zinc-800" />
      </div>
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

  // API data state
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

        // The API supports status and search filters
        if (statusFilter === "OPEN" || statusFilter === "FULL") {
          // The API filters by group status (ACTIVE, PENDING_APPROVAL, etc.)
          // For "open/full" we send status=ACTIVE and do client-side capacity filtering
          params.set("status", "ACTIVE");
        }

        if (debouncedSearch) {
          params.set("search", debouncedSearch);
        }

        // Only show public groups
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

        // Client-side filtering for status (open/full) and tier/category
        // since the API doesn't support all these filters natively
        if (statusFilter === "OPEN") {
          apiGroups = apiGroups.filter((g) => g.memberCount < g.maxMembers);
        } else if (statusFilter === "FULL") {
          apiGroups = apiGroups.filter((g) => g.memberCount >= g.maxMembers);
        }

        if (tierFilter !== "ALL") {
          const tierOrder = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"];
          const minIdx = tierOrder.indexOf(tierFilter);
          apiGroups = apiGroups.filter((g) => {
            if (!g.minTierRequired) return true;
            return tierOrder.indexOf(g.minTierRequired) >= minIdx;
          });
        }

        // Note: category is not a native field on InvestmentGroup in the schema,
        // so we skip category filtering against the API response

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
  }, [currentPage, statusFilter, tierFilter, categoryFilter, debouncedSearch]);

  // Client-side pagination for filtered results
  const paginatedGroups = groups;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-zinc-50">Investment Groups</h1>
        <p className="mt-2 text-zinc-400">
          Join private groups led by verified VCs and syndicates
        </p>
      </div>

      {/* Verification banner for non-authenticated users */}
      {!isAuthenticated && (
        <div className="mb-8 flex flex-col items-start gap-4 rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
              <Shield className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-50">
                Sign up and complete verification to join groups
              </p>
              <p className="text-xs text-zinc-400">
                Browse groups freely. To apply and invest, complete KYC verification through our quick onboarding process.
              </p>
            </div>
          </div>
          <Link href="/onboarding" className="shrink-0">
            <Button size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Get Verified
            </Button>
          </Link>
        </div>
      )}

      {/* Filter bar */}
      <div className="mb-8 flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <Input
            placeholder="Search groups or leads..."
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
            options={TIER_OPTIONS}
            value={tierFilter}
            onChange={(e) => {
              setTierFilter(e.target.value);
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
            <GroupCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Results */}
      {!isLoading && !error && paginatedGroups.length > 0 && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedGroups.map((group) => (
              <GroupCard key={group.id} group={group} isAuthenticated={isAuthenticated} />
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
                      className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                        page === currentPage
                          ? "bg-violet-600 text-white"
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
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
      {!isLoading && !error && paginatedGroups.length === 0 && (
        <EmptyState
          icon={<SlidersHorizontal className="h-6 w-6" />}
          title="No groups found"
          description="Try adjusting your filters or search query to find what you're looking for."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setTierFilter("ALL");
                setCategoryFilter("ALL");
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

// ---------------------------------------------------------------------------
// GroupCard
// ---------------------------------------------------------------------------

function GroupCard({ group, isAuthenticated = false }: { group: GroupData; isAuthenticated?: boolean }) {
  const isFull = group.memberCount >= group.maxMembers;
  const fillPercent = (group.memberCount / group.maxMembers) * 100;

  // Use the lead's display name or wallet address as the lead name
  const leadName = group.lead?.displayName || "Anonymous";
  const leadWallet = group.lead?.walletAddress
    ? `${group.lead.walletAddress.slice(0, 6)}...${group.lead.walletAddress.slice(-4)}`
    : "";

  return (
    <Card className="flex flex-col overflow-hidden transition-colors hover:border-zinc-700">
      {/* Banner */}
      <div className="relative h-24 bg-gradient-to-br from-violet-600/30 to-fuchsia-600/20">
        {/* Avatar overlapping banner */}
        <div className="absolute -bottom-5 left-4">
          <Avatar
            alt={group.name}
            src={group.avatarUrl}
            size="lg"
            ring
          />
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col pt-8">
        {/* Name + Lead */}
        <div className="mb-2">
          <h3 className="text-base font-semibold text-zinc-50">
            {group.name}
          </h3>
          <p className="text-xs text-zinc-500">
            Led by{" "}
            <span className="text-zinc-400">{leadName}</span>
            {leadWallet && (
              <span className="ml-1 text-zinc-600">{leadWallet}</span>
            )}
          </p>
        </div>

        {/* Description */}
        <p className="mb-4 line-clamp-2 text-sm text-zinc-400">
          {group.description}
        </p>

        {/* Stats grid */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-zinc-300">
              {group.memberCount}
              <span className="text-zinc-600">/{group.maxMembers}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <TrendingUp className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-zinc-300">{group.dealCount} deals</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <DollarSign className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-zinc-300">
              ${formatLargeNumber(group.totalRaised)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Crown className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-zinc-300">{group.carryPercent}% carry</span>
          </div>
        </div>

        {/* Badges */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {group.minTierRequired && (
            <Badge
              variant={TIER_COLORS[group.minTierRequired] || "outline"}
              size="sm"
            >
              <Shield className="mr-1 h-3 w-3" />
              {group.minTierRequired}+
            </Badge>
          )}
          {isFull && (
            <Badge variant="outline" size="sm">
              Full
            </Badge>
          )}
        </div>

        {/* Member capacity bar */}
        <div className="mb-4">
          <Progress value={fillPercent} color={isFull ? "warning" : "default"} />
        </div>

        {/* CTA */}
        <div className="mt-auto">
          {!isAuthenticated ? (
            <Link href="/onboarding">
              <Button
                className="w-full"
                variant="outline"
                size="sm"
              >
                <Shield className="mr-1.5 h-3.5 w-3.5" />
                Verify to Join
              </Button>
            </Link>
          ) : (
            <Link href={`/groups/${group.slug}`}>
              <Button
                className="w-full"
                variant={isFull ? "outline" : "default"}
                size="sm"
              >
                {isFull ? "View Group" : "Apply to Join"}
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
