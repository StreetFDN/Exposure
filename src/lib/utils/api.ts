// =============================================================================
// Exposure — API Utility Functions
// Shared helpers for Route Handlers: auth, validation, pagination, responses.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

// =============================================================================
// Types
// =============================================================================

export interface SessionUser {
  id: string;
  walletAddress: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  kycStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  tierLevel: "NONE" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

// =============================================================================
// Session Cookie Name
// =============================================================================

const SESSION_COOKIE = "exposure_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "exposure-dev-secret-change-in-production";

// =============================================================================
// Cookie Signing (HMAC-based for development; replace with proper JWT in prod)
// =============================================================================

function signPayload(payload: string): string {
  const hmac = crypto.createHmac("sha256", SESSION_SECRET);
  hmac.update(payload);
  return hmac.digest("hex");
}

function verifySignedCookie(value: string): SessionUser | null {
  const parts = value.split(".");
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expectedSignature = signPayload(payload);

  if (signature !== expectedSignature) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));

    // Check expiry
    if (decoded.exp && decoded.exp < Date.now()) return null;

    return {
      id: decoded.id,
      walletAddress: decoded.walletAddress,
      role: decoded.role,
      kycStatus: decoded.kycStatus,
      tierLevel: decoded.tierLevel,
    };
  } catch {
    return null;
  }
}

// =============================================================================
// createSessionCookie — Build a signed session cookie value
// =============================================================================

export function createSessionCookie(user: SessionUser): string {
  const payload = {
    id: user.id,
    walletAddress: user.walletAddress,
    role: user.role,
    kycStatus: user.kycStatus,
    tierLevel: user.tierLevel,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = signPayload(encoded);
  return `${encoded}.${signature}`;
}

// =============================================================================
// getSession — Extract and verify session from cookie
// =============================================================================

export async function getSession(request: NextRequest): Promise<SessionUser | null> {
  const cookieValue = request.cookies.get(SESSION_COOKIE)?.value;
  if (!cookieValue) return null;
  return verifySignedCookie(cookieValue);
}

// =============================================================================
// requireAuth — Throws 401 if not authenticated, returns user
// =============================================================================

export async function requireAuth(request: NextRequest): Promise<SessionUser> {
  const user = await getSession(request);
  if (!user) {
    throw new ApiError("Authentication required", 401);
  }
  return user;
}

// =============================================================================
// requireAdmin — Throws 403 if not admin, returns user
// =============================================================================

export async function requireAdmin(request: NextRequest): Promise<SessionUser> {
  const user = await requireAuth(request);
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new ApiError("Admin access required", 403);
  }
  return user;
}

// =============================================================================
// ApiError — Custom error class for API routes
// =============================================================================

export class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: Record<string, unknown>;

  constructor(
    message: string,
    status: number = 400,
    code?: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code || this.deriveCode(status);
    this.details = details;
  }

  private deriveCode(status: number): string {
    switch (status) {
      case 400:
        return "BAD_REQUEST";
      case 401:
        return "UNAUTHORIZED";
      case 403:
        return "FORBIDDEN";
      case 404:
        return "NOT_FOUND";
      case 409:
        return "CONFLICT";
      case 422:
        return "VALIDATION_ERROR";
      case 429:
        return "RATE_LIMITED";
      default:
        return "INTERNAL_ERROR";
    }
  }
}

// =============================================================================
// apiResponse — Standardized success response
// =============================================================================

export function apiResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      error: null,
      meta: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

// =============================================================================
// apiError — Standardized error response
// =============================================================================

export function apiError(
  message: string,
  status: number = 400,
  code?: string,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: {
        code: code || new ApiError(message, status).code,
        message,
        details: details || undefined,
      },
      meta: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

// =============================================================================
// handleApiError — Catch-all error handler for route handlers
// =============================================================================

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return apiError(error.message, error.status, error.code, error.details);
  }

  // Zod 4 uses a constructor-based ZodError; check for issues array as a duck-type fallback
  if (
    error instanceof z.ZodError ||
    (error instanceof Error && "issues" in error && Array.isArray((error as { issues: unknown[] }).issues))
  ) {
    const zodError = error as { issues: Array<{ path: PropertyKey[]; message: string }> };
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of zodError.issues) {
      const path = issue.path.map(String).join(".");
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    return apiError("Validation failed", 422, "VALIDATION_ERROR", { fields: fieldErrors });
  }

  console.error("[API Error]", error);
  return apiError("Internal server error", 500);
}

// =============================================================================
// validateBody — Validate request body against zod schema
// =============================================================================

export async function validateBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ApiError("Invalid JSON body", 400);
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.map(String).join(".");
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    throw new ApiError("Validation failed", 422, "VALIDATION_ERROR", { fields: fieldErrors });
  }

  return result.data;
}

// =============================================================================
// parsePagination — Extract page/limit from query params with defaults
// =============================================================================

export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

// =============================================================================
// setSessionCookie — Write the session cookie to the response
// =============================================================================

export function setSessionCookie(response: NextResponse, user: SessionUser): NextResponse {
  const cookieValue = createSessionCookie(user);
  response.cookies.set(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });
  return response;
}

// =============================================================================
// clearSessionCookie — Remove the session cookie
// =============================================================================

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
