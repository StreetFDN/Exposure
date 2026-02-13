// =============================================================================
// Exposure -- Eligibility Checker Service
// Validates whether a user is eligible to contribute to a specific deal.
// =============================================================================

import type {
  Deal,
  User,
  DealStatus,
  TierLevel,
  KycStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

// =============================================================================
// Types
// =============================================================================

/** A single eligibility check result. */
export interface CheckResult {
  name: string;
  passed: boolean;
  reason?: string;
}

/** The full eligibility result returned by `checkEligibility`. */
export interface EligibilityResult {
  eligible: boolean;
  checks: CheckResult[];
  failedChecks: CheckResult[];
}

// =============================================================================
// Constants
// =============================================================================

/** Numeric ordering for tier comparison. */
const TIER_ORDER: Record<TierLevel, number> = {
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
  PLATINUM: 4,
  DIAMOND: 5,
};

/** KYC statuses that satisfy the "approved" requirement. */
const KYC_APPROVED: KycStatus = "APPROVED";

/** Deal statuses during which contributions are accepted. */
const CONTRIBUTION_STATUSES: DealStatus[] = [
  "GUARANTEED_ALLOCATION",
  "FCFS",
];

// =============================================================================
// Individual Check Functions
// =============================================================================

/**
 * Check that the user exists and has a wallet connected.
 */
export function checkWalletConnected(user: User): CheckResult {
  const passed = typeof user.walletAddress === "string" && user.walletAddress.length > 0;
  return {
    name: "wallet_connected",
    passed,
    reason: passed ? undefined : "User does not have a wallet address connected.",
  };
}

/**
 * Check that the user's KYC status meets the deal's requirements.
 *
 * If the deal requires KYC, the user must be APPROVED.
 * If the deal requires accreditation, the user must also be accredited (US) or
 * have an investor classification that qualifies.
 */
export function checkKycRequirement(user: User, deal: Deal): CheckResult {
  if (!deal.requiresKyc) {
    return { name: "kyc_status", passed: true };
  }

  if (user.kycStatus !== KYC_APPROVED) {
    return {
      name: "kyc_status",
      passed: false,
      reason: `KYC status must be APPROVED. Current status: ${user.kycStatus}.`,
    };
  }

  // Check KYC expiry
  if (user.kycExpiresAt && user.kycExpiresAt < new Date()) {
    return {
      name: "kyc_status",
      passed: false,
      reason: "KYC verification has expired. Please re-verify.",
    };
  }

  // Additional accreditation check
  if (deal.requiresAccreditation) {
    const isAccredited =
      user.isAccreditedUS ||
      user.investorClassification === "accredited" ||
      user.investorClassification === "qualified_purchaser" ||
      user.investorClassification === "sophisticated";

    if (!isAccredited) {
      return {
        name: "kyc_status",
        passed: false,
        reason: "This deal requires accredited investor status.",
      };
    }
  }

  return { name: "kyc_status", passed: true };
}

/**
 * Check that the user's tier level meets the deal's minimum tier requirement.
 */
export function checkTierRequirement(user: User, deal: Deal): CheckResult {
  if (!deal.minTierRequired) {
    return { name: "tier_requirement", passed: true };
  }

  const userTierValue = TIER_ORDER[user.tierLevel] ?? 0;
  const requiredTierValue = TIER_ORDER[deal.minTierRequired] ?? 0;

  if (userTierValue < requiredTierValue) {
    return {
      name: "tier_requirement",
      passed: false,
      reason: `Minimum tier of ${deal.minTierRequired} required. Your tier: ${user.tierLevel}.`,
    };
  }

  return { name: "tier_requirement", passed: true };
}

/**
 * Check that the user's contribution does not exceed per-user limits.
 *
 * @param user - The user.
 * @param deal - The deal.
 * @param amount - Optional specific amount to validate against the max. If not
 *   provided, only checks if the user has already hit the max.
 */
export async function checkContributionLimits(
  user: User,
  deal: Deal,
  amount?: number
): Promise<CheckResult> {
  const maxContribution = Number(deal.maxContribution);

  if (maxContribution <= 0) {
    // No per-user cap
    return { name: "contribution_limits", passed: true };
  }

  // Sum the user's existing confirmed/pending contributions to this deal
  const existingContributions = await prisma.contribution.aggregate({
    where: {
      userId: user.id,
      dealId: deal.id,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    _sum: { amount: true },
  });

  const totalExisting = Number(existingContributions._sum.amount ?? 0);

  if (totalExisting >= maxContribution) {
    return {
      name: "contribution_limits",
      passed: false,
      reason: `You have already reached the maximum contribution of ${maxContribution} for this deal.`,
    };
  }

  if (amount !== undefined) {
    const remaining = maxContribution - totalExisting;
    if (amount > remaining) {
      return {
        name: "contribution_limits",
        passed: false,
        reason: `Contribution of ${amount} would exceed your per-user limit. Remaining allowance: ${remaining}.`,
      };
    }
  }

  return { name: "contribution_limits", passed: true };
}

/**
 * Check that the deal is in an active contribution-accepting status and
 * within the contribution time window.
 */
export function checkDealStatus(deal: Deal): CheckResult {
  // Status check
  if (!CONTRIBUTION_STATUSES.includes(deal.status)) {
    return {
      name: "deal_status",
      passed: false,
      reason: `Deal is not currently accepting contributions. Current status: ${deal.status}.`,
    };
  }

  const now = new Date();

  // Contribution window check
  if (deal.contributionOpenAt && now < deal.contributionOpenAt) {
    return {
      name: "deal_status",
      passed: false,
      reason: `Contribution window has not opened yet. Opens at: ${deal.contributionOpenAt.toISOString()}.`,
    };
  }

  if (deal.contributionCloseAt && now > deal.contributionCloseAt) {
    return {
      name: "deal_status",
      passed: false,
      reason: `Contribution window has closed. Closed at: ${deal.contributionCloseAt.toISOString()}.`,
    };
  }

  return { name: "deal_status", passed: true };
}

/**
 * Check that the deal has not reached its hard cap.
 */
export function checkHardCap(deal: Deal, amount?: number): CheckResult {
  const hardCap = Number(deal.hardCap);
  const totalRaised = Number(deal.totalRaised);

  if (totalRaised >= hardCap) {
    return {
      name: "hard_cap",
      passed: false,
      reason: "Deal has reached its hard cap. No further contributions are accepted.",
    };
  }

  if (amount !== undefined) {
    const remaining = hardCap - totalRaised;
    if (amount > remaining) {
      return {
        name: "hard_cap",
        passed: false,
        reason: `Contribution of ${amount} would exceed the hard cap. Remaining capacity: ${remaining}.`,
      };
    }
  }

  return { name: "hard_cap", passed: true };
}

/**
 * Check that the user is not geo-blocked for this deal.
 * Uses the user's country against the deal's blockedCountries and allowedCountries lists.
 */
export function checkGeoRestriction(user: User, deal: Deal): CheckResult {
  // If no restrictions are configured, pass
  if (deal.blockedCountries.length === 0 && deal.allowedCountries.length === 0) {
    return { name: "geo_restriction", passed: true };
  }

  // If user has no country set, we can't verify -- fail safe
  if (!user.country) {
    const hasRestrictions = deal.blockedCountries.length > 0 || deal.allowedCountries.length > 0;
    if (hasRestrictions) {
      return {
        name: "geo_restriction",
        passed: false,
        reason: "Your country is not set. Please update your profile to verify geo-eligibility.",
      };
    }
    return { name: "geo_restriction", passed: true };
  }

  const userCountry = user.country.toUpperCase();

  // Check blocked countries
  if (deal.blockedCountries.length > 0) {
    const blocked = deal.blockedCountries.map((c) => c.toUpperCase());
    if (blocked.includes(userCountry)) {
      return {
        name: "geo_restriction",
        passed: false,
        reason: `This deal is not available in your country (${user.country}).`,
      };
    }
  }

  // Check allowed countries (whitelist)
  if (deal.allowedCountries.length > 0) {
    const allowed = deal.allowedCountries.map((c) => c.toUpperCase());
    if (!allowed.includes(userCountry)) {
      return {
        name: "geo_restriction",
        passed: false,
        reason: `This deal is only available in specific countries. Your country (${user.country}) is not included.`,
      };
    }
  }

  return { name: "geo_restriction", passed: true };
}

/**
 * Check that the user is registered for this deal (has an Allocation record).
 */
export async function isUserRegistered(
  userId: string,
  dealId: string
): Promise<CheckResult> {
  const allocation = await prisma.allocation.findUnique({
    where: { userId_dealId: { userId, dealId } },
    select: { id: true },
  });

  if (!allocation) {
    return {
      name: "user_registered",
      passed: false,
      reason: "You must register for this deal before contributing.",
    };
  }

  return { name: "user_registered", passed: true };
}

/**
 * Check that the user is not banned.
 */
export function checkUserNotBanned(user: User): CheckResult {
  if (user.isBanned) {
    return {
      name: "user_not_banned",
      passed: false,
      reason: user.banReason
        ? `Your account is suspended: ${user.banReason}`
        : "Your account is suspended.",
    };
  }
  return { name: "user_not_banned", passed: true };
}

// =============================================================================
// Main Eligibility Function
// =============================================================================

/**
 * Perform all eligibility checks for a user contributing to a deal.
 *
 * Fetches the user and deal from the database, runs every check, and
 * returns a comprehensive result.
 *
 * @param userId - The UUID of the user.
 * @param dealId - The UUID of the deal.
 * @param amount - Optional contribution amount to validate limits.
 * @returns The full eligibility result with all check details.
 */
export async function checkEligibility(
  userId: string,
  dealId: string,
  amount?: number
): Promise<EligibilityResult> {
  // Fetch user and deal in parallel
  const [user, deal] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.deal.findUnique({ where: { id: dealId } }),
  ]);

  if (!user) {
    return {
      eligible: false,
      checks: [{ name: "user_exists", passed: false, reason: "User not found." }],
      failedChecks: [{ name: "user_exists", passed: false, reason: "User not found." }],
    };
  }

  if (!deal) {
    return {
      eligible: false,
      checks: [{ name: "deal_exists", passed: false, reason: "Deal not found." }],
      failedChecks: [{ name: "deal_exists", passed: false, reason: "Deal not found." }],
    };
  }

  // Run all synchronous checks
  const syncChecks: CheckResult[] = [
    checkWalletConnected(user),
    checkUserNotBanned(user),
    checkKycRequirement(user, deal),
    checkTierRequirement(user, deal),
    checkDealStatus(deal),
    checkHardCap(deal, amount),
    checkGeoRestriction(user, deal),
  ];

  // Run async checks in parallel
  const [contributionLimitCheck, registrationCheck] = await Promise.all([
    checkContributionLimits(user, deal, amount),
    isUserRegistered(userId, dealId),
  ]);

  const allChecks: CheckResult[] = [
    ...syncChecks,
    contributionLimitCheck,
    registrationCheck,
  ];

  const failedChecks = allChecks.filter((check) => !check.passed);
  const eligible = failedChecks.length === 0;

  return {
    eligible,
    checks: allChecks,
    failedChecks,
  };
}
