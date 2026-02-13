"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  Globe,
  MessageCircle,
  Github,
  Info,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface FormData {
  // Step 1 — Basic Info
  projectName: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  chain: string;
  website: string;
  twitter: string;
  discord: string;
  telegram: string;
  github: string;
  featuredImageUrl: string;
  bannerImageUrl: string;
  // Step 2 — Token Details
  tokenName: string;
  ticker: string;
  totalSupply: string;
  tokenPrice: string;
  distributionTokenAddress: string;
  raiseToken: string;
  // Step 3 — Raise Config
  hardCap: string;
  softCap: string;
  minContribution: string;
  maxContribution: string;
  allocationMethod: string;
  oversubscription: boolean;
  // Step 4 — Timeline
  registrationOpen: string;
  registrationClose: string;
  contributionOpen: string;
  contributionClose: string;
  distributionDate: string;
  vestingStartDate: string;
  vestingType: string;
  tgeUnlockPercent: string;
  cliffDays: string;
  vestingDurationDays: string;
  // Step 5 — Access Control
  requireKyc: boolean;
  requireAccreditation: boolean;
  whitelistOnly: boolean;
  minTier: string;
  allowedCountries: string;
  blockedCountries: string;
}

const defaultForm: FormData = {
  projectName: "",
  slug: "",
  shortDescription: "",
  fullDescription: "",
  category: "",
  chain: "",
  website: "",
  twitter: "",
  discord: "",
  telegram: "",
  github: "",
  featuredImageUrl: "",
  bannerImageUrl: "",
  tokenName: "",
  ticker: "",
  totalSupply: "",
  tokenPrice: "",
  distributionTokenAddress: "",
  raiseToken: "",
  hardCap: "",
  softCap: "",
  minContribution: "",
  maxContribution: "",
  allocationMethod: "",
  oversubscription: false,
  registrationOpen: "",
  registrationClose: "",
  contributionOpen: "",
  contributionClose: "",
  distributionDate: "",
  vestingStartDate: "",
  vestingType: "",
  tgeUnlockPercent: "",
  cliffDays: "",
  vestingDurationDays: "",
  requireKyc: true,
  requireAccreditation: false,
  whitelistOnly: false,
  minTier: "",
  allowedCountries: "",
  blockedCountries: "",
};

/* -------------------------------------------------------------------------- */
/*  Steps config                                                               */
/* -------------------------------------------------------------------------- */

const STEPS = [
  { id: 0, label: "Basic Info" },
  { id: 1, label: "Token Details" },
  { id: 2, label: "Raise Config" },
  { id: 3, label: "Timeline" },
  { id: 4, label: "Access Control" },
  { id: 5, label: "Review" },
];

/* -------------------------------------------------------------------------- */
/*  Validation                                                                 */
/* -------------------------------------------------------------------------- */

function validateStep(step: number, form: FormData): Record<string, string> {
  const errors: Record<string, string> = {};

  if (step === 0) {
    if (!form.projectName.trim()) errors.projectName = "Project name is required";
    if (!form.shortDescription.trim()) errors.shortDescription = "Short description is required";
    if (!form.category) errors.category = "Category is required";
    if (!form.chain) errors.chain = "Chain is required";
  }
  if (step === 1) {
    if (!form.tokenName.trim()) errors.tokenName = "Token name is required";
    if (!form.ticker.trim()) errors.ticker = "Ticker is required";
    if (!form.totalSupply || Number(form.totalSupply) <= 0) errors.totalSupply = "Total supply must be positive";
    if (!form.tokenPrice || Number(form.tokenPrice) <= 0) errors.tokenPrice = "Token price must be positive";
    if (!form.raiseToken) errors.raiseToken = "Raise token is required";
  }
  if (step === 2) {
    if (!form.hardCap || Number(form.hardCap) <= 0) errors.hardCap = "Hard cap is required";
    if (!form.minContribution || Number(form.minContribution) <= 0) errors.minContribution = "Min contribution is required";
    if (!form.maxContribution || Number(form.maxContribution) <= 0) errors.maxContribution = "Max contribution is required";
    if (!form.allocationMethod) errors.allocationMethod = "Allocation method is required";
  }
  if (step === 3) {
    if (!form.registrationOpen) errors.registrationOpen = "Registration open date is required";
    if (!form.registrationClose) errors.registrationClose = "Registration close date is required";
    if (!form.contributionOpen) errors.contributionOpen = "Contribution open date is required";
    if (!form.contributionClose) errors.contributionClose = "Contribution close date is required";
    if (!form.distributionDate) errors.distributionDate = "Distribution date is required";
  }

  return errors;
}

