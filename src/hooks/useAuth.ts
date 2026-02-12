"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { SiweMessage } from "siwe";
import { useUserStore } from "@/store/user";

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
  /** Sign out — clears session and disconnects wallet. */
  signOut: () => Promise<void>;
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

  // -------------------------------------------------------------------------
  // Auto-fetch user profile when wallet is connected and we have a session
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (isConnected && address && !user && !isUserLoading) {
      // Attempt to restore an existing session.
      fetch("/api/auth/session")
        .then((res) => {
          if (res.ok) return res.json();
          return null;
        })
        .then((json) => {
          if (json?.data?.user) {
            setUser(json.data.user);
          }
        })
        .catch(() => {
          // No session — user needs to sign in.
        });
    }
  }, [isConnected, address, user, isUserLoading, setUser]);

  // -------------------------------------------------------------------------
  // Sign In
  // -------------------------------------------------------------------------
  const signIn = useCallback(async () => {
    if (!address || !chainId) {
      setError("Please connect your wallet first.");
      return;
    }

    setIsSigningIn(true);
    setError(null);

    try {
      // 1. Get a nonce from the server
      const nonceRes = await fetch("/api/auth/nonce");
      if (!nonceRes.ok) throw new Error("Failed to fetch nonce");
      const { nonce } = await nonceRes.json();

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
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageString, signature }),
      });

      if (!verifyRes.ok) {
        const body = await verifyRes.json().catch(() => null);
        throw new Error(
          body?.error?.message ?? `Verification failed (${verifyRes.status})`
        );
      }

      // 5. Fetch the full user profile
      await fetchUser(address);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Sign-in failed. Please try again.";
      setError(msg);
      console.error("[useAuth] signIn error:", err);
    } finally {
      setIsSigningIn(false);
    }
  }, [address, chainId, signMessageAsync, fetchUser]);

  // -------------------------------------------------------------------------
  // Sign Out
  // -------------------------------------------------------------------------
  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Best-effort — clear local state regardless.
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
    error,
  };
}
