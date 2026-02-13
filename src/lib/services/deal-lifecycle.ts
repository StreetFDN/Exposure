// =============================================================================
// Exposure -- Deal Lifecycle Service
// Manages deal phase transitions, status updates, and lifecycle events.
// =============================================================================

import type { Deal, DealStatus, DealPhase } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// =============================================================================
// Types
// =============================================================================

/** Result of a phase transition attempt. */
export interface TransitionResult {
  success: boolean;
  deal: Deal;
  previousStatus: DealStatus;
  newStatus: DealStatus;
  phase?: DealPhase;
  message: string;
}

/** Information about the current phase of a deal. */
export interface DealPhaseInfo {
  dealId: string;
  status: DealStatus;
  currentPhase: DealPhase | null;
  nextPhase: DealPhase | null;
  phases: DealPhase[];
  isWithinContributionWindow: boolean;
  isWithinRegistrationWindow: boolean;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Defines which status transitions are allowed.
 * Key is current status; value is the set of statuses it can transition to.
 */
const ALLOWED_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  DRAFT: ["UNDER_REVIEW", "CANCELLED"],
  UNDER_REVIEW: ["APPROVED", "CANCELLED"],
  APPROVED: ["REGISTRATION_OPEN", "CANCELLED"],
  REGISTRATION_OPEN: ["GUARANTEED_ALLOCATION", "CANCELLED"],
  GUARANTEED_ALLOCATION: ["FCFS", "SETTLEMENT", "CANCELLED"],
  FCFS: ["SETTLEMENT", "CANCELLED"],
  SETTLEMENT: ["DISTRIBUTING", "CANCELLED"],
  DISTRIBUTING: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

/**
 * Ordered phase names that map to deal phases within a deal timeline.
 */
const PHASE_NAMES = [
  "Registration",
  "Guaranteed Allocation",
  "FCFS Overflow",
  "Settlement",
  "Distribution",
] as const;

/**
 * Maps a lifecycle action to its target DealStatus.
 */
const ACTION_STATUS_MAP: Record<string, DealStatus> = {
  open_registration: "REGISTRATION_OPEN",
  close_registration: "GUARANTEED_ALLOCATION",
  open_contributions: "GUARANTEED_ALLOCATION",
  close_contributions: "SETTLEMENT",
  start_distribution: "DISTRIBUTING",
  complete: "COMPLETED",
  cancel: "CANCELLED",
};

// =============================================================================
// Helpers
// =============================================================================

/**
 * Log an action to the AuditLog table.
 */
async function logAuditEvent(
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      resourceType,
      resourceId,
      metadata: metadata ?? undefined,
    },
  });
}

/**
 * Find a deal by ID, throwing if not found.
 */
async function findDealOrThrow(dealId: string): Promise<Deal> {
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) {
    throw new Error(`Deal not found: ${dealId}`);
  }
  return deal;
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Validate whether a deal can transition to the given target status.
 *
 * @param deal - The deal to check.
 * @param targetStatus - The status to transition to.
 * @returns `true` if the transition is valid; `false` otherwise.
 */
export function canTransitionTo(deal: Deal, targetStatus: DealStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[deal.status];
  return allowed.includes(targetStatus);
}

/**
 * Get the current phase information for a deal, including which DealPhase
 * record is currently active based on timestamps.
 *
 * @param dealId - The UUID of the deal.
 * @returns Phase information including current/next phases and window status.
 */
