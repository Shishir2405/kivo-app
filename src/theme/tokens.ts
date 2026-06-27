/**
 * STEEP design system tokens for Kivo.
 *
 * Editorial, calm, premium. An editorial serif (Fraunces) for screen
 * titles/headlines + a clean sans (Inter) for everything else. Color is
 * PUNCTUATION: the chrome is monochrome; Rust + two washes are the only
 * chromatic voices. Flat surfaces (1px Dove hairline + ONE subtle shadow),
 * small mobile type scale, tight compact spacing.
 *
 * This module is the single source of truth, consumed by:
 *  - tailwind.config.js (mirrors the palette / radii / spacing)
 *  - the flat Steep primitives (Card / Button / Input ...)
 *  - any imperative styling that can't be expressed via NativeWind classes.
 *
 * NOTE ON BACK-COMPAT: legacy color/font keys (highlighter, carbon, paper,
 * canvas, displayBold, ...) are preserved as ALIASES remapped onto the Steep
 * palette so existing screens keep compiling while screen agents migrate to
 * the new Steep names. New code should prefer the Steep names below.
 */

/* ------------------------------------------------------------------ */
/* Color — the Steep palette                                          */
/* ------------------------------------------------------------------ */

/** The canonical Steep palette. Use these names in new code. */
export const palette = {
  ink: '#17191c', // primary text + the single filled CTA
  white: '#ffffff', // canvas + cards
  fog: '#f7f7f8', // section / secondary surfaces
  ash: '#4c4c4c', // muted body text
  graphite: '#777b86', // tertiary text + icon strokes
  dove: '#a3a6af', // hairline borders + placeholders
  rust: '#5d2a1a', // the ONLY warm accent — small highlights, key data strokes
  apricot: '#fbe1d1', // warm data card bg
  sky: '#d3e3fc', // cool data card bg
  success: '#3f7d57', // muted green (status only — keep rare)
  danger: '#9b3a2c', // muted red (errors only — keep rare)
} as const;

/**
 * Public color map. Steep names + legacy aliases (remapped onto Steep so the
 * whole app stays monochrome/premium even where old names are still used).
 */
export const colors = {
  // --- Steep names (prefer these) ---
  ink: palette.ink,
  white: palette.white,
  fog: palette.fog,
  ash: palette.ash,
  graphite: palette.graphite,
  dove: palette.dove,
  rust: palette.rust,
  apricot: palette.apricot,
  sky: palette.sky,
  success: palette.success,
  danger: palette.danger,

  // --- Legacy aliases (remapped → Steep; do NOT use in new code) ---
  /** was bright yellow accent → now Ink (the single CTA / active ink). */
  highlighter: palette.ink,
  /** was annotation red → muted danger. */
  annotation: palette.danger,
  /** was signal blue → graphite (chrome is monochrome). */
  signal: palette.graphite,
  /** was peach → Rust accent. */
  peach: palette.rust,
  /** was sunbeam yellow → Ink. */
  sunbeam: palette.ink,
  /** primary ink. */
  carbon: palette.ink,
  /** cards / surfaces. */
  paper: palette.white,
  /** page canvas → pure white (Steep canvas is white, Fog for sections). */
  canvas: palette.white,
  /** hairline borders → Dove. */
  hairline: palette.dove,
  /** soft shadow tint. */
  shadowGray: 'rgba(23,25,28,0.06)',
  /** secondary text → Ash. */
  textMuted: palette.ash,
  /** tertiary / placeholder text → Graphite. */
  textSubtle: palette.graphite,
} as const;

export type ColorToken = keyof typeof colors;
export type PaletteToken = keyof typeof palette;

/* ------------------------------------------------------------------ */
/* Typography                                                          */
/* ------------------------------------------------------------------ */

export const fonts = {
  // --- Steep: editorial SERIF (Fraunces) for titles/headlines ONLY ---
  serif: 'Fraunces_400Regular',
  serifMedium: 'Fraunces_500Medium',
  serifSemibold: 'Fraunces_600SemiBold',

  // --- Steep: clean SANS (Inter) for everything else (400/500 only) ---
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',

  // --- Legacy aliases (display* → serif; body* → Inter 400/500) ---
  /** legacy display → editorial serif (titles only). */
  displayBold: 'Fraunces_600SemiBold',
  displaySemibold: 'Fraunces_600SemiBold',
  displayMedium: 'Fraunces_500Medium',
  display: 'Fraunces_400Regular',
  /** body → Inter. Never heavy: bold maps to Inter 500 (medium). */
  body: 'Inter_400Regular',
  bodyLight: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodyBold: 'Inter_500Medium',
} as const;

/**
 * Kivo VERY SMALL mobile type scale (Steep adapted DOWN, then tightened a
 * notch further for a quiet, premium feel).
 *
 * display/screen-title (serif) ~26, section heading ~20–22 (serif), headingSm
 * ~16–17, subheading ~15, body ~13, caption ~11. Tight tracking (~-0.01em),
 * small line-heights. Nothing oversized — quiet by default.
 */
