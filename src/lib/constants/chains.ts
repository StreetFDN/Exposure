import type { Chain } from "@prisma/client";

// =============================================================================
// Chain Configuration
// =============================================================================

export interface ChainConfig {
  id: number;
  chain: Chain;
  name: string;
  icon: string;
  explorerUrl: string;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * All chains supported by the Exposure platform.
 * Ordered by priority (Ethereum first).
 */
export const SUPPORTED_CHAINS: readonly ChainConfig[] = [
  {
    id: 1,
    chain: "ETHEREUM",
    name: "Ethereum",
    icon: "/icons/chains/ethereum.svg",
    explorerUrl: "https://etherscan.io",
    rpcUrl: "https://eth.llamarpc.com",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  {
    id: 8453,
    chain: "BASE",
    name: "Base",
    icon: "/icons/chains/base.svg",
    explorerUrl: "https://basescan.org",
    rpcUrl: "https://mainnet.base.org",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  {
    id: 42161,
    chain: "ARBITRUM",
    name: "Arbitrum One",
    icon: "/icons/chains/arbitrum.svg",
    explorerUrl: "https://arbiscan.io",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
] as const;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get the configuration for a specific chain by its numeric chain ID.
 * Returns undefined if the chain is not supported.
 */
export function getChainConfig(chainId: number): ChainConfig | undefined {
  return SUPPORTED_CHAINS.find((c) => c.id === chainId);
}

/**
 * Get the configuration for a specific chain by its Prisma enum value.
 */
export function getChainConfigByEnum(chain: Chain): ChainConfig | undefined {
  return SUPPORTED_CHAINS.find((c) => c.chain === chain);
}

/**
 * Build a block explorer URL for a transaction hash.
 * @example getExplorerTxUrl(1, "0xabc...") // "https://etherscan.io/tx/0xabc..."
 */
export function getExplorerTxUrl(
  chainId: number,
  txHash: string
): string | null {
  const chain = getChainConfig(chainId);
  if (!chain) return null;
  return `${chain.explorerUrl}/tx/${txHash}`;
}

/**
 * Build a block explorer URL for a wallet or contract address.
 * @example getExplorerAddressUrl(1, "0x123...") // "https://etherscan.io/address/0x123..."
 */
export function getExplorerAddressUrl(
  chainId: number,
  address: string
): string | null {
  const chain = getChainConfig(chainId);
  if (!chain) return null;
  return `${chain.explorerUrl}/address/${address}`;
}