export async function getDealCurrentPhase(dealId: string): Promise<DealPhaseInfo> {
  const deal = await findDealOrThrow(dealId);

  const phases = await prisma.dealPhase.findMany({
    where: { dealId },
    orderBy: { phaseOrder: "asc" },
  });

  const now = new Date();

  // Determine the currently active phase based on timestamps
  let currentPhase: DealPhase | null = null;
  let nextPhase: DealPhase | null = null;

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    if (now >= phase.startsAt && now <= phase.endsAt) {
      currentPhase = phase;
      nextPhase = phases[i + 1] ?? null;
      break;
    }
    if (now < phase.startsAt) {
      nextPhase = phase;
      break;
    }
  }

  const isWithinRegistrationWindow =
    deal.registrationOpenAt !== null &&
    deal.registrationCloseAt !== null &&
    now >= deal.registrationOpenAt &&
    now <= deal.registrationCloseAt;

  const isWithinContributionWindow =
    deal.contributionOpenAt !== null &&
    deal.contributionCloseAt !== null &&
    now >= deal.contributionOpenAt &&
    now <= deal.contributionCloseAt;

  return {
    dealId,
    status: deal.status,
    currentPhase,
    nextPhase,
    phases,
    isWithinContributionWindow,
    isWithinRegistrationWindow,
  };
}

/**
 * Auto-transition a deal to the next phase if time conditions are met.
 * Checks the deal's scheduled timestamps and advances the status accordingly.
 *
 * @param dealId - The UUID of the deal.
 * @returns The transition result, or null if no transition was needed.
 */
export async function transitionDealPhase(
  dealId: string
): Promise<TransitionResult | null> {
  const deal = await findDealOrThrow(dealId);
  const now = new Date();

  // Determine if any auto-transition should occur based on timestamps
  let targetStatus: DealStatus | null = null;

  if (
    deal.status === "APPROVED" &&
    deal.registrationOpenAt &&
    now >= deal.registrationOpenAt
  ) {
    targetStatus = "REGISTRATION_OPEN";
  } else if (
    deal.status === "REGISTRATION_OPEN" &&
    deal.registrationCloseAt &&
    now >= deal.registrationCloseAt
  ) {
    targetStatus = "GUARANTEED_ALLOCATION";
  } else if (
    deal.status === "GUARANTEED_ALLOCATION" &&
    deal.contributionCloseAt &&
    now >= deal.contributionCloseAt
  ) {
    // If deal has an FCFS phase, go to FCFS; otherwise go to SETTLEMENT
    const fcfsPhase = await prisma.dealPhase.findFirst({
      where: { dealId, phaseName: "FCFS Overflow" },
    });
    targetStatus = fcfsPhase ? "FCFS" : "SETTLEMENT";
  } else if (
    deal.status === "FCFS" &&
    deal.contributionCloseAt &&
    now >= deal.contributionCloseAt
  ) {
    targetStatus = "SETTLEMENT";
  } else if (
    deal.status === "SETTLEMENT" &&
    deal.distributionAt &&
    now >= deal.distributionAt
  ) {
    targetStatus = "DISTRIBUTING";
  }

  if (!targetStatus) {
    return null;
  }

  if (!canTransitionTo(deal, targetStatus)) {
    return null;
  }

  const previousStatus = deal.status;

  const updatedDeal = await prisma.deal.update({
    where: { id: dealId },
    data: { status: targetStatus },
  });

  // Update DealPhase isActive flags
  await syncPhaseActiveFlags(dealId, targetStatus);

  await logAuditEvent(null, "DEAL_AUTO_TRANSITION", "Deal", dealId, {
    previousStatus,
    newStatus: targetStatus,
    triggeredAt: now.toISOString(),
  });

  return {
    success: true,
    deal: updatedDeal,
    previousStatus,
    newStatus: targetStatus,
    message: `Deal auto-transitioned from ${previousStatus} to ${targetStatus}`,
  };
}

// =============================================================================
// Phase Action Functions
// =============================================================================

/**
 * Open the registration window for a deal.
 * Transitions the deal from APPROVED to REGISTRATION_OPEN.
 *
 * @param dealId - The UUID of the deal.
 * @param adminId - The UUID of the admin performing the action.
 * @returns The transition result.
 */
