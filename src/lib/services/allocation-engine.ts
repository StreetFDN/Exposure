import { Decimal } from "@prisma/client/runtime/library";
import type { AllocationMethod, TierLevel } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTierConfig, TIER_CONFIG } from "@/lib/constants/tiers";
import {
  generateMerkleTree,
  getMerkleProof,
  getMerkleRoot,
  type MerkleLeaf,
} from "./merkle-tree";
import { calculateRefunds, processRefunds } from "./refund-calculator";
import type { Hex } from "viem";

// =============================================================================
// Constants
// =============================================================================

/**
 * Guaranteed allocation amount (in USD-equivalent raise token) per tier.
 */
const GUARANTEED_AMOUNTS: Record<TierLevel, Decimal> = {
  BRONZE: new Decimal("200"),
  SILVER: new Decimal("500"),
  GOLD: new Decimal("1000"),
  PLATINUM: new Decimal("3000"),
  DIAMOND: new Decimal("5000"),
};

/**
 * Tier numerical ordering for comparison and filtering.
 */
const TIER_ORDER: Record<TierLevel, number> = {
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
  PLATINUM: 4,
  DIAMOND: 5,
};

// =============================================================================
// Zod Schemas for Configuration
// =============================================================================

const TierLevelEnum = z.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"]);

const GuaranteedConfigSchema = z.object({
  /** Override guaranteed amounts per tier. If omitted, defaults are used. */
  guaranteedAmounts: z
    .record(TierLevelEnum, z.string())
    .optional(),
});

const ProRataConfigSchema = z.object({
  /**
   * When true, allocations are weighted by the tier's allocationMultiplier.
   * When false (default), allocations are purely proportional to expressed interest.
   */
  weighted: z.boolean().default(false),
});

const LotteryConfigSchema = z.object({
  /** Fixed amount each lottery winner receives. */
  winnerAllocation: z.string(),
  /** Maximum number of winners. If omitted, winners are drawn until the pool is exhausted. */
  maxWinners: z.number().int().positive().optional(),
  /** Deterministic seed for reproducible draws. If omitted, crypto.getRandomValues is used. */
  seed: z.string().optional(),
});

const FCFSConfigSchema = z.object({
  /** Maximum allocation per user. If omitted, the deal's maxContribution is used. */
  maxPerUser: z.string().optional(),
});

const AllocationMethodEnum = z.enum(["GUARANTEED", "PRO_RATA", "LOTTERY", "FCFS"]);

const HybridSplitSchema = z.object({
  method: AllocationMethodEnum,
  /** Percentage of total raise allocated to this method (0-100). */
  percent: z.number().min(0).max(100),
  /** Method-specific config, matching the respective schema. */
  config: z.record(z.string(), z.unknown()).optional(),
});

const HybridConfigSchema = z.object({
  splits: z.array(HybridSplitSchema).refine(
    (splits) => {
      const total = splits.reduce((sum, s) => sum + s.percent, 0);
      return Math.abs(total - 100) < 0.01;
    },
    { message: "Hybrid splits must sum to 100%" }
  ),
});

/**
 * Top-level allocation configuration.
 * Each method has its own config shape; the correct one is picked at runtime.
 */
export const AllocationConfigSchema = z.object({
  guaranteed: GuaranteedConfigSchema.optional(),
  proRata: ProRataConfigSchema.optional(),
  lottery: LotteryConfigSchema.optional(),
  fcfs: FCFSConfigSchema.optional(),
  hybrid: HybridConfigSchema.optional(),
});

export type AllocationConfig = z.infer<typeof AllocationConfigSchema>;
export type HybridSplit = z.infer<typeof HybridSplitSchema>;

// =============================================================================
// Internal Types
// =============================================================================

interface EligibleUser {
  userId: string;
  walletAddress: string;
  tierLevel: TierLevel;
  totalContributed: Decimal;
  earliestContribution: Date;
}

interface AllocationResult {
  userId: string;
  amount: Decimal;
  method: AllocationMethod;
  lotteryTickets: number;
  lotteryWon: boolean | null;
}

