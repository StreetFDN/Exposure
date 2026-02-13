"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";

import { config } from "@/lib/web3/config";
import { api } from "@/lib/api/client";
import type { SessionUser } from "@/types/api";

import "@rainbow-me/rainbowkit/styles.css";

// =============================================================================
// RainbowKit theme
// =============================================================================

const rainbowTheme = darkTheme({
  accentColor: "#8b5cf6",
  accentColorForeground: "white",
  borderRadius: "medium",
});

// =============================================================================
// Auth Context
// =============================================================================

/** How often to silently re-check the session (ms). */
const SESSION_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface AuthContextValue {
  /** The currently authenticated session user, or null. */
  user: SessionUser | null;
  /** True while the initial session is being loaded. */
  isLoading: boolean;
  /** True when `user` is non-null. */
  isAuthenticated: boolean;
  /** Manually refresh the session from the server. */
  refresh: () => Promise<void>;
  /** Clear the local session (called after sign-out). */
  clearSession: () => void;
  /** Set the session user (called after successful sign-in). */
  setSession: (user: SessionUser) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  refresh: async () => {},
  clearSession: () => {},
  setSession: () => {},
});

/**
 * Access the auth context.
 *
 * Provides `user`, `isLoading`, `isAuthenticated`, `refresh()`,
 * `clearSession()`, and `setSession()`.
 *
 * This context is independent of the Zustand `useUserStore` and the
 * `useAuth` hook -- it is a lightweight provider that keeps a session user
 * in React context and refreshes it periodically so that any component in
 * the tree can check auth state without importing wagmi hooks.
 */
export function useAuthContext() {
  return useContext(AuthContext);
}

// ---------------------------------------------------------------------------
// AuthProvider (internal)
// ---------------------------------------------------------------------------

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch session from the API
  const fetchSession = useCallback(async () => {
    try {
      const res = await api.get<{ user: SessionUser | null }>("/auth/session");
      return res.data?.user ?? null;
    } catch {
      return null;
    }
  }, []);

  // Public refresh function
  const refresh = useCallback(async () => {
    const sessionUser = await fetchSession();
    setUser(sessionUser);
  }, [fetchSession]);

  const clearSession = useCallback(() => {
    setUser(null);
  }, []);

  const setSession = useCallback((u: SessionUser) => {
    setUser(u);
  }, []);

  // Initial session load on mount
  useEffect(() => {
    let cancelled = false;

    fetchSession().then((sessionUser) => {
      if (!cancelled) {
        setUser(sessionUser);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [fetchSession]);

  // Periodic refresh while authenticated
  useEffect(() => {
    if (user) {
      refreshIntervalRef.current = setInterval(() => {
        refresh();
      }, SESSION_REFRESH_INTERVAL);
    } else if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [user, refresh]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        refresh,
        clearSession,
        setSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// =============================================================================
// Root Providers
// =============================================================================

export function Providers({ children }: { children: ReactNode }) {
  // Create the QueryClient once per app lifecycle (inside state so it
  // survives re-renders without being recreated).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 60 seconds
            refetchOnWindowFocus: false,
            retry: 2,
            refetchOnReconnect: true,
          },
        },
      })
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rainbowTheme} modalSize="compact">
          <AuthProvider>
            {children}
          </AuthProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
