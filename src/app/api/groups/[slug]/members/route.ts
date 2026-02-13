// =============================================================================
// /api/groups/[slug]/members — List members (GET), approve/reject (PATCH)
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import {
  apiResponse,
  apiError,
  handleApiError,
  requireAuth,
  validateBody,
  parsePagination,
  ApiError,
} from "@/lib/utils/api";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// PATCH schema — approve or reject a member application
// ---------------------------------------------------------------------------

const updateMemberSchema = z.object({
  memberId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
});

// ---------------------------------------------------------------------------
// GET handler — List group members
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    // Find the group
    const group = await prisma.investmentGroup.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!group) {
      return apiError("Group not found", 404);
    }

    // Parse optional status filter
    const statusFilter = searchParams.get("status");

    const where: Prisma.GroupMembershipWhereInput = {
      groupId: group.id,
      ...(statusFilter ? { status: statusFilter as Prisma.GroupMembershipWhereInput["status"] } : {}),
    };

    const [total, members] = await Promise.all([
      prisma.groupMembership.count({ where }),
      prisma.groupMembership.findMany({
        where,
        orderBy: { createdAt: "asc" },
        skip: offset,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              walletAddress: true,
              displayName: true,
              avatarUrl: true,
              tierLevel: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return apiResponse({
      members,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// PATCH handler — Approve/reject pending applications (lead only)
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const user = await requireAuth(request);
    const body = await validateBody(request, updateMemberSchema);

    // Find the group
    const group = await prisma.investmentGroup.findUnique({
      where: { slug },
      select: { id: true, leadId: true },
    });

    if (!group) {
      return apiError("Group not found", 404);
    }

    // Only the lead (or admin) can approve/reject
    if (group.leadId !== user.id && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      throw new ApiError(
        "Only the group lead can manage member applications",
        403
      );
    }

    // Find the membership
    const membership = await prisma.groupMembership.findUnique({
      where: { id: body.memberId },
    });

    if (!membership) {
      return apiError("Membership not found", 404);
    }

    if (membership.groupId !== group.id) {
      return apiError("Membership does not belong to this group", 400);
    }

    if (membership.status !== "PENDING") {
      return apiError(
        `Cannot ${body.action} a membership that is not pending (current status: ${membership.status})`,
        400
      );
    }

    if (body.action === "approve") {
      const updatedMembership = await prisma.groupMembership.update({
        where: { id: body.memberId },
        data: {
          status: "APPROVED",
          joinedAt: new Date(),
        },
      });

      // Increment member count
      await prisma.investmentGroup.update({
        where: { id: group.id },
        data: { memberCount: { increment: 1 } },
      });

      return apiResponse(updatedMembership);
    } else {
      // reject
      const updatedMembership = await prisma.groupMembership.update({
        where: { id: body.memberId },
        data: {
          status: "REJECTED",
        },
      });

      return apiResponse(updatedMembership);
    }
  } catch (error) {
    return handleApiError(error);
  }
}
