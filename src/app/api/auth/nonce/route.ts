// =============================================================================
// GET /api/auth/nonce — Generate a random nonce for SIWE (Sign-In with Ethereum)
// =============================================================================

import { NextRequest } from "next/server";
import crypto from "crypto";
import { apiResponse, handleApiError } from "@/lib/utils/api";
import { withRateLimit, getClientIp } from "@/lib/utils/rate-limit";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const NONCE_KEY_PREFIX = "nonce:";

// ---------------------------------------------------------------------------
// Cleanup expired nonces (older than 5 minutes)
// ---------------------------------------------------------------------------

async function cleanupExpiredNonces() {
  try {
    // Delete all nonce entries whose stored expiresAt has passed
    const allNonces = await prisma.platformConfig.findMany({
      where: {
        key: { startsWith: NONCE_KEY_PREFIX },
      },
      select: { key: true, value: true },
    });

    const now = Date.now();
    const expiredKeys = allNonces
      .filter((entry) => {
        try {
          const parsed = JSON.parse(entry.value);
          return parsed.expiresAt < now;
        } catch {
          return true; // Delete malformed entries
        }
      })
      .map((entry) => entry.key);

    if (expiredKeys.length > 0) {
      await prisma.platformConfig.deleteMany({
        where: { key: { in: expiredKeys } },
      });
    }
  } catch (error) {
    console.error("[nonce cleanup] Failed to clean expired nonces:", error);
  }
}

// ---------------------------------------------------------------------------
// Exported helpers for the verify route
// ---------------------------------------------------------------------------

export async function consumeNonce(nonce: string): Promise<boolean> {
  try {
    // Clean up expired nonces opportunistically
    await cleanupExpiredNonces();

    // Direct lookup by key since nonce is part of the key
    const nonceKey = `${NONCE_KEY_PREFIX}${nonce}`;
    const entry = await prisma.platformConfig.findUnique({
      where: { key: nonceKey },
    });

    if (!entry) return false;

    // Delete immediately (single-use)
    await prisma.platformConfig.delete({
      where: { key: nonceKey },
    });

    // Check if expired
    try {
      const parsed = JSON.parse(entry.value);
      if (parsed.expiresAt < Date.now()) {
        return false;
      }
    } catch {
      return false;
    }

    return true;
  } catch (error) {
    console.error("[consumeNonce] Error:", error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest) {
  try {
    // Rate limit: 20 requests per minute per IP
    const ip = getClientIp(_request);
    const rateLimited = withRateLimit(_request, `nonce:${ip}`, 20, 60_000);
    if (rateLimited) return rateLimited;

    // Clean up expired nonces
    await cleanupExpiredNonces();

    const nonce = crypto.randomBytes(16).toString("hex");
    const now = Date.now();
    const nonceKey = `${NONCE_KEY_PREFIX}${nonce}`;

    await prisma.platformConfig.create({
      data: {
        key: nonceKey,
        value: JSON.stringify({
          nonce,
          createdAt: now,
          expiresAt: now + NONCE_TTL_MS,
        }),
        description: "SIWE nonce",
      },
    });

    return apiResponse({ nonce });
  } catch (error) {
    return handleApiError(error);
  }
}
