"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { SiweMessage } from "siwe";
import { useUserStore } from "@/store/user";
import { api, ApiError } from "@/lib/api/client";
import type { SessionUser } from "@/types/api";

// =============================================================================
// Constants
// =============================================================================

/** How often to silently re-check the session (ms). */
const SESSION_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// =============================================================================
// Types
// =============================================================================

interface UseAuthReturn {
  /** Whether the user has a valid authenticated session. */
  isAuthenticated: boolean;
  /** True while sign-in, verification, or profile fetch is in progress. */
  isLoading: boolean;
  /** The currently authenticated user, or null. */
  user: ReturnType<typeof useUserStore>["user"];
  /** Initiate Sign-In with Ethereum. */
  signIn: () => Promise<void>;
  /** Sign out -- clears session and disconnects wallet. */
  signOut: () => Promise<void>;
  /** Manually refresh the session from the server. */
  refresh: () => Promise<void>;
  /** Error from the most recent sign-in attempt, if any. */
  error: string | null;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Wallet-based authentication hook.
 *
 * Uses Sign-In with Ethereum (EIP-4361 / SIWE) to authenticate the connected
 * wallet. After the user signs the SIWE message the signature is verified
 * server-side at `/api/auth/verify` which issues a session cookie.
 *
 * Automatically refreshes the session every 5 minutes while the user is
 * authenticated and the tab is active.
 */
export function useAuth(): UseAuthReturn {
  const { address, isConnected, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();

  const {
    user,
    isAuthenticated,
    isLoading: isUserLoading,
    setUser,
    clearUser,
    fetchUser,
  } = useUserStore();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---------------------------------------------------------------------------
  // Session fetch helper
  // ---------------------------------------------------------------------------
  const fetchSession = useCallback(async (): Promise<SessionUser | null> => {
    try {
      const res = await api.get<{ user: SessionUser | null }>("/auth/session");
      return res.data?.user ?? null;
    } catch {
      return null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Refresh -- re-fetches the session and updates the store
  // ---------------------------------------------------------------------------
  const refresh = useCallback(async () => {
    const sessionUser = await fetchSession();
    if (sessionUser) {
      setUser(sessionUser);
    } else {
      clearUser();
    }
  }, [fetchSession, setUser, clearUser]);

  // ---------------------------------------------------------------------------
  // Auto-fetch user profile when wallet is connected and we have a session
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isConnected && address && !user && !isUserLoading) {
      // Attempt to restore an existing session.
      fetchSession().then((sessionUser) => {
        if (sessionUser) {
          setUser(sessionUser);
        }
      });
    }
  }, [isConnected, address, user, isUserLoading, setUser, fetchSession]);

  // ---------------------------------------------------------------------------
  // Periodic session refresh (every 5 minutes)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isAuthenticated) {
      refreshIntervalRef.current = setInterval(() => {
        refresh();
      }, SESSION_REFRESH_INTERVAL);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, refresh]);

  // ---------------------------------------------------------------------------
  // Sign In
  // ---------------------------------------------------------------------------
  const signIn = useCallback(async () => {
    if (!address || !chainId) {
      setError("Please connect your wallet first.");
      return;
    }

    setIsSigningIn(true);
    setError(null);

    try {
      // 1. Get a nonce from the server
      const nonceRes = await api.get<{ nonce: string }>("/auth/nonce");
      const nonce = nonceRes.data?.nonce;
      if (!nonce) throw new Error("Failed to fetch nonce");

      // 2. Construct SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in to Exposure",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce,
      });

      const messageString = message.prepareMessage();

      // 3. Prompt the user to sign
      const signature = await signMessageAsync({ message: messageString });

      // 4. Verify on the server
      await api.post("/auth/verify", { message: messageString, signature });

      // 5. Fetch the full user profile
      await fetchUser(address);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Sign-in failed. Please try again.";
      setError(msg);
      console.error("[useAuth] signIn error:", err);
    } finally {
      setIsSigningIn(false);
    }
  }, [address, chainId, signMessageAsync, fetchUser]);

  // ---------------------------------------------------------------------------
  // Sign Out
  // ---------------------------------------------------------------------------
  const signOut = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Best-effort -- clear local state regardless.
    }
    clearUser();
    disconnect();
  }, [clearUser, disconnect]);

  return {
    isAuthenticated,
    isLoading: isSigningIn || isUserLoading,
    user,
    signIn,
    signOut,
    refresh,
    error,
  };
}
