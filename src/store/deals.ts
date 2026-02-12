"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Deal } from "@prisma/client";
import type { DealFilters } from "@/types";

// =============================================================================
// State & Actions
// =============================================================================

interface DealsState {
  /** List of deals currently loaded (based on filters). */
  deals: Deal[];
  /** The deal currently being viewed in the detail page. */
  selectedDeal: Deal | null;
  /** Active filters applied to the deal listing. */
  filters: DealFilters;
  /** True while the deal list is being fetched. */
  isLoading: boolean;
}

interface DealsActions {
  setDeals: (deals: Deal[]) => void;
  setSelectedDeal: (deal: Deal | null) => void;
  updateFilters: (filters: Partial<DealFilters>) => void;
  clearFilters: () => void;
}

type DealsStore = DealsState & DealsActions;

// =============================================================================
// Defaults
// =============================================================================

const DEFAULT_FILTERS: DealFilters = {};

const initialState: DealsState = {
  deals: [],
  selectedDeal: null,
  filters: DEFAULT_FILTERS,
  isLoading: false,
};

// =============================================================================
// Store
// =============================================================================

export const useDealsStore = create<DealsStore>()(
  devtools(
    (set) => ({
      ...initialState,

      setDeals: (deals) =>
        set({ deals, isLoading: false }, undefined, "deals/setDeals"),

      setSelectedDeal: (deal) =>
        set({ selectedDeal: deal }, undefined, "deals/setSelectedDeal"),

      updateFilters: (incoming) =>
        set(
          (state) => ({
            filters: { ...state.filters, ...incoming },
          }),
          undefined,
          "deals/updateFilters"
        ),

      clearFilters: () =>
        set({ filters: DEFAULT_FILTERS }, undefined, "deals/clearFilters"),
    }),
    { name: "ExposureDealsStore" }
  )
);
