/**
 * UI store (zustand). Cross-screen UI state that isn't server data:
 * splash gate, theme prefs, and a tiny toast queue.
 */
import { create } from 'zustand';

export interface ToastItem {
  id: string;
  message: string;
  tone: 'info' | 'success' | 'error';
}

export interface UiState {
  /** Set true once the in-app animated splash has finished. */
  splashDone: boolean;
  /** Whether onboarding/welcome has been seen (for future gating). */
  hasSeenWelcome: boolean;
  toasts: ToastItem[];

  setSplashDone: (done: boolean) => void;
  setHasSeenWelcome: (seen: boolean) => void;
  pushToast: (toast: ToastItem) => void;
  dismissToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  splashDone: false,
  hasSeenWelcome: false,
  toasts: [],

  setSplashDone: (splashDone) => set({ splashDone }),
  setHasSeenWelcome: (hasSeenWelcome) => set({ hasSeenWelcome }),
  pushToast: (toast) => set((s) => ({ toasts: [...s.toasts, toast] })),
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
