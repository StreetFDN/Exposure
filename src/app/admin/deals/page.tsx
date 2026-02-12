"use client";

import { useState } from "react";
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
import { DataTable } from "@/components/ui/data-table";
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
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface Deal {
  id: string;
  name: string;
  slug: string;
  status: "Draft" | "Registration" | "Live" | "Completed" | "Paused" | "Cancelled";
  category: string;
  chain: string;
  raised: number;
  target: number;
  contributors: number;
  created: string;
  phases: { name: string; status: "completed" | "active" | "upcoming" }[];
  recentContributions: { wallet: string; amount: number; date: string }[];
}

/* -------------------------------------------------------------------------- */
/*  Placeholder data                                                          */
/* -------------------------------------------------------------------------- */

const deals: Deal[] = [
  {
    id: "1",
    name: "Nexus Protocol",
    slug: "nexus-protocol",
    status: "Live",
    category: "DeFi",
    chain: "Ethereum",
    raised: 2_450_000,
    target: 3_000_000,
    contributors: 1_284,
    created: "2026-01-15",
    phases: [
      { name: "Registration", status: "completed" },
      { name: "Contribution", status: "active" },
      { name: "Distribution", status: "upcoming" },
      { name: "Vesting", status: "upcoming" },
    ],
    recentContributions: [
      { wallet: "0x3a8d...f2e1", amount: 25_000, date: "2026-02-12T10:30:00Z" },
      { wallet: "0x7b2c...a9d4", amount: 10_000, date: "2026-02-12T09:15:00Z" },
      { wallet: "0xf1e8...3c7b", amount: 50_000, date: "2026-02-11T22:45:00Z" },
    ],
  },
  {
    id: "2",
    name: "AetherFi",
    slug: "aetherfi",
    status: "Registration",
    category: "Infrastructure",
    chain: "Arbitrum",
    raised: 0,
    target: 5_000_000,
    contributors: 0,
    created: "2026-02-01",
    phases: [
      { name: "Registration", status: "active" },
      { name: "Contribution", status: "upcoming" },
      { name: "Distribution", status: "upcoming" },
      { name: "Vesting", status: "upcoming" },
    ],
    recentContributions: [],
  },
  {
    id: "3",
    name: "Onchain Labs",
    slug: "onchain-labs",
    status: "Completed",
    category: "Gaming",
    chain: "Base",
    raised: 1_800_000,
    target: 1_800_000,
    contributors: 943,
    created: "2025-12-20",
    phases: [
      { name: "Registration", status: "completed" },
      { name: "Contribution", status: "completed" },
      { name: "Distribution", status: "completed" },
      { name: "Vesting", status: "active" },
    ],
    recentContributions: [
      { wallet: "0xa4d2...e8f1", amount: 5_000, date: "2026-01-28T14:20:00Z" },
    ],
  },
  {
    id: "4",
    name: "ZeroLayer",
    slug: "zerolayer",
    status: "Live",
    category: "Infrastructure",
    chain: "Ethereum",
    raised: 890_000,
    target: 2_000_000,
    contributors: 512,
    created: "2026-01-25",
    phases: [
      { name: "Registration", status: "completed" },
      { name: "Contribution", status: "active" },
      { name: "Distribution", status: "upcoming" },
      { name: "Vesting", status: "upcoming" },
    ],
    recentContributions: [
      { wallet: "0xd9c3...b7a2", amount: 15_000, date: "2026-02-12T08:00:00Z" },
      { wallet: "0x2e5f...c1d8", amount: 7_500, date: "2026-02-11T19:30:00Z" },
    ],
  },
  {
    id: "5",
    name: "MetaVault",
    slug: "metavault",
    status: "Paused",
    category: "DeFi",
    chain: "Polygon",
    raised: 340_000,
    target: 1_500_000,
    contributors: 187,
    created: "2026-01-10",
    phases: [
      { name: "Registration", status: "completed" },
      { name: "Contribution", status: "active" },
      { name: "Distribution", status: "upcoming" },
      { name: "Vesting", status: "upcoming" },
    ],
    recentContributions: [],
  },
  {
    id: "6",
    name: "SynapseAI",
    slug: "synapse-ai",
    status: "Draft",
    category: "AI",
    chain: "Arbitrum",
    raised: 0,
    target: 8_000_000,
    contributors: 0,
    created: "2026-02-08",
    phases: [
      { name: "Registration", status: "upcoming" },
      { name: "Contribution", status: "upcoming" },
      { name: "Distribution", status: "upcoming" },
      { name: "Vesting", status: "upcoming" },
    ],
    recentContributions: [],
  },
  {
    id: "7",
    name: "Prism Finance",
    slug: "prism-finance",
    status: "Live",
    category: "DeFi",
    chain: "Base",
    raised: 3_200_000,
    target: 4_000_000,
    contributors: 2_156,
    created: "2026-01-05",
    phases: [
      { name: "Registration", status: "completed" },
      { name: "Contribution", status: "active" },
      { name: "Distribution", status: "upcoming" },
      { name: "Vesting", status: "upcoming" },
    ],
    recentContributions: [
      { wallet: "0x8f4a...d2c9", amount: 100_000, date: "2026-02-12T11:00:00Z" },
    ],
  },
  {
    id: "8",
    name: "Quantum Bridge",
    slug: "quantum-bridge",
    status: "Completed",
    category: "Infrastructure",
    chain: "Ethereum",
    raised: 6_000_000,
    target: 6_000_000,
    contributors: 4_821,
    created: "2025-11-15",
    phases: [
      { name: "Registration", status: "completed" },
      { name: "Contribution", status: "completed" },
      { name: "Distribution", status: "completed" },
      { name: "Vesting", status: "completed" },
    ],
    recentContributions: [],
  },
  {
    id: "9",
    name: "Helix Network",
    slug: "helix-network",
    status: "Registration",
    category: "RWA",
    chain: "Polygon",
    raised: 0,
    target: 3_500_000,
    contributors: 0,
    created: "2026-02-05",
    phases: [
      { name: "Registration", status: "active" },
      { name: "Contribution", status: "upcoming" },
      { name: "Distribution", status: "upcoming" },
      { name: "Vesting", status: "upcoming" },
    ],
    recentContributions: [],
  },
  {
    id: "10",
    name: "Solace Protocol",
    slug: "solace-protocol",
    status: "Cancelled",
    category: "Insurance",
    chain: "Arbitrum",
    raised: 120_000,
    target: 2_000_000,
    contributors: 89,
    created: "2025-12-01",
    phases: [
      { name: "Registration", status: "completed" },
      { name: "Contribution", status: "completed" },
      { name: "Distribution", status: "upcoming" },
      { name: "Vesting", status: "upcoming" },
    ],
    recentContributions: [],
  },
];

