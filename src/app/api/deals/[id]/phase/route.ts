// =============================================================================
// /api/deals/[id]/phase -- Deal Phase Management (GET, POST)
// GET:  Returns current phase info for a deal.
// POST: Triggers a phase transition (admin only).
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import {
  apiResponse,
  apiError,
  handleApiError,
  requireAdmin,
  validateBody,
  getSession,
} from "@/lib/utils/api";
import {
  getDealCurrentPhase,
  openRegistration,
  closeRegistration,
  openContributions,
  closeContributions,
  startDistribution,
  completeDeal,
  cancelDeal,
} from "@/lib/services/deal-lifecycle";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a deal ID or slug to a canonical UUID.
 */
async function resolveDealId(idOrSlug: string): Promise<string | null> {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug
    );

  if (isUuid) {
    const deal = await prisma.deal.findUnique({
      where: { id: idOrSlug },
      select: { id: true },
    });
    return deal?.id ?? null;
  }

  const deal = await prisma.deal.findUnique({
    where: { slug: idOrSlug },
    select: { id: true },
  });
  return deal?.id ?? null;
}

// ---------------------------------------------------------------------------
// POST body schema
// ---------------------------------------------------------------------------

const phaseActionSchema = z.object({
  action: z.enum([
    "open_registration",
    "close_registration",
    "open_contributions",
    "close_contributions",
    "start_distribution",
    "complete",
    "cancel",
  ]),
});

// ---------------------------------------------------------------------------
// GET -- Returns current phase info
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Phase info is readable by any authenticated user
    const session = await getSession(request);
    if (!session) {
      return apiError("Authentication required", 401, "UNAUTHORIZED");
    }

    const { id } = await params;
    const dealId = await resolveDealId(id);

    if (!dealId) {
      return apiError("Deal not found", 404, "NOT_FOUND");
    }

    const phaseInfo = await getDealCurrentPhase(dealId);

    return apiResponse({
      dealId: phaseInfo.dealId,
      status: phaseInfo.status,
      currentPhase: phaseInfo.currentPhase
        ? {
            id: phaseInfo.currentPhase.id,
            name: phaseInfo.currentPhase.phaseName,
            order: phaseInfo.currentPhase.phaseOrder,
            startsAt: phaseInfo.currentPhase.startsAt.toISOString(),
            endsAt: phaseInfo.currentPhase.endsAt.toISOString(),
            isActive: phaseInfo.currentPhase.isActive,
          }
        : null,
      nextPhase: phaseInfo.nextPhase
        ? {
            id: phaseInfo.nextPhase.id,
            name: phaseInfo.nextPhase.phaseName,
            order: phaseInfo.nextPhase.phaseOrder,
            startsAt: phaseInfo.nextPhase.startsAt.toISOString(),
            endsAt: phaseInfo.nextPhase.endsAt.toISOString(),
          }
        : null,
      phases: phaseInfo.phases.map((p) => ({
        id: p.id,
        name: p.phaseName,
        order: p.phaseOrder,
        startsAt: p.startsAt.toISOString(),
        endsAt: p.endsAt.toISOString(),
        isActive: p.isActive,
      })),
      isWithinRegistrationWindow: phaseInfo.isWithinRegistrationWindow,
      isWithinContributionWindow: phaseInfo.isWithinContributionWindow,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// POST -- Trigger a phase transition (admin only)
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const body = await validateBody(request, phaseActionSchema);

    const dealId = await resolveDealId(id);
    if (!dealId) {
      return apiError("Deal not found", 404, "NOT_FOUND");
    }

    // Map action to lifecycle function
    let result;
    switch (body.action) {
      case "open_registration":
        result = await openRegistration(dealId, admin.id);
        break;
      case "close_registration":
        result = await closeRegistration(dealId, admin.id);
        break;
      case "open_contributions":
        result = await openContributions(dealId, admin.id);
        break;
      case "close_contributions":
        result = await closeContributions(dealId, admin.id);
        break;
      case "start_distribution":
        result = await startDistribution(dealId, admin.id);
        break;
      case "complete":
        result = await completeDeal(dealId, admin.id);
        break;
      case "cancel":
        result = await cancelDeal(dealId, admin.id);
        break;
    }

    return apiResponse({
      success: result.success,
      previousStatus: result.previousStatus,
      newStatus: result.newStatus,
      message: result.message,
      deal: {
        id: result.deal.id,
        title: result.deal.title,
        slug: result.deal.slug,
        status: result.deal.status,
      },
    });
  } catch (error) {
    // Convert lifecycle Error messages into proper API error responses
    if (error instanceof Error && error.message.startsWith("Cannot ")) {
      return apiError(error.message, 400, "INVALID_TRANSITION");
    }
    if (error instanceof Error && error.message.includes("not found")) {
      return apiError(error.message, 404, "NOT_FOUND");
    }
    return handleApiError(error);
  }
}
