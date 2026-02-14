// =============================================================================
// Toast Store — Zustand store for managing toast notifications
// =============================================================================

import { create } from "zustand";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  createdAt: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, variant?: ToastVariant) => void;
  removeToast: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

let toastCounter = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (message: string, variant: ToastVariant = "info") => {
    const id = `toast-${Date.now()}-${++toastCounter}`;
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id, message, variant, createdAt: Date.now() },
      ],
    }));
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
