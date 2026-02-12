// =============================================================================
// /api/staking — GET staking positions, POST new staking action
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma, TierLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  apiResponse,
  apiError,
  handleApiError,
  requireAuth,
  validateBody,
} from "@/lib/utils/api";

// ---------------------------------------------------------------------------
// Staking action schema
// ---------------------------------------------------------------------------

const stakeSchema = z.object({
  amount: z.number().positive("Amount must be positive").min(100, "Minimum stake is 100 EXPO"),
  lockPeriod: z.enum(["NONE", "THIRTY_DAYS", "NINETY_DAYS", "ONE_EIGHTY_DAYS", "THREE_SIXTY_FIVE_DAYS"]),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
  chain: z.enum(["ETHEREUM", "BASE", "ARBITRUM"]).optional().default("ETHEREUM"),
});

// Lock period to APY mapping
const LOCK_PERIOD_APY: Record<string, number> = {
  NONE: 3.0,
  THIRTY_DAYS: 5.0,
  NINETY_DAYS: 8.0,
  ONE_EIGHTY_DAYS: 12.0,
  THREE_SIXTY_FIVE_DAYS: 18.5,
};

// Lock period to days mapping
const LOCK_PERIOD_DAYS: Record<string, number> = {
  NONE: 0,
  THIRTY_DAYS: 30,
  NINETY_DAYS: 90,
  ONE_EIGHTY_DAYS: 180,
  THREE_SIXTY_FIVE_DAYS: 365,
};

// Tier thresholds (total staked amount => tier)
const TIER_THRESHOLDS: { min: number; tier: TierLevel }[] = [
  { min: 100000, tier: "DIAMOND" },
  { min: 25000, tier: "PLATINUM" },
  { min: 5000, tier: "GOLD" },
  { min: 1000, tier: "SILVER" },
  { min: 0, tier: "BRONZE" },
];

function calculateTier(totalStaked: number): TierLevel {
  for (const threshold of TIER_THRESHOLDS) {
    if (totalStaked >= threshold.min) {
      return threshold.tier;
    }
  }
  return "BRONZE";
}

