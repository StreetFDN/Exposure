"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api/client";
import type { Deal, Contribution } from "@/types/api";
import type {
  DealFilters,
  DealCardProps,
  PaginatedResponse,
} from "@/types";

// =============================================================================
// Query Keys
// =============================================================================

export const dealKeys = {
  all: ["deals"] as const,
  lists: () => [...dealKeys.all, "list"] as const,
  list: (filters: DealFilters) => [...dealKeys.lists(), filters] as const,
  details: () => [...dealKeys.all, "detail"] as const,
  detail: (id: string) => [...dealKeys.details(), id] as const,
  contributions: (dealId: string) =>
    [...dealKeys.all, "contributions", dealId] as const,
};

// =============================================================================
// Fetchers
// =============================================================================

async function fetchDeals(
  filters: DealFilters
): Promise<PaginatedResponse<DealCardProps>> {
  const params = new URLSearchParams();

  if (filters.status) {
    const statuses = Array.isArray(filters.status)
      ? filters.status
      : [filters.status];
    for (const s of statuses) params.append("status", s);
  }
  if (filters.category) {
    const cats = Array.isArray(filters.category)
      ? filters.category
      : [filters.category];
    for (const c of cats) params.append("category", c);
  }
  if (filters.chain) {
    const chains = Array.isArray(filters.chain)
      ? filters.chain
      : [filters.chain];
    for (const c of chains) params.append("chain", c);
  }
  if (filters.search) params.set("search", filters.search);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
  if (filters.minTierRequired)
    params.set("minTierRequired", filters.minTierRequired);

  const queryString = params.toString();
  const path = queryString ? `/deals?${queryString}` : "/deals";

  const res = await api.get<PaginatedResponse<DealCardProps>>(path);
  if (!res.data) {
    throw new ApiError("Failed to fetch deals", 500);
  }
  return res.data;
}

async function fetchDeal(id: string): Promise<Deal> {
  const res = await api.get<Deal>(`/deals/${encodeURIComponent(id)}`);
  if (!res.data) {
    throw new ApiError("Deal not found", 404);
  }
  return res.data;
}

async function fetchDealContributions(dealId: string): Promise<Contribution[]> {
  const res = await api.get<Contribution[]>(
    `/deals/${encodeURIComponent(dealId)}/contributions`
  );
  if (!res.data) {
    throw new ApiError("Failed to fetch contributions", 500);
  }
  return res.data;
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetch a paginated, filtered list of deals.
 */
export function useDeals(filters: DealFilters = {}) {
  return useQuery({
    queryKey: dealKeys.list(filters),
    queryFn: () => fetchDeals(filters),
    staleTime: 30_000, // 30 seconds
    placeholderData: (prev) => prev,
  });
}

/**
 * Fetch a single deal by ID or slug.
 */
export function useDeal(id: string | undefined) {
  return useQuery({
    queryKey: dealKeys.detail(id ?? ""),
    queryFn: () => fetchDeal(id!),
    enabled: !!id,
    staleTime: 15_000, // 15 seconds -- deal data changes more frequently
  });
}

/**
 * Fetch contributions for a specific deal.
 */
export function useDealContributions(dealId: string | undefined) {
  return useQuery({
    queryKey: dealKeys.contributions(dealId ?? ""),
    queryFn: () => fetchDealContributions(dealId!),
    enabled: !!dealId,
    staleTime: 10_000, // 10 seconds
  });
}

/**
 * Register for a deal (POST /api/deals/[id]/register).
 */
export function useRegisterForDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dealId: string) => {
      const res = await api.post(`/deals/${encodeURIComponent(dealId)}/register`);
      return res.data;
    },
    onSuccess: (_data, dealId) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(dealId) });
    },
  });
}
