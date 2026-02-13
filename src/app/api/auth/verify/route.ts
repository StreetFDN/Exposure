// =============================================================================
// POST /api/auth/verify — Verify SIWE signature and create session
// =============================================================================

import { NextRequest } from "next/server";
import { SiweMessage } from "siwe";
import { z } from "zod";
import {
  apiResponse,
  apiError,
  handleApiError,
  validateBody,
  setSessionCookie,
  type SessionUser,
} from "@/lib/utils/api";
import { withRateLimit, getClientIp } from "@/lib/utils/rate-limit";
import { consumeNonce } from "@/app/api/auth/nonce/route";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Request body schema
// ---------------------------------------------------------------------------

const verifySchema = z.object({
  message: z.string().min(1, "SIWE message is required"),
  signature: z.string().min(1, "Signature is required"),
});

// ---------------------------------------------------------------------------
// Role mapping helpers
// ---------------------------------------------------------------------------

// Map Prisma UserRole to session role for backward compatibility
function mapRole(role: string): "USER" | "ADMIN" | "SUPER_ADMIN" {
  switch (role) {
    case "SUPER_ADMIN":
      return "SUPER_ADMIN";
    case "PLATFORM_ADMIN":
    case "PROJECT_ADMIN":
    case "COMPLIANCE_OFFICER":
      return "ADMIN";
    default:
      return "USER";
  }
}

// Map Prisma TierLevel to session tier (Prisma has no NONE, default is BRONZE)
function mapTierLevel(
  tier: string | null
): "NONE" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND" {
  if (!tier) return "NONE";
  switch (tier) {
    case "BRONZE":
    case "SILVER":
    case "GOLD":
    case "PLATINUM":
    case "DIAMOND":
      return tier;
    default:
      return "NONE";
  }
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 requests per minute per IP
    const ip = getClientIp(request);
    const rateLimited = withRateLimit(request, `verify:${ip}`, 5, 60_000);
    if (rateLimited) return rateLimited;

    const { message, signature } = await validateBody(request, verifySchema);

    // Parse the SIWE message
    let siweMessage: SiweMessage;
    try {
      siweMessage = new SiweMessage(message);
    } catch {
      return apiError("Invalid SIWE message format", 400, "INVALID_SIWE_MESSAGE");
    }

    // Verify the nonce was previously generated and not expired
    if (!consumeNonce(siweMessage.nonce)) {
      return apiError("Invalid or expired nonce", 400, "INVALID_NONCE");
    }

    // Verify the SIWE signature
    try {
      await siweMessage.verify({ signature });
    } catch {
      return apiError("Invalid signature", 401, "INVALID_SIGNATURE");
    }

    // TODO: Verify domain matches expected domain
    // if (siweMessage.domain !== expectedDomain) { ... }

    // Upsert user record in the database
    const walletAddress = siweMessage.address;

    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: {
        lastLoginAt: new Date(),
      },
      create: {
        walletAddress,
        role: "INVESTOR",
        kycStatus: "NONE",
        tierLevel: "BRONZE",
      },
    });

    // Build the session
    const sessionUser: SessionUser = {
      id: user.id,
      walletAddress: user.walletAddress,
      role: mapRole(user.role),
      kycStatus: user.kycStatus as SessionUser["kycStatus"],
      tierLevel: mapTierLevel(user.tierLevel),
    };

    // Create response with session cookie
    const response = apiResponse({
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        role: mapRole(user.role),
        kycStatus: user.kycStatus,
        tierLevel: mapTierLevel(user.tierLevel),
        displayName: user.displayName,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      },
    });

    return setSessionCookie(response, sessionUser);
  } catch (error) {
    return handleApiError(error);
  }
}
