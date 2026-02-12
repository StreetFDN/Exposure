// =============================================================================
// POST /api/deals/[id]/contribute — Record a contribution to a deal
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import {
  apiResponse,
  apiError,
  handleApiError,
  requireAuth,
  validateBody,
} from "@/lib/utils/api";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Contribution body schema
// ---------------------------------------------------------------------------

const contributeSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.enum(["USDC", "USDT", "ETH", "DAI", "WETH"]),
  txHash: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
  chain: z.enum(["ETHEREUM", "ARBITRUM", "BASE"]),
});

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
    const body = await validateBody(request, contributeSchema);

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

    // 1. Deal must be in a contribution-accepting phase
    const contributionStatuses = ["GUARANTEED_ALLOCATION", "FCFS"];
    if (!contributionStatuses.includes(deal.status)) {
      return apiError(
        "Deal is not currently accepting contributions",
        400,
        "DEAL_NOT_OPEN"
      );
    }

    // 2. Check contribution window
    const now = new Date();
    if (deal.contributionOpenAt && new Date(deal.contributionOpenAt) > now) {
      return apiError("Contribution period has not started yet", 400, "TOO_EARLY");
    }
    if (deal.contributionCloseAt && new Date(deal.contributionCloseAt) < now) {
      return apiError("Contribution period has ended", 400, "TOO_LATE");
    }

    // 3. KYC check
    if (deal.requiresKyc && user.kycStatus !== "APPROVED") {
      return apiError(
        "KYC verification required to contribute to this deal",
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
        `Minimum tier of ${deal.minTierRequired} required to contribute`,
        403,
        "TIER_INSUFFICIENT"
      );
    }

    // 5. Amount within limits
    const minContrib = Number(deal.minContribution);
    const maxContrib = Number(deal.maxContribution);
    const raiseTokenSymbol = deal.raiseTokenSymbol || "USDC";

    if (minContrib > 0 && body.amount < minContrib) {
      return apiError(
        `Minimum contribution is ${minContrib} ${raiseTokenSymbol}`,
        400,
        "BELOW_MINIMUM"
      );
    }

    if (maxContrib > 0 && body.amount > maxContrib) {
      return apiError(
        `Maximum contribution is ${maxContrib} ${raiseTokenSymbol}`,
        400,
        "ABOVE_MAXIMUM"
      );
    }

    // 6. Hard cap check
    const hardCap = Number(deal.hardCap);
    const totalRaised = Number(deal.totalRaised);

    if (totalRaised + body.amount > hardCap) {
      const remaining = hardCap - totalRaised;
      return apiError(
        `Contribution would exceed hard cap. Maximum remaining: ${remaining} ${raiseTokenSymbol}`,
        400,
        "EXCEEDS_HARD_CAP",
        { remaining }
      );
    }

    // Use a transaction to atomically create contribution + update deal totals
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create the contribution record
        const contribution = await tx.contribution.create({
          data: {
            userId: user.id,
            dealId: deal.id,
            amount: body.amount,
            amountUsd: body.amount, // TODO: Convert using price oracle for non-stablecoin currencies
            currency: body.currency,
            txHash: body.txHash,
            chain: body.chain,
            status: "PENDING", // Will be confirmed after on-chain verification
          },
        });

        // Increment deal's totalRaised and contributorCount
        // Only increment contributor count if this is the user's first contribution to this deal
        const existingContribCount = await tx.contribution.count({
          where: {
            userId: user.id,
            dealId: deal.id,
            id: { not: contribution.id },
          },
        });

        await tx.deal.update({
          where: { id: deal.id },
          data: {
            totalRaised: { increment: body.amount },
            contributorCount:
              existingContribCount === 0 ? { increment: 1 } : undefined,
          },
        });

        return contribution;
      });

      return apiResponse({ contribution: result }, 201);
    } catch (error) {
      // Handle unique constraint violation on txHash
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return apiError(
          "A contribution with this transaction hash already exists",
          409,
          "DUPLICATE_TX_HASH"
        );
      }
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
