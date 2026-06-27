/**
 * Accent helpers for the Achievements feature (calm-but-colorful Steep).
 *
 * Each accent maps onto one of the curated soft washes (peach / sky / mint /
 * lavender / butter) from the color foundation, so a badge grid rotates through
 * the palette and reads as intentional, not random. The chip background is the
 * wash `bg`; the glyph/figure uses the matching deeper `accent`. Text stays
 * Ink/Ash for contrast. Legacy tone tokens are kept and remapped onto washes so
 * existing callers compile and pick up the new color automatically.
 *
 * THEME-AWARE: the wash/ink/border values are resolved from the ACTIVE palette
 * (light or dark) via `useTheme().toneStyle`, so badges adapt to dark mode.
 * Components read `const m = useAccentMaps()` then `m.ink[tone]` etc.
 */
import type { ToneStyle } from '@/theme/tokens';
import { useTheme } from '@/theme';
import type { CardTone } from '@/theme/tokens';

/**
 * The accent vocabulary. The five washes are the real voices; the legacy tokens
 * (highlighter / signal / annotation / success) are accepted and remapped onto
 * washes for back-compat.
 */
export type Accent =
  | CardTone // 'default' | 'peach' | 'sky' | 'mint' | 'lavender' | 'butter'
  | 'highlighter'
  | 'signal'
  | 'annotation'
  | 'success';

/** Normalise any accepted accent (incl. legacy tokens) to a foundation tone. */
export function resolveAccent(accent: Accent): CardTone {
  switch (accent) {
    case 'highlighter':
      return 'butter';
    case 'signal':
      return 'sky';
    case 'annotation':
      return 'peach';
    case 'success':
      return 'mint';
    default:
      return accent;
  }
}

export type AccentMaps = {
  /** Ink/stroke per accent (the deeper figure color on its wash chip). */
  ink: Record<Accent, string>;
  /** Wash fill per accent (the chip background). */
  wash: Record<Accent, string>;
  /** Matching hairline tint per accent (a deeper tint of the wash). */
  border: Record<Accent, string>;
  /** Resolve an accent to its full foundation {bg, border, accent} styling. */
  style: (accent: Accent) => ToneStyle;
};

/**
 * useAccentMaps — theme-aware accent lookups for the Achievements feature.
 * Reads the ACTIVE palette so the maps deepen correctly in dark mode.
 */
export function useAccentMaps(): AccentMaps {
  const { toneStyle } = useTheme();

  const ink: Record<Accent, string> = {
    default: toneStyle('default').accent,
    peach: toneStyle('peach').accent,
    sky: toneStyle('sky').accent,
    mint: toneStyle('mint').accent,
    lavender: toneStyle('lavender').accent,
    butter: toneStyle('butter').accent,
    highlighter: toneStyle('butter').accent,
    signal: toneStyle('sky').accent,
    annotation: toneStyle('peach').accent,
    success: toneStyle('mint').accent,
  };

  const wash: Record<Accent, string> = {
    default: toneStyle('default').bg,
    peach: toneStyle('peach').bg,
    sky: toneStyle('sky').bg,
    mint: toneStyle('mint').bg,
    lavender: toneStyle('lavender').bg,
    butter: toneStyle('butter').bg,
    highlighter: toneStyle('butter').bg,
    signal: toneStyle('sky').bg,
    annotation: toneStyle('peach').bg,
    success: toneStyle('mint').bg,
  };

  const border: Record<Accent, string> = {
    default: toneStyle('default').border,
    peach: toneStyle('peach').border,
    sky: toneStyle('sky').border,
    mint: toneStyle('mint').border,
    lavender: toneStyle('lavender').border,
    butter: toneStyle('butter').border,
    highlighter: toneStyle('butter').border,
    signal: toneStyle('sky').border,
    annotation: toneStyle('peach').border,
    success: toneStyle('mint').border,
  };

  return {
    ink,
    wash,
    border,
    style: (accent: Accent) => toneStyle(resolveAccent(accent)),
  };
}

/** Ink that contrasts on top of a solid accent fill (always inverted ink). */
export function onAccentInk(_accent: Accent): string {
  return '#ffffff';
}
