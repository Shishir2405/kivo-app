/**
 * Kivo theme barrel.
 *
 *   import { useTheme, ThemeProvider } from '@/theme';
 *   import { fonts, radii, spacing, motion } from '@/theme';
 *
 * Components become dark-aware by reading the ACTIVE palette from useTheme():
 *   const { colors, isDark, shadow, toneStyle } = useTheme();
 *
 * Static tokens (fonts / radii / spacing / motion / type scale) don't change
 * with theme, so import them directly. The static `colors` export is the LIGHT
 * palette (back-compat) — prefer useTheme().colors in new code.
 */
export { ThemeProvider, useTheme, type ThemeValue, type ThemeMode } from './ThemeContext';
export {
  ThemeTransitionProvider,
  useThemeTransition,
  type ThemeTransitionValue,
  type TransitionOrigin,
} from './ThemeTransition';
export { useAppFonts } from './useAppFonts';
export * from './tokens';
export { default } from './tokens';
