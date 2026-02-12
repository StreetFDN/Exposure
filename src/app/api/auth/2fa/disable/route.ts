// =============================================================================
// POST /api/auth/2fa/disable -- Disable 2FA for the authenticated user
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import {
  requireAuth,
  apiResponse,
  apiError,
  handleApiError,
  validateBody,
} from "@/lib/utils/api";
import { prisma } from "@/lib/prisma";
import { verifyTOTP, decryptSecret } from "@/lib/utils/totp";

// ---------------------------------------------------------------------------
// Request body schema
// ---------------------------------------------------------------------------

const disableSchema = z.object({
  code: z
    .string()
    .length(6, "Code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Code must contain only digits"),
});

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireAuth(request);
    const { code } = await validateBody(request, disableSchema);

    // Look up the user's encrypted TOTP secret
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return apiError(
        "Two-factor authentication is not currently enabled.",
        400,
        "TWO_FA_NOT_ENABLED"
      );
    }

    // Verify the code before disabling
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
          action: "TWO_FA_DISABLE_FAILED",
          resourceType: "User",
          resourceId: user.id,
          metadata: {
            reason: "Invalid code",
            timestamp: new Date().toISOString(),
          },
        },
      });

      return apiError(
        "Invalid verification code. 2FA was not disabled.",
        401,
        "INVALID_CODE"
      );
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "TWO_FA_DISABLED",
        resourceType: "User",
        resourceId: user.id,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
    });

    return apiResponse({
      disabled: true,
      message: "Two-factor authentication has been disabled.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
