// =============================================================================
// /api/groups — List groups (GET) and create groups (POST)
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import {
  apiResponse,
  apiError,
  handleApiError,
  requireAuth,
  getSession,
  validateBody,
  parsePagination,
  setCacheHeaders,
} from "@/lib/utils/api";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Create Group Validation Schema
// ---------------------------------------------------------------------------

const createGroupSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().min(10).max(5000),
  isPublic: z.boolean().optional().default(true),
  maxMembers: z.number().int().min(2).max(1000).optional().default(100),
  minTierRequired: z
    .enum(["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"])
    .nullable()
    .optional(),
  requiresApplication: z.boolean().optional().default(true),
  carryPercent: z
    .string()
    .regex(/^\d+\.?\d*$/, "Must be a valid decimal number")
    .optional()
    .default("20"),
  avatarUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
});

// ---------------------------------------------------------------------------
// GET handler — List groups with filters
// Supports `membership=mine` query param to return only the authenticated
// user's groups (with their role in each).
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    const membership = searchParams.get("membership");

    // -----------------------------------------------------------------
    // Branch: Return the authenticated user's groups
    // -----------------------------------------------------------------
    if (membership === "mine") {
      const user = await getSession(request);
      if (!user) {
        return apiError("Authentication required to view your groups", 401, "UNAUTHORIZED");
      }

      const where: Prisma.GroupMembershipWhereInput = {
        userId: user.id,
        status: { in: ["APPROVED", "PENDING"] },
      };

      const [total, memberships] = await Promise.all([
        prisma.groupMembership.count({ where }),
        prisma.groupMembership.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
          include: {
            group: {
              include: {
                lead: {
                  select: {
                    id: true,
                    walletAddress: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
                _count: {
                  select: {
                    members: {
                      where: { status: "APPROVED" },
                    },
                  },
                },
              },
            },
          },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      // Flatten: return groups with the user's membership role attached
      const groups = memberships.map((m) => ({
        ...m.group,
        membershipRole: m.role,
        membershipStatus: m.status,
        joinedAt: m.joinedAt,
      }));

      return apiResponse({
        groups,
        total,
        page,
        limit,
        totalPages,
      });
    }

    // -----------------------------------------------------------------
    // Default branch: List all groups with filters
    // -----------------------------------------------------------------

    // Parse filter params
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const isPublic = searchParams.get("isPublic");

    // Build Prisma where clause
    const where: Prisma.InvestmentGroupWhereInput = {};

    if (status) {
      const statuses = status.split(",");
      where.status = {
        in: statuses as Prisma.EnumGroupStatusFilter["in"],
      };
    }

    if (isPublic !== null && isPublic !== undefined && isPublic !== "") {
      where.isPublic = isPublic === "true";
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Execute count + find in parallel
    const [total, groups] = await Promise.all([
      prisma.investmentGroup.count({ where }),
      prisma.investmentGroup.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        include: {
          lead: {
            select: {
              id: true,
              walletAddress: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              members: {
                where: { status: "APPROVED" },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const response = apiResponse({
      groups,
      total,
      page,
      limit,
      totalPages,
    });

    // Cache for 60s
    return setCacheHeaders(response, 60);
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// POST handler — Create a new group (authenticated lead)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await validateBody(request, createGroupSchema);

    try {
      const newGroup = await prisma.investmentGroup.create({
        data: {
          name: body.name,
          slug: body.slug,
          description: body.description,
          isPublic: body.isPublic,
          maxMembers: body.maxMembers,
          minTierRequired: body.minTierRequired ?? undefined,
          requiresApplication: body.requiresApplication,
          carryPercent: body.carryPercent,
          avatarUrl: body.avatarUrl,
          bannerUrl: body.bannerUrl,
          leadId: user.id,
          status: "PENDING_APPROVAL",
          totalRaised: 0,
          dealCount: 0,
          memberCount: 1,
        },
      });

      // Automatically add the creator as LEAD member
      await prisma.groupMembership.create({
        data: {
          groupId: newGroup.id,
          userId: user.id,
          role: "LEAD",
          status: "APPROVED",
          joinedAt: new Date(),
        },
      });

      return apiResponse(newGroup, 201);
    } catch (error) {
      // Handle unique constraint violation on slug
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return apiError(
          "A group with this slug already exists",
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
