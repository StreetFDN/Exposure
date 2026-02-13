"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Notification } from "@prisma/client";
import { api } from "@/lib/api/client";

// =============================================================================
// State & Actions
// =============================================================================

interface NotificationsState {
  /** All notifications for the current user. */
  notifications: Notification[];
  /** Count of unread notifications (derived but cached for perf). */
  unreadCount: number;
  /** True while notifications are being fetched. */
  isLoading: boolean;
}

interface NotificationsActions {
  /** Add a new notification (e.g. from a realtime subscription). */
  addNotification: (notification: Notification) => void;
  /** Mark a single notification as read. */
  markAsRead: (notificationId: string) => void;
  /** Mark all notifications as read. */
  markAllAsRead: () => void;
  /** Fetch all notifications from the API. */
  fetchNotifications: () => Promise<void>;
}

type NotificationsStore = NotificationsState & NotificationsActions;

// =============================================================================
// Helpers
// =============================================================================

function countUnread(notifications: Notification[]): number {
  return notifications.filter((n) => !n.isRead).length;
}

// =============================================================================
// Store
// =============================================================================

export const useNotificationsStore = create<NotificationsStore>()(
  devtools(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,

      addNotification: (notification) => {
        const updated = [notification, ...get().notifications];
        set(
          { notifications: updated, unreadCount: countUnread(updated) },
          undefined,
          "notifications/add"
        );
      },

      markAsRead: (notificationId) => {
        const updated = get().notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        );
        set(
          { notifications: updated, unreadCount: countUnread(updated) },
          undefined,
          "notifications/markAsRead"
        );

        // Fire-and-forget API call via the centralised client.
        api
          .patch("/users/me/notifications", {
            notificationIds: [notificationId],
          })
          .catch((err) =>
            console.error("[notifications] markAsRead API failed:", err)
          );
      },

      markAllAsRead: () => {
        const updated = get().notifications.map((n) => ({
          ...n,
          isRead: true,
        }));
        set(
          { notifications: updated, unreadCount: 0 },
          undefined,
          "notifications/markAllAsRead"
        );

        api
          .patch("/users/me/notifications", { markAllRead: true })
          .catch((err) =>
            console.error("[notifications] markAllAsRead API failed:", err)
          );
      },

      fetchNotifications: async () => {
        set({ isLoading: true }, undefined, "notifications/fetch:start");
        try {
          const res = await api.get<{
            notifications: Notification[];
            unreadCount: number;
          }>("/users/me/notifications");

          const notifications: Notification[] =
            res.data?.notifications ?? [];

          set(
            {
              notifications,
              unreadCount: countUnread(notifications),
              isLoading: false,
            },
            undefined,
            "notifications/fetch:success"
          );
        } catch (error) {
          console.error("[notifications] fetch failed:", error);
          set({ isLoading: false }, undefined, "notifications/fetch:error");
        }
      },
    }),
    { name: "ExposureNotificationsStore" }
  )
);
