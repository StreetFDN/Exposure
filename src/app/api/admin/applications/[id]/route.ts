// =============================================================================
// /api/admin/applications/[id] — Single application (GET, PATCH)
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
// Patch application schema
// ---------------------------------------------------------------------------

const patchApplicationSchema = z.object({
  status: z
    .enum([
      "SUBMITTED",
      "UNDER_REVIEW",
      "DUE_DILIGENCE",
      "APPROVED",
      "REJECTED",
      "CHANGES_REQUESTED",
    ])
    .optional(),
  internalScore: z.number().min(0).max(100).nullable().optional(),
  internalNotes: z.string().max(5000).nullable().optional(),
  rejectionReason: z.string().max(2000).nullable().optional(),
});

// ---------------------------------------------------------------------------
// GET handler — Single application detail (admin only)
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const application = await prisma.projectApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return apiError("Application not found", 404, "NOT_FOUND");
    }

    return apiResponse({ application });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// PATCH handler — Update application status, score, notes (admin only)
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const body = await validateBody(request, patchApplicationSchema);

    // Check application exists
    const existing = await prisma.projectApplication.findUnique({
      where: { id },
    });
    if (!existing) {
      return apiError("Application not found", 404, "NOT_FOUND");
    }

    // Validate: rejection requires a reason
    if (body.status === "REJECTED" && !body.rejectionReason) {
      return apiError(
        "Rejection reason is required when rejecting an application",
        422,
        "VALIDATION_ERROR"
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) {
      updateData.status = body.status;
      updateData.reviewedById = admin.id;
      updateData.reviewedAt = new Date();
    }
    if (body.internalScore !== undefined) {
      updateData.internalScore = body.internalScore;
    }
    if (body.internalNotes !== undefined) {
      updateData.internalNotes = body.internalNotes;
    }
    if (body.rejectionReason !== undefined) {
      updateData.rejectionReason = body.rejectionReason;
    }

    const application = await prisma.projectApplication.update({
      where: { id },
      data: updateData,
    });

    return apiResponse({ application });
  } catch (error) {
    return handleApiError(error);
  }
}