// =============================================================================
// Core: calculateAllocations
// =============================================================================

/**
 * Main entry point for the allocation engine.
 *
 * Loads the deal, validates the config, resolves eligible users,
 * dispatches to the correct strategy, and writes results to the DB.
 *
 * @param dealId - UUID of the deal.
 * @param method - The allocation method to use.
 * @param config - Strategy-specific configuration, validated with Zod.
 * @returns An array of allocation results that were persisted.
 */
export async function calculateAllocations(
  dealId: string,
  method: AllocationMethod,
  config: AllocationConfig = {}
): Promise<AllocationResult[]> {
  // Validate config
  const parsedConfig = AllocationConfigSchema.parse(config);

  // Fetch the deal
  const deal = await prisma.deal.findUniqueOrThrow({
    where: { id: dealId },
    select: {
      id: true,
      totalRaise: true,
      hardCap: true,
      minContribution: true,
      maxContribution: true,
      minTierRequired: true,
      status: true,
    },
  });

  let results: AllocationResult[];

  switch (method) {
    case "GUARANTEED":
      results = await calculateGuaranteedAllocations(dealId, parsedConfig);
      break;
    case "PRO_RATA":
      results = await calculateProRataAllocations(dealId, parsedConfig);
      break;
    case "LOTTERY":
      results = await calculateLotteryAllocations(dealId, parsedConfig);
      break;
    case "FCFS":
      results = await calculateFCFSAllocations(dealId, parsedConfig);
      break;
    case "HYBRID":
      results = await calculateHybridAllocations(dealId, parsedConfig);
      break;
    default: {
      const _exhaustive: never = method;
      throw new Error(`Unknown allocation method: ${_exhaustive}`);
    }
  }

  // Persist allocation records
  await persistAllocations(dealId, results);

  return results;
}

// =============================================================================
// Strategy: Guaranteed
// =============================================================================

/**
 * Tier-based guaranteed allocation.
 *
 * Each eligible user receives a guaranteed amount based on their tier level.
 * Amounts are capped at the deal's hard cap. If the total guaranteed amount
 * exceeds the hard cap, allocations are scaled down proportionally.
 *
 * @param dealId - UUID of the deal.
 * @param config - Optional overrides for guaranteed amounts per tier.
 * @returns Allocation results for all eligible users.
 */
export async function calculateGuaranteedAllocations(
  dealId: string,
  config: AllocationConfig = {}
): Promise<AllocationResult[]> {
  const deal = await prisma.deal.findUniqueOrThrow({
    where: { id: dealId },
    select: {
      id: true,
      hardCap: true,
      minTierRequired: true,
    },
  });

  const eligibleUsers = await getEligibleUsers(dealId, deal.minTierRequired);

  // Resolve guaranteed amounts, applying any overrides
  const overrides = config.guaranteed?.guaranteedAmounts;
  const amounts: Record<TierLevel, Decimal> = { ...GUARANTEED_AMOUNTS };
  if (overrides) {
    for (const [tier, amount] of Object.entries(overrides)) {
      amounts[tier as TierLevel] = new Decimal(amount);
    }
  }

  // Calculate raw allocations
  const rawResults: AllocationResult[] = eligibleUsers.map((user) => ({
    userId: user.userId,
    amount: amounts[user.tierLevel],
    method: "GUARANTEED" as const,
    lotteryTickets: 0,
    lotteryWon: null,
  }));

  // Check if total exceeds hard cap; scale down if needed
  const totalRaw = rawResults.reduce(
    (sum, r) => sum.add(r.amount),
    new Decimal(0)
  );

  if (totalRaw.greaterThan(deal.hardCap)) {
    const scaleFactor = new Decimal(deal.hardCap.toString()).dividedBy(totalRaw);
    for (const result of rawResults) {
      result.amount = result.amount.mul(scaleFactor).toDecimalPlaces(18);
    }
  }

  return rawResults;
}

// =============================================================================
// Strategy: Pro-Rata
// =============================================================================

