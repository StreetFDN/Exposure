import type { Abi, Address } from "viem";

// =============================================================================
// Deal Contract ABI
// =============================================================================

export const DEAL_CONTRACT_ABI = [
  {
    type: "function",
    name: "contribute",
    inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimRefund",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "finalize",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "emergencyPause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "totalRaised",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserContribution",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isWhitelisted",
    inputs: [
      { name: "user", type: "address", internalType: "address" },
      { name: "proof", type: "bytes32[]", internalType: "bytes32[]" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "Contributed",
    inputs: [
      { name: "user", type: "address", indexed: true, internalType: "address" },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Finalized",
    inputs: [
      {
        name: "totalRaised",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Paused",
    inputs: [],
    anonymous: false,
  },
] as const satisfies Abi;

// =============================================================================
// Vesting Contract ABI
// =============================================================================

export const VESTING_CONTRACT_ABI = [
  {
    type: "function",
    name: "claim",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "vestedAmount",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "claimableAmount",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "vestingSchedule",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [
      { name: "total", type: "uint256", internalType: "uint256" },
      { name: "claimed", type: "uint256", internalType: "uint256" },
      { name: "start", type: "uint256", internalType: "uint256" },
      { name: "cliff", type: "uint256", internalType: "uint256" },
      { name: "duration", type: "uint256", internalType: "uint256" },
      { name: "tgePercent", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "Claimed",
    inputs: [
      { name: "account", type: "address", indexed: true, internalType: "address" },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
] as const satisfies Abi;

// =============================================================================
// Staking Contract ABI
// =============================================================================

export const STAKING_CONTRACT_ABI = [
  {
    type: "function",
    name: "stake",
    inputs: [
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "lockPeriod", type: "uint8", internalType: "uint8" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "unstake",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getUserTier",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint8", internalType: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserStake",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "lockEnd", type: "uint256", internalType: "uint256" },
      { name: "lockPeriod", type: "uint8", internalType: "uint8" },
      { name: "active", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "Staked",
    inputs: [
      { name: "user", type: "address", indexed: true, internalType: "address" },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "lockPeriod",
        type: "uint8",
        indexed: false,
        internalType: "uint8",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Unstaked",
    inputs: [
      { name: "user", type: "address", indexed: true, internalType: "address" },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
] as const satisfies Abi;

// =============================================================================
// ERC-20 ABI (minimal)
// =============================================================================

export const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "spender", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8", internalType: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "Approval",
    inputs: [
      { name: "owner", type: "address", indexed: true, internalType: "address" },
      {
        name: "spender",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "value",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true, internalType: "address" },
      { name: "to", type: "address", indexed: true, internalType: "address" },
      {
        name: "value",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
] as const satisfies Abi;

// =============================================================================
// Contract Addresses
// =============================================================================

/**
 * Deployed contract addresses per chain.
 *
 * These are placeholder addresses — replace with actual deployment addresses
 * before going to production.
 */
export const CONTRACT_ADDRESSES: Record<
  number,
  {
    deal: Address;
    vesting: Address;
    staking: Address;
    platformToken: Address;
  }
> = {
  // Ethereum Mainnet
  1: {
    deal: "0x0000000000000000000000000000000000000001" as Address,
    vesting: "0x0000000000000000000000000000000000000002" as Address,
    staking: "0x0000000000000000000000000000000000000003" as Address,
    platformToken: "0x0000000000000000000000000000000000000004" as Address,
  },
  // Base
  8453: {
    deal: "0x0000000000000000000000000000000000000011" as Address,
    vesting: "0x0000000000000000000000000000000000000012" as Address,
    staking: "0x0000000000000000000000000000000000000013" as Address,
    platformToken: "0x0000000000000000000000000000000000000014" as Address,
  },
  // Arbitrum One
  42161: {
    deal: "0x0000000000000000000000000000000000000021" as Address,
    vesting: "0x0000000000000000000000000000000000000022" as Address,
    staking: "0x0000000000000000000000000000000000000023" as Address,
    platformToken: "0x0000000000000000000000000000000000000024" as Address,
  },
} as const;

/**
 * Get contract addresses for a specific chain, or undefined if the chain
 * is not supported.
 */
export function getContractAddresses(chainId: number) {
  return CONTRACT_ADDRESSES[chainId] ?? null;
}
