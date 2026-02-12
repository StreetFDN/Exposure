"use client";

import { type ReactNode, useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";

import { config } from "@/lib/web3/config";

import "@rainbow-me/rainbowkit/styles.css";

// ---------------------------------------------------------------------------
// RainbowKit theme
// ---------------------------------------------------------------------------

const rainbowTheme = darkTheme({
  accentColor: "#8b5cf6",
  accentColorForeground: "white",
  borderRadius: "medium",
});

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

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
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
