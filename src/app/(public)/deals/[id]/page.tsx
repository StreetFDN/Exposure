"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import {
  ArrowLeft,
  Globe,
  MessageCircle,
  Send,
  Github,
  ExternalLink,
  Users,
  FileText,
  Shield,
  Download,
  Linkedin,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Countdown } from "@/components/ui/countdown";
import { DealPhaseIndicator } from "@/components/deals/deal-phase-indicator";
import { ContributionForm } from "@/components/deals/contribution-form";
import { ParticipationFlow } from "@/components/deals/participation-flow";
import { DealStats } from "@/components/deals/deal-stats";
import { TokenomicsChart } from "@/components/charts/tokenomics-chart";
import { VestingTimeline } from "@/components/charts/vesting-timeline";
import { ContributionProgress } from "@/components/charts/contribution-progress";
import { formatCurrency, formatLargeNumber } from "@/lib/utils/format";
import type { Phase } from "@/components/deals/deal-phase-indicator";

// ---------------------------------------------------------------------------
// Types for the API response
// ---------------------------------------------------------------------------

interface DealData {
  id: string;
  slug: string;
  projectName: string;
  title: string;
  status: string;
  category: string;
  chain: string;
  description: string;
  shortDescription: string | null;
  projectWebsite: string | null;
  projectTwitter: string | null;
  projectDiscord: string | null;
  projectTelegram: string | null;
  projectGithub: string | null;
  tokenPrice: string;
  totalRaise: string;
  totalRaised: string;
  hardCap: string;
  softCap: string | null;
  fdv: string | null;
  minContribution: string;
  maxContribution: string;
  contributorCount: number;
  allocationMethod: string;
  distributionTokenSymbol: string | null;
  raiseTokenSymbol: string | null;
  tgeUnlockPercent: string;
  vestingCliffDays: number;
  vestingDurationDays: number;
  vestingType: string;
  minTierRequired: string | null;
  requiresKyc: boolean;
  requiresAccreditation: boolean;
  registrationOpenAt: string | null;
  registrationCloseAt: string | null;
  contributionOpenAt: string | null;
  contributionCloseAt: string | null;
  distributionAt: string | null;
  pitchDeckUrl: string | null;
  whitepaperUrl: string | null;
  auditReportUrl: string | null;
  teamMembers: TeamMember[] | null;
  featuredImageUrl: string | null;
  bannerImageUrl: string | null;
  isFeatured: boolean;
  phases: DealPhase[];
  contributionStats: {
    totalContributed: string;
    totalContributors: number;
    averageContribution: string;
    percentRaised: number;
  };
  allocationCount: number;
}

interface TeamMember {
  name: string;
  role: string;
  avatar: string | null;
  linkedin: string | null;
}

interface DealPhase {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  phaseOrder: number;
  status: string;
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "info" | "outline" }
> = {
  DRAFT: { label: "Draft", variant: "outline" },
  UNDER_REVIEW: { label: "Under Review", variant: "outline" },
  APPROVED: { label: "Upcoming", variant: "outline" },
  REGISTRATION_OPEN: { label: "Registration Open", variant: "outline" },
  GUARANTEED_ALLOCATION: { label: "Guaranteed", variant: "outline" },
  FCFS: { label: "FCFS", variant: "outline" },
  SETTLEMENT: { label: "Settlement", variant: "outline" },
  DISTRIBUTING: { label: "Distributing", variant: "outline" },
  COMPLETED: { label: "Completed", variant: "outline" },
  CANCELLED: { label: "Cancelled", variant: "outline" },
};

const CATEGORY_LABELS: Record<string, string> = {
  DEFI: "DeFi",
  GAMING: "Gaming",
  AI: "AI",
  INFRASTRUCTURE: "Infra",
  NFT: "NFT",
  SOCIAL: "Social",
  OTHER: "Other",
};

const CHAIN_LABELS: Record<string, string> = {
  ETHEREUM: "Ethereum",
  BASE: "Base",
  ARBITRUM: "Arbitrum",
};

