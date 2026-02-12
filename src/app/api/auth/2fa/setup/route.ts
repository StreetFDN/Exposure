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
// In-memory store for pending (unverified) TOTP secrets.
// In production this should be replaced with Redis or a DB column.
// ---------------------------------------------------------------------------

const pendingSecrets = new Map<
  string,
  { secret: string; encryptedSecret: string; createdAt: number }
>();

// Clean up stale entries older than 10 minutes
function cleanPendingSecrets() {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const [key, entry] of pendingSecrets) {
    if (entry.createdAt < tenMinutesAgo) {
      pendingSecrets.delete(key);
    }
  }
}

/**
 * Retrieve a pending secret for a given user. Used by the verify route.
 */
export function getPendingSecret(
  userId: string
): { secret: string; encryptedSecret: string } | undefined {
  cleanPendingSecrets();
  const entry = pendingSecrets.get(userId);
  if (!entry) return undefined;
  return { secret: entry.secret, encryptedSecret: entry.encryptedSecret };
}

/**
 * Remove a pending secret after successful verification.
 */
export function consumePendingSecret(userId: string): void {
  pendingSecrets.delete(userId);
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

    // Store temporarily until verified
    cleanPendingSecrets();
    pendingSecrets.set(sessionUser.id, {
      secret,
      encryptedSecret,
      createdAt: Date.now(),
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
