import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Route classifications
// ---------------------------------------------------------------------------

/** Fully public — no auth needed at all. */
const PUBLIC_PATHS = [
  "/",
  "/onboarding",
  "/api/auth",
  "/api/health",
  "/api/staking/tiers",
];

/**
 * Semi-public — pages can be viewed without auth (browse deals/groups),
 * but mutating API calls within these routes still require auth.
 */
const SEMI_PUBLIC_PATHS = ["/deals", "/groups"];

/** Admin routes — require auth + admin role. */
const ADMIN_PATHS = ["/admin"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function isSemiPublicPath(pathname: string): boolean {
  return SEMI_PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot|css|js|map)$/.test(
      pathname
    )
  );
}

function isMutatingMethod(method: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  return response;
}

function addCorsHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  response.headers.set(
    "Access-Control-Allow-Origin",
    process.env.NEXT_PUBLIC_PLATFORM_URL || "http://localhost:3000"
  );
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-webhook-signature, x-webhook-timestamp"
  );
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ------------------------------------------------------------------
  // 1. Static assets — pass through immediately (no headers needed)
  // ------------------------------------------------------------------
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // ------------------------------------------------------------------
  // 2. CORS pre-flight for API routes
  // ------------------------------------------------------------------
  if (pathname.startsWith("/api/")) {
    if (request.method === "OPTIONS") {
      const preflightResponse = new NextResponse(null, { status: 204 });
      addCorsHeaders(preflightResponse, request);
      addSecurityHeaders(preflightResponse);
      return preflightResponse;
    }
  }

  // ------------------------------------------------------------------
  // 3. Public paths — always allow through
  // ------------------------------------------------------------------
  if (isPublicPath(pathname)) {
    const response = NextResponse.next();
    addSecurityHeaders(response);
    if (pathname.startsWith("/api/")) {
      addCorsHeaders(response, request);
    }
    return response;
  }

  // ------------------------------------------------------------------
  // 4. Semi-public paths (deals, groups)
  //    - Page routes (GET on non-API): allow without auth so users can browse
  //    - API routes or mutating requests: require auth
  // ------------------------------------------------------------------
  if (isSemiPublicPath(pathname)) {
    const isApiRoute = pathname.startsWith("/api/");
    const isMutating = isMutatingMethod(request.method);

    // Allow page views (non-API GET requests) without auth
    if (!isApiRoute && !isMutating) {
      const response = NextResponse.next();
      addSecurityHeaders(response);
      return response;
    }

    // API/mutating calls within semi-public paths still need auth — fall
    // through to the auth check below
  }

  // ------------------------------------------------------------------
  // 5. Auth check — everything below requires a valid session
  // ------------------------------------------------------------------
  const sessionCookie = request.cookies.get("exposure_session");
  const kycStatusCookie = request.cookies.get("exposure_kyc_status");

  if (!sessionCookie?.value) {
    // No session at all
    if (pathname.startsWith("/api/")) {
      const errorResponse = NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
      addSecurityHeaders(errorResponse);
      addCorsHeaders(errorResponse, request);
      return errorResponse;
    }

    // Redirect to onboarding for page routes
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // ------------------------------------------------------------------
  // 6. KYC gate — session exists but KYC not yet approved
  //    Redirect to onboarding step 2 (assessment / KYC).
  // ------------------------------------------------------------------
  const kycStatus = kycStatusCookie?.value;
  if (kycStatus && kycStatus !== "approved") {
    // API calls get a 403
    if (pathname.startsWith("/api/")) {
      const errorResponse = NextResponse.json(
        {
          success: false,
          error: "KYC verification required. Complete onboarding to proceed.",
        },
        { status: 403 }
      );
      addSecurityHeaders(errorResponse);
      addCorsHeaders(errorResponse, request);
      return errorResponse;
    }

    // Page routes — redirect to onboarding at the appropriate step
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    url.searchParams.set("step", "2");
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // ------------------------------------------------------------------
  // 7. Authenticated + KYC approved — allow through
  // ------------------------------------------------------------------
  const response = NextResponse.next();
  addSecurityHeaders(response);
  if (pathname.startsWith("/api/")) {
    addCorsHeaders(response, request);
  }
  return response;
}

// ---------------------------------------------------------------------------
// Matcher — run middleware on all routes except static files
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