/* -------------------------------------------------------------------------- */
/*  Helper: auto-generate slug                                                 */
/* -------------------------------------------------------------------------- */

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/* -------------------------------------------------------------------------- */
/*  Helper: map form category to API enum                                      */
/* -------------------------------------------------------------------------- */

const categoryApiMap: Record<string, string> = {
  DeFi: "DEFI",
  Infrastructure: "INFRASTRUCTURE",
  Gaming: "GAMING",
  AI: "AI",
  RWA: "OTHER",
  Social: "SOCIAL",
  NFT: "NFT",
  DAO: "OTHER",
};

const chainApiMap: Record<string, string> = {
  ethereum: "ETHEREUM",
  arbitrum: "ARBITRUM",
  base: "BASE",
  polygon: "ETHEREUM", // fallback
  optimism: "ETHEREUM", // fallback
  avalanche: "ETHEREUM", // fallback
};

const allocationApiMap: Record<string, string> = {
  guaranteed: "GUARANTEED",
  "pro-rata": "PRO_RATA",
  lottery: "LOTTERY",
  fcfs: "FCFS",
  hybrid: "HYBRID",
};

const vestingApiMap: Record<string, string> = {
  none: "LINEAR",
  linear: "LINEAR",
  "cliff-then-linear": "TGE_PLUS_LINEAR",
  monthly: "MONTHLY_CLIFF",
  custom: "CUSTOM",
};

const tierApiMap: Record<string, string> = {
  bronze: "BRONZE",
  silver: "SILVER",
  gold: "GOLD",
  platinum: "PLATINUM",
  diamond: "DIAMOND",
};

/* -------------------------------------------------------------------------- */
/*  Helper: datetime-local to ISO string                                       */
/* -------------------------------------------------------------------------- */

