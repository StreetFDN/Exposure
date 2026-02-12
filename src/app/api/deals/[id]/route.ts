// =============================================================================
// /api/deals/[id] — Single deal CRUD (GET, PUT, DELETE)
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import {
  apiResponse,
  apiError,
  handleApiError,
  requireAdmin,
  validateBody,
} from "@/lib/utils/api";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Helper: Find deal by ID or slug
// ---------------------------------------------------------------------------

async function findDealByIdOrSlug(idOrSlug: string) {
  // Try by ID first (UUID format), then fall back to slug
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug
    );

  if (isUuid) {
    return prisma.deal.findUnique({ where: { id: idOrSlug } });
  }

  return prisma.deal.findUnique({ where: { slug: idOrSlug } });
}

// ---------------------------------------------------------------------------
// Update Deal Schema
// ---------------------------------------------------------------------------

const updateDealSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  shortDescription: z.string().max(500).optional(),
  description: z.string().min(10).optional(),
  status: z
    .enum([
      "DRAFT",
      "UNDER_REVIEW",
      "APPROVED",
      "REGISTRATION_OPEN",
      "GUARANTEED_ALLOCATION",
      "FCFS",
      "SETTLEMENT",
      "DISTRIBUTING",
      "COMPLETED",
      "CANCELLED",
    ])
    .optional(),
  category: z
    .enum(["DEFI", "INFRASTRUCTURE", "GAMING", "AI", "NFT", "SOCIAL", "OTHER"])
    .optional(),
  tokenPrice: z.string().regex(/^\d+\.?\d*$/).optional(),
  totalRaise: z.string().regex(/^\d+\.?\d*$/).optional(),
  hardCap: z.string().regex(/^\d+\.?\d*$/).optional(),
  softCap: z.string().regex(/^\d+\.?\d*$/).nullable().optional(),
  minTierRequired: z
    .enum(["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"])
    .nullable()
    .optional(),
  registrationOpenAt: z.string().datetime().nullable().optional(),
  registrationCloseAt: z.string().datetime().nullable().optional(),
  contributionOpenAt: z.string().datetime().nullable().optional(),
  contributionCloseAt: z.string().datetime().nullable().optional(),
  isFeatured: z.boolean().optional(),
  requiresKyc: z.boolean().optional(),
  requiresAccreditation: z.boolean().optional(),
  featuredImageUrl: z.string().url().nullable().optional(),
  bannerImageUrl: z.string().url().nullable().optional(),
  projectWebsite: z.string().url().optional(),
  projectTwitter: z.string().url().optional(),
  projectDiscord: z.string().url().nullable().optional(),
  minContribution: z.string().regex(/^\d+\.?\d*$/).optional(),
  maxContribution: z.string().regex(/^\d+\.?\d*$/).optional(),
});

