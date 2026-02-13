"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  ArrowRightLeft,
  Clock,
  Shield,
  ExternalLink,
  CheckCircle2,
  Layers,
  TrendingUp,
  DollarSign,
  Lock,
  AlertTriangle,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency, formatAddress, formatDate, formatToken } from "@/lib/utils/format";

/* -------------------------------------------------------------------------- */
/*  Types (matching API response shape)                                       */
/* -------------------------------------------------------------------------- */

interface TreasuryData {
  totalConfirmedUsd: string;
  totalConfirmedFormatted: string;
  totalPendingUsd: string;
  totalRefundedUsd: string;
  netTreasuryUsd: string;
  balancesByChain: {
    chain: string;
    totalConfirmedUsd: string;
  }[];
  recentMovements: {
    id: string;
    type: string;
    amount: string;
    amountUsd: string | null;
    currency: string;
    chain: string;
    txHash: string;
    status: string;
    timestamp: string;
  }[];
  pendingDisbursements: {
    id: string;
    dealId: string;
    dealTitle: string;
    amount: string;
    chain: string;
    projectWalletAddress: string | null;
    scheduledAt: string | null;
    status: string;
  }[];
  revenue: {
    monthlyFees: { month: string; amount: string }[];
    feeRate: string;
    performanceFee: string;
  };
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const chainColors: Record<string, string> = {
  ETHEREUM: "violet",
  ARBITRUM: "sky",
  BASE: "emerald",
  POLYGON: "amber",
};

const txTypeVariant: Record<string, "success" | "info" | "warning" | "outline"> = {
  CONTRIBUTION: "success",
  CLAIM: "info",
  REFUND: "warning",
  STAKE: "outline",
  UNSTAKE: "outline",
};

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                          */
/* -------------------------------------------------------------------------- */

function TreasurySkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton variant="card" height="200px" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="card" height="160px" />
        ))}
      </div>
      <Skeleton variant="card" height="300px" />
      <Skeleton variant="card" height="200px" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function TreasuryManagementPage() {
  const [treasury, setTreasury] = useState<TreasuryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTreasury = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/treasury");
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to fetch treasury data");
      setTreasury(json.data.treasury);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch treasury data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTreasury();
  }, [fetchTreasury]);

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Treasury</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Platform treasury management and fund flows
          </p>
        </div>
        <TreasurySkeleton />
      </div>
    );
  }

  if (error || !treasury) {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Treasury</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Platform treasury management and fund flows
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 py-12">
          <AlertTriangle className="h-8 w-8 text-rose-400" />
          <p className="text-sm text-rose-300">
            {error || "Failed to load treasury data"}
          </p>
          <Button size="sm" variant="outline" onClick={fetchTreasury}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const netTreasury = Number(treasury.netTreasuryUsd);
  const totalConfirmed = Number(treasury.totalConfirmedUsd);
  const totalPending = Number(treasury.totalPendingUsd);
  const totalRefunded = Number(treasury.totalRefundedUsd);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Treasury</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Platform treasury management and fund flows
        </p>
      </div>

      {/* Total Treasury */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-violet-400" />
            <CardTitle>Total Platform Treasury</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <p className="text-4xl font-bold tabular-nums text-zinc-50">
              {formatCurrency(netTreasury)}
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Net treasury (confirmed minus refunded) across all chains
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
              <p className="text-sm font-medium text-zinc-300">Confirmed</p>
              <p className="text-lg font-bold text-zinc-50">
                {formatCurrency(totalConfirmed)}
              </p>
              <p className="text-xs text-zinc-500">Total confirmed contributions</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
              <p className="text-sm font-medium text-zinc-300">Pending</p>
              <p className="text-lg font-bold text-amber-400">
                {formatCurrency(totalPending)}
              </p>
              <p className="text-xs text-zinc-500">Awaiting confirmation</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
              <p className="text-sm font-medium text-zinc-300">Refunded</p>
              <p className="text-lg font-bold text-zinc-400">
                {formatCurrency(totalRefunded)}
              </p>
              <p className="text-xs text-zinc-500">Total refunds processed</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
              <p className="text-sm font-medium text-zinc-300">Fee Rate</p>
              <p className="text-lg font-bold text-emerald-400">
                {treasury.revenue.feeRate}
              </p>
              <p className="text-xs text-zinc-500">{treasury.revenue.performanceFee}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chain balances */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {treasury.balancesByChain.length > 0 ? (
          treasury.balancesByChain.map((chain) => {
            const chainUsd = Number(chain.totalConfirmedUsd);
            const pct = totalConfirmed > 0 ? (chainUsd / totalConfirmed) * 100 : 0;
            return (
              <Card key={chain.chain}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-zinc-400" />
                    <CardTitle className="text-base">{chain.chain}</CardTitle>
                  </div>
                  <CardDescription>{formatCurrency(chainUsd)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-zinc-400">
                        Confirmed contributions
                      </p>
                      <p className="text-sm tabular-nums text-zinc-200">
                        {formatCurrency(chainUsd)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            chainColors[chain.chain] === "violet" && "bg-violet-500",
                            chainColors[chain.chain] === "sky" && "bg-sky-500",
                            chainColors[chain.chain] === "emerald" && "bg-emerald-500",
                            chainColors[chain.chain] === "amber" && "bg-amber-500",
                            !chainColors[chain.chain] && "bg-zinc-500"
                          )}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-zinc-500">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center gap-2 py-8 text-zinc-500">
              <Layers className="h-8 w-8" />
              <p className="text-sm">No chain balance data available</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fund Flows (Recent Movements) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-zinc-400" />
            <CardTitle>Fund Flows</CardTitle>
          </div>
          <CardDescription>Recent fund movements across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-zinc-800">
            {treasury.recentMovements.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-zinc-500">
                <Inbox className="h-8 w-8" />
                <p className="text-sm">No recent fund movements</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Chain</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Tx Hash</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treasury.recentMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="whitespace-nowrap text-zinc-400">
                        {formatDate(movement.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={txTypeVariant[movement.type] || "outline"}>
                          {movement.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-200">
                        {movement.chain}
                      </TableCell>
                      <TableCell className="font-medium text-zinc-50">
                        {movement.amountUsd
                          ? formatCurrency(movement.amountUsd)
                          : formatToken(Number(movement.amount), 4, movement.currency)}
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {movement.currency}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs text-violet-400">
                            {formatAddress(movement.txHash)}
                          </span>
                          <ExternalLink className="h-3 w-3 text-zinc-600" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            movement.status === "CONFIRMED" || movement.status === "confirmed"
                              ? "success"
                              : movement.status === "PENDING" || movement.status === "pending"
                                ? "warning"
                                : "outline"
                          }
                        >
                          {movement.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Disbursements */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-zinc-400" />
            <CardTitle>Pending Disbursements</CardTitle>
          </div>
          <CardDescription>
            Deals awaiting fund release to project wallets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {treasury.pendingDisbursements.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-zinc-500">
              <CheckCircle2 className="h-8 w-8" />
              <p className="text-sm">No pending disbursements</p>
              <p className="text-xs">All funds have been distributed</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {treasury.pendingDisbursements.map((pd) => (
                <div
                  key={pd.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/30 p-5"
                >
                  <div className="flex flex-col gap-1">
                    <h4 className="font-semibold text-zinc-50">{pd.dealTitle}</h4>
                    <p className="text-sm text-zinc-400">
                      Chain: {pd.chain}
                      {pd.scheduledAt &&
                        ` | Release: ${formatDate(pd.scheduledAt)}`}
                    </p>
                    {pd.projectWalletAddress && (
                      <p className="font-mono text-xs text-zinc-500">
                        To: {formatAddress(pd.projectWalletAddress)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <p className="text-lg font-bold text-zinc-50">
                      {formatCurrency(pd.amount)}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-zinc-500" />
                        <span className="text-sm text-zinc-400">
                          Multisig:{" "}
                          <span className="font-semibold text-amber-400">
                            0/3
                          </span>{" "}
                          signed
                        </span>
                      </div>
                      <Badge variant="warning">
                        {pd.status}
                      </Badge>
                      <Button size="sm" variant="secondary">
                        Sign
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-zinc-400" />
            <CardTitle>Revenue Breakdown</CardTitle>
          </div>
          <CardDescription>Platform fees and revenue over time</CardDescription>
        </CardHeader>
        <CardContent>
          {treasury.revenue.monthlyFees.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-emerald-500/10 bg-emerald-500/5">
              <div className="flex flex-col items-center gap-2 text-zinc-500">
                <DollarSign className="h-8 w-8 text-emerald-500/40" />
                <span className="text-sm font-medium">
                  No revenue data yet
                </span>
                <span className="text-xs text-zinc-600">
                  Revenue will appear as contributions are confirmed
                </span>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-zinc-800">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Month</TableHead>
                    <TableHead>Contributions</TableHead>
                    <TableHead>Estimated Fee ({treasury.revenue.feeRate})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treasury.revenue.monthlyFees.map((mf) => {
                    const amount = Number(mf.amount);
                    const feeEstimate = amount * 0.025;
                    return (
                      <TableRow key={mf.month}>
                        <TableCell className="font-medium text-zinc-200">
                          {mf.month}
                        </TableCell>
                        <TableCell className="text-zinc-50">
                          {formatCurrency(amount)}
                        </TableCell>
                        <TableCell className="text-emerald-400">
                          {formatCurrency(feeEstimate)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Escrow Overview — derived from pending disbursements */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-zinc-400" />
            <CardTitle>Escrow Overview</CardTitle>
          </div>
          <CardDescription>Active escrow accounts and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {treasury.pendingDisbursements.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-zinc-500">
              <Lock className="h-8 w-8" />
              <p className="text-sm">No active escrows</p>
              <p className="text-xs">
                Escrow data will appear for deals in distribution phase
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-zinc-800">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Deal</TableHead>
                    <TableHead>Escrowed Amount</TableHead>
                    <TableHead>Release Conditions</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treasury.pendingDisbursements.map((pd) => (
                    <TableRow key={`esc-${pd.id}`}>
                      <TableCell className="font-medium text-zinc-50">
                        {pd.dealTitle}
                      </TableCell>
                      <TableCell className="font-semibold text-zinc-200">
                        {formatCurrency(pd.amount)}
                      </TableCell>
                      <TableCell className="max-w-xs text-zinc-400">
                        {pd.scheduledAt
                          ? `Scheduled release: ${formatDate(pd.scheduledAt)}`
                          : "Awaiting distribution schedule"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
