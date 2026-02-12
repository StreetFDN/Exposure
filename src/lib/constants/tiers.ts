import type { TierLevel, StakingLockPeriod } from "@prisma/client";

// =============================================================================
// Tier Configuration
// =============================================================================

export interface TierConfigEntry {
  level: TierLevel;
  name: string;
  stakedAmount: bigint;
  lockPeriod: StakingLockPeriod;
  allocationMultiplier: number;
  lotteryTickets: number;
  benefits: string[];
  color: string;
}

/**
 * Ordered tier configuration from lowest to highest.
 *
 * `stakedAmount` is the minimum amount of EXPO tokens that must be staked.
 * `lockPeriod` is the minimum lock duration required for the tier.
 */
export const TIER_CONFIG: readonly TierConfigEntry[] = [
  {
    level: "BRONZE",
    name: "Bronze",
    stakedAmount: 1_000n * 10n ** 18n, // 1,000 EXPO
    lockPeriod: "DAYS_30",
    allocationMultiplier: 1,
    lotteryTickets: 1,
    benefits: [
      "Access to public deals",
      "Basic deal notifications",
      "Community chat access",
    ],
    color: "#CD7F32",
  },
  {
    level: "SILVER",
    name: "Silver",
    stakedAmount: 5_000n * 10n ** 18n, // 5,000 EXPO
    lockPeriod: "DAYS_30",
    allocationMultiplier: 2,
    lotteryTickets: 3,
    benefits: [
      "All Bronze benefits",
      "Early access to deal announcements",
      "2x allocation multiplier",
      "Priority support",
    ],
    color: "#C0C0C0",
  },
  {
    level: "GOLD",
    name: "Gold",
    stakedAmount: 25_000n * 10n ** 18n, // 25,000 EXPO
    lockPeriod: "DAYS_90",
    allocationMultiplier: 5,
    lotteryTickets: 8,
    benefits: [
      "All Silver benefits",
      "Guaranteed allocation in tiered deals",
      "5x allocation multiplier",
      "Exclusive deal access",
      "Quarterly AMAs with projects",
    ],
    color: "#FFD700",
  },
  {
    level: "PLATINUM",
    name: "Platinum",
    stakedAmount: 100_000n * 10n ** 18n, // 100,000 EXPO
    lockPeriod: "DAYS_90",
    allocationMultiplier: 12,
    lotteryTickets: 20,
    benefits: [
      "All Gold benefits",
      "Maximum guaranteed allocation",
      "12x allocation multiplier",
      "Private deal room access",
      "Direct line to Exposure team",
      "Early token distribution",
    ],
    color: "#E5E4E2",
  },
  {
    level: "DIAMOND",
    name: "Diamond",
    stakedAmount: 500_000n * 10n ** 18n, // 500,000 EXPO
    lockPeriod: "DAYS_180",
    allocationMultiplier: 25,
    lotteryTickets: 50,
    benefits: [
      "All Platinum benefits",
      "Co-investment opportunities",
      "25x allocation multiplier",
      "Advisory board participation",
      "Zero platform fees",
      "Custom deal structuring",
      "White-glove onboarding for projects",
    ],
    color: "#B9F2FF",
  },
] as const;

// =============================================================================
// Tier Colors
// =============================================================================

/**
 * Mapping of tier level to hex color for consistent UI theming.
 */
export const TIER_COLORS: Record<TierLevel, string> = {
  BRONZE: "#CD7F32",
  SILVER: "#C0C0C0",
  GOLD: "#FFD700",
  PLATINUM: "#E5E4E2",
  DIAMOND: "#B9F2FF",
} as const;

// =============================================================================
// Helpers
// =============================================================================

/** Lock period ordering for comparison. */
const LOCK_PERIOD_ORDER: Record<StakingLockPeriod, number> = {
  DAYS_30: 0,
  DAYS_90: 1,
  DAYS_180: 2,
};

/**
 * Determine the tier a user qualifies for based on their staked amount and
 * lock period. Returns the highest qualifying tier, or null if the user does
 * not qualify for any tier.
 */
export function getTierByStake(
  amount: bigint,
  lockPeriod: StakingLockPeriod
): TierConfigEntry | null {
  const lockValue = LOCK_PERIOD_ORDER[lockPeriod];

  // Iterate from highest to lowest tier and return the first match.
  for (let i = TIER_CONFIG.length - 1; i >= 0; i--) {
    const tier = TIER_CONFIG[i];
    const requiredLock = LOCK_PERIOD_ORDER[tier.lockPeriod];

    if (amount >= tier.stakedAmount && lockValue >= requiredLock) {
      return tier;
    }
  }

  return null;
}

/**
 * Get the next tier above the given tier level.
 * Returns null if the user is already at Diamond (the highest tier).
 */
export function getNextTier(
  currentTier: TierLevel
): TierConfigEntry | null {
  const currentIndex = TIER_CONFIG.findIndex((t) => t.level === currentTier);
  if (currentIndex === -1 || currentIndex === TIER_CONFIG.length - 1) {
    return null;
  }
  return TIER_CONFIG[currentIndex + 1];
}

/**
 * Get a specific tier's configuration by level.
 */
export function getTierConfig(level: TierLevel): TierConfigEntry {
  const tier = TIER_CONFIG.find((t) => t.level === level);
  if (!tier) {
    throw new Error(`Unknown tier level: ${level}`);
  }
  return tier;
}
