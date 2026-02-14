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
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  formatCurrency,
  formatAddress,
  formatDate,
  formatToken,
} from "@/lib/utils/format";

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

const chainColor: Record<string, string> = {
  ETHEREUM: "bg-violet-500",
  ARBITRUM: "bg-sky-500",
  BASE: "bg-emerald-500",
  POLYGON: "bg-amber-500",
};

const txTypeColor: Record<string, string> = {
  CONTRIBUTION: "text-emerald-600",
  CLAIM: "text-sky-600",
  REFUND: "text-amber-600",
  STAKE: "text-zinc-500",
  UNSTAKE: "text-zinc-500",
};

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                          */
/* -------------------------------------------------------------------------- */

function TreasurySkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-4 gap-px bg-zinc-200">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-6">
            <div className="h-2.5 w-20 animate-pulse rounded bg-zinc-200" />
            <div className="mt-3 h-7 w-32 animate-pulse rounded bg-zinc-200" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-px bg-zinc-200">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-5">
            <div className="h-2.5 w-16 animate-pulse rounded bg-zinc-200" />
            <div className="mt-2 h-5 w-24 animate-pulse rounded bg-zinc-200" />
            <div className="mt-3 h-1 w-full animate-pulse rounded bg-zinc-200" />
          </div>
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="border border-zinc-200">
          {Array.from({ length: 4 }).map((_, j) => (
            <div key={j} className="flex items-center gap-6 border-b border-zinc-200 px-5 py-4">
              <div className="h-3 w-20 animate-pulse rounded bg-zinc-200" />
              <div className="h-3 w-16 animate-pulse rounded bg-zinc-200" />
              <div className="h-3 w-14 animate-pulse rounded bg-zinc-200" />
              <div className="h-3 w-20 animate-pulse rounded bg-zinc-200" />
              <div className="h-3 w-24 animate-pulse rounded bg-zinc-200" />
            </div>
          ))}
        </div>
      ))}
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

  useEffect(() => { fetchTreasury(); }, [fetchTreasury]);

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="font-serif text-2xl font-light text-zinc-900">Treasury</h1>
          <p className="mt-1 text-sm font-normal text-zinc-500">Platform treasury management and fund flows</p>
        </div>
        <TreasurySkeleton />
      </div>
    );
  }

  if (error || !treasury) {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="font-serif text-2xl font-light text-zinc-900">Treasury</h1>
          <p className="mt-1 text-sm font-normal text-zinc-500">Platform treasury management and fund flows</p>
        </div>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <Wallet className="mb-6 h-8 w-8 text-zinc-400" />
          <h2 className="font-serif text-2xl font-light text-zinc-800">Unable to load treasury</h2>
          <p className="mt-3 max-w-sm text-sm font-normal leading-relaxed text-zinc-500">{error || "Treasury data could not be retrieved. Please check your connection and try again."}</p>
          <button onClick={fetchTreasury} className="mt-8 border border-zinc-300 px-6 py-2.5 text-sm font-normal text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-800">Retry</button>
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
      <div>
        <h1 className="font-serif text-2xl font-light text-zinc-900">Treasury</h1>
        <p className="mt-1 text-sm font-normal text-zinc-500">Platform treasury management and fund flows</p>
      </div>

      {/* Total Treasury hero */}
      <div className="border border-zinc-200 p-8">
        <div className="flex items-center gap-2 text-zinc-500">
          <Wallet className="h-4 w-4" />
          <span className="text-xs uppercase tracking-widest">Net Platform Treasury</span>
        </div>
        <p className="mt-3 font-serif text-4xl font-light tabular-nums text-zinc-900">{formatCurrency(netTreasury)}</p>
        <p className="mt-2 text-sm font-normal text-zinc-500">Confirmed minus refunded across all chains</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-px bg-zinc-200">
        <div className="bg-white p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Confirmed</p>
          <p className="mt-2 font-serif text-2xl font-light tabular-nums text-zinc-800">{formatCurrency(totalConfirmed)}</p>
          <p className="mt-1 text-xs font-normal text-zinc-400">Total confirmed contributions</p>
        </div>
        <div className="bg-white p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Pending</p>
          <p className="mt-2 font-serif text-2xl font-light tabular-nums text-amber-600">{formatCurrency(totalPending)}</p>
          <p className="mt-1 text-xs font-normal text-zinc-400">Awaiting confirmation</p>
        </div>
        <div className="bg-white p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Refunded</p>
          <p className="mt-2 font-serif text-2xl font-light tabular-nums text-zinc-500">{formatCurrency(totalRefunded)}</p>
          <p className="mt-1 text-xs font-normal text-zinc-400">Total refunds processed</p>
        </div>
        <div className="bg-white p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Fee Rate</p>
          <p className="mt-2 font-serif text-2xl font-light text-emerald-600">{treasury.revenue.feeRate}</p>
          <p className="mt-1 text-xs font-normal text-zinc-400">{treasury.revenue.performanceFee}</p>
        </div>
      </div>

      {/* Chain balances */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Layers className="h-4 w-4 text-zinc-500" />
          <h2 className="text-xs uppercase tracking-widest text-zinc-500">Balances by Chain</h2>
        </div>
        {treasury.balancesByChain.length > 0 ? (
          <div className="grid grid-cols-4 gap-px bg-zinc-200">
            {treasury.balancesByChain.map((chain) => {
              const chainUsd = Number(chain.totalConfirmedUsd);
              const pct = totalConfirmed > 0 ? (chainUsd / totalConfirmed) * 100 : 0;
              return (
                <div key={chain.chain} className="bg-white p-5">
                  <p className="text-xs uppercase tracking-widest text-zinc-500">{chain.chain}</p>
                  <p className="mt-2 font-mono text-lg font-normal text-zinc-700">{formatCurrency(chainUsd)}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1 flex-1 bg-zinc-200">
                      <div className={cn("h-full transition-all", chainColor[chain.chain] || "bg-zinc-500")} style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                    <span className="text-xs tabular-nums text-zinc-400">{pct.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 border border-zinc-200 py-12 text-zinc-500">
            <Layers className="h-6 w-6" />
            <p className="text-sm font-normal">No chain balance data available</p>
          </div>
        )}
      </div>

      {/* Fund Flows */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-zinc-500" />
          <h2 className="text-xs uppercase tracking-widest text-zinc-500">Fund Flows</h2>
          <span className="text-xs font-normal text-zinc-400">Recent movements across the platform</span>
        </div>
        <div className="border border-zinc-200">
          {treasury.recentMovements.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-zinc-500">
              <Inbox className="h-6 w-6" />
              <p className="font-serif text-lg font-normal text-zinc-500">No recent fund movements</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200">
                  {["Date", "Type", "Chain", "Amount", "Currency", "Tx Hash", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {treasury.recentMovements.map((movement) => (
                  <tr key={movement.id} className="border-b border-zinc-200 transition-colors hover:bg-zinc-50">
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-normal text-zinc-500">{formatDate(movement.timestamp)}</td>
                    <td className="px-5 py-4"><span className={cn("text-xs uppercase tracking-wider", txTypeColor[movement.type] || "text-zinc-500")}>{movement.type}</span></td>
                    <td className="px-5 py-4 text-sm font-normal text-zinc-600">{movement.chain}</td>
                    <td className="px-5 py-4 font-mono text-sm text-zinc-800">{movement.amountUsd ? formatCurrency(movement.amountUsd) : formatToken(Number(movement.amount), 4, movement.currency)}</td>
                    <td className="px-5 py-4 text-sm font-normal text-zinc-500">{movement.currency}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-violet-600">{formatAddress(movement.txHash)}</span>
                        <ExternalLink className="h-3 w-3 text-zinc-300" />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn("text-sm font-normal", movement.status === "CONFIRMED" || movement.status === "confirmed" ? "text-emerald-600" : movement.status === "PENDING" || movement.status === "pending" ? "text-amber-600" : "text-zinc-500")}>{movement.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pending Disbursements */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-zinc-500" />
          <h2 className="text-xs uppercase tracking-widest text-zinc-500">Pending Disbursements</h2>
          <span className="text-xs font-normal text-zinc-400">Deals awaiting fund release to project wallets</span>
        </div>
        {treasury.pendingDisbursements.length === 0 ? (
          <div className="flex flex-col items-center gap-3 border border-zinc-200 py-16 text-zinc-500">
            <CheckCircle2 className="h-6 w-6" />
            <p className="font-serif text-lg font-normal text-zinc-500">No pending disbursements</p>
            <p className="text-sm font-normal">All funds have been distributed</p>
          </div>
        ) : (
          <div className="flex flex-col gap-px bg-zinc-200">
            {treasury.pendingDisbursements.map((pd) => (
              <div key={pd.id} className="flex items-center justify-between bg-white px-5 py-5">
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-normal text-zinc-800">{pd.dealTitle}</h4>
                  <div className="flex items-center gap-3 text-zinc-500">
                    <span className="text-xs font-normal">{pd.chain}</span>
                    {pd.scheduledAt && <span className="text-xs font-normal">Release: {formatDate(pd.scheduledAt)}</span>}
                    {pd.projectWalletAddress && <span className="font-mono text-xs">To: {formatAddress(pd.projectWalletAddress)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <p className="font-serif text-xl font-normal tabular-nums text-zinc-800">{formatCurrency(pd.amount)}</p>
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Shield className="h-3.5 w-3.5" />
                    <span className="text-xs font-normal">Multisig: <span className="text-amber-600">0/3</span> signed</span>
                  </div>
                  <span className="text-xs uppercase tracking-widest text-amber-600">{pd.status}</span>
                  <button className="border border-zinc-200 px-4 py-2 text-sm font-normal text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-800">Sign</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revenue Breakdown */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-zinc-500" />
          <h2 className="text-xs uppercase tracking-widest text-zinc-500">Revenue Breakdown</h2>
          <span className="text-xs font-normal text-zinc-400">Platform fees and revenue over time</span>
        </div>
        {treasury.revenue.monthlyFees.length === 0 ? (
          <div className="flex flex-col items-center gap-3 border border-zinc-200 py-16 text-zinc-500">
            <DollarSign className="h-6 w-6" />
            <p className="font-serif text-lg font-normal text-zinc-500">No revenue data yet</p>
            <p className="text-sm font-normal">Revenue will appear as contributions are confirmed</p>
          </div>
        ) : (
          <div className="border border-zinc-200">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="px-5 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500">Month</th>
                  <th className="px-5 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500">Contributions</th>
                  <th className="px-5 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500">Estimated Fee ({treasury.revenue.feeRate})</th>
                </tr>
              </thead>
              <tbody>
                {treasury.revenue.monthlyFees.map((mf) => {
                  const amount = Number(mf.amount);
                  const feeEstimate = amount * 0.025;
                  return (
                    <tr key={mf.month} className="border-b border-zinc-200 transition-colors hover:bg-zinc-50">
                      <td className="px-5 py-4 text-sm font-normal text-zinc-700">{mf.month}</td>
                      <td className="px-5 py-4 font-mono text-sm text-zinc-800">{formatCurrency(amount)}</td>
                      <td className="px-5 py-4 font-mono text-sm text-emerald-600">{formatCurrency(feeEstimate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Escrow Overview */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4 text-zinc-500" />
          <h2 className="text-xs uppercase tracking-widest text-zinc-500">Escrow Overview</h2>
          <span className="text-xs font-normal text-zinc-400">Active escrow accounts and their status</span>
        </div>
        {treasury.pendingDisbursements.length === 0 ? (
          <div className="flex flex-col items-center gap-3 border border-zinc-200 py-16 text-zinc-500">
            <Lock className="h-6 w-6" />
            <p className="font-serif text-lg font-normal text-zinc-500">No active escrows</p>
            <p className="text-sm font-normal">Escrow data will appear for deals in distribution phase</p>
          </div>
        ) : (
          <div className="border border-zinc-200">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="px-5 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500">Deal</th>
                  <th className="px-5 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500">Escrowed Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500">Release Conditions</th>
                  <th className="px-5 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {treasury.pendingDisbursements.map((pd) => (
                  <tr key={`esc-${pd.id}`} className="border-b border-zinc-200 transition-colors hover:bg-zinc-50">
                    <td className="px-5 py-4 text-sm font-normal text-zinc-800">{pd.dealTitle}</td>
                    <td className="px-5 py-4 font-mono text-sm text-zinc-700">{formatCurrency(pd.amount)}</td>
                    <td className="max-w-xs px-5 py-4 text-sm font-normal text-zinc-500">{pd.scheduledAt ? `Scheduled release: ${formatDate(pd.scheduledAt)}` : "Awaiting distribution schedule"}</td>
                    <td className="px-5 py-4"><span className="text-xs uppercase tracking-widest text-emerald-600">Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