// ---------------------------------------------------------------------------
// GET handler — Single deal by ID or slug
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find deal by ID or slug, include related data
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id
      );

    const deal = await prisma.deal.findUnique({
      where: isUuid ? { id } : { slug: id },
      include: {
        dealPhases: {
          orderBy: { phaseOrder: "asc" },
        },
        allocations: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!deal) {
      return apiError("Deal not found", 404, "NOT_FOUND");
    }

    // Get contribution stats via aggregate
    const contributionStats = await prisma.contribution.aggregate({
      where: { dealId: deal.id, status: "CONFIRMED" },
      _sum: { amountUsd: true },
      _count: { id: true },
      _avg: { amountUsd: true },
    });

    const dealWithStats = {
      ...deal,
      phases: deal.dealPhases,
      contributionStats: {
        totalContributed: deal.totalRaised,
        totalContributors: deal.contributorCount,
        averageContribution: contributionStats._avg.amountUsd ?? "0",
        percentRaised:
          Number(deal.hardCap) > 0
            ? Number(
                ((Number(deal.totalRaised) / Number(deal.hardCap)) * 100).toFixed(2)
              )
            : 0,
      },
    };

    // Remove the raw dealPhases key (we mapped it to phases)
    const { dealPhases: _dealPhases, allocations: _allocations, ...rest } = dealWithStats;

    return apiResponse({ deal: { ...rest, allocationCount: deal.allocations.length } });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// PUT handler — Update deal (admin only)
// ---------------------------------------------------------------------------

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = await validateBody(request, updateDealSchema);

    // Verify deal exists
    const existing = await findDealByIdOrSlug(id);
    if (!existing) {
      return apiError("Deal not found", 404, "NOT_FOUND");
    }

    // Build the update data, converting date strings to Date objects
    const updateData: Prisma.DealUpdateInput = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.shortDescription !== undefined) updateData.shortDescription = body.shortDescription;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.tokenPrice !== undefined) updateData.tokenPrice = body.tokenPrice;
    if (body.totalRaise !== undefined) updateData.totalRaise = body.totalRaise;
    if (body.hardCap !== undefined) updateData.hardCap = body.hardCap;
    if (body.softCap !== undefined) updateData.softCap = body.softCap;
    if (body.minTierRequired !== undefined) updateData.minTierRequired = body.minTierRequired;
    if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured;
    if (body.requiresKyc !== undefined) updateData.requiresKyc = body.requiresKyc;
    if (body.requiresAccreditation !== undefined) updateData.requiresAccreditation = body.requiresAccreditation;
    if (body.featuredImageUrl !== undefined) updateData.featuredImageUrl = body.featuredImageUrl;
    if (body.bannerImageUrl !== undefined) updateData.bannerImageUrl = body.bannerImageUrl;
    if (body.projectWebsite !== undefined) updateData.projectWebsite = body.projectWebsite;
    if (body.projectTwitter !== undefined) updateData.projectTwitter = body.projectTwitter;
    if (body.projectDiscord !== undefined) updateData.projectDiscord = body.projectDiscord;
    if (body.minContribution !== undefined) updateData.minContribution = body.minContribution;
    if (body.maxContribution !== undefined) updateData.maxContribution = body.maxContribution;
    if (body.registrationOpenAt !== undefined) {
      updateData.registrationOpenAt = body.registrationOpenAt
        ? new Date(body.registrationOpenAt)
        : null;
    }
    if (body.registrationCloseAt !== undefined) {
      updateData.registrationCloseAt = body.registrationCloseAt
        ? new Date(body.registrationCloseAt)
        : null;
    }
    if (body.contributionOpenAt !== undefined) {
      updateData.contributionOpenAt = body.contributionOpenAt
        ? new Date(body.contributionOpenAt)
        : null;
    }
    if (body.contributionCloseAt !== undefined) {
      updateData.contributionCloseAt = body.contributionCloseAt
        ? new Date(body.contributionCloseAt)
        : null;
    }

    try {
      const updatedDeal = await prisma.deal.update({
        where: { id: existing.id },
        data: updateData,
      });

      return apiResponse({ deal: updatedDeal });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return apiError("Deal not found", 404, "NOT_FOUND");
      }
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// DELETE handler — Soft-delete / cancel deal (admin only)
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    // Verify deal exists
    const existing = await findDealByIdOrSlug(id);
    if (!existing) {
      return apiError("Deal not found", 404, "NOT_FOUND");
    }

    // Prevent deleting deals that have already received contributions
    if (
      Number(existing.totalRaised) > 0 &&
      existing.status !== "CANCELLED"
    ) {
      return apiError(
        "Cannot delete a deal with existing contributions. Cancel it instead.",
        409,
        "CONFLICT"
      );
    }

    // Soft-delete by setting status to CANCELLED
    try {
      const cancelledDeal = await prisma.deal.update({
        where: { id: existing.id },
        data: {
          status: "CANCELLED",
        },
      });

      return apiResponse({ deal: cancelledDeal });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return apiError("Deal not found", 404, "NOT_FOUND");
      }
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
