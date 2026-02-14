"use client";

import {
  type ReactNode,
  Component,
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
// Error Boundary
// =============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ProviderErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("[Providers] Error caught by boundary:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center">
          <div className="mb-12 h-px w-16 bg-zinc-800" />
          <p className="text-xs font-light uppercase tracking-[0.25em] text-zinc-600">
            Initialization Error
          </p>
          <h1 className="mt-6 font-serif text-4xl font-light text-zinc-100">
            Unable to connect
          </h1>
          <p className="mt-4 max-w-md text-sm font-light leading-relaxed text-zinc-500">
            The application failed to initialize. This may be due to a wallet
            provider issue or network configuration. Please refresh the page to
            try again.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="mt-8 rounded-md border border-zinc-700 px-6 py-2.5 text-sm font-light text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
          >
            Refresh Page
          </button>
          <div className="mt-12 h-px w-16 bg-zinc-800" />
        </div>
      );
    }

    return this.props.children;
  }
}

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
    try {
      const sessionUser = await fetchSession();
      setUser(sessionUser);
    } catch {
      // Silently fail on refresh errors
    }
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
    }).catch(() => {
      if (!cancelled) {
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
    <ProviderErrorBoundary>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={rainbowTheme} modalSize="compact">
            <AuthProvider>
              {children}
            </AuthProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ProviderErrorBoundary>
  );
}
