import { Prisma } from "@prisma/client";

type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;
import { prisma } from "@/lib/prisma";

// =============================================================================
// Refund Calculator
// =============================================================================

/**
 * Refund detail for a single user on a single deal.
 */
export interface RefundEntry {
  userId: string;
  dealId: string;
  contributionId: string;
  contributedAmount: Decimal;
  allocatedAmount: Decimal;
  refundAmount: Decimal;
}

/**
 * Summary of refund calculations for a deal.
 */
export interface RefundSummary {
  dealId: string;
  totalContributed: Decimal;
  totalAllocated: Decimal;
  totalRefunds: Decimal;
  refundCount: number;
  entries: RefundEntry[];
}

/**
 * Calculate refund amounts for all users in an oversubscribed deal.
 *
 * For each user, refund = total contributed - final allocation.
 * Only users whose contributions exceed their allocation receive a refund.
 * Only confirmed contributions are considered.
 *
 * @param dealId - The deal to calculate refunds for.
 * @returns A RefundSummary with per-user refund entries.
 */
export async function calculateRefunds(
  dealId: string
): Promise<RefundSummary> {
  // Fetch the deal to verify it exists
  const deal = await prisma.deal.findUniqueOrThrow({
    where: { id: dealId },
    select: { id: true, totalRaise: true, hardCap: true },
  });

  // Get all finalized allocations for this deal
  const allocations = await prisma.allocation.findMany({
    where: { dealId, isFinalized: true },
    select: {
      userId: true,
      finalAmount: true,
    },
  });

  // Build a map of userId -> allocated amount
  const allocationMap = new Map<string, Decimal>();
  for (const alloc of allocations) {
    allocationMap.set(alloc.userId, alloc.finalAmount);
  }

  // Get all confirmed contributions grouped by user
  const contributions = await prisma.contribution.findMany({
    where: {
      dealId,
      status: "CONFIRMED",
    },
    select: {
      id: true,
      userId: true,
      amount: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Aggregate contributions per user
  const userContributions = new Map<
    string,
    { totalAmount: Decimal; contributionIds: string[] }
  >();
  for (const contrib of contributions) {
    const existing = userContributions.get(contrib.userId);
    if (existing) {
      existing.totalAmount = existing.totalAmount.add(contrib.amount);
      existing.contributionIds.push(contrib.id);
    } else {
      userContributions.set(contrib.userId, {
        totalAmount: new Decimal(contrib.amount.toString()),
        contributionIds: [contrib.id],
      });
    }
  }

  const entries: RefundEntry[] = [];
  let totalContributed = new Decimal(0);
  let totalAllocated = new Decimal(0);
  let totalRefunds = new Decimal(0);

  for (const [userId, userContrib] of userContributions) {
    const allocated = allocationMap.get(userId) ?? new Decimal(0);
    const contributed = userContrib.totalAmount;

    totalContributed = totalContributed.add(contributed);
    totalAllocated = totalAllocated.add(allocated);

    // Refund only if the user contributed more than their allocation
    if (contributed.greaterThan(allocated)) {
      const refundAmount = contributed.minus(allocated);
      totalRefunds = totalRefunds.add(refundAmount);

      // Attach refund to the latest contribution for tracking
      const latestContributionId =
        userContrib.contributionIds[userContrib.contributionIds.length - 1];

      entries.push({
        userId,
        dealId: deal.id,
        contributionId: latestContributionId,
        contributedAmount: contributed,
        allocatedAmount: allocated,
        refundAmount,
      });
    }
  }

  return {
    dealId: deal.id,
    totalContributed,
    totalAllocated,
    totalRefunds,
    refundCount: entries.length,
    entries,
  };
}

/**
 * Process refunds by writing refund records to the database.
 *
 * This marks each affected contribution with a refund amount and creates
 * an audit log entry. It does NOT initiate on-chain transfers; a separate
 * process handles the actual token/ETH refund transactions.
 *
 * @param dealId - The deal to process refunds for.
 * @returns The refund summary that was processed.
 */
export async function processRefunds(
  dealId: string
): Promise<RefundSummary> {
  const summary = await calculateRefunds(dealId);

  if (summary.entries.length === 0) {
    return summary;
  }

  // Execute all refund updates in a transaction
  await prisma.$transaction(async (tx) => {
    for (const entry of summary.entries) {
      // Update the contribution with the refund amount
      await tx.contribution.update({
        where: { id: entry.contributionId },
        data: {
          refundAmount: entry.refundAmount,
          status: "REFUNDED",
          refundedAt: new Date(),
        },
      });

      // Create an audit log entry for the refund
      await tx.auditLog.create({
        data: {
          userId: entry.userId,
          action: "REFUND_CALCULATED",
          resourceType: "Contribution",
          resourceId: entry.contributionId,
          metadata: {
            dealId: entry.dealId,
            contributedAmount: entry.contributedAmount.toString(),
            allocatedAmount: entry.allocatedAmount.toString(),
            refundAmount: entry.refundAmount.toString(),
          },
        },
      });
    }

    // Create a summary audit log for the deal
    await tx.auditLog.create({
      data: {
        action: "DEAL_REFUNDS_PROCESSED",
        resourceType: "Deal",
        resourceId: dealId,
        metadata: {
          totalContributed: summary.totalContributed.toString(),
          totalAllocated: summary.totalAllocated.toString(),
          totalRefunds: summary.totalRefunds.toString(),
          refundCount: summary.refundCount,
        },
      },
    });
  });

  return summary;
}
