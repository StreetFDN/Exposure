"use client";

import { useCallback, useMemo, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from "wagmi";
import type { Address } from "viem";
import { parseUnits, maxUint256 } from "viem";
import {
  STAKING_CONTRACT_ABI,
  ERC20_ABI,
  getContractAddresses,
} from "@/lib/web3/contracts";
import { getTierByStake } from "@/lib/constants/tiers";
import type { StakingLockPeriod, TierLevel } from "@prisma/client";

// =============================================================================
// Types
// =============================================================================

interface StakeInfo {
  amount: bigint;
  lockEnd: bigint;
  lockPeriod: number;
  active: boolean;
}

interface UseStakingReturn {
  /** Stake platform tokens with a given lock period. */
  stake: (amount: string, lockPeriod: number) => Promise<void>;
  /** Initiate unstake (only allowed after lock expires). */
  unstake: () => Promise<void>;
  /** Current on-chain stake position, or null if none. */
  currentStake: StakeInfo | null;
  /** The user's current tier derived from on-chain stake. */
  currentTier: TierLevel | null;
  /** True while the stake tx is being sent / confirmed. */
  isStaking: boolean;
  /** True while the unstake tx is being sent / confirmed. */
  isUnstaking: boolean;
  /** Error from the most recent staking operation. */
  error: string | null;
  /** Reset error state. */
  resetError: () => void;
  /** Refetch the on-chain stake position. */
  refetch: () => void;
}

// =============================================================================
// Lock period mapping
// =============================================================================

const LOCK_PERIOD_MAP: Record<number, StakingLockPeriod> = {
  0: "DAYS_30",
  1: "DAYS_30",
  2: "DAYS_90",
  3: "DAYS_180",
};

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for staking platform tokens and reading the user's on-chain stake
 * position + tier.
 */
export function useStaking(): UseStakingReturn {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractAddresses(chainId);

  const stakingAddress = contracts?.staking as Address | undefined;
  const tokenAddress = contracts?.platformToken as Address | undefined;

  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Read current stake
  // -------------------------------------------------------------------------
  const {
    data: rawStake,
    refetch,
  } = useReadContract({
    address: stakingAddress,
    abi: STAKING_CONTRACT_ABI,
    functionName: "getUserStake",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!stakingAddress,
    },
  });

  const currentStake: StakeInfo | null = useMemo(() => {
    if (!rawStake) return null;
    const [amount, lockEnd, lockPeriod, active] = rawStake as [
      bigint,
      bigint,
      number,
      boolean,
    ];
    return { amount, lockEnd, lockPeriod, active };
  }, [rawStake]);

  const currentTier: TierLevel | null = useMemo(() => {
    if (!currentStake || !currentStake.active) return null;
    const lockPeriodEnum = LOCK_PERIOD_MAP[currentStake.lockPeriod] ?? "DAYS_30";
    const tier = getTierByStake(currentStake.amount, lockPeriodEnum);
    return tier?.level ?? null;
  }, [currentStake]);

  // -------------------------------------------------------------------------
  // Approve tx (for staking)
  // -------------------------------------------------------------------------
  const {
    writeContractAsync: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
    reset: resetApprove,
  } = useWriteContract();

  const { isLoading: isApproveConfirming } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // -------------------------------------------------------------------------
  // Stake tx
  // -------------------------------------------------------------------------
  const {
    writeContractAsync: writeStake,
    data: stakeHash,
    isPending: isStakePending,
    reset: resetStake,
  } = useWriteContract();

  const { isLoading: isStakeConfirming } = useWaitForTransactionReceipt({
    hash: stakeHash,
  });

  // -------------------------------------------------------------------------
  // Unstake tx
  // -------------------------------------------------------------------------
  const {
    writeContractAsync: writeUnstake,
    data: unstakeHash,
    isPending: isUnstakePending,
    reset: resetUnstake,
  } = useWriteContract();

  const { isLoading: isUnstakeConfirming } = useWaitForTransactionReceipt({
    hash: unstakeHash,
  });

  // -------------------------------------------------------------------------
  // Stake action
  // -------------------------------------------------------------------------
  const stake = useCallback(
    async (amount: string, lockPeriod: number) => {
      if (!address || !stakingAddress || !tokenAddress) {
        setError("Wallet not connected or contracts not configured");
        return;
      }

      setError(null);
      resetApprove();
      resetStake();

      const parsedAmount = parseUnits(amount, 18); // EXPO has 18 decimals

      try {
        // 1. Approve token transfer to staking contract
        await writeApprove({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [stakingAddress, maxUint256],
        });

        // 2. Stake tokens
        await writeStake({
          address: stakingAddress,
          abi: STAKING_CONTRACT_ABI,
          functionName: "stake",
          args: [parsedAmount, lockPeriod],
        });

        // 3. Refetch on-chain stake position
        await refetch();
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Staking failed. Please try again.";
        setError(msg);
        console.error("[useStaking] stake error:", err);
      }
    },
    [address, stakingAddress, tokenAddress, writeApprove, resetApprove, writeStake, resetStake, refetch]
  );

  // -------------------------------------------------------------------------
  // Unstake action
  // -------------------------------------------------------------------------
  const unstake = useCallback(async () => {
    if (!address || !stakingAddress) {
      setError("Wallet not connected or contracts not configured");
      return;
    }

    setError(null);
    resetUnstake();

    try {
      await writeUnstake({
        address: stakingAddress,
        abi: STAKING_CONTRACT_ABI,
        functionName: "unstake",
        args: [],
      });

      await refetch();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unstaking failed. Please try again.";
      setError(msg);
      console.error("[useStaking] unstake error:", err);
    }
  }, [address, stakingAddress, writeUnstake, resetUnstake, refetch]);

  const resetError = useCallback(() => setError(null), []);

  return {
    stake,
    unstake,
    currentStake,
    currentTier,
    isStaking: isApprovePending || isApproveConfirming || isStakePending || isStakeConfirming,
    isUnstaking: isUnstakePending || isUnstakeConfirming,
    error,
    resetError,
    refetch: () => { refetch(); },
  };
}
