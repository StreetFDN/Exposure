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
  ExternalLink,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useAccount, useSignMessage, useSwitchChain } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { SiweMessage } from "siwe";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { api, ApiError } from "@/lib/api/client";
import { useAuthContext } from "@/app/providers";
import { mainnet, base, arbitrum } from "wagmi/chains";

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

interface LinkedWalletData {
  id: string;
  address: string;
  chain: string;
  isPrimary: boolean;
  linkedAt: string;
}

interface OnboardingData {
  // Step 1: Auth
  authMethod: "wallet" | null;
  walletAddress: string;
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
  linkedWallets: LinkedWalletData[];
  selectedChain: string;

  // Step 5: Attestation
  attestationHash: string;
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
  walletAddress: "",
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
  linkedWallets: [],
  selectedChain: "base",
  attestationHash: "",
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

const CHAIN_ID_MAP: Record<string, number> = {
  ethereum: mainnet.id,
  base: base.id,
  arbitrum: arbitrum.id,
};

const CHAIN_ENUM_MAP: Record<string, string> = {
  base: "BASE",
  ethereum: "ETHEREUM",
  arbitrum: "ARBITRUM",
};

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

function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
// Reusable: Inline Error
// ---------------------------------------------------------------------------

function InlineError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
      <p className="text-sm text-rose-400">{message}</p>
    </div>
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
// Step 1: Sign In — Wallet Connection via SIWE
// ---------------------------------------------------------------------------

function StepAuth({
  data,
  onUpdate,
  onAutoAdvance,
}: {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onAutoAdvance: () => void;
}) {
  const { address, isConnected, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { openConnectModal } = useConnectModal();
  const { setSession } = useAuthContext();

  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Track whether we have already kicked off auto-SIWE for this wallet connection
  const siweAttemptedRef = React.useRef<string | null>(null);

  const isSignedIn = data.authMethod === "wallet";

  // Once the wallet connects, automatically start SIWE flow
  React.useEffect(() => {
    if (
      isConnected &&
      address &&
      chainId &&
      !isSignedIn &&
      !isAuthenticating &&
      siweAttemptedRef.current !== address
    ) {
      siweAttemptedRef.current = address;
      handleSiweSignIn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, chainId, isSignedIn]);

  const handleSiweSignIn = React.useCallback(async () => {
    if (!address || !chainId) return;

    setIsAuthenticating(true);
    setError(null);

    try {
      // 1. Get nonce
      const nonceRes = await api.get<{ nonce: string }>("/auth/nonce");
      const nonce = nonceRes.data?.nonce;
      if (!nonce) throw new Error("Failed to fetch nonce from server");

      // 2. Construct SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in to Exposure",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce,
      });
      const messageString = message.prepareMessage();

      // 3. Sign
      const signature = await signMessageAsync({ message: messageString });

      // 4. Verify on server (sets exposure_session cookie)
      const verifyRes = await api.post<{
        user: {
          id: string;
          walletAddress: string;
          role: string;
          kycStatus: string;
          tierLevel: string;
          displayName: string | null;
          email: string | null;
          createdAt: string;
        };
      }>("/auth/verify", { message: messageString, signature });

      const verifiedUser = verifyRes.data?.user;

      // Update auth context
      if (verifiedUser) {
        setSession(verifiedUser as any);
      }

      // Update onboarding data
      onUpdate({
        authMethod: "wallet",
        walletAddress: address,
        displayName: shortenAddress(address),
      });

      // Auto advance to next step after short delay
      setTimeout(() => {
        onAutoAdvance();
      }, 600);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Sign-in failed. Please try again.";
      setError(msg);
      // Allow re-try
      siweAttemptedRef.current = null;
    } finally {
      setIsAuthenticating(false);
    }
  }, [address, chainId, signMessageAsync, onUpdate, onAutoAdvance, setSession]);

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
        Connect your wallet and sign a message to authenticate. Your session
        is secured via Sign-In with Ethereum (SIWE).
      </p>

      {/* Connected + authenticated state */}
      {isSignedIn && (
        <div className="mt-6 flex w-full max-w-sm items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <div className="text-left">
            <p className="text-sm font-medium text-emerald-400">
              Signed in as {data.displayName}
            </p>
            <p className="text-xs text-zinc-500">
              via Wallet (SIWE)
            </p>
          </div>
        </div>
      )}

      {!isSignedIn && (
        <>
          {/* Authenticating state */}
          {isAuthenticating && (
            <div className="mt-8 flex w-full max-w-sm flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-violet-400" />
              <p className="text-sm text-zinc-400">
                {isConnected
                  ? "Signing message... Please check your wallet."
                  : "Connecting wallet..."}
              </p>
            </div>
          )}

          {/* Primary action: Connect Wallet */}
          {!isAuthenticating && (
            <div className="mt-8 w-full max-w-sm">
              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (isConnected && address && chainId) {
                      // Wallet already connected, just need to sign
                      siweAttemptedRef.current = null;
                      handleSiweSignIn();
                    } else {
                      openConnectModal?.();
                    }
                  }}
                  className={cn(
                    "flex h-14 w-full items-center justify-center gap-3 rounded-xl border text-sm font-semibold transition-all duration-200",
                    "border-violet-500 bg-violet-500 text-white hover:bg-violet-600"
                  )}
                >
                  <Wallet className="h-5 w-5" />
                  {isConnected ? "Sign In with Wallet" : "Connect Wallet"}
                </button>
                <p className="text-xs text-zinc-500">
                  Supports MetaMask, Rabby, Ledger, WalletConnect, and more
                  via RainbowKit.
                </p>
              </div>
            </div>
          )}

          <InlineError message={error} />
        </>
      )}

      {/* Info note */}
      <div className="mt-8 flex max-w-sm items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-left">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
        <p className="text-xs leading-relaxed text-zinc-500">
          Signing in creates a secure session cookie. No private keys are
          ever transmitted. All data is encrypted and never shared with third
          parties.
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
  isSubmitting,
  apiError: apiErr,
}: {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  isSubmitting: boolean;
  apiError: string | null;
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
                    None of the above -- I do not qualify
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
              Assessment complete.
              {isSubmitting
                ? " Saving..."
                : " Continue to identity verification."}
            </p>
          </div>
        )}

        <InlineError message={apiErr} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: KYC Verification
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
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSkipping, setIsSkipping] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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

  const handleSubmitKYC = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.patch("/users/me", { kycStatus: "PENDING" });
      onUpdate({ kycStatus: "submitted" });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to submit KYC. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipForDemo = async () => {
    setIsSkipping(true);
    setError(null);
    try {
      await api.patch("/users/me", { kycStatus: "APPROVED" });
      // Set KYC cookie so middleware allows through
      document.cookie =
        "exposure_kyc_status=approved; path=/; max-age=" +
        7 * 24 * 60 * 60;
      onUpdate({ kycStatus: "verified" });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to skip KYC. Please try again.";
      setError(msg);
    } finally {
      setIsSkipping(false);
    }
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

        {/* Demo: Skip / Approve button */}
        <div className="mt-6">
          <button
            onClick={handleSkipForDemo}
            disabled={isSkipping}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-violet-500/50 hover:bg-zinc-700"
          >
            {isSkipping ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {isSkipping ? "Approving..." : "Skip for Demo (auto-approve)"}
          </button>
        </div>
      </div>
    );
  }

  if (data.kycStatus === "verified") {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-500/30 bg-emerald-500/10">
          <CheckCircle2 className="h-7 w-7 text-emerald-400" />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-zinc-50">
          Identity Verified
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
          Your identity has been verified. You can proceed to the next step.
        </p>
        <div className="mt-6 flex items-center gap-2">
          <Badge variant="success" size="md">
            Approved
          </Badge>
        </div>
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
        {/* Identity Document -- PASSPORT ONLY */}
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

        <InlineError message={error} />

        {/* Submit button */}
        <div className="flex items-center gap-3">
          {canSubmit && (
            <Button
              className="flex-1"
              size="lg"
              onClick={handleSubmitKYC}
              disabled={isSubmitting}
              leftIcon={
                isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4" />
                )
              }
            >
              {isSubmitting ? "Submitting..." : "Submit for Verification"}
            </Button>
          )}
          <button
            onClick={handleSkipForDemo}
            disabled={isSkipping}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-violet-500/50 hover:bg-zinc-700"
          >
            {isSkipping ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {isSkipping ? "Approving..." : "Skip for Demo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Connect Additional Wallets
// ---------------------------------------------------------------------------

function StepWallet({
  data,
  onUpdate,
}: {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
}) {
  const { address, isConnected, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { switchChainAsync } = useSwitchChain();

  const [selectedLinkChain, setSelectedLinkChain] =
    React.useState<string>("base");
  const [isLinking, setIsLinking] = React.useState(false);
  const [isLoadingWallets, setIsLoadingWallets] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Fetch existing linked wallets on mount
  React.useEffect(() => {
    fetchLinkedWallets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLinkedWallets = async () => {
    setIsLoadingWallets(true);
    try {
      const res = await api.get<{
        primaryWallet: string;
        wallets: LinkedWalletData[];
        totalWallets: number;
      }>("/users/me/wallets");
      if (res.data) {
        onUpdate({ linkedWallets: res.data.wallets });
      }
    } catch {
      // Silent fail - user may not have linked wallets yet
    } finally {
      setIsLoadingWallets(false);
    }
  };

  const handleLinkWallet = async () => {
    if (!address || !isConnected) {
      setError("Please connect your wallet first.");
      return;
    }

    setIsLinking(true);
    setError(null);

    try {
      // Switch to the selected chain if needed
      const targetChainId = CHAIN_ID_MAP[selectedLinkChain];
      if (targetChainId && chainId !== targetChainId) {
        await switchChainAsync({ chainId: targetChainId });
      }

      // Create a signature message linking the wallet to the account
      const linkMessage = `Link wallet ${address} to my Exposure account.\n\nChain: ${selectedLinkChain.toUpperCase()}\nTimestamp: ${new Date().toISOString()}`;

      const signature = await signMessageAsync({ message: linkMessage });

      // Post to API
      const chainEnum = CHAIN_ENUM_MAP[selectedLinkChain] || "ETHEREUM";
      await api.post("/users/me/wallets", {
        address,
        chain: chainEnum,
        signature,
        message: linkMessage,
      });

      // Refresh wallet list
      await fetchLinkedWallets();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to link wallet. Please try again.";
      setError(msg);
    } finally {
      setIsLinking(false);
    }
  };

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasLinkedWallets = data.linkedWallets.length > 0;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-zinc-50">
          Connect Additional Wallets
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Link additional wallets on different chains to receive allocations.
          Your primary wallet (used for sign-in) is already linked. This step
          is optional.
        </p>
      </div>

      <div className="space-y-6">
        {/* Already linked wallets */}
        {isLoadingWallets ? (
          <div className="flex items-center justify-center gap-3 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
            <span className="text-sm text-zinc-400">Loading wallets...</span>
          </div>
        ) : hasLinkedWallets ? (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Linked Wallets
            </p>
            <div className="space-y-2">
              {data.linkedWallets.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
                >
                  <Wallet className="h-4 w-4 shrink-0 text-violet-400" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-zinc-300">
                        {shortenAddress(w.address)}
                      </code>
                      <button
                        onClick={() => handleCopy(w.address)}
                        className="text-zinc-500 transition-colors hover:text-zinc-300"
                      >
                        {copied ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Badge
                    variant={w.isPrimary ? "default" : "outline"}
                    size="sm"
                  >
                    {w.isPrimary ? "Primary" : w.chain}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
            <p className="text-xs leading-relaxed text-zinc-500">
              Your primary wallet is linked automatically via sign-in. Use
              the form below to link additional wallets on different chains.
            </p>
          </div>
        )}

        {/* Link new wallet section */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Link Additional Wallet
          </p>

          {isConnected && address ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
                <Wallet className="h-5 w-5 shrink-0 text-violet-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-50">
                    Connected: {shortenAddress(address)}
                  </p>
                  <p className="text-xs text-zinc-400">
                    Select a chain and sign to link this wallet.
                  </p>
                </div>
              </div>

              <Select
                label="Chain"
                options={CHAIN_OPTIONS}
                value={selectedLinkChain}
                onChange={(e) => setSelectedLinkChain(e.target.value)}
                helperText="Select the network for this wallet."
              />

              <Button
                className="w-full"
                size="lg"
                onClick={handleLinkWallet}
                disabled={isLinking}
                leftIcon={
                  isLinking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wallet className="h-4 w-4" />
                  )
                }
              >
                {isLinking
                  ? "Linking... Check your wallet"
                  : "Link This Wallet"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <p className="text-xs text-amber-400">
                Your wallet is not connected. Use RainbowKit to connect a
                different wallet if you want to link additional addresses.
              </p>
            </div>
          )}
        </div>

        <InlineError message={error} />

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
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5: Attestation
// ---------------------------------------------------------------------------

function StepAttestation({
  data,
  redirectTarget,
  isSubmitting,
  apiError: apiErr,
  onAccept,
}: {
  data: OnboardingData;
  redirectTarget?: string | null;
  isSubmitting: boolean;
  apiError: string | null;
  onAccept: () => void;
}) {
  const [accepted, setAccepted] = React.useState(false);

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

  // If attestation is already finalized, show it
  if (data.attestationHash) {
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
                <p className="text-xs text-zinc-500">Attestation Hash</p>
                <code className="mt-1 block text-sm font-medium text-zinc-50 break-all">
                  {data.attestationHash}
                </code>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Wallet Bound To</p>
                <code className="mt-1 block text-sm font-medium text-zinc-50">
                  {shortenAddress(data.walletAddress)}
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
              Your attestation is portable -- it works across all deals on
              Exposure.
            </p>
          </div>
        </div>

        <InlineError message={apiErr} />

        {/* CTA */}
        <div className="mt-8 flex flex-col items-center gap-3">
          {redirectTarget ? (
            <Link href={redirectTarget} className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Continue to {redirectTarget.replace(/^\//, "").split("/")[0] || "Dashboard"}
              </Button>
            </Link>
          ) : (
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Go to Dashboard
              </Button>
            </Link>
          )}
          <Link
            href="/deals"
            className="text-xs text-zinc-500 transition-colors hover:text-zinc-400"
          >
            Start Exploring Deals
          </Link>
        </div>
      </div>
    );
  }

  // Pre-attestation: acceptance form
  return (
    <div>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-violet-500/30 bg-violet-500/10">
          <ShieldCheck className="h-8 w-8 text-violet-400" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-50">
          Attestation & Terms
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Review and accept the terms to generate your on-chain identity
          attestation.
        </p>
      </div>

      <div className="space-y-6">
        {/* Summary of what will be attested */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
            Attestation Summary
          </p>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-xs text-zinc-500">Investor Classification</p>
              <p className="mt-0.5 font-medium text-zinc-50">
                {attestationType}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Jurisdiction</p>
              <p className="mt-0.5 font-medium text-zinc-50">
                {countryLabel || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Wallet</p>
              <code className="mt-0.5 block font-medium text-zinc-50">
                {shortenAddress(data.walletAddress)}
              </code>
            </div>
            <div>
              <p className="text-xs text-zinc-500">KYC Status</p>
              <p className="mt-0.5 font-medium text-zinc-50">
                {data.kycStatus === "verified"
                  ? "Verified"
                  : data.kycStatus === "submitted"
                    ? "Pending"
                    : "Not Submitted"}
              </p>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
            Terms & Conditions
          </p>
          <div className="max-h-48 overflow-y-auto text-xs leading-relaxed text-zinc-400 space-y-2">
            <p>
              By accepting, you acknowledge that: (1) All information provided
              during onboarding is true and accurate to the best of your
              knowledge. (2) You understand that investments in early-stage
              projects carry significant risk including total loss of capital.
              (3) You consent to the creation of a privacy-preserving on-chain
              attestation linked to your wallet address. (4) You agree to
              Exposure&apos;s Terms of Service and Privacy Policy.
            </p>
            <p>
              Your attestation is valid for 12 months from the date of issuance.
              Exposure reserves the right to revoke attestations if provided
              information is found to be false or misleading.
            </p>
          </div>
        </div>

        <CustomCheckbox
          checked={accepted}
          onChange={setAccepted}
        >
          I have read, understood, and accept the attestation terms and
          conditions above. I confirm that all information provided is true
          and accurate.
        </CustomCheckbox>

        <InlineError message={apiErr} />

        <Button
          className="w-full"
          size="lg"
          onClick={onAccept}
          disabled={!accepted || isSubmitting}
          leftIcon={
            isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )
          }
        >
          {isSubmitting
            ? "Creating Attestation..."
            : "Accept & Create Attestation"}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Onboarding Page
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  // ---------------------------------------------------------------------------
  // Read query params: ?step=N&redirect=/path
  // ---------------------------------------------------------------------------
  const [redirectTarget, setRedirectTarget] = React.useState<string | null>(null);

  const [currentStep, setCurrentStep] = React.useState(0);
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(
    new Set()
  );
  const [data, setData] = React.useState<OnboardingData>(INITIAL_DATA);

  // API operation state
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [stepError, setStepError] = React.useState<string | null>(null);

  // Loading state for checking existing profile
  const [isCheckingProfile, setIsCheckingProfile] = React.useState(true);

  const { isLoading: authLoading } = useAuthContext();

  // -------------------------------------------------------------------------
  // On mount: check for existing session and pre-populate from user profile
  // -------------------------------------------------------------------------
  React.useEffect(() => {
    if (authLoading) return; // wait for auth context to load

    async function checkExistingProfile() {
      setIsCheckingProfile(true);
      try {
        const res = await api.get<{
          user: {
            id: string;
            walletAddress: string;
            displayName: string | null;
            kycStatus: string;
            country: string | null;
            investorClassification: string | null;
            isAccreditedUS: boolean;
            accreditationMethod: string | null;
            attestationHash: string | null;
            attestationExpiresAt: string | null;
            wallets: LinkedWalletData[];
          };
        }>("/users/me");

        const profile = res.data?.user;
        if (!profile) {
          setIsCheckingProfile(false);
          return;
        }

        // Pre-populate data from existing profile
        const updates: Partial<OnboardingData> = {
          authMethod: "wallet",
          walletAddress: profile.walletAddress,
          displayName:
            profile.displayName || shortenAddress(profile.walletAddress),
        };

        // Determine which step to start on based on profile completeness
        let startStep = 0;
        const completed = new Set<number>();

        // Step 1 is done (user is authenticated)
        completed.add(0);
        startStep = 1;

        // Check step 2 (assessment)
        if (profile.country && profile.investorClassification) {
          updates.country = profile.country;
          updates.investorClassification =
            profile.investorClassification as InvestorClassification;
          updates.usAccreditationBasis =
            profile.accreditationMethod as USAccreditationBasis;
          updates.usAccreditationCertified = profile.isAccreditedUS;
          completed.add(1);
          startStep = 2;
        }

        // Check step 3 (KYC)
        if (profile.kycStatus === "APPROVED") {
          updates.kycStatus = "verified";
          completed.add(2);
          startStep = 3;
        } else if (profile.kycStatus === "PENDING") {
          updates.kycStatus = "submitted";
          completed.add(2);
          startStep = 3;
        }

        // Check step 4 (wallets) - always mark as completable
        if (profile.wallets && profile.wallets.length > 0) {
          updates.linkedWallets = profile.wallets;
          completed.add(3);
          startStep = 4;
        }

        // Check step 5 (attestation)
        if (profile.attestationHash) {
          updates.attestationHash = profile.attestationHash;
          const now = new Date();
          updates.attestationIssuedDate = now.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          if (profile.attestationExpiresAt) {
            updates.attestationExpiryDate = new Date(
              profile.attestationExpiresAt
            ).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });
          }
          completed.add(4);
          startStep = 4; // Show the attestation
        }

        setData((prev) => ({ ...prev, ...updates }));
        setCompletedSteps(completed);

        // Read URL params to allow overriding the start step
        const params = new URLSearchParams(window.location.search);
        const stepParam = params.get("step");
        if (stepParam) {
          const stepNum = parseInt(stepParam, 10);
          if (!isNaN(stepNum) && stepNum >= 0 && stepNum < STEPS.length) {
            setCurrentStep(stepNum);
          } else {
            setCurrentStep(startStep);
          }
        } else {
          setCurrentStep(startStep);
        }
      } catch {
        // Not authenticated or API error - start from step 0
        // Read URL params
        const params = new URLSearchParams(window.location.search);
        const stepParam = params.get("step");
        if (stepParam) {
          const stepNum = parseInt(stepParam, 10);
          if (!isNaN(stepNum) && stepNum >= 0 && stepNum < STEPS.length) {
            setCurrentStep(stepNum);
            const completed = new Set<number>();
            for (let i = 0; i < stepNum; i++) completed.add(i);
            setCompletedSteps(completed);
          }
        }
      } finally {
        setIsCheckingProfile(false);
      }
    }

    checkExistingProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  // Read redirect param on mount
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get("redirect");
    if (redirectParam) {
      setRedirectTarget(redirectParam);
    }
  }, []);

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
        return (
          data.kycStatus === "submitted" || data.kycStatus === "verified"
        );
      case 3:
        return true; // wallet linking is optional
      case 4:
        return true;
      default:
        return false;
    }
  }, [
    currentStep,
    data.authMethod,
    data.kycStatus,
    isAssessmentComplete,
  ]);

  // -------------------------------------------------------------------------
  // Step-specific API handlers called on "Continue"
  // -------------------------------------------------------------------------

  const handleStepSubmit = async (): Promise<boolean> => {
    setStepError(null);

    try {
      switch (currentStep) {
        case 1: {
          // Step 2: Assessment -- PATCH /api/users/me
          setIsSubmitting(true);
          const isAccredited =
            isUSPerson &&
            data.usAccreditationBasis !== null &&
            data.usAccreditationBasis !== "none";

          await api.patch("/users/me", {
            country: data.country,
            investorClassification: data.investorClassification,
            isAccreditedUS: isAccredited,
            accreditationMethod: data.usAccreditationBasis,
          });
          return true;
        }

        case 2: {
          // Step 3: KYC -- already handled in-component
          return true;
        }

        case 3: {
          // Step 4: Wallet linking -- optional, already handled in-component
          return true;
        }

        default:
          return true;
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.";
      setStepError(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Attestation acceptance handler
  // -------------------------------------------------------------------------

  const handleAttestationAccept = async () => {
    setIsSubmitting(true);
    setStepError(null);

    try {
      const attestHash = "accepted-" + Date.now();

      await api.patch("/users/me", {
        attestationHash: attestHash,
      });

      // Set KYC cookie if not already set
      if (
        !document.cookie.includes("exposure_kyc_status=approved")
      ) {
        document.cookie =
          "exposure_kyc_status=approved; path=/; max-age=" +
          7 * 24 * 60 * 60;
      }

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
        attestationHash: attestHash,
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

      // Mark step as completed
      setCompletedSteps((prev) => {
        const next = new Set(prev);
        next.add(4);
        return next;
      });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to create attestation. Please try again.";
      setStepError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (!canProceed) return;

    // Run step-specific API call
    const success = await handleStepSubmit();
    if (!success) return;

    // Mark current step as completed
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(currentStep);
      return next;
    });

    // Generate attestation data when entering final step
    if (currentStep === 3) {
      // Entering step 5 (attestation) -- no pre-generation needed
      // The attestation is created on acceptance
    }

    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setStepError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // Auto-advance callback for step 1
  const handleAuthAutoAdvance = React.useCallback(() => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(0);
      return next;
    });
    setCurrentStep(1);
  }, []);

  // Show loading while checking profile
  if (isCheckingProfile || authLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          <p className="text-sm text-zinc-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Already verified link for returning users */}
      <div className="mb-6 flex justify-end">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-violet-400"
        >
          <User className="h-4 w-4" />
          Already verified? Sign in
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

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
            <StepAuth
              data={data}
              onUpdate={updateData}
              onAutoAdvance={handleAuthAutoAdvance}
            />
          )}
          {currentStep === 1 && (
            <StepAssessment
              data={data}
              onUpdate={updateData}
              isSubmitting={isSubmitting}
              apiError={stepError}
            />
          )}
          {currentStep === 2 && (
            <StepKYC data={data} onUpdate={updateData} />
          )}
          {currentStep === 3 && (
            <StepWallet data={data} onUpdate={updateData} />
          )}
          {currentStep === 4 && (
            <StepAttestation
              data={data}
              redirectTarget={redirectTarget}
              isSubmitting={isSubmitting}
              apiError={stepError}
              onAccept={handleAttestationAccept}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      {currentStep < 4 && (
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            size="md"
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
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
            disabled={!canProceed || isSubmitting}
            rightIcon={
              isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )
            }
          >
            {isSubmitting
              ? "Saving..."
              : currentStep === 3
                ? "Continue"
                : "Continue"}
          </Button>
        </div>
      )}

      {/* Navigation for attestation step (only when not yet accepted) */}
      {currentStep === 4 && !data.attestationHash && (
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            size="md"
            onClick={handleBack}
            disabled={isSubmitting}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">
              Step {currentStep + 1} of {STEPS.length}
            </span>
          </div>

          <div />
        </div>
      )}
    </div>
  );
}