export const typeScale = {
  caption: { fontSize: 11, lineHeight: 15, letterSpacing: 0 },
  body: { fontSize: 13, lineHeight: 18, letterSpacing: -0.1 },
  subheading: { fontSize: 15, lineHeight: 20, letterSpacing: -0.15 },
  headingSm: { fontSize: 16, lineHeight: 21, letterSpacing: -0.2 },
  heading: { fontSize: 20, lineHeight: 25, letterSpacing: -0.3 },
  headingLg: { fontSize: 22, lineHeight: 27, letterSpacing: -0.4 },
  display: { fontSize: 26, lineHeight: 31, letterSpacing: -0.5 },
} as const;

/**
 * Default weight per variant. Heading/display variants render the editorial
 * SERIF; body variants render Inter 400/500.
 */
export const typeWeights = {
  caption: 'regular',
  body: 'regular',
  subheading: 'medium',
  headingSm: 'medium',
  heading: 'medium',
  headingLg: 'medium',
  display: 'medium',
} as const;

/* ------------------------------------------------------------------ */
/* Shape & spacing                                                     */
/* ------------------------------------------------------------------ */

export const radii = {
  pill: 9999, // buttons, tags, avatars — fully rounded
  card: 16, // cards 16–18 (small / clean)
  cardLg: 18, // largest card radius
  input: 12, // inputs 12–14
  frame: 14, // generic framed surfaces
  sm: 10, // small chips / inner elements
} as const;

/** Tight / compact spacing — base 4px. Quiet, small whitespace. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  dot: 20,
} as const;

/**
 * Default component paddings — small & quiet. Shared so primitives and screens
 * stay consistent. Prefer these over ad-hoc numbers.
 */
export const componentPadding = {
  card: 12, // inner card padding (was 14)
  cardLg: 14, // roomier card
  input: { x: 12, y: 9, minHeight: 42 }, // text field (was 44 minHeight)
  control: 36, // height for small controls (segments, icon buttons)
} as const;

/* ------------------------------------------------------------------ */
/* Elevation — ONE subtle shadow                                      */
/* ------------------------------------------------------------------ */

/**
 * The single Steep elevation: a soft drop shadow paired with a 1px ink-tinted
 * border (apply `borderWidth: 1, borderColor: colors.dove` on the surface).
 * NO neumorphism, NO dual soft shadows, NO puffy surfaces.
 */
export const shadow = {
  shadowColor: '#17191c',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
} as const;

/** The 1px hairline border that pairs with every flat surface. */
export const hairline = {
  borderWidth: 1,
  borderColor: colors.dove,
} as const;

/** Legacy alias — old code imported `softShadow`. */
export const softShadow = shadow;

/* ------------------------------------------------------------------ */
/* Interaction states — shared convention for every pressable.        */
/* ------------------------------------------------------------------ */

/**
 * The single Steep interaction vocabulary. Keep it quiet:
 *  - pressed: drop opacity (links/icons ~0.6, filled solids ~0.88).
 *  - hovered (web only, via Pressable's `hovered`): a faint Fog wash.
 *  - focus (inputs): border Dove -> Ink (or Rust where accenting).
 *  - disabled: opacity 0.4.
 *
 * Use `pressOpacity()` inside a Pressable style function to apply consistently.
 */
export const interaction = {
  pressOpacity: 0.6, // links / icon buttons / rows
  pressOpacitySolid: 0.88, // filled Ink pills (keep them barely move)
  pressScale: 0.98, // optional slight scale for tappable cards
  disabledOpacity: 0.4,
  hoverWash: 'rgba(23,25,28,0.035)', // faint Ink wash on web hover
  focusBorder: colors.ink, // input focus border
  focusBorderAccent: colors.rust, // input focus border when accenting
  idleBorder: colors.dove, // input/idle hairline
} as const;

/**
 * Resolve the opacity for a pressable given its press/disabled state.
 * `solid` selects the gentler 0.88 used by filled Ink buttons.
 */
export function pressOpacity(
  state: { pressed?: boolean },
  opts?: { disabled?: boolean; solid?: boolean },
): number {
  if (opts?.disabled) return interaction.disabledOpacity;
  if (state.pressed) return opts?.solid ? interaction.pressOpacitySolid : interaction.pressOpacity;
  return 1;
}

/* ------------------------------------------------------------------ */
/* Legacy neumorphism tokens — NEUTRALISED (flat).                     */
/* Kept ONLY so old imports compile; values produce no visible depth.  */
/* ------------------------------------------------------------------ */

export type NeumorphIntensity = 'sm' | 'md' | 'lg';

/** @deprecated Steep is flat. These values intentionally render flat. */
export const neumorph = {
  darkShadow: { color: 'transparent', distance: 0, startColor: 'transparent', offset: [0, 0] as [number, number] },
  lightShadow: { color: 'transparent', distance: 0, startColor: 'transparent', offset: [0, 0] as [number, number] },
  darkStart: 'transparent',
  lightStart: 'transparent',
  intensity: {
    sm: { distance: 0, offset: 0 },
    md: { distance: 0, offset: 0 },
    lg: { distance: 0, offset: 0 },
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dot-grid texture — legacy (Steep has no dot grid; near-invisible).  */
/* ------------------------------------------------------------------ */

export const dotGrid = {
  spacing: 20,
  dotSize: 1,
  color: colors.fog,
} as const;

export const theme = {
  palette,
  colors,
  fonts,
  typeScale,
  typeWeights,
  radii,
  spacing,
  componentPadding,
  shadow,
  hairline,
  softShadow,
  interaction,
  neumorph,
  dotGrid,
} as const;

export type Theme = typeof theme;
export default theme;
