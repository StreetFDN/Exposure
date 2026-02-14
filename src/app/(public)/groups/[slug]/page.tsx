"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Shield,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatLargeNumber } from "@/lib/utils/format";

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
// Role labels
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<string, string> = {
  LEAD: "Lead",
  CO_LEAD: "Co-Lead",
  MEMBER: "Member",
};

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function GroupDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-24 animate-pulse">
        <div className="mb-12 h-4 w-24 bg-zinc-200" />
        <div className="mb-16">
          <div className="mb-3 h-3 w-20 bg-zinc-200" />
          <div className="mb-4 h-10 w-64 bg-zinc-200" />
          <div className="h-5 w-80 bg-zinc-200" />
        </div>
        <div className="mb-16 grid grid-cols-2 gap-px border border-zinc-200 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-zinc-200 p-5">
              <div className="mb-2 h-2.5 w-12 bg-zinc-200" />
              <div className="h-6 w-16 bg-zinc-200" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-16 lg:flex-row">
          <div className="flex flex-1 flex-col gap-12 lg:max-w-[58%]">
            <div className="border border-zinc-200 p-8">
              <div className="mb-6 h-5 w-24 bg-zinc-200" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-zinc-200" />
                <div className="h-4 w-5/6 bg-zinc-200" />
                <div className="h-4 w-4/6 bg-zinc-200" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-10 lg:w-[38%]">
            <div className="border border-zinc-200 p-8">
              <div className="mb-6 h-5 w-32 bg-zinc-200" />
              <div className="h-10 w-full bg-zinc-200" />
            </div>
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

  if (isLoading) {
    return <GroupDetailSkeleton />;
  }

  if (error === "NOT_FOUND") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <Users className="mb-8 h-10 w-10 text-zinc-300" />
        <h1 className="font-serif text-3xl font-light text-zinc-800">
          Group not found
        </h1>
        <p className="mt-3 max-w-sm font-sans text-sm font-normal text-zinc-500">
          The group you are looking for does not exist or has been removed.
        </p>
        <Link href="/groups" className="mt-10 inline-block">
          <Button variant="outline" size="sm">
            Back to Groups
          </Button>
        </Link>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <h1 className="font-serif text-3xl font-light text-zinc-800">
          Something went wrong
        </h1>
        <p className="mt-3 max-w-sm font-sans text-sm font-normal text-zinc-500">
          {error || "Failed to load group data."}
        </p>
        <Link href="/groups" className="mt-10 inline-block">
          <Button variant="outline" size="sm">
            Back to Groups
          </Button>
        </Link>
      </div>
    );
  }

  const fillPercent = (group.memberCount / group.maxMembers) * 100;
  const leadName = group.lead?.displayName || "Anonymous";
  const leadWallet = group.lead?.walletAddress || "";

  const approvedMembers = group.members.filter((m) => m.status === "APPROVED");
  const membersPreview = approvedMembers.slice(0, 8);

  const activeDeals = group.dealAllocations.filter((da) =>
    ["REGISTRATION_OPEN", "GUARANTEED_ALLOCATION", "FCFS"].includes(
      da.deal.status
    )
  );
  const pastDeals = group.dealAllocations.filter((da) =>
    ["COMPLETED", "DISTRIBUTING", "SETTLEMENT"].includes(da.deal.status)
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-24">
        {/* ================================================================= */}
        {/* Back link                                                         */}
        {/* ================================================================= */}
        <Link
          href="/groups"
          className="mb-12 inline-flex items-center gap-2 font-sans text-xs font-normal uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Groups
        </Link>

        {/* ================================================================= */}
        {/* Hero section                                                      */}
        {/* ================================================================= */}
        <div className="mb-16">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="border border-zinc-200 px-2.5 py-0.5 text-[10px] font-normal uppercase tracking-widest text-zinc-500">
              {group.status}
            </span>
            {group.minTierRequired && (
              <>
                <span className="text-zinc-300">/</span>
                <span className="flex items-center gap-1 text-xs font-normal text-zinc-500">
                  <Shield className="h-3 w-3" />
                  {group.minTierRequired}+
                </span>
              </>
            )}
            <span className="text-zinc-300">/</span>
            <span className="text-xs font-normal text-zinc-500">
              {group.carryPercent}% carry
            </span>
          </div>

          <h1 className="font-serif text-4xl font-light tracking-tight text-zinc-900 sm:text-5xl">
            {group.name}
          </h1>

          <p className="mt-4 font-sans text-base font-normal text-zinc-500">
            Led by{" "}
            <span className="text-zinc-600">{leadName}</span>
            {leadWallet && (
              <span className="ml-2 text-zinc-400">
                {leadWallet.slice(0, 6)}...{leadWallet.slice(-4)}
              </span>
            )}
          </p>

          <div className="mt-12 h-px w-full bg-zinc-200" />
        </div>

        {/* ================================================================= */}
        {/* Stats row                                                         */}
        {/* ================================================================= */}
        <div className="mb-16 grid grid-cols-2 gap-px border border-zinc-200 sm:grid-cols-4">
          <StatCell
            label="Members"
            value={`${group.memberCount}/${group.maxMembers}`}
          />
          <StatCell label="Deals" value={String(group.dealCount)} />
          <StatCell
            label="Total Raised"
            value={`$${formatLargeNumber(group.totalRaised)}`}
          />
          <StatCell
            label="Allocations"
            value={String(group.dealAllocations.length)}
          />
        </div>

        {/* ================================================================= */}
        {/* Two-column layout                                                 */}
        {/* ================================================================= */}
        <div className="flex flex-col gap-16 lg:flex-row">
          {/* Left Column */}
          <div className="flex flex-1 flex-col gap-16 lg:max-w-[58%]">
            {/* About */}
            <section>
              <h2 className="mb-8 font-serif text-2xl font-light text-zinc-800">
                About
              </h2>
              <div className="max-w-none">
                {group.description.split("\n").map((line, i) => {
                  if (line.startsWith("### ")) {
                    return (
                      <h3
                        key={i}
                        className="mb-3 mt-8 font-sans text-base font-medium text-zinc-700"
                      >
                        {line.replace("### ", "")}
                      </h3>
                    );
                  }
                  if (line.startsWith("- ")) {
                    return (
                      <div key={i} className="mb-3 flex gap-3">
                        <span className="mt-2 h-1 w-1 shrink-0 bg-zinc-400" />
                        <p className="font-sans text-sm font-normal leading-relaxed text-zinc-500">
                          {line.replace("- ", "")}
                        </p>
                      </div>
                    );
                  }
                  if (line.trim() === "") {
                    return <div key={i} className="h-3" />;
                  }
                  return (
                    <p
                      key={i}
                      className="mb-3 font-sans text-sm font-normal leading-relaxed text-zinc-500"
                    >
                      {line}
                    </p>
                  );
                })}
              </div>
            </section>

            {/* Active Deals */}
            {activeDeals.length > 0 && (
              <section>
                <h2 className="mb-8 font-serif text-2xl font-light text-zinc-800">
                  Active Deals
                </h2>
                <div className="flex flex-col gap-px border border-zinc-200">
                  {activeDeals.map((da) => {
                    const allocated = Number(da.allocatedAmount) || 0;
                    const filled = Number(da.filledAmount) || 0;
                    const progress =
                      allocated > 0 ? (filled / allocated) * 100 : 0;

                    return (
                      <div
                        key={da.id}
                        className="border-b border-zinc-200 p-8 last:border-0"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <Link
                              href={`/deals/${da.deal.slug}`}
                              className="font-sans text-sm font-medium text-zinc-800 transition-colors hover:text-zinc-900"
                            >
                              {da.deal.title}
                            </Link>
                            <p className="mt-1 text-xs font-normal uppercase tracking-widest text-zinc-400">
                              {da.deal.category}
                            </p>
                          </div>
                          <span className="border border-zinc-200 px-2.5 py-1 text-[10px] font-normal uppercase tracking-widest text-zinc-500">
                            {da.deal.status === "REGISTRATION_OPEN"
                              ? "Registration"
                              : da.deal.status === "GUARANTEED_ALLOCATION"
                                ? "Active"
                                : da.deal.status === "FCFS"
                                  ? "FCFS"
                                  : da.deal.status}
                          </span>
                        </div>

                        <div className="mb-4 grid grid-cols-3 gap-6">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
                              Allocation
                            </span>
                            <span className="font-serif text-sm font-normal text-zinc-700">
                              {formatCurrency(allocated)}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
                              Filled
                            </span>
                            <span className="font-serif text-sm font-normal text-zinc-700">
                              {formatCurrency(filled)}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
                              Token Price
                            </span>
                            <span className="font-serif text-sm font-normal text-zinc-700">
                              {formatCurrency(da.deal.tokenPrice)}
                            </span>
                          </div>
                        </div>

                        <div className="h-1 w-full bg-zinc-200">
                          <div
                            className="h-full bg-zinc-500 transition-all"
                            style={{
                              width: `${Math.min(progress, 100)}%`,
                            }}
                          />
                        </div>
                        <p className="mt-2 text-right text-[10px] font-normal text-zinc-400">
                          {progress.toFixed(0)}% filled
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Past Deals */}
            {pastDeals.length > 0 && (
              <section>
                <h2 className="mb-8 font-serif text-2xl font-light text-zinc-800">
                  Past Deals
                </h2>
                <div className="border border-zinc-200">
                  <div className="grid grid-cols-4 gap-4 border-b border-zinc-200 px-8 py-4">
                    <span className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
                      Deal
                    </span>
                    <span className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
                      Allocated
                    </span>
                    <span className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
                      Filled
                    </span>
                    <span className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
                      Status
                    </span>
                  </div>
                  {pastDeals.map((da) => (
                    <div
                      key={da.id}
                      className="grid grid-cols-4 gap-4 border-b border-zinc-200 px-8 py-4 last:border-0"
                    >
                      <Link
                        href={`/deals/${da.deal.slug}`}
                        className="font-sans text-sm font-normal text-zinc-700 transition-colors hover:text-zinc-900"
                      >
                        {da.deal.title}
                      </Link>
                      <span className="font-sans text-sm font-normal text-zinc-500">
                        {formatCurrency(Number(da.allocatedAmount))}
                      </span>
                      <span className="font-sans text-sm font-normal text-zinc-500">
                        {formatCurrency(Number(da.filledAmount))}
                      </span>
                      <span className="text-xs font-normal text-zinc-500">
                        {da.deal.status === "COMPLETED"
                          ? "Completed"
                          : da.deal.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* No deals */}
            {activeDeals.length === 0 && pastDeals.length === 0 && (
              <section>
                <h2 className="mb-8 font-serif text-2xl font-light text-zinc-800">
                  Deals
                </h2>
                <div className="flex flex-col items-center justify-center border border-dashed border-zinc-200 px-8 py-16 text-center">
                  <FileText className="mb-4 h-6 w-6 text-zinc-300" />
                  <p className="font-sans text-sm font-normal text-zinc-500">
                    No deals presented to this group yet.
                  </p>
                </div>
              </section>
            )}
          </div>

          {/* Right Column (sidebar) */}
          <div className="flex flex-col gap-10 lg:w-[38%]">
            <div className="flex flex-col gap-10 lg:sticky lg:top-8">
              {/* Join This Group */}
              <div className="border border-zinc-200 p-8">
                <h3 className="mb-6 text-xs font-normal uppercase tracking-widest text-zinc-500">
                  Join This Group
                </h3>

                <div className="mb-6 flex flex-col gap-0">
                  <RequirementRow
                    label="Minimum Tier"
                    value={group.minTierRequired || "None"}
                  />
                  <RequirementRow
                    label="KYC Verification"
                    value="Required"
                  />
                  <RequirementRow
                    label="Application"
                    value={
                      group.requiresApplication ? "Required" : "Open Entry"
                    }
                  />
                  <RequirementRow
                    label="Capacity"
                    value={`${group.maxMembers - group.memberCount} spots left`}
                  />
                </div>

                <div className="mb-6">
                  <div className="mb-2 flex items-center justify-between text-[10px] font-normal uppercase tracking-widest text-zinc-400">
                    <span>{group.memberCount} members</span>
                    <span>{group.maxMembers} max</span>
                  </div>
                  <div className="h-1 w-full bg-zinc-200">
                    <div
                      className="h-full bg-zinc-500 transition-all"
                      style={{
                        width: `${Math.min(fillPercent, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {joinMessage && (
                  <p className="mb-6 text-center font-sans text-sm font-normal text-zinc-500">
                    {joinMessage}
                  </p>
                )}

                <button
                  className="w-full bg-violet-500 py-3 font-sans text-sm font-normal text-white transition-colors hover:bg-violet-400 disabled:opacity-50"
                  onClick={handleJoinGroup}
                  disabled={
                    joinLoading || group.memberCount >= group.maxMembers
                  }
                >
                  {joinLoading
                    ? "Submitting..."
                    : group.memberCount >= group.maxMembers
                      ? "Group Full"
                      : group.requiresApplication
                        ? "Apply to Join"
                        : "Request to Join"}
                </button>

                <p className="mt-4 text-center text-[10px] font-normal text-zinc-400">
                  {group.carryPercent}% carry fee applies to follower profits
                </p>
              </div>

              {/* Lead Info */}
              <div className="border border-zinc-200 p-8">
                <h3 className="mb-6 text-xs font-normal uppercase tracking-widest text-zinc-500">
                  Lead Investor
                </h3>

                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-zinc-200 font-sans text-sm font-normal text-zinc-500">
                    {leadName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="font-sans text-sm font-medium text-zinc-800">
                      {leadName}
                    </p>
                    {leadWallet && (
                      <p className="text-xs font-normal text-zinc-400">
                        {leadWallet.slice(0, 6)}...{leadWallet.slice(-4)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-px border border-zinc-200">
                  <div className="flex flex-col items-center border border-zinc-200 p-4">
                    <span className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
                      Deals Led
                    </span>
                    <span className="mt-1 font-serif text-lg font-light text-zinc-800">
                      {group.dealCount}
                    </span>
                  </div>
                  <div className="flex flex-col items-center border border-zinc-200 p-4">
                    <span className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
                      Total Raised
                    </span>
                    <span className="mt-1 font-serif text-lg font-light text-zinc-800">
                      ${formatLargeNumber(group.totalRaised)}
                    </span>
                  </div>
                  <div className="flex flex-col items-center border border-zinc-200 p-4">
                    <span className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
                      Members
                    </span>
                    <span className="mt-1 font-serif text-lg font-light text-zinc-800">
                      {group.memberCount}
                    </span>
                  </div>
                  <div className="flex flex-col items-center border border-zinc-200 p-4">
                    <span className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
                      Carry
                    </span>
                    <span className="mt-1 font-serif text-lg font-light text-zinc-800">
                      {group.carryPercent}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Members Preview */}
              <div className="border border-zinc-200 p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-xs font-normal uppercase tracking-widest text-zinc-500">
                    Members
                  </h3>
                  <span className="font-sans text-xs font-normal text-zinc-400">
                    {group.memberCount} total
                  </span>
                </div>

                <div className="flex flex-col gap-0">
                  {membersPreview.map((member) => {
                    const memberName =
                      member.user.displayName || "Anonymous";
                    const memberWallet = member.user.walletAddress
                      ? `${member.user.walletAddress.slice(0, 6)}...${member.user.walletAddress.slice(-4)}`
                      : "";

                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-4 border-b border-zinc-200 py-4 last:border-0"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-zinc-200 font-sans text-[10px] font-normal text-zinc-500">
                          {memberName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-sans text-sm font-normal text-zinc-700">
                            {memberName}
                          </p>
                          <p className="text-[10px] font-normal text-zinc-400">
                            {memberWallet}
                          </p>
                        </div>
                        <span className="border border-zinc-200 px-2 py-0.5 text-[10px] font-normal uppercase tracking-widest text-zinc-500">
                          {ROLE_LABELS[member.role] || member.role}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {approvedMembers.length > membersPreview.length && (
                  <p className="mt-4 text-center text-[10px] font-normal text-zinc-400">
                    and {approvedMembers.length - membersPreview.length} more
                    members
                  </p>
                )}

                {approvedMembers.length === 0 && (
                  <p className="py-6 text-center text-xs font-normal text-zinc-400">
                    No approved members yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5 border border-zinc-200 p-5">
      <span className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
        {label}
      </span>
      <span className="font-serif text-lg font-light text-zinc-800">
        {value}
      </span>
    </div>
  );
}

function RequirementRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-200 py-4 last:border-0">
      <span className="font-sans text-sm font-normal text-zinc-500">
        {label}
      </span>
      <span className="font-sans text-sm font-medium text-zinc-800">
        {value}
      </span>
    </div>
  );
}
