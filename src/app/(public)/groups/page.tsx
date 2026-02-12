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
// Placeholder groups
// ---------------------------------------------------------------------------

interface GroupCardData {
  id: string;
  name: string;
  slug: string;
  description: string;
  leadName: string;
  leadWallet: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  memberCount: number;
  maxMembers: number;
  dealCount: number;
  totalRaised: string;
  minTierRequired: string | null;
  carryPercent: string;
  status: "ACTIVE" | "PENDING_APPROVAL" | "CLOSED";
  isPublic: boolean;
  category: string;
}

const PLACEHOLDER_GROUPS: GroupCardData[] = [
  {
    id: "1",
    name: "Apex Capital",
    slug: "apex-capital",
    description:
      "Premier crypto VC syndicate focused on seed and Series A investments in DeFi infrastructure. Led by former a16z partner with $500M+ deployed across 40+ portfolio companies.",
    leadName: "Marcus Reynolds",
    leadWallet: "0x7a3B...9f4E",
    avatarUrl: null,
    bannerUrl: null,
    memberCount: 72,
    maxMembers: 100,
    dealCount: 14,
    totalRaised: "28500000",
    minTierRequired: "GOLD",
    carryPercent: "20",
    status: "ACTIVE",
    isPublic: true,
    category: "VC",
  },
  {
    id: "2",
    name: "DeFi Collective",
    slug: "defi-collective",
    description:
      "Community-driven investment group specializing in DeFi protocols, liquid staking, and yield infrastructure. Rigorous due diligence with 3x average return on investments.",
    leadName: "Elena Vasquez",
    leadWallet: "0x4c2D...8bA1",
    avatarUrl: null,
    bannerUrl: null,
    memberCount: 156,
    maxMembers: 200,
    dealCount: 22,
    totalRaised: "15200000",
    minTierRequired: "SILVER",
    carryPercent: "15",
    status: "ACTIVE",
    isPublic: true,
    category: "DEFI",
  },
  {
    id: "3",
    name: "Neural Ventures",
    slug: "neural-ventures",
    description:
      "AI and machine learning focused investment syndicate. Backing the convergence of AI and blockchain with investments in decentralized compute, inference networks, and AI agents.",
    leadName: "David Chen",
    leadWallet: "0x9f1E...3cD7",
    avatarUrl: null,
    bannerUrl: null,
    memberCount: 45,
    maxMembers: 50,
    dealCount: 8,
    totalRaised: "12800000",
    minTierRequired: "PLATINUM",
    carryPercent: "25",
    status: "ACTIVE",
    isPublic: true,
    category: "AI",
  },
  {
    id: "4",
    name: "GameFi Alliance",
    slug: "gamefi-alliance",
    description:
      "Gaming and metaverse investment group backed by industry veterans from EA, Riot, and Epic Games. Focus on fully on-chain games with sustainable token economies.",
    leadName: "Sophie Nakamura",
    leadWallet: "0x2bA8...6eF3",
    avatarUrl: null,
    bannerUrl: null,
    memberCount: 89,
    maxMembers: 150,
    dealCount: 11,
    totalRaised: "8900000",
    minTierRequired: null,
    carryPercent: "18",
    status: "ACTIVE",
    isPublic: true,
    category: "GAMING",
  },
  {
    id: "5",
    name: "Infra Maxi Club",
    slug: "infra-maxi-club",
    description:
      "Infrastructure-focused syndicate investing in L1s, L2s, bridges, oracles, and developer tooling. Long-term thesis-driven approach with 2-4 year investment horizons.",
    leadName: "Alex Thompson",
    leadWallet: "0x5dC9...2aB4",
    avatarUrl: null,
    bannerUrl: null,
    memberCount: 100,
    maxMembers: 100,
    dealCount: 19,
    totalRaised: "42000000",
    minTierRequired: "GOLD",
    carryPercent: "20",
    status: "ACTIVE",
    isPublic: true,
    category: "INFRA",
  },
  {
    id: "6",
    name: "Stealth Syndicate",
    slug: "stealth-syndicate",
    description:
      "Invite-only syndicate for accredited investors. Access to pre-seed deals, OTC opportunities, and exclusive token allocations not available on any launchpad.",
    leadName: "James Whitfield",
    leadWallet: "0x8eF2...1cA5",
    avatarUrl: null,
    bannerUrl: null,
    memberCount: 28,
    maxMembers: 30,
    dealCount: 6,
    totalRaised: "55000000",
    minTierRequired: "DIAMOND",
    carryPercent: "30",
    status: "ACTIVE",
    isPublic: true,
    category: "VC",
  },
];

// ---------------------------------------------------------------------------
// Tier badge helpers
// ---------------------------------------------------------------------------

const TIER_COLORS: Record<string, "warning" | "default" | "info" | "success" | "error"> = {
  BRONZE: "warning",
  SILVER: "outline" as any,
  GOLD: "warning",
  PLATINUM: "info",
  DIAMOND: "success",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function GroupsPage() {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [tierFilter, setTierFilter] = React.useState("ALL");
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");
  const [currentPage, setCurrentPage] = React.useState(1);

  const perPage = 6;

  // Filter
  const filtered = React.useMemo(() => {
    let result = [...PLACEHOLDER_GROUPS];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.leadName.toLowerCase().includes(q)
      );
    }

    if (statusFilter === "OPEN") {
      result = result.filter((g) => g.memberCount < g.maxMembers);
    } else if (statusFilter === "FULL") {
      result = result.filter((g) => g.memberCount >= g.maxMembers);
    }

    if (tierFilter !== "ALL") {
      const tierOrder = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"];
      const minIdx = tierOrder.indexOf(tierFilter);
      result = result.filter((g) => {
        if (!g.minTierRequired) return true;
        return tierOrder.indexOf(g.minTierRequired) >= minIdx;
      });
    }

    if (categoryFilter !== "ALL") {
      result = result.filter((g) => g.category === categoryFilter);
    }

    return result;
  }, [search, statusFilter, tierFilter, categoryFilter]);

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
        <h1 className="text-4xl font-bold text-zinc-50">Investment Groups</h1>
        <p className="mt-2 text-zinc-400">
          Join private groups led by verified VCs and syndicates
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-8 flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <Input
            placeholder="Search groups or leads..."
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

      {/* Results */}
      {paginated.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((group) => (
              <GroupCard key={group.id} group={group} />
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

function GroupCard({ group }: { group: GroupCardData }) {
  const isFull = group.memberCount >= group.maxMembers;
  const fillPercent = (group.memberCount / group.maxMembers) * 100;

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
            <span className="text-zinc-400">{group.leadName}</span>
            <span className="ml-1 text-zinc-600">{group.leadWallet}</span>
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
          <Link href={`/groups/${group.slug}`}>
            <Button
              className="w-full"
              variant={isFull ? "outline" : "default"}
              size="sm"
            >
              {isFull ? "View Group" : "Apply to Join"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
