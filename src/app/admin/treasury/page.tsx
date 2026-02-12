"use client";

import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
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
/*  Placeholder data                                                          */
/* -------------------------------------------------------------------------- */

const treasuryTotal = {
  usd: 12_847_320,
  breakdown: [
    { token: "USDC", amount: 8_420_000, usd: 8_420_000 },
    { token: "USDT", amount: 2_150_000, usd: 2_150_000 },
    { token: "ETH", amount: 842.5, usd: 1_877_320 },
    { token: "EXPO", amount: 5_000_000, usd: 400_000 },
  ],
};

const chainBalances = [
  {
    chain: "Ethereum",
    color: "violet",
    balances: [
      { token: "ETH", amount: 512.3, usd: 1_142_428 },
      { token: "USDC", amount: 5_200_000, usd: 5_200_000 },
      { token: "EXPO", amount: 3_000_000, usd: 240_000 },
    ],
  },
  {
    chain: "Arbitrum",
    color: "sky",
    balances: [
      { token: "ETH", amount: 180.2, usd: 401_846 },
      { token: "USDC", amount: 1_800_000, usd: 1_800_000 },
      { token: "EXPO", amount: 1_200_000, usd: 96_000 },
    ],
  },
  {
    chain: "Base",
    color: "emerald",
    balances: [
      { token: "ETH", amount: 95.0, usd: 211_850 },
      { token: "USDC", amount: 920_000, usd: 920_000 },
      { token: "EXPO", amount: 500_000, usd: 40_000 },
    ],
  },
  {
    chain: "Polygon",
    color: "amber",
    balances: [
      { token: "ETH", amount: 55.0, usd: 121_196 },
      { token: "USDC", amount: 500_000, usd: 500_000 },
      { token: "EXPO", amount: 300_000, usd: 24_000 },
    ],
  },
];

const fundFlows = [
  {
    id: "ff-1",
    date: "2026-02-12T10:30:00Z",
    type: "Fee Collection" as const,
    deal: "Nexus Protocol",
    amount: 73_500,
    from: "0x7a2F...9F0A",
    to: "0xFee1...C0ll",
    txHash: "0xabc123...def456",
    status: "Confirmed",
  },
  {
    id: "ff-2",
    date: "2026-02-11T16:00:00Z",
    type: "Disbursement" as const,
    deal: "Onchain Labs",
    amount: 1_764_000,
    from: "0xEscr...0w01",
    to: "0x0nCh...L4bs",
    txHash: "0xdef789...abc012",
    status: "Confirmed",
  },
  {
    id: "ff-3",
    date: "2026-02-10T14:00:00Z",
    type: "Refund" as const,
    deal: "Solace Protocol",
    amount: 118_800,
    from: "0xEscr...0w02",
    to: "Multiple (89 addresses)",
    txHash: "0x123abc...456def",
    status: "Processing",
  },
  {
    id: "ff-4",
    date: "2026-02-09T09:00:00Z",
    type: "Fee Collection" as const,
    deal: "Prism Finance",
    amount: 96_000,
    from: "0x8f4a...d2c9",
    to: "0xFee1...C0ll",
    txHash: "0x456def...789abc",
    status: "Confirmed",
  },
  {
    id: "ff-5",
    date: "2026-02-08T11:30:00Z",
    type: "Fee Collection" as const,
    deal: "ZeroLayer",
    amount: 26_700,
    from: "0xd9c3...b7a2",
    to: "0xFee1...C0ll",
    txHash: "0x789abc...012def",
    status: "Confirmed",
  },
  {
    id: "ff-6",
    date: "2026-02-07T15:00:00Z",
    type: "Disbursement" as const,
    deal: "Quantum Bridge",
    amount: 5_880_000,
    from: "0xEscr...0w03",
    to: "0xQu4n...Br1d",
    txHash: "0x012def...345abc",
    status: "Confirmed",
  },
];

const pendingDisbursements = [
  {
    id: "pd-1",
    deal: "Nexus Protocol",
    amount: 2_352_500,
    multisigSigned: 2,
    multisigRequired: 3,
    releaseDate: "2026-02-28",
    status: "Awaiting Signatures",
  },
  {
    id: "pd-2",
    deal: "ZeroLayer",
    amount: 871_200,
    multisigSigned: 1,
    multisigRequired: 3,
    releaseDate: "2026-03-15",
    status: "Awaiting Signatures",
  },
  {
    id: "pd-3",
    deal: "Prism Finance",
    amount: 3_136_000,
    multisigSigned: 0,
    multisigRequired: 3,
    releaseDate: "2026-03-01",
    status: "Pending",
  },
];

const activeEscrows = [
  {
    id: "esc-1",
    deal: "Nexus Protocol",
    escrowedAmount: 2_450_000,
    releaseConditions: "Contribution period ends + 48h settlement",
    status: "Active",
  },
  {
    id: "esc-2",
    deal: "ZeroLayer",
    escrowedAmount: 890_000,
    releaseConditions: "Hard cap reached or contribution close",
    status: "Active",
  },
  {
    id: "esc-3",
    deal: "Prism Finance",
    escrowedAmount: 3_200_000,
    releaseConditions: "Contribution period ends + 48h settlement",
    status: "Active",
  },
  {
    id: "esc-4",
    deal: "MetaVault",
    escrowedAmount: 340_000,
    releaseConditions: "Deal paused — compliance hold",
    status: "Frozen",
  },
  {
    id: "esc-5",
    deal: "Solace Protocol",
    escrowedAmount: 1_200,
    releaseConditions: "Refund processing — cancelled deal",
    status: "Releasing",
  },
];

