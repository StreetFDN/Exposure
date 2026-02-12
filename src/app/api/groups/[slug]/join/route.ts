// =============================================================================
// /api/groups/[slug]/join — Apply to join a group (POST)
// =============================================================================

import { NextRequest } from "next/server";
import {
  apiResponse,
  apiError,
  handleApiError,
  requireAuth,
  ApiError,
} from "@/lib/utils/api";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Tier ordering for comparison
// ---------------------------------------------------------------------------

const TIER_ORDER = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"] as const;

function meetsMinTier(
  userTier: string,
  requiredTier: string | null
): boolean {
  if (!requiredTier) return true;
  const userIdx = TIER_ORDER.indexOf(userTier as (typeof TIER_ORDER)[number]);
  const reqIdx = TIER_ORDER.indexOf(requiredTier as (typeof TIER_ORDER)[number]);
  if (userIdx === -1 || reqIdx === -1) return false;
  return userIdx >= reqIdx;
}

// ---------------------------------------------------------------------------
// POST handler — Apply to join a group
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const user = await requireAuth(request);

    // Find the group
    const group = await prisma.investmentGroup.findUnique({
      where: { slug },
      select: {
        id: true,
        status: true,
        maxMembers: true,
        memberCount: true,
        minTierRequired: true,
        requiresApplication: true,
      },
    });

    if (!group) {
      return apiError("Group not found", 404);
    }

    // Check group is ACTIVE
    if (group.status !== "ACTIVE") {
      throw new ApiError("This group is not currently accepting new members", 400);
    }

    // Check not full
    if (group.memberCount >= group.maxMembers) {
      throw new ApiError("This group is full", 400);
    }

    // Check user meets tier requirement
    if (!meetsMinTier(user.tierLevel, group.minTierRequired)) {
      throw new ApiError(
        `You need at least ${group.minTierRequired} tier to join this group`,
        403
      );
    }

    // Check not already a member
    const existingMembership = await prisma.groupMembership.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      if (existingMembership.status === "PENDING") {
        return apiError("You already have a pending application for this group", 409);
      }
      if (existingMembership.status === "APPROVED") {
        return apiError("You are already a member of this group", 409);
      }
      if (existingMembership.status === "REJECTED") {
        return apiError(
          "Your previous application was rejected. Please contact the group lead.",
          403
        );
      }
      // If LEFT, allow re-application by updating the existing record
      if (existingMembership.status === "LEFT") {
        const updatedMembership = await prisma.groupMembership.update({
          where: { id: existingMembership.id },
          data: {
            status: group.requiresApplication ? "PENDING" : "APPROVED",
            role: "MEMBER",
            leftAt: null,
            joinedAt: group.requiresApplication ? null : new Date(),
          },
        });

        // If no application required, increment member count
        if (!group.requiresApplication) {
          await prisma.investmentGroup.update({
            where: { id: group.id },
            data: { memberCount: { increment: 1 } },
          });
        }

        return apiResponse(updatedMembership, 201);
      }
    }

    // Create new membership
    const membership = await prisma.groupMembership.create({
      data: {
        groupId: group.id,
        userId: user.id,
        role: "MEMBER",
        status: group.requiresApplication ? "PENDING" : "APPROVED",
        joinedAt: group.requiresApplication ? null : new Date(),
      },
    });

    // If no application required, increment member count
    if (!group.requiresApplication) {
      await prisma.investmentGroup.update({
        where: { id: group.id },
        data: { memberCount: { increment: 1 } },
      });
    }

    return apiResponse(membership, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
