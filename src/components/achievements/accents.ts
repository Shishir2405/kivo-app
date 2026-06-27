/**
 * Accent helpers for the Achievements feature (Steep).
 *
 * Color is punctuation. Earned badges use one of the two washes (Apricot / Sky)
 * or Rust as the chromatic voice; everything else is monochrome. The five
 * legacy tone tokens are remapped onto these Steep voices so existing callers
 * keep working without introducing saturated UI color.
 */
import { colors } from '@/theme/tokens';

export type Accent =
  | 'highlighter'
  | 'signal'
  | 'peach'
  | 'annotation'
  | 'success';

/** Ink/stroke per accent (the figure color on a wash chip). */
export const ACCENT_INK: Record<Accent, string> = {
  highlighter: colors.ink,
  signal: colors.ink,
  peach: colors.rust,
  annotation: colors.rust,
  success: colors.ink,
};

/** Wash fill per accent (the chip background). */
export const ACCENT_WASH: Record<Accent, string> = {
  highlighter: colors.apricot,
  signal: colors.sky,
  peach: colors.apricot,
  annotation: colors.apricot,
  success: colors.sky,
};

/** Ink that contrasts on top of a solid accent fill (always white in Steep). */
export function onAccentInk(_accent: Accent): string {
  return colors.white;
}
