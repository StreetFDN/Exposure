"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

// ---------------------------------------------------------------------------
// Connect wallet prompt — shown when unauthenticated users access
// protected pages.
// ---------------------------------------------------------------------------

export function ConnectPrompt() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      {/* Logo */}
      <span className="mb-8 text-3xl font-bold tracking-tight text-zinc-50">
        EXPOSURE
      </span>

      {/* Message */}
      <h1 className="mb-2 text-xl font-semibold text-zinc-50">
        Connect your wallet to continue
      </h1>
      <p className="mb-8 max-w-sm text-center text-sm text-zinc-400">
        You need to connect a wallet to access this page. Your wallet is used
        for authentication and to interact with on-chain features.
      </p>

      {/* RainbowKit connect button */}
      <ConnectButton />
    </div>
  );
}
