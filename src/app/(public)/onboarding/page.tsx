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

function computeInvestorClassification(
  q: QuestionnaireData
): InvestorClassification {
  const years = q.yearsInvesting;
  const familiarity = q.digitalAssetFamiliarity;
  const tokenSales = q.tokenSaleExperience;
  const riskAbility = q.riskAssessmentAbility;

  if (
    years === "5+" &&
    familiarity === "very_familiar" &&
    tokenSales === "10+" &&
    riskAbility === "independently"
  ) {
    return "sophisticated";
  }

  const hasThreePlusYears = years === "3-5" || years === "5+";
  const isFamiliar =
    familiarity === "familiar" || familiarity === "very_familiar";
  const hasDoneTokenSales =
    tokenSales === "1-3" || tokenSales === "4-10" || tokenSales === "10+";

  if (hasThreePlusYears && isFamiliar && hasDoneTokenSales) {
    return "experienced";
  }

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
      <div className="relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div
          className={cn(
            "flex h-4 w-4 items-center justify-center border transition-all duration-150",
            checked
              ? "border-violet-500 bg-violet-500"
              : "border-zinc-400 bg-transparent"
          )}
        >
          {checked && <Check className="h-2.5 w-2.5 text-white" />}
        </div>
      </div>
      <span className="text-sm font-normal text-zinc-500">{children}</span>
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
      <div className="relative flex h-4 w-4 shrink-0 items-center justify-center">
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
            "flex h-4 w-4 items-center justify-center rounded-full border transition-all duration-150",
            checked ? "border-violet-500" : "border-zinc-400"
          )}
        >
          {checked && (
            <div className="h-2 w-2 rounded-full bg-violet-500" />
          )}
        </div>
      </div>
      <span className="text-sm font-normal text-zinc-500">{children}</span>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Reusable: Inline Error
// ---------------------------------------------------------------------------

function InlineError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mt-4 flex items-start gap-2.5 border border-rose-500/20 bg-rose-500/[0.03] px-4 py-3">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
      <p className="text-sm font-normal text-rose-400">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stepper Component -- Minimal horizontal with numbers
// ---------------------------------------------------------------------------

