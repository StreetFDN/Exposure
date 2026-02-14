// =============================================================================
// GET /api/admin/audit-logs — List audit log entries (admin only)
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
// GET handler — List audit logs with filters (admin only)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    // Parse filters
    const action = searchParams.get("action");
    const resourceType = searchParams.get("resourceType");
    const userId = searchParams.get("userId");
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {};

    if (action) {
      where.action = { contains: action, mode: "insensitive" };
    }

    if (resourceType) {
      where.resourceType = { equals: resourceType, mode: "insensitive" };
    }

    if (userId) {
      where.userId = userId;
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { resourceType: { contains: search, mode: "insensitive" } },
        { resourceId: { contains: search, mode: "insensitive" } },
        {
          user: {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { displayName: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Execute queries in parallel
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              walletAddress: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return apiResponse({
      logs,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