// ---------------------------------------------------------------------------
// Default tokenomics data (used when deal doesn't include it)
// ---------------------------------------------------------------------------

const DEFAULT_TOKENOMICS_DATA = [
  { name: "Public Sale", value: 20, color: "#71717a" },
  { name: "Team", value: 30, color: "#52525b" },
  { name: "Ecosystem", value: 15, color: "#3f3f46" },
  { name: "Liquidity", value: 20, color: "#a1a1aa" },
  { name: "Reserve", value: 15, color: "#d4d4d8" },
];

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function DealDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 animate-pulse">
      <div className="mb-8">
        <div className="mb-4 h-4 w-20 rounded bg-zinc-800" />
        <div className="mb-3 flex gap-2">
          <div className="h-5 w-16 rounded bg-zinc-800" />
          <div className="h-5 w-12 rounded bg-zinc-800" />
          <div className="h-5 w-16 rounded bg-zinc-800" />
        </div>
        <div className="h-9 w-64 rounded bg-zinc-800" />
        <div className="mt-2 h-5 w-96 rounded bg-zinc-800" />
        <div className="mt-4 flex gap-2">
          <div className="h-8 w-24 rounded bg-zinc-800" />
          <div className="h-8 w-24 rounded bg-zinc-800" />
        </div>
      </div>
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex flex-1 flex-col gap-8 lg:max-w-[60%]">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 h-6 w-20 rounded bg-zinc-800" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-zinc-800" />
              <div className="h-4 w-5/6 rounded bg-zinc-800" />
              <div className="h-4 w-4/6 rounded bg-zinc-800" />
              <div className="h-4 w-full rounded bg-zinc-800" />
              <div className="h-4 w-3/4 rounded bg-zinc-800" />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-6 lg:w-[40%]">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 h-6 w-32 rounded bg-zinc-800" />
            <div className="h-4 w-full rounded bg-zinc-800" />
            <div className="mt-4 h-20 w-full rounded bg-zinc-800" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper: map API phases to Phase type
// ---------------------------------------------------------------------------