const statusVariantMap: Record<string, "success" | "info" | "warning" | "error" | "default" | "outline"> = {
  Draft: "outline",
  Registration: "info",
  Live: "success",
  Completed: "default",
  Paused: "warning",
  Cancelled: "error",
};

const categoryVariantMap: Record<string, "default" | "success" | "info" | "warning" | "outline"> = {
  DeFi: "default",
  Infrastructure: "info",
  Gaming: "success",
  AI: "warning",
  RWA: "outline",
  Insurance: "outline",
};

const chainVariantMap: Record<string, "default" | "info" | "success" | "warning"> = {
  Ethereum: "default",
  Arbitrum: "info",
  Base: "success",
  Polygon: "warning",
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function DealsManagementPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDealId, setExpandedDealId] = useState<string | null>(null);

  const filteredDeals = deals.filter((deal) => {
    if (statusFilter && deal.status !== statusFilter) return false;
    if (categoryFilter && deal.category !== categoryFilter) return false;
    if (
      searchQuery &&
      !deal.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Manage Deals</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {deals.length} total deals across all statuses
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
              { value: "Draft", label: "Draft" },
              { value: "Registration", label: "Registration" },
              { value: "Live", label: "Live" },
              { value: "Completed", label: "Completed" },
              { value: "Paused", label: "Paused" },
              { value: "Cancelled", label: "Cancelled" },
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
              { value: "DeFi", label: "DeFi" },
              { value: "Infrastructure", label: "Infrastructure" },
              { value: "Gaming", label: "Gaming" },
              { value: "AI", label: "AI" },
              { value: "RWA", label: "RWA" },
              { value: "Insurance", label: "Insurance" },
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
        <div className="w-48">
          <Input label="Date Range" type="date" placeholder="From date" />
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
            {filteredDeals.map((deal) => {
              const isExpanded = expandedDealId === deal.id;
              const pct =
                deal.target > 0
                  ? Math.round((deal.raised / deal.target) * 100)
                  : 0;

              return (
                <>
                  <TableRow
                    key={deal.id}
                    className="cursor-pointer"
                    onClick={() =>
                      setExpandedDealId(isExpanded ? null : deal.id)
                    }
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
                      {deal.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariantMap[deal.status]}>
                        {deal.status}
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
                          {formatCurrency(deal.raised)} /{" "}
                          {formatCurrency(deal.target)}
                        </span>
                        <Progress value={pct} className="w-24" />
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatLargeNumber(deal.contributors)}
                    </TableCell>
                    <TableCell className="text-zinc-500">
                      {formatDate(deal.created)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Dropdown>
                          <DropdownTrigger className="rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownTrigger>
                          <DropdownMenu align="right">
                            <DropdownItem icon={<Edit className="h-4 w-4" />}>
                              Edit
                            </DropdownItem>
                            <DropdownItem icon={<Eye className="h-4 w-4" />}>
                              View
                            </DropdownItem>
                            <DropdownSeparator />
                            <DropdownItem icon={<Pause className="h-4 w-4" />}>
                              Pause
                            </DropdownItem>
                            <DropdownItem
                              icon={<XCircle className="h-4 w-4" />}
                              className="text-rose-400 hover:!text-rose-300"
                            >
                              Cancel
                            </DropdownItem>
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
                                  {formatCurrency(deal.raised)}
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
                                  {formatLargeNumber(deal.contributors)}
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
                                  {formatDate(deal.created)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Phase timeline */}
                          <div className="mb-6">
                            <h4 className="mb-3 text-sm font-medium text-zinc-300">
                              Phase Timeline
                            </h4>
                            <div className="flex items-center gap-2">
                              {deal.phases.map((phase, idx) => (
                                <div key={phase.name} className="flex items-center gap-2">
                                  <div
                                    className={cn(
                                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium",
                                      phase.status === "completed" &&
                                        "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                                      phase.status === "active" &&
                                        "border-violet-500/30 bg-violet-500/10 text-violet-400",
                                      phase.status === "upcoming" &&
                                        "border-zinc-800 bg-zinc-800/50 text-zinc-500"
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "h-1.5 w-1.5 rounded-full",
                                        phase.status === "completed" && "bg-emerald-400",
                                        phase.status === "active" && "bg-violet-400",
                                        phase.status === "upcoming" && "bg-zinc-600"
                                      )}
                                    />
                                    {phase.name}
                                  </div>
                                  {idx < deal.phases.length - 1 && (
                                    <ArrowRight className="h-3 w-3 text-zinc-700" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Recent contributions */}
                          {deal.recentContributions.length > 0 && (
                            <div className="mb-6">
                              <h4 className="mb-3 text-sm font-medium text-zinc-300">
                                Recent Contributions
                              </h4>
                              <div className="space-y-2">
                                {deal.recentContributions.map((c, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5"
                                  >
                                    <span className="font-mono text-sm text-zinc-400">
                                      {c.wallet}
                                    </span>
                                    <span className="font-medium text-zinc-50">
                                      {formatCurrency(c.amount)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex items-center gap-3">
                            <Button size="sm">Advance Phase</Button>
                            <Button size="sm" variant="secondary">
                              Edit Deal
                            </Button>
                            <Button size="sm" variant="secondary">
                              Finalize
                            </Button>
                            <Button size="sm" variant="destructive">
                              Cancel Deal
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