export async function openRegistration(
  dealId: string,
  adminId: string
): Promise<TransitionResult> {
  const deal = await findDealOrThrow(dealId);
  const targetStatus: DealStatus = "REGISTRATION_OPEN";

  if (!canTransitionTo(deal, targetStatus)) {
    throw new Error(
      `Cannot open registration: deal is in ${deal.status} status. ` +
      `Must be in APPROVED status.`
    );
  }

  const previousStatus = deal.status;
  const now = new Date();

  const updatedDeal = await prisma.$transaction(async (tx) => {
    // Update deal status and set registration window if not already set
    const updated = await tx.deal.update({
      where: { id: dealId },
      data: {
        status: targetStatus,
        registrationOpenAt: deal.registrationOpenAt ?? now,
      },
    });

    // Create or update the Registration phase record
    await upsertDealPhase(tx, dealId, "Registration", 1, now, deal.registrationCloseAt);

    return updated;
  });

  await syncPhaseActiveFlags(dealId, targetStatus);

  await logAuditEvent(adminId, "DEAL_OPEN_REGISTRATION", "Deal", dealId, {
    previousStatus,
    newStatus: targetStatus,
  });

  return {
    success: true,
    deal: updatedDeal,
    previousStatus,
    newStatus: targetStatus,
    message: "Registration opened successfully",
  };
}

/**
 * Close registration and snapshot eligible users.
 * Transitions the deal from REGISTRATION_OPEN to GUARANTEED_ALLOCATION.
 *
 * @param dealId - The UUID of the deal.
 * @param adminId - The UUID of the admin performing the action.
 * @returns The transition result.
 */
export async function closeRegistration(
  dealId: string,
  adminId: string
): Promise<TransitionResult> {
  const deal = await findDealOrThrow(dealId);
  const targetStatus: DealStatus = "GUARANTEED_ALLOCATION";

  if (!canTransitionTo(deal, targetStatus)) {
    throw new Error(
      `Cannot close registration: deal is in ${deal.status} status. ` +
      `Must be in REGISTRATION_OPEN status.`
    );
  }

  const previousStatus = deal.status;
  const now = new Date();

  const updatedDeal = await prisma.$transaction(async (tx) => {
    // Close the registration window
    const updated = await tx.deal.update({
      where: { id: dealId },
      data: {
        status: targetStatus,
        registrationCloseAt: deal.registrationCloseAt ?? now,
        contributionOpenAt: deal.contributionOpenAt ?? now,
      },
    });

    // Mark the Registration phase as ended
    await tx.dealPhase.updateMany({
      where: { dealId, phaseName: "Registration", isActive: true },
      data: { isActive: false, endsAt: now },
    });

    // Create Guaranteed Allocation phase
    const contributionEnd = deal.contributionCloseAt ?? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    await upsertDealPhase(tx, dealId, "Guaranteed Allocation", 2, now, contributionEnd);

    // Snapshot: count registered users (those with Allocation records)
    const registeredCount = await tx.allocation.count({
      where: { dealId },
    });

    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: "DEAL_REGISTRATION_SNAPSHOT",
        resourceType: "Deal",
        resourceId: dealId,
        metadata: { registeredCount, snapshotAt: now.toISOString() },
      },
    });

    return updated;
  });

  await syncPhaseActiveFlags(dealId, targetStatus);

  await logAuditEvent(adminId, "DEAL_CLOSE_REGISTRATION", "Deal", dealId, {
    previousStatus,
    newStatus: targetStatus,
  });

  return {
    success: true,
    deal: updatedDeal,
    previousStatus,
    newStatus: targetStatus,
    message: "Registration closed. Guaranteed allocation phase started.",
  };
}

/**
 * Open the contribution window.
 * This is typically called after registration closes and guaranteed allocation begins.
 *
 * @param dealId - The UUID of the deal.
 * @param adminId - The UUID of the admin performing the action.
 * @returns The transition result.
 */