function Stepper({
  currentStep,
  completedSteps,
}: {
  currentStep: number;
  completedSteps: Set<number>;
}) {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-center gap-0">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.has(index);
          const isCurrent = index === currentStep;
          const stepNum = String(index + 1).padStart(2, "0");

          return (
            <React.Fragment key={step.label}>
              {/* Step number */}
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "font-mono text-sm font-normal transition-colors duration-300",
                    isCompleted && "text-violet-500",
                    isCurrent && "text-zinc-900",
                    !isCompleted && !isCurrent && "text-zinc-400"
                  )}
                >
                  {stepNum}
                </span>
                <span
                  className={cn(
                    "hidden text-[10px] font-normal uppercase tracking-widest transition-colors duration-300 sm:block",
                    isCompleted && "text-violet-500/70",
                    isCurrent && "text-zinc-500",
                    !isCompleted && !isCurrent && "text-zinc-300"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div className="mx-3 mb-4 flex-1 sm:mx-5 sm:mb-0">
                  <div
                    className={cn(
                      "h-px w-full transition-colors duration-500",
                      completedSteps.has(index)
                        ? "bg-violet-500/50"
                        : "bg-zinc-200"
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
// Step 1: Sign In -- Wallet Connection via SIWE
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

  const siweAttemptedRef = React.useRef<string | null>(null);

  const isSignedIn = data.authMethod === "wallet";

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
      const nonceRes = await api.get<{ nonce: string }>("/auth/nonce");
      const nonce = nonceRes.data?.nonce;
      if (!nonce) throw new Error("Failed to fetch nonce from server");

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

      const signature = await signMessageAsync({ message: messageString });

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

      if (verifiedUser) {
        setSession(verifiedUser as any);
      }

      onUpdate({
        authMethod: "wallet",
        walletAddress: address,
        displayName: shortenAddress(address),
      });

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
      siweAttemptedRef.current = null;
    } finally {
      setIsAuthenticating(false);
    }
  }, [address, chainId, signMessageAsync, onUpdate, onAutoAdvance, setSession]);

  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-xs font-normal uppercase tracking-widest text-zinc-500">
        Step 01
      </p>
      <h2 className="mt-3 font-serif text-2xl font-light text-zinc-900">
        Connect Your Wallet
      </h2>
      <p className="mt-2 max-w-md text-sm font-normal leading-relaxed text-zinc-500">
        Sign in with your wallet via Sign-In with Ethereum (SIWE).
        Your session is cryptographically secured.
      </p>

      {/* Connected + authenticated state */}
      {isSignedIn && (
        <div className="mt-8 flex w-full max-w-sm items-center gap-3 border border-emerald-500/20 bg-emerald-500/[0.03] p-4">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <div className="text-left">
            <p className="text-sm font-normal text-emerald-400">
              Signed in as {data.displayName}
            </p>
            <p className="text-xs font-normal text-zinc-500">
              via Wallet (SIWE)
            </p>
          </div>
        </div>
      )}

      {!isSignedIn && (
        <>
          {/* Authenticating state */}
          {isAuthenticating && (
            <div className="mt-10 flex w-full max-w-sm flex-col items-center gap-4">
              <div className="h-6 w-6 animate-spin rounded-full border border-zinc-300 border-t-violet-400" />
              <p className="text-sm font-normal text-zinc-500">
                {isConnected
                  ? "Signing message... check your wallet."
                  : "Connecting wallet..."}
              </p>
            </div>
          )}

          {/* Primary action: Connect Wallet */}
          {!isAuthenticating && (
            <div className="mt-10 w-full max-w-sm">
              <button
                onClick={() => {
                  if (isConnected && address && chainId) {
                    siweAttemptedRef.current = null;
                    handleSiweSignIn();
                  } else {
                    openConnectModal?.();
                  }
                }}
                className="flex h-12 w-full items-center justify-center gap-3 bg-zinc-900 text-sm font-normal text-white transition-all duration-200 hover:bg-zinc-800"
              >
                <Wallet className="h-4 w-4" />
                {isConnected ? "Sign In with Wallet" : "Connect Wallet"}
              </button>
              <p className="mt-3 text-xs font-normal text-zinc-400">
                MetaMask, Rabby, Ledger, WalletConnect, and more via RainbowKit.
              </p>
            </div>
          )}

          <InlineError message={error} />
        </>
      )}

      {/* Info note */}
      <div className="mt-10 flex max-w-sm items-start gap-3 border border-zinc-200 p-4 text-left">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
        <p className="text-xs font-normal leading-relaxed text-zinc-400">
          No private keys are transmitted. All data is encrypted and never
          shared with third parties.
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

  const isQuestionnaireComplete =
    q.yearsInvesting !== "" &&
    q.investmentTypes.length > 0 &&
    q.digitalAssetFamiliarity !== "" &&
    q.tokenSaleExperience !== "" &&
    q.riskAssessmentAbility !== "" &&
    q.annualIncome !== "" &&
    q.netWorth !== "" &&
    q.riskAcknowledged;

  const isUSAccreditationComplete = isUSPerson
    ? data.usAccreditationBasis !== null && data.usAccreditationCertified
    : true;

  const isAssessmentComplete =
    data.country !== "" &&
    !isBlocked &&
    isQuestionnaireComplete &&
    isUSAccreditationComplete;

  React.useEffect(() => {
    if (isBlocked) {
      onUpdate({ investorClassification: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBlocked]);

  return (
    <div>
      <p className="text-xs font-normal uppercase tracking-widest text-zinc-500">
        Step 02
      </p>
      <h2 className="mt-3 font-serif text-2xl font-light text-zinc-900">
        Investor Assessment
      </h2>
      <p className="mt-2 text-sm font-normal text-zinc-500">
        Complete this assessment to determine your investor classification
        based on regulatory requirements.
      </p>

      <div className="mt-8 space-y-8">
        {/* Section A: Jurisdiction */}
        <div>
          <p className="mb-4 text-xs font-normal uppercase tracking-widest text-zinc-500">
            A. Jurisdiction
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

          {isBlocked && (
            <div className="mt-4 flex items-start gap-3 border border-rose-500/20 bg-rose-500/[0.03] p-4">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
              <div>
                <p className="text-sm font-normal text-rose-400">
                  Restricted Jurisdiction
                </p>
                <p className="mt-1 text-xs font-normal text-zinc-500">
                  Participation from your jurisdiction is not permitted under
                  current regulatory requirements.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Section B: Investment Experience */}
        {data.country && !isBlocked && (
          <div>
            <p className="mb-4 text-xs font-normal uppercase tracking-widest text-zinc-500">
              B. Investment Experience
            </p>

            <div className="space-y-6">
              {/* Q1 */}
              <div className="space-y-2.5">
                <p className="text-sm font-normal text-zinc-600">
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

              {/* Q2 */}
              <div className="space-y-2.5">
                <p className="text-sm font-normal text-zinc-600">
                  2. Which types of investments have you made?
                </p>
                <p className="text-xs font-normal text-zinc-400">Select all that apply.</p>
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
                          if (q.investmentTypes.includes(type)) {
                            updateQuestionnaire({ investmentTypes: [] });
                          } else {
                            updateQuestionnaire({
                              investmentTypes: [type],
                            });
                          }
                        } else {
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

              {/* Q3 */}
              <div className="space-y-2.5">
                <p className="text-sm font-normal text-zinc-600">
                  3. How familiar are you with early-stage digital asset investments?
                </p>
                <div className="space-y-2 pl-1">
                  {[
                    { value: "not_familiar", label: "Not familiar" },
                    { value: "somewhat_familiar", label: "Somewhat familiar" },
                    { value: "familiar", label: "Familiar" },
                    { value: "very_familiar", label: "Very familiar / professional experience" },
                  ].map((opt) => (
                    <RadioOption
                      key={opt.value}
                      name="digitalAssetFamiliarity"
                      value={opt.value}
                      checked={q.digitalAssetFamiliarity === opt.value}
                      onChange={(v) =>
                        updateQuestionnaire({ digitalAssetFamiliarity: v })
                      }
                    >
                      {opt.label}
                    </RadioOption>
                  ))}
                </div>
              </div>

              {/* Q4 */}
              <div className="space-y-2.5">
                <p className="text-sm font-normal text-zinc-600">
                  4. Have you previously invested in token sales, IDOs, or private crypto rounds?
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

              {/* Q5 */}
              <div className="space-y-2.5">
                <p className="text-sm font-normal text-zinc-600">
                  5. Can you assess business prospects and risks of early-stage projects?
                </p>
                <div className="space-y-2 pl-1">
                  {[
                    { value: "no", label: "No" },
                    { value: "somewhat", label: "Somewhat" },
                    { value: "with_support", label: "Yes, with support" },
                    { value: "independently", label: "Yes, independently" },
                  ].map((opt) => (
                    <RadioOption
                      key={opt.value}
                      name="riskAssessmentAbility"
                      value={opt.value}
                      checked={q.riskAssessmentAbility === opt.value}
                      onChange={(v) =>
                        updateQuestionnaire({ riskAssessmentAbility: v })
                      }
                    >
                      {opt.label}
                    </RadioOption>
                  ))}
                </div>
              </div>

              {/* Q6 */}
              <div className="space-y-2.5">
                <p className="text-sm font-normal text-zinc-600">
                  6. Approximate annual income?
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

              {/* Q7 */}
              <div className="space-y-2.5">
                <p className="text-sm font-normal text-zinc-600">
                  7. Approximate net worth (excluding primary residence)?
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

              {/* Q8 */}
              <div className="space-y-2.5">
                <p className="text-sm font-normal text-zinc-600">
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

              {/* Classification result */}
              {isQuestionnaireComplete && data.investorClassification && (
                <div className="flex items-center gap-3 border border-violet-500/20 bg-violet-500/[0.03] p-4">
                  <Shield className="h-4 w-4 shrink-0 text-violet-400" />
                  <div>
                    <p className="text-sm font-normal text-violet-400">
                      Classification:{" "}
                      {data.investorClassification === "sophisticated"
                        ? "Sophisticated Investor"
                        : data.investorClassification === "experienced"
                          ? "Experienced Investor"
                          : "Retail Investor"}
                    </p>
                    <p className="mt-0.5 text-xs font-normal text-zinc-500">
                      {data.investorClassification === "sophisticated"
                        ? "Full access to all offerings."
                        : data.investorClassification === "experienced"
                          ? "Access to most offerings. Some deals may have additional requirements."
                          : "Access may be restricted. Additional experience may be required for some offerings."}
                    </p>
                  </div>
                </div>
              )}

              {/* Self-certification notice */}
              <div className="flex items-start gap-3 border border-zinc-200 p-4">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                <p className="text-xs font-normal leading-relaxed text-zinc-400">
                  This is a self-certification assessment. Exposure reserves the
                  right to request supporting documentation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section C: US Accredited Investor */}
        {data.country && !isBlocked && isUSPerson && isQuestionnaireComplete && (
          <div>
            <p className="mb-4 text-xs font-normal uppercase tracking-widest text-zinc-500">
              C. US Accredited Investor (Reg D 506(c))
            </p>

            <div className="space-y-4">
              <p className="text-sm font-normal text-zinc-500">
                To participate in private offerings as a US person, you must
                qualify as an Accredited Investor under SEC Regulation D.
              </p>

              <div className="space-y-2.5">
                <p className="text-sm font-normal text-zinc-600">
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
                    Individual annual income exceeded $200,000 in each of the
                    two most recent years (or $300,000 jointly)
                  </RadioOption>
                  <RadioOption
                    name="usAccreditation"
                    value="net_worth"
                    checked={data.usAccreditationBasis === "net_worth"}
                    onChange={() =>
                      onUpdate({ usAccreditationBasis: "net_worth" })
                    }
                  >
                    Net worth exceeds $1,000,000 (excluding primary residence)
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
                    Licensed securities professional (Series 7, 65, or 82)
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
                    Qualified Purchaser ($5M+ in investments)
                  </RadioOption>
                  <RadioOption
                    name="usAccreditation"
                    value="none"
                    checked={data.usAccreditationBasis === "none"}
                    onChange={() =>
                      onUpdate({ usAccreditationBasis: "none" })
                    }
                  >
                    None of the above
                  </RadioOption>
                </div>
              </div>

              {data.usAccreditationBasis === "none" && (
                <div className="flex items-start gap-3 border border-amber-500/20 bg-amber-500/[0.03] p-4">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                  <div>
                    <p className="text-sm font-normal text-amber-400">
                      Limited Access
                    </p>
                    <p className="mt-1 text-xs font-normal text-zinc-500">
                      Non-accredited US persons are unable to participate in most
                      offerings. Some Reg CF deals may be available.
                    </p>
                  </div>
                </div>
              )}

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

        {/* Completion indicator */}
        {isAssessmentComplete && (
          <div className="flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/[0.03] p-4">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <p className="text-sm font-normal text-emerald-400">
              Assessment complete.
              {isSubmitting ? " Saving..." : " Continue to identity verification."}
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
        <div className="flex h-12 w-12 items-center justify-center border border-amber-500/20 bg-amber-500/[0.03]">
          <Clock className="h-5 w-5 text-amber-400" />
        </div>
        <p className="mt-1 text-xs font-normal uppercase tracking-widest text-zinc-500">
          Step 03
        </p>
        <h2 className="mt-3 font-serif text-2xl font-light text-zinc-900">
          Verification Pending
        </h2>
        <p className="mt-2 max-w-md text-sm font-normal leading-relaxed text-zinc-500">
          Your documents have been submitted. Verification typically takes
          24-48 hours.
        </p>
        <div className="mt-6">
          <Badge variant="warning" size="md">
            Under Review
          </Badge>
        </div>

        <div className="mt-8">
          <button
            onClick={handleSkipForDemo}
            disabled={isSkipping}
            className="flex items-center gap-2 border border-zinc-300 px-4 py-2 text-sm font-normal text-zinc-600 transition-colors hover:bg-zinc-50"
          >
            {isSkipping ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
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
        <div className="flex h-12 w-12 items-center justify-center border border-emerald-500/20 bg-emerald-500/[0.03]">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        </div>
        <p className="mt-1 text-xs font-normal uppercase tracking-widest text-zinc-500">
          Step 03
        </p>
        <h2 className="mt-3 font-serif text-2xl font-light text-zinc-900">
          Identity Verified
        </h2>
        <p className="mt-2 max-w-md text-sm font-normal leading-relaxed text-zinc-500">
          Your identity has been verified. You can proceed to the next step.
        </p>
        <div className="mt-6">
          <Badge variant="success" size="md">
            Approved
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-normal uppercase tracking-widest text-zinc-500">
        Step 03
      </p>
      <h2 className="mt-3 font-serif text-2xl font-light text-zinc-900">
        Identity Verification
      </h2>
      <p className="mt-2 text-sm font-normal text-zinc-500">
        Upload your documents for KYC review. All files are encrypted and
        stored securely.
      </p>

      <div className="mt-8 space-y-6">
        {/* Identity Document */}
        <div>
          <label className="mb-2 block text-sm font-normal text-zinc-600">
            Identity Document
          </label>
          <p className="mb-3 text-xs font-normal text-zinc-400">
            Valid passport only. Must be current and not expired.
          </p>
          <div className="mb-3 flex items-start gap-2.5 border border-amber-500/15 bg-amber-500/[0.02] p-3">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <p className="text-xs font-normal text-amber-400/80">
              National ID cards and driver&apos;s licenses are NOT accepted.
              Passport only.
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
              "flex w-full flex-col items-center justify-center gap-3 border border-dashed p-8 transition-all duration-200",
              data.identityDocumentName
                ? "border-violet-500/30 bg-violet-500/[0.02]"
                : "border-zinc-300 hover:border-zinc-400"
            )}
          >
            {data.identityDocumentName ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-violet-400" />
                <div className="text-center">
                  <p className="text-sm font-normal text-zinc-700">
                    {data.identityDocumentName}
                  </p>
                  <p className="mt-0.5 text-xs font-normal text-zinc-400">
                    Click to replace
                  </p>
                </div>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 text-zinc-500" />
                <div className="text-center">
                  <p className="text-sm font-normal text-zinc-500">
                    Click to upload
                  </p>
                  <p className="mt-0.5 text-xs font-normal text-zinc-400">
                    PDF, JPG, or PNG up to 10MB
                  </p>
                </div>
              </>
            )}
          </button>
        </div>

        {/* Proof of Address */}
        <div>
          <label className="mb-2 block text-sm font-normal text-zinc-600">
            Proof of Address
          </label>
          <p className="mb-3 text-xs font-normal text-zinc-400">
            Dated within the last 3 months showing your name and residential address.
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
              "flex w-full flex-col items-center justify-center gap-3 border border-dashed p-8 transition-all duration-200",
              data.proofOfAddressName
                ? "border-violet-500/30 bg-violet-500/[0.02]"
                : "border-zinc-300 hover:border-zinc-400"
            )}
          >
            {data.proofOfAddressName ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-violet-400" />
                <div className="text-center">
                  <p className="text-sm font-normal text-zinc-700">
                    {data.proofOfAddressName}
                  </p>
                  <p className="mt-0.5 text-xs font-normal text-zinc-400">
                    Click to replace
                  </p>
                </div>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 text-zinc-500" />
                <div className="text-center">
                  <p className="text-sm font-normal text-zinc-500">
                    Click to upload
                  </p>
                  <p className="mt-0.5 text-xs font-normal text-zinc-400">
                    PDF, JPG, or PNG up to 10MB
                  </p>
                </div>
              </>
            )}
          </button>

          <div className="mt-4">
            <Input
              type="date"
              label="Document Date"
              value={data.proofOfAddressDate}
              onChange={(e) =>
                onUpdate({ proofOfAddressDate: e.target.value })
              }
              helperText="Must be within the last 3 months."
            />
          </div>
        </div>

        {/* Accepted / Rejected docs */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="border border-zinc-200 p-4">
            <p className="mb-2 text-xs font-normal uppercase tracking-widest text-emerald-500/70">
              Accepted
            </p>
            <ul className="space-y-1.5 text-xs font-normal text-zinc-500">
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-500/70" />
                Utility bills
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-500/70" />
                Bank statements (traditional banks)
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-500/70" />
                Government residential certificates
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-500/70" />
                Tax notices
              </li>
            </ul>
          </div>
          <div className="border border-zinc-200 p-4">
            <p className="mb-2 text-xs font-normal uppercase tracking-widest text-rose-500/70">
              Not Accepted
            </p>
            <ul className="space-y-1.5 text-xs font-normal text-zinc-500">
              <li className="flex items-center gap-2">
                <X className="h-3 w-3 text-rose-500/70" />
                Neobank statements (Revolut, Wise, etc.)
              </li>
              <li className="flex items-center gap-2">
                <X className="h-3 w-3 text-rose-500/70" />
                Screenshots or digital photos
              </li>
              <li className="flex items-center gap-2">
                <X className="h-3 w-3 text-rose-500/70" />
                Mobile phone bills
              </li>
              <li className="flex items-center gap-2">
                <X className="h-3 w-3 text-rose-500/70" />
                Documents older than 3 months
              </li>
            </ul>
          </div>
        </div>

        {/* Info notes */}
        <div className="space-y-3">
          <div className="flex items-start gap-3 border border-zinc-200 p-4">
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <p className="text-xs font-normal leading-relaxed text-zinc-400">
              Verification expires after 12 months. Re-verification will be
              required. Review typically takes 24-48 hours.
            </p>
          </div>
          <div className="flex items-start gap-3 border border-amber-500/15 bg-amber-500/[0.02] p-4">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/80" />
            <p className="text-xs font-normal leading-relaxed text-amber-400/70">
              Enhanced Due Diligence (EDD) may be required in some cases,
              including source of funds declarations.
            </p>
          </div>
        </div>

        <InlineError message={error} />

        {/* Actions */}
        <div className="flex items-center gap-3">
          {canSubmit && (
            <button
              onClick={handleSubmitKYC}
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 bg-zinc-900 px-6 py-3 text-sm font-normal text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Shield className="h-3.5 w-3.5" />
              )}
              {isSubmitting ? "Submitting..." : "Submit for Verification"}
            </button>
          )}
          <button
            onClick={handleSkipForDemo}
            disabled={isSkipping}
            className="flex items-center gap-2 border border-zinc-300 px-4 py-3 text-sm font-normal text-zinc-500 transition-colors hover:bg-zinc-50"
          >
            {isSkipping ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
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
      // Silent fail
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
      const targetChainId = CHAIN_ID_MAP[selectedLinkChain];
      if (targetChainId && chainId !== targetChainId) {
        await switchChainAsync({ chainId: targetChainId });
      }

      const linkMessage = `Link wallet ${address} to my Exposure account.\n\nChain: ${selectedLinkChain.toUpperCase()}\nTimestamp: ${new Date().toISOString()}`;

      const signature = await signMessageAsync({ message: linkMessage });

      const chainEnum = CHAIN_ENUM_MAP[selectedLinkChain] || "ETHEREUM";
      await api.post("/users/me/wallets", {
        address,
        chain: chainEnum,
        signature,
        message: linkMessage,
      });

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
      <p className="text-xs font-normal uppercase tracking-widest text-zinc-500">
        Step 04
      </p>
      <h2 className="mt-3 font-serif text-2xl font-light text-zinc-900">
        Connect Wallets
      </h2>
      <p className="mt-2 text-sm font-normal text-zinc-500">
        Link additional wallets on different chains. Your primary wallet is
        already linked. This step is optional.
      </p>

      <div className="mt-8 space-y-6">
        {/* Linked wallets */}
        {isLoadingWallets ? (
          <div className="flex items-center justify-center gap-3 py-6">
            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
            <span className="text-sm font-normal text-zinc-500">Loading wallets...</span>
          </div>
        ) : hasLinkedWallets ? (
          <div>
            <p className="mb-3 text-xs font-normal uppercase tracking-widest text-zinc-400">
              Linked Wallets
            </p>
            <div className="space-y-2">
              {data.linkedWallets.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center gap-3 border border-zinc-200 p-3"
                >
                  <Wallet className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs font-normal text-zinc-600">
                        {shortenAddress(w.address)}
                      </code>
                      <button
                        onClick={() => handleCopy(w.address)}
                        className="text-zinc-400 transition-colors hover:text-zinc-500"
                      >
                        {copied ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  <span className="text-xs font-normal text-zinc-400">
                    {w.isPrimary ? "Primary" : w.chain}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 border border-zinc-200 p-4">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <p className="text-xs font-normal leading-relaxed text-zinc-400">
              Your primary wallet is linked automatically. Use the form below
              to link additional wallets on different chains.
            </p>
          </div>
        )}

        {/* Link new wallet */}
        <div>
          <p className="mb-3 text-xs font-normal uppercase tracking-widest text-zinc-400">
            Link Additional Wallet
          </p>

          {isConnected && address ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 border border-violet-500/15 bg-violet-500/[0.02] p-4">
                <Wallet className="h-4 w-4 shrink-0 text-violet-400/70" />
                <div>
                  <p className="text-sm font-normal text-zinc-700">
                    Connected: {shortenAddress(address)}
                  </p>
                  <p className="text-xs font-normal text-zinc-500">
                    Select a chain and sign to link.
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

              <button
                onClick={handleLinkWallet}
                disabled={isLinking}
                className="flex w-full items-center justify-center gap-2 border border-zinc-300 px-6 py-3 text-sm font-normal text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50"
              >
                {isLinking ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wallet className="h-3.5 w-3.5" />
                )}
                {isLinking ? "Linking... Check your wallet" : "Link This Wallet"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 border border-amber-500/15 bg-amber-500/[0.02] p-4">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/80" />
              <p className="text-xs font-normal text-amber-400/70">
                Wallet not connected. Use RainbowKit to connect a different
                wallet for linking.
              </p>
            </div>
          )}
        </div>

        <InlineError message={error} />

        {/* USDC note */}
        <div className="flex items-start gap-3 border border-zinc-200 p-4">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
          <div>
            <p className="text-xs font-normal text-zinc-500">
              Funding Requirement
            </p>
            <p className="mt-0.5 text-xs font-normal leading-relaxed text-zinc-400">
              Ensure USDC is available on your selected network before
              participating in deals.
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

  // Attestation finalized
  if (data.attestationHash) {
    return (
      <div>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-emerald-500/20 bg-emerald-500/[0.03]">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-xs font-normal uppercase tracking-widest text-zinc-500">
            Step 05
          </p>
          <h2 className="mt-3 font-serif text-2xl font-light text-zinc-900">
            Sonar eID Attestation
          </h2>
          <p className="mt-2 text-sm font-normal text-zinc-500">
            Your verified identity has been cryptographically attested on-chain.
          </p>
        </div>

        {/* Attestation card */}
        <div className="mt-8 border border-zinc-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-violet-400" />
              <div>
                <p className="text-sm font-normal text-zinc-900">Sonar eID</p>
                <p className="text-[10px] font-normal text-zinc-400">
                  On-Chain Identity Attestation
                </p>
              </div>
            </div>
            <Badge variant="success" size="sm">
              Active
            </Badge>
          </div>

          {/* Details */}
          <div className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
                  Hash
                </p>
                <code className="mt-1 block break-all font-mono text-xs font-normal text-zinc-600">
                  {data.attestationHash}
                </code>
              </div>
              <div>
                <p className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
                  Wallet
                </p>
                <code className="mt-1 block font-mono text-xs font-normal text-zinc-600">
                  {shortenAddress(data.walletAddress)}
                </code>
              </div>
              <div>
                <p className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
                  Issued
                </p>
                <p className="mt-1 text-xs font-normal text-zinc-600">
                  {data.attestationIssuedDate}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
                  Expires
                </p>
                <p className="mt-1 text-xs font-normal text-zinc-600">
                  {data.attestationExpiryDate}
                </p>
              </div>
            </div>

            {/* Type */}
            <div className="flex items-center justify-between border border-violet-500/15 bg-violet-500/[0.02] p-4">
              <span className="text-xs font-normal text-zinc-500">
                Attestation Type
              </span>
              <span className="text-xs font-normal text-violet-400">
                {attestationType}
              </span>
            </div>

            {/* Jurisdiction / KYC */}
            <div className="grid gap-4 border border-zinc-200 p-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
                  Jurisdiction
                </p>
                <p className="mt-1 text-xs font-normal text-zinc-600">
                  {countryLabel}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
                  KYC Status
                </p>
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
                        ? "Pending"
                        : "Not Submitted"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Explorer link */}
            <button className="flex w-full items-center justify-center gap-2 border border-zinc-200 p-3 text-xs font-normal text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-600">
              <ExternalLink className="h-3 w-3" />
              View on Explorer
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-6 space-y-3">
          <div className="flex items-start gap-3 border border-zinc-200 p-4">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <p className="text-xs font-normal leading-relaxed text-zinc-400">
              This attestation allows projects to verify your eligibility
              without accessing personal information. It is portable across
              all deals on Exposure.
            </p>
          </div>
        </div>

        <InlineError message={apiErr} />

        {/* CTA */}
        <div className="mt-8 flex flex-col items-center gap-3">
          {redirectTarget ? (
            <Link href={redirectTarget} className="w-full">
              <button className="flex w-full items-center justify-center gap-2 bg-zinc-900 px-6 py-3 text-sm font-normal text-white transition-colors hover:bg-zinc-800">
                Continue to{" "}
                {redirectTarget.replace(/^\//, "").split("/")[0] || "Dashboard"}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          ) : (
            <Link href="/dashboard" className="w-full">
              <button className="flex w-full items-center justify-center gap-2 bg-zinc-900 px-6 py-3 text-sm font-normal text-white transition-colors hover:bg-zinc-800">
                Go to Dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          )}
          <Link
            href="/deals"
            className="text-xs font-normal text-zinc-400 transition-colors hover:text-zinc-500"
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
      <div className="text-center">
        <p className="text-xs font-normal uppercase tracking-widest text-zinc-500">
          Step 05
        </p>
        <h2 className="mt-3 font-serif text-2xl font-light text-zinc-900">
          Attestation & Terms
        </h2>
        <p className="mt-2 text-sm font-normal text-zinc-500">
          Review and accept the terms to generate your on-chain identity
          attestation.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        {/* Summary */}
        <div className="border border-zinc-200 p-6 space-y-4">
          <p className="text-xs font-normal uppercase tracking-widest text-zinc-500">
            Summary
          </p>
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
                Classification
              </p>
              <p className="mt-1 text-xs font-normal text-zinc-700">
                {attestationType}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
                Jurisdiction
              </p>
              <p className="mt-1 text-xs font-normal text-zinc-700">
                {countryLabel || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
                Wallet
              </p>
              <code className="mt-1 block font-mono text-xs font-normal text-zinc-700">
                {shortenAddress(data.walletAddress)}
              </code>
            </div>
            <div>
              <p className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
                KYC
              </p>
              <p className="mt-1 text-xs font-normal text-zinc-700">
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
        <div className="border border-zinc-200 p-6 space-y-4">
          <p className="text-xs font-normal uppercase tracking-widest text-zinc-500">
            Terms & Conditions
          </p>
          <div className="max-h-48 overflow-y-auto text-xs font-normal leading-relaxed text-zinc-500 space-y-2">
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

        <CustomCheckbox checked={accepted} onChange={setAccepted}>
          I have read, understood, and accept the attestation terms and
          conditions. I confirm all information is true and accurate.
        </CustomCheckbox>

        <InlineError message={apiErr} />

        <button
          onClick={onAccept}
          disabled={!accepted || isSubmitting}
          className="flex w-full items-center justify-center gap-2 bg-zinc-900 px-6 py-3 text-sm font-normal text-white transition-colors hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5" />
          )}
          {isSubmitting ? "Creating Attestation..." : "Accept & Create Attestation"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Onboarding Page
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const [redirectTarget, setRedirectTarget] = React.useState<string | null>(
    null
  );

  const [currentStep, setCurrentStep] = React.useState(0);
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(
    new Set()
  );
  const [data, setData] = React.useState<OnboardingData>(INITIAL_DATA);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [stepError, setStepError] = React.useState<string | null>(null);

  const [isCheckingProfile, setIsCheckingProfile] = React.useState(true);

  // Transition state
  const [direction, setDirection] = React.useState<"forward" | "back">(
    "forward"
  );
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  const { isLoading: authLoading } = useAuthContext();

  // -------------------------------------------------------------------------
  // On mount: check for existing session and pre-populate
  // -------------------------------------------------------------------------
  React.useEffect(() => {
    if (authLoading) return;

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

        const updates: Partial<OnboardingData> = {
          authMethod: "wallet",
          walletAddress: profile.walletAddress,
          displayName:
            profile.displayName || shortenAddress(profile.walletAddress),
        };

        let startStep = 0;
        const completed = new Set<number>();

        completed.add(0);
        startStep = 1;

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

        if (profile.kycStatus === "APPROVED") {
          updates.kycStatus = "verified";
          completed.add(2);
          startStep = 3;
        } else if (profile.kycStatus === "PENDING") {
          updates.kycStatus = "submitted";
          completed.add(2);
          startStep = 3;
        }

        if (profile.wallets && profile.wallets.length > 0) {
          updates.linkedWallets = profile.wallets;
          completed.add(3);
          startStep = 4;
        }

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
          startStep = 4;
        }

        setData((prev) => ({ ...prev, ...updates }));
        setCompletedSteps(completed);

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

  // Derived state
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
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  }, [currentStep, data.authMethod, data.kycStatus, isAssessmentComplete]);

  // Step-specific API handlers
  const handleStepSubmit = async (): Promise<boolean> => {
    setStepError(null);

    try {
      switch (currentStep) {
        case 1: {
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

        case 2:
          return true;

        case 3:
          return true;

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

  // Attestation handler
  const handleAttestationAccept = async () => {
    setIsSubmitting(true);
    setStepError(null);

    try {
      const attestHash = "accepted-" + Date.now();

      await api.patch("/users/me", {
        attestationHash: attestHash,
      });

      if (!document.cookie.includes("exposure_kyc_status=approved")) {
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

  const navigateToStep = (targetStep: number) => {
    setDirection(targetStep > currentStep ? "forward" : "back");
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(targetStep);
      setIsTransitioning(false);
    }, 150);
  };

  const handleNext = async () => {
    if (!canProceed) return;

    const success = await handleStepSubmit();
    if (!success) return;

    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(currentStep);
      return next;
    });

    navigateToStep(Math.min(currentStep + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setStepError(null);
    navigateToStep(Math.max(currentStep - 1, 0));
  };

  const handleAuthAutoAdvance = React.useCallback(() => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(0);
      return next;
    });
    setDirection("forward");
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(1);
      setIsTransitioning(false);
    }, 150);
  }, []);

  // Loading state
  if (isCheckingProfile || authLoading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
        <p className="mt-4 text-sm font-normal text-zinc-500">
          Loading your profile...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-zinc-400">
          Investor Onboarding
        </p>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs font-normal text-zinc-500 transition-colors hover:text-zinc-600"
        >
          Already verified?
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Stepper */}
      <Stepper currentStep={currentStep} completedSteps={completedSteps} />

      {/* Step content with transitions */}
      <div
        className={cn(
          "transition-all duration-150 ease-in-out",
          isTransitioning
            ? "translate-x-2 opacity-0"
            : "translate-x-0 opacity-100",
          isTransitioning && direction === "back" && "-translate-x-2"
        )}
      >
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
      </div>

      {/* Navigation */}
      {currentStep < 4 && (
        <div className="mt-10 flex items-center justify-between border-t border-zinc-200 pt-6">
          <button
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
            className="flex items-center gap-2 text-sm font-normal text-zinc-500 transition-colors hover:text-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          <span className="font-mono text-xs font-normal text-zinc-300">
            {String(currentStep + 1).padStart(2, "0")}/{String(STEPS.length).padStart(2, "0")}
          </span>

          <button
            onClick={handleNext}
            disabled={!canProceed || isSubmitting}
            className="flex items-center gap-2 text-sm font-normal text-zinc-600 transition-colors hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Navigation for attestation step (before acceptance) */}
      {currentStep === 4 && !data.attestationHash && (
        <div className="mt-10 flex items-center justify-between border-t border-zinc-200 pt-6">
          <button
            onClick={handleBack}
            disabled={isSubmitting}
            className="flex items-center gap-2 text-sm font-normal text-zinc-500 transition-colors hover:text-zinc-600 disabled:opacity-30"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          <span className="font-mono text-xs font-normal text-zinc-300">
            {String(currentStep + 1).padStart(2, "0")}/{String(STEPS.length).padStart(2, "0")}
          </span>

          <div />
        </div>
      )}
    </div>
  );
}
