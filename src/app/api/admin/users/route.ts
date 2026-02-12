// =============================================================================
// GET /api/admin/users — List users with filters (admin only)
// =============================================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  apiResponse,
  handleApiError,
  requireAdmin,
  parsePagination,
} from "@/lib/utils/api";

// ---------------------------------------------------------------------------
// GET handler — List users (admin only)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    // Parse filters
    const kycStatus = searchParams.get("kycStatus");
    const tierLevel = searchParams.get("tierLevel");
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    if (kycStatus) {
      const statuses = kycStatus.split(",");
      where.kycStatus = { in: statuses as Prisma.EnumKycStatusFilter["in"] };
    }

    if (tierLevel) {
      const tiers = tierLevel.split(",");
      where.tierLevel = { in: tiers as Prisma.EnumTierLevelFilter["in"] };
    }

    if (role) {
      const roles = role.split(",");
      where.role = { in: roles as Prisma.EnumUserRoleFilter["in"] };
    }

    if (search) {
      where.OR = [
        { walletAddress: { contains: search, mode: "insensitive" } },
        { displayName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Execute queries in parallel
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        select: {
          id: true,
          walletAddress: true,
          displayName: true,
          email: true,
          role: true,
          kycStatus: true,
          kycTier: true,
          tierLevel: true,
          totalContributed: true,
          totalPoints: true,
          isBanned: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: {
              wallets: true,
              contributions: true,
              referrals: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return apiResponse({
      users,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