/**
 * Pro-rata allocation: total raise divided proportionally by expressed interest.
 *
 * In weighted mode, each user's contribution is multiplied by their tier's
 * allocationMultiplier before computing proportions.
 *
 * @param dealId - UUID of the deal.
 * @param config - Pro-rata config (weighted flag).
 * @returns Allocation results.
 */
export async function calculateProRataAllocations(
  dealId: string,
  config: AllocationConfig = {}
): Promise<AllocationResult[]> {
  const deal = await prisma.deal.findUniqueOrThrow({
    where: { id: dealId },
    select: {
      id: true,
      hardCap: true,
      maxContribution: true,
      minTierRequired: true,
    },
  });

  const weighted = config.proRata?.weighted ?? false;
  const eligibleUsers = await getEligibleUsers(dealId, deal.minTierRequired);

  if (eligibleUsers.length === 0) {
    return [];
  }

  // Calculate weighted interest for each user
  const userWeights: { userId: string; weight: Decimal }[] = eligibleUsers.map(
    (user) => {
      const multiplier = weighted
        ? new Decimal(getTierConfig(user.tierLevel).allocationMultiplier)
        : new Decimal(1);
      return {
        userId: user.userId,
        weight: user.totalContributed.mul(multiplier),
      };
    }
  );

  const totalWeight = userWeights.reduce(
    (sum, uw) => sum.add(uw.weight),
    new Decimal(0)
  );

  if (totalWeight.isZero()) {
    return [];
  }

  const pool = new Decimal(deal.hardCap.toString());

  return userWeights.map((uw) => {
    const proportion = uw.weight.dividedBy(totalWeight);
    let amount = pool.mul(proportion).toDecimalPlaces(18);

    // Cap at deal max contribution
    if (amount.greaterThan(deal.maxContribution)) {
      amount = new Decimal(deal.maxContribution.toString());
    }

    return {
      userId: uw.userId,
      amount,
      method: "PRO_RATA" as const,
      lotteryTickets: 0,
      lotteryWon: null,
    };
  });
}

// =============================================================================
// Strategy: Lottery (Weighted Raffle)
// =============================================================================

/**
 * Weighted lottery allocation.
 *
 * Each eligible user receives "tickets" based on their tier level.
 * Winners are drawn (without replacement) until the pool is exhausted
 * or maxWinners is reached. Each winner gets a fixed allocation.
 *
 * Uses a deterministic PRNG if a seed is provided; otherwise, uses
 * crypto.getRandomValues for non-deterministic draws.
 *
 * @param dealId - UUID of the deal.
 * @param config - Lottery-specific config (winnerAllocation, maxWinners, seed).
 * @returns Allocation results with lotteryWon flags.
 */
export async function calculateLotteryAllocations(
  dealId: string,
  config: AllocationConfig = {}
): Promise<AllocationResult[]> {
  const lotteryConfig = config.lottery;
  if (!lotteryConfig) {
    throw new Error(
      "Lottery config (config.lottery) is required for LOTTERY allocation method"
    );
  }

  const deal = await prisma.deal.findUniqueOrThrow({
    where: { id: dealId },
    select: {
      id: true,
      hardCap: true,
      minTierRequired: true,
    },
  });

  const eligibleUsers = await getEligibleUsers(dealId, deal.minTierRequired);

  if (eligibleUsers.length === 0) {
    return [];
  }

  const winnerAllocation = new Decimal(lotteryConfig.winnerAllocation);
  const pool = new Decimal(deal.hardCap.toString());
  const maxWinnersByPool = pool.dividedBy(winnerAllocation).floor().toNumber();
  const maxWinners = lotteryConfig.maxWinners
    ? Math.min(lotteryConfig.maxWinners, maxWinnersByPool)
    : maxWinnersByPool;

  // Build the ticket pool: each user gets lotteryTickets entries
  const ticketPool: Array<{ userId: string; tierLevel: TierLevel }> = [];
  for (const user of eligibleUsers) {
    const tierConfig = getTierConfig(user.tierLevel);
    for (let i = 0; i < tierConfig.lotteryTickets; i++) {
      ticketPool.push({ userId: user.userId, tierLevel: user.tierLevel });
    }
  }

  // Shuffle the ticket pool using Fisher-Yates
  const rng = lotteryConfig.seed
    ? createSeededRng(lotteryConfig.seed)
    : createCryptoRng();

  for (let i = ticketPool.length - 1; i > 0; i--) {
    const j = rng(i + 1);
    [ticketPool[i], ticketPool[j]] = [ticketPool[j], ticketPool[i]];
  }

  // Draw winners (no duplicate users)
  const winners = new Set<string>();
  for (const ticket of ticketPool) {
    if (winners.size >= maxWinners) break;
    winners.add(ticket.userId);
  }

  // Build results: all eligible users, with lotteryWon set
  return eligibleUsers.map((user) => {
    const won = winners.has(user.userId);
    const tierConfig = getTierConfig(user.tierLevel);

    return {
      userId: user.userId,
      amount: won ? winnerAllocation : new Decimal(0),
      method: "LOTTERY" as const,
      lotteryTickets: tierConfig.lotteryTickets,
      lotteryWon: won,
    };
  });
}

