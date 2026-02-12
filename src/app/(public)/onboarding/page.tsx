"use client";

import * as React from "react";
import Link from "next/link";
import {
  Shield,
  Upload,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  User,
  FileText,
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  Copy,
  Info,
  X,
  Mail,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InvestorClassification =
  | "retail"
  | "experienced"
  | "sophisticated"
  | null;

type USAccreditationBasis =
  | "income"
  | "net_worth"
  | "licensed_professional"
  | "qualified_purchaser"
  | "none"
  | null;

interface QuestionnaireData {
  yearsInvesting: string;
  investmentTypes: string[];
  digitalAssetFamiliarity: string;
  tokenSaleExperience: string;
  riskAssessmentAbility: string;
  annualIncome: string;
  netWorth: string;
  riskAcknowledged: boolean;
}

interface OnboardingData {
  // Step 1: Auth
  authMethod: "email" | "twitter" | "wallet" | null;
  email: string;
  displayName: string;

  // Step 2: Assessment
  country: string;
  questionnaire: QuestionnaireData;
  investorClassification: InvestorClassification;
  // US Accreditation (Reg D)
  usAccreditationBasis: USAccreditationBasis;
  usAccreditationCertified: boolean;

  // Step 3: KYC
  identityDocument: File | null;
  identityDocumentName: string;
  proofOfAddress: File | null;
  proofOfAddressName: string;
  proofOfAddressDate: string;
  kycStatus: "pending" | "submitted" | "verified" | null;

  // Step 4: Wallet
  walletMethod: "existing" | "embedded" | null;
  walletAddress: string;
  selectedChain: string;

  // Step 5: Attestation
  attestationId: string;
  attestationType: string;
  attestationIssuedDate: string;
  attestationExpiryDate: string;
}

const INITIAL_QUESTIONNAIRE: QuestionnaireData = {
  yearsInvesting: "",
  investmentTypes: [],
  digitalAssetFamiliarity: "",
  tokenSaleExperience: "",
  riskAssessmentAbility: "",
  annualIncome: "",
  netWorth: "",
  riskAcknowledged: false,
};

const INITIAL_DATA: OnboardingData = {
  authMethod: null,
  email: "",
  displayName: "",
  country: "",
  questionnaire: { ...INITIAL_QUESTIONNAIRE },
  investorClassification: null,
  usAccreditationBasis: null,
  usAccreditationCertified: false,
  identityDocument: null,
  identityDocumentName: "",
  proofOfAddress: null,
  proofOfAddressName: "",
  proofOfAddressDate: "",
  kycStatus: null,
  walletMethod: null,
  walletAddress: "",
  selectedChain: "base",
  attestationId: "",
  attestationType: "",
  attestationIssuedDate: "",
  attestationExpiryDate: "",
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS = [
  { label: "Sign In", icon: User },
  { label: "Assessment", icon: Shield },
  { label: "Verify Identity", icon: FileText },
  { label: "Connect Wallet", icon: Wallet },
  { label: "Attestation", icon: ShieldCheck },
] as const;

const BLOCKED_COUNTRIES = [
  "KP",
  "IR",
  "CU",
  "SY",
  "MM",
  "RU",
  "BY",
];

const ACCREDITATION_REQUIRED_COUNTRIES = ["US"];

const COUNTRY_OPTIONS = [
  { value: "", label: "Select your jurisdiction", disabled: true },
  { value: "AU", label: "Australia" },
  { value: "AT", label: "Austria" },
  { value: "BE", label: "Belgium" },
  { value: "BR", label: "Brazil" },
  { value: "CA", label: "Canada" },
  { value: "CH", label: "Switzerland" },
  { value: "DE", label: "Germany" },
  { value: "DK", label: "Denmark" },
  { value: "ES", label: "Spain" },
  { value: "FI", label: "Finland" },
  { value: "FR", label: "France" },
  { value: "GB", label: "United Kingdom" },
  { value: "HK", label: "Hong Kong" },
  { value: "IE", label: "Ireland" },
  { value: "IL", label: "Israel" },
  { value: "IN", label: "India" },
  { value: "IT", label: "Italy" },
  { value: "JP", label: "Japan" },
  { value: "KR", label: "South Korea" },
  { value: "LU", label: "Luxembourg" },
  { value: "MX", label: "Mexico" },
  { value: "NL", label: "Netherlands" },
  { value: "NO", label: "Norway" },
  { value: "NZ", label: "New Zealand" },
  { value: "PL", label: "Poland" },
  { value: "PT", label: "Portugal" },
  { value: "SE", label: "Sweden" },
  { value: "SG", label: "Singapore" },
  { value: "US", label: "United States" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "ZA", label: "South Africa" },
];

const CHAIN_OPTIONS = [
  { value: "base", label: "Base" },
  { value: "ethereum", label: "Ethereum" },
  { value: "arbitrum", label: "Arbitrum" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateAttestationHash(): string {
  const hex = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 40; i++) {
    hash += hex[Math.floor(Math.random() * 16)];
  }
  return hash;
}

function computeInvestorClassification(
  q: QuestionnaireData
): InvestorClassification {
  const years = q.yearsInvesting;
  const familiarity = q.digitalAssetFamiliarity;
  const tokenSales = q.tokenSaleExperience;
  const riskAbility = q.riskAssessmentAbility;

  // Sophisticated: 5+ years, very familiar, 10+ deals, can assess independently
  if (
    years === "5+" &&
    familiarity === "very_familiar" &&
    tokenSales === "10+" &&
    riskAbility === "independently"
  ) {
    return "sophisticated";
  }

  // Experienced: 3+ years, familiar+ with digital assets, has done token sales
  const hasThreePlusYears = years === "3-5" || years === "5+";
  const isFamiliar =
    familiarity === "familiar" || familiarity === "very_familiar";
  const hasDoneTokenSales =
    tokenSales === "1-3" || tokenSales === "4-10" || tokenSales === "10+";

  if (hasThreePlusYears && isFamiliar && hasDoneTokenSales) {
    return "experienced";
  }

  // Retail: less experience
  return "retail";
}

// ---------------------------------------------------------------------------
// Reusable: Custom Checkbox
// ---------------------------------------------------------------------------

function CustomCheckbox({
  checked,
  onChange,
  children,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn("flex cursor-pointer items-start gap-3", className)}
    >
      <div className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded border transition-all duration-150",
            checked
              ? "border-violet-500 bg-violet-500"
              : "border-zinc-600 bg-zinc-900"
          )}
        >
          {checked && <Check className="h-3 w-3 text-white" />}
        </div>
      </div>
      <span className="text-sm text-zinc-300">{children}</span>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Reusable: Radio Group
// ---------------------------------------------------------------------------

function RadioOption({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={() => onChange(value)}
          className="peer sr-only"
        />
        <div
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-150",
            checked
              ? "border-violet-500"
              : "border-zinc-600"
          )}
        >
          {checked && (
            <div className="h-2.5 w-2.5 rounded-full bg-violet-500" />
          )}
        </div>
      </div>
      <span className="text-sm text-zinc-300">{children}</span>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Stepper Component
// ---------------------------------------------------------------------------

function Stepper({
  currentStep,
  completedSteps,
}: {
  currentStep: number;
  completedSteps: Set<number>;
}) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.has(index);
          const isCurrent = index === currentStep;
          const isFuture = !isCompleted && !isCurrent;
          const StepIcon = step.icon;

          return (
            <React.Fragment key={step.label}>
              {/* Step node */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                    isCompleted &&
                      "border-violet-500 bg-violet-500 text-white",
                    isCurrent &&
                      "border-violet-500 bg-violet-500/10 text-violet-400",
                    isFuture &&
                      "border-zinc-700 bg-zinc-900 text-zinc-600"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium transition-colors duration-300",
                    isCompleted && "text-violet-400",
                    isCurrent && "text-zinc-50",
                    isFuture && "text-zinc-600"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div className="mb-6 flex-1 px-2">
                  <div
                    className={cn(
                      "h-px w-full transition-colors duration-500",
                      completedSteps.has(index)
                        ? "bg-violet-500"
                        : "bg-zinc-800"
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Sign In — Email + Twitter/X + Wallet
// ---------------------------------------------------------------------------

function StepAuth({
  data,
  onUpdate,
}: {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
}) {
  const [connecting, setConnecting] = React.useState<string | null>(null);
  const [emailSent, setEmailSent] = React.useState(false);
  const [emailInput, setEmailInput] = React.useState(data.email);

  const handleEmailSignIn = () => {
    if (!emailInput || !emailInput.includes("@")) return;
    setConnecting("email");
    setTimeout(() => {
      setEmailSent(true);
      onUpdate({
        authMethod: "email",
        email: emailInput,
        displayName: emailInput,
      });
      setConnecting(null);
    }, 1500);
  };

  const handleTwitterConnect = () => {
    setConnecting("twitter");
    setTimeout(() => {
      onUpdate({
        authMethod: "twitter",
        displayName: "@investor_anon",
      });
      setConnecting(null);
    }, 1500);
  };

  const handleWalletConnect = (walletName: string) => {
    setConnecting(walletName);
    setTimeout(() => {
      onUpdate({
        authMethod: "wallet",
        displayName: "0x7a3b...4f2e",
      });
      setConnecting(null);
    }, 1200);
  };

  const isConnected = data.authMethod !== null;

  return (
    <div className="flex flex-col items-center text-center">
      {/* Branding */}
      <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
        <Shield className="h-8 w-8 text-violet-400" />
      </div>
      <h2 className="mt-4 text-2xl font-bold text-zinc-50">
        Welcome to Exposure
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
        Sign in to begin your onboarding. Your account links to a
        Privy-powered embedded wallet — no seed phrases, no friction.
      </p>

      {/* Connected state */}
      {isConnected && (
        <div className="mt-6 flex w-full max-w-sm items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <div className="text-left">
            <p className="text-sm font-medium text-emerald-400">
              Signed in as {data.displayName}
            </p>
            <p className="text-xs text-zinc-500">
              via{" "}
              {data.authMethod === "email"
                ? "Email"
                : data.authMethod === "twitter"
                  ? "X (Twitter)"
                  : "Wallet"}
            </p>
          </div>
        </div>
      )}

      {!isConnected && (
        <>
          {/* Email login — PRIMARY */}
          <div className="mt-8 w-full max-w-sm">
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="you@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                leftAddon={<Mail className="h-4 w-4" />}
                disabled={connecting !== null}
              />
              <button
                onClick={handleEmailSignIn}
                disabled={
                  connecting !== null ||
                  !emailInput ||
                  !emailInput.includes("@")
                }
                className={cn(
                  "flex h-14 w-full items-center justify-center gap-3 rounded-xl border text-sm font-semibold transition-all duration-200",
                  "border-violet-500 bg-violet-500 text-white hover:bg-violet-600",
                  (connecting === "email" ||
                    !emailInput ||
                    !emailInput.includes("@")) &&
                    "opacity-70 cursor-not-allowed"
                )}
              >
                {connecting === "email" ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-300 border-t-white" />
                ) : (
                  <Mail className="h-5 w-5" />
                )}
                {connecting === "email"
                  ? "Sending magic link..."
                  : "Continue with Email"}
              </button>
              <p className="text-xs text-zinc-500">
                We&apos;ll send you a magic link. No seed phrases, no friction.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-6 flex w-full max-w-sm items-center gap-4">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-xs font-medium text-zinc-600">or</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          {/* Twitter/X login */}
          <div className="mt-6 flex w-full max-w-sm flex-col gap-3">
            <button
              onClick={handleTwitterConnect}
              disabled={connecting !== null}
              className={cn(
                "flex h-14 items-center justify-center gap-3 rounded-xl border text-sm font-semibold transition-all duration-200",
                "border-zinc-700 bg-zinc-900 text-zinc-50 hover:border-zinc-600 hover:bg-zinc-800",
                connecting === "twitter" && "opacity-70"
              )}
            >
              {connecting === "twitter" ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-violet-400" />
              ) : (
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              )}
              {connecting === "twitter"
                ? "Connecting..."
                : "Continue with X"}
            </button>

            {/* Direct wallet connection */}
            <div>
              <button
                onClick={() => handleWalletConnect("wallet")}
                disabled={connecting !== null}
                className={cn(
                  "flex h-14 w-full items-center justify-center gap-3 rounded-xl border text-sm font-semibold transition-all duration-200",
                  "border-zinc-700 bg-zinc-900 text-zinc-50 hover:border-zinc-600 hover:bg-zinc-800",
                  connecting !== null &&
                    connecting !== "twitter" &&
                    connecting !== "email" &&
                    "opacity-70"
                )}
              >
                {connecting !== null &&
                connecting !== "twitter" &&
                connecting !== "email" ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-violet-400" />
                ) : (
                  <Wallet className="h-5 w-5" />
                )}
                {connecting !== null &&
                connecting !== "twitter" &&
                connecting !== "email"
                  ? "Connecting..."
                  : "Connect Wallet"}
              </button>
              {/* Wallet options */}
              <div className="mt-2 flex items-center justify-center gap-4">
                {["MetaMask", "Rabby", "Ledger"].map((w) => (
                  <button
                    key={w}
                    onClick={() => handleWalletConnect(w)}
                    disabled={connecting !== null}
                    className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Info note */}
      <div className="mt-8 flex max-w-sm items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-left">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
        <p className="text-xs leading-relaxed text-zinc-500">
          Your login creates a Privy-powered embedded wallet automatically.
          You can also connect an external wallet in a later step. All data
          is encrypted and never shared with third parties.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Investor Sophistication Questionnaire + US Accreditation
// ---------------------------------------------------------------------------

function StepAssessment({
  data,
  onUpdate,
}: {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
}) {
  const isBlocked = BLOCKED_COUNTRIES.includes(data.country);
  const isUSPerson = ACCREDITATION_REQUIRED_COUNTRIES.includes(data.country);
  const q = data.questionnaire;

  const updateQuestionnaire = (updates: Partial<QuestionnaireData>) => {
    const newQ = { ...q, ...updates };
    const classification = computeInvestorClassification(newQ);
    onUpdate({
      questionnaire: newQ,
      investorClassification: classification,
    });
  };

  const toggleInvestmentType = (type: string) => {
    const current = q.investmentTypes;
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    updateQuestionnaire({ investmentTypes: next });
  };

  // Check if the questionnaire section is complete
  const isQuestionnaireComplete =
    q.yearsInvesting !== "" &&
    q.investmentTypes.length > 0 &&
    q.digitalAssetFamiliarity !== "" &&
    q.tokenSaleExperience !== "" &&
    q.riskAssessmentAbility !== "" &&
    q.annualIncome !== "" &&
    q.netWorth !== "" &&
    q.riskAcknowledged;

  // Check if US accreditation section is complete (only required for US persons)
  const isUSAccreditationComplete = isUSPerson
    ? data.usAccreditationBasis !== null && data.usAccreditationCertified
    : true;

  // Overall step completion
  const isAssessmentComplete =
    data.country !== "" &&
    !isBlocked &&
    isQuestionnaireComplete &&
    isUSAccreditationComplete;

  // Sync eligibility status upward
  React.useEffect(() => {
    if (isBlocked) {
      onUpdate({ investorClassification: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBlocked]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-zinc-50">
          Investor Assessment
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Regulatory requirements vary by jurisdiction. Complete this
          assessment to determine your investor classification.
        </p>
      </div>

      <div className="space-y-8">
        {/* ----------------------------------------------------------------- */}
        {/* Section A: Jurisdiction */}
        {/* ----------------------------------------------------------------- */}
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-violet-400">
            Section A: Jurisdiction
          </p>
          <Select
            label="Country / Jurisdiction"
            options={COUNTRY_OPTIONS}
            value={data.country}
            placeholder="Select your jurisdiction"
            onChange={(e) =>
              onUpdate({
                country: e.target.value,
                usAccreditationBasis: null,
                usAccreditationCertified: false,
              })
            }
          />

          {/* Blocked warning */}
          {isBlocked && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/5 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <div>
                <p className="text-sm font-medium text-rose-400">
                  Restricted Jurisdiction
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Unfortunately, participation from your jurisdiction is not
                  permitted under current regulatory requirements. This
                  restriction is in place to ensure compliance with applicable
                  laws.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Section B: Investment Experience Assessment */}
        {/* ----------------------------------------------------------------- */}
        {data.country && !isBlocked && (
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-violet-400">
              Section B: Investment Experience Assessment
            </p>

            <div className="space-y-6">
              {/* Q1: Years investing */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-300">
                  1. How many years have you been actively investing?
                </p>
                <div className="space-y-2 pl-1">
                  {[
                    { value: "<1", label: "Less than 1 year" },
                    { value: "1-3", label: "1-3 years" },
                    { value: "3-5", label: "3-5 years" },
                    { value: "5+", label: "5+ years" },
                  ].map((opt) => (
                    <RadioOption
                      key={opt.value}
                      name="yearsInvesting"
                      value={opt.value}
                      checked={q.yearsInvesting === opt.value}
                      onChange={(v) =>
                        updateQuestionnaire({ yearsInvesting: v })
                      }
                    >
                      {opt.label}
                    </RadioOption>
                  ))}
                </div>
              </div>

              {/* Q2: Investment types (multi-select) */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-300">
                  2. Which types of investments have you made?
                </p>
                <p className="text-xs text-zinc-500">Select all that apply.</p>
                <div className="space-y-2 pl-1">
                  {[
                    "Public equities/stocks",
                    "Bonds/fixed income",
                    "Real estate",
                    "Private equity/venture capital",
                    "Cryptocurrency/digital assets",
                    "Early-stage startups",
                    "None of the above",
                  ].map((type) => (
                    <CustomCheckbox
                      key={type}
                      checked={q.investmentTypes.includes(type)}
                      onChange={() => {
                        if (type === "None of the above") {
                          // If selecting "None", clear others
                          if (q.investmentTypes.includes(type)) {
                            updateQuestionnaire({ investmentTypes: [] });
                          } else {
                            updateQuestionnaire({
                              investmentTypes: [type],
                            });
                          }
                        } else {
                          // If selecting a real type, remove "None of the above"
                          const filtered = q.investmentTypes.filter(
                            (t) => t !== "None of the above"
                          );
                          const next = filtered.includes(type)
                            ? filtered.filter((t) => t !== type)
                            : [...filtered, type];
                          updateQuestionnaire({ investmentTypes: next });
                        }
                      }}
                    >
                      {type}
                    </CustomCheckbox>
                  ))}
                </div>
              </div>

              {/* Q3: Digital asset familiarity */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-300">
                  3. How familiar are you with early-stage digital asset
                  investments?
                </p>
                <div className="space-y-2 pl-1">
                  {[
                    { value: "not_familiar", label: "Not familiar" },
                    {
                      value: "somewhat_familiar",
                      label: "Somewhat familiar",
                    },
                    { value: "familiar", label: "Familiar" },
                    {
                      value: "very_familiar",
                      label: "Very familiar / professional experience",
                    },
                  ].map((opt) => (
                    <RadioOption
                      key={opt.value}
                      name="digitalAssetFamiliarity"
                      value={opt.value}
                      checked={q.digitalAssetFamiliarity === opt.value}
                      onChange={(v) =>
                        updateQuestionnaire({
                          digitalAssetFamiliarity: v,
                        })
                      }
                    >
                      {opt.label}
                    </RadioOption>
                  ))}
                </div>
              </div>

              {/* Q4: Token sale experience */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-300">
                  4. Have you previously invested in token sales, IDOs, or
                  private crypto rounds?
                </p>
                <div className="space-y-2 pl-1">
                  {[
                    { value: "no", label: "No" },
                    { value: "1-3", label: "Yes (1-3 times)" },
                    { value: "4-10", label: "Yes (4-10 times)" },
                    { value: "10+", label: "Yes (10+ times)" },
                  ].map((opt) => (
                    <RadioOption
                      key={opt.value}
                      name="tokenSaleExperience"
                      value={opt.value}
                      checked={q.tokenSaleExperience === opt.value}
                      onChange={(v) =>
                        updateQuestionnaire({ tokenSaleExperience: v })
                      }
                    >
                      {opt.label}
                    </RadioOption>
                  ))}
                </div>
              </div>

              {/* Q5: Risk assessment ability */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-300">
                  5. Can you assess business prospects and risks of early-stage
                  projects?
                </p>
                <div className="space-y-2 pl-1">
                  {[
                    { value: "no", label: "No" },
                    { value: "somewhat", label: "Somewhat" },
                    {
                      value: "with_support",
                      label: "Yes, with support",
                    },
                    {
                      value: "independently",
                      label: "Yes, independently",
                    },
                  ].map((opt) => (
                    <RadioOption
                      key={opt.value}
                      name="riskAssessmentAbility"
                      value={opt.value}
                      checked={q.riskAssessmentAbility === opt.value}
                      onChange={(v) =>
                        updateQuestionnaire({
                          riskAssessmentAbility: v,
                        })
                      }
                    >
                      {opt.label}
                    </RadioOption>
                  ))}
                </div>
              </div>

              {/* Q6: Annual income */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-300">
                  6. What is your approximate annual income?
                </p>
                <div className="space-y-2 pl-1">
                  {[
                    { value: "<50k", label: "Under $50K" },
                    { value: "50k-100k", label: "$50K - $100K" },
                    { value: "100k-200k", label: "$100K - $200K" },
                    { value: "200k-300k", label: "$200K - $300K" },
                    { value: "300k+", label: "Over $300K" },
                  ].map((opt) => (
                    <RadioOption
                      key={opt.value}
                      name="annualIncome"
                      value={opt.value}
                      checked={q.annualIncome === opt.value}
                      onChange={(v) =>
                        updateQuestionnaire({ annualIncome: v })
                      }
                    >
                      {opt.label}
                    </RadioOption>
                  ))}
                </div>
              </div>

              {/* Q7: Net worth */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-300">
                  7. What is your approximate net worth (excluding primary
                  residence)?
                </p>
                <div className="space-y-2 pl-1">
                  {[
                    { value: "<100k", label: "Under $100K" },
                    { value: "100k-500k", label: "$100K - $500K" },
                    { value: "500k-1m", label: "$500K - $1M" },
                    { value: "1m+", label: "Over $1M" },
                  ].map((opt) => (
                    <RadioOption
                      key={opt.value}
                      name="netWorth"
                      value={opt.value}
                      checked={q.netWorth === opt.value}
                      onChange={(v) =>
                        updateQuestionnaire({ netWorth: v })
                      }
                    >
                      {opt.label}
                    </RadioOption>
                  ))}
                </div>
              </div>

              {/* Q8: Risk acknowledgment */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-300">
                  8. Risk acknowledgment
                </p>
                <div className="pl-1">
                  <CustomCheckbox
                    checked={q.riskAcknowledged}
                    onChange={(v) =>
                      updateQuestionnaire({ riskAcknowledged: v })
                    }
                  >
                    I understand that investments in early-stage projects carry
                    significant risk including total loss of capital
                  </CustomCheckbox>
                </div>
              </div>

              {/* Investor classification result */}
              {isQuestionnaireComplete && data.investorClassification && (
                <div className="flex items-center gap-3 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4">
                  <Shield className="h-5 w-5 shrink-0 text-violet-400" />
                  <div>
                    <p className="text-sm font-medium text-violet-400">
                      Classification:{" "}
                      {data.investorClassification === "sophisticated"
                        ? "Sophisticated Investor"
                        : data.investorClassification === "experienced"
                          ? "Experienced Investor"
                          : "Retail Investor"}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {data.investorClassification === "sophisticated"
                        ? "Full access to all offerings on Exposure."
                        : data.investorClassification === "experienced"
                          ? "Access to most offerings. Some deals may have additional requirements."
                          : "Access may be restricted on certain deals. Additional experience may be required for some offerings."}
                    </p>
                  </div>
                </div>
              )}

              {/* Self-certification notice */}
              <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                <p className="text-xs leading-relaxed text-zinc-500">
                  This is a self-certification assessment. Exposure reserves the
                  right to request supporting documentation to verify any claims
                  made above. Providing false information may result in account
                  termination.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Section C: US Accredited Investor Qualification (Reg D 506(c)) */}
        {/* ----------------------------------------------------------------- */}
        {data.country && !isBlocked && isUSPerson && isQuestionnaireComplete && (
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-violet-400">
              US Accredited Investor Qualification (Reg D 506(c))
            </p>

            <div className="space-y-4">
              <p className="text-sm text-zinc-300">
                To participate in private offerings as a US person, you must
                qualify as an Accredited Investor under SEC Regulation D.
              </p>

              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-300">
                  I qualify because:
                </p>
                <div className="space-y-3 pl-1">
                  <RadioOption
                    name="usAccreditation"
                    value="income"
                    checked={data.usAccreditationBasis === "income"}
                    onChange={() =>
                      onUpdate({ usAccreditationBasis: "income" })
                    }
                  >
                    My individual annual income exceeded $200,000 in each of the
                    two most recent years (or $300,000 jointly with spouse)
                  </RadioOption>
                  <RadioOption
                    name="usAccreditation"
                    value="net_worth"
                    checked={data.usAccreditationBasis === "net_worth"}
                    onChange={() =>
                      onUpdate({ usAccreditationBasis: "net_worth" })
                    }
                  >
                    My net worth exceeds $1,000,000 (individually or jointly,
                    excluding primary residence)
                  </RadioOption>
                  <RadioOption
                    name="usAccreditation"
                    value="licensed_professional"
                    checked={
                      data.usAccreditationBasis === "licensed_professional"
                    }
                    onChange={() =>
                      onUpdate({
                        usAccreditationBasis: "licensed_professional",
                      })
                    }
                  >
                    I am a licensed securities professional (Series 7, 65, or
                    82)
                  </RadioOption>
                  <RadioOption
                    name="usAccreditation"
                    value="qualified_purchaser"
                    checked={
                      data.usAccreditationBasis === "qualified_purchaser"
                    }
                    onChange={() =>
                      onUpdate({
                        usAccreditationBasis: "qualified_purchaser",
                      })
                    }
                  >
                    I am a Qualified Purchaser (individual with $5M+ in
                    investments)
                  </RadioOption>
                  <RadioOption
                    name="usAccreditation"
                    value="none"
                    checked={data.usAccreditationBasis === "none"}
                    onChange={() =>
                      onUpdate({ usAccreditationBasis: "none" })
                    }
                  >
                    None of the above — I do not qualify
                  </RadioOption>
                </div>
              </div>

              {/* Warning for non-accredited US persons */}
              {data.usAccreditationBasis === "none" && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <div>
                    <p className="text-sm font-medium text-amber-400">
                      Limited Access
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      US persons who do not qualify as Accredited Investors are
                      unable to participate in most offerings on Exposure. Some
                      deals with Reg CF exemptions may be available.
                    </p>
                  </div>
                </div>
              )}

              {/* Certification checkbox */}
              {data.usAccreditationBasis !== null && (
                <CustomCheckbox
                  checked={data.usAccreditationCertified}
                  onChange={(v) =>
                    onUpdate({ usAccreditationCertified: v })
                  }
                >
                  I certify under penalty of law that the above is true and
                  accurate
                </CustomCheckbox>
              )}
            </div>
          </div>
        )}

        {/* Overall completion indicator */}
        {isAssessmentComplete && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <p className="text-sm font-medium text-emerald-400">
              Assessment complete. Continue to identity verification.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: KYC Verification (Stricter Rules)
// ---------------------------------------------------------------------------

function StepKYC({
  data,
  onUpdate,
}: {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
}) {
  const identityInputRef = React.useRef<HTMLInputElement>(null);
  const addressInputRef = React.useRef<HTMLInputElement>(null);

  const handleIdentityUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdate({
        identityDocument: file,
        identityDocumentName: file.name,
      });
    }
  };

  const handleAddressUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdate({
        proofOfAddress: file,
        proofOfAddressName: file.name,
      });
    }
  };

  const handleSubmitKYC = () => {
    onUpdate({ kycStatus: "submitted" });
  };

  const canSubmit =
    data.identityDocumentName &&
    data.proofOfAddressName &&
    data.proofOfAddressDate;

  if (data.kycStatus === "submitted") {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-500/30 bg-amber-500/10">
          <Clock className="h-7 w-7 text-amber-400" />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-zinc-50">
          Verification Pending
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
          Your documents have been submitted for review. Verification is
          conducted manually by our compliance team and typically takes
          24-48 hours.
        </p>
        <div className="mt-6 flex items-center gap-2">
          <Badge variant="warning" size="md">
            Under Review
          </Badge>
        </div>
        <p className="mt-6 text-xs text-zinc-500">
          You will receive a notification once your verification is
          complete. You may continue the onboarding process in the meantime.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-zinc-50">
          Identity Verification
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Upload your documents for KYC review. All files are encrypted and
          stored securely.
        </p>
      </div>

      <div className="space-y-6">
        {/* Identity Document — PASSPORT ONLY */}
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Identity Document
          </label>
          <p className="mb-3 text-xs text-zinc-500">
            Valid passport only. Must be current and not expired.
          </p>
          <div className="mb-3 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-xs text-amber-400">
              Government-issued national ID cards and driver&apos;s licenses are
              NOT accepted. Passport is the only accepted identity document.
            </p>
          </div>
          <input
            ref={identityInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleIdentityUpload}
            className="sr-only"
          />
          <button
            onClick={() => identityInputRef.current?.click()}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all duration-200",
              data.identityDocumentName
                ? "border-violet-500/40 bg-violet-500/5"
                : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800"
            )}
          >
            {data.identityDocumentName ? (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10">
                  <CheckCircle2 className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-50">
                    {data.identityDocumentName}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Click to replace
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                  <Upload className="h-5 w-5 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-300">
                    Click to upload or drag and drop
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    PDF, JPG, or PNG up to 10MB
                  </p>
                </div>
              </>
            )}
          </button>
        </div>

        {/* Proof of Address */}
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Proof of Address
          </label>
          <p className="mb-3 text-xs text-zinc-500">
            Document must be dated within the last 3 months and clearly show
            your name and residential address.
          </p>
          <input
            ref={addressInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleAddressUpload}
            className="sr-only"
          />
          <button
            onClick={() => addressInputRef.current?.click()}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all duration-200",
              data.proofOfAddressName
                ? "border-violet-500/40 bg-violet-500/5"
                : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800"
            )}
          >
            {data.proofOfAddressName ? (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10">
                  <CheckCircle2 className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-50">
                    {data.proofOfAddressName}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Click to replace
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                  <Upload className="h-5 w-5 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-300">
                    Click to upload or drag and drop
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    PDF, JPG, or PNG up to 10MB
                  </p>
                </div>
              </>
            )}
          </button>

          {/* Document date input */}
          <div className="mt-4">
            <Input
              type="date"
              label="Document Date"
              value={data.proofOfAddressDate}
              onChange={(e) =>
                onUpdate({ proofOfAddressDate: e.target.value })
              }
              helperText="Document must be dated within the last 3 months."
            />
          </div>
        </div>

        {/* Accepted / Rejected docs */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Accepted Documents
            </p>
            <ul className="space-y-1.5 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-400" />
                Utility bills (electricity, water, gas)
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-400" />
                Bank statements (traditional banks only)
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-400" />
                Government residential certificates
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-400" />
                Tax notices
              </li>
            </ul>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-400">
              Not Accepted
            </p>
            <ul className="space-y-1.5 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <X className="h-3 w-3 text-rose-400" />
                Neobank statements (Revolut, Wise, N26, etc.)
              </li>
              <li className="flex items-center gap-2">
                <X className="h-3 w-3 text-rose-400" />
                Screenshots or digital photos
              </li>
              <li className="flex items-center gap-2">
                <X className="h-3 w-3 text-rose-400" />
                Mobile phone bills
              </li>
              <li className="flex items-center gap-2">
                <X className="h-3 w-3 text-rose-400" />
                Medical or insurance bills
              </li>
              <li className="flex items-center gap-2">
                <X className="h-3 w-3 text-rose-400" />
                Documents older than 3 months
              </li>
            </ul>
          </div>
        </div>

        {/* Re-verification notice */}
        <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
          <div>
            <p className="text-xs font-medium text-zinc-300">
              Re-verification
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
              Your verification expires after 12 months. You will be notified
              when re-verification is required.
            </p>
          </div>
        </div>

        {/* EDD notice */}
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div>
            <p className="text-xs font-medium text-amber-400">
              Enhanced Due Diligence (EDD)
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
              In some cases, Enhanced Due Diligence (EDD) may be required. This
              includes additional documentation such as source of funds or
              wealth declarations.
            </p>
          </div>
        </div>

        {/* Timing note */}
        <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
          <p className="text-xs leading-relaxed text-zinc-500">
            Verification is reviewed manually by our compliance team,
            typically within 24-48 hours. You will be notified once the
            review is complete.
          </p>
        </div>

        {/* Submit button */}
        {canSubmit && (
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmitKYC}
            leftIcon={<Shield className="h-4 w-4" />}
          >
            Submit for Verification
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Wallet Setup
// ---------------------------------------------------------------------------

function StepWallet({
  data,
  onUpdate,
}: {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
}) {
  const [connecting, setConnecting] = React.useState(false);

  const handleConnectExisting = (wallet: string) => {
    setConnecting(true);
    setTimeout(() => {
      onUpdate({
        walletMethod: "existing",
        walletAddress: "0x7a3b...4f2e",
      });
      setConnecting(false);
    }, 1200);
  };

  const handleCreateEmbedded = () => {
    setConnecting(true);
    setTimeout(() => {
      onUpdate({
        walletMethod: "embedded",
        walletAddress: "0x9c1d...8a3b",
      });
      setConnecting(false);
    }, 1500);
  };

  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(data.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-zinc-50">Wallet Setup</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Connect an existing wallet or create a new embedded wallet to
          receive your allocations.
        </p>
      </div>

      <div className="space-y-6">
        {/* Option A: Existing wallet */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Option A: Connect Existing Wallet
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { name: "MetaMask", icon: "🦊" },
              { name: "Rabby", icon: "🐰" },
              { name: "Ledger", icon: "🔐" },
            ].map((wallet) => (
              <button
                key={wallet.name}
                onClick={() => handleConnectExisting(wallet.name)}
                disabled={connecting || !!data.walletAddress}
                className={cn(
                  "flex h-20 flex-col items-center justify-center gap-2 rounded-xl border transition-all duration-200",
                  data.walletMethod === "existing" && data.walletAddress
                    ? "border-violet-500/40 bg-violet-500/5"
                    : "border-zinc-700 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800",
                  (connecting || !!data.walletAddress) &&
                    "opacity-50 cursor-not-allowed"
                )}
              >
                <span className="text-2xl">{wallet.icon}</span>
                <span className="text-xs font-medium text-zinc-300">
                  {wallet.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-xs font-medium text-zinc-600">or</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        {/* Option B: Embedded wallet */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Option B: Create Embedded Wallet
          </p>
          <button
            onClick={handleCreateEmbedded}
            disabled={connecting || !!data.walletAddress}
            className={cn(
              "flex w-full items-center gap-4 rounded-xl border p-5 text-left transition-all duration-200",
              data.walletMethod === "embedded" && data.walletAddress
                ? "border-violet-500/40 bg-violet-500/5"
                : "border-zinc-700 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800",
              (connecting || !!data.walletAddress) &&
                "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800">
              <Wallet className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-50">
                Privy Embedded Wallet
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">
                No extension needed. A secure wallet is created and managed
                through your Exposure account automatically.
              </p>
            </div>
          </button>
        </div>

        {/* Loading */}
        {connecting && (
          <div className="flex items-center justify-center gap-3 py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-violet-400" />
            <span className="text-sm text-zinc-400">
              Connecting wallet...
            </span>
          </div>
        )}

        {/* Wallet connected state */}
        {data.walletAddress && !connecting && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-emerald-400">
                  Wallet Connected
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="text-xs text-zinc-300">
                    {data.walletAddress}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="text-zinc-500 transition-colors hover:text-zinc-300"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <Badge
                variant={
                  data.walletMethod === "embedded" ? "default" : "outline"
                }
                size="sm"
              >
                {data.walletMethod === "embedded"
                  ? "Embedded"
                  : "External"}
              </Badge>
            </div>

            {/* Chain selector */}
            <Select
              label="Preferred Network"
              options={CHAIN_OPTIONS}
              value={data.selectedChain}
              onChange={(e) =>
                onUpdate({ selectedChain: e.target.value })
              }
              helperText="Select the network you plan to use for investments."
            />

            {/* USDC instruction */}
            <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
              <div>
                <p className="text-xs font-medium text-zinc-300">
                  Funding Requirement
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                  Ensure you have USDC available on your selected network
                  before participating in deals. Contributions are accepted
                  in USDC only.
                </p>
              </div>
            </div>

            {/* Reset wallet option */}
            <button
              onClick={() =>
                onUpdate({
                  walletMethod: null,
                  walletAddress: "",
                })
              }
              className="text-xs text-zinc-500 transition-colors hover:text-zinc-400"
            >
              Disconnect and choose a different wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5: Sonar eID Attestation
// ---------------------------------------------------------------------------

function StepAttestation({
  data,
}: {
  data: OnboardingData;
}) {
  const countryLabel =
    COUNTRY_OPTIONS.find((c) => c.value === data.country)?.label ??
    data.country;

  const isUSPerson = ACCREDITATION_REQUIRED_COUNTRIES.includes(data.country);
  const isAccredited =
    isUSPerson &&
    data.usAccreditationBasis !== null &&
    data.usAccreditationBasis !== "none";

  const attestationType =
    data.attestationType ||
    (isAccredited
      ? "Accredited Investor"
      : data.investorClassification === "sophisticated"
        ? "Sophisticated Investor"
        : data.investorClassification === "experienced"
          ? "Experienced Investor"
          : "Verified Investor");

  return (
    <div>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-500/30 bg-emerald-500/10">
          <ShieldCheck className="h-8 w-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-50">
          Sonar eID Attestation
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Your verified identity has been cryptographically attested on-chain.
        </p>
      </div>

      {/* Attestation card */}
      <div className="overflow-hidden rounded-xl border border-violet-500/30 bg-gradient-to-b from-violet-500/5 to-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-violet-500/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10">
              <ShieldCheck className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-50">
                Sonar eID
              </p>
              <p className="text-xs text-zinc-500">
                On-Chain Identity Attestation
              </p>
            </div>
          </div>
          <Badge variant="success" size="sm">
            Active
          </Badge>
        </div>

        {/* Attestation details */}
        <div className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-zinc-500">Attestation ID</p>
              <code className="mt-1 block text-sm font-medium text-zinc-50 break-all">
                {data.attestationId}
              </code>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Wallet Bound To</p>
              <code className="mt-1 block text-sm font-medium text-zinc-50">
                {data.walletAddress}
              </code>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Issued</p>
              <p className="mt-1 text-sm font-medium text-zinc-50">
                {data.attestationIssuedDate}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Expires</p>
              <p className="mt-1 text-sm font-medium text-zinc-50">
                {data.attestationExpiryDate}
              </p>
            </div>
          </div>

          {/* Attestation type badge */}
          <div className="flex items-center justify-between rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-violet-400" />
              <p className="text-sm font-medium text-violet-400">
                Attestation Type
              </p>
            </div>
            <Badge variant="default" size="md">
              {attestationType}
            </Badge>
          </div>

          {/* Jurisdiction */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-zinc-500">Jurisdiction</p>
                <p className="mt-1 text-sm font-medium text-zinc-50">
                  {countryLabel}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">KYC Status</p>
                <div className="mt-1">
                  <Badge
                    variant={
                      data.kycStatus === "verified"
                        ? "success"
                        : data.kycStatus === "submitted"
                          ? "warning"
                          : "outline"
                    }
                    size="sm"
                  >
                    {data.kycStatus === "verified"
                      ? "Verified"
                      : data.kycStatus === "submitted"
                        ? "Pending Review"
                        : "Not Submitted"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* View on Explorer link */}
          <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-300">
            <ExternalLink className="h-4 w-4" />
            View on Explorer
          </button>
        </div>
      </div>

      {/* Info notes */}
      <div className="mt-6 space-y-3">
        <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
          <p className="text-xs leading-relaxed text-zinc-500">
            This attestation allows projects to verify your eligibility
            without accessing your personal information.
          </p>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
          <p className="text-xs leading-relaxed text-zinc-500">
            Your attestation is portable — it works across all deals on
            Exposure.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <Link href="/deals" className="w-full sm:w-auto">
          <Button
            size="lg"
            className="w-full sm:w-auto"
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Start Exploring Deals
          </Button>
        </Link>
        <Link
          href="/dashboard"
          className="text-xs text-zinc-500 transition-colors hover:text-zinc-400"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Onboarding Page
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(
    new Set()
  );
  const [data, setData] = React.useState<OnboardingData>(INITIAL_DATA);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  // Derived state for assessment completion
  const isUSPerson = ACCREDITATION_REQUIRED_COUNTRIES.includes(data.country);
  const isBlocked = BLOCKED_COUNTRIES.includes(data.country);

  const isQuestionnaireComplete =
    data.questionnaire.yearsInvesting !== "" &&
    data.questionnaire.investmentTypes.length > 0 &&
    data.questionnaire.digitalAssetFamiliarity !== "" &&
    data.questionnaire.tokenSaleExperience !== "" &&
    data.questionnaire.riskAssessmentAbility !== "" &&
    data.questionnaire.annualIncome !== "" &&
    data.questionnaire.netWorth !== "" &&
    data.questionnaire.riskAcknowledged;

  const isUSAccreditationComplete = isUSPerson
    ? data.usAccreditationBasis !== null && data.usAccreditationCertified
    : true;

  const isAssessmentComplete =
    data.country !== "" &&
    !isBlocked &&
    isQuestionnaireComplete &&
    isUSAccreditationComplete;

  // Validation per step
  const canProceed = React.useMemo(() => {
    switch (currentStep) {
      case 0:
        return data.authMethod !== null;
      case 1:
        return isAssessmentComplete;
      case 2:
        return data.kycStatus === "submitted";
      case 3:
        return !!data.walletAddress;
      case 4:
        return true;
      default:
        return false;
    }
  }, [
    currentStep,
    data.authMethod,
    data.kycStatus,
    data.walletAddress,
    isAssessmentComplete,
  ]);

  const handleNext = () => {
    if (!canProceed) return;

    // Mark current step as completed
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(currentStep);
      return next;
    });

    // Generate attestation data when entering final step
    if (currentStep === 3) {
      const now = new Date();
      const expiry = new Date(now);
      expiry.setFullYear(expiry.getFullYear() + 1);

      const isAccredited =
        isUSPerson &&
        data.usAccreditationBasis !== null &&
        data.usAccreditationBasis !== "none";

      const attestationType = isAccredited
        ? "Accredited Investor"
        : data.investorClassification === "sophisticated"
          ? "Sophisticated Investor"
          : data.investorClassification === "experienced"
            ? "Experienced Investor"
            : "Verified Investor";

      updateData({
        attestationId: generateAttestationHash(),
        attestationType,
        attestationIssuedDate: now.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        attestationExpiryDate: expiry.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      });
    }

    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <Badge variant="default" size="sm">
          Investor Onboarding
        </Badge>
        <h1 className="mt-3 text-3xl font-bold text-zinc-50">
          Get Started with Exposure
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Complete the following steps to set up your investor profile.
        </p>
      </div>

      {/* Stepper */}
      <Stepper currentStep={currentStep} completedSteps={completedSteps} />

      {/* Step content card */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 0 && (
            <StepAuth data={data} onUpdate={updateData} />
          )}
          {currentStep === 1 && (
            <StepAssessment data={data} onUpdate={updateData} />
          )}
          {currentStep === 2 && (
            <StepKYC data={data} onUpdate={updateData} />
          )}
          {currentStep === 3 && (
            <StepWallet data={data} onUpdate={updateData} />
          )}
          {currentStep === 4 && <StepAttestation data={data} />}
        </CardContent>
      </Card>

      {/* Navigation */}
      {currentStep < 4 && (
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            size="md"
            onClick={handleBack}
            disabled={currentStep === 0}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">
              Step {currentStep + 1} of {STEPS.length}
            </span>
          </div>

          <Button
            size="md"
            onClick={handleNext}
            disabled={!canProceed}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            {currentStep === 3 ? "Complete Setup" : "Continue"}
          </Button>
        </div>
      )}
    </div>
  );
}
