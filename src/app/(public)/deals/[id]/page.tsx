"use client";

import * as React from "react";
import Link from "next/link";
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
  Lock,
  CheckCircle2,
  Info,
  Wallet,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Countdown } from "@/components/ui/countdown";
import { DealPhaseIndicator } from "@/components/deals/deal-phase-indicator";
import { ContributionForm } from "@/components/deals/contribution-form";
import { DealStats } from "@/components/deals/deal-stats";
import { formatCurrency, formatLargeNumber, formatPercent } from "@/lib/utils/format";
import type { Phase } from "@/components/deals/deal-phase-indicator";

// ---------------------------------------------------------------------------
// Placeholder Data — realistic DeFi project
// ---------------------------------------------------------------------------

const DEAL = {
  id: "1",
  slug: "aetherfi-public-round",
  projectName: "AetherFi",
  title: "AetherFi Public Round",
  status: "GUARANTEED_ALLOCATION" as const,
  category: "DEFI" as const,
  chain: "ETHEREUM" as const,

  description: `## About AetherFi

AetherFi is a decentralized restaking protocol that enables permissionless liquid staking derivatives on Ethereum. By leveraging EigenLayer's restaking primitive, AetherFi allows users to earn staking rewards while simultaneously securing additional actively validated services (AVSs).

### Key Features

- **Non-custodial Restaking**: Maintain full control of your assets while earning layered yields across multiple AVSs.
- **Liquid Staking Derivatives**: Receive aeETH tokens representing your restaked position, freely composable across DeFi.
- **Operator Marketplace**: Transparent node operator selection with on-chain performance tracking and slashing insurance.
- **Governance**: Token holders direct protocol parameters, fee structures, and AVS onboarding decisions.

### Market Opportunity

The liquid staking market has grown to over $40B in TVL, yet restaking remains nascent with significant room for growth. AetherFi aims to capture a meaningful share of this expanding market by providing the most user-friendly and secure restaking experience.

### Roadmap

- **Q1 2026**: Mainnet launch with core restaking functionality
- **Q2 2026**: Operator marketplace and delegation features
- **Q3 2026**: Cross-chain expansion to Arbitrum and Base
- **Q4 2026**: Governance token launch and DAO transition`,

  shortDescription:
    "Decentralized restaking protocol enabling permissionless liquid staking derivatives on Ethereum.",

  projectWebsite: "https://aetherfi.io",
  projectTwitter: "https://twitter.com/aetherfi",
  projectDiscord: "https://discord.gg/aetherfi",
  projectTelegram: "https://t.me/aetherfi",
  projectGithub: "https://github.com/aetherfi",

  tokenPrice: "0.045",
  totalRaise: "2000000",
  totalRaised: "1420000",
  hardCap: "2000000",
  softCap: "500000",
  fdv: "180000000",
  minContribution: "100",
  maxContribution: "10000",
  contributorCount: 1247,
  allocationMethod: "GUARANTEED" as const,

  distributionTokenSymbol: "AETH",
  distributionTokenName: "AetherFi Token",
  totalTokenSupply: "1000000000",
  raiseTokenSymbol: "USDC",

  tgeUnlockPercent: "15",
  vestingCliffDays: 30,
  vestingDurationDays: 365,
  vestingType: "TGE_PLUS_LINEAR" as const,

  minTierRequired: "SILVER" as const,
  requiresKyc: true,
  requiresAccreditation: false,

  registrationOpenAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  registrationCloseAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  contributionOpenAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  contributionCloseAt: new Date(Date.now() + 5 * 86400000).toISOString(),
  distributionAt: new Date(Date.now() + 14 * 86400000).toISOString(),

  pitchDeckUrl: "#",
  whitepaperUrl: "#",
  auditReportUrl: "#",

  teamMembers: [
    {
      name: "Elena Vasquez",
      role: "Co-Founder & CEO",
      avatar: null,
      linkedin: "https://linkedin.com/in/",
    },
    {
      name: "Marcus Chen",
      role: "CTO",
      avatar: null,
      linkedin: "https://linkedin.com/in/",
    },
    {
      name: "Sophie Nakamura",
      role: "Head of Protocol",
      avatar: null,
      linkedin: "https://linkedin.com/in/",
    },
    {
      name: "David Okonkwo",
      role: "Head of BD",
      avatar: null,
      linkedin: "https://linkedin.com/in/",
    },
  ],
};

