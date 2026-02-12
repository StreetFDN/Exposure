// =============================================================================
// GET /api/admin/treasury — Treasury overview (admin only)
// =============================================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiResponse,
  handleApiError,
  requireAdmin,
} from "@/lib/utils/api";

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    // Run all aggregation queries in parallel
    const [
      confirmedContributionsAgg,
      pendingContributionsAgg,
      refundedContributionsAgg,
      recentTransactions,
      distributingDeals,
      monthlyContributions,
      contributionsByChain,
    ] = await Promise.all([
      // Total confirmed contributions
      prisma.contribution.aggregate({
        _sum: { amountUsd: true },
        where: { status: "CONFIRMED" },
      }),

      // Total pending contributions
      prisma.contribution.aggregate({
        _sum: { amountUsd: true },
        where: { status: "PENDING" },
      }),

      // Total refunded
      prisma.contribution.aggregate({
        _sum: { amountUsd: true },
        where: { status: "REFUNDED" },
      }),

      // Recent transactions
      prisma.transaction.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          txHash: true,
          chain: true,
          fromAddress: true,
          toAddress: true,
          amount: true,
          currency: true,
          amountUsd: true,
          status: true,
          createdAt: true,
        },
      }),

      // Deals in DISTRIBUTING status (pending disbursements)
      prisma.deal.findMany({
        where: { status: "DISTRIBUTING" },
        select: {
          id: true,
          title: true,
          totalRaised: true,
          chain: true,
          projectWalletAddress: true,
          distributionAt: true,
        },
      }),

      // Monthly contribution totals (last 5 months)
      prisma.contribution.groupBy({
        by: ["createdAt"],
        _sum: { amountUsd: true },
        where: {
          status: "CONFIRMED",
          createdAt: {
            gte: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { createdAt: "asc" },
      }),

      // Contributions by chain
      prisma.contribution.groupBy({
        by: ["chain"],
        _sum: { amountUsd: true },
        where: { status: "CONFIRMED" },
      }),
    ]);

    // Build monthly revenue summary
    const monthlyMap = new Map<string, number>();
    for (const entry of monthlyContributions) {
      const monthKey = new Date(entry.createdAt)
        .toISOString()
        .slice(0, 7); // YYYY-MM
      const existing = monthlyMap.get(monthKey) || 0;
      monthlyMap.set(monthKey, existing + Number(entry._sum.amountUsd || 0));
    }
    const monthlyFees = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({
        month,
        amount: amount.toString(),
      }));

    // Build chain balances summary
    const balancesByChain = contributionsByChain.map((group) => ({
      chain: group.chain,
      totalConfirmedUsd: (group._sum.amountUsd || 0).toString(),
    }));

    // Format pending disbursements from distributing deals
    const pendingDisbursements = distributingDeals.map((deal) => ({
      id: deal.id,
      dealId: deal.id,
      dealTitle: deal.title,
      amount: deal.totalRaised.toString(),
      chain: deal.chain,
      projectWalletAddress: deal.projectWalletAddress,
      scheduledAt: deal.distributionAt
        ? deal.distributionAt.toISOString()
        : null,
      status: "PENDING_DISBURSEMENT" as const,
    }));

    // Format recent movements from transactions
    const recentMovements = recentTransactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount.toString(),
      amountUsd: tx.amountUsd ? tx.amountUsd.toString() : null,
      currency: tx.currency,
      chain: tx.chain,
      txHash: tx.txHash,
      status: tx.status,
      timestamp: tx.createdAt.toISOString(),
    }));

    const totalConfirmed = Number(confirmedContributionsAgg._sum.amountUsd || 0);
    const totalPending = Number(pendingContributionsAgg._sum.amountUsd || 0);
    const totalRefunded = Number(refundedContributionsAgg._sum.amountUsd || 0);

    const treasury = {
      totalConfirmedUsd: totalConfirmed.toString(),
      totalConfirmedFormatted: `$${(totalConfirmed / 1_000_000).toFixed(2)}M`,
      totalPendingUsd: totalPending.toString(),
      totalRefundedUsd: totalRefunded.toString(),
      netTreasuryUsd: (totalConfirmed - totalRefunded).toString(),

      balancesByChain,
      recentMovements,
      pendingDisbursements,

      revenue: {
        monthlyFees,
        feeRate: "2.5%",
        performanceFee: "10% of profits above 2x",
      },
    };

    return apiResponse({ treasury });
  } catch (error) {
    return handleApiError(error);
  }
}
