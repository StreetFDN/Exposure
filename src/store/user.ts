"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { User, TierLevel } from "@prisma/client";
import type { SessionUser } from "@/types/api";
import { api } from "@/lib/api/client";

// =============================================================================
// State & Actions
// =============================================================================

interface UserState {
  /** The currently authenticated user, or null if not signed in. */
  user: User | SessionUser | null;
  /** True while the user profile is being fetched. */
  isLoading: boolean;
  /** Convenience derived flag -- true when `user` is non-null. */
  isAuthenticated: boolean;
  /** The user's current staking tier. */
  tier: TierLevel | null;
  /** Loyalty / reward points balance. */
  points: number;
}

/**
 * The setUser action accepts either a full Prisma User or a lightweight
 * SessionUser returned by the session endpoint.
 */
type SetUserPayload = User | SessionUser;

interface UserActions {
  setUser: (user: SetUserPayload) => void;
  clearUser: () => void;
  updateTier: (tier: TierLevel) => void;
  /**
   * Fetch user profile from the API by wallet address.
   * Sets isLoading while in-flight and updates the store on success.
   */
  fetchUser: (walletAddress: string) => Promise<void>;
}

type UserStore = UserState & UserActions;

// =============================================================================
// Initial State
// =============================================================================

const initialState: UserState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  tier: null,
  points: 0,
};

// =============================================================================
// Store
// =============================================================================

export const useUserStore = create<UserStore>()(
  devtools(
    (set) => ({
      ...initialState,

      setUser: (user) =>
        set(
          {
            user,
            isAuthenticated: true,
            isLoading: false,
            tier: (user.tierLevel as TierLevel) ?? null,
            points: user.totalPoints ?? 0,
          },
          undefined,
          "user/setUser"
        ),

      clearUser: () =>
        set({ ...initialState }, undefined, "user/clearUser"),

      updateTier: (tier) =>
        set({ tier }, undefined, "user/updateTier"),

      fetchUser: async (walletAddress) => {
        set({ isLoading: true }, undefined, "user/fetchUser:start");
        try {
          const res = await api.get<User>(
            `/users/${encodeURIComponent(walletAddress)}`
          );
          const user = res.data;

          if (!user) {
            throw new Error("User not found");
          }

          set(
            {
              user,
              isAuthenticated: true,
              isLoading: false,
              tier: user.tierLevel ?? null,
              points: user.totalPoints ?? 0,
            },
            undefined,
            "user/fetchUser:success"
          );
        } catch (error) {
          console.error("[useUserStore] fetchUser failed:", error);
          set({ isLoading: false }, undefined, "user/fetchUser:error");
        }
      },
    }),
    { name: "ExposureUserStore" }
  )
);
