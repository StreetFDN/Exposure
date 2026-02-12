// =============================================================================
// GET /api/deals/[id]/allocations — Get user's allocation for a deal
// =============================================================================

import { NextRequest } from "next/server";
import {
  apiResponse,
  handleApiError,
  requireAuth,
} from "@/lib/utils/api";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id: dealId } = await params;

    // Resolve the actual deal ID (the param could be a slug)
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        dealId
      );

    let resolvedDealId = dealId;
    if (!isUuid) {
      const deal = await prisma.deal.findUnique({
        where: { slug: dealId },
        select: { id: true },
      });
      if (!deal) {
        return apiResponse({
          allocation: null,
          message: "Deal not found.",
        });
      }
      resolvedDealId = deal.id;
    }

    // Query by unique composite key userId_dealId
    const allocation = await prisma.allocation.findUnique({
      where: {
        userId_dealId: {
          userId: user.id,
          dealId: resolvedDealId,
        },
      },
    });

    if (!allocation) {
      return apiResponse({
        allocation: null,
        message: "No allocation found. You may not be registered for this deal.",
      });
    }

    return apiResponse({
      allocation: {
        guaranteed: allocation.guaranteedAmount,
        requested: allocation.requestedAmount,
        final: allocation.finalAmount,
        method: allocation.allocationMethod,
        isFinalized: allocation.isFinalized,
        lotteryTickets: allocation.lotteryTickets,
        lotteryWon: allocation.lotteryWon,
        finalizedAt: allocation.finalizedAt
          ? allocation.finalizedAt.toISOString()
          : null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
