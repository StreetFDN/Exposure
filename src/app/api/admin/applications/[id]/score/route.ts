// =============================================================================
// /api/admin/applications/[id]/score — Application scoring (GET, PUT)
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
// Schema
// ---------------------------------------------------------------------------

const scoreSchema = z.object({
  teamScore: z
    .number()
    .min(0, "Score must be at least 0")
    .max(10, "Score must be at most 10"),
  productScore: z
    .number()
    .min(0, "Score must be at least 0")
    .max(10, "Score must be at most 10"),
  tokenomicsScore: z
    .number()
    .min(0, "Score must be at least 0")
    .max(10, "Score must be at most 10"),
  tractionScore: z
    .number()
    .min(0, "Score must be at least 0")
    .max(10, "Score must be at most 10"),
  notes: z.string().max(5000, "Notes must be at most 5,000 characters").optional(),
});

// ---------------------------------------------------------------------------
// Weighted scoring configuration
// ---------------------------------------------------------------------------

const SCORE_WEIGHTS = {
  teamScore: 0.30,
  productScore: 0.30,
  tokenomicsScore: 0.20,
  tractionScore: 0.20,
} as const;

function calculateCompositeScore(scores: {
  teamScore: number;
  productScore: number;
  tokenomicsScore: number;
  tractionScore: number;
}): number {
  const composite =
    scores.teamScore * SCORE_WEIGHTS.teamScore +
    scores.productScore * SCORE_WEIGHTS.productScore +
    scores.tokenomicsScore * SCORE_WEIGHTS.tokenomicsScore +
    scores.tractionScore * SCORE_WEIGHTS.tractionScore;

  // Round to 2 decimal places and scale to 0-100 (each sub-score is 0-10)
  return Math.round(composite * 10 * 100) / 100;
}

// ---------------------------------------------------------------------------
// Score metadata key helper
// ---------------------------------------------------------------------------

/**
 * Scores are stored in the ProjectApplication's `internalNotes` (JSON-encoded)
 * alongside the `internalScore` (composite). The detailed breakdown is kept
 * as structured JSON so we avoid schema migration.
 */
interface ApplicationScoreData {
  teamScore: number;
  productScore: number;
  tokenomicsScore: number;
  tractionScore: number;
  compositeScore: number;
  notes?: string;
  scoredBy: string;
  scoredAt: string;
}

function parseScoreData(internalNotes: string | null): ApplicationScoreData | null {
  if (!internalNotes) return null;
  try {
    const parsed = JSON.parse(internalNotes);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "teamScore" in parsed &&
      "productScore" in parsed &&
      "tokenomicsScore" in parsed &&
      "tractionScore" in parsed
    ) {
      return parsed as ApplicationScoreData;
    }
    return null;
  } catch {
    // internalNotes is plain text, not scored JSON
    return null;
  }
}

// ---------------------------------------------------------------------------
// GET handler — Get current scores for an application
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
      select: {
        id: true,
        projectName: true,
        internalScore: true,
        internalNotes: true,
        status: true,
      },
    });

    if (!application) {
      return apiError("Application not found", 404, "NOT_FOUND");
    }

    const scoreData = parseScoreData(application.internalNotes);

    return apiResponse({
      applicationId: application.id,
      projectName: application.projectName,
      status: application.status,
      compositeScore: application.internalScore
        ? Number(application.internalScore)
        : null,
      scores: scoreData
        ? {
            teamScore: scoreData.teamScore,
            productScore: scoreData.productScore,
            tokenomicsScore: scoreData.tokenomicsScore,
            tractionScore: scoreData.tractionScore,
            notes: scoreData.notes || null,
            scoredBy: scoreData.scoredBy,
            scoredAt: scoreData.scoredAt,
          }
        : null,
      weights: SCORE_WEIGHTS,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// PUT handler — Update scores for an application
// ---------------------------------------------------------------------------

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const body = await validateBody(request, scoreSchema);

    // Check application exists
    const application = await prisma.projectApplication.findUnique({
      where: { id },
      select: {
        id: true,
        projectName: true,
        internalScore: true,
        internalNotes: true,
      },
    });

    if (!application) {
      return apiError("Application not found", 404, "NOT_FOUND");
    }

    // Calculate weighted composite score (scaled to 0-100)
    const compositeScore = calculateCompositeScore({
      teamScore: body.teamScore,
      productScore: body.productScore,
      tokenomicsScore: body.tokenomicsScore,
      tractionScore: body.tractionScore,
    });

    // Build the score data payload
    const scoreData: ApplicationScoreData = {
      teamScore: body.teamScore,
      productScore: body.productScore,
      tokenomicsScore: body.tokenomicsScore,
      tractionScore: body.tractionScore,
      compositeScore,
      notes: body.notes,
      scoredBy: admin.id,
      scoredAt: new Date().toISOString(),
    };

    // Capture previous score for audit log
    const previousScore = application.internalScore
      ? Number(application.internalScore)
      : null;

    // Update the application with composite score and detailed breakdown
    const updatedApplication = await prisma.projectApplication.update({
      where: { id },
      data: {
        internalScore: compositeScore,
        internalNotes: JSON.stringify(scoreData),
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    });

    // Log to AuditLog
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "APPLICATION_SCORED",
        resourceType: "ProjectApplication",
        resourceId: id,
        metadata: {
          projectName: application.projectName,
          previousScore,
          newScore: compositeScore,
          teamScore: body.teamScore,
          productScore: body.productScore,
          tokenomicsScore: body.tokenomicsScore,
          tractionScore: body.tractionScore,
          notes: body.notes || null,
        },
      },
    });

    return apiResponse({
      applicationId: updatedApplication.id,
      compositeScore,
      scores: {
        teamScore: body.teamScore,
        productScore: body.productScore,
        tokenomicsScore: body.tokenomicsScore,
        tractionScore: body.tractionScore,
        notes: body.notes || null,
      },
      weights: SCORE_WEIGHTS,
      message: "Application scores updated successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
