// =============================================================================
// GET /api/auth/nonce — Generate a random nonce for SIWE (Sign-In with Ethereum)
// =============================================================================

import { NextRequest } from "next/server";
import crypto from "crypto";
import { apiResponse, apiError, handleApiError } from "@/lib/utils/api";

// ---------------------------------------------------------------------------
// In-memory nonce store with 5-minute expiry
// In production, replace with Redis or a database-backed store.
// ---------------------------------------------------------------------------

interface NonceEntry {
  nonce: string;
  createdAt: number;
  expiresAt: number;
}

// TODO: Replace in-memory Map with Redis or DB-backed store for multi-instance deployments
const nonceStore = new Map<string, NonceEntry>();

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Periodic cleanup of expired nonces (runs at most every 60 seconds)
let lastCleanup = 0;
function cleanupExpiredNonces() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;

  for (const [key, entry] of nonceStore.entries()) {
    if (entry.expiresAt < now) {
      nonceStore.delete(key);
    }
  }
}

// ---------------------------------------------------------------------------
// Exported helpers for the verify route
// ---------------------------------------------------------------------------

export function consumeNonce(nonce: string): boolean {
  cleanupExpiredNonces();

  const entry = nonceStore.get(nonce);
  if (!entry) return false;
  if (entry.expiresAt < Date.now()) {
    nonceStore.delete(nonce);
    return false;
  }

  // Nonces are single-use
  nonceStore.delete(nonce);
  return true;
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest) {
  try {
    cleanupExpiredNonces();

    const nonce = crypto.randomBytes(16).toString("hex");
    const now = Date.now();

    nonceStore.set(nonce, {
      nonce,
      createdAt: now,
      expiresAt: now + NONCE_TTL_MS,
    });

    return apiResponse({ nonce });
  } catch (error) {
    return handleApiError(error);
  }
}
