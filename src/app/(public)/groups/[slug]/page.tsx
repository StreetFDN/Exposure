"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  DollarSign,
  BarChart3,
  Crown,
  Shield,
  CheckCircle2,
  Clock,
  FileText,
  ExternalLink,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency, formatLargeNumber, formatPercent } from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Placeholder Data — Apex Capital group
// ---------------------------------------------------------------------------

const GROUP = {
  id: "1",
  name: "Apex Capital",
  slug: "apex-capital",
  description: `Apex Capital is a premier crypto venture syndicate focused on seed and Series A investments in DeFi infrastructure, cross-chain protocols, and next-generation financial primitives.

Founded by Marcus Reynolds, former partner at a top-tier crypto VC fund, Apex Capital brings institutional-grade due diligence to the syndicate model. Our investment thesis centers on protocols building critical infrastructure for the on-chain economy.

### Investment Philosophy

We look for teams building category-defining protocols with strong technical moats, clear token utility, and sustainable value accrual. Our typical check size ranges from $500K to $5M, with follow-on capacity for breakout performers.

### Track Record

Since inception, Apex Capital has deployed over $28.5M across 14 deals, with a realized portfolio average return of 4.2x. Our top-performing investment returned 18x at peak, and we maintain an 85% win rate across our portfolio.

### Member Benefits

- Exclusive access to pre-seed and seed deals not available on public launchpads
- Detailed investment memos and due diligence reports for every deal
- Monthly portfolio reviews and market outlook calls
- Direct access to the lead investor for Q&A on active deals
- Pro-rata co-investment rights on all group allocations`,
  leadId: "lead-1",
  leadName: "Marcus Reynolds",
  leadWallet: "0x7a3B1c2D8e5F6a9B0c1D2e3F4a5B6c7D8e9f4E",
  leadDisplayName: "Marcus Reynolds",
  leadAvatarUrl: null,
  leadTrackRecord: {
    totalDeals: 14,
    avgReturn: "4.2x",
    winRate: 85,
    totalDeployed: "28500000",
  },
  avatarUrl: null,
  bannerUrl: null,
  isPublic: true,
  status: "ACTIVE" as const,
  maxMembers: 100,
  memberCount: 72,
  dealCount: 14,
  totalRaised: "28500000",
  minTierRequired: "GOLD" as const,
  requiresApplication: true,
  carryPercent: "20",
  createdAt: new Date(Date.now() - 180 * 86400000).toISOString(),
};

const ACTIVE_DEALS = [
  {
    id: "d1",
    name: "AetherFi Public Round",
    slug: "aetherfi-public-round",
    status: "GUARANTEED_ALLOCATION",
    category: "DEFI",
    allocatedAmount: "500000",
    filledAmount: "380000",
    tokenPrice: "0.045",
    presentedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "d2",
    name: "Nexus AI Community Round",
    slug: "nexus-ai-community",
    status: "REGISTRATION_OPEN",
    category: "AI",
    allocatedAmount: "750000",
    filledAmount: "120000",
    tokenPrice: "0.12",
    presentedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "d3",
    name: "LayerBridge Strategic Sale",
    slug: "layerbridge-strategic",
    status: "FCFS",
    category: "INFRASTRUCTURE",
    allocatedAmount: "1000000",
    filledAmount: "920000",
    tokenPrice: "0.28",
    presentedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

const PAST_DEALS = [
  { name: "SynapseDAO Genesis", invested: "400000", returnMultiple: "3.8x", status: "Distributed" },
  { name: "Chrono Social Seed", invested: "250000", returnMultiple: "2.1x", status: "Distributed" },
  { name: "Voxelheim Pre-Seed", invested: "600000", returnMultiple: "6.5x", status: "Vesting" },
  { name: "ZKBridge Series A", invested: "1200000", returnMultiple: "1.4x", status: "Vesting" },
  { name: "Photon Chain Seed", invested: "350000", returnMultiple: "18.2x", status: "Distributed" },
];

const MEMBERS_PREVIEW = [
  { id: "m1", name: "Marcus Reynolds", role: "LEAD", wallet: "0x7a3B...9f4E" },
  { id: "m2", name: "Elena V.", role: "CO_LEAD", wallet: "0x4c2D...8bA1" },
  { id: "m3", name: "David C.", role: "MEMBER", wallet: "0x9f1E...3cD7" },
  { id: "m4", name: "Sophie N.", role: "MEMBER", wallet: "0x2bA8...6eF3" },
  { id: "m5", name: "Alex T.", role: "MEMBER", wallet: "0x5dC9...2aB4" },
  { id: "m6", name: "James W.", role: "MEMBER", wallet: "0x8eF2...1cA5" },
];

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const DEAL_STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "info" | "outline" }
> = {
  REGISTRATION_OPEN: { label: "Registration", variant: "default" },
  GUARANTEED_ALLOCATION: { label: "Active", variant: "success" },
  FCFS: { label: "FCFS", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "outline" },
};

const GROUP_STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "info" | "outline" }
> = {
  PENDING_APPROVAL: { label: "Pending", variant: "warning" },
  ACTIVE: { label: "Active", variant: "success" },
  SUSPENDED: { label: "Suspended", variant: "error" as any },
  CLOSED: { label: "Closed", variant: "outline" },
};

