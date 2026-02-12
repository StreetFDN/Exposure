"use client";

import * as React from "react";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
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
// Placeholder deals
// ---------------------------------------------------------------------------

const PLACEHOLDER_DEALS: DealCardDeal[] = [
  {
    id: "1",
    title: "AetherFi Public Round",
    slug: "aetherfi-public-round",
    shortDescription:
      "Decentralized restaking protocol enabling permissionless liquid staking derivatives on Ethereum.",
    projectName: "AetherFi",
    category: "DEFI",
    status: "REGISTRATION_OPEN",
    chain: "ETHEREUM",
    tokenPrice: "0.045",
    totalRaise: "2000000",
    totalRaised: "1420000",
    hardCap: "2000000",
    fdv: "180000000",
    contributorCount: 1247,
    allocationMethod: "GUARANTEED",
    minTierRequired: "SILVER",
    registrationOpenAt: null,
    contributionOpenAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    contributionCloseAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    featuredImageUrl: null,
    isFeatured: true,
  },
  {
    id: "2",
    title: "Nexus AI Community Round",
    slug: "nexus-ai-community",
    shortDescription:
      "Decentralized AI inference network with verifiable compute and on-chain model governance.",
    projectName: "Nexus AI",
    category: "AI",
    status: "GUARANTEED_ALLOCATION",
    chain: "BASE",
    tokenPrice: "0.12",
    totalRaise: "5000000",
    totalRaised: "3800000",
    hardCap: "5000000",
    fdv: "500000000",
    contributorCount: 3891,
    allocationMethod: "HYBRID",
    minTierRequired: null,
    registrationOpenAt: null,
    contributionOpenAt: null,
    contributionCloseAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    featuredImageUrl: null,
    isFeatured: true,
  },
  {
    id: "3",
    title: "Voxelheim Seed Round",
    slug: "voxelheim-seed",
    shortDescription:
      "Fully on-chain open-world RPG with player-owned economies and cross-chain asset portability.",
    projectName: "Voxelheim",
    category: "GAMING",
    status: "APPROVED",
    chain: "ARBITRUM",
    tokenPrice: "0.008",
    totalRaise: "800000",
    totalRaised: "0",
    hardCap: "800000",
    fdv: "32000000",
    contributorCount: 0,
    allocationMethod: "LOTTERY",
    minTierRequired: "BRONZE",
    registrationOpenAt: new Date(Date.now() + 5 * 86400000).toISOString(),
    contributionOpenAt: new Date(Date.now() + 10 * 86400000).toISOString(),
    contributionCloseAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    featuredImageUrl: null,
    isFeatured: true,
  },
  {
    id: "4",
    title: "LayerBridge Strategic Sale",
    slug: "layerbridge-strategic",
    shortDescription:
      "Cross-chain messaging and bridging infrastructure with native security guarantees and MEV protection.",
    projectName: "LayerBridge",
    category: "INFRASTRUCTURE",
    status: "FCFS",
    chain: "ETHEREUM",
    tokenPrice: "0.28",
    totalRaise: "10000000",
    totalRaised: "8750000",
    hardCap: "10000000",
    fdv: "1200000000",
    contributorCount: 5102,
    allocationMethod: "FCFS",
    minTierRequired: "GOLD",
    registrationOpenAt: null,
    contributionOpenAt: null,
    contributionCloseAt: new Date(Date.now() + 1 * 86400000).toISOString(),
    featuredImageUrl: null,
    isFeatured: false,
  },
  {
    id: "5",
    title: "SynapseDAO Genesis Round",
    slug: "synapsedao-genesis",
    shortDescription:
      "AI-powered DAO toolkit for on-chain governance automation, proposal drafting, and treasury management.",
    projectName: "SynapseDAO",
    category: "AI",
    status: "COMPLETED",
    chain: "BASE",
    tokenPrice: "0.032",
    totalRaise: "1500000",
    totalRaised: "1500000",
    hardCap: "1500000",
    fdv: "64000000",
    contributorCount: 2134,
    allocationMethod: "PRO_RATA",
    minTierRequired: null,
    registrationOpenAt: null,
    contributionOpenAt: null,
    contributionCloseAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    featuredImageUrl: null,
    isFeatured: false,
  },
  {
    id: "6",
    title: "Chrono Social Round",
    slug: "chrono-social",
    shortDescription:
      "Decentralized social graph protocol with composable identity and cross-platform reputation scores.",
    projectName: "Chrono",
    category: "SOCIAL",
    status: "REGISTRATION_OPEN",
    chain: "ARBITRUM",
    tokenPrice: "0.015",
    totalRaise: "1200000",
    totalRaised: "340000",
    hardCap: "1200000",
    fdv: "75000000",
    contributorCount: 812,
    allocationMethod: "GUARANTEED",
    minTierRequired: "SILVER",
    registrationOpenAt: null,
    contributionOpenAt: new Date(Date.now() + 4 * 86400000).toISOString(),
    contributionCloseAt: new Date(Date.now() + 11 * 86400000).toISOString(),
    featuredImageUrl: null,
    isFeatured: false,
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DealsPage() {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");
  const [chainFilter, setChainFilter] = React.useState("ALL");
  const [sortBy, setSortBy] = React.useState("newest");
  const [currentPage, setCurrentPage] = React.useState(1);

  const perPage = 6;

  // Filter
  const filtered = React.useMemo(() => {
    let result = [...PLACEHOLDER_DEALS];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.projectName.toLowerCase().includes(q) ||
          d.title.toLowerCase().includes(q) ||
          d.shortDescription?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "ALL") {
      result = result.filter((d) => d.status === statusFilter);
    }

    if (categoryFilter !== "ALL") {
      result = result.filter((d) => d.category === categoryFilter);
    }

    if (chainFilter !== "ALL") {
      result = result.filter((d) => d.chain === chainFilter);
    }

    // Sort
    switch (sortBy) {
      case "ending_soon":
        result.sort((a, b) => {
          const aTime = a.contributionCloseAt
            ? new Date(a.contributionCloseAt).getTime()
            : Infinity;
          const bTime = b.contributionCloseAt
            ? new Date(b.contributionCloseAt).getTime()
            : Infinity;
          return aTime - bTime;
        });
        break;
      case "most_raised":
        result.sort(
          (a, b) => parseFloat(b.totalRaised) - parseFloat(a.totalRaised)
        );
        break;
      case "highest_roi":
        result.sort(
          (a, b) =>
            parseFloat(b.fdv ?? "0") / parseFloat(b.totalRaise || "1") -
            parseFloat(a.fdv ?? "0") / parseFloat(a.totalRaise || "1")
        );
        break;
      case "newest":
      default:
        // Keep original order (already sorted by newest)
        break;
    }

    return result;
  }, [search, statusFilter, categoryFilter, chainFilter, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-zinc-50">Deals</h1>
        <p className="mt-2 text-zinc-400">
          Explore curated crypto investment opportunities
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-8 flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
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

      {/* Results */}
      {paginated.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((deal) => (
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
      ) : (
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
