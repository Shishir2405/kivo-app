/**
 * UI store (zustand). Cross-screen UI state that isn't server data:
 * splash gate, theme preference (persisted), and a tiny toast queue.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** User theme preference. 'system' tracks the device color scheme. */
export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_KEY = 'kivo.themeMode';
const ONBOARDING_KEY = 'kivo.onboardingSeen';

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
  /** Active theme preference ('system' | 'light' | 'dark'). */
  themeMode: ThemeMode;
  /** Whether the 3-slide onboarding carousel has been completed (persisted). */
  onboardingSeen: boolean;
  toasts: ToastItem[];

  setSplashDone: (done: boolean) => void;
  setHasSeenWelcome: (seen: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  /** Mark onboarding as seen (persists). */
  setOnboardingSeen: (seen: boolean) => void;
  /** Rehydrate the persisted theme preference (call once at startup). */
  hydrateTheme: () => Promise<void>;
  /** Rehydrate the persisted onboarding flag (call once at startup). */
  hydrateOnboarding: () => Promise<void>;
  pushToast: (toast: ToastItem) => void;
  dismissToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  splashDone: false,
  hasSeenWelcome: false,
  themeMode: 'system',
  onboardingSeen: false,
  toasts: [],

  setSplashDone: (splashDone) => set({ splashDone }),
  setHasSeenWelcome: (hasSeenWelcome) => set({ hasSeenWelcome }),
  setThemeMode: (themeMode) => {
    set({ themeMode });
    void AsyncStorage.setItem(THEME_KEY, themeMode).catch(() => {});
  },
  setOnboardingSeen: (onboardingSeen) => {
    set({ onboardingSeen });
    void AsyncStorage.setItem(ONBOARDING_KEY, onboardingSeen ? '1' : '0').catch(() => {});
  },
  hydrateTheme: async () => {
    try {
      const stored = (await AsyncStorage.getItem(THEME_KEY)) as ThemeMode | null;
      if (stored === 'system' || stored === 'light' || stored === 'dark') {
        set({ themeMode: stored });
      }
    } catch {
      /* ignore — fall back to 'system' */
    }
  },
  hydrateOnboarding: async () => {
    try {
      const stored = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (stored === '1') {
        set({ onboardingSeen: true });
      }
    } catch {
      /* ignore — fall back to not seen */
    }
  },
  pushToast: (toast) => set((s) => ({ toasts: [...s.toasts, toast] })),
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
