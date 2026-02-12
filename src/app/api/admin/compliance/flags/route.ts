// =============================================================================
// /api/admin/compliance/flags — List and create compliance flags
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  apiResponse,
  apiError,
  handleApiError,
  requireAdmin,
  validateBody,
  parsePagination,
} from "@/lib/utils/api";

// ---------------------------------------------------------------------------
// Create flag schema
// ---------------------------------------------------------------------------

const createFlagSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  dealId: z.string().nullable().optional(),
  contributionId: z.string().nullable().optional(),
  reason: z.enum([
    "LARGE_CONTRIBUTION",
    "CUMULATIVE_THRESHOLD",
    "NEW_WALLET",
    "RAPID_ACTIVITY",
    "MIXER_EXPOSURE",
    "SANCTIONS_MATCH",
  ]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  description: z.string().min(10).max(5000),
});

// ---------------------------------------------------------------------------
// GET handler — List compliance flags (admin only)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    // Parse filters
    const severity = searchParams.get("severity");
    const isResolvedParam = searchParams.get("isResolved");

    // Build where clause
    const where: Prisma.ComplianceFlagWhereInput = {};

    if (severity) {
      const severities = severity.split(",");
      where.severity = { in: severities };
    }

    if (isResolvedParam !== null) {
      where.isResolved = isResolvedParam === "true";
    }

    // Execute queries in parallel
    const [flags, total, allTotal, unresolvedCount, severityCounts] =
      await Promise.all([
        prisma.complianceFlag.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                walletAddress: true,
                displayName: true,
              },
            },
            deal: {
              select: {
                id: true,
                title: true,
              },
            },
            contribution: {
              select: {
                id: true,
                txHash: true,
                amountUsd: true,
              },
            },
          },
        }),
        prisma.complianceFlag.count({ where }),
        prisma.complianceFlag.count(),
        prisma.complianceFlag.count({ where: { isResolved: false } }),
        prisma.complianceFlag.groupBy({
          by: ["severity"],
          _count: true,
          where: { isResolved: false },
        }),
      ]);

    const totalPages = Math.ceil(total / limit);

    // Build severity summary
    const bySeverity: Record<string, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };
    for (const group of severityCounts) {
      bySeverity[group.severity] = group._count;
    }

    const summary = {
      total: allTotal,
      unresolved: unresolvedCount,
      bySeverity,
    };

    return apiResponse({
      flags,
      summary,
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
// POST handler — Create a new compliance flag (admin only)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const body = await validateBody(request, createFlagSchema);

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: body.userId },
    });
    if (!user) {
      return apiError("User not found", 404, "NOT_FOUND");
    }

    // Create the flag
    const flag = await prisma.complianceFlag.create({
      data: {
        userId: body.userId,
        dealId: body.dealId ?? null,
        contributionId: body.contributionId ?? null,
        reason: body.reason,
        severity: body.severity,
        description: body.description,
        isResolved: false,
      },
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true,
            displayName: true,
          },
        },
      },
    });

    // Create audit log for the flag creation
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "COMPLIANCE_FLAG_CREATED",
        resourceType: "ComplianceFlag",
        resourceId: flag.id,
        metadata: {
          reason: body.reason,
          severity: body.severity,
          targetUserId: body.userId,
        },
      },
    });

    return apiResponse({ flag }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