const ROLE_BADGE: Record<string, { label: string; variant: "default" | "warning" | "outline" }> = {
  LEAD: { label: "Lead", variant: "warning" },
  CO_LEAD: { label: "Co-Lead", variant: "default" },
  MEMBER: { label: "Member", variant: "outline" },
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function GroupDetailPage() {
  const group = GROUP;
  const statusConfig = GROUP_STATUS_CONFIG[group.status];
  const fillPercent = (group.memberCount / group.maxMembers) * 100;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/groups"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-zinc-50"
      >
        <ArrowLeft className="h-4 w-4" />
        All Groups
      </Link>

      {/* ================================================================= */}
      {/* Header Section                                                    */}
      {/* ================================================================= */}
      <div className="mb-8 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        {/* Banner */}
        <div className="relative h-32 bg-gradient-to-br from-violet-600/40 via-fuchsia-600/20 to-zinc-900 sm:h-40">
          <div className="absolute -bottom-8 left-6">
            <Avatar
              alt={group.name}
              src={group.avatarUrl}
              size="xl"
              ring
            />
          </div>
        </div>

        {/* Info */}
        <div className="px-6 pb-6 pt-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-zinc-50 sm:text-3xl">
                  {group.name}
                </h1>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </div>
              <p className="text-sm text-zinc-400">
                Led by{" "}
                <span className="font-medium text-zinc-300">{group.leadName}</span>
                <span className="ml-1 text-zinc-600">
                  {group.leadWallet.slice(0, 6)}...{group.leadWallet.slice(-4)}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {group.minTierRequired && (
                <Badge variant="warning" size="sm">
                  <Shield className="mr-1 h-3 w-3" />
                  {group.minTierRequired}+ Required
                </Badge>
              )}
              <Badge variant="outline" size="sm">
                {group.carryPercent}% Carry
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* Stats Row                                                         */}
      {/* ================================================================= */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatBox
          icon={<Users className="h-5 w-5 text-violet-400" />}
          label="Members"
          value={`${group.memberCount}/${group.maxMembers}`}
        />
        <StatBox
          icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
          label="Deals"
          value={String(group.dealCount)}
        />
        <StatBox
          icon={<DollarSign className="h-5 w-5 text-amber-400" />}
          label="Total Raised"
          value={`$${formatLargeNumber(group.totalRaised)}`}
        />
        <StatBox
          icon={<BarChart3 className="h-5 w-5 text-sky-400" />}
          label="Avg Return"
          value={group.leadTrackRecord.avgReturn}
        />
      </div>

      {/* ================================================================= */}
      {/* Two-column layout                                                 */}
      {/* ================================================================= */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* =============================================================== */}
        {/* Left Column (60%)                                               */}
        {/* =============================================================== */}
        <div className="flex flex-1 flex-col gap-8 lg:max-w-[60%]">
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert prose-sm max-w-none">
                {group.description.split("\n").map((line, i) => {
                  if (line.startsWith("### ")) {
                    return (
                      <h3
                        key={i}
                        className="mb-2 mt-5 text-lg font-semibold text-zinc-200"
                      >
                        {line.replace("### ", "")}
                      </h3>
                    );
                  }
                  if (line.startsWith("- ")) {
                    return (
                      <div key={i} className="mb-2 flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                        <p className="text-sm text-zinc-300">
                          {line.replace("- ", "")}
                        </p>
                      </div>
                    );
                  }
                  if (line.trim() === "") {
                    return <div key={i} className="h-2" />;
                  }
                  return (
                    <p
                      key={i}
                      className="mb-2 text-sm leading-relaxed text-zinc-300"
                    >
                      {line}
                    </p>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Active Deals */}
          <Card>
            <CardHeader>
              <CardTitle>Active Deals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ACTIVE_DEALS.map((deal) => {
                const progress =
                  (parseFloat(deal.filledAmount) / parseFloat(deal.allocatedAmount)) * 100;
                const statusConf = DEAL_STATUS_CONFIG[deal.status] || {
                  label: deal.status,
                  variant: "outline" as const,
                };

                return (
                  <div
                    key={deal.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <Link
                          href={`/deals/${deal.id}`}
                          className="text-sm font-medium text-zinc-50 transition-colors hover:text-violet-400"
                        >
                          {deal.name}
                        </Link>
                        <p className="text-xs text-zinc-500">{deal.category}</p>
                      </div>
                      <Badge variant={statusConf.variant} size="sm">
                        {statusConf.label}
                      </Badge>
                    </div>
                    <div className="mb-3 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-zinc-500">Allocation</p>
                        <p className="font-medium text-zinc-200">
                          {formatCurrency(deal.allocatedAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Filled</p>
                        <p className="font-medium text-zinc-200">
                          {formatCurrency(deal.filledAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Token Price</p>
                        <p className="font-medium text-zinc-200">
                          {formatCurrency(deal.tokenPrice)}
                        </p>
                      </div>
                    </div>
                    <Progress
                      value={progress}
                      label="Fill Progress"
                      showPercentage
                      color={progress > 80 ? "warning" : "default"}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Past Deals */}
          <Card>
            <CardHeader>
              <CardTitle>Past Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-left">
                      <th className="pb-3 pr-4 font-medium text-zinc-500">Deal</th>
                      <th className="pb-3 pr-4 font-medium text-zinc-500">Invested</th>
                      <th className="pb-3 pr-4 font-medium text-zinc-500">Return</th>
                      <th className="pb-3 font-medium text-zinc-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PAST_DEALS.map((deal) => (
                      <tr key={deal.name} className="border-b border-zinc-800/50 last:border-0">
                        <td className="py-3 pr-4 font-medium text-zinc-200">
                          {deal.name}
                        </td>
                        <td className="py-3 pr-4 text-zinc-400">
                          {formatCurrency(deal.invested)}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="font-medium text-emerald-400">
                            {deal.returnMultiple}
                          </span>
                        </td>
                        <td className="py-3">
                          <Badge
                            variant={deal.status === "Distributed" ? "success" : "info"}
                            size="sm"
                          >
                            {deal.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Performance summary */}
              <div className="mt-4 flex flex-wrap gap-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-center">
                  <p className="text-xs text-zinc-500">Avg Return</p>
                  <p className="text-lg font-bold text-emerald-400">4.2x</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500">Win Rate</p>
                  <p className="text-lg font-bold text-zinc-50">85%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500">Best Return</p>
                  <p className="text-lg font-bold text-violet-400">18.2x</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500">Total Deployed</p>
                  <p className="text-lg font-bold text-zinc-50">
                    ${formatLargeNumber(GROUP.leadTrackRecord.totalDeployed)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* =============================================================== */}
        {/* Right Column (40%, sticky)                                      */}
        {/* =============================================================== */}
        <div className="flex flex-col gap-6 lg:w-[40%]">
          <div className="flex flex-col gap-6 lg:sticky lg:top-8">
            {/* Join This Group */}
            <Card>
              <CardHeader>
                <CardTitle>Join This Group</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Requirements */}
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Requirements
                  </p>
                  <RequirementRow
                    icon={<Shield className="h-4 w-4" />}
                    label="Minimum Tier"
                    value={group.minTierRequired || "None"}
                    met={true}
                  />
                  <RequirementRow
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    label="KYC Verification"
                    value="Required"
                    met={false}
                  />
                  <RequirementRow
                    icon={<FileText className="h-4 w-4" />}
                    label="Application"
                    value={group.requiresApplication ? "Required" : "Open Entry"}
                    met={true}
                  />
                  <RequirementRow
                    icon={<Users className="h-4 w-4" />}
                    label="Capacity"
                    value={`${group.maxMembers - group.memberCount} spots left`}
                    met={group.memberCount < group.maxMembers}
                  />
                </div>

                {/* Capacity bar */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
                    <span>{group.memberCount} members</span>
                    <span>{group.maxMembers} max</span>
                  </div>
                  <Progress value={fillPercent} color="default" />
                </div>

                {/* CTA */}
                <Button className="w-full" size="lg">
                  {group.requiresApplication ? "Apply to Join" : "Request to Join"}
                </Button>

                <p className="text-center text-xs text-zinc-600">
                  {group.carryPercent}% carry fee applies to follower profits
                </p>
              </CardContent>
            </Card>

            {/* Lead Info */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Investor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    alt={group.leadName}
                    src={group.leadAvatarUrl}
                    size="lg"
                  />
                  <div>
                    <p className="font-medium text-zinc-50">{group.leadName}</p>
                    <p className="text-xs text-zinc-500">
                      {group.leadWallet.slice(0, 6)}...{group.leadWallet.slice(-4)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-center">
                    <p className="text-xs text-zinc-500">Deals Led</p>
                    <p className="text-lg font-bold text-zinc-50">
                      {group.leadTrackRecord.totalDeals}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-center">
                    <p className="text-xs text-zinc-500">Avg Return</p>
                    <p className="text-lg font-bold text-emerald-400">
                      {group.leadTrackRecord.avgReturn}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-center">
                    <p className="text-xs text-zinc-500">Win Rate</p>
                    <p className="text-lg font-bold text-zinc-50">
                      {group.leadTrackRecord.winRate}%
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-center">
                    <p className="text-xs text-zinc-500">Deployed</p>
                    <p className="text-lg font-bold text-zinc-50">
                      ${formatLargeNumber(group.leadTrackRecord.totalDeployed)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Members Preview */}
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Members</CardTitle>
                <Badge variant="outline" size="sm">
                  {group.memberCount} total
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {MEMBERS_PREVIEW.map((member) => {
                  const roleBadge = ROLE_BADGE[member.role] || {
                    label: member.role,
                    variant: "outline" as const,
                  };
                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-800/40"
                    >
                      <Avatar
                        alt={member.name}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-200">
                          {member.name}
                        </p>
                        <p className="text-xs text-zinc-600">{member.wallet}</p>
                      </div>
                      <Badge variant={roleBadge.variant} size="sm">
                        {roleBadge.label}
                      </Badge>
                    </div>
                  );
                })}
                <p className="pt-2 text-center text-xs text-zinc-600">
                  and {group.memberCount - MEMBERS_PREVIEW.length} more members
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
        {icon}
      </div>
      <div>
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="text-lg font-bold text-zinc-50">{value}</p>
      </div>
    </div>
  );
}

function RequirementRow({
  icon,
  label,
  value,
  met,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  met: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <span className={met ? "text-emerald-400" : "text-zinc-600"}>{icon}</span>
        {label}
      </div>
      <span className={`text-sm font-medium ${met ? "text-zinc-200" : "text-zinc-500"}`}>
        {value}
      </span>
    </div>
  );
}
