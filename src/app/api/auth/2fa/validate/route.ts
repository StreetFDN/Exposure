// =============================================================================
// POST /api/auth/2fa/validate -- Validate TOTP code for sensitive actions
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import {
  getSession,
  apiResponse,
  apiError,
  handleApiError,
  validateBody,
} from "@/lib/utils/api";
import { prisma } from "@/lib/prisma";
import {
  verifyTOTP,
  decryptSecret,
  generateActionToken,
} from "@/lib/utils/totp";

// ---------------------------------------------------------------------------
// Request body schema
// ---------------------------------------------------------------------------

const validateSchema = z.object({
  code: z
    .string()
    .length(6, "Code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Code must contain only digits"),
  action: z.enum(["login", "contribute", "withdraw", "settings"], {
    message: "Action must be one of: login, contribute, withdraw, settings",
  }),
});

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // For login validation, the user may not have a full session yet,
    // but we still need some identifier. We check session first, then
    // fall back to a userId in the body for login flows.
    const sessionUser = await getSession(request);

    const body = await validateBody(request, validateSchema);
    const { code, action } = body;

    // Determine which user to validate for
    let userId: string | null = sessionUser?.id || null;

    if (!userId) {
      return apiError("Authentication required", 401);
    }

    // Look up the user's encrypted TOTP secret
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        walletAddress: true,
      },
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return apiError(
        "Two-factor authentication is not enabled for this account.",
        400,
        "TWO_FA_NOT_ENABLED"
      );
    }

    // Decrypt the secret and verify the code
    let decrypted: string;
    try {
      decrypted = decryptSecret(user.twoFactorSecret);
    } catch {
      return apiError(
        "Failed to decrypt 2FA secret. Please contact support.",
        500,
        "DECRYPTION_FAILED"
      );
    }

    const isValid = verifyTOTP(decrypted, code);

    if (!isValid) {
      // Log failed attempt
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "TWO_FA_VALIDATION_FAILED",
          resourceType: "User",
          resourceId: user.id,
          metadata: { action, timestamp: new Date().toISOString() },
        },
      });

      return apiError(
        "Invalid verification code.",
        401,
        "INVALID_CODE"
      );
    }

    // Generate a short-lived action token (5-minute TTL)
    const actionToken = generateActionToken(user.id, action);

    // Log successful validation
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "TWO_FA_VALIDATED",
        resourceType: "User",
        resourceId: user.id,
        metadata: {
          action,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return apiResponse({
      valid: true,
      actionToken,
      expiresIn: 300, // 5 minutes in seconds
    });
  } catch (error) {
    return handleApiError(error);
  }
}
