// =============================================================================
// PATCH /api/admin/compliance/flags/[id] — Resolve a compliance flag
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  apiResponse,
  apiError,
  handleApiError,
  requireAdmin,
  validateBody,
} from "@/lib/utils/api";

// ---------------------------------------------------------------------------
// Resolve flag schema
// ---------------------------------------------------------------------------

const resolveFlagSchema = z.object({
  resolution: z
    .string()
    .min(10, "Resolution must be at least 10 characters")
    .max(5000, "Resolution must be at most 5000 characters"),
});

// ---------------------------------------------------------------------------
// PATCH handler — Resolve a compliance flag (admin only)
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const body = await validateBody(request, resolveFlagSchema);

    // Find the flag
    const flag = await prisma.complianceFlag.findUnique({
      where: { id },
    });

    if (!flag) {
      return apiError("Compliance flag not found", 404, "NOT_FOUND");
    }

    // Check if already resolved
    if (flag.isResolved) {
      return apiError(
        "This flag has already been resolved",
        409,
        "ALREADY_RESOLVED"
      );
    }

    // Update the flag to resolved
    const resolvedFlag = await prisma.complianceFlag.update({
      where: { id },
      data: {
        isResolved: true,
        resolution: body.resolution,
        resolvedById: admin.id,
        resolvedAt: new Date(),
      },
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
      },
    });

    // Create audit log for the resolution
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "COMPLIANCE_FLAG_RESOLVED",
        resourceType: "ComplianceFlag",
        resourceId: id,
        metadata: {
          resolution: body.resolution,
          originalReason: flag.reason,
          originalSeverity: flag.severity,
          targetUserId: flag.userId,
        },
      },
    });

    return apiResponse({ flag: resolvedFlag });
  } catch (error) {
    return handleApiError(error);
  }
}
