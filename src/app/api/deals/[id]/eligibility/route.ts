// =============================================================================
// /api/deals/[id]/eligibility -- Check User Eligibility (GET)
// Returns whether the authenticated user is eligible to contribute to a deal.
// =============================================================================

import { NextRequest } from "next/server";
import {
  apiResponse,
  apiError,
  handleApiError,
  requireAuth,
} from "@/lib/utils/api";
import { checkEligibility } from "@/lib/services/eligibility-checker";
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
// GET -- Check eligibility for the authenticated user
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const dealId = await resolveDealId(id);
    if (!dealId) {
      return apiError("Deal not found", 404, "NOT_FOUND");
    }

    // Parse optional amount query param for limit checking
    const { searchParams } = new URL(request.url);
    const amountParam = searchParams.get("amount");
    const amount = amountParam ? parseFloat(amountParam) : undefined;

    if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) {
      return apiError(
        "Amount must be a positive number",
        400,
        "VALIDATION_ERROR"
      );
    }

    const result = await checkEligibility(user.id, dealId, amount);

    return apiResponse({
      eligible: result.eligible,
      checks: result.checks.map((check) => ({
        name: check.name,
        passed: check.passed,
        reason: check.reason ?? null,
      })),
      failedChecks: result.failedChecks.map((check) => ({
        name: check.name,
        passed: check.passed,
        reason: check.reason ?? null,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
