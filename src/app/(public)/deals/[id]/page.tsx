"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/ui/countdown";
import { DealPhaseIndicator } from "@/components/deals/deal-phase-indicator";
import { ContributionForm } from "@/components/deals/contribution-form";
import { ParticipationFlow } from "@/components/deals/participation-flow";
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
// Status / label helpers
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Upcoming",
  REGISTRATION_OPEN: "Registration Open",
  GUARANTEED_ALLOCATION: "Guaranteed",
  FCFS: "FCFS",
  SETTLEMENT: "Settlement",
  DISTRIBUTING: "Distributing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
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

const ALLOCATION_LABELS: Record<string, string> = {
  GUARANTEED: "Guaranteed",
  PRO_RATA: "Pro-Rata",
  LOTTERY: "Lottery",
  FCFS: "FCFS",
  HYBRID: "Hybrid",
};

// ---------------------------------------------------------------------------
// Default tokenomics
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
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-24 animate-pulse">
        <div className="mb-12 h-4 w-20 bg-zinc-200" />
        <div className="mb-16">
          <div className="mb-3 h-3 w-32 bg-zinc-200" />
          <div className="mb-4 h-10 w-80 bg-zinc-200" />
          <div className="h-5 w-96 bg-zinc-200" />
        </div>
        <div className="flex flex-col gap-16 lg:flex-row">
          <div className="flex flex-1 flex-col gap-12 lg:max-w-[58%]">
            <div className="border border-zinc-200 p-8">
              <div className="mb-6 h-5 w-24 bg-zinc-200" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-zinc-200" />
                <div className="h-4 w-5/6 bg-zinc-200" />
                <div className="h-4 w-4/6 bg-zinc-200" />
                <div className="h-4 w-full bg-zinc-200" />
                <div className="h-4 w-3/4 bg-zinc-200" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-10 lg:w-[38%]">
            <div className="border border-zinc-200 p-8">
              <div className="mb-6 h-5 w-32 bg-zinc-200" />
              <div className="h-4 w-full bg-zinc-200" />
              <div className="mt-6 h-24 w-full bg-zinc-200" />
            </div>
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

  if (isLoading) {
    return <DealDetailSkeleton />;
  }

  if (error === "NOT_FOUND") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <Briefcase className="mb-8 h-10 w-10 text-zinc-300" />
        <h1 className="font-serif text-3xl font-light text-zinc-800">
          Deal not found
        </h1>
        <p className="mt-3 max-w-sm font-sans text-sm font-normal text-zinc-500">
          The deal you are looking for does not exist or has been removed.
        </p>
        <Link href="/deals" className="mt-10 inline-block">
          <Button variant="outline" size="sm">
            Back to Deals
          </Button>
        </Link>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <h1 className="font-serif text-3xl font-light text-zinc-800">
          Something went wrong
        </h1>
        <p className="mt-3 max-w-sm font-sans text-sm font-normal text-zinc-500">
          {error || "Failed to load deal data."}
        </p>
        <Link href="/deals" className="mt-10 inline-block">
          <Button variant="outline" size="sm">
            Back to Deals
          </Button>
        </Link>
      </div>
    );
  }

  const isContributionPhase =
    deal.status === "GUARANTEED_ALLOCATION" || deal.status === "FCFS";
  const isRegistrationPhase = deal.status === "REGISTRATION_OPEN";
  const isUpcoming = deal.status === "APPROVED";
  const isCompleted =
    deal.status === "COMPLETED" || deal.status === "DISTRIBUTING";

  const phases: Phase[] =
    deal.phases.length > 0
      ? mapApiPhasesToPhases(deal.phases)
      : buildPhasesFromDeal(deal);

  const tokenSymbol = deal.distributionTokenSymbol || "TOKEN";
  const raiseSymbol = deal.raiseTokenSymbol || "USDC";

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-24">
        {/* ================================================================= */}
        {/* Back link                                                         */}
        {/* ================================================================= */}
        <Link
          href="/deals"
          className="mb-12 inline-flex items-center gap-2 font-sans text-xs font-normal uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Deals
        </Link>

        {/* ================================================================= */}
        {/* Hero section                                                      */}
        {/* ================================================================= */}
        <div className="mb-16">
          {/* Category + chain + status */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
              {CATEGORY_LABELS[deal.category] || deal.category}
            </span>
            <span className="text-zinc-300">/</span>
            <span className="text-xs font-normal uppercase tracking-widest text-zinc-500">
              {CHAIN_LABELS[deal.chain] || deal.chain}
            </span>
            <span className="text-zinc-300">/</span>
            <span className="border border-zinc-200 px-2.5 py-0.5 text-[10px] font-normal uppercase tracking-widest text-zinc-500">
              {STATUS_LABELS[deal.status] || deal.status}
            </span>
            {deal.requiresKyc && (
              <>
                <span className="text-zinc-300">/</span>
                <span className="flex items-center gap-1 text-xs font-normal text-zinc-500">
                  <Shield className="h-3 w-3" />
                  KYC
                </span>
              </>
            )}
          </div>

          <h1 className="font-serif text-4xl font-light tracking-tight text-zinc-900 sm:text-5xl">
            {deal.projectName}
          </h1>

          {deal.shortDescription && (
            <p className="mt-4 max-w-2xl font-sans text-lg font-normal leading-relaxed text-zinc-500">
              {deal.shortDescription}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {deal.projectWebsite && (
              <ExternalLinkButton
                href={deal.projectWebsite}
                icon={<Globe className="h-3.5 w-3.5" />}
                label="Website"
              />
            )}
            {deal.projectTwitter && (
              <ExternalLinkButton
                href={deal.projectTwitter}
                icon={<ExternalLink className="h-3.5 w-3.5" />}
                label="Twitter"
              />
            )}
            {deal.projectDiscord && (
              <ExternalLinkButton
                href={deal.projectDiscord}
                icon={<MessageCircle className="h-3.5 w-3.5" />}
                label="Discord"
              />
            )}
            {deal.projectTelegram && (
              <ExternalLinkButton
                href={deal.projectTelegram}
                icon={<Send className="h-3.5 w-3.5" />}
                label="Telegram"
              />
            )}
            {deal.projectGithub && (
              <ExternalLinkButton
                href={deal.projectGithub}
                icon={<Github className="h-3.5 w-3.5" />}
                label="GitHub"
              />
            )}
          </div>

          <div className="mt-12 h-px w-full bg-zinc-200" />
        </div>

        {/* ================================================================= */}
        {/* Key metrics row                                                   */}
        {/* ================================================================= */}
        <div className="mb-16 grid grid-cols-2 gap-px border border-zinc-200 sm:grid-cols-4 lg:grid-cols-8">
          <MetricCell label="Token Price" value={formatCurrency(deal.tokenPrice)} />
          <MetricCell label="Total Raise" value={`$${formatLargeNumber(deal.totalRaise)}`} />
          <MetricCell label="Hard Cap" value={`$${formatLargeNumber(deal.hardCap)}`} />
          <MetricCell label="FDV" value={deal.fdv ? `$${formatLargeNumber(deal.fdv)}` : "--"} />
          <MetricCell label="TGE Unlock" value={`${deal.tgeUnlockPercent}%`} />
          <MetricCell label="Vesting" value={deal.vestingDurationDays > 0 ? `${deal.vestingDurationDays}d` : "None"} />
          <MetricCell label="Allocation" value={ALLOCATION_LABELS[deal.allocationMethod] ?? deal.allocationMethod} />
          <MetricCell label="Min Tier" value={deal.minTierRequired ?? "None"} />
        </div>

        {/* ================================================================= */}
        {/* Two-column layout                                                 */}
        {/* ================================================================= */}
        <div className="flex flex-col gap-16 lg:flex-row">
          {/* Left Column */}
          <div className="flex flex-1 flex-col gap-16 lg:max-w-[58%]">
            {/* Description */}
            <section>
              <h2 className="mb-8 font-serif text-2xl font-light text-zinc-800">
                About
              </h2>
              <div className="max-w-none">
                {deal.description.split("\n").map((line, i) => {
                  if (line.startsWith("## ")) {
                    return (
                      <h2 key={i} className="mb-4 mt-10 font-serif text-xl font-light text-zinc-800">
                        {line.replace("## ", "")}
                      </h2>
                    );
                  }
                  if (line.startsWith("### ")) {
                    return (
                      <h3 key={i} className="mb-3 mt-8 font-sans text-base font-medium text-zinc-700">
                        {line.replace("### ", "")}
                      </h3>
                    );
                  }
                  if (line.startsWith("- **")) {
                    const match = line.match(/- \*\*(.+?)\*\*: (.+)/);
                    if (match) {
                      return (
                        <div key={i} className="mb-3 flex gap-3">
                          <span className="mt-2 h-1 w-1 shrink-0 bg-zinc-400" />
                          <p className="font-sans text-sm font-normal leading-relaxed text-zinc-500">
                            <strong className="font-medium text-zinc-700">{match[1]}</strong>: {match[2]}
                          </p>
                        </div>
                      );
                    }
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
                    <p key={i} className="mb-3 font-sans text-sm font-normal leading-relaxed text-zinc-500">
                      {line}
                    </p>
                  );
                })}
              </div>
            </section>

            {/* Tokenomics */}
            <section>
              <h2 className="mb-8 font-serif text-2xl font-light text-zinc-800">Tokenomics</h2>
              <div className="grid gap-10 sm:grid-cols-2">
                <div className="flex flex-col gap-0">
                  <TokenomicRow label="Token Name" value={tokenSymbol} />
                  <TokenomicRow label="Ticker" value={`$${tokenSymbol}`} />
                  <TokenomicRow label="Token Price" value={formatCurrency(deal.tokenPrice)} />
                  {deal.fdv && <TokenomicRow label="FDV" value={`$${formatLargeNumber(deal.fdv)}`} />}
                </div>
                <div className="border border-zinc-200 p-6">
                  <TokenomicsChart data={DEFAULT_TOKENOMICS_DATA} />
                </div>
              </div>
            </section>

            {/* Vesting */}
            <section>
              <h2 className="mb-8 font-serif text-2xl font-light text-zinc-800">Vesting Schedule</h2>
              <div className="mb-10 grid grid-cols-1 gap-px border border-zinc-200 sm:grid-cols-3">
                <VestingCell label="TGE Unlock" value={`${deal.tgeUnlockPercent}%`} sublabel="At token generation event" active />
                <VestingCell label="Cliff Period" value={`${deal.vestingCliffDays} days`} sublabel="No tokens released" />
                <VestingCell label="Vesting Duration" value={`${deal.vestingDurationDays} days`} sublabel="Linear daily release" />
              </div>
              <div className="mb-10 border border-zinc-200 p-8">
                <div className="mb-3 flex items-center justify-between text-[10px] font-normal uppercase tracking-widest text-zinc-500">
                  <span>TGE ({deal.tgeUnlockPercent}%)</span>
                  <span>Cliff ({deal.vestingCliffDays}d)</span>
                  <span>Full Vest ({deal.vestingDurationDays}d)</span>
                </div>
                <div className="flex h-1.5 overflow-hidden bg-zinc-200">
                  <div className="bg-zinc-600" style={{ width: `${parseFloat(deal.tgeUnlockPercent)}%` }} />
                  <div className="bg-zinc-300" style={{ width: `${deal.vestingDurationDays > 0 ? (deal.vestingCliffDays / deal.vestingDurationDays) * (100 - parseFloat(deal.tgeUnlockPercent)) : 0}%` }} />
                  <div className="flex-1 bg-zinc-500" />
                </div>
              </div>
              <VestingTimeline
                schedule={{
                  tgeUnlock: parseFloat(deal.tgeUnlockPercent),
                  cliffMonths: Math.round(deal.vestingCliffDays / 30),
                  vestingMonths: Math.round(deal.vestingDurationDays / 30),
                  totalAmount: parseFloat(deal.totalRaise) * 0.2,
                  claimed: 0,
                }}
              />
            </section>

            {/* Team */}
            {deal.teamMembers && deal.teamMembers.length > 0 && (
              <section>
                <h2 className="mb-8 font-serif text-2xl font-light text-zinc-800">Team</h2>
                <div className="grid gap-px border border-zinc-200 sm:grid-cols-2">
                  {deal.teamMembers.map((member) => (
                    <div key={member.name} className="flex items-center gap-4 border border-zinc-200 p-6">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-zinc-200 font-sans text-xs font-normal text-zinc-500">
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="flex-1">
                        <p className="font-sans text-sm font-medium text-zinc-800">{member.name}</p>
                        <p className="text-xs font-normal text-zinc-500">{member.role}</p>
                      </div>
                      {member.linkedin && (
                        <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-zinc-400 transition-colors hover:text-zinc-600">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Documents */}
            {(deal.pitchDeckUrl || deal.whitepaperUrl || deal.auditReportUrl) && (
              <section>
                <h2 className="mb-8 font-serif text-2xl font-light text-zinc-800">Documents</h2>
                <div className="grid gap-px border border-zinc-200 sm:grid-cols-3">
                  {deal.pitchDeckUrl && <DocumentCard title="Pitch Deck" description="Project overview" href={deal.pitchDeckUrl} icon={<FileText className="h-4 w-4" />} />}
                  {deal.whitepaperUrl && <DocumentCard title="Whitepaper" description="Technical docs" href={deal.whitepaperUrl} icon={<FileText className="h-4 w-4" />} />}
                  {deal.auditReportUrl && <DocumentCard title="Audit Report" description="Security audit" href={deal.auditReportUrl} icon={<Shield className="h-4 w-4" />} />}
                </div>
              </section>
            )}
          </div>

          {/* Right Column (sidebar) */}
          <div className="flex flex-col gap-10 lg:w-[38%]">
            <div className="flex flex-col gap-10 lg:sticky lg:top-8">
              {/* Raise Progress */}
              <div className="border border-zinc-200 p-8">
                <h3 className="mb-6 text-xs font-normal uppercase tracking-widest text-zinc-500">Raise Progress</h3>
                <ContributionProgress raised={parseFloat(deal.totalRaised)} softCap={deal.softCap ? parseFloat(deal.softCap) : 0} hardCap={parseFloat(deal.hardCap)} />
                <div className="mt-6 flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="font-sans text-xs font-normal text-zinc-500">{deal.contributorCount.toLocaleString()} contributors</span>
                </div>
                {deal.contributionCloseAt && (
                  <div className="mt-6 border-t border-zinc-200 pt-6">
                    <Countdown targetDate={deal.contributionCloseAt} label="Ends in" />
                  </div>
                )}
                {phases.length > 0 && (
                  <div className="mt-6 border-t border-zinc-200 pt-6">
                    <DealPhaseIndicator phases={phases} />
                  </div>
                )}
              </div>

              {/* CTA / Contribution Card */}
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
                <div className="border border-zinc-200 p-8">
                  <h3 className="mb-6 text-xs font-normal uppercase tracking-widest text-zinc-500">
                    {isContributionPhase ? "Contribute" : isRegistrationPhase ? "Register" : isUpcoming ? "Coming Soon" : "Deal Status"}
                  </h3>

                  {isContributionPhase && (
                    <div className="flex flex-col gap-6">
                      <ContributionForm
                        minContribution={parseFloat(deal.minContribution)}
                        maxContribution={parseFloat(deal.maxContribution)}
                        walletBalance={0}
                        tokenPrice={parseFloat(deal.tokenPrice)}
                        tokenSymbol={tokenSymbol}
                        raiseTokenSymbol={raiseSymbol}
                      />
                      <div className="border-t border-zinc-200 pt-6">
                        <button onClick={() => setShowParticipation(true)} className="w-full border border-zinc-200 py-3 font-sans text-xs font-normal text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700">
                          Full Participation Flow
                        </button>
                      </div>
                    </div>
                  )}

                  {isRegistrationPhase && (
                    <div className="flex flex-col items-center gap-6 py-4 text-center">
                      <Clock className="h-8 w-8 text-zinc-400" />
                      <p className="font-sans text-sm font-normal text-zinc-500">Register your interest to receive a guaranteed allocation when contributions open.</p>
                      <button
                        className="w-full bg-violet-500 py-3 font-sans text-sm font-normal text-white transition-colors hover:bg-violet-400"
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/deals/${deal.id}/register`, { method: "POST" });
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
                      </button>
                    </div>
                  )}

                  {isUpcoming && (
                    <div className="flex flex-col items-center gap-6 py-4 text-center">
                      <Clock className="h-8 w-8 text-zinc-400" />
                      <p className="font-sans text-sm font-normal text-zinc-500">This deal has not opened yet. Registration starts soon.</p>
                      {deal.registrationOpenAt && <Countdown targetDate={deal.registrationOpenAt} label="Opens in" />}
                    </div>
                  )}

                  {isCompleted && (
                    <div className="flex flex-col items-center gap-6 py-4 text-center">
                      <CheckCircle2 className="h-8 w-8 text-zinc-400" />
                      <p className="font-sans text-sm font-medium text-zinc-600">This deal has ended</p>
                      <div className="grid w-full grid-cols-2 gap-px border border-zinc-200">
                        <div className="flex flex-col items-center p-4">
                          <span className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">Raised</span>
                          <span className="mt-1 font-serif text-lg font-light text-zinc-800">{formatCurrency(deal.totalRaised)}</span>
                        </div>
                        <div className="flex flex-col items-center border-l border-zinc-200 p-4">
                          <span className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">Contributors</span>
                          <span className="mt-1 font-serif text-lg font-light text-zinc-800">{deal.contributorCount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Deal Details */}
              <div className="border border-zinc-200 p-8">
                <h3 className="mb-6 text-xs font-normal uppercase tracking-widest text-zinc-500">Deal Details</h3>
                <div className="flex flex-col gap-0">
                  <DetailRow label="Min Contribution" value={formatCurrency(deal.minContribution)} />
                  <DetailRow label="Max Contribution" value={formatCurrency(deal.maxContribution)} />
                  <DetailRow label="Allocation Method" value={deal.allocationMethod.replace("_", " ")} />
                  <DetailRow label="KYC Required" value={deal.requiresKyc ? "Yes" : "No"} />
                  <DetailRow label="Min Tier" value={deal.minTierRequired ?? "None"} />
                  <DetailRow label="Accreditation" value={deal.requiresAccreditation ? "Required" : "Not Required"} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper: build phases from deal dates
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

function ExternalLinkButton({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 border border-zinc-200 px-4 py-2 font-sans text-xs font-normal text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-600"
    >
      {icon}
      {label}
    </a>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5 border border-zinc-200 p-5">
      <span className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">{label}</span>
      <span className="font-serif text-lg font-light text-zinc-800">{value}</span>
    </div>
  );
}

function TokenomicRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-200 py-4 last:border-0">
      <span className="font-sans text-sm font-normal text-zinc-500">{label}</span>
      <span className="font-sans text-sm font-medium text-zinc-800">{value}</span>
    </div>
  );
}

function VestingCell({ label, value, sublabel, active }: { label: string; value: string; sublabel: string; active?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center gap-2 border border-zinc-200 p-8 text-center", active && "bg-zinc-50")}>
      <span className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">{label}</span>
      <span className={cn("font-serif text-2xl font-light", active ? "text-zinc-900" : "text-zinc-700")}>{value}</span>
      <span className="text-[10px] font-normal text-zinc-400">{sublabel}</span>
    </div>
  );
}

function DocumentCard({ title, description, href, icon }: { title: string; description: string; href: string | null; icon: React.ReactNode }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex flex-col gap-3 border border-zinc-200 p-6 transition-colors hover:border-zinc-300">
      <div className="flex items-center gap-2 text-zinc-500">
        {icon}
        <span className="font-sans text-sm font-medium text-zinc-600">{title}</span>
      </div>
      <p className="text-xs font-normal text-zinc-400">{description}</p>
      <div className="flex items-center gap-1.5 text-xs font-normal text-zinc-500">
        <Download className="h-3 w-3" />
        Download
      </div>
    </a>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-200 py-4 last:border-0">
      <span className="font-sans text-sm font-normal text-zinc-500">{label}</span>
      {typeof value === "string" ? (
        <span className="font-sans text-sm font-medium text-zinc-800">{value}</span>
      ) : (
        value
      )}
    </div>
  );
}
