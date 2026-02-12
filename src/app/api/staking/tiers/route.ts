// =============================================================================
// GET /api/staking/tiers — Public tier configuration endpoint
// =============================================================================

import { NextRequest } from "next/server";
import { TierLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiResponse, handleApiError } from "@/lib/utils/api";

// ---------------------------------------------------------------------------
// Tier ladder configuration — this is effectively static/config data
// In production it could be stored in DB and cached, but it rarely changes.
// ---------------------------------------------------------------------------

const TIER_LADDER = [
  {
    tierLevel: "NONE" as const,
    displayName: "Unranked",
    stakedAmount: "0",
    lockPeriod: null,
    allocationMultiplier: 0,
    lotteryWeight: 0,
    color: "#6B7280", // gray-500
    benefits: [
      "Access to public deals only",
      "No guaranteed allocation",
      "Basic platform features",
    ],
  },
  {
    tierLevel: "BRONZE" as const,
    displayName: "Bronze",
    stakedAmount: "1000",
    lockPeriod: "ONE_MONTH" as const,
    allocationMultiplier: 1,
    lotteryWeight: 1,
    color: "#CD7F32",
    benefits: [
      "Access to community round deals",
      "1x lottery weight",
      "Basic allocation guarantee ($500 per deal)",
      "Deal notification alerts",
      "Community Discord access",
    ],
  },
  {
    tierLevel: "SILVER" as const,
    displayName: "Silver",
    stakedAmount: "5000",
    lockPeriod: "THREE_MONTHS" as const,
    allocationMultiplier: 2,
    lotteryWeight: 3,
    color: "#C0C0C0",
    benefits: [
      "Everything in Bronze",
      "2x allocation multiplier",
      "3x lottery weight",
      "Guaranteed allocation ($2,000 per deal)",
      "Early access to deal registration (1 hour head start)",
      "Priority customer support",
    ],
  },
  {
    tierLevel: "GOLD" as const,
    displayName: "Gold",
    stakedAmount: "15000",
    lockPeriod: "SIX_MONTHS" as const,
    allocationMultiplier: 4,
    lotteryWeight: 8,
    color: "#FFD700",
    benefits: [
      "Everything in Silver",
      "4x allocation multiplier",
      "8x lottery weight",
      "Guaranteed allocation ($5,000 per deal)",
      "Early access to deal registration (6 hour head start)",
      "Exclusive Gold-tier deals",
      "Monthly staking bonus (0.5%)",
      "Governance voting rights",
    ],
  },
  {
    tierLevel: "PLATINUM" as const,
    displayName: "Platinum",
    stakedAmount: "50000",
    lockPeriod: "TWELVE_MONTHS" as const,
    allocationMultiplier: 8,
    lotteryWeight: 20,
    color: "#E5E4E2",
    benefits: [
      "Everything in Gold",
      "8x allocation multiplier",
      "20x lottery weight",
      "Guaranteed allocation ($15,000 per deal)",
      "24 hour early access to registration",
      "Exclusive Platinum-tier deals and strategic rounds",
      "Monthly staking bonus (1.0%)",
      "Private Telegram group with project founders",
      "Quarterly portfolio review with Exposure team",
    ],
  },
  {
    tierLevel: "DIAMOND" as const,
    displayName: "Diamond",
    stakedAmount: "150000",
    lockPeriod: "TWELVE_MONTHS" as const,
    allocationMultiplier: 16,
    lotteryWeight: 50,
    color: "#B9F2FF",
    benefits: [
      "Everything in Platinum",
      "16x allocation multiplier",
      "50x lottery weight",
      "Guaranteed allocation ($50,000 per deal)",
      "48 hour early access to registration",
      "Access to all deal tiers including private rounds",
      "Monthly staking bonus (1.5%)",
      "Direct line to Exposure founders",
      "Co-investment opportunities with Exposure treasury",
      "Priority whitelist for partner project airdrops",
      "Annual Exposure Diamond Summit invitation",
    ],
  },
];

// The tier levels that exist in the User model
const DB_TIER_LEVELS: TierLevel[] = [
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "DIAMOND",
];

// ---------------------------------------------------------------------------
// GET handler — Public, no auth required
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest) {
  try {
    // Fetch member counts for each tier from the database
    const tierCounts = await Promise.all(
      DB_TIER_LEVELS.map(async (tierLevel) => {
        const count = await prisma.user.count({
          where: { tierLevel },
        });
        return { tierLevel, count };
      })
    );

    const tierCountMap = new Map(
      tierCounts.map((tc) => [tc.tierLevel, tc.count])
    );

    // Enrich tier ladder with member counts
    const tiersWithCounts = TIER_LADDER.map((tier) => ({
      ...tier,
      memberCount: tierCountMap.get(tier.tierLevel as TierLevel) ?? 0,
    }));

    return apiResponse({
      tiers: tiersWithCounts,
      stakingToken: "EXPO",
      stakingContractAddress: "0x0000000000000000000000000000000000000000", // TODO: Replace with real contract address
      stakingChain: "ETHEREUM",
      apyRanges: {
        NONE: "3.0%",
        THIRTY_DAYS: "5.0%",
        NINETY_DAYS: "8.0%",
        ONE_EIGHTY_DAYS: "12.0%",
        THREE_SIXTY_FIVE_DAYS: "18.5%",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