export async function openContributions(
  dealId: string,
  adminId: string
): Promise<TransitionResult> {
  const deal = await findDealOrThrow(dealId);

  // Contributions can be opened when in GUARANTEED_ALLOCATION status
  // (in case the admin needs to explicitly open contributions after registration closes)
  const acceptableStatuses: DealStatus[] = ["REGISTRATION_OPEN", "GUARANTEED_ALLOCATION"];
  if (!acceptableStatuses.includes(deal.status)) {
    throw new Error(
      `Cannot open contributions: deal is in ${deal.status} status. ` +
      `Must be in REGISTRATION_OPEN or GUARANTEED_ALLOCATION status.`
    );
  }

  const targetStatus: DealStatus = "GUARANTEED_ALLOCATION";
  const previousStatus = deal.status;
  const now = new Date();

  const updatedDeal = await prisma.$transaction(async (tx) => {
    const updated = await tx.deal.update({
      where: { id: dealId },
      data: {
        status: targetStatus,
        contributionOpenAt: deal.contributionOpenAt ?? now,
      },
    });

    // Ensure a Guaranteed Allocation phase exists
    const contributionEnd = deal.contributionCloseAt ?? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    await upsertDealPhase(tx, dealId, "Guaranteed Allocation", 2, now, contributionEnd);

    return updated;
  });

  await syncPhaseActiveFlags(dealId, targetStatus);

  await logAuditEvent(adminId, "DEAL_OPEN_CONTRIBUTIONS", "Deal", dealId, {
    previousStatus,
    newStatus: targetStatus,
  });

  return {
    success: true,
    deal: updatedDeal,
    previousStatus,
    newStatus: targetStatus,
    message: "Contribution window opened. Guaranteed allocation phase is active.",
  };
}

/**
 * Close contributions and trigger allocation/settlement.
 * Transitions the deal to SETTLEMENT status.
 *
 * @param dealId - The UUID of the deal.
 * @param adminId - The UUID of the admin performing the action.
 * @returns The transition result.
 */
export async function closeContributions(
  dealId: string,
  adminId: string
): Promise<TransitionResult> {
  const deal = await findDealOrThrow(dealId);
  const targetStatus: DealStatus = "SETTLEMENT";

  const contributionStatuses: DealStatus[] = ["GUARANTEED_ALLOCATION", "FCFS"];
  if (!contributionStatuses.includes(deal.status)) {
    throw new Error(
      `Cannot close contributions: deal is in ${deal.status} status. ` +
      `Must be in GUARANTEED_ALLOCATION or FCFS status.`
    );
  }

  if (!canTransitionTo(deal, targetStatus)) {
    throw new Error(
      `Cannot transition from ${deal.status} to ${targetStatus}.`
    );
  }

  const previousStatus = deal.status;
  const now = new Date();

  const updatedDeal = await prisma.$transaction(async (tx) => {
    const updated = await tx.deal.update({
      where: { id: dealId },
      data: {
        status: targetStatus,
        contributionCloseAt: deal.contributionCloseAt ?? now,
      },
    });

    // Deactivate all current active phases
    await tx.dealPhase.updateMany({
      where: { dealId, isActive: true },
      data: { isActive: false },
    });

    // Create Settlement phase
    const settlementEnd = deal.distributionAt ?? new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    await upsertDealPhase(tx, dealId, "Settlement", 4, now, settlementEnd);

    // Finalize all allocations for this deal
    await tx.allocation.updateMany({
      where: { dealId, isFinalized: false },
      data: { isFinalized: true, finalizedAt: now },
    });

    return updated;
  });

  await syncPhaseActiveFlags(dealId, targetStatus);

  await logAuditEvent(adminId, "DEAL_CLOSE_CONTRIBUTIONS", "Deal", dealId, {
    previousStatus,
    newStatus: targetStatus,
    totalRaised: deal.totalRaised.toString(),
    contributorCount: deal.contributorCount,
  });

  return {
    success: true,
    deal: updatedDeal,
    previousStatus,
    newStatus: targetStatus,
    message: "Contributions closed. Settlement phase started.",
  };
}

