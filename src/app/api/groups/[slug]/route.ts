// =============================================================================
// /api/groups/[slug] — Group detail (GET), update (PUT), close (DELETE)
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import {
  apiResponse,
  apiError,
  handleApiError,
  requireAuth,
  requireAdmin,
  getSession,
  validateBody,
  ApiError,
} from "@/lib/utils/api";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Update Group Validation Schema
// ---------------------------------------------------------------------------

const updateGroupSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().min(10).max(5000).optional(),
  isPublic: z.boolean().optional(),
  maxMembers: z.number().int().min(2).max(1000).optional(),
  minTierRequired: z
    .enum(["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"])
    .nullable()
    .optional(),
  requiresApplication: z.boolean().optional(),
  carryPercent: z
    .string()
    .regex(/^\d+\.?\d*$/, "Must be a valid decimal number")
    .optional(),
  avatarUrl: z.string().url().nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
});

// ---------------------------------------------------------------------------
// GET handler — Group detail by slug
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const group = await prisma.investmentGroup.findUnique({
      where: { slug },
      include: {
        lead: {
          select: {
            id: true,
            walletAddress: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                walletAddress: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        dealAllocations: {
          include: {
            deal: {
              select: {
                id: true,
                title: true,
                slug: true,
                status: true,
                category: true,
                tokenPrice: true,
                totalRaise: true,
                totalRaised: true,
                hardCap: true,
                featuredImageUrl: true,
              },
            },
          },
          orderBy: { presentedAt: "desc" },
        },
      },
    });

    if (!group) {
      return apiError("Group not found", 404);
    }

    return apiResponse(group);
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// PUT handler — Update group (lead only)
// ---------------------------------------------------------------------------

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const user = await requireAuth(request);
    const body = await validateBody(request, updateGroupSchema);

    // Find the group
    const group = await prisma.investmentGroup.findUnique({
      where: { slug },
      select: { id: true, leadId: true },
    });

    if (!group) {
      return apiError("Group not found", 404);
    }

    // Only the lead can update
    if (group.leadId !== user.id && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      throw new ApiError("Only the group lead can update this group", 403);
    }

    const updatedGroup = await prisma.investmentGroup.update({
      where: { id: group.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
        ...(body.maxMembers !== undefined && { maxMembers: body.maxMembers }),
        ...(body.minTierRequired !== undefined && {
          minTierRequired: body.minTierRequired ?? undefined,
        }),
        ...(body.requiresApplication !== undefined && {
          requiresApplication: body.requiresApplication,
        }),
        ...(body.carryPercent !== undefined && { carryPercent: body.carryPercent }),
        ...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl }),
        ...(body.bannerUrl !== undefined && { bannerUrl: body.bannerUrl }),
      },
    });

    return apiResponse(updatedGroup);
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// DELETE handler — Close group (lead or admin)
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const user = await requireAuth(request);

    // Find the group
    const group = await prisma.investmentGroup.findUnique({
      where: { slug },
      select: { id: true, leadId: true, status: true },
    });

    if (!group) {
      return apiError("Group not found", 404);
    }

    // Only the lead or admin can close
    if (group.leadId !== user.id && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      throw new ApiError("Only the group lead or admin can close this group", 403);
    }

    if (group.status === "CLOSED") {
      return apiError("Group is already closed", 400);
    }

    const closedGroup = await prisma.investmentGroup.update({
      where: { id: group.id },
      data: {
        status: "CLOSED",
      },
    });

    return apiResponse(closedGroup);
  } catch (error) {
    return handleApiError(error);
  }
}
