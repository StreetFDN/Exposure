// =============================================================================
// Exposure -- In-memory Rate Limiter (sliding window)
// Suitable for single-instance deployments. Upgrade to Redis for multi-instance.
// =============================================================================

import { NextRequest } from "next/server";
import { apiError } from "@/lib/utils/api";

// =============================================================================
// Types
// =============================================================================

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // ms until the window resets for the oldest entry
}

// =============================================================================
// In-memory store
// =============================================================================

const store = new Map<string, RateLimitEntry>();

// =============================================================================
// Auto-cleanup of expired entries every 60 seconds
// =============================================================================

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      // Remove entries where all timestamps are older than the longest
      // reasonable window (10 minutes). Individual checks also prune.
      const maxWindow = 10 * 60 * 1000;
      entry.timestamps = entry.timestamps.filter((t) => now - t < maxWindow);
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, 60_000);

  // Allow the process to exit without waiting for the interval
  if (cleanupInterval && typeof cleanupInterval === "object" && "unref" in cleanupInterval) {
    cleanupInterval.unref();
  }
}

ensureCleanup();

// =============================================================================
// rateLimit -- Sliding window rate limiter
// =============================================================================

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the sliding window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= limit) {
    // Rate limited -- calculate when the earliest timestamp in the window expires
    const oldestInWindow = entry.timestamps[0];
    const reset = oldestInWindow + windowMs - now;
    return {
      success: false,
      remaining: 0,
      reset,
    };
  }

  // Allow the request
  entry.timestamps.push(now);
  const remaining = limit - entry.timestamps.length;

  // Reset = time until the oldest timestamp falls out of the window
  const oldestInWindow = entry.timestamps[0];
  const reset = oldestInWindow + windowMs - now;

  return {
    success: true,
    remaining,
    reset,
  };
}

// =============================================================================
// getClientIp -- Extract client IP from request headers
// =============================================================================

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// =============================================================================
// withRateLimit -- Helper for API routes
// Returns null if allowed, or a NextResponse (429) if rate limited.
// =============================================================================

export function withRateLimit(
  request: NextRequest,
  key: string,
  limit: number,
  windowMs: number
) {
  const result = rateLimit(key, limit, windowMs);

  if (!result.success) {
    return apiError("Too many requests", 429, "RATE_LIMITED", {
      retryAfter: Math.ceil(result.reset / 1000),
    });
  }

  return null; // Request is allowed
}