function mapApiPhasesToPhases(phases: DealPhase[]): Phase[] {
  const now = Date.now();
  return phases.map((p) => {
    const start = new Date(p.startsAt).getTime();
    const end = new Date(p.endsAt).getTime();
    let status: "completed" | "active" | "upcoming";
    if (now > end) {
      status = "completed";
    } else if (now >= start && now <= end) {
      status = "active";
    } else {
      status = "upcoming";
    }
    return {
      id: p.id,
      name: p.name,
      startsAt: p.startsAt,
      endsAt: p.endsAt,
      status,
    };
  });
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function DealDetailPage() {
  const params = useParams();
  const dealId = params.id as string;

  const [deal, setDeal] = React.useState<DealData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showParticipation, setShowParticipation] = React.useState(false);

  // Fetch deal data
  React.useEffect(() => {
    async function fetchDeal() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/deals/${dealId}`);

        if (res.status === 404) {
          setError("NOT_FOUND");
          return;
        }

        if (!res.ok) {
          throw new Error(`Failed to fetch deal (${res.status})`);
        }

        const json = await res.json();

        if (!json.success) {
          throw new Error(json.error || "Failed to fetch deal");
        }

        const d = json.data.deal;

        // Normalize field types from API (Decimals come as strings from Prisma JSON serialization)
        const dealData: DealData = {
          id: d.id,
          slug: d.slug,
          projectName: d.projectName,
          title: d.title,
          status: d.status,
          category: d.category,
          chain: d.chain,
          description: d.description || "",
          shortDescription: d.shortDescription ?? null,
          projectWebsite: d.projectWebsite ?? null,
          projectTwitter: d.projectTwitter ?? null,
          projectDiscord: d.projectDiscord ?? null,
          projectTelegram: d.projectTelegram ?? null,
          projectGithub: d.projectGithub ?? null,
          tokenPrice: String(d.tokenPrice),
          totalRaise: String(d.totalRaise),
          totalRaised: String(d.totalRaised),
          hardCap: String(d.hardCap),
          softCap: d.softCap != null ? String(d.softCap) : null,
          fdv: d.fdv != null ? String(d.fdv) : null,
          minContribution: String(d.minContribution ?? "0"),
          maxContribution: String(d.maxContribution ?? "0"),
          contributorCount: d.contributorCount ?? 0,
          allocationMethod: d.allocationMethod,
          distributionTokenSymbol: d.distributionTokenSymbol ?? null,
          raiseTokenSymbol: d.raiseTokenSymbol ?? null,
          tgeUnlockPercent: String(d.tgeUnlockPercent ?? "0"),
          vestingCliffDays: d.vestingCliffDays ?? 0,
          vestingDurationDays: d.vestingDurationDays ?? 0,
          vestingType: d.vestingType ?? "LINEAR",
          minTierRequired: d.minTierRequired ?? null,
          requiresKyc: d.requiresKyc ?? true,
          requiresAccreditation: d.requiresAccreditation ?? false,
          registrationOpenAt: d.registrationOpenAt ?? null,
          registrationCloseAt: d.registrationCloseAt ?? null,
          contributionOpenAt: d.contributionOpenAt ?? null,
          contributionCloseAt: d.contributionCloseAt ?? null,
          distributionAt: d.distributionAt ?? null,
          pitchDeckUrl: d.pitchDeckUrl ?? null,
          whitepaperUrl: d.whitepaperUrl ?? null,
          auditReportUrl: d.auditReportUrl ?? null,
          teamMembers: Array.isArray(d.teamMembers) ? d.teamMembers : null,
          featuredImageUrl: d.featuredImageUrl ?? null,
          bannerImageUrl: d.bannerImageUrl ?? null,
          isFeatured: d.isFeatured ?? false,
          phases: Array.isArray(d.phases) ? d.phases : [],
          contributionStats: d.contributionStats ?? {
            totalContributed: "0",
            totalContributors: 0,
            averageContribution: "0",
            percentRaised: 0,
          },
          allocationCount: d.allocationCount ?? 0,
        };

        setDeal(dealData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }

    if (dealId) fetchDeal();
  }, [dealId]);

  // Loading state
  if (isLoading) {
    return <DealDetailSkeleton />;
  }

  // Not found state
  if (error === "NOT_FOUND") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl font-light text-zinc-100">Deal not found</h1>
        <p className="mt-2 text-zinc-500">The deal you are looking for does not exist or has been removed.</p>
        <Link href="/deals" className="mt-6 inline-block">
          <Button variant="outline">Back to Deals</Button>
        </Link>
      </div>
    );
  }

  // Error state
  if (error || !deal) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl font-light text-zinc-100">Something went wrong</h1>
        <p className="mt-2 text-zinc-500">{error || "Failed to load deal data."}</p>
        <Link href="/deals" className="mt-6 inline-block">
          <Button variant="outline">Back to Deals</Button>
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[deal.status] || STATUS_CONFIG.DRAFT;

  const isContributionPhase =
    deal.status === "GUARANTEED_ALLOCATION" || deal.status === "FCFS";
  const isRegistrationPhase = deal.status === "REGISTRATION_OPEN";
  const isUpcoming = deal.status === "APPROVED";
  const isCompleted =
    deal.status === "COMPLETED" || deal.status === "DISTRIBUTING";

  // Map API phases or build from deal dates
  const phases: Phase[] =
    deal.phases.length > 0
      ? mapApiPhasesToPhases(deal.phases)
      : buildPhasesFromDeal(deal);

  const tokenSymbol = deal.distributionTokenSymbol || "TOKEN";
  const raiseSymbol = deal.raiseTokenSymbol || "USDC";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* ================================================================= */}
      {/* Top section                                                       */}
      {/* ================================================================= */}
      <div className="mb-8">
        {/* Back link */}
        <Link
          href="/deals"
          className="mb-4 inline-flex items-center gap-1 text-sm font-light text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <ArrowLeft className="h-4 w-4" />
          All Deals
        </Link>

        {/* Badges */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-zinc-800 px-2 py-0.5 text-[11px] font-light text-zinc-400">
            {statusConfig.label}
          </span>
          <span className="rounded-md border border-zinc-800 px-2 py-0.5 text-[11px] font-light text-zinc-400">
            {CATEGORY_LABELS[deal.category] || deal.category}
          </span>
          <span className="rounded-md border border-zinc-800 px-2 py-0.5 text-[11px] font-light text-zinc-400">
            {CHAIN_LABELS[deal.chain] || deal.chain}
          </span>
          {deal.requiresKyc && (
            <span className="inline-flex items-center gap-1 rounded-md border border-zinc-800 px-2 py-0.5 text-[11px] font-light text-zinc-400">
              <Shield className="h-3 w-3" />
              KYC Required
            </span>
          )}
          {deal.minTierRequired && (
            <span className="rounded-md border border-zinc-800 px-2 py-0.5 text-[11px] font-light text-zinc-400">
              {deal.minTierRequired} Tier
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="font-serif text-3xl font-light text-zinc-100 sm:text-4xl">
          {deal.projectName}
        </h1>
        <p className="mt-2 text-lg font-light text-zinc-500">{deal.shortDescription}</p>

        {/* Project links */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {deal.projectWebsite && (
            <LinkButton href={deal.projectWebsite} icon={<Globe className="h-4 w-4" />} label="Website" />
          )}
          {deal.projectTwitter && (
            <LinkButton href={deal.projectTwitter} icon={<ExternalLink className="h-4 w-4" />} label="Twitter" />
          )}
          {deal.projectDiscord && (
            <LinkButton href={deal.projectDiscord} icon={<MessageCircle className="h-4 w-4" />} label="Discord" />
          )}
          {deal.projectTelegram && (
            <LinkButton href={deal.projectTelegram} icon={<Send className="h-4 w-4" />} label="Telegram" />
          )}
          {deal.projectGithub && (
            <LinkButton href={deal.projectGithub} icon={<Github className="h-4 w-4" />} label="GitHub" />
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* Two-column layout                                                 */}
      {/* ================================================================= */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* =============================================================== */}
        {/* Left Column (content)                                           */}
        {/* =============================================================== */}
        <div className="flex flex-1 flex-col gap-8 lg:max-w-[60%]">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert prose-sm max-w-none">
                {deal.description.split("\n").map((line, i) => {
                  if (line.startsWith("## ")) {
                    return (
                      <h2
                        key={i}
                        className="mb-3 mt-6 font-serif text-xl font-light text-zinc-100"
                      >
                        {line.replace("## ", "")}
                      </h2>
                    );
                  }
                  if (line.startsWith("### ")) {
                    return (
                      <h3
                        key={i}
                        className="mb-2 mt-5 text-lg font-medium text-zinc-200"
                      >
                        {line.replace("### ", "")}
                      </h3>
                    );
                  }
                  if (line.startsWith("- **")) {
                    const match = line.match(/- \*\*(.+?)\*\*: (.+)/);
                    if (match) {
                      return (
                        <div key={i} className="mb-2 flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600" />
                          <p className="text-sm text-zinc-300">
                            <strong className="text-zinc-50">
                              {match[1]}
                            </strong>
                            : {match[2]}
                          </p>
                        </div>
                      );
                    }
                  }
                  if (line.startsWith("- ")) {
                    return (
                      <div key={i} className="mb-2 flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600" />
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

          {/* Tokenomics */}
          <Card>
            <CardHeader>
              <CardTitle>Tokenomics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-3">
                  <TokenomicRow
                    label="Token Name"
                    value={tokenSymbol}
                  />
                  <TokenomicRow
                    label="Ticker"
                    value={`$${tokenSymbol}`}
                  />
                  <TokenomicRow
                    label="Token Price"
                    value={formatCurrency(deal.tokenPrice)}
                  />
                  {deal.fdv && (
                    <TokenomicRow
                      label="FDV"
                      value={`$${formatLargeNumber(deal.fdv)}`}
                    />
                  )}
                </div>

                {/* Tokenomics donut chart */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <TokenomicsChart data={DEFAULT_TOKENOMICS_DATA} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vesting */}
          <Card>
            <CardHeader>
              <CardTitle>Vesting Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                {/* Visual timeline */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
                  <VestingBlock
                    label="TGE Unlock"
                    value={`${deal.tgeUnlockPercent}%`}
                    sublabel="At token generation event"
                    active
                  />
                  <div className="hidden h-0.5 flex-1 self-center bg-zinc-700 sm:block" />
                  <VestingBlock
                    label="Cliff Period"
                    value={`${deal.vestingCliffDays} days`}
                    sublabel="No tokens released"
                  />
                  <div className="hidden h-0.5 flex-1 self-center bg-zinc-700 sm:block" />
                  <VestingBlock
                    label="Vesting Duration"
                    value={`${deal.vestingDurationDays} days`}
                    sublabel="Linear daily release"
                  />
                </div>

                {/* Progress visual */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
                    <span>TGE ({deal.tgeUnlockPercent}%)</span>
                    <span>Cliff ({deal.vestingCliffDays}d)</span>
                    <span>
                      Full Vest ({deal.vestingDurationDays}d)
                    </span>
                  </div>
                  <div className="flex h-3 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="bg-zinc-400"
                      style={{
                        width: `${parseFloat(deal.tgeUnlockPercent)}%`,
                      }}
                    />
                    <div
                      className="bg-zinc-700"
                      style={{
                        width: `${deal.vestingDurationDays > 0 ? (deal.vestingCliffDays / deal.vestingDurationDays) * (100 - parseFloat(deal.tgeUnlockPercent)) : 0}%`,
                      }}
                    />
                    <div className="flex-1 bg-zinc-500" />
                  </div>
                </div>

                {/* Vesting timeline chart */}
                <VestingTimeline
                  schedule={{
                    tgeUnlock: parseFloat(deal.tgeUnlockPercent),
                    cliffMonths: Math.round(deal.vestingCliffDays / 30),
                    vestingMonths: Math.round(deal.vestingDurationDays / 30),
                    totalAmount: parseFloat(deal.totalRaise) * 0.2,
                    claimed: 0,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Team */}
          {deal.teamMembers && deal.teamMembers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Team</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {deal.teamMembers.map((member) => (
                    <div
                      key={member.name}
                      className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3"
                    >
                      {/* Avatar placeholder */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-300">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-50">
                          {member.name}
                        </p>
                        <p className="text-xs text-zinc-400">{member.role}</p>
                      </div>
                      {member.linkedin && (
                        <a
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                        >
                          <Linkedin className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {(deal.pitchDeckUrl || deal.whitepaperUrl || deal.auditReportUrl) && (
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  {deal.pitchDeckUrl && (
                    <DocumentCard
                      title="Pitch Deck"
                      description="Project overview and business plan"
                      href={deal.pitchDeckUrl}
                      icon={<FileText className="h-5 w-5" />}
                    />
                  )}
                  {deal.whitepaperUrl && (
                    <DocumentCard
                      title="Whitepaper"
                      description="Technical documentation"
                      href={deal.whitepaperUrl}
                      icon={<FileText className="h-5 w-5" />}
                    />
                  )}
                  {deal.auditReportUrl && (
                    <DocumentCard
                      title="Audit Report"
                      description="Smart contract security audit"
                      href={deal.auditReportUrl}
                      icon={<Shield className="h-5 w-5" />}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* =============================================================== */}
        {/* Right Column (sidebar)                                          */}
        {/* =============================================================== */}
        <div className="flex flex-col gap-6 lg:w-[40%]">
          <div className="lg:sticky lg:top-8 flex flex-col gap-6">
            {/* Raise Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle>Raise Progress</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {/* Contribution progress bar */}
                <ContributionProgress
                  raised={parseFloat(deal.totalRaised)}
                  softCap={deal.softCap ? parseFloat(deal.softCap) : 0}
                  hardCap={parseFloat(deal.hardCap)}
                />

                {/* Contributors */}
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Users className="h-4 w-4" />
                  <span>
                    {deal.contributorCount.toLocaleString()} contributors
                  </span>
                </div>

                {/* Countdown */}
                {deal.contributionCloseAt && (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                    <Countdown
                      targetDate={deal.contributionCloseAt}
                      label="Ends in"
                    />
                  </div>
                )}

                {/* Phase indicator */}
                {phases.length > 0 && (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                    <DealPhaseIndicator phases={phases} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contribution / CTA Card */}
            {showParticipation ? (
              <ParticipationFlow
                dealName={deal.projectName}
                roundType="Public Round"
                allocationMethod={deal.allocationMethod.replace("_", " ")}
                tokenSymbol={tokenSymbol}
                raiseTokenSymbol={raiseSymbol}
                tokenPrice={parseFloat(deal.tokenPrice)}
                minContribution={parseFloat(deal.minContribution)}
                maxContribution={parseFloat(deal.maxContribution)}
                walletBalance={0}
                guaranteedAllocation={0}
                userTier="None"
                tierMultiplier="1x"
                onClose={() => setShowParticipation(false)}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {isContributionPhase
                      ? "Contribute"
                      : isRegistrationPhase
                        ? "Register"
                        : isUpcoming
                          ? "Coming Soon"
                          : "Deal Status"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isContributionPhase && (
                    <div className="flex flex-col gap-4">
                      <ContributionForm
                        minContribution={parseFloat(deal.minContribution)}
                        maxContribution={parseFloat(deal.maxContribution)}
                        walletBalance={0}
                        tokenPrice={parseFloat(deal.tokenPrice)}
                        tokenSymbol={tokenSymbol}
                        raiseTokenSymbol={raiseSymbol}
                      />
                      <div className="border-t border-zinc-800 pt-4">
                        <Button
                          variant="secondary"
                          size="lg"
                          className="w-full"
                          onClick={() => setShowParticipation(true)}
                        >
                          Full Participation Flow
                        </Button>
                      </div>
                    </div>
                  )}

                  {isRegistrationPhase && (
                    <div className="flex flex-col items-center gap-4 py-4 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
                        <Clock className="h-7 w-7 text-zinc-400" />
                      </div>
                      <p className="text-sm text-zinc-400">
                        Register your interest to receive a guaranteed allocation
                        when contributions open.
                      </p>
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/deals/${deal.id}/register`, {
                              method: "POST",
                            });
                            const json = await res.json();
                            if (json.success) {
                              setShowParticipation(true);
                            } else {
                              alert(json.error || "Registration failed");
                            }
                          } catch {
                            alert("Failed to register. Please sign in first.");
                          }
                        }}
                      >
                        Register Interest
                      </Button>
                    </div>
                  )}

                  {isUpcoming && (
                    <div className="flex flex-col items-center gap-4 py-4 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
                        <Clock className="h-7 w-7 text-zinc-400" />
                      </div>
                      <p className="text-sm text-zinc-400">
                        This deal has not opened yet. Registration starts soon.
                      </p>
                      {deal.registrationOpenAt && (
                        <Countdown
                          targetDate={deal.registrationOpenAt}
                          label="Opens in"
                        />
                      )}
                    </div>
                  )}

                  {isCompleted && (
                    <div className="flex flex-col items-center gap-4 py-4 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
                        <CheckCircle2 className="h-7 w-7 text-zinc-400" />
                      </div>
                      <p className="text-sm font-medium text-zinc-300">
                        This deal has ended
                      </p>
                      <div className="grid w-full grid-cols-2 gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-zinc-500">Raised</span>
                          <span className="text-sm font-semibold text-zinc-50">
                            {formatCurrency(deal.totalRaised)}
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-zinc-500">
                            Contributors
                          </span>
                          <span className="text-sm font-semibold text-zinc-50">
                            {deal.contributorCount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Deal Stats */}
            <DealStats
              stats={{
                tokenPrice: deal.tokenPrice,
                totalRaise: deal.totalRaise,
                hardCap: deal.hardCap,
                fdv: deal.fdv ?? undefined,
                tgeUnlockPercent: deal.tgeUnlockPercent,
                vestingDurationDays: deal.vestingDurationDays,
                allocationMethod: deal.allocationMethod,
                minTierRequired: deal.minTierRequired ?? undefined,
              }}
            />

            {/* Deal Details */}
            <Card>
              <CardHeader>
                <CardTitle>Deal Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <DetailRow
                    label="Min Contribution"
                    value={formatCurrency(deal.minContribution)}
                  />
                  <DetailRow
                    label="Max Contribution"
                    value={formatCurrency(deal.maxContribution)}
                  />
                  <DetailRow
                    label="Allocation Method"
                    value={deal.allocationMethod.replace("_", " ")}
                  />
                  <DetailRow
                    label="KYC Required"
                    value={deal.requiresKyc ? "Yes" : "No"}
                  />
                  <DetailRow
                    label="Min Tier"
                    value={deal.minTierRequired ?? "None"}
                  />
                  <DetailRow
                    label="Accreditation"
                    value={deal.requiresAccreditation ? "Required" : "Not Required"}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper: build phases from deal dates when API phases are empty
// ---------------------------------------------------------------------------

function buildPhasesFromDeal(deal: DealData): Phase[] {
  const now = Date.now();
  const phases: Phase[] = [];

  if (deal.registrationOpenAt && deal.registrationCloseAt) {
    const start = new Date(deal.registrationOpenAt).getTime();
    const end = new Date(deal.registrationCloseAt).getTime();
    phases.push({
      id: "registration",
      name: "Registration",
      startsAt: deal.registrationOpenAt,
      endsAt: deal.registrationCloseAt,
      status: now > end ? "completed" : now >= start ? "active" : "upcoming",
    });
  }

  if (deal.contributionOpenAt && deal.contributionCloseAt) {
    const start = new Date(deal.contributionOpenAt).getTime();
    const end = new Date(deal.contributionCloseAt).getTime();
    phases.push({
      id: "contribution",
      name: "Contribution",
      startsAt: deal.contributionOpenAt,
      endsAt: deal.contributionCloseAt,
      status: now > end ? "completed" : now >= start ? "active" : "upcoming",
    });
  }

  if (deal.contributionCloseAt && deal.distributionAt) {
    const start = new Date(deal.contributionCloseAt).getTime();
    const end = new Date(deal.distributionAt).getTime();
    phases.push({
      id: "distribution",
      name: "Distribution",
      startsAt: deal.contributionCloseAt,
      endsAt: deal.distributionAt,
      status: now > end ? "completed" : now >= start ? "active" : "upcoming",
    });
  }

  return phases;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LinkButton({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-50"
    >
      {icon}
      {label}
    </a>
  );
}

function TokenomicRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800 pb-2 last:border-0">
      <span className="text-sm text-zinc-400">{label}</span>
      <span className="text-sm font-medium text-zinc-50">{value}</span>
    </div>
  );
}

function VestingBlock({
  label,
  value,
  sublabel,
  active,
}: {
  label: string;
  value: string;
  sublabel: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg border p-4 text-center",
        active
          ? "border-zinc-600 bg-zinc-900/50"
          : "border-zinc-800 bg-zinc-950"
      )}
    >
      <span className="text-xs text-zinc-500">{label}</span>
      <span
        className={cn(
          "font-serif text-xl font-light",
          active ? "text-zinc-100" : "text-zinc-200"
        )}
      >
        {value}
      </span>
      <span className="text-[11px] text-zinc-600">{sublabel}</span>
    </div>
  );
}

function DocumentCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string | null;
  icon: React.ReactNode;
}) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
    >
      <div className="flex items-center gap-2 text-zinc-400">
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className="text-xs text-zinc-500">{description}</p>
      <div className="flex items-center gap-1 text-xs text-zinc-400">
        <Download className="h-3 w-3" />
        Download
      </div>
    </a>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-400">{label}</span>
      {typeof value === "string" ? (
        <span className="text-sm font-medium text-zinc-50">{value}</span>
      ) : (
        value
      )}
    </div>
  );
}
