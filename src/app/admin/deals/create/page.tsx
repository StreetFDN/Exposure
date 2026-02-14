"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface FormData {
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
  tokenName: string;
  ticker: string;
  totalSupply: string;
  tokenPrice: string;
  distributionTokenAddress: string;
  raiseToken: string;
  hardCap: string;
  softCap: string;
  minContribution: string;
  maxContribution: string;
  allocationMethod: string;
  oversubscription: boolean;
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
  requireKyc: boolean;
  requireAccreditation: boolean;
  whitelistOnly: boolean;
  minTier: string;
  allowedCountries: string;
  blockedCountries: string;
}

const defaultForm: FormData = {
  projectName: "", slug: "", shortDescription: "", fullDescription: "",
  category: "", chain: "", website: "", twitter: "", discord: "", telegram: "",
  github: "", featuredImageUrl: "", bannerImageUrl: "", tokenName: "", ticker: "",
  totalSupply: "", tokenPrice: "", distributionTokenAddress: "", raiseToken: "",
  hardCap: "", softCap: "", minContribution: "", maxContribution: "",
  allocationMethod: "", oversubscription: false, registrationOpen: "",
  registrationClose: "", contributionOpen: "", contributionClose: "",
  distributionDate: "", vestingStartDate: "", vestingType: "", tgeUnlockPercent: "",
  cliffDays: "", vestingDurationDays: "", requireKyc: true,
  requireAccreditation: false, whitelistOnly: false, minTier: "",
  allowedCountries: "", blockedCountries: "",
};

/* -------------------------------------------------------------------------- */
/*  Steps                                                                      */
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
    if (!form.projectName.trim()) errors.projectName = "Required";
    if (!form.shortDescription.trim()) errors.shortDescription = "Required";
    if (!form.category) errors.category = "Required";
    if (!form.chain) errors.chain = "Required";
  }
  if (step === 1) {
    if (!form.tokenName.trim()) errors.tokenName = "Required";
    if (!form.ticker.trim()) errors.ticker = "Required";
    if (!form.totalSupply || Number(form.totalSupply) <= 0) errors.totalSupply = "Must be positive";
    if (!form.tokenPrice || Number(form.tokenPrice) <= 0) errors.tokenPrice = "Must be positive";
    if (!form.raiseToken) errors.raiseToken = "Required";
  }
  if (step === 2) {
    if (!form.hardCap || Number(form.hardCap) <= 0) errors.hardCap = "Required";
    if (!form.minContribution || Number(form.minContribution) <= 0) errors.minContribution = "Required";
    if (!form.maxContribution || Number(form.maxContribution) <= 0) errors.maxContribution = "Required";
    if (!form.allocationMethod) errors.allocationMethod = "Required";
  }
  if (step === 3) {
    if (!form.registrationOpen) errors.registrationOpen = "Required";
    if (!form.registrationClose) errors.registrationClose = "Required";
    if (!form.contributionOpen) errors.contributionOpen = "Required";
    if (!form.contributionClose) errors.contributionClose = "Required";
    if (!form.distributionDate) errors.distributionDate = "Required";
  }
  return errors;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function toISOString(datetimeLocal: string): string | undefined {
  if (!datetimeLocal) return undefined;
  return new Date(datetimeLocal).toISOString();
}

const categoryApiMap: Record<string, string> = { DeFi: "DEFI", Infrastructure: "INFRASTRUCTURE", Gaming: "GAMING", AI: "AI", RWA: "OTHER", Social: "SOCIAL", NFT: "NFT", DAO: "OTHER" };
const chainApiMap: Record<string, string> = { ethereum: "ETHEREUM", arbitrum: "ARBITRUM", base: "BASE", polygon: "ETHEREUM", optimism: "ETHEREUM", avalanche: "ETHEREUM" };
const allocationApiMap: Record<string, string> = { guaranteed: "GUARANTEED", "pro-rata": "PRO_RATA", lottery: "LOTTERY", fcfs: "FCFS", hybrid: "HYBRID" };
const vestingApiMap: Record<string, string> = { none: "LINEAR", linear: "LINEAR", "cliff-then-linear": "TGE_PLUS_LINEAR", monthly: "MONTHLY_CLIFF", custom: "CUSTOM" };
const tierApiMap: Record<string, string> = { bronze: "BRONZE", silver: "SILVER", gold: "GOLD", platinum: "PLATINUM", diamond: "DIAMOND" };

