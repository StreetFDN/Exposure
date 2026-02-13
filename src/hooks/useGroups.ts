"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api/client";
import type { InvestmentGroup, GroupDetail } from "@/types/api";

// =============================================================================
// Query Keys
// =============================================================================

export const groupKeys = {
  all: ["groups"] as const,
  lists: () => [...groupKeys.all, "list"] as const,
  list: (filters?: GroupFilters) => [...groupKeys.lists(), filters ?? {}] as const,
  details: () => [...groupKeys.all, "detail"] as const,
  detail: (slug: string) => [...groupKeys.details(), slug] as const,
  myGroups: () => [...groupKeys.all, "my"] as const,
};

// =============================================================================
// Types
// =============================================================================

export interface GroupFilters {
  search?: string;
  status?: string;
  minTierRequired?: string;
  category?: string;
  isPublic?: boolean;
  page?: number;
  limit?: number;
}

interface GroupsListResponse {
  groups: InvestmentGroup[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetch a paginated, filtered list of public investment groups.
 */
export function useGroups(filters?: GroupFilters) {
  return useQuery({
    queryKey: groupKeys.list(filters),
    queryFn: async (): Promise<GroupsListResponse> => {
      const params = new URLSearchParams();
      if (filters?.search) params.set("search", filters.search);
      if (filters?.status) params.set("status", filters.status);
      if (filters?.minTierRequired) params.set("minTierRequired", filters.minTierRequired);
      if (filters?.category) params.set("category", filters.category);
      if (filters?.isPublic !== undefined) params.set("isPublic", String(filters.isPublic));
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));

      const queryString = params.toString();
      const path = queryString ? `/groups?${queryString}` : "/groups";

      const res = await api.get<GroupsListResponse>(path);
      if (!res.data) {
        throw new ApiError("Failed to fetch groups", 500);
      }
      return res.data;
    },
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Fetch a single investment group by slug, including members and deals.
 */
export function useGroup(slug: string | undefined) {
  return useQuery({
    queryKey: groupKeys.detail(slug ?? ""),
    queryFn: async (): Promise<GroupDetail> => {
      const res = await api.get<GroupDetail>(
        `/groups/${encodeURIComponent(slug!)}`
      );
      if (!res.data) {
        throw new ApiError("Group not found", 404);
      }
      return res.data;
    },
    enabled: !!slug,
    staleTime: 15_000, // 15 seconds
  });
}

/**
 * Fetch groups the current user is a member of.
 */
export function useMyGroups() {
  return useQuery({
    queryKey: groupKeys.myGroups(),
    queryFn: async () => {
      const res = await api.get<{ groups: InvestmentGroup[] }>("/groups/my");
      if (!res.data) {
        throw new ApiError("Failed to fetch your groups", 500);
      }
      return res.data.groups;
    },
    staleTime: 30_000,
  });
}

/**
 * Apply to join an investment group (POST /api/groups/[slug]/join).
 */
export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      const res = await api.post(
        `/groups/${encodeURIComponent(slug)}/join`
      );
      return res.data;
    },
    onSuccess: (_data, slug) => {
      // Invalidate both the specific group and the user's groups list
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(slug) });
      queryClient.invalidateQueries({ queryKey: groupKeys.myGroups() });
    },
  });
}

/**
 * Leave an investment group (POST /api/groups/[slug]/leave).
 */
export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      const res = await api.post(
        `/groups/${encodeURIComponent(slug)}/leave`
      );
      return res.data;
    },
    onSuccess: (_data, slug) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(slug) });
      queryClient.invalidateQueries({ queryKey: groupKeys.myGroups() });
    },
  });
}