// ---------------------------------------------------------------------------
// GET handler — User's staking positions and current tier
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Fetch active staking positions with rewards
    const positions = await prisma.stakingPosition.findMany({
      where: { userId: user.id, isActive: true },
      include: {
        rewards: {
          select: {
            id: true,
            amount: true,
            rewardType: true,
            claimedAt: true,
            txHash: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate totals from real data
    let totalStaked = 0;
    let totalRewardsEarned = 0;
    let pendingRewards = 0;

    for (const pos of positions) {
      totalStaked += Number(pos.amount);
      for (const reward of pos.rewards) {
        const rewardAmount = Number(reward.amount);
        totalRewardsEarned += rewardAmount;
        if (!reward.claimedAt) {
          pendingRewards += rewardAmount;
        }
      }
    }

    // Determine current tier and next tier requirement
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { tierLevel: true },
    });

    const currentTier = currentUser?.tierLevel || "BRONZE";

    // Find next tier
    const tierOrder: TierLevel[] = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"];
    const currentTierIndex = tierOrder.indexOf(currentTier);
    let nextTierRequirement = null;

    if (currentTierIndex < tierOrder.length - 1) {
      const nextTier = tierOrder[currentTierIndex + 1];
      const nextThreshold = TIER_THRESHOLDS.find((t) => t.tier === nextTier);
      if (nextThreshold) {
        nextTierRequirement = {
          tier: nextTier,
          amountRequired: nextThreshold.min.toString(),
          amountNeeded: Math.max(0, nextThreshold.min - totalStaked).toString(),
        };
      }
    }

    // Format positions for response
    const formattedPositions = positions.map((pos) => ({
      id: pos.id,
      userId: pos.userId,
      amount: pos.amount.toString(),
      lockPeriod: pos.lockPeriod,
      apy: (LOCK_PERIOD_APY[pos.lockPeriod] || 3.0).toString(),
      stakedAt: pos.lockStartAt,
      unlockAt: pos.lockEndAt,
      isActive: pos.isActive,
      txHash: pos.txHash,
      chain: pos.chain,
      rewards: pos.rewards.map((r) => ({
        id: r.id,
        amount: r.amount.toString(),
        claimedAt: r.claimedAt,
        txHash: r.txHash,
      })),
      createdAt: pos.createdAt,
    }));

    return apiResponse({
      staking: {
        currentTier,
        totalStaked: totalStaked.toString(),
        totalRewardsEarned: totalRewardsEarned.toFixed(2),
        pendingRewards: pendingRewards.toFixed(2),
        nextTierRequirement,
        positions: formattedPositions,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// POST handler — Record a new staking action
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await validateBody(request, stakeSchema);

    const apy = LOCK_PERIOD_APY[body.lockPeriod] || 3.0;

    // Calculate lock end date
    const now = new Date();
    const lockDays = LOCK_PERIOD_DAYS[body.lockPeriod] || 0;
    const lockEndAt = lockDays > 0
      ? new Date(now.getTime() + lockDays * 24 * 60 * 60 * 1000)
      : null;

    // Create the staking position inside a transaction so we can
    // atomically recalculate the user's tier level
    const result = await prisma.$transaction(async (tx) => {
      // Create staking position
      const position = await tx.stakingPosition.create({
        data: {
          userId: user.id,
          amount: new Prisma.Decimal(body.amount),
          lockPeriod: body.lockPeriod,
          lockStartAt: now,
          lockEndAt,
          isActive: true,
          txHash: body.txHash,
          chain: body.chain,
        },
        include: {
          rewards: true,
        },
      });

      // Recalculate total staked across all active positions
      const totalStakedResult = await tx.stakingPosition.aggregate({
        where: { userId: user.id, isActive: true },
        _sum: { amount: true },
      });

      const totalStaked = totalStakedResult._sum.amount
        ? Number(totalStakedResult._sum.amount)
        : 0;

      // Determine new tier
      const newTier = calculateTier(totalStaked);

      // Get current tier to check if it changed
      const currentUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { tierLevel: true },
      });

      const oldTier = currentUser?.tierLevel || "BRONZE";

      // Update user tier
      await tx.user.update({
        where: { id: user.id },
        data: { tierLevel: newTier },
      });

      // If tier changed, create a notification
      if (oldTier !== newTier) {
        const tierOrder: TierLevel[] = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"];
        const upgraded = tierOrder.indexOf(newTier) > tierOrder.indexOf(oldTier);
        await tx.notification.create({
          data: {
            userId: user.id,
            type: "ACCOUNT",
            title: upgraded
              ? `Tier Upgraded to ${newTier.charAt(0) + newTier.slice(1).toLowerCase()}!`
              : `Tier Changed to ${newTier.charAt(0) + newTier.slice(1).toLowerCase()}`,
            message: upgraded
              ? `Congratulations! Your staking position now qualifies you for ${newTier.charAt(0) + newTier.slice(1).toLowerCase()} tier. Enjoy increased allocations and priority access.`
              : `Your tier has been updated to ${newTier.charAt(0) + newTier.slice(1).toLowerCase()} based on your current staking balance.`,
          },
        });
      }

      return { position, newTier, tierChanged: oldTier !== newTier };
    });

    const formattedPosition = {
      id: result.position.id,
      userId: result.position.userId,
      amount: result.position.amount.toString(),
      lockPeriod: result.position.lockPeriod,
      apy: apy.toString(),
      stakedAt: result.position.lockStartAt,
      unlockAt: result.position.lockEndAt,
      isActive: result.position.isActive,
      txHash: result.position.txHash,
      chain: result.position.chain,
      rewards: [],
      createdAt: result.position.createdAt,
    };

    return apiResponse(
      {
        position: formattedPosition,
        tierUpdate: result.tierChanged
          ? { newTier: result.newTier }
          : null,
      },
      201
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = (error.meta?.target as string[]) || [];
        if (target.includes("txHash")) {
          return apiError(
            "This transaction hash has already been recorded",
            409,
            "CONFLICT"
          );
        }
        return apiError("A unique constraint was violated", 409, "CONFLICT");
      }
    }
    return handleApiError(error);
  }
}