/**
 * Begin the token distribution phase.
 *
 * @param dealId - The UUID of the deal.
 * @param adminId - The UUID of the admin performing the action.
 * @returns The transition result.
 */
export async function startDistribution(
  dealId: string,
  adminId: string
): Promise<TransitionResult> {
  const deal = await findDealOrThrow(dealId);
  const targetStatus: DealStatus = "DISTRIBUTING";

  if (!canTransitionTo(deal, targetStatus)) {
    throw new Error(
      `Cannot start distribution: deal is in ${deal.status} status. ` +
      `Must be in SETTLEMENT status.`
    );
  }

  const previousStatus = deal.status;
  const now = new Date();

  const updatedDeal = await prisma.$transaction(async (tx) => {
    const updated = await tx.deal.update({
      where: { id: dealId },
      data: {
        status: targetStatus,
        distributionAt: deal.distributionAt ?? now,
        vestingStartAt: deal.vestingStartAt ?? now,
      },
    });

    // Deactivate all current active phases
    await tx.dealPhase.updateMany({
      where: { dealId, isActive: true },
      data: { isActive: false },
    });

    // Create Distribution phase (open-ended until deal completes)
    const estimatedEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    await upsertDealPhase(tx, dealId, "Distribution", 5, now, estimatedEnd);

    return updated;
  });

  await syncPhaseActiveFlags(dealId, targetStatus);

  await logAuditEvent(adminId, "DEAL_START_DISTRIBUTION", "Deal", dealId, {
    previousStatus,
    newStatus: targetStatus,
  });

  return {
    success: true,
    deal: updatedDeal,
    previousStatus,
    newStatus: targetStatus,
    message: "Token distribution phase started.",
  };
}

/**
 * Mark a deal as completed.
 *
 * @param dealId - The UUID of the deal.
 * @param adminId - The UUID of the admin performing the action.
 * @returns The transition result.
 */
export async function completeDeal(
  dealId: string,
  adminId: string
): Promise<TransitionResult> {
  const deal = await findDealOrThrow(dealId);
  const targetStatus: DealStatus = "COMPLETED";

  if (!canTransitionTo(deal, targetStatus)) {
    throw new Error(
      `Cannot complete deal: deal is in ${deal.status} status. ` +
      `Must be in DISTRIBUTING status.`
    );
  }

  const previousStatus = deal.status;
  const now = new Date();

  const updatedDeal = await prisma.$transaction(async (tx) => {
    const updated = await tx.deal.update({
      where: { id: dealId },
      data: { status: targetStatus },
    });

    // Deactivate all phases
    await tx.dealPhase.updateMany({
      where: { dealId, isActive: true },
      data: { isActive: false, endsAt: now },
    });

    return updated;
  });

  await logAuditEvent(adminId, "DEAL_COMPLETED", "Deal", dealId, {
    previousStatus,
    newStatus: targetStatus,
    totalRaised: deal.totalRaised.toString(),
    contributorCount: deal.contributorCount,
  });

  return {
    success: true,
    deal: updatedDeal,
    previousStatus,
    newStatus: targetStatus,
    message: "Deal completed successfully.",
  };
}

/**
 * Cancel a deal and trigger the refund process.
 * Cancelled deals cannot be reactivated.
 *
 * @param dealId - The UUID of the deal.
 * @param adminId - The UUID of the admin performing the action.
 * @returns The transition result.
 */
