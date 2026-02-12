// =============================================================================
// /api/users/me — Get and update current user profile (GET, PATCH)
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  apiResponse,
  apiError,
  handleApiError,
  requireAuth,
  validateBody,
} from "@/lib/utils/api";

// ---------------------------------------------------------------------------
// Update profile schema
// ---------------------------------------------------------------------------

const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be at most 50 characters")
    .regex(/^[a-zA-Z0-9_.]+$/, "Only letters, numbers, underscores, and periods allowed")
    .optional(),
  email: z.string().email("Invalid email address").optional(),
  avatarUrl: z.string().url("Invalid URL").nullable().optional(),
  notificationPreferences: z
    .object({
      dealUpdates: z.boolean().optional(),
      contributionConfirmations: z.boolean().optional(),
      vestingUnlocks: z.boolean().optional(),
      tierChanges: z.boolean().optional(),
      newDeals: z.boolean().optional(),
      marketing: z.boolean().optional(),
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// GET handler — Get current user profile
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        wallets: {
          select: {
            id: true,
            address: true,
            chain: true,
            isPrimary: true,
            linkedAt: true,
          },
          orderBy: { isPrimary: "desc" },
        },
      },
    });

    if (!user) {
      return apiError("User not found", 404, "NOT_FOUND");
    }

    // Aggregate contribution stats
    const contributionStats = await prisma.contribution.aggregate({
      where: { userId: session.id, status: "CONFIRMED" },
      _sum: { amountUsd: true },
      _count: { id: true },
    });

    // Count distinct deals participated in
    const dealsParticipated = await prisma.contribution.groupBy({
      by: ["dealId"],
      where: { userId: session.id, status: "CONFIRMED" },
    });

    // Count active deals (deals that are not COMPLETED or CANCELLED)
    const activeDeals = await prisma.contribution.findMany({
      where: {
        userId: session.id,
        status: "CONFIRMED",
        deal: {
          status: { notIn: ["COMPLETED", "CANCELLED"] },
        },
      },
      select: { dealId: true },
      distinct: ["dealId"],
    });

    // Total allocation amount
    const allocationStats = await prisma.allocation.aggregate({
      where: { userId: session.id, isFinalized: true },
      _sum: { finalAmount: true },
    });

    // Staking balance (sum of active positions)
    const stakingStats = await prisma.stakingPosition.aggregate({
      where: { userId: session.id, isActive: true },
      _sum: { amount: true },
    });

    // Referral stats
    const referralCount = await prisma.user.count({
      where: { referredById: session.id },
    });

    const referralEarnings = await prisma.referralReward.aggregate({
      where: { referrerId: session.id },
      _sum: { amount: true },
    });

    // Portfolio value from vesting schedules (token-based value estimation)
    // For a real implementation you would fetch live prices; here we use contribution USD values
    const totalContributedUsd = contributionStats._sum.amountUsd
      ? Number(contributionStats._sum.amountUsd)
      : 0;
    const totalAllocated = allocationStats._sum.finalAmount
      ? Number(allocationStats._sum.finalAmount)
      : 0;
    const stakingBalance = stakingStats._sum.amount
      ? Number(stakingStats._sum.amount)
      : 0;
    const totalReferralEarnings = referralEarnings._sum.amount
      ? Number(referralEarnings._sum.amount)
      : 0;

    const profile = {
      id: user.id,
      walletAddress: user.walletAddress,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      kycStatus: user.kycStatus,
      kycTier: user.kycTier,
      kycApprovedAt: user.kycApprovedAt,
      tierLevel: user.tierLevel,
      referralCode: user.referralCode,
      referredBy: user.referredById,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      wallets: user.wallets,
      stats: {
        totalContributed: user.totalContributed.toString(),
        totalContributedUsd: totalContributedUsd.toString(),
        dealsParticipated: dealsParticipated.length,
        activeDeals: activeDeals.length,
        totalAllocated: totalAllocated.toString(),
        portfolioValueUsd: totalContributedUsd.toString(),
        totalPnlUsd: "0",
        totalPnlPercent: 0,
        stakingBalance: stakingBalance.toString(),
        referralCount,
        referralEarnings: totalReferralEarnings.toString(),
      },
    };

    return apiResponse({ user: profile });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// PATCH handler — Update user profile
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const body = await validateBody(request, updateProfileSchema);

    // Build the update payload — only include fields that were provided
    const updateData: Prisma.UserUpdateInput = {};

    if (body.displayName !== undefined) {
      updateData.displayName = body.displayName;
    }

    if (body.email !== undefined) {
      updateData.email = body.email;
    }

    if (body.avatarUrl !== undefined) {
      updateData.avatarUrl = body.avatarUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      include: {
        wallets: {
          select: {
            id: true,
            address: true,
            chain: true,
            isPrimary: true,
            linkedAt: true,
          },
          orderBy: { isPrimary: "desc" },
        },
      },
      data: updateData,
    });

    const profile = {
      id: updatedUser.id,
      walletAddress: updatedUser.walletAddress,
      displayName: updatedUser.displayName,
      email: updatedUser.email,
      role: updatedUser.role,
      kycStatus: updatedUser.kycStatus,
      kycTier: updatedUser.kycTier,
      kycApprovedAt: updatedUser.kycApprovedAt,
      tierLevel: updatedUser.tierLevel,
      referralCode: updatedUser.referralCode,
      referredBy: updatedUser.referredById,
      avatarUrl: updatedUser.avatarUrl,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      wallets: updatedUser.wallets,
    };

    return apiResponse({ user: profile });
  } catch (error) {
    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = (error.meta?.target as string[]) || [];
        if (target.includes("email")) {
          return apiError("Email address is already in use", 409, "CONFLICT");
        }
        if (target.includes("displayName")) {
          return apiError("Display name is already taken", 409, "CONFLICT");
        }
        return apiError("A unique constraint was violated", 409, "CONFLICT");
      }
      if (error.code === "P2025") {
        return apiError("User not found", 404, "NOT_FOUND");
      }
    }
    return handleApiError(error);
  }
}
