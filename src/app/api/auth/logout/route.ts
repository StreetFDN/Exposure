// =============================================================================
// POST /api/auth/logout — Clear session cookie
// =============================================================================

import { NextRequest } from "next/server";
import { apiResponse, clearSessionCookie, handleApiError } from "@/lib/utils/api";

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(_request: NextRequest) {
  try {
    // TODO: If using server-side sessions (Redis/DB), invalidate the session record here

    const response = apiResponse({ success: true });
    return clearSessionCookie(response);
  } catch (error) {
    return handleApiError(error);
  }
}
