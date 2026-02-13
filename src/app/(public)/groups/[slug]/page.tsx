"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
// Types for the API response
// ---------------------------------------------------------------------------

interface GroupMemberUser {
  id: string;
  walletAddress: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: string;
  status: string;
  joinedAt: string | null;
  user: GroupMemberUser;
}

interface GroupDealAllocation {
  id: string;
  allocatedAmount: string | number;
  filledAmount: string | number;
  presentedAt: string | null;
  deal: {
    id: string;
    title: string;
    slug: string;
    status: string;
    category: string;
    tokenPrice: string;
    totalRaise: string;
    totalRaised: string;
    hardCap: string;
    featuredImageUrl: string | null;
  };
}

interface GroupDetailData {
  id: string;
  name: string;
  slug: string;
  description: string;
  leadId: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  isPublic: boolean;
  status: string;
  maxMembers: number;
  minTierRequired: string | null;
  requiresApplication: boolean;
  carryPercent: string;
  totalRaised: string;
  dealCount: number;
  memberCount: number;
  createdAt: string;
  lead: {
    id: string;
    walletAddress: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  members: GroupMember[];
  dealAllocations: GroupDealAllocation[];
}

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
  { label: string; variant: "default" | "success" | "warning" | "error" | "info" | "outline" }
> = {
  PENDING_APPROVAL: { label: "Pending", variant: "warning" },
  ACTIVE: { label: "Active", variant: "success" },
  SUSPENDED: { label: "Suspended", variant: "error" },
  CLOSED: { label: "Closed", variant: "outline" },
};

const ROLE_BADGE: Record<string, { label: string; variant: "default" | "warning" | "outline" }> = {
  LEAD: { label: "Lead", variant: "warning" },
  CO_LEAD: { label: "Co-Lead", variant: "default" },
  MEMBER: { label: "Member", variant: "outline" },
};

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function GroupDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 animate-pulse">
      <div className="mb-6 h-4 w-24 rounded bg-zinc-800" />
      <div className="mb-8 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="h-32 bg-zinc-800 sm:h-40" />
        <div className="px-6 pb-6 pt-12">
          <div className="h-8 w-48 rounded bg-zinc-800" />
          <div className="mt-2 h-4 w-64 rounded bg-zinc-800" />
        </div>
      </div>
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl border border-zinc-800 bg-zinc-900" />
        ))}
      </div>
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex flex-1 flex-col gap-8 lg:max-w-[60%]">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 h-6 w-20 rounded bg-zinc-800" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-zinc-800" />
              <div className="h-4 w-5/6 rounded bg-zinc-800" />
              <div className="h-4 w-4/6 rounded bg-zinc-800" />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-6 lg:w-[40%]">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 h-6 w-32 rounded bg-zinc-800" />
            <div className="h-10 w-full rounded bg-zinc-800" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function GroupDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [group, setGroup] = React.useState<GroupDetailData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [joinLoading, setJoinLoading] = React.useState(false);
  const [joinMessage, setJoinMessage] = React.useState<string | null>(null);

  // Fetch group data
  React.useEffect(() => {
    async function fetchGroup() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/groups/${slug}`);

        if (res.status === 404) {
          setError("NOT_FOUND");
          return;
        }

        if (!res.ok) {
          throw new Error(`Failed to fetch group (${res.status})`);
        }

        const json = await res.json();

        if (!json.success) {
          throw new Error(json.error || "Failed to fetch group");
        }

        setGroup(json.data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) fetchGroup();
  }, [slug]);

  // Handle join group
  async function handleJoinGroup() {
    if (!group) return;
    setJoinLoading(true);
    setJoinMessage(null);

    try {
      const res = await fetch(`/api/groups/${group.slug}/join`, {
        method: "POST",
      });

      const json = await res.json();

      if (json.success) {
        setJoinMessage("Application submitted successfully!");
        // Refresh group data to get updated member count
        const refreshRes = await fetch(`/api/groups/${slug}`);
        const refreshJson = await refreshRes.json();
        if (refreshJson.success) {
          setGroup(refreshJson.data);
        }
      } else {
        setJoinMessage(json.error || "Failed to join group");
      }
    } catch {
      setJoinMessage("Failed to join. Please sign in first.");
    } finally {
      setJoinLoading(false);
    }
  }

  // Loading state
  if (isLoading) {
    return <GroupDetailSkeleton />;
  }

  // Not found state
  if (error === "NOT_FOUND") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-zinc-100">Group not found</h1>
        <p className="mt-2 text-zinc-500">The group you are looking for does not exist or has been removed.</p>
        <Link href="/groups" className="mt-6 inline-block">
          <Button variant="outline">Back to Groups</Button>
        </Link>
      </div>
    );
  }

  // Error state
  if (error || !group) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-zinc-100">Something went wrong</h1>
        <p className="mt-2 text-zinc-500">{error || "Failed to load group data."}</p>
        <Link href="/groups" className="mt-6 inline-block">
          <Button variant="outline">Back to Groups</Button>
        </Link>
      </div>
    );
  }

  const statusConfig = GROUP_STATUS_CONFIG[group.status] || GROUP_STATUS_CONFIG.ACTIVE;
  const fillPercent = (group.memberCount / group.maxMembers) * 100;

  // Derive lead info
  const leadName = group.lead?.displayName || "Anonymous";
  const leadWallet = group.lead?.walletAddress || "";

  // Split members into approved and filter for preview
  const approvedMembers = group.members.filter((m) => m.status === "APPROVED");
  const membersPreview = approvedMembers.slice(0, 6);

  // Split deal allocations into active and past
  const activeDeals = group.dealAllocations.filter((da) =>
    ["REGISTRATION_OPEN", "GUARANTEED_ALLOCATION", "FCFS"].includes(da.deal.status)
  );
  const pastDeals = group.dealAllocations.filter((da) =>
    ["COMPLETED", "DISTRIBUTING", "SETTLEMENT"].includes(da.deal.status)
  );

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
                <span className="font-medium text-zinc-300">{leadName}</span>
                {leadWallet && (
                  <span className="ml-1 text-zinc-600">
                    {leadWallet.slice(0, 6)}...{leadWallet.slice(-4)}
                  </span>
                )}
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
          label="Deals"
          value={String(group.dealAllocations.length)}
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
          {activeDeals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Deals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeDeals.map((da) => {
                  const allocated = Number(da.allocatedAmount) || 0;
                  const filled = Number(da.filledAmount) || 0;
                  const progress = allocated > 0 ? (filled / allocated) * 100 : 0;
                  const statusConf = DEAL_STATUS_CONFIG[da.deal.status] || {
                    label: da.deal.status,
                    variant: "outline" as const,
                  };

                  return (
                    <div
                      key={da.id}
                      className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <Link
                            href={`/deals/${da.deal.slug}`}
                            className="text-sm font-medium text-zinc-50 transition-colors hover:text-violet-400"
                          >
                            {da.deal.title}
                          </Link>
                          <p className="text-xs text-zinc-500">{da.deal.category}</p>
                        </div>
                        <Badge variant={statusConf.variant} size="sm">
                          {statusConf.label}
                        </Badge>
                      </div>
                      <div className="mb-3 grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-zinc-500">Allocation</p>
                          <p className="font-medium text-zinc-200">
                            {formatCurrency(allocated)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Filled</p>
                          <p className="font-medium text-zinc-200">
                            {formatCurrency(filled)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Token Price</p>
                          <p className="font-medium text-zinc-200">
                            {formatCurrency(da.deal.tokenPrice)}
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
          )}

          {/* Past Deals */}
          {pastDeals.length > 0 && (
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
                        <th className="pb-3 pr-4 font-medium text-zinc-500">Allocated</th>
                        <th className="pb-3 pr-4 font-medium text-zinc-500">Filled</th>
                        <th className="pb-3 font-medium text-zinc-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastDeals.map((da) => (
                        <tr key={da.id} className="border-b border-zinc-800/50 last:border-0">
                          <td className="py-3 pr-4 font-medium text-zinc-200">
                            <Link
                              href={`/deals/${da.deal.slug}`}
                              className="transition-colors hover:text-violet-400"
                            >
                              {da.deal.title}
                            </Link>
                          </td>
                          <td className="py-3 pr-4 text-zinc-400">
                            {formatCurrency(Number(da.allocatedAmount))}
                          </td>
                          <td className="py-3 pr-4 text-zinc-400">
                            {formatCurrency(Number(da.filledAmount))}
                          </td>
                          <td className="py-3">
                            <Badge
                              variant={da.deal.status === "COMPLETED" ? "success" : "info"}
                              size="sm"
                            >
                              {da.deal.status === "COMPLETED" ? "Completed" : da.deal.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Show empty state if no deals at all */}
          {activeDeals.length === 0 && pastDeals.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Deals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="py-6 text-center text-sm text-zinc-500">
                  No deals presented to this group yet.
                </p>
              </CardContent>
            </Card>
          )}
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

                {/* Join message */}
                {joinMessage && (
                  <p className="text-center text-sm text-zinc-400">{joinMessage}</p>
                )}

                {/* CTA */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleJoinGroup}
                  disabled={joinLoading || group.memberCount >= group.maxMembers}
                >
                  {joinLoading
                    ? "Submitting..."
                    : group.memberCount >= group.maxMembers
                      ? "Group Full"
                      : group.requiresApplication
                        ? "Apply to Join"
                        : "Request to Join"}
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
                    alt={leadName}
                    src={group.lead?.avatarUrl}
                    size="lg"
                  />
                  <div>
                    <p className="font-medium text-zinc-50">{leadName}</p>
                    {leadWallet && (
                      <p className="text-xs text-zinc-500">
                        {leadWallet.slice(0, 6)}...{leadWallet.slice(-4)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-center">
                    <p className="text-xs text-zinc-500">Deals Led</p>
                    <p className="text-lg font-bold text-zinc-50">
                      {group.dealCount}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-center">
                    <p className="text-xs text-zinc-500">Total Raised</p>
                    <p className="text-lg font-bold text-zinc-50">
                      ${formatLargeNumber(group.totalRaised)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-center">
                    <p className="text-xs text-zinc-500">Members</p>
                    <p className="text-lg font-bold text-zinc-50">
                      {group.memberCount}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-center">
                    <p className="text-xs text-zinc-500">Carry</p>
                    <p className="text-lg font-bold text-zinc-50">
                      {group.carryPercent}%
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
                {membersPreview.map((member) => {
                  const roleBadge = ROLE_BADGE[member.role] || {
                    label: member.role,
                    variant: "outline" as const,
                  };
                  const memberName = member.user.displayName || "Anonymous";
                  const memberWallet = member.user.walletAddress
                    ? `${member.user.walletAddress.slice(0, 6)}...${member.user.walletAddress.slice(-4)}`
                    : "";

                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-800/40"
                    >
                      <Avatar
                        alt={memberName}
                        src={member.user.avatarUrl}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-200">
                          {memberName}
                        </p>
                        <p className="text-xs text-zinc-600">{memberWallet}</p>
                      </div>
                      <Badge variant={roleBadge.variant} size="sm">
                        {roleBadge.label}
                      </Badge>
                    </div>
                  );
                })}
                {approvedMembers.length > membersPreview.length && (
                  <p className="pt-2 text-center text-xs text-zinc-600">
                    and {approvedMembers.length - membersPreview.length} more members
                  </p>
                )}
                {approvedMembers.length === 0 && (
                  <p className="py-4 text-center text-xs text-zinc-600">
                    No approved members yet
                  </p>
                )}
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