function toISOString(datetimeLocal: string): string | undefined {
  if (!datetimeLocal) return undefined;
  return new Date(datetimeLocal).toISOString();
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function CreateDealPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateField = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        // Auto-generate slug
        if (key === "projectName" && typeof value === "string") {
          next.slug = toSlug(value);
        }
        return next;
      });
      // Clear error when user types
      setErrors((prev) => {
        if (prev[key]) {
          const copy = { ...prev };
          delete copy[key];
          return copy;
        }
        return prev;
      });
    },
    []
  );

  const goNext = () => {
    const stepErrors = validateStep(currentStep, form);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setErrors({});
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  // FDV auto-calc
  const fdv =
    Number(form.totalSupply) > 0 && Number(form.tokenPrice) > 0
      ? Number(form.totalSupply) * Number(form.tokenPrice)
      : 0;

  // Submit handler
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);

      // Build the API body matching createDealSchema
      const body: Record<string, unknown> = {
        title: form.projectName,
        slug: form.slug || toSlug(form.projectName),
        shortDescription: form.shortDescription || undefined,
        description: form.fullDescription || form.shortDescription,
        projectName: form.projectName,
        category: categoryApiMap[form.category] || "OTHER",
        chain: chainApiMap[form.chain] || "ETHEREUM",
        tokenPrice: form.tokenPrice,
        totalRaise: form.hardCap, // totalRaise maps to hard cap
        hardCap: form.hardCap,
        softCap: form.softCap || undefined,
        minContribution: form.minContribution || "0",
        maxContribution: form.maxContribution || "0",
        allocationMethod: allocationApiMap[form.allocationMethod] || "FCFS",
        vestingType: vestingApiMap[form.vestingType] || "LINEAR",
        tgeUnlockPercent: form.tgeUnlockPercent || "0",
        vestingCliffDays: form.cliffDays ? parseInt(form.cliffDays, 10) : 0,
        vestingDurationDays: form.vestingDurationDays ? parseInt(form.vestingDurationDays, 10) : 0,
        minTierRequired: form.minTier ? (tierApiMap[form.minTier] ?? null) : null,
        distributionTokenSymbol: form.ticker || undefined,
        raiseTokenSymbol: form.raiseToken || undefined,
        registrationOpenAt: toISOString(form.registrationOpen),
        registrationCloseAt: toISOString(form.registrationClose),
        contributionOpenAt: toISOString(form.contributionOpen),
        contributionCloseAt: toISOString(form.contributionClose),
        requiresKyc: form.requireKyc,
        requiresAccreditation: form.requireAccreditation,
        projectWebsite: form.website || undefined,
        projectTwitter: form.twitter || undefined,
        projectDiscord: form.discord || undefined,
        featuredImageUrl: form.featuredImageUrl || undefined,
        bannerImageUrl: form.bannerImageUrl || undefined,
        isFeatured: false,
      };

      // Remove undefined values
      const cleanBody = Object.fromEntries(
        Object.entries(body).filter(([_, v]) => v !== undefined)
      );

      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanBody),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.error?.message || json.error?.details || "Failed to create deal"
        );
      }

      // Success — redirect to admin deals
      router.push("/admin/deals");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/deals">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Create Deal</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Set up a new capital raise on the platform
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, idx) => (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => {
                if (idx < currentStep) {
                  setErrors({});
                  setCurrentStep(idx);
                }
              }}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                idx === currentStep && "bg-violet-500/10 text-violet-400",
                idx < currentStep && "text-emerald-400 cursor-pointer hover:bg-zinc-800",
                idx > currentStep && "text-zinc-600 cursor-default"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                  idx === currentStep && "bg-violet-500 text-white",
                  idx < currentStep && "bg-emerald-500 text-white",
                  idx > currentStep && "bg-zinc-800 text-zinc-500"
                )}
              >
                {idx < currentStep ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  idx + 1
                )}
              </span>
              <span className="hidden md:inline">{step.label}</span>
            </button>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-px w-8",
                  idx < currentStep ? "bg-emerald-500/50" : "bg-zinc-800"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep].label}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step 0: Basic Info */}
          {currentStep === 0 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Input
                label="Project Name *"
                placeholder="e.g. Nexus Protocol"
                value={form.projectName}
                onChange={(e) => updateField("projectName", e.target.value)}
                error={errors.projectName}
              />
              <Input
                label="Slug"
                placeholder="auto-generated"
                value={form.slug}
                onChange={(e) => updateField("slug", e.target.value)}
                helperText="URL-safe identifier"
              />
              <div className="lg:col-span-2">
                <Input
                  label="Short Description *"
                  placeholder="One-line summary of the project"
                  value={form.shortDescription}
                  onChange={(e) => updateField("shortDescription", e.target.value)}
                  error={errors.shortDescription}
                />
              </div>
              <div className="lg:col-span-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">
                    Full Description
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Detailed project description, tokenomics, and value proposition..."
                    value={form.fullDescription}
                    onChange={(e) => updateField("fullDescription", e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                  />
                </div>
              </div>
              <Select
                label="Category *"
                placeholder="Select category"
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                error={errors.category}
                options={[
                  { value: "DeFi", label: "DeFi" },
                  { value: "Infrastructure", label: "Infrastructure" },
                  { value: "Gaming", label: "Gaming" },
                  { value: "AI", label: "AI / ML" },
                  { value: "RWA", label: "Real World Assets" },
                  { value: "Social", label: "Social" },
                  { value: "NFT", label: "NFT / Metaverse" },
                  { value: "DAO", label: "DAO Tooling" },
                ]}
              />
              <Select
                label="Chain *"
                placeholder="Select chain"
                value={form.chain}
                onChange={(e) => updateField("chain", e.target.value)}
                error={errors.chain}
                options={[
                  { value: "ethereum", label: "Ethereum" },
                  { value: "arbitrum", label: "Arbitrum" },
                  { value: "base", label: "Base" },
                ]}
              />
              <Input
                label="Website"
                placeholder="https://example.com"
                value={form.website}
                onChange={(e) => updateField("website", e.target.value)}
                leftAddon={<Globe className="h-4 w-4" />}
              />
              <Input
                label="Twitter"
                placeholder="https://twitter.com/handle"
                value={form.twitter}
                onChange={(e) => updateField("twitter", e.target.value)}
              />
              <Input
                label="Discord"
                placeholder="https://discord.gg/..."
                value={form.discord}
                onChange={(e) => updateField("discord", e.target.value)}
                leftAddon={<MessageCircle className="h-4 w-4" />}
              />
              <Input
                label="Telegram"
                placeholder="https://t.me/..."
                value={form.telegram}
                onChange={(e) => updateField("telegram", e.target.value)}
              />
              <Input
                label="GitHub"
                placeholder="https://github.com/..."
                value={form.github}
                onChange={(e) => updateField("github", e.target.value)}
                leftAddon={<Github className="h-4 w-4" />}
              />

              {/* Image URL inputs */}
              <Input
                label="Featured Image URL"
                placeholder="https://example.com/image.png"
                value={form.featuredImageUrl}
                onChange={(e) => updateField("featuredImageUrl", e.target.value)}
                helperText="URL to featured image (PNG, JPG)"
              />
              <Input
                label="Banner Image URL"
                placeholder="https://example.com/banner.png"
                value={form.bannerImageUrl}
                onChange={(e) => updateField("bannerImageUrl", e.target.value)}
                helperText="1200x400 recommended"
              />
            </div>
          )}

          {/* Step 1: Token Details */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Input
                label="Token Name *"
                placeholder="e.g. Nexus Token"
                value={form.tokenName}
                onChange={(e) => updateField("tokenName", e.target.value)}
                error={errors.tokenName}
              />
              <Input
                label="Ticker *"
                placeholder="e.g. NXS"
                value={form.ticker}
                onChange={(e) => updateField("ticker", e.target.value.toUpperCase())}
                error={errors.ticker}
              />
              <Input
                label="Total Supply *"
                placeholder="e.g. 1000000000"
                type="number"
                value={form.totalSupply}
                onChange={(e) => updateField("totalSupply", e.target.value)}
                error={errors.totalSupply}
              />
              <Input
                label="Token Price (USD) *"
                placeholder="e.g. 0.05"
                type="number"
                value={form.tokenPrice}
                onChange={(e) => updateField("tokenPrice", e.target.value)}
                error={errors.tokenPrice}
                leftAddon="$"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-300">
                  Fully Diluted Valuation (FDV)
                </label>
                <div className="flex h-10 items-center rounded-lg border border-zinc-700 bg-zinc-800/50 px-3">
                  <span className="text-sm text-zinc-400">
                    {fdv > 0 ? formatCurrency(fdv) : "Auto-calculated"}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  Calculated from total supply x token price
                </p>
              </div>
              <Input
                label="Distribution Token Address"
                placeholder="0x..."
                value={form.distributionTokenAddress}
                onChange={(e) =>
                  updateField("distributionTokenAddress", e.target.value)
                }
                helperText="Leave empty if token is not yet deployed"
              />
              <Select
                label="Raise Token *"
                placeholder="Select raise token"
                value={form.raiseToken}
                onChange={(e) => updateField("raiseToken", e.target.value)}
                error={errors.raiseToken}
                options={[
                  { value: "USDC", label: "USDC" },
                  { value: "USDT", label: "USDT" },
                  { value: "ETH", label: "ETH" },
                ]}
              />
            </div>
          )}

          {/* Step 2: Raise Config */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Input
                label="Hard Cap *"
                placeholder="e.g. 3000000"
                type="number"
                value={form.hardCap}
                onChange={(e) => updateField("hardCap", e.target.value)}
                error={errors.hardCap}
                leftAddon="$"
              />
              <Input
                label="Soft Cap"
                placeholder="Optional minimum raise"
                type="number"
                value={form.softCap}
                onChange={(e) => updateField("softCap", e.target.value)}
                leftAddon="$"
                helperText="Leave empty for no soft cap"
              />
              <Input
                label="Min Contribution *"
                placeholder="e.g. 100"
                type="number"
                value={form.minContribution}
                onChange={(e) => updateField("minContribution", e.target.value)}
                error={errors.minContribution}
                leftAddon="$"
              />
              <Input
                label="Max Contribution Per User *"
                placeholder="e.g. 50000"
                type="number"
                value={form.maxContribution}
                onChange={(e) => updateField("maxContribution", e.target.value)}
                error={errors.maxContribution}
                leftAddon="$"
              />
              <Select
                label="Allocation Method *"
                placeholder="Select method"
                value={form.allocationMethod}
                onChange={(e) => updateField("allocationMethod", e.target.value)}
                error={errors.allocationMethod}
                options={[
                  { value: "guaranteed", label: "Guaranteed" },
                  { value: "pro-rata", label: "Pro-Rata" },
                  { value: "lottery", label: "Lottery" },
                  { value: "fcfs", label: "First Come First Serve" },
                  { value: "hybrid", label: "Hybrid" },
                ]}
              />
              <div className="flex items-end pb-1">
                <Toggle
                  checked={form.oversubscription}
                  onCheckedChange={(v) => updateField("oversubscription", v)}
                  label="Allow Oversubscription"
                />
              </div>
            </div>
          )}

          {/* Step 3: Timeline */}
          {currentStep === 3 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Input
                label="Registration Open *"
                type="datetime-local"
                value={form.registrationOpen}
                onChange={(e) => updateField("registrationOpen", e.target.value)}
                error={errors.registrationOpen}
              />
              <Input
                label="Registration Close *"
                type="datetime-local"
                value={form.registrationClose}
                onChange={(e) => updateField("registrationClose", e.target.value)}
                error={errors.registrationClose}
              />
              <Input
                label="Contribution Open *"
                type="datetime-local"
                value={form.contributionOpen}
                onChange={(e) => updateField("contributionOpen", e.target.value)}
                error={errors.contributionOpen}
              />
              <Input
                label="Contribution Close *"
                type="datetime-local"
                value={form.contributionClose}
                onChange={(e) => updateField("contributionClose", e.target.value)}
                error={errors.contributionClose}
              />
              <Input
                label="Distribution Date *"
                type="datetime-local"
                value={form.distributionDate}
                onChange={(e) => updateField("distributionDate", e.target.value)}
                error={errors.distributionDate}
              />
              <Input
                label="Vesting Start Date"
                type="datetime-local"
                value={form.vestingStartDate}
                onChange={(e) => updateField("vestingStartDate", e.target.value)}
              />
              <Select
                label="Vesting Type"
                placeholder="Select vesting type"
                value={form.vestingType}
                onChange={(e) => updateField("vestingType", e.target.value)}
                options={[
                  { value: "none", label: "No Vesting" },
                  { value: "linear", label: "Linear" },
                  { value: "cliff-then-linear", label: "Cliff + Linear" },
                  { value: "monthly", label: "Monthly Unlock" },
                  { value: "custom", label: "Custom Schedule" },
                ]}
              />
              <Input
                label="TGE Unlock %"
                placeholder="e.g. 20"
                type="number"
                value={form.tgeUnlockPercent}
                onChange={(e) => updateField("tgeUnlockPercent", e.target.value)}
                rightAddon="%"
                helperText="Percentage unlocked at token generation event"
              />
              <Input
                label="Cliff (Days)"
                placeholder="e.g. 90"
                type="number"
                value={form.cliffDays}
                onChange={(e) => updateField("cliffDays", e.target.value)}
              />
              <Input
                label="Vesting Duration (Days)"
                placeholder="e.g. 365"
                type="number"
                value={form.vestingDurationDays}
                onChange={(e) => updateField("vestingDurationDays", e.target.value)}
              />
            </div>
          )}

          {/* Step 4: Access Control */}
          {currentStep === 4 && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
                  <Toggle
                    checked={form.requireKyc}
                    onCheckedChange={(v) => updateField("requireKyc", v)}
                    label="Require KYC"
                  />
                  <p className="mt-2 text-xs text-zinc-500">
                    Users must complete KYC verification to participate
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
                  <Toggle
                    checked={form.requireAccreditation}
                    onCheckedChange={(v) =>
                      updateField("requireAccreditation", v)
                    }
                    label="Require Accreditation"
                  />
                  <p className="mt-2 text-xs text-zinc-500">
                    Only accredited investors can participate
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
                  <Toggle
                    checked={form.whitelistOnly}
                    onCheckedChange={(v) => updateField("whitelistOnly", v)}
                    label="Whitelist Only"
                  />
                  <p className="mt-2 text-xs text-zinc-500">
                    Restrict participation to whitelisted wallets
                  </p>
                </div>
              </div>

              {form.whitelistOnly && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">
                    Whitelist CSV Upload
                  </label>
                  <div className="flex h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/30 transition-colors hover:border-zinc-600">
                    <div className="flex flex-col items-center gap-1 text-zinc-500">
                      <Upload className="h-5 w-5" />
                      <span className="text-xs">
                        Upload CSV with wallet addresses
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Select
                label="Minimum Tier"
                placeholder="No minimum tier"
                value={form.minTier}
                onChange={(e) => updateField("minTier", e.target.value)}
                options={[
                  { value: "", label: "No Minimum" },
                  { value: "bronze", label: "Bronze" },
                  { value: "silver", label: "Silver" },
                  { value: "gold", label: "Gold" },
                  { value: "platinum", label: "Platinum" },
                  { value: "diamond", label: "Diamond" },
                ]}
              />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">
                    Allowed Countries
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter country codes separated by commas (e.g. US, GB, DE)&#10;Leave empty to allow all non-blocked countries"
                    value={form.allowedCountries}
                    onChange={(e) =>
                      updateField("allowedCountries", e.target.value)
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">
                    Blocked Countries
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter country codes separated by commas (e.g. KP, IR, CU)&#10;Standard sanctions list applied by default"
                    value={form.blockedCountries}
                    onChange={(e) =>
                      updateField("blockedCountries", e.target.value)
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="flex flex-col gap-6">
              {/* Basic Info Review */}
              <div className="rounded-lg border border-zinc-800 p-4">
                <h4 className="mb-3 text-sm font-semibold text-zinc-300">
                  Basic Info
                </h4>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <ReviewRow label="Project Name" value={form.projectName || "\u2014"} />
                  <ReviewRow label="Slug" value={form.slug || "\u2014"} />
                  <ReviewRow label="Category" value={form.category || "\u2014"} />
                  <ReviewRow label="Chain" value={form.chain || "\u2014"} />
                  <ReviewRow label="Short Description" value={form.shortDescription || "\u2014"} />
                  <ReviewRow label="Website" value={form.website || "\u2014"} />
                </div>
              </div>

              {/* Token Details Review */}
              <div className="rounded-lg border border-zinc-800 p-4">
                <h4 className="mb-3 text-sm font-semibold text-zinc-300">
                  Token Details
                </h4>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <ReviewRow label="Token Name" value={form.tokenName || "\u2014"} />
                  <ReviewRow label="Ticker" value={form.ticker || "\u2014"} />
                  <ReviewRow
                    label="Total Supply"
                    value={form.totalSupply ? Number(form.totalSupply).toLocaleString() : "\u2014"}
                  />
                  <ReviewRow
                    label="Token Price"
                    value={form.tokenPrice ? `$${form.tokenPrice}` : "\u2014"}
                  />
                  <ReviewRow
                    label="FDV"
                    value={fdv > 0 ? formatCurrency(fdv) : "\u2014"}
                  />
                  <ReviewRow label="Raise Token" value={form.raiseToken || "\u2014"} />
                </div>
              </div>

              {/* Raise Config Review */}
              <div className="rounded-lg border border-zinc-800 p-4">
                <h4 className="mb-3 text-sm font-semibold text-zinc-300">
                  Raise Configuration
                </h4>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <ReviewRow
                    label="Hard Cap"
                    value={form.hardCap ? formatCurrency(Number(form.hardCap)) : "\u2014"}
                  />
                  <ReviewRow
                    label="Soft Cap"
                    value={form.softCap ? formatCurrency(Number(form.softCap)) : "None"}
                  />
                  <ReviewRow
                    label="Min Contribution"
                    value={
                      form.minContribution
                        ? formatCurrency(Number(form.minContribution))
                        : "\u2014"
                    }
                  />
                  <ReviewRow
                    label="Max Contribution"
                    value={
                      form.maxContribution
                        ? formatCurrency(Number(form.maxContribution))
                        : "\u2014"
                    }
                  />
                  <ReviewRow label="Allocation Method" value={form.allocationMethod || "\u2014"} />
                  <ReviewRow
                    label="Oversubscription"
                    value={form.oversubscription ? "Enabled" : "Disabled"}
                  />
                </div>
              </div>

              {/* Timeline Review */}
              <div className="rounded-lg border border-zinc-800 p-4">
                <h4 className="mb-3 text-sm font-semibold text-zinc-300">
                  Timeline
                </h4>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <ReviewRow label="Registration Open" value={form.registrationOpen || "\u2014"} />
                  <ReviewRow label="Registration Close" value={form.registrationClose || "\u2014"} />
                  <ReviewRow label="Contribution Open" value={form.contributionOpen || "\u2014"} />
                  <ReviewRow label="Contribution Close" value={form.contributionClose || "\u2014"} />
                  <ReviewRow label="Distribution Date" value={form.distributionDate || "\u2014"} />
                  <ReviewRow label="Vesting Type" value={form.vestingType || "None"} />
                  <ReviewRow label="TGE Unlock" value={form.tgeUnlockPercent ? `${form.tgeUnlockPercent}%` : "\u2014"} />
                  <ReviewRow label="Cliff" value={form.cliffDays ? `${form.cliffDays} days` : "\u2014"} />
                  <ReviewRow label="Duration" value={form.vestingDurationDays ? `${form.vestingDurationDays} days` : "\u2014"} />
                </div>
              </div>

              {/* Access Control Review */}
              <div className="rounded-lg border border-zinc-800 p-4">
                <h4 className="mb-3 text-sm font-semibold text-zinc-300">
                  Access Control
                </h4>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <ReviewRow label="Require KYC" value={form.requireKyc ? "Yes" : "No"} />
                  <ReviewRow label="Require Accreditation" value={form.requireAccreditation ? "Yes" : "No"} />
                  <ReviewRow label="Whitelist Only" value={form.whitelistOnly ? "Yes" : "No"} />
                  <ReviewRow label="Min Tier" value={form.minTier || "None"} />
                </div>
              </div>

              {/* Submit error */}
              {submitError && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4">
                  <p className="text-sm text-rose-400">{submitError}</p>
                </div>
              )}

              {/* Submit buttons */}
              <div className="flex items-center gap-3">
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Deal
                </Button>
                <Button variant="secondary" onClick={handleSubmit} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save as Draft
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      {currentStep < 5 && (
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={goBack}
            disabled={currentStep === 0}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <Button
            onClick={goNext}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Next
          </Button>
        </div>
      )}

      {currentStep === 5 && (
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={goBack}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Review row helper                                                          */
/* -------------------------------------------------------------------------- */

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-1">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-200">{value}</span>
    </div>
  );
}
