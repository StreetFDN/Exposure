"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  Crown,
  Clock,
  ChevronRight,
  Settings,
  UserPlus,
  TrendingUp,
  Shield,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime, formatLargeNumber } from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Placeholder Data
// ---------------------------------------------------------------------------

interface MemberGroup {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "LEFT";
  role: "LEAD" | "CO_LEAD" | "MEMBER";
  joinedAt: string | null;
  memberCount: number;
  dealCount: number;
  leadName: string;
}

interface LeadingGroup {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
  status: "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "CLOSED";
  memberCount: number;
  maxMembers: number;
  pendingApplications: number;
  dealCount: number;
  totalRaised: string;
}

const MEMBER_GROUPS: MemberGroup[] = [
  {
    id: "1",
    name: "DeFi Collective",
    slug: "defi-collective",
    avatarUrl: null,
    status: "APPROVED",
    role: "MEMBER",
    joinedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    memberCount: 156,
    dealCount: 22,
    leadName: "Elena Vasquez",
  },
  {
    id: "2",
    name: "Neural Ventures",
    slug: "neural-ventures",
    avatarUrl: null,
    status: "APPROVED",
    role: "CO_LEAD",
    joinedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    memberCount: 45,
    dealCount: 8,
    leadName: "David Chen",
  },
  {
    id: "3",
    name: "Stealth Syndicate",
    slug: "stealth-syndicate",
    avatarUrl: null,
    status: "PENDING",
    role: "MEMBER",
    joinedAt: null,
    memberCount: 28,
    dealCount: 6,
    leadName: "James Whitfield",
  },
];

const LEADING_GROUPS: LeadingGroup[] = [
  {
    id: "4",
    name: "Apex Capital",
    slug: "apex-capital",
    avatarUrl: null,
    status: "ACTIVE",
    memberCount: 72,
    maxMembers: 100,
    pendingApplications: 5,
    dealCount: 14,
    totalRaised: "28500000",
  },
];

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
// Page Component
// ---------------------------------------------------------------------------

export default function MyGroupsPage() {
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
              {MEMBER_GROUPS.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-xs text-zinc-400">
                  {MEMBER_GROUPS.length}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger value="leading">
            <span className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Leading
              {LEADING_GROUPS.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-xs text-zinc-400">
                  {LEADING_GROUPS.length}
                </span>
              )}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* =============================================================== */}
        {/* Member Of Tab                                                   */}
        {/* =============================================================== */}
        <TabsContent value="member">
          {MEMBER_GROUPS.length > 0 ? (
            <div className="space-y-3">
              {MEMBER_GROUPS.map((group) => {
                const statusConf = MEMBER_STATUS_CONFIG[group.status];
                const roleConf = ROLE_CONFIG[group.role];

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
                            Led by {group.leadName}
                          </p>
                          <div className="mt-1 flex items-center gap-4 text-xs text-zinc-500">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {group.memberCount} members
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
          {LEADING_GROUPS.length > 0 ? (
            <div className="space-y-3">
              {LEADING_GROUPS.map((group) => {
                const statusConf = GROUP_STATUS_CONFIG[group.status];

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
                              {group.memberCount}/{group.maxMembers} members
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {group.dealCount} deals
                            </span>
                            <span className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              ${formatLargeNumber(group.totalRaised)} raised
                            </span>
                            {group.pendingApplications > 0 && (
                              <span className="flex items-center gap-1 text-amber-400">
                                <UserPlus className="h-3 w-3" />
                                {group.pendingApplications} pending
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: actions */}
                      <div className="flex items-center gap-2">
                        {group.pendingApplications > 0 && (
                          <Badge variant="warning" size="sm">
                            {group.pendingApplications} pending
                          </Badge>
                        )}
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
