/**
 * Shared accent helpers for the Achievements feature.
 *
 * `AchievementEntry.tone` is one of the five Aaply accent tokens. Each maps to
 * a strong "ink" hex (the saturated brand color) and a soft "wash" hex (the
 * pale tint used behind icon chips, matching the Tag component's palette).
 */
import { colors } from '@/theme/tokens';

export type Accent =
  | 'highlighter'
  | 'signal'
  | 'peach'
  | 'annotation'
  | 'success';

/** Saturated brand ink per accent — used for glyphs, bars and emphasis. */
export const ACCENT_INK: Record<Accent, string> = {
  highlighter: colors.highlighter,
  signal: colors.signal,
  peach: colors.peach,
  annotation: colors.annotation,
  success: colors.success,
};

/** Pale wash per accent — mirrors the Tag tones; reads on the gray canvas. */
export const ACCENT_WASH: Record<Accent, string> = {
  highlighter: '#fbfbcf',
  signal: '#e1e8ff',
  peach: '#ffe6dd',
  annotation: '#ffe2e2',
  success: '#dff5e8',
};

/** Ink that contrasts on top of a solid accent fill. */
export function onAccentInk(accent: Accent): string {
  return accent === 'highlighter' ? colors.carbon : colors.paper;
}
