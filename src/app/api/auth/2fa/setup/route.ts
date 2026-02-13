// =============================================================================
// POST /api/auth/2fa/setup -- Generate TOTP secret for the authenticated user
// =============================================================================

import { NextRequest } from "next/server";
import {
  requireAuth,
  apiResponse,
  apiError,
  handleApiError,
} from "@/lib/utils/api";
import { prisma } from "@/lib/prisma";
import { generateSecret, encryptSecret } from "@/lib/utils/totp";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PENDING_2FA_KEY_PREFIX = "2fa_pending:";
const PENDING_2FA_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ---------------------------------------------------------------------------
// Database-backed store for pending (unverified) TOTP secrets.
// ---------------------------------------------------------------------------

async function cleanPendingSecrets() {
  try {
    const allPending = await prisma.platformConfig.findMany({
      where: {
        key: { startsWith: PENDING_2FA_KEY_PREFIX },
      },
      select: { key: true, value: true },
    });

    const now = Date.now();
    const expiredKeys = allPending
      .filter((entry) => {
        try {
          const parsed = JSON.parse(entry.value);
          return parsed.createdAt < now - PENDING_2FA_TTL_MS;
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
    console.error("[2fa cleanup] Failed to clean pending secrets:", error);
  }
}

/**
 * Retrieve a pending secret for a given user. Used by the verify route.
 */
export async function getPendingSecret(
  userId: string
): Promise<{ secret: string; encryptedSecret: string } | undefined> {
  await cleanPendingSecrets();

  const entry = await prisma.platformConfig.findUnique({
    where: { key: `${PENDING_2FA_KEY_PREFIX}${userId}` },
  });

  if (!entry) return undefined;

  try {
    const parsed = JSON.parse(entry.value);

    // Check if expired
    if (parsed.createdAt < Date.now() - PENDING_2FA_TTL_MS) {
      await prisma.platformConfig.delete({
        where: { key: entry.key },
      });
      return undefined;
    }

    return { secret: parsed.secret, encryptedSecret: parsed.encryptedSecret };
  } catch {
    return undefined;
  }
}

/**
 * Remove a pending secret after successful verification.
 */
export async function consumePendingSecret(userId: string): Promise<void> {
  try {
    await prisma.platformConfig.delete({
      where: { key: `${PENDING_2FA_KEY_PREFIX}${userId}` },
    });
  } catch {
    // Entry may already be deleted; ignore
  }
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireAuth(request);

    // Check if user already has 2FA enabled
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { twoFactorEnabled: true, walletAddress: true },
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    if (user.twoFactorEnabled) {
      return apiError(
        "Two-factor authentication is already enabled. Disable it first to reconfigure.",
        409,
        "TWO_FA_ALREADY_ENABLED"
      );
    }

    // Generate a new TOTP secret
    const { secret, uri } = generateSecret(user.walletAddress);
    const encryptedSecret = encryptSecret(secret);

    // Store temporarily until verified (upsert in case there's an existing pending setup)
    await cleanPendingSecrets();
    await prisma.platformConfig.upsert({
      where: { key: `${PENDING_2FA_KEY_PREFIX}${sessionUser.id}` },
      update: {
        value: JSON.stringify({
          secret,
          encryptedSecret,
          createdAt: Date.now(),
        }),
      },
      create: {
        key: `${PENDING_2FA_KEY_PREFIX}${sessionUser.id}`,
        value: JSON.stringify({
          secret,
          encryptedSecret,
          createdAt: Date.now(),
        }),
        description: "Pending 2FA TOTP secret",
      },
    });

    return apiResponse({
      secret,
      uri,
      qrDataUrl: uri, // Frontend can render this as a QR code
    });
  } catch (error) {
    return handleApiError(error);
  }
}