const PHASES: Phase[] = [
  {
    id: "p1",
    name: "Registration",
    startsAt: DEAL.registrationOpenAt,
    endsAt: DEAL.registrationCloseAt,
    status: "completed",
  },
  {
    id: "p2",
    name: "Guaranteed",
    startsAt: DEAL.contributionOpenAt,
    endsAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    status: "active",
  },
  {
    id: "p3",
    name: "FCFS",
    startsAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    endsAt: DEAL.contributionCloseAt,
    status: "upcoming",
  },
  {
    id: "p4",
    name: "Distribution",
    startsAt: DEAL.contributionCloseAt,
    endsAt: DEAL.distributionAt,
    status: "upcoming",
  },
];

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "info" | "outline" }
> = {
  DRAFT: { label: "Draft", variant: "outline" },
  UNDER_REVIEW: { label: "Under Review", variant: "outline" },
  APPROVED: { label: "Upcoming", variant: "info" },
  REGISTRATION_OPEN: { label: "Registration Open", variant: "default" },
  GUARANTEED_ALLOCATION: { label: "Guaranteed", variant: "success" },
  FCFS: { label: "FCFS", variant: "warning" },
  SETTLEMENT: { label: "Settlement", variant: "outline" },
  DISTRIBUTING: { label: "Distributing", variant: "info" },
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
// Page Component
// ---------------------------------------------------------------------------

export default function DealDetailPage() {
  const deal = DEAL;
  const statusConfig = STATUS_CONFIG[deal.status];
  const raiseProgress =
    (parseFloat(deal.totalRaised) / parseFloat(deal.hardCap)) * 100;

  const isContributionPhase =
    deal.status === "GUARANTEED_ALLOCATION" || deal.status === "FCFS";
  const isRegistrationPhase = deal.status === "REGISTRATION_OPEN";
  const isUpcoming = deal.status === "APPROVED";
  const isCompleted =
    deal.status === "COMPLETED" || deal.status === "DISTRIBUTING";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* ================================================================= */}
      {/* Top section                                                       */}
      {/* ================================================================= */}
      <div className="mb-8">
        {/* Back link */}
        <Link
          href="/deals"
          className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-zinc-50"
        >
          <ArrowLeft className="h-4 w-4" />
          All Deals
        </Link>

        {/* Badges */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          <Badge variant="outline">{CATEGORY_LABELS[deal.category]}</Badge>
          <Badge variant="outline">{CHAIN_LABELS[deal.chain]}</Badge>
          {deal.requiresKyc && (
            <Badge variant="info" size="sm">
              <Shield className="mr-1 h-3 w-3" />
              KYC Required
            </Badge>
          )}
          {deal.minTierRequired && (
            <Badge variant="warning" size="sm">
              {deal.minTierRequired} Tier
            </Badge>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-zinc-50 sm:text-4xl">
          {deal.projectName}
        </h1>
        <p className="mt-2 text-lg text-zinc-400">{deal.shortDescription}</p>

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
                        className="mb-3 mt-6 text-xl font-bold text-zinc-50"
                      >
                        {line.replace("## ", "")}
                      </h2>
                    );
                  }
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
                  if (line.startsWith("- **")) {
                    const match = line.match(/- \*\*(.+?)\*\*: (.+)/);
                    if (match) {
                      return (
                        <div key={i} className="mb-2 flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
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
                    value={deal.distributionTokenName}
                  />
                  <TokenomicRow
                    label="Ticker"
                    value={`$${deal.distributionTokenSymbol}`}
                  />
                  <TokenomicRow
                    label="Total Supply"
                    value={`${formatLargeNumber(deal.totalTokenSupply)} ${deal.distributionTokenSymbol}`}
                  />
                  <TokenomicRow
                    label="Token Price"
                    value={formatCurrency(deal.tokenPrice)}
                  />
                  <TokenomicRow
                    label="FDV"
                    value={`$${formatLargeNumber(deal.fdv)}`}
                  />
                </div>

                {/* Placeholder for tokenomics chart */}
                <div className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 p-6">
                  <div className="relative h-40 w-40">
                    {/* Placeholder pie chart segments */}
                    <svg
                      viewBox="0 0 100 100"
                      className="h-full w-full -rotate-90"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="20"
                        strokeDasharray="50.27 251.33"
                        strokeDashoffset="0"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="20"
                        strokeDasharray="75.4 251.33"
                        strokeDashoffset="-50.27"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="20"
                        strokeDasharray="37.7 251.33"
                        strokeDashoffset="-125.66"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="20"
                        strokeDasharray="50.27 251.33"
                        strokeDashoffset="-163.36"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#a1a1aa"
                        strokeWidth="20"
                        strokeDasharray="37.7 251.33"
                        strokeDashoffset="-213.63"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-zinc-400">
                        Token Distribution
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-4">
                <ChartLegend color="bg-violet-500" label="Public Sale (20%)" />
                <ChartLegend color="bg-indigo-500" label="Team (30%)" />
                <ChartLegend color="bg-blue-500" label="Ecosystem (15%)" />
                <ChartLegend color="bg-cyan-400" label="Liquidity (20%)" />
                <ChartLegend color="bg-zinc-400" label="Reserve (15%)" />
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
                      className="bg-violet-500"
                      style={{
                        width: `${parseFloat(deal.tgeUnlockPercent)}%`,
                      }}
                    />
                    <div
                      className="bg-zinc-700"
                      style={{
                        width: `${(deal.vestingCliffDays / deal.vestingDurationDays) * (100 - parseFloat(deal.tgeUnlockPercent))}%`,
                      }}
                    />
                    <div className="flex-1 bg-gradient-to-r from-violet-600 to-violet-400" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team */}
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
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-sm font-bold text-white">
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

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                <DocumentCard
                  title="Pitch Deck"
                  description="Project overview and business plan"
                  href={deal.pitchDeckUrl}
                  icon={<FileText className="h-5 w-5" />}
                />
                <DocumentCard
                  title="Whitepaper"
                  description="Technical documentation"
                  href={deal.whitepaperUrl}
                  icon={<FileText className="h-5 w-5" />}
                />
                <DocumentCard
                  title="Audit Report"
                  description="Smart contract security audit"
                  href={deal.auditReportUrl}
                  icon={<Shield className="h-5 w-5" />}
                />
              </div>
            </CardContent>
          </Card>
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
                {/* Progress bar */}
                <div>
                  <div className="mb-2 flex items-end justify-between">
                    <span className="text-2xl font-bold text-zinc-50">
                      {formatPercent(raiseProgress, 1)}
                    </span>
                    <span className="text-sm text-zinc-400">
                      {formatCurrency(deal.totalRaised)} /{" "}
                      {formatCurrency(deal.hardCap)}
                    </span>
                  </div>
                  <Progress value={raiseProgress} color="default" />
                </div>

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
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                  <DealPhaseIndicator phases={PHASES} />
                </div>
              </CardContent>
            </Card>

            {/* Contribution / CTA Card */}
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
                  <ContributionForm
                    minContribution={parseFloat(deal.minContribution)}
                    maxContribution={parseFloat(deal.maxContribution)}
                    walletBalance={24350.0}
                    tokenPrice={parseFloat(deal.tokenPrice)}
                    tokenSymbol={deal.distributionTokenSymbol}
                    raiseTokenSymbol={deal.raiseTokenSymbol}
                  />
                )}

                {isRegistrationPhase && (
                  <div className="flex flex-col items-center gap-4 py-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/10">
                      <Clock className="h-7 w-7 text-violet-400" />
                    </div>
                    <p className="text-sm text-zinc-400">
                      Register your interest to receive a guaranteed allocation
                      when contributions open.
                    </p>
                    <Button className="w-full" size="lg">
                      Register Interest
                    </Button>
                  </div>
                )}

                {isUpcoming && (
                  <div className="flex flex-col items-center gap-4 py-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10">
                      <Clock className="h-7 w-7 text-blue-400" />
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
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                      <CheckCircle2 className="h-7 w-7 text-emerald-400" />
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

            {/* Deal Stats */}
            <DealStats
              stats={{
                tokenPrice: deal.tokenPrice,
                totalRaise: deal.totalRaise,
                hardCap: deal.hardCap,
                fdv: deal.fdv,
                tgeUnlockPercent: deal.tgeUnlockPercent,
                vestingDurationDays: deal.vestingDurationDays,
                allocationMethod: deal.allocationMethod,
                minTierRequired: deal.minTierRequired,
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
                    value={
                      <Badge
                        variant={deal.requiresKyc ? "info" : "outline"}
                        size="sm"
                      >
                        {deal.requiresKyc ? "Yes" : "No"}
                      </Badge>
                    }
                  />
                  <DetailRow
                    label="Min Tier"
                    value={
                      <Badge
                        variant={
                          deal.minTierRequired ? "warning" : "outline"
                        }
                        size="sm"
                      >
                        {deal.minTierRequired ?? "None"}
                      </Badge>
                    }
                  />
                  <DetailRow
                    label="Accreditation"
                    value={
                      <Badge
                        variant={
                          deal.requiresAccreditation ? "error" : "outline"
                        }
                        size="sm"
                      >
                        {deal.requiresAccreditation
                          ? "Required"
                          : "Not Required"}
                      </Badge>
                    }
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

function ChartLegend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-3 w-3 rounded-sm", color)} />
      <span className="text-xs text-zinc-400">{label}</span>
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
          ? "border-violet-500/40 bg-violet-500/5"
          : "border-zinc-800 bg-zinc-950"
      )}
    >
      <span className="text-xs text-zinc-500">{label}</span>
      <span
        className={cn(
          "text-xl font-bold",
          active ? "text-violet-400" : "text-zinc-50"
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
      <div className="flex items-center gap-2 text-violet-400">
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
