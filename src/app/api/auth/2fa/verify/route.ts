// =============================================================================
// POST /api/auth/2fa/verify -- Verify TOTP code and enable 2FA for the user
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
import {
  verifyTOTP,
  generateBackupCodes,
  hashBackupCode,
} from "@/lib/utils/totp";
import {
  getPendingSecret,
  consumePendingSecret,
} from "@/app/api/auth/2fa/setup/route";

// ---------------------------------------------------------------------------
// Request body schema
// ---------------------------------------------------------------------------

const verifySchema = z.object({
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
    const { code } = await validateBody(request, verifySchema);

    // Retrieve the pending secret from the setup step
    const pending = await getPendingSecret(sessionUser.id);

    if (!pending) {
      return apiError(
        "No pending 2FA setup found. Please start the setup process first.",
        400,
        "NO_PENDING_SETUP"
      );
    }

    // Verify the TOTP code against the pending secret
    const isValid = verifyTOTP(pending.secret, code);

    if (!isValid) {
      return apiError(
        "Invalid verification code. Please check and try again.",
        401,
        "INVALID_CODE"
      );
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(8);
    const hashedBackupCodes = backupCodes.map(hashBackupCode);

    // Enable 2FA for the user and store encrypted secret + hashed backup codes
    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: pending.encryptedSecret,
      },
    });

    // Clean up the pending secret
    await consumePendingSecret(sessionUser.id);

    // Log the action in audit trail
    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: "TWO_FA_ENABLED",
        resourceType: "User",
        resourceId: sessionUser.id,
        metadata: {
          backupCodesGenerated: backupCodes.length,
          backupCodeHashes: hashedBackupCodes,
        },
      },
    });

    return apiResponse({
      enabled: true,
      backupCodes,
      message:
        "Two-factor authentication has been enabled. Save your backup codes in a secure location.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
