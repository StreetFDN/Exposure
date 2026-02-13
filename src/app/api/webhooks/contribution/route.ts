// =============================================================================
// POST /api/webhooks/contribution — Webhook for on-chain contribution events
// =============================================================================
//
// This endpoint is called by the blockchain indexer (e.g., Goldsky, The Graph,
// or a custom indexer) when a contribution transaction is confirmed on-chain.
// It validates the webhook secret, then processes the contribution confirmation.
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  apiResponse,
  apiError,
  handleApiError,
  validateBody,
} from "@/lib/utils/api";
import { withRateLimit, getClientIp } from "@/lib/utils/rate-limit";

// ---------------------------------------------------------------------------
// Webhook secret validation
// ---------------------------------------------------------------------------

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "webhook-dev-secret-change-in-production";

function validateWebhookSignature(request: NextRequest): boolean {
  const signature = request.headers.get("x-webhook-signature");
  const timestamp = request.headers.get("x-webhook-timestamp");

  if (!signature || !timestamp) return false;

  // Prevent replay attacks — reject timestamps older than 5 minutes
  const timestampMs = parseInt(timestamp, 10);
  if (isNaN(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    return false;
  }

  // TODO: Implement proper HMAC signature verification in production
  return signature === WEBHOOK_SECRET;
}

// ---------------------------------------------------------------------------
// Webhook payload schema
// ---------------------------------------------------------------------------

const webhookPayloadSchema = z.object({
  eventType: z.enum([
    "CONTRIBUTION_CONFIRMED",
    "CONTRIBUTION_FAILED",
    "CONTRIBUTION_REVERTED",
  ]),
  data: z.object({
    txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
    blockNumber: z.number().int().positive(),
    blockTimestamp: z.number().int().positive(),
    chain: z.enum(["ETHEREUM", "ARBITRUM", "BASE"]),
    from: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    amount: z.string(),
    tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    tokenSymbol: z.string(),
    tokenDecimals: z.number().int().min(0).max(18),
    dealId: z.string().optional(),
    logIndex: z.number().int().min(0),
    confirmations: z.number().int().min(1),
  }),
  idempotencyKey: z.string().min(1),
  timestamp: z.number().int().positive(),
});

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 100 requests per minute per IP
    const ip = getClientIp(request);
    const rateLimited = withRateLimit(request, `webhook-contribution:${ip}`, 100, 60_000);
    if (rateLimited) return rateLimited;

    // 1. Validate webhook signature
    if (!validateWebhookSignature(request)) {
      return apiError("Invalid webhook signature", 401, "INVALID_SIGNATURE");
    }

    // 2. Parse and validate the payload
    const payload = await validateBody(request, webhookPayloadSchema);

    // 3. Process based on event type
    switch (payload.eventType) {
      case "CONTRIBUTION_CONFIRMED": {
        // Find the matching contribution record by txHash
        const contribution = await prisma.contribution.findUnique({
          where: { txHash: payload.data.txHash },
        });

        if (!contribution) {
          // No matching contribution found — log and return
          console.warn(
            `[Webhook] No contribution found for txHash: ${payload.data.txHash}`
          );
          return apiResponse({
            status: "skipped",
            reason: "no_matching_contribution",
            txHash: payload.data.txHash,
            processedAt: new Date().toISOString(),
          });
        }

        // Skip if already confirmed (idempotency)
        if (contribution.status === "CONFIRMED") {
          return apiResponse({
            status: "already_processed",
            txHash: payload.data.txHash,
            processedAt: new Date().toISOString(),
          });
        }

        // Update contribution status to CONFIRMED and update deal totals in a transaction
        await prisma.$transaction(async (tx) => {
          // Update contribution
          await tx.contribution.update({
            where: { txHash: payload.data.txHash },
            data: {
              status: "CONFIRMED",
              confirmedAt: new Date(payload.data.blockTimestamp * 1000),
              blockNumber: payload.data.blockNumber,
            },
          });

          // Update deal's totalRaised and contributorCount
          await tx.deal.update({
            where: { id: contribution.dealId },
            data: {
              totalRaised: {
                increment: contribution.amountUsd,
              },
              contributorCount: {
                increment: 1,
              },
            },
          });

          // Update user's totalContributed
          await tx.user.update({
            where: { id: contribution.userId },
            data: {
              totalContributed: {
                increment: contribution.amountUsd,
              },
            },
          });

          // Create notification for user
          await tx.notification.create({
            data: {
              userId: contribution.userId,
              type: "DEAL_ALERT",
              title: "Contribution Confirmed",
              message: `Your contribution of $${Number(contribution.amountUsd).toLocaleString()} has been confirmed on-chain.`,
              data: {
                txHash: payload.data.txHash,
                dealId: contribution.dealId,
                amount: contribution.amountUsd.toString(),
              },
            },
          });
        });

        // Check if deal has reached hard cap
        const deal = await prisma.deal.findUnique({
          where: { id: contribution.dealId },
          select: { totalRaised: true, hardCap: true, status: true },
        });
        if (
          deal &&
          Number(deal.totalRaised) >= Number(deal.hardCap) &&
          deal.status !== "SETTLEMENT"
        ) {
          await prisma.deal.update({
            where: { id: contribution.dealId },
            data: { status: "SETTLEMENT" },
          });
        }

        console.log(
          `[Webhook] Contribution confirmed: ${payload.data.txHash} on ${payload.data.chain}`
        );

        return apiResponse({
          status: "processed",
          eventType: payload.eventType,
          txHash: payload.data.txHash,
          processedAt: new Date().toISOString(),
        });
      }

      case "CONTRIBUTION_FAILED": {
        // Find and update contribution status to FAILED
        const failedContribution = await prisma.contribution.findUnique({
          where: { txHash: payload.data.txHash },
        });

        if (failedContribution && failedContribution.status !== "FAILED") {
          await prisma.contribution.update({
            where: { txHash: payload.data.txHash },
            data: { status: "FAILED" },
          });

          // Notify user about the failure
          await prisma.notification.create({
            data: {
              userId: failedContribution.userId,
              type: "DEAL_ALERT",
              title: "Contribution Failed",
              message: `Your contribution transaction has failed. Please try again or contact support.`,
              data: {
                txHash: payload.data.txHash,
                dealId: failedContribution.dealId,
              },
            },
          });
        }

        console.log(
          `[Webhook] Contribution failed: ${payload.data.txHash} on ${payload.data.chain}`
        );

        return apiResponse({
          status: "processed",
          eventType: payload.eventType,
          txHash: payload.data.txHash,
          processedAt: new Date().toISOString(),
        });
      }

      case "CONTRIBUTION_REVERTED": {
        // Find the contribution
        const revertedContribution = await prisma.contribution.findUnique({
          where: { txHash: payload.data.txHash },
        });

        if (revertedContribution && revertedContribution.status === "CONFIRMED") {
          // Use a transaction to revert the contribution and adjust deal totals
          await prisma.$transaction(async (tx) => {
            // Update contribution status to FAILED (reverted)
            await tx.contribution.update({
              where: { txHash: payload.data.txHash },
              data: { status: "FAILED" },
            });

            // Decrement deal totalRaised and contributorCount
            await tx.deal.update({
              where: { id: revertedContribution.dealId },
              data: {
                totalRaised: {
                  decrement: revertedContribution.amountUsd,
                },
                contributorCount: {
                  decrement: 1,
                },
              },
            });

            // Decrement user totalContributed
            await tx.user.update({
              where: { id: revertedContribution.userId },
              data: {
                totalContributed: {
                  decrement: revertedContribution.amountUsd,
                },
              },
            });

            // Notify user
            await tx.notification.create({
              data: {
                userId: revertedContribution.userId,
                type: "DEAL_ALERT",
                title: "Contribution Reverted",
                message: `Your contribution transaction was reverted on-chain. Please contact support if you have questions.`,
                data: {
                  txHash: payload.data.txHash,
                  dealId: revertedContribution.dealId,
                },
              },
            });

            // Create compliance flag for reverted transactions
            await tx.complianceFlag.create({
              data: {
                userId: revertedContribution.userId,
                dealId: revertedContribution.dealId,
                contributionId: revertedContribution.id,
                reason: "RAPID_ACTIVITY",
                severity: "MEDIUM",
                description: `Contribution transaction ${payload.data.txHash} was reverted on ${payload.data.chain}. Automatically flagged for review.`,
              },
            });
          });
        }

        console.log(
          `[Webhook] Contribution reverted: ${payload.data.txHash} on ${payload.data.chain}`
        );

        return apiResponse({
          status: "processed",
          eventType: payload.eventType,
          txHash: payload.data.txHash,
          processedAt: new Date().toISOString(),
        });
      }

      default:
        return apiError("Unknown event type", 400, "UNKNOWN_EVENT");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid webhook signature") {
      return handleApiError(error);
    }

    console.error("[Webhook Error]", error);
    return handleApiError(error);
  }
}
