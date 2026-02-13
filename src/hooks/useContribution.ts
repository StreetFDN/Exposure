"use client";

import { useCallback, useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Address } from "viem";
import { parseUnits, maxUint256 } from "viem";
import { DEAL_CONTRACT_ABI, ERC20_ABI } from "@/lib/web3/contracts";
import { api, ApiError } from "@/lib/api/client";
import type { ContributionWithDeal } from "@/types/api";

// =============================================================================
// Query Keys
// =============================================================================

export const contributionKeys = {
  all: ["contributions"] as const,
  lists: () => [...contributionKeys.all, "list"] as const,
  list: (filters?: { dealId?: string; status?: string }) =>
    [...contributionKeys.lists(), filters ?? {}] as const,
};

// =============================================================================
// On-Chain Types
// =============================================================================

interface UseContributionReturn {
  /** Execute a contribution -- handles ERC-20 approval + deal contribution. */
  contribute: (
    dealId: string,
    amount: string,
    currency: string,
    opts: {
      dealContractAddress: Address;
      tokenAddress: Address;
      tokenDecimals: number;
    }
  ) => Promise<void>;
  /** True while the ERC-20 approve tx is being confirmed. */
  isApproving: boolean;
  /** True while the contribute tx is being confirmed. */
  isContributing: boolean;
  /** True while any transaction is pending (either approve or contribute). */
  isPending: boolean;
  /** The hash of the most recent contribution transaction. */
  txHash: Address | undefined;
  /** Error from the most recent contribution attempt. */
  error: string | null;
  /** Reset error state. */
  resetError: () => void;
}

// =============================================================================
// On-Chain Contribution Hook (unchanged behavior)
// =============================================================================

/**
 * Handles the full contribution flow:
 *
 * 1. Check current ERC-20 allowance for the deal contract.
 * 2. If insufficient, send an `approve` transaction.
 * 3. Once approved, send the `contribute` transaction on the deal contract.
 * 4. Wait for the contribution tx to be confirmed.
 */
export function useContribution(): UseContributionReturn {
  const { address } = useAccount();

  // -- approve tx --
  const {
    writeContractAsync: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
    reset: resetApprove,
  } = useWriteContract();

  const { isLoading: isApproveConfirming } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // -- contribute tx --
  const {
    writeContractAsync: writeContribute,
    data: contributeHash,
    isPending: isContributePending,
    reset: resetContribute,
  } = useWriteContract();

  const { isLoading: isContributeConfirming } = useWaitForTransactionReceipt({
    hash: contributeHash,
  });

  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Derived flags
  // -------------------------------------------------------------------------
  const isApproving = isApprovePending || isApproveConfirming;
  const isContributing = isContributePending || isContributeConfirming;
  const isPending = isApproving || isContributing;

  // -------------------------------------------------------------------------
  // Contribute
  // -------------------------------------------------------------------------
  const contribute = useCallback(
    async (
      dealId: string,
      amount: string,
      currency: string,
      opts: {
        dealContractAddress: Address;
        tokenAddress: Address;
        tokenDecimals: number;
      }
    ) => {
      if (!address) {
        setError("Wallet not connected");
        return;
      }

      setError(null);
      resetApprove();
      resetContribute();

      const parsedAmount = parseUnits(amount, opts.tokenDecimals);

      try {
        // 1. Check current allowance
        const allowanceRes = await fetch(
          `/api/allowance?owner=${address}&spender=${opts.dealContractAddress}&token=${opts.tokenAddress}`
        );
        let currentAllowance = 0n;
        if (allowanceRes.ok) {
          const json = await allowanceRes.json();
          currentAllowance = BigInt(json.allowance ?? "0");
        }

        // 2. Approve if needed
        if (currentAllowance < parsedAmount) {
          await writeApprove({
            address: opts.tokenAddress,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [opts.dealContractAddress, maxUint256],
          });
        }

        // 3. Contribute
        await writeContribute({
          address: opts.dealContractAddress,
          abi: DEAL_CONTRACT_ABI,
          functionName: "contribute",
          args: [parsedAmount],
        });

        // 4. Notify the backend about the pending contribution
        await api.post("/contributions", {
          dealId,
          amount,
          currency,
          txHash: contributeHash,
          walletAddress: address,
        });
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Contribution failed. Please try again.";
        setError(msg);
        console.error("[useContribution] error:", err);
      }
    },
    [address, writeApprove, writeContribute, resetApprove, resetContribute, contributeHash]
  );

  const resetError = useCallback(() => setError(null), []);

  return {
    contribute,
    isApproving,
    isContributing,
    isPending,
    txHash: contributeHash,
    error,
    resetError,
  };
}

// =============================================================================
// API-backed Contribution Hooks (server-side data)
// =============================================================================

/**
 * Fetch the authenticated user's contribution history from the API.
 * Supports optional filters by dealId and status.
 */
export function useContributions(filters?: {
  dealId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: contributionKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.dealId) params.set("dealId", filters.dealId);
      if (filters?.status) params.set("status", filters.status);
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));

      const queryString = params.toString();
      const path = queryString
        ? `/contributions?${queryString}`
        : "/contributions";

      const res = await api.get<{
        contributions: ContributionWithDeal[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(path);

      if (!res.data) {
        throw new ApiError("Failed to fetch contributions", 500);
      }

      return res.data;
    },
    staleTime: 15_000, // 15 seconds
  });
}

/**
 * Submit a contribution record to the API (POST /api/deals/[id]/contribute).
 * This is the API-only version for recording a contribution (used after
 * on-chain tx is confirmed, or for off-chain contribution flows).
 */
export function useSubmitContribution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      dealId: string;
      amount: string;
      currency: string;
      txHash?: string;
    }) => {
      const res = await api.post(
        `/deals/${encodeURIComponent(params.dealId)}/contribute`,
        params
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contributionKeys.all });
    },
  });
}
