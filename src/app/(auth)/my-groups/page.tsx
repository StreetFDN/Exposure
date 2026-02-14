"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime, formatLargeNumber } from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Types
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
  membershipRole: "LEAD" | "CO_LEAD" | "MEMBER";
  membershipStatus: "APPROVED" | "PENDING";
  joinedAt: string | null;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function GroupsSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
      <div className="mb-16">
        <div className="h-8 w-32 animate-pulse rounded bg-zinc-200" />
        <div className="mt-3 h-4 w-64 animate-pulse rounded bg-zinc-200" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border border-zinc-200 p-8">
            <div className="h-5 w-40 animate-pulse rounded bg-zinc-200" />
            <div className="mt-3 h-3 w-32 animate-pulse rounded bg-zinc-200" />
            <div className="mt-2 h-3 w-24 animate-pulse rounded bg-zinc-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MyGroupsPage() {
  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(
        err instanceof Error ? err.message : "Failed to load groups"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const leadingGroups = useMemo(
    () => groups.filter((g) => g.membershipRole === "LEAD"),
    [groups]
  );

  const memberGroups = useMemo(
    () =>
      groups.filter(
        (g) =>
          g.membershipRole === "MEMBER" || g.membershipRole === "CO_LEAD"
      ),
    [groups]
  );

  if (loading) return <GroupsSkeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="flex flex-col items-center justify-center py-24">
          <p className="font-serif text-xl font-normal text-zinc-500">
            Unable to load your groups
          </p>
          <p className="mt-2 text-sm font-normal text-zinc-400">{error}</p>
          <button
            onClick={fetchGroups}
            className="mt-4 text-xs font-normal text-zinc-500 transition-colors hover:text-zinc-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  function statusLabel(status: string): string {
    switch (status) {
      case "ACTIVE":
        return "Active";
      case "PENDING_APPROVAL":
        return "Pending";
      case "SUSPENDED":
        return "Suspended";
      case "CLOSED":
        return "Closed";
      default:
        return status;
    }
  }

  function roleLabel(role: string): string {
    switch (role) {
      case "LEAD":
        return "Lead";
      case "CO_LEAD":
        return "Co-Lead";
      default:
        return "Member";
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
      {/* Header */}
      <div className="mb-16">
        <h1 className="font-serif text-3xl font-light text-zinc-900">
          My Groups
        </h1>
        <p className="mt-2 text-sm font-normal text-zinc-500">
          Manage your group memberships and syndicates.
        </p>
      </div>

      {/* Groups I Lead */}
      {leadingGroups.length > 0 && (
        <div className="mb-16">
          <h2 className="mb-6 font-serif text-lg font-normal text-zinc-900">
            Groups I Lead
          </h2>
          <div className="grid grid-cols-1 gap-px border border-zinc-200 lg:grid-cols-2">
            {leadingGroups.map((group) => {
              const memberCount =
                group._count?.members ?? group.memberCount ?? 0;
              return (
                <Link
                  key={group.id}
                  href={`/groups/${group.slug}`}
                  className="block p-8 transition-colors hover:bg-zinc-50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-normal text-zinc-800">
                        {group.name}
                      </h3>
                      <p className="mt-2 text-xs font-normal text-zinc-400">
                        {memberCount}/{group.maxMembers} members &middot;{" "}
                        {group.dealCount} deals &middot; $
                        {formatLargeNumber(group.totalRaised)} raised
                      </p>
                    </div>
                    <span className="border border-zinc-200 px-2 py-0.5 text-xs font-normal text-zinc-500">
                      {statusLabel(group.status)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Groups I'm In */}
      <div>
        <h2 className="mb-6 font-serif text-lg font-normal text-zinc-900">
          Groups I&apos;m In
        </h2>
        {memberGroups.length === 0 && leadingGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <p className="font-serif text-lg font-normal text-zinc-500">
              No group memberships
            </p>
            <p className="mt-2 text-sm font-normal text-zinc-400">
              Browse available groups to get started.
            </p>
            <Link
              href="/groups"
              className="mt-4 text-xs font-normal text-zinc-500 transition-colors hover:text-zinc-600"
            >
              Browse Groups
            </Link>
          </div>
        ) : memberGroups.length === 0 ? (
          <p className="py-12 text-center font-serif text-sm font-normal text-zinc-400">
            You haven&apos;t joined any groups as a member yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-px border border-zinc-200 lg:grid-cols-2">
            {memberGroups.map((group) => {
              const memberCount =
                group._count?.members ?? group.memberCount ?? 0;
              const leadName =
                group.lead?.displayName ||
                group.lead?.walletAddress ||
                "Unknown";

              return (
                <Link
                  key={group.id}
                  href={`/groups/${group.slug}`}
                  className="block p-8 transition-colors hover:bg-zinc-50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-normal text-zinc-800">
                        {group.name}
                      </h3>
                      <p className="mt-1 text-xs font-normal text-zinc-400">
                        Led by {leadName}
                      </p>
                      <p className="mt-1 text-xs font-normal text-zinc-400">
                        {memberCount} members &middot; {group.dealCount} deals
                        {group.joinedAt && (
                          <>
                            {" "}
                            &middot; Joined{" "}
                            {formatRelativeTime(group.joinedAt)}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className="border border-zinc-200 px-2 py-0.5 text-xs font-normal text-zinc-500">
                        {roleLabel(group.membershipRole)}
                      </span>
                      <span
                        className={cn(
                          "border px-2 py-0.5 text-xs font-normal",
                          group.membershipStatus === "APPROVED"
                            ? "border-zinc-300 text-zinc-500"
                            : "border-zinc-200 text-zinc-400"
                        )}
                      >
                        {group.membershipStatus === "APPROVED"
                          ? "Active"
                          : "Pending"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
