"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Crown,
  Clock,
  ChevronRight,
  Settings,
  TrendingUp,
  Shield,
  UserPlus,
  Loader2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime, formatLargeNumber } from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Types — matching API response from GET /api/groups?membership=mine
// ---------------------------------------------------------------------------

interface GroupLead {
  id: string;
  walletAddress: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface ApiGroup {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  status: "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "CLOSED";
  isPublic: boolean;
  maxMembers: number;
  memberCount: number;
  dealCount: number;
  totalRaised: string;
  requiresApplication: boolean;
  lead: GroupLead;
  _count: {
    members: number;
  };
  // Attached by the membership=mine branch
  membershipRole: "LEAD" | "CO_LEAD" | "MEMBER";
  membershipStatus: "APPROVED" | "PENDING";
  joinedAt: string | null;
}

// ---------------------------------------------------------------------------
// Status/role badge helpers
// ---------------------------------------------------------------------------

const MEMBER_STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "info" | "outline" }
> = {
  PENDING: { label: "Pending", variant: "warning" },
  APPROVED: { label: "Active", variant: "success" },
  REJECTED: { label: "Rejected", variant: "outline" },
  LEFT: { label: "Left", variant: "outline" },
};

const GROUP_STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "info" | "outline" }
> = {
  PENDING_APPROVAL: { label: "Pending", variant: "warning" },
  ACTIVE: { label: "Active", variant: "success" },
  SUSPENDED: { label: "Suspended", variant: "outline" },
  CLOSED: { label: "Closed", variant: "outline" },
};

const ROLE_CONFIG: Record<
  string,
  { label: string; variant: "default" | "warning" | "outline" }
> = {
  LEAD: { label: "Lead", variant: "warning" },
  CO_LEAD: { label: "Co-Lead", variant: "default" },
  MEMBER: { label: "Member", variant: "outline" },
};

// ---------------------------------------------------------------------------
// Loading Skeletons
// ---------------------------------------------------------------------------

function GroupCardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} variant="card" className="h-24" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function MyGroupsPage() {
  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Fetch user's groups via membership=mine
  // -------------------------------------------------------------------------

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/groups?membership=mine&limit=100");
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load groups");
      }

      setGroups(json.data.groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // -------------------------------------------------------------------------
  // Split groups into "member of" vs "leading"
  // -------------------------------------------------------------------------

  const memberGroups = useMemo(
    () => groups.filter((g) => g.membershipRole === "MEMBER" || g.membershipRole === "CO_LEAD"),
    [groups]
  );

  const leadingGroups = useMemo(
    () => groups.filter((g) => g.membershipRole === "LEAD"),
    [groups]
  );

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------

  if (error && !loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">My Groups</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage your group memberships and syndicates
          </p>
        </div>
        <Alert variant="error">{error}</Alert>
        <Button variant="secondary" size="sm" onClick={fetchGroups}>
          <Loader2 className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">My Groups</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage your group memberships and syndicates
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="member">
        <TabsList>
          <TabsTrigger value="member">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Member Of
              {!loading && memberGroups.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-xs text-zinc-400">
                  {memberGroups.length}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger value="leading">
            <span className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Leading
              {!loading && leadingGroups.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-xs text-zinc-400">
                  {leadingGroups.length}
                </span>
              )}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* =============================================================== */}
        {/* Member Of Tab                                                   */}
        {/* =============================================================== */}
        <TabsContent value="member">
          {loading ? (
            <GroupCardSkeleton />
          ) : memberGroups.length > 0 ? (
            <div className="space-y-3">
              {memberGroups.map((group) => {
                const statusConf = MEMBER_STATUS_CONFIG[group.membershipStatus] || MEMBER_STATUS_CONFIG.APPROVED;
                const roleConf = ROLE_CONFIG[group.membershipRole] || ROLE_CONFIG.MEMBER;
                const memberCount = group._count?.members ?? group.memberCount ?? 0;
                const leadName = group.lead?.displayName || group.lead?.walletAddress || "Unknown";

                return (
                  <Card key={group.id}>
                    <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                      {/* Left: group info */}
                      <div className="flex items-center gap-4">
                        <Avatar
                          alt={group.name}
                          src={group.avatarUrl}
                          size="lg"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/groups/${group.slug}`}
                              className="text-base font-semibold text-zinc-50 transition-colors hover:text-violet-400"
                            >
                              {group.name}
                            </Link>
                            <Badge variant={statusConf.variant} size="sm">
                              {statusConf.label}
                            </Badge>
                            <Badge variant={roleConf.variant} size="sm">
                              {roleConf.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-500">
                            Led by {leadName}
                          </p>
                          <div className="mt-1 flex items-center gap-4 text-xs text-zinc-500">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {memberCount} members
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {group.dealCount} deals
                            </span>
                            {group.joinedAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Joined {formatRelativeTime(group.joinedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: action */}
                      <Link href={`/groups/${group.slug}`}>
                        <Button variant="outline" size="sm">
                          View Group
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="No group memberships"
              description="You haven't joined any investment groups yet. Browse available groups to get started."
              action={
                <Link href="/groups">
                  <Button variant="default" size="sm">
                    Browse Groups
                  </Button>
                </Link>
              }
            />
          )}
        </TabsContent>

        {/* =============================================================== */}
        {/* Leading Tab                                                     */}
        {/* =============================================================== */}
        <TabsContent value="leading">
          {loading ? (
            <GroupCardSkeleton />
          ) : leadingGroups.length > 0 ? (
            <div className="space-y-3">
              {leadingGroups.map((group) => {
                const statusConf = GROUP_STATUS_CONFIG[group.status] || GROUP_STATUS_CONFIG.ACTIVE;
                const memberCount = group._count?.members ?? group.memberCount ?? 0;
                const totalRaised = group.totalRaised || "0";

                return (
                  <Card key={group.id}>
                    <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                      {/* Left: group info */}
                      <div className="flex items-center gap-4">
                        <Avatar
                          alt={group.name}
                          src={group.avatarUrl}
                          size="lg"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/groups/${group.slug}`}
                              className="text-base font-semibold text-zinc-50 transition-colors hover:text-violet-400"
                            >
                              {group.name}
                            </Link>
                            <Badge variant={statusConf.variant} size="sm">
                              {statusConf.label}
                            </Badge>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {memberCount}/{group.maxMembers} members
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {group.dealCount} deals
                            </span>
                            <span className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              ${formatLargeNumber(totalRaised)} raised
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: actions */}
                      <div className="flex items-center gap-2">
                        <Link href={`/groups/${group.slug}`}>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                            Manage
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Crown className="h-6 w-6" />}
              title="Not leading any groups"
              description="You haven't created an investment group yet. Start a syndicate to lead deal-by-deal investing."
              action={
                <Button variant="default" size="sm">
                  Create Group
                </Button>
              }
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
