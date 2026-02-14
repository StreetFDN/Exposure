// =============================================================================
// POST /api/deals/[id]/claim — Claim vested tokens for a deal
// Calculates the claimable amount based on the user's vesting schedule
// (TGE unlock, cliff, linear vesting) and records the claim transaction.
// =============================================================================

import { NextRequest } from "next/server";
import crypto from "crypto";
import {
  apiResponse,
  apiError,
  handleApiError,
  requireAuth,
} from "@/lib/utils/api";
import { withRateLimit } from "@/lib/utils/rate-limit";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a deal ID or slug to a canonical UUID.
 */
async function resolveDealId(idOrSlug: string): Promise<string | null> {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug
    );

  if (isUuid) {
    const deal = await prisma.deal.findUnique({
      where: { id: idOrSlug },
      select: { id: true },
    });
    return deal?.id ?? null;
  }

  const deal = await prisma.deal.findUnique({
    where: { slug: idOrSlug },
    select: { id: true },
  });
  return deal?.id ?? null;
}

/**
 * Calculate the claimable token amount based on a vesting schedule.
 *
 * Logic:
 * 1. Before vestingStart → 0
 * 2. At/after vestingStart (TGE) → tgeAmount unlocked immediately
 * 3. Between vestingStart and cliffEnd → only tgeAmount (no additional vesting)
 * 4. After cliffEnd → linear vesting of (totalAmount - tgeAmount) between
 *    cliffEnd and vestingEnd
 * 5. After vestingEnd → 100% of totalAmount
 * 6. Subtract claimedAmount from the result
 */
function calculateClaimable(schedule: {
  totalAmount: number;
  tgeAmount: number;
  claimedAmount: number;
  vestingStart: Date;
  cliffEnd: Date | null;
  vestingEnd: Date;
}): number {
  const now = new Date();
  const {
    totalAmount,
    tgeAmount,
    claimedAmount,
    vestingStart,
    cliffEnd,
    vestingEnd,
  } = schedule;

  // Before vesting starts — nothing available
  if (now < vestingStart) {
    return 0;
  }

  // After vesting end — everything is unlocked
  if (now >= vestingEnd) {
    return Math.max(0, totalAmount - claimedAmount);
  }

  // TGE amount is always available once vesting starts
  let unlocked = tgeAmount;

  // Linear vesting portion (total minus TGE)
  const linearTotal = totalAmount - tgeAmount;
  const effectiveCliffEnd = cliffEnd ?? vestingStart;

  if (now >= effectiveCliffEnd && linearTotal > 0) {
    const vestingDuration = vestingEnd.getTime() - effectiveCliffEnd.getTime();
    const elapsed = now.getTime() - effectiveCliffEnd.getTime();

    if (vestingDuration > 0) {
      const vestedFraction = Math.min(1, elapsed / vestingDuration);
      unlocked += linearTotal * vestedFraction;
    }
  }

  // Subtract what has already been claimed
  const claimable = unlocked - claimedAmount;
  return Math.max(0, claimable);
}

// ---------------------------------------------------------------------------
// POST handler — Claim vested tokens
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);

    // Rate limit: 5 claims per minute per user
    const rateLimited = withRateLimit(request, `claim:${user.id}`, 5, 60_000);
    if (rateLimited) return rateLimited;

    const { id } = await params;

    // Resolve deal ID (supports both UUID and slug)
    const dealId = await resolveDealId(id);
    if (!dealId) {
      return apiError("Deal not found", 404, "NOT_FOUND");
    }

    // Fetch deal for chain info
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true, title: true, chain: true },
    });

    if (!deal) {
      return apiError("Deal not found", 404, "NOT_FOUND");
    }

    // Find user's vesting schedule for this deal
    const vestingSchedule = await prisma.vestingSchedule.findUnique({
      where: {
        userId_dealId: {
          userId: user.id,
          dealId: deal.id,
        },
      },
    });

    if (!vestingSchedule) {
      return apiError(
        "No vesting schedule found for this deal",
        404,
        "NOT_FOUND"
      );
    }

    // Calculate claimable amount
    const claimable = calculateClaimable({
      totalAmount: Number(vestingSchedule.totalAmount),
      tgeAmount: Number(vestingSchedule.tgeAmount),
      claimedAmount: Number(vestingSchedule.claimedAmount),
      vestingStart: vestingSchedule.vestingStart,
      cliffEnd: vestingSchedule.cliffEnd,
      vestingEnd: vestingSchedule.vestingEnd,
    });

    if (claimable <= 0) {
      return apiError("Nothing to claim", 400, "NOTHING_TO_CLAIM");
    }

    // Generate a placeholder tx hash (will be replaced by real on-chain tx)
    const placeholderTxHash = `0x${crypto.randomBytes(32).toString("hex")}`;

    // Execute claim in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create ClaimRecord
      const claimRecord = await tx.claimRecord.create({
        data: {
          vestingScheduleId: vestingSchedule.id,
          userId: user.id,
          dealId: deal.id,
          amount: claimable,
          chain: deal.chain,
          claimedAt: new Date(),
          txHash: placeholderTxHash,
        },
      });

      // Update VestingSchedule: increment claimedAmount and set lastClaimAt
      const updatedSchedule = await tx.vestingSchedule.update({
        where: { id: vestingSchedule.id },
        data: {
          claimedAmount: { increment: claimable },
          lastClaimAt: new Date(),
        },
      });

      // Create AuditLog entry
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "TOKEN_CLAIM",
          resourceType: "ClaimRecord",
          resourceId: claimRecord.id,
          metadata: {
            dealId: deal.id,
            dealTitle: deal.title,
            amount: claimable,
            txHash: placeholderTxHash,
            chain: deal.chain,
          },
        },
      });

      // Create Notification for the user
      await tx.notification.create({
        data: {
          userId: user.id,
          type: "VESTING",
          title: "Tokens Claimed",
          message: `You successfully claimed ${claimable} tokens from ${deal.title}.`,
          data: {
            dealId: deal.id,
            amount: claimable,
            txHash: placeholderTxHash,
          },
        },
      });

      return {
        claimRecord,
        updatedSchedule,
      };
    });

    const newClaimedAmount = Number(result.updatedSchedule.claimedAmount);
    const totalAmount = Number(vestingSchedule.totalAmount);

    return apiResponse(
      {
        claimed: claimable,
        remaining: totalAmount - newClaimedAmount,
        txHash: placeholderTxHash,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
