import { http } from "wagmi";
import { mainnet, base, arbitrum } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

// ---------------------------------------------------------------------------
// Chains
// ---------------------------------------------------------------------------

/**
 * Supported chains for the Exposure platform.
 * Used by both wagmi config and chain-selection UI.
 */
export const chains = [mainnet, base, arbitrum] as const;

// ---------------------------------------------------------------------------
// Transports — use Alchemy when available, fall back to public RPCs
// ---------------------------------------------------------------------------

function alchemyTransport(chainSlug: string) {
  const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  if (apiKey) {
    return http(`https://${chainSlug}.g.alchemy.com/v2/${apiKey}`);
  }
  return http();
}

// ---------------------------------------------------------------------------
// Wagmi + RainbowKit config
// ---------------------------------------------------------------------------

/**
 * `getDefaultConfig` is the recommended way to initialise RainbowKit v2.
 * It returns a fully-typed wagmi `Config` with RainbowKit wallet connectors
 * (injected, WalletConnect, Coinbase, etc.) pre-configured.
 */
export const config = getDefaultConfig({
  appName: "Exposure",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? "",
  chains,
  transports: {
    [mainnet.id]: alchemyTransport("eth-mainnet"),
    [base.id]: alchemyTransport("base-mainnet"),
    [arbitrum.id]: alchemyTransport("arb-mainnet"),
  },
  ssr: true,
});
