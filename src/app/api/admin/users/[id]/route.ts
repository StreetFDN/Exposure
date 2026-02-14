// =============================================================================
// /api/admin/users/[id] — Get / Update a single user (admin only)
// =============================================================================

import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  apiResponse,
  apiError,
  handleApiError,
  requireAdmin,
  validateBody,
} from "@/lib/utils/api";

// ---------------------------------------------------------------------------
// PATCH body schema
// ---------------------------------------------------------------------------

const updateUserSchema = z.object({
  isBanned: z.boolean().optional(),
  banReason: z.string().max(2000).nullable().optional(),
  kycStatus: z.enum(["NONE", "PENDING", "APPROVED", "REJECTED", "EXPIRED"]).optional(),
  role: z
    .enum([
      "INVESTOR",
      "PROJECT_ADMIN",
      "PLATFORM_ADMIN",
      "SUPER_ADMIN",
      "COMPLIANCE_OFFICER",
      "SUPPORT_AGENT",
    ])
    .optional(),
  tierLevel: z
    .enum(["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"])
    .optional(),
});

// ---------------------------------------------------------------------------
// GET handler — Fetch single user detail (admin only)
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        wallets: {
          select: {
            id: true,
            address: true,
            chain: true,
            isPrimary: true,
          },
        },
        contributions: {
          select: {
            id: true,
            amount: true,
            amountUsd: true,
            currency: true,
            chain: true,
            status: true,
            txHash: true,
            createdAt: true,
            deal: {
              select: { id: true, title: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        stakingPositions: {
          where: { isActive: true },
          select: {
            id: true,
            amount: true,
            lockPeriod: true,
            chain: true,
            lockStartAt: true,
            lockEndAt: true,
          },
        },
        complianceFlags: {
          select: {
            id: true,
            reason: true,
            severity: true,
            description: true,
            isResolved: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        auditLogs: {
          select: {
            id: true,
            action: true,
            resourceType: true,
            resourceId: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: {
          select: {
            wallets: true,
            contributions: true,
            referrals: true,
            stakingPositions: true,
          },
        },
      },
    });

    if (!user) {
      return apiError("User not found", 404, "NOT_FOUND");
    }

    return apiResponse({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// PATCH handler — Update user fields (admin only)
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const body = await validateBody(request, updateUserSchema);

    // Verify user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        isBanned: true,
        kycStatus: true,
        role: true,
        tierLevel: true,
        displayName: true,
        walletAddress: true,
      },
    });

    if (!existingUser) {
      return apiError("User not found", 404, "NOT_FOUND");
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    const changes: Record<string, { from: unknown; to: unknown }> = {};

    if (body.isBanned !== undefined) {
      updateData.isBanned = body.isBanned;
      changes.isBanned = { from: existingUser.isBanned, to: body.isBanned };
    }

    if (body.banReason !== undefined) {
      updateData.banReason = body.banReason;
    }

    if (body.kycStatus !== undefined) {
      updateData.kycStatus = body.kycStatus;
      changes.kycStatus = { from: existingUser.kycStatus, to: body.kycStatus };
    }

    if (body.role !== undefined) {
      updateData.role = body.role;
      changes.role = { from: existingUser.role, to: body.role };
    }

    if (body.tierLevel !== undefined) {
      updateData.tierLevel = body.tierLevel;
      changes.tierLevel = {
        from: existingUser.tierLevel,
        to: body.tierLevel,
      };
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        walletAddress: true,
        displayName: true,
        email: true,
        role: true,
        kycStatus: true,
        tierLevel: true,
        isBanned: true,
        banReason: true,
        totalContributed: true,
        createdAt: true,
      },
    });

    // Determine audit action
    let action = "USER_UPDATED";
    if (body.isBanned === true) action = "USER_BANNED";
    else if (body.isBanned === false) action = "USER_UNBANNED";
    else if (body.kycStatus !== undefined) action = "USER_KYC_UPDATED";
    else if (body.role !== undefined) action = "USER_ROLE_UPDATED";
    else if (body.tierLevel !== undefined) action = "USER_TIER_UPDATED";

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action,
        resourceType: "User",
        resourceId: id,
        metadata: {
          changes,
          targetUserId: id,
          targetWallet: existingUser.walletAddress,
          targetDisplayName: existingUser.displayName,
          ...(body.banReason ? { banReason: body.banReason } : {}),
        } as Prisma.InputJsonValue,
      },
    });

    return apiResponse({ user: updatedUser });
  } catch (error) {
    return handleApiError(error);
  }
}
