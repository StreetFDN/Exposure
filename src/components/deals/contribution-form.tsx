"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/format";
import { Wallet, ArrowRight, AlertCircle } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContributionFormProps {
  minContribution: number;
  maxContribution: number;
  walletBalance: number;
  tokenPrice: number;
  tokenSymbol: string;
  raiseTokenSymbol: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContributionForm({
  minContribution,
  maxContribution,
  walletBalance,
  tokenPrice,
  tokenSymbol,
  raiseTokenSymbol,
  className,
}: ContributionFormProps) {
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState<"USDC" | "USDT" | "ETH">(
    "USDC"
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const currencies = ["USDC", "USDT", "ETH"] as const;

  const numericAmount = parseFloat(amount) || 0;
  const maxAllowed = Math.min(maxContribution, walletBalance);
  const estimatedTokens =
    tokenPrice > 0 ? numericAmount / tokenPrice : 0;

  function validate(): string | null {
    if (!amount || numericAmount <= 0) {
      return "Enter an amount greater than 0";
    }
    if (numericAmount < minContribution) {
      return `Minimum contribution is ${formatCurrency(minContribution)}`;
    }
    if (numericAmount > maxContribution) {
      return `Maximum contribution is ${formatCurrency(maxContribution)}`;
    }
    if (numericAmount > walletBalance) {
      return "Insufficient balance";
    }
    return null;
  }

  function handleMax() {
    setAmount(maxAllowed.toString());
    setError(null);
  }

  async function handleContribute() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsLoading(true);

    // Simulate a short delay, then show alert
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoading(false);
    alert(
      `Contribution of ${formatCurrency(numericAmount)} ${currency} submitted! This is a placeholder -- web3 integration coming soon.`
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Amount input */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-300">Amount</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError(null);
            }}
            leftAddon={<span className="text-zinc-500">$</span>}
            rightAddon={
              <button
                type="button"
                onClick={handleMax}
                className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-violet-400 transition-colors hover:bg-zinc-700"
              >
                MAX
              </button>
            }
            className="flex-1"
            error={error ?? undefined}
          />
        </div>
      </div>

      {/* Currency toggle */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-300">Currency</label>
        <div className="flex gap-1.5">
          {currencies.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                currency === c
                  ? "border-violet-500 bg-violet-500/10 text-violet-400"
                  : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Info rows */}
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
        <InfoRow
          label="Your allocation"
          value={formatCurrency(numericAmount)}
        />
        <InfoRow
          label="Min contribution"
          value={formatCurrency(minContribution)}
        />
        <InfoRow
          label="Max contribution"
          value={formatCurrency(maxContribution)}
        />
        <InfoRow
          label="Wallet balance"
          value={`${formatCurrency(walletBalance)} ${currency}`}
          icon={<Wallet className="h-3.5 w-3.5" />}
        />
        <div className="border-t border-zinc-800 pt-2">
          <InfoRow
            label="Est. tokens received"
            value={`${estimatedTokens.toLocaleString("en-US", {
              maximumFractionDigits: 2,
            })} ${tokenSymbol}`}
            highlight
          />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <Button
        size="lg"
        className="w-full"
        isLoading={isLoading}
        onClick={handleContribute}
        rightIcon={<ArrowRight className="h-4 w-4" />}
      >
        Contribute
      </Button>

      {/* Fine print */}
      <p className="text-center text-xs text-zinc-600">
        Min: {formatCurrency(minContribution)} | Max:{" "}
        {formatCurrency(maxContribution)} | Requires{" "}
        <Badge variant="outline" size="sm">
          KYC
        </Badge>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Info Row
// ---------------------------------------------------------------------------

function InfoRow({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-1.5 text-zinc-500">
        {icon}
        {label}
      </span>
      <span
        className={cn(
          "font-medium",
          highlight ? "text-violet-400" : "text-zinc-300"
        )}
      >
        {value}
      </span>
    </div>
  );
}