export async function cancelDeal(
  dealId: string,
  adminId: string
): Promise<TransitionResult> {
  const deal = await findDealOrThrow(dealId);
  const targetStatus: DealStatus = "CANCELLED";

  if (!canTransitionTo(deal, targetStatus)) {
    throw new Error(
      `Cannot cancel deal: deal is in ${deal.status} status and cannot be cancelled.`
    );
  }

  const previousStatus = deal.status;
  const now = new Date();

  const updatedDeal = await prisma.$transaction(async (tx) => {
    const updated = await tx.deal.update({
      where: { id: dealId },
      data: { status: targetStatus },
    });

    // Deactivate all phases
    await tx.dealPhase.updateMany({
      where: { dealId, isActive: true },
      data: { isActive: false, endsAt: now },
    });

    // Mark all pending contributions as needing refund
    const pendingContributions = await tx.contribution.findMany({
      where: { dealId, status: { in: ["PENDING", "CONFIRMED"] } },
      select: { id: true, userId: true, amount: true },
    });

    if (pendingContributions.length > 0) {
      await tx.contribution.updateMany({
        where: {
          dealId,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        data: { status: "REFUNDED", refundedAt: now },
      });
    }

    // Log refund trigger
    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: "DEAL_CANCEL_REFUNDS_TRIGGERED",
        resourceType: "Deal",
        resourceId: dealId,
        metadata: {
          contributionsToRefund: pendingContributions.length,
          totalRefundAmount: pendingContributions
            .reduce((sum, c) => sum + Number(c.amount), 0)
            .toString(),
        },
      },
    });

    return updated;
  });

  await logAuditEvent(adminId, "DEAL_CANCELLED", "Deal", dealId, {
    previousStatus,
    newStatus: targetStatus,
  });

  return {
    success: true,
    deal: updatedDeal,
    previousStatus,
    newStatus: targetStatus,
    message: "Deal cancelled. Refund process initiated for all contributions.",
  };
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Upsert a DealPhase record. If a phase with the same name exists for
 * the deal, update it; otherwise create it.
 */
async function upsertDealPhase(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  dealId: string,
  phaseName: string,
  phaseOrder: number,
  startsAt: Date,
  endsAt: Date | null
): Promise<DealPhase> {
  const existing = await tx.dealPhase.findFirst({
    where: { dealId, phaseName },
  });

  const effectiveEndsAt = endsAt ?? new Date(startsAt.getTime() + 7 * 24 * 60 * 60 * 1000);

  if (existing) {
    return tx.dealPhase.update({
      where: { id: existing.id },
      data: { startsAt, endsAt: effectiveEndsAt, isActive: true },
    });
  }

  return tx.dealPhase.create({
    data: {
      dealId,
      phaseName,
      phaseOrder,
      startsAt,
      endsAt: effectiveEndsAt,
      isActive: true,
    },
  });
}

/**
 * Sync DealPhase isActive flags based on the current deal status.
 * Activates the phase matching the current status and deactivates others.
 */
async function syncPhaseActiveFlags(
  dealId: string,
  currentStatus: DealStatus
): Promise<void> {
  const statusToPhase: Partial<Record<DealStatus, string>> = {
    REGISTRATION_OPEN: "Registration",
    GUARANTEED_ALLOCATION: "Guaranteed Allocation",
    FCFS: "FCFS Overflow",
    SETTLEMENT: "Settlement",
    DISTRIBUTING: "Distribution",
  };

  const activePhase = statusToPhase[currentStatus];

  // Deactivate all phases first
  await prisma.dealPhase.updateMany({
    where: { dealId, isActive: true },
    data: { isActive: false },
  });

  // Activate the matching phase if one exists
  if (activePhase) {
    await prisma.dealPhase.updateMany({
      where: { dealId, phaseName: activePhase },
      data: { isActive: true },
    });
  }
}

/**
 * Get the list of valid phase names used by the lifecycle system.
 */
export function getPhaseNames(): readonly string[] {
  return PHASE_NAMES;
}

/**
 * Get the mapping of action names to target statuses.
 * Useful for API routes to resolve an action string to the appropriate function.
 */
export function getActionStatusMap(): Record<string, DealStatus> {
  return { ...ACTION_STATUS_MAP };
}
