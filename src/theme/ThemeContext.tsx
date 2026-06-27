import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appearance, type ColorSchemeName } from 'react-native';

import {
  lightColors,
  darkColors,
  buildToneStyles,
  shadowFor,
  type AppColors,
  type CardTone,
  type ToneStyle,
} from './tokens';
import { useUiStore, type ThemeMode } from '@/store/useUiStore';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type { ThemeMode } from '@/store/useUiStore';

export type ThemeValue = {
  /** The ACTIVE palette (light or dark) — read every color from here. */
  colors: AppColors;
  /** True when the dark palette is active. */
  isDark: boolean;
  /** The user's preference: 'system' | 'light' | 'dark'. */
  mode: ThemeMode;
  /** Change the preference (persists via the UI store). */
  setMode: (mode: ThemeMode) => void;
  /** Per-theme soft shadow (tinted + deepened for dark). */
  shadow: ReturnType<typeof shadowFor>;
  /** Per-theme card tone styles ({bg,border,accent} for each wash). */
  toneStyles: Record<CardTone, ToneStyle>;
  /** {bg,border,accent} for a single tone in the active palette. */
  toneStyle: (tone?: CardTone) => ToneStyle;
  /** The deeper accent/icon color for a tone in the active palette. */
  accentForTone: (tone?: CardTone) => string;
  /** The active color scheme string for <StatusBar> etc. */
  scheme: 'light' | 'dark';
};

/* ------------------------------------------------------------------ */
/* Context                                                            */
/* ------------------------------------------------------------------ */

function buildValue(mode: ThemeMode, system: ColorSchemeName, setMode: (m: ThemeMode) => void): ThemeValue {
  const resolved: 'light' | 'dark' =
    mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
  const isDark = resolved === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const tones = buildToneStyles(colors);
  return {
    colors,
    isDark,
    mode,
    setMode,
    scheme: resolved,
    shadow: shadowFor(colors),
    toneStyles: tones,
    toneStyle: (tone: CardTone = 'default') => tones[tone] ?? tones.default,
    accentForTone: (tone: CardTone = 'default') => (tones[tone] ?? tones.default).accent,
  };
}

const DEFAULT: ThemeValue = buildValue('system', Appearance.getColorScheme(), () => {});

const ThemeContext = createContext<ThemeValue>(DEFAULT);

/* ------------------------------------------------------------------ */
/* Provider                                                           */
/* ------------------------------------------------------------------ */

/**
 * ThemeProvider — resolves the active palette from the user's preference.
 *
 * Preference ('system' | 'light' | 'dark') lives in the UI store (persisted),
 * so toggling it in Settings flips the whole app live. 'system' tracks the OS
 * via RN Appearance and re-resolves when the device scheme changes.
 *
 * Mount this near the root (inside SafeAreaProvider) in app/_layout.tsx.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useUiStore((s) => s.themeMode);
  const setThemeMode = useUiStore((s) => s.setThemeMode);

  const [system, setSystem] = useState<ColorSchemeName>(() => Appearance.getColorScheme());

  // Track OS scheme changes (only meaningful while mode === 'system').
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystem(colorScheme));
    return () => sub.remove();
  }, []);

  const setMode = useCallback((m: ThemeMode) => setThemeMode(m), [setThemeMode]);

  const value = useMemo(() => buildValue(mode, system, setMode), [mode, system, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/* ------------------------------------------------------------------ */
/* Hook                                                               */
/* ------------------------------------------------------------------ */

/**
 * useTheme — the one hook every component uses to become theme-aware.
 *
 *   const { colors, isDark, shadow, toneStyle } = useTheme();
 *
 * Read colors from `colors` (the active palette), depth from `shadow`, and
 * wash styling from `toneStyle(tone)`. To change the user's preference call
 * `setMode('light' | 'dark' | 'system')`.
 *
 * Safe to call outside a provider (returns the light/system default), so it
 * never throws during early mount or in isolated previews.
 */
export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}

export default ThemeProvider;