/* -------------------------------------------------------------------------- */
/*  Form field component                                                       */
/* -------------------------------------------------------------------------- */

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-xs uppercase tracking-widest text-zinc-500">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-zinc-500">{error}</p>}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  prefix,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  prefix?: string;
}) {
  return (
    <div className="flex items-center border border-zinc-200 transition-colors focus-within:border-zinc-400">
      {prefix && (
        <span className="px-3 text-sm font-normal text-zinc-500">{prefix}</span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent px-3 py-2.5 text-sm font-normal text-zinc-700 outline-none placeholder:text-zinc-300"
      />
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-zinc-200 bg-transparent px-3 py-2.5 text-sm font-normal text-zinc-600 outline-none transition-colors focus:border-zinc-400"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
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
        if (key === "projectName" && typeof value === "string") {
          next.slug = toSlug(value);
        }
        return next;
      });
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

  const fdv =
    Number(form.totalSupply) > 0 && Number(form.tokenPrice) > 0
      ? Number(form.totalSupply) * Number(form.tokenPrice)
      : 0;

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);

      const body: Record<string, unknown> = {
        title: form.projectName,
        slug: form.slug || toSlug(form.projectName),
        shortDescription: form.shortDescription || undefined,
        description: form.fullDescription || form.shortDescription,
        projectName: form.projectName,
        category: categoryApiMap[form.category] || "OTHER",
        chain: chainApiMap[form.chain] || "ETHEREUM",
        tokenPrice: form.tokenPrice,
        totalRaise: form.hardCap,
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
        throw new Error(json.error?.message || json.error?.details || "Failed to create deal");
      }
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
        <Link
          href="/admin/deals"
          className="p-1 text-zinc-500 transition-colors hover:text-zinc-600"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-light text-zinc-900">
            Create Deal
          </h1>
          <p className="mt-1 text-sm font-normal text-zinc-500">
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
                "flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                idx === currentStep && "text-zinc-900",
                idx < currentStep && "cursor-pointer text-zinc-500 hover:text-zinc-700",
                idx > currentStep && "cursor-default text-zinc-400"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center text-[10px]",
                  idx === currentStep && "border border-zinc-900 text-zinc-900",
                  idx < currentStep && "border border-emerald-600 text-emerald-600",
                  idx > currentStep && "border border-zinc-300 text-zinc-400"
                )}
              >
                {idx < currentStep ? (
                  <Check className="h-3 w-3" />
                ) : (
                  idx + 1
                )}
              </span>
              <span className="hidden font-normal md:inline">{step.label}</span>
            </button>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-px w-6",
                  idx < currentStep ? "bg-emerald-500" : "bg-zinc-200"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form content */}
      <div className="border border-zinc-200 p-6">
        <h2 className="mb-6 text-xs uppercase tracking-widest text-zinc-500">
          {STEPS[currentStep].label}
        </h2>

        {/* Step 0: Basic Info */}
        {currentStep === 0 && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Field label="Project Name *" error={errors.projectName}>
              <TextInput value={form.projectName} onChange={(v) => updateField("projectName", v)} placeholder="e.g. Nexus Protocol" />
            </Field>
            <Field label="Slug">
              <TextInput value={form.slug} onChange={(v) => updateField("slug", v)} placeholder="auto-generated" />
            </Field>
            <Field label="Short Description *" error={errors.shortDescription} className="lg:col-span-2">
              <TextInput value={form.shortDescription} onChange={(v) => updateField("shortDescription", v)} placeholder="One-line summary" />
            </Field>
            <Field label="Full Description" className="lg:col-span-2">
              <textarea
                rows={4}
                value={form.fullDescription}
                onChange={(e) => updateField("fullDescription", e.target.value)}
                placeholder="Detailed project description..."
                className="w-full border border-zinc-200 bg-transparent px-3 py-2.5 text-sm font-normal text-zinc-700 outline-none transition-colors placeholder:text-zinc-300 focus:border-zinc-400"
              />
            </Field>
            <Field label="Category *" error={errors.category}>
              <SelectInput value={form.category} onChange={(v) => updateField("category", v)} placeholder="Select" options={[
                { value: "DeFi", label: "DeFi" }, { value: "Infrastructure", label: "Infrastructure" },
                { value: "Gaming", label: "Gaming" }, { value: "AI", label: "AI / ML" },
                { value: "RWA", label: "Real World Assets" }, { value: "Social", label: "Social" },
                { value: "NFT", label: "NFT / Metaverse" }, { value: "DAO", label: "DAO Tooling" },
              ]} />
            </Field>
            <Field label="Chain *" error={errors.chain}>
              <SelectInput value={form.chain} onChange={(v) => updateField("chain", v)} placeholder="Select" options={[
                { value: "ethereum", label: "Ethereum" }, { value: "arbitrum", label: "Arbitrum" }, { value: "base", label: "Base" },
              ]} />
            </Field>
            <Field label="Website">
              <TextInput value={form.website} onChange={(v) => updateField("website", v)} placeholder="https://example.com" />
            </Field>
            <Field label="Twitter">
              <TextInput value={form.twitter} onChange={(v) => updateField("twitter", v)} placeholder="https://twitter.com/handle" />
            </Field>
            <Field label="Discord">
              <TextInput value={form.discord} onChange={(v) => updateField("discord", v)} placeholder="https://discord.gg/..." />
            </Field>
            <Field label="Telegram">
              <TextInput value={form.telegram} onChange={(v) => updateField("telegram", v)} placeholder="https://t.me/..." />
            </Field>
            <Field label="Featured Image URL">
              <TextInput value={form.featuredImageUrl} onChange={(v) => updateField("featuredImageUrl", v)} placeholder="https://..." />
            </Field>
            <Field label="Banner Image URL">
              <TextInput value={form.bannerImageUrl} onChange={(v) => updateField("bannerImageUrl", v)} placeholder="https://... (1200x400)" />
            </Field>
          </div>
        )}

        {/* Step 1: Token Details */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Field label="Token Name *" error={errors.tokenName}>
              <TextInput value={form.tokenName} onChange={(v) => updateField("tokenName", v)} placeholder="e.g. Nexus Token" />
            </Field>
            <Field label="Ticker *" error={errors.ticker}>
              <TextInput value={form.ticker} onChange={(v) => updateField("ticker", v.toUpperCase())} placeholder="e.g. NXS" />
            </Field>
            <Field label="Total Supply *" error={errors.totalSupply}>
              <TextInput value={form.totalSupply} onChange={(v) => updateField("totalSupply", v)} placeholder="e.g. 1000000000" type="number" />
            </Field>
            <Field label="Token Price (USD) *" error={errors.tokenPrice}>
              <TextInput value={form.tokenPrice} onChange={(v) => updateField("tokenPrice", v)} placeholder="e.g. 0.05" type="number" prefix="$" />
            </Field>
            <Field label="FDV (Calculated)">
              <div className="flex h-10 items-center border border-zinc-200 px-3 text-sm font-normal text-zinc-500">
                {fdv > 0 ? formatCurrency(fdv) : "Auto-calculated"}
              </div>
            </Field>
            <Field label="Distribution Token Address">
              <TextInput value={form.distributionTokenAddress} onChange={(v) => updateField("distributionTokenAddress", v)} placeholder="0x..." />
            </Field>
            <Field label="Raise Token *" error={errors.raiseToken}>
              <SelectInput value={form.raiseToken} onChange={(v) => updateField("raiseToken", v)} placeholder="Select" options={[
                { value: "USDC", label: "USDC" }, { value: "USDT", label: "USDT" }, { value: "ETH", label: "ETH" },
              ]} />
            </Field>
          </div>
        )}

        {/* Step 2: Raise Config */}
        {currentStep === 2 && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Field label="Hard Cap *" error={errors.hardCap}>
              <TextInput value={form.hardCap} onChange={(v) => updateField("hardCap", v)} placeholder="e.g. 3000000" type="number" prefix="$" />
            </Field>
            <Field label="Soft Cap">
              <TextInput value={form.softCap} onChange={(v) => updateField("softCap", v)} placeholder="Optional" type="number" prefix="$" />
            </Field>
            <Field label="Min Contribution *" error={errors.minContribution}>
              <TextInput value={form.minContribution} onChange={(v) => updateField("minContribution", v)} placeholder="e.g. 100" type="number" prefix="$" />
            </Field>
            <Field label="Max Contribution *" error={errors.maxContribution}>
              <TextInput value={form.maxContribution} onChange={(v) => updateField("maxContribution", v)} placeholder="e.g. 50000" type="number" prefix="$" />
            </Field>
            <Field label="Allocation Method *" error={errors.allocationMethod}>
              <SelectInput value={form.allocationMethod} onChange={(v) => updateField("allocationMethod", v)} placeholder="Select" options={[
                { value: "guaranteed", label: "Guaranteed" }, { value: "pro-rata", label: "Pro-Rata" },
                { value: "lottery", label: "Lottery" }, { value: "fcfs", label: "First Come First Serve" },
                { value: "hybrid", label: "Hybrid" },
              ]} />
            </Field>
            <Field label="Oversubscription">
              <label className="flex cursor-pointer items-center gap-3 border border-zinc-200 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={form.oversubscription}
                  onChange={(e) => updateField("oversubscription", e.target.checked)}
                  className="accent-violet-500"
                />
                <span className="text-sm font-normal text-zinc-600">Allow oversubscription</span>
              </label>
            </Field>
          </div>
        )}

        {/* Step 3: Timeline */}
        {currentStep === 3 && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Field label="Registration Open *" error={errors.registrationOpen}>
              <TextInput value={form.registrationOpen} onChange={(v) => updateField("registrationOpen", v)} type="datetime-local" />
            </Field>
            <Field label="Registration Close *" error={errors.registrationClose}>
              <TextInput value={form.registrationClose} onChange={(v) => updateField("registrationClose", v)} type="datetime-local" />
            </Field>
            <Field label="Contribution Open *" error={errors.contributionOpen}>
              <TextInput value={form.contributionOpen} onChange={(v) => updateField("contributionOpen", v)} type="datetime-local" />
            </Field>
            <Field label="Contribution Close *" error={errors.contributionClose}>
              <TextInput value={form.contributionClose} onChange={(v) => updateField("contributionClose", v)} type="datetime-local" />
            </Field>
            <Field label="Distribution Date *" error={errors.distributionDate}>
              <TextInput value={form.distributionDate} onChange={(v) => updateField("distributionDate", v)} type="datetime-local" />
            </Field>
            <Field label="Vesting Start Date">
              <TextInput value={form.vestingStartDate} onChange={(v) => updateField("vestingStartDate", v)} type="datetime-local" />
            </Field>
            <Field label="Vesting Type">
              <SelectInput value={form.vestingType} onChange={(v) => updateField("vestingType", v)} placeholder="Select" options={[
                { value: "none", label: "No Vesting" }, { value: "linear", label: "Linear" },
                { value: "cliff-then-linear", label: "Cliff + Linear" }, { value: "monthly", label: "Monthly Unlock" },
                { value: "custom", label: "Custom Schedule" },
              ]} />
            </Field>
            <Field label="TGE Unlock %">
              <TextInput value={form.tgeUnlockPercent} onChange={(v) => updateField("tgeUnlockPercent", v)} placeholder="e.g. 20" type="number" />
            </Field>
            <Field label="Cliff (Days)">
              <TextInput value={form.cliffDays} onChange={(v) => updateField("cliffDays", v)} placeholder="e.g. 90" type="number" />
            </Field>
            <Field label="Vesting Duration (Days)">
              <TextInput value={form.vestingDurationDays} onChange={(v) => updateField("vestingDurationDays", v)} placeholder="e.g. 365" type="number" />
            </Field>
          </div>
        )}

        {/* Step 4: Access Control */}
        {currentStep === 4 && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-px border border-zinc-200 bg-zinc-200 sm:grid-cols-3">
              {[
                { key: "requireKyc" as const, label: "Require KYC", desc: "Users must complete KYC verification" },
                { key: "requireAccreditation" as const, label: "Require Accreditation", desc: "Only accredited investors" },
                { key: "whitelistOnly" as const, label: "Whitelist Only", desc: "Restrict to whitelisted wallets" },
              ].map((item) => (
                <label key={item.key} className="flex cursor-pointer flex-col gap-2 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form[item.key] as boolean}
                      onChange={(e) => updateField(item.key, e.target.checked)}
                      className="accent-violet-500"
                    />
                    <span className="text-sm font-normal text-zinc-700">{item.label}</span>
                  </div>
                  <p className="text-xs font-normal text-zinc-400">{item.desc}</p>
                </label>
              ))}
            </div>

            {form.whitelistOnly && (
              <div className="flex h-20 cursor-pointer items-center justify-center border border-dashed border-zinc-200 transition-colors hover:border-zinc-400">
                <div className="flex items-center gap-2 text-zinc-500">
                  <Upload className="h-4 w-4" />
                  <span className="text-xs">Upload CSV with wallet addresses</span>
                </div>
              </div>
            )}

            <Field label="Minimum Tier">
              <SelectInput value={form.minTier} onChange={(v) => updateField("minTier", v)} placeholder="No minimum" options={[
                { value: "", label: "No Minimum" }, { value: "bronze", label: "Bronze" },
                { value: "silver", label: "Silver" }, { value: "gold", label: "Gold" },
                { value: "platinum", label: "Platinum" }, { value: "diamond", label: "Diamond" },
              ]} />
            </Field>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Field label="Allowed Countries">
                <textarea
                  rows={3}
                  value={form.allowedCountries}
                  onChange={(e) => updateField("allowedCountries", e.target.value)}
                  placeholder="e.g. US, GB, DE (leave empty to allow all)"
                  className="w-full border border-zinc-200 bg-transparent px-3 py-2.5 text-sm font-normal text-zinc-700 outline-none transition-colors placeholder:text-zinc-300 focus:border-zinc-400"
                />
              </Field>
              <Field label="Blocked Countries">
                <textarea
                  rows={3}
                  value={form.blockedCountries}
                  onChange={(e) => updateField("blockedCountries", e.target.value)}
                  placeholder="e.g. KP, IR, CU"
                  className="w-full border border-zinc-200 bg-transparent px-3 py-2.5 text-sm font-normal text-zinc-700 outline-none transition-colors placeholder:text-zinc-300 focus:border-zinc-400"
                />
              </Field>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {currentStep === 5 && (
          <div className="flex flex-col gap-6">
            {[
              {
                title: "Basic Info",
                rows: [
                  ["Project Name", form.projectName], ["Slug", form.slug],
                  ["Category", form.category], ["Chain", form.chain],
                  ["Description", form.shortDescription], ["Website", form.website || "\u2014"],
                ],
              },
              {
                title: "Token Details",
                rows: [
                  ["Token Name", form.tokenName], ["Ticker", form.ticker],
                  ["Total Supply", form.totalSupply ? Number(form.totalSupply).toLocaleString() : "\u2014"],
                  ["Token Price", form.tokenPrice ? `$${form.tokenPrice}` : "\u2014"],
                  ["FDV", fdv > 0 ? formatCurrency(fdv) : "\u2014"],
                  ["Raise Token", form.raiseToken || "\u2014"],
                ],
              },
              {
                title: "Raise Configuration",
                rows: [
                  ["Hard Cap", form.hardCap ? formatCurrency(Number(form.hardCap)) : "\u2014"],
                  ["Soft Cap", form.softCap ? formatCurrency(Number(form.softCap)) : "None"],
                  ["Min Contribution", form.minContribution ? formatCurrency(Number(form.minContribution)) : "\u2014"],
                  ["Max Contribution", form.maxContribution ? formatCurrency(Number(form.maxContribution)) : "\u2014"],
                  ["Allocation", form.allocationMethod || "\u2014"],
                  ["Oversubscription", form.oversubscription ? "Enabled" : "Disabled"],
                ],
              },
              {
                title: "Access Control",
                rows: [
                  ["Require KYC", form.requireKyc ? "Yes" : "No"],
                  ["Accreditation", form.requireAccreditation ? "Yes" : "No"],
                  ["Whitelist Only", form.whitelistOnly ? "Yes" : "No"],
                  ["Min Tier", form.minTier || "None"],
                ],
              },
            ].map((section) => (
              <div key={section.title} className="border border-zinc-200 p-4">
                <p className="mb-3 text-xs uppercase tracking-widest text-zinc-500">
                  {section.title}
                </p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  {section.rows.map(([label, value]) => (
                    <div key={label} className="flex flex-col gap-0.5 py-1">
                      <span className="text-xs font-normal text-zinc-500">{label}</span>
                      <span className="text-sm text-zinc-700">{value || "\u2014"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {submitError && (
              <div className="border border-zinc-300 bg-zinc-50 p-4">
                <p className="text-sm font-normal text-zinc-500">{submitError}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="border border-zinc-900 px-6 py-2.5 text-sm font-normal text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white disabled:opacity-50"
              >
                {submitting && <Loader2 className="mr-2 inline h-3 w-3 animate-spin" />}
                Create Deal
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="border border-zinc-200 px-6 py-2.5 text-sm font-normal text-zinc-500 transition-colors hover:text-zinc-700 disabled:opacity-50"
              >
                Save as Draft
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={goBack}
          disabled={currentStep === 0}
          className="flex items-center gap-2 text-sm font-normal text-zinc-500 transition-colors hover:text-zinc-700 disabled:opacity-30"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        {currentStep < 5 && (
          <button
            onClick={goNext}
            className="flex items-center gap-2 text-sm font-normal text-zinc-600 transition-colors hover:text-zinc-900"
          >
            Next
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
