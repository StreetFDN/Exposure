// =============================================================================
// POST /api/deals/[id]/register — Register interest in a deal
// =============================================================================

import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import {
  apiResponse,
  apiError,
  handleApiError,
  requireAuth,
} from "@/lib/utils/api";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Tier hierarchy for comparison
// ---------------------------------------------------------------------------

const TIER_LEVELS: Record<string, number> = {
  NONE: 0,
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
  PLATINUM: 4,
  DIAMOND: 5,
};

// Guaranteed allocation amounts by tier (in raise token, e.g., USDC)
const TIER_GUARANTEED_ALLOCATION: Record<string, number> = {
  NONE: 0,
  BRONZE: 500,
  SILVER: 2000,
  GOLD: 5000,
  PLATINUM: 15000,
  DIAMOND: 50000,
};

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id: dealId } = await params;

    // Find deal by ID or slug
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        dealId
      );

    const deal = await prisma.deal.findUnique({
      where: isUuid ? { id: dealId } : { slug: dealId },
    });

    if (!deal) {
      return apiError("Deal not found", 404, "NOT_FOUND");
    }

    // --- Validation checks ---

    // 1. Deal must be in registration phase
    if (deal.status !== "REGISTRATION_OPEN") {
      return apiError(
        "Deal is not currently accepting registrations",
        400,
        "REGISTRATION_CLOSED"
      );
    }

    // 2. Check registration window
    const now = new Date();
    if (deal.registrationOpenAt && new Date(deal.registrationOpenAt) > now) {
      return apiError("Registration period has not started yet", 400, "TOO_EARLY");
    }
    if (deal.registrationCloseAt && new Date(deal.registrationCloseAt) < now) {
      return apiError("Registration period has ended", 400, "TOO_LATE");
    }

    // 3. KYC check
    if (deal.requiresKyc && user.kycStatus !== "APPROVED") {
      return apiError(
        "KYC verification required to register for this deal",
        403,
        "KYC_REQUIRED"
      );
    }

    // 4. Tier check
    if (
      deal.minTierRequired &&
      TIER_LEVELS[user.tierLevel] < TIER_LEVELS[deal.minTierRequired]
    ) {
      return apiError(
        `Minimum tier of ${deal.minTierRequired} required to register`,
        403,
        "TIER_INSUFFICIENT"
      );
    }

    // Calculate guaranteed allocation based on tier and allocation method
    const guaranteedAmount = TIER_GUARANTEED_ALLOCATION[user.tierLevel] || 0;
    const allocationMethod =
      deal.allocationMethod === "LOTTERY" ? "LOTTERY" : "GUARANTEED";

    // Create allocation record (this serves as the registration)
    try {
      const allocation = await prisma.allocation.create({
        data: {
          userId: user.id,
          dealId: deal.id,
          guaranteedAmount: guaranteedAmount,
          requestedAmount: 0,
          finalAmount: 0,
          allocationMethod: allocationMethod,
          lotteryTickets: allocationMethod === "LOTTERY" ? TIER_LEVELS[user.tierLevel] || 1 : 0,
          isFinalized: false,
        },
      });

      return apiResponse({
        registered: true,
        registration: {
          id: allocation.id,
          userId: allocation.userId,
          dealId: allocation.dealId,
          registeredAt: allocation.createdAt.toISOString(),
        },
        allocation: {
          guaranteed: guaranteedAmount,
          method: allocationMethod,
          tier: user.tierLevel,
          message:
            allocationMethod === "LOTTERY"
              ? `You are entered into the lottery. Higher tiers receive more lottery tickets.`
              : `Your guaranteed allocation is ${guaranteedAmount} USDC based on your ${user.tierLevel} tier.`,
        },
      });
    } catch (error) {
      // Handle unique constraint violation (user already registered)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return apiError(
          "You are already registered for this deal",
          409,
          "ALREADY_REGISTERED"
        );
      }
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
