// =============================================================================
// /api/deals — List deals (GET) and create deals (POST)
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
  parsePagination,
} from "@/lib/utils/api";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Create Deal Validation Schema
// ---------------------------------------------------------------------------

const createDealSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z
    .string()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  shortDescription: z.string().max(500).optional(),
  description: z.string().min(10),
  projectName: z.string().min(1).max(100),
  category: z.enum([
    "DEFI",
    "INFRASTRUCTURE",
    "GAMING",
    "AI",
    "NFT",
    "SOCIAL",
    "OTHER",
  ]),
  chain: z.enum(["ETHEREUM", "ARBITRUM", "BASE"]),
  tokenPrice: z.string().regex(/^\d+\.?\d*$/, "Must be a valid decimal number"),
  totalRaise: z.string().regex(/^\d+\.?\d*$/, "Must be a valid decimal number"),
  hardCap: z.string().regex(/^\d+\.?\d*$/, "Must be a valid decimal number"),
  softCap: z.string().regex(/^\d+\.?\d*$/, "Must be a valid decimal number").optional(),
  minContribution: z.string().regex(/^\d+\.?\d*$/, "Must be a valid decimal number").optional().default("0"),
  maxContribution: z.string().regex(/^\d+\.?\d*$/, "Must be a valid decimal number").optional().default("0"),
  allocationMethod: z.enum(["FCFS", "GUARANTEED", "LOTTERY", "PRO_RATA", "HYBRID"]),
  vestingType: z.enum(["LINEAR", "MONTHLY_CLIFF", "CUSTOM", "TGE_PLUS_LINEAR"]).optional().default("LINEAR"),
  tgeUnlockPercent: z.string().regex(/^\d+\.?\d*$/).optional().default("0"),
  vestingCliffDays: z.number().int().min(0).optional().default(0),
  vestingDurationDays: z.number().int().min(0).optional().default(0),
  minTierRequired: z.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"]).nullable().optional(),
  distributionTokenSymbol: z.string().min(1).max(10).optional(),
  raiseTokenSymbol: z.string().min(1).max(10).optional(),
  registrationOpenAt: z.string().datetime().optional(),
  registrationCloseAt: z.string().datetime().optional(),
  contributionOpenAt: z.string().datetime().optional(),
  contributionCloseAt: z.string().datetime().optional(),
  requiresKyc: z.boolean().optional().default(true),
  requiresAccreditation: z.boolean().optional().default(false),
  projectWebsite: z.string().url().optional(),
  projectTwitter: z.string().url().optional(),
  projectDiscord: z.string().url().nullable().optional(),
  featuredImageUrl: z.string().url().optional(),
  bannerImageUrl: z.string().url().optional(),
  isFeatured: z.boolean().optional().default(false),
});

// ---------------------------------------------------------------------------
// GET handler — List deals with filters
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    // Parse filter params
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const chain = searchParams.get("chain");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    // Build Prisma where clause
    const where: Prisma.DealWhereInput = {};

    if (status) {
      const statuses = status.split(",");
      where.status = { in: statuses as Prisma.EnumDealStatusFilter["in"] };
    }

    if (category) {
      const categories = category.split(",");
      where.category = { in: categories as Prisma.EnumDealCategoryFilter["in"] };
    }

    if (chain) {
      const chains = chain.split(",");
      where.chain = { in: chains as Prisma.EnumChainFilter["in"] };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { projectName: { contains: search, mode: "insensitive" } },
      ];
    }

    // Build orderBy — only allow known sortable fields
    const allowedSortFields: Record<string, string> = {
      createdAt: "createdAt",
      totalRaised: "totalRaised",
      contributorCount: "contributorCount",
      tokenPrice: "tokenPrice",
      hardCap: "hardCap",
      contributionOpenAt: "contributionOpenAt",
    };
    const orderByField = allowedSortFields[sortBy] || "createdAt";
    const orderBy: Prisma.DealOrderByWithRelationInput = {
      [orderByField]: sortOrder,
    };

    // Execute count + find in parallel
    const [total, deals] = await Promise.all([
      prisma.deal.count({ where }),
      prisma.deal.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          projectName: true,
          category: true,
          status: true,
          chain: true,
          tokenPrice: true,
          totalRaise: true,
          totalRaised: true,
          hardCap: true,
          softCap: true,
          contributorCount: true,
          allocationMethod: true,
          minTierRequired: true,
          registrationOpenAt: true,
          contributionOpenAt: true,
          contributionCloseAt: true,
          featuredImageUrl: true,
          bannerImageUrl: true,
          isFeatured: true,
          requiresKyc: true,
          requiresAccreditation: true,
          distributionTokenSymbol: true,
          raiseTokenSymbol: true,
          description: true,
          projectWebsite: true,
          projectTwitter: true,
          projectDiscord: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return apiResponse({
      deals,
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
// POST handler — Create a new deal (admin only)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const body = await validateBody(request, createDealSchema);

    try {
      const newDeal = await prisma.deal.create({
        data: {
          title: body.title,
          slug: body.slug,
          description: body.description,
          shortDescription: body.shortDescription,
          projectName: body.projectName,
          category: body.category,
          chain: body.chain,
          tokenPrice: body.tokenPrice,
          totalRaise: body.totalRaise,
          hardCap: body.hardCap,
          softCap: body.softCap,
          minContribution: body.minContribution,
          maxContribution: body.maxContribution,
          allocationMethod: body.allocationMethod,
          vestingType: body.vestingType,
          tgeUnlockPercent: body.tgeUnlockPercent,
          vestingCliffDays: body.vestingCliffDays,
          vestingDurationDays: body.vestingDurationDays,
          minTierRequired: body.minTierRequired ?? undefined,
          distributionTokenSymbol: body.distributionTokenSymbol,
          raiseTokenSymbol: body.raiseTokenSymbol,
          registrationOpenAt: body.registrationOpenAt
            ? new Date(body.registrationOpenAt)
            : undefined,
          registrationCloseAt: body.registrationCloseAt
            ? new Date(body.registrationCloseAt)
            : undefined,
          contributionOpenAt: body.contributionOpenAt
            ? new Date(body.contributionOpenAt)
            : undefined,
          contributionCloseAt: body.contributionCloseAt
            ? new Date(body.contributionCloseAt)
            : undefined,
          requiresKyc: body.requiresKyc,
          requiresAccreditation: body.requiresAccreditation,
          projectWebsite: body.projectWebsite,
          projectTwitter: body.projectTwitter,
          projectDiscord: body.projectDiscord,
          featuredImageUrl: body.featuredImageUrl,
          bannerImageUrl: body.bannerImageUrl,
          isFeatured: body.isFeatured,
          status: "DRAFT",
          totalRaised: 0,
          contributorCount: 0,
          createdById: admin.id,
        },
      });

      return apiResponse(newDeal, 201);
    } catch (error) {
      // Handle unique constraint violation on slug
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return apiError(
          "A deal with this slug already exists",
          409,
          "CONFLICT"
        );
      }
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
