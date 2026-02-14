"use client";

import * as React from "react";
import {
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  Wallet,
  ExternalLink,
  Copy,
  Share2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParticipationFlowProps {
  dealName: string;
  roundType: string;
  allocationMethod: string;
  tokenSymbol: string;
  raiseTokenSymbol: string;
  tokenPrice: number;
  minContribution: number;
  maxContribution: number;
  walletBalance: number;
  guaranteedAllocation: number;
  userTier: string;
  tierMultiplier: string;
  onClose?: () => void;
  className?: string;
}

interface EligibilityCheck {
  label: string;
  passed: boolean;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Steps config
// ---------------------------------------------------------------------------

const STEP_LABELS = [
  "Register",
  "Eligibility",
  "Allocation",
  "Contribute",
  "Confirm",
  "Receipt",
] as const;

type StepIndex = 0 | 1 | 2 | 3 | 4 | 5;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ParticipationFlow({
  dealName,
  roundType,
  allocationMethod,
  tokenSymbol,
  raiseTokenSymbol,
  tokenPrice,
  minContribution,
  maxContribution,
  walletBalance,
  guaranteedAllocation,
  userTier,
  tierMultiplier,
  onClose,
  className,
}: ParticipationFlowProps) {
  const [step, setStep] = React.useState<StepIndex>(0);
  const [isChecking, setIsChecking] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState<"USDC" | "USDT" | "ETH">("USDC");
  const [txHash, setTxHash] = React.useState("");
  const [copiedTx, setCopiedTx] = React.useState(false);

  // Simulated eligibility checks
  const [eligibilityChecks, setEligibilityChecks] = React.useState<EligibilityCheck[]>([]);

  const numericAmount = parseFloat(amount) || 0;
  const estimatedTokens = tokenPrice > 0 ? numericAmount / tokenPrice : 0;
  const platformFee = numericAmount * 0.005; // 0.5% fee
  const totalCost = numericAmount + platformFee;

  const currencies = ["USDC", "USDT", "ETH"] as const;

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleRegister() {
    setStep(1);
    runEligibilityChecks();
  }

  async function runEligibilityChecks() {
    setIsChecking(true);
    setEligibilityChecks([]);

    // Simulate staggered checks
    const checks: EligibilityCheck[] = [
      { label: "KYC Verification", passed: true },
      { label: "Tier Requirement (Silver+)", passed: true },
      { label: "Geographic Eligibility", passed: true },
      { label: "Registration Completed", passed: true },
    ];

    for (let i = 0; i < checks.length; i++) {
      await new Promise((r) => setTimeout(r, 400));
      setEligibilityChecks((prev) => [...prev, checks[i]]);
    }

    setIsChecking(false);
  }

  function allChecksPassed() {
    return (
      eligibilityChecks.length > 0 &&
      eligibilityChecks.every((c) => c.passed)
    );
  }

  async function handleConfirmSubmit() {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setTxHash(
      "0x" +
        Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join("")
    );
    setIsSubmitting(false);
    setStep(5);
  }

  function handleCopyTx() {
    navigator.clipboard.writeText(txHash);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 2000);
  }

  function canGoBack(): boolean {
    if (step === 0 || step === 5) return false;
    if (step === 1 && isChecking) return false;
    return true;
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-zinc-200 bg-white",
        className
      )}
    >
      {/* Step indicator */}
      <div className="border-b border-zinc-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-light text-zinc-900">
            Participate
          </h3>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-zinc-500 transition-colors hover:text-zinc-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Step dots */}
        <div className="mt-4 flex items-center gap-1">
          {STEP_LABELS.map((label, i) => (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                    i < step
                      ? "bg-zinc-400 text-white"
                      : i === step
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-400"
                  )}
                >
                  {i < step ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={cn(
                    "hidden text-[10px] sm:block",
                    i === step ? "text-zinc-700" : "text-zinc-400"
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1 transition-colors",
                    i < step ? "bg-zinc-400" : "bg-zinc-200"
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 p-6">
        {/* Step 1: Register Interest */}
        {step === 0 && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
              <Wallet className="h-8 w-8 text-zinc-500" />
            </div>
            <div>
              <h4 className="font-serif text-xl font-light text-zinc-900">
                Register for this Deal
              </h4>
              <p className="mt-2 text-sm text-zinc-500">
                Confirm your interest in the {dealName} {roundType}.
              </p>
            </div>

            <div className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex flex-col gap-2">
                <InfoRow label="Deal" value={dealName} />
                <InfoRow label="Round" value={roundType} />
                <InfoRow label="Allocation" value={allocationMethod} />
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={handleRegister}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Register Interest
            </Button>
          </div>
        )}

        {/* Step 2: Eligibility Check */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h4 className="font-serif text-xl font-light text-zinc-900">
                Eligibility Check
              </h4>
              <p className="mt-1 text-sm text-zinc-500">
                Verifying your eligibility for this deal.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {eligibilityChecks.map((check, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3"
                >
                  {check.passed ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50">
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-50">
                      <X className="h-3.5 w-3.5 text-rose-600" />
                    </div>
                  )}
                  <span
                    className={cn(
                      "text-sm",
                      check.passed ? "text-zinc-700" : "text-rose-600"
                    )}
                  >
                    {check.label}
                  </span>
                  {check.passed && (
                    <span className="ml-auto text-xs text-emerald-600">
                      Passed
                    </span>
                  )}
                  {!check.passed && check.reason && (
                    <span className="ml-auto text-xs text-rose-600">
                      {check.reason}
                    </span>
                  )}
                </div>
              ))}

              {isChecking && (
                <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                  <span className="text-sm text-zinc-500">
                    Checking...
                  </span>
                </div>
              )}
            </div>

            {!isChecking && eligibilityChecks.length > 0 && (
              <Button
                size="lg"
                className="w-full"
                disabled={!allChecksPassed()}
                onClick={() => setStep(2)}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                {allChecksPassed() ? "Continue" : "Cannot Proceed"}
              </Button>
            )}

            {!isChecking &&
              eligibilityChecks.some((c) => !c.passed) && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    You do not meet all eligibility requirements for this deal.
                  </span>
                </div>
              )}
          </div>
        )}

        {/* Step 3: Allocation Reveal */}
        {step === 2 && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
              <CheckCircle2 className="h-8 w-8 text-zinc-500" />
            </div>
            <div>
              <h4 className="font-serif text-xl font-light text-zinc-900">
                Your Allocation
              </h4>
              <p className="mt-1 text-sm text-zinc-500">
                Based on your tier and the allocation snapshot.
              </p>
            </div>

            <div className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-6">
              <span className="text-xs text-zinc-500">
                Guaranteed Allocation
              </span>
              <p className="mt-1 font-serif text-3xl font-light text-zinc-900">
                {formatCurrency(guaranteedAllocation)}
              </p>
            </div>

            <div className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex flex-col gap-2">
                <InfoRow label="Your Tier" value={userTier} />
                <InfoRow label="Multiplier" value={tierMultiplier} />
                <InfoRow
                  label="Est. Tokens"
                  value={`${(guaranteedAllocation / tokenPrice).toLocaleString("en-US", { maximumFractionDigits: 0 })} ${tokenSymbol}`}
                />
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                setAmount(guaranteedAllocation.toString());
                setStep(3);
              }}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Proceed to Contribute
            </Button>
          </div>
        )}

        {/* Step 4: Contribute */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <h4 className="font-serif text-xl font-light text-zinc-900">
                Contribute
              </h4>
              <p className="mt-1 text-sm text-zinc-500">
                Enter your contribution amount.
              </p>
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700">
                Amount ({raiseTokenSymbol})
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                leftAddon={<span className="text-zinc-500">$</span>}
                rightAddon={
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setAmount(minContribution.toString())
                      }
                      className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-200"
                    >
                      MIN
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAmount(
                          Math.min(
                            maxContribution,
                            walletBalance
                          ).toString()
                        )
                      }
                      className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-200"
                    >
                      MAX
                    </button>
                  </div>
                }
              />
            </div>

            {/* Currency selector */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700">
                Currency
              </label>
              <div className="flex gap-1.5">
                {currencies.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrency(c)}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                      currency === c
                        ? "border-zinc-500 bg-zinc-100 text-zinc-700"
                        : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Wallet balance */}
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Wallet className="h-4 w-4" />
              <span>
                Balance: {formatCurrency(walletBalance)} {currency}
              </span>
            </div>

            {/* Summary */}
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <div className="flex flex-col gap-2">
                <InfoRow
                  label="Contribution"
                  value={formatCurrency(numericAmount)}
                />
                <InfoRow
                  label="Platform Fee (0.5%)"
                  value={formatCurrency(platformFee)}
                />
                <div className="border-t border-zinc-200 pt-2">
                  <InfoRow
                    label="Total"
                    value={formatCurrency(totalCost)}
                    highlight
                  />
                </div>
                <div className="border-t border-zinc-200 pt-2">
                  <InfoRow
                    label="Est. Tokens"
                    value={`${estimatedTokens.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${tokenSymbol}`}
                  />
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              disabled={numericAmount < minContribution || numericAmount > walletBalance}
              onClick={() => setStep(4)}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Review Contribution
            </Button>
          </div>
        )}

        {/* Step 5: Confirmation */}
        {step === 4 && (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h4 className="font-serif text-xl font-light text-zinc-900">
                Confirm Contribution
              </h4>
              <p className="mt-1 text-sm text-zinc-500">
                Review the details before signing.
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex flex-col gap-3">
                <InfoRow label="Deal" value={dealName} />
                <InfoRow
                  label="Amount"
                  value={`${formatCurrency(numericAmount)} ${currency}`}
                />
                <InfoRow label="Platform Fee" value={formatCurrency(platformFee)} />
                <div className="border-t border-zinc-200 pt-2">
                  <InfoRow
                    label="Total Debit"
                    value={formatCurrency(totalCost)}
                    highlight
                  />
                </div>
                <div className="border-t border-zinc-200 pt-2">
                  <InfoRow
                    label="You Receive"
                    value={`${estimatedTokens.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${tokenSymbol}`}
                  />
                </div>
                <InfoRow label="Est. Gas" value="~$2.50" />
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-500">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                By confirming, you agree to the deal terms and conditions.
                This transaction cannot be reversed once signed.
              </span>
            </div>

            <Button
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
              onClick={handleConfirmSubmit}
            >
              {isSubmitting ? "Signing..." : "Confirm & Sign"}
            </Button>
          </div>
        )}

        {/* Step 6: Receipt */}
        {step === 5 && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-serif text-xl font-light text-zinc-900">
                Contribution Confirmed
              </h4>
              <p className="mt-1 text-sm text-zinc-500">
                Your contribution to {dealName} was successful.
              </p>
            </div>

            <div className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex flex-col gap-2">
                <InfoRow
                  label="Amount"
                  value={`${formatCurrency(numericAmount)} ${currency}`}
                />
                <InfoRow
                  label="Tokens"
                  value={`${estimatedTokens.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${tokenSymbol}`}
                />
              </div>
            </div>

            {/* Transaction hash */}
            {txHash && (
              <div className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <span className="mb-1 block text-xs text-zinc-500">
                  Transaction Hash
                </span>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate text-xs text-zinc-500">
                    {txHash}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyTx}
                    className="rounded-md p-1 text-zinc-400 transition-colors hover:text-zinc-700"
                  >
                    {copiedTx ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <a
                    href={`https://etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md p-1 text-zinc-400 transition-colors hover:text-zinc-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            )}

            <div className="flex w-full gap-3">
              <a
                href={`https://twitter.com/intent/tweet?text=Just%20contributed%20to%20${encodeURIComponent(dealName)}%20on%20Exposure!`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                <Share2 className="h-4 w-4" />
                Share
              </a>
              <a
                href="/portfolio"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
              >
                View Portfolio
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Back button */}
      {canGoBack() && (
        <div className="border-t border-zinc-200 px-6 py-3">
          <button
            type="button"
            onClick={() => setStep((step - 1) as StepIndex)}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Info Row sub-component
// ---------------------------------------------------------------------------

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-zinc-500">{label}</span>
      <span
        className={cn(
          "font-medium",
          highlight ? "text-zinc-900" : "text-zinc-700"
        )}
      >
        {value}
      </span>
    </div>
  );
}