// =============================================================================
// Strategy: FCFS (First Come, First Served)
// =============================================================================

/**
 * First-come, first-served allocation.
 *
 * Contributions are ordered by timestamp. Users are allocated up to the
 * per-user cap until the deal's hard cap is reached.
 *
 * @param dealId - UUID of the deal.
 * @param config - FCFS config (maxPerUser override).
 * @returns Allocation results.
 */
export async function calculateFCFSAllocations(
  dealId: string,
  config: AllocationConfig = {}
): Promise<AllocationResult[]> {
  const deal = await prisma.deal.findUniqueOrThrow({
    where: { id: dealId },
    select: {
      id: true,
      hardCap: true,
      maxContribution: true,
      minTierRequired: true,
    },
  });

  const maxPerUser = config.fcfs?.maxPerUser
    ? new Decimal(config.fcfs.maxPerUser)
    : new Decimal(deal.maxContribution.toString());

  // Get all confirmed contributions ordered by time
  const contributions = await prisma.contribution.findMany({
    where: {
      dealId,
      status: "CONFIRMED",
    },
    include: {
      user: {
        select: { id: true, tierLevel: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Filter by tier eligibility
  const minTierOrder = deal.minTierRequired
    ? TIER_ORDER[deal.minTierRequired]
    : 0;

  const pool = new Decimal(deal.hardCap.toString());
  let allocated = new Decimal(0);

  // Track per-user running totals
  const userAllocations = new Map<
    string,
    { amount: Decimal; tierLevel: TierLevel }
  >();

  for (const contrib of contributions) {
    if (allocated.greaterThanOrEqualTo(pool)) break;

    const userTierOrder = TIER_ORDER[contrib.user.tierLevel];
    if (userTierOrder < minTierOrder) continue;

    const existing = userAllocations.get(contrib.userId);
    const currentAmount = existing?.amount ?? new Decimal(0);

    // How much can this user still receive?
    const remainingForUser = maxPerUser.minus(currentAmount);
    if (remainingForUser.lessThanOrEqualTo(0)) continue;

    // How much is left in the pool?
    const remainingInPool = pool.minus(allocated);

    // The contribution amount capped by per-user limit and pool
    const allocationForContrib = Decimal.min(
      contrib.amount,
      remainingForUser,
      remainingInPool
    );

    const newTotal = currentAmount.add(allocationForContrib);
    userAllocations.set(contrib.userId, {
      amount: newTotal,
      tierLevel: contrib.user.tierLevel,
    });
    allocated = allocated.add(allocationForContrib);
  }

  // Build results
  return Array.from(userAllocations.entries()).map(
    ([userId, { amount }]) => ({
      userId,
      amount,
      method: "FCFS" as const,
      lotteryTickets: 0,
      lotteryWon: null,
    })
  );
}

// =============================================================================
// Strategy: Hybrid
// =============================================================================

/**
 * Hybrid allocation: a configurable composite of multiple strategies.
 *
 * The deal's hard cap is split among strategies according to the configured
 * percentages. Each strategy runs independently on its portion of the pool.
 * User allocations are then merged (summed) across strategies.
 *
 * Example: 60% guaranteed + 20% lottery + 20% FCFS
 *
 * @param dealId - UUID of the deal.
 * @param config - Hybrid config with an array of splits.
 * @returns Merged allocation results.
 */
export async function calculateHybridAllocations(
  dealId: string,
  config: AllocationConfig = {}
): Promise<AllocationResult[]> {
  const hybridConfig = config.hybrid;
  if (!hybridConfig) {
    throw new Error(
      "Hybrid config (config.hybrid) is required for HYBRID allocation method"
    );
  }

  const deal = await prisma.deal.findUniqueOrThrow({
    where: { id: dealId },
    select: { id: true, hardCap: true },
  });

  const totalPool = new Decimal(deal.hardCap.toString());

  // Merge map: userId -> accumulated allocation
  const mergedAllocations = new Map<
    string,
    { amount: Decimal; lotteryTickets: number; lotteryWon: boolean | null }
  >();

  for (const split of hybridConfig.splits) {
    const splitPool = totalPool.mul(split.percent).dividedBy(100);

    // Build a sub-config with the split-specific overrides and a scaled hard cap.
    // We temporarily override the deal hard cap by passing through config,
    // but the strategies read from the deal record. So we use a wrapper approach:
    // run the sub-strategy, then scale results to fit this split's pool.

    const subConfig: AllocationConfig = {
      ...config,
      ...(split.config as Partial<AllocationConfig>),
    };

    let subResults: AllocationResult[];

    switch (split.method) {
      case "GUARANTEED":
        subResults = await calculateGuaranteedAllocations(dealId, subConfig);
        break;
      case "PRO_RATA":
        subResults = await calculateProRataAllocations(dealId, subConfig);
        break;
      case "LOTTERY":
        subResults = await calculateLotteryAllocations(dealId, subConfig);
        break;
      case "FCFS":
        subResults = await calculateFCFSAllocations(dealId, subConfig);
        break;
      default: {
        throw new Error(
          `Unknown method in hybrid split: ${split.method as string}`
        );
      }
    }

    // Scale sub-results to fit this split's pool
    const subTotal = subResults.reduce(
      (sum, r) => sum.add(r.amount),
      new Decimal(0)
    );

    const scale =
      subTotal.greaterThan(0) && subTotal.greaterThan(splitPool)
        ? splitPool.dividedBy(subTotal)
        : new Decimal(1);

    for (const result of subResults) {
      const scaledAmount = result.amount.mul(scale).toDecimalPlaces(18);
      const existing = mergedAllocations.get(result.userId);

      if (existing) {
        existing.amount = existing.amount.add(scaledAmount);
        // Preserve lottery data if this is a lottery split
        if (result.lotteryTickets > 0) {
          existing.lotteryTickets = result.lotteryTickets;
        }
        if (result.lotteryWon !== null) {
          existing.lotteryWon = result.lotteryWon;
        }
      } else {
        mergedAllocations.set(result.userId, {
          amount: scaledAmount,
          lotteryTickets: result.lotteryTickets,
          lotteryWon: result.lotteryWon,
        });
      }
    }
  }

  return Array.from(mergedAllocations.entries()).map(
    ([userId, { amount, lotteryTickets, lotteryWon }]) => ({
      userId,
      amount,
      method: "HYBRID" as const,
      lotteryTickets,
      lotteryWon,
    })
  );
}

// =============================================================================
// Oversubscription Refunds
// =============================================================================

/**
 * Calculate refund amounts for users who over-contributed relative to
 * their final allocation.
 *
 * Delegates to the refund-calculator service.
 *
 * @param dealId - UUID of the deal.
 * @returns Refund summary with per-user entries.
 */
export async function calculateOversubscriptionRefunds(dealId: string) {
  return calculateRefunds(dealId);
}

// =============================================================================
// Finalization
// =============================================================================

/**
 * Finalize allocations for a deal.
 *
 * This locks all allocation records as immutable (isFinalized = true),
 * generates a Merkle tree for on-chain claim verification, stores each
 * user's Merkle proof on their allocation record, processes refunds for
 * oversubscribed users, and creates an audit trail.
 *
 * Once finalized, allocations cannot be recalculated.
 *
 * @param dealId - UUID of the deal.
 * @returns The Merkle root hash and the number of finalized allocations.
 */
export async function finalizeAllocations(
  dealId: string
): Promise<{ merkleRoot: string; allocationsFinalized: number }> {
  // Verify deal exists and is in a state that allows finalization
  const deal = await prisma.deal.findUniqueOrThrow({
    where: { id: dealId },
    select: { id: true, status: true },
  });

  // Prevent double finalization
  const existingFinalized = await prisma.allocation.count({
    where: { dealId, isFinalized: true },
  });
  if (existingFinalized > 0) {
    throw new Error(
      `Deal ${dealId} already has finalized allocations. Cannot re-finalize.`
    );
  }

  // Get all pending allocations with user wallet addresses
  const allocations = await prisma.allocation.findMany({
    where: { dealId, isFinalized: false },
    include: {
      user: {
        select: { walletAddress: true },
      },
    },
  });

  if (allocations.length === 0) {
    throw new Error(`No pending allocations found for deal ${dealId}`);
  }

  // Filter out zero-amount allocations for Merkle tree (they get no claim)
  const nonZeroAllocations = allocations.filter((a) =>
    new Decimal(a.finalAmount.toString()).greaterThan(0)
  );

  // Build Merkle tree leaves
  const merkleLeaves: MerkleLeaf[] = nonZeroAllocations.map((a) => ({
    address: a.user.walletAddress as Hex,
    // Convert Decimal to bigint (assuming 18 decimal places for token precision)
    amount: decimalToBigInt(a.finalAmount),
  }));

  const tree = generateMerkleTree(merkleLeaves);
  const merkleRoot = getMerkleRoot(tree);

  // Persist everything in a transaction
  await prisma.$transaction(async (tx) => {
    const now = new Date();

    for (const alloc of allocations) {
      // Get Merkle proof for non-zero allocations
      let proofJson: string | null = null;
      if (
        new Decimal(alloc.finalAmount.toString()).greaterThan(0)
      ) {
        const proof = getMerkleProof(
          tree,
          alloc.user.walletAddress as Hex
        );
        if (proof) {
          proofJson = JSON.stringify(proof);
        }
      }

      await tx.allocation.update({
        where: { id: alloc.id },
        data: {
          isFinalized: true,
          finalizedAt: now,
          merkleProof: proofJson,
        },
      });
    }

    // Update the deal's whitelist Merkle root
    await tx.deal.update({
      where: { id: dealId },
      data: {
        whitelistMerkleRoot: merkleRoot,
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        action: "ALLOCATIONS_FINALIZED",
        resourceType: "Deal",
        resourceId: dealId,
        metadata: {
          merkleRoot,
          allocationsFinalized: allocations.length,
          nonZeroAllocations: nonZeroAllocations.length,
        },
      },
    });
  });

  // Process refunds for oversubscribed users
  await processRefunds(dealId);

  return {
    merkleRoot,
    allocationsFinalized: allocations.length,
  };
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Fetch all eligible users for a deal: users who have at least one confirmed
 * contribution, meet the minimum tier requirement, are not banned, and have
 * approved KYC.
 */
async function getEligibleUsers(
  dealId: string,
  minTierRequired: TierLevel | null
): Promise<EligibleUser[]> {
  // Build tier filter: all tiers at or above the minimum
  const eligibleTiers: TierLevel[] = [];
  const minOrder = minTierRequired ? TIER_ORDER[minTierRequired] : 0;

  for (const tier of TIER_CONFIG) {
    if (TIER_ORDER[tier.level] >= minOrder) {
      eligibleTiers.push(tier.level);
    }
  }

  // Get users with confirmed contributions on this deal who meet tier/KYC requirements
  const contributions = await prisma.contribution.findMany({
    where: {
      dealId,
      status: "CONFIRMED",
      user: {
        isBanned: false,
        kycStatus: "APPROVED",
        tierLevel: { in: eligibleTiers },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          walletAddress: true,
          tierLevel: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Aggregate by user
  const userMap = new Map<string, EligibleUser>();
  for (const contrib of contributions) {
    const existing = userMap.get(contrib.userId);
    if (existing) {
      existing.totalContributed = existing.totalContributed.add(contrib.amount);
    } else {
      userMap.set(contrib.userId, {
        userId: contrib.userId,
        walletAddress: contrib.user.walletAddress,
        tierLevel: contrib.user.tierLevel,
        totalContributed: new Decimal(contrib.amount.toString()),
        earliestContribution: contrib.createdAt,
      });
    }
  }

  return Array.from(userMap.values());
}

/**
 * Persist allocation results to the database, upserting by (userId, dealId).
 */
async function persistAllocations(
  dealId: string,
  results: AllocationResult[]
): Promise<void> {
  await prisma.$transaction(
    results.map((result) =>
      prisma.allocation.upsert({
        where: {
          userId_dealId: {
            userId: result.userId,
            dealId,
          },
        },
        create: {
          userId: result.userId,
          dealId,
          guaranteedAmount:
            result.method === "GUARANTEED" ? result.amount : new Decimal(0),
          requestedAmount: new Decimal(0),
          finalAmount: result.amount,
          allocationMethod: result.method,
          lotteryTickets: result.lotteryTickets,
          lotteryWon: result.lotteryWon,
        },
        update: {
          guaranteedAmount:
            result.method === "GUARANTEED" ? result.amount : undefined,
          finalAmount: result.amount,
          allocationMethod: result.method,
          lotteryTickets: result.lotteryTickets,
          lotteryWon: result.lotteryWon,
        },
      })
    )
  );
}

/**
 * Convert a Prisma Decimal to a bigint, preserving 18 decimal places.
 *
 * e.g. Decimal("1000.5") -> 1000500000000000000000n
 */
function decimalToBigInt(value: Decimal): bigint {
  // Multiply by 10^18, take the floor, convert to bigint
  const scaled = new Decimal(value.toString()).mul(new Decimal("1e18")).floor();
  return BigInt(scaled.toFixed(0));
}

/**
 * Create a seeded pseudo-random number generator using a simple
 * xorshift128 algorithm. Deterministic for reproducible lottery draws.
 *
 * @param seed - A string seed that is hashed to produce initial state.
 * @returns A function that returns a random integer in [0, max).
 */
function createSeededRng(seed: string): (max: number) => number {
  // Simple hash of seed string to 4 uint32s
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }

  let s0 = (h ^ 0xdeadbeef) >>> 0;
  let s1 = (h ^ 0xcafebabe) >>> 0;
  let s2 = (h ^ 0x12345678) >>> 0;
  let s3 = (h ^ 0x9abcdef0) >>> 0;

  // Ensure non-zero state
  if ((s0 | s1 | s2 | s3) === 0) {
    s0 = 1;
  }

  function next(): number {
    const t = s1 << 9;
    let r = s0 * 5;
    r = ((r << 7) | (r >>> 25)) * 9;

    s2 ^= s0;
    s3 ^= s1;
    s1 ^= s2;
    s0 ^= s3;

    s2 ^= t;
    s3 = (s3 << 11) | (s3 >>> 21);

    return (r >>> 0) / 4294967296;
  }

  return (max: number) => Math.floor(next() * max);
}

/**
 * Create a cryptographically random number generator.
 *
 * @returns A function that returns a random integer in [0, max).
 */
function createCryptoRng(): (max: number) => number {
  return (max: number) => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  };
}
