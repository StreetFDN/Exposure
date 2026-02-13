"use client";

import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api/client";
import type { PortfolioData } from "@/types/api";

// =============================================================================
// Query Keys
// =============================================================================

export const portfolioKeys = {
  all: ["portfolio"] as const,
  data: () => [...portfolioKeys.all, "data"] as const,
};

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetch the authenticated user's portfolio summary and items.
 * Returns positions with current values, P&L, and vesting progress.
 */
export function usePortfolio() {
  return useQuery({
    queryKey: portfolioKeys.data(),
    queryFn: async (): Promise<PortfolioData> => {
      const res = await api.get<{ portfolio: PortfolioData }>(
        "/users/me/portfolio"
      );
      if (!res.data?.portfolio) {
        throw new ApiError("Failed to fetch portfolio", 500);
      }
      return res.data.portfolio;
    },
    staleTime: 30_000, // 30 seconds
  });
}
