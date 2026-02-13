"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api/client";
import type { Notification } from "@/types/api";

// =============================================================================
// Query Keys
// =============================================================================

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (filters?: NotificationFilters) =>
    [...notificationKeys.all, "list", filters ?? {}] as const,
};

// =============================================================================
// Types
// =============================================================================

export interface NotificationFilters {
  type?: string;
  isRead?: boolean;
  page?: number;
  limit?: number;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetch the authenticated user's notifications.
 * Supports filtering by type and read status.
 */
export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: async (): Promise<NotificationsResponse> => {
      const params = new URLSearchParams();
      if (filters?.type) params.set("type", filters.type);
      if (filters?.isRead !== undefined) params.set("isRead", String(filters.isRead));
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));

      const queryString = params.toString();
      const path = queryString
        ? `/users/me/notifications?${queryString}`
        : "/users/me/notifications";

      const res = await api.get<NotificationsResponse>(path);
      if (!res.data) {
        throw new ApiError("Failed to fetch notifications", 500);
      }
      return res.data;
    },
    staleTime: 15_000, // 15 seconds
    refetchInterval: 60_000, // auto-poll every 60 seconds for new notifications
  });
}

/**
 * Mark specific notifications as read by their IDs.
 */
export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const res = await api.patch("/users/me/notifications", {
        notificationIds,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Mark all notifications as read.
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await api.patch("/users/me/notifications", {
        markAllRead: true,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
