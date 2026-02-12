// =============================================================================
// GET /api/contributions — User's contribution history
// =============================================================================

import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import {
  apiResponse,
  handleApiError,
  requireAuth,
  parsePagination,
} from "@/lib/utils/api";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    // Parse filters
    const dealId = searchParams.get("dealId");
    const status = searchParams.get("status");

    // Build where clause
    const where: Prisma.ContributionWhereInput = {
      userId: user.id,
    };

    if (dealId) {
      where.dealId = dealId;
    }

    if (status) {
      const statuses = status.split(",");
      where.status = {
        in: statuses as Prisma.EnumContributionStatusFilter["in"],
      };
    }

    // Execute count + find in parallel
    const [total, contributions] = await Promise.all([
      prisma.contribution.count({ where }),
      prisma.contribution.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        include: {
          deal: {
            select: {
              id: true,
              title: true,
              slug: true,
              projectName: true,
              featuredImageUrl: true,
              status: true,
              category: true,
              chain: true,
              tokenPrice: true,
              distributionTokenSymbol: true,
              raiseTokenSymbol: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return apiResponse({
      contributions,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