const typeVariant: Record<string, "success" | "info" | "warning"> = {
  "Fee Collection": "success",
  Disbursement: "info",
  Refund: "warning",
};

const escrowStatusVariant: Record<string, "success" | "warning" | "error" | "info"> = {
  Active: "success",
  Frozen: "error",
  Releasing: "info",
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function TreasuryManagementPage() {
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
              {formatCurrency(treasuryTotal.usd)}
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Across all chains and tokens
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {treasuryTotal.breakdown.map((b) => (
              <div
                key={b.token}
                className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4"
              >
                <p className="text-sm font-medium text-zinc-300">{b.token}</p>
                <p className="text-lg font-bold text-zinc-50">
                  {formatToken(b.amount, 2, b.token)}
                </p>
                <p className="text-xs text-zinc-500">
                  {formatCurrency(b.usd)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chain balances */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {chainBalances.map((chain) => {
          const totalUsd = chain.balances.reduce((acc, b) => acc + b.usd, 0);
          return (
            <Card key={chain.chain}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-zinc-400" />
                  <CardTitle className="text-base">{chain.chain}</CardTitle>
                </div>
                <CardDescription>{formatCurrency(totalUsd)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {chain.balances.map((b) => (
                    <div
                      key={b.token}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-300">
                          {b.token}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {formatCurrency(b.usd)}
                        </p>
                      </div>
                      <p className="text-sm tabular-nums text-zinc-200">
                        {formatToken(b.amount, b.token === "ETH" ? 2 : 0)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Fund Flows */}
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
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Deal</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Tx Hash</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fundFlows.map((flow) => (
                  <TableRow key={flow.id}>
                    <TableCell className="whitespace-nowrap text-zinc-400">
                      {formatDate(flow.date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeVariant[flow.type]}>{flow.type}</Badge>
                    </TableCell>
                    <TableCell className="text-zinc-200">{flow.deal}</TableCell>
                    <TableCell className="font-medium text-zinc-50">
                      {formatCurrency(flow.amount)}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-zinc-500">
                        {flow.from}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-zinc-500">
                        {flow.to}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-violet-400">
                          {flow.txHash}
                        </span>
                        <ExternalLink className="h-3 w-3 text-zinc-600" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          flow.status === "Confirmed"
                            ? "success"
                            : flow.status === "Processing"
                              ? "warning"
                              : "outline"
                        }
                      >
                        {flow.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
          <div className="flex flex-col gap-4">
            {pendingDisbursements.map((pd) => (
              <div
                key={pd.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/30 p-5"
              >
                <div className="flex flex-col gap-1">
                  <h4 className="font-semibold text-zinc-50">{pd.deal}</h4>
                  <p className="text-sm text-zinc-400">
                    Release date: {formatDate(pd.releaseDate)}
                  </p>
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
                        <span
                          className={cn(
                            "font-semibold",
                            pd.multisigSigned >= pd.multisigRequired
                              ? "text-emerald-400"
                              : "text-amber-400"
                          )}
                        >
                          {pd.multisigSigned}/{pd.multisigRequired}
                        </span>{" "}
                        signed
                      </span>
                    </div>
                    <Badge
                      variant={
                        pd.status === "Pending"
                          ? "outline"
                          : pd.status === "Awaiting Signatures"
                            ? "warning"
                            : "success"
                      }
                    >
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
        </CardContent>
      </Card>

      {/* Revenue Breakdown Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-zinc-400" />
            <CardTitle>Revenue Breakdown</CardTitle>
          </div>
          <CardDescription>Platform fees and revenue over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center rounded-lg border border-emerald-500/10 bg-emerald-500/5">
            <div className="flex flex-col items-center gap-2 text-zinc-500">
              <DollarSign className="h-8 w-8 text-emerald-500/40" />
              <span className="text-sm font-medium">
                Revenue Chart — Recharts Integration Pending
              </span>
              <span className="text-xs text-zinc-600">
                Fees by deal, monthly revenue breakdown
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Escrow Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-zinc-400" />
            <CardTitle>Escrow Overview</CardTitle>
          </div>
          <CardDescription>Active escrow accounts and their status</CardDescription>
        </CardHeader>
        <CardContent>
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
                {activeEscrows.map((esc) => (
                  <TableRow key={esc.id}>
                    <TableCell className="font-medium text-zinc-50">
                      {esc.deal}
                    </TableCell>
                    <TableCell className="font-semibold text-zinc-200">
                      {formatCurrency(esc.escrowedAmount)}
                    </TableCell>
                    <TableCell className="max-w-xs text-zinc-400">
                      {esc.releaseConditions}
                    </TableCell>
                    <TableCell>
                      <Badge variant={escrowStatusVariant[esc.status]}>
                        {esc.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
