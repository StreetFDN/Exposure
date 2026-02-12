"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { User, TierLevel } from "@prisma/client";

// =============================================================================
// State & Actions
// =============================================================================

interface UserState {
  /** The currently authenticated user, or null if not signed in. */
  user: User | null;
  /** True while the user profile is being fetched. */
  isLoading: boolean;
  /** Convenience derived flag — true when `user` is non-null. */
  isAuthenticated: boolean;
  /** The user's current staking tier. */
  tier: TierLevel | null;
  /** Loyalty / reward points balance. */
  points: number;
}

interface UserActions {
  setUser: (user: User) => void;
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
            tier: user.tierLevel ?? null,
            points: user.loyaltyPoints ?? 0,
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
          const res = await fetch(
            `/api/users/${encodeURIComponent(walletAddress)}`
          );
          if (!res.ok) {
            throw new Error(`Failed to fetch user: ${res.status}`);
          }
          const json = await res.json();
          const user: User = json.data;

          set(
            {
              user,
              isAuthenticated: true,
              isLoading: false,
              tier: user.tierLevel ?? null,
              points: user.loyaltyPoints ?? 0,
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
