// =============================================================================
// GET /api/auth/session — Return current session user info from cookie
// =============================================================================

import { NextRequest } from "next/server";
import { getSession, apiResponse, handleApiError } from "@/lib/utils/api";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Role mapping helper
// ---------------------------------------------------------------------------

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
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSession(request);

    if (!sessionUser) {
      return apiResponse({ user: null });
    }

    // Fetch fresh user data from DB to get latest kycStatus, tierLevel, etc.
    const freshUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    });

    if (!freshUser) {
      // User was deleted from DB but still has a valid cookie
      return apiResponse({ user: null });
    }

    return apiResponse({
      user: {
        id: freshUser.id,
        walletAddress: freshUser.walletAddress,
        role: mapRole(freshUser.role),
        kycStatus: freshUser.kycStatus,
        tierLevel: mapTierLevel(freshUser.tierLevel),
        displayName: freshUser.displayName,
        email: freshUser.email,
        avatarUrl: freshUser.avatarUrl,
        totalPoints: freshUser.totalPoints,
        referralCode: freshUser.referralCode,
        createdAt: freshUser.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
