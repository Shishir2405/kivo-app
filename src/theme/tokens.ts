/**
 * Aaply design system tokens for Kivo.
 *
 * Theme: light. "Digital sketchpad with electric highlighter" — now rendered
 * with a NEUMORPHIC (soft-UI) surface treatment on the graphite-mist canvas.
 *
 * This module is the single source of truth consumed by:
 *  - tailwind.config.js (mirrors these colors / sizes)
 *  - the neumorphic primitives (SoftCard / SoftButton / Neumorph ...)
 *  - any imperative styling that can't be expressed via NativeWind classes.
 */

/* ------------------------------------------------------------------ */
/* Color                                                               */
/* ------------------------------------------------------------------ */

export const colors = {
  // Brand accents
  highlighter: '#e6e51e', // primary brand accent — pills, logo, highlights
  annotation: '#f34646', // annotation red
  signal: '#466cf3', // signal blue
  peach: '#ff8562', // peach wash
  sunbeam: '#fff705', // sunbeam yellow

  // Ink & surfaces
  carbon: '#000000', // primary text / ink, dark buttons
  paper: '#ffffff', // cards / light highlight
  canvas: '#f2f2f2', // page canvas (graphite mist) — neumorphic base
  hairline: '#e6e6e6', // borders / dot-grid dots
  shadowGray: '#cccccc', // soft dark shadow for neumorphism

  // Functional
  textMuted: '#6b6b6b',
  textSubtle: '#9a9a9a',
  success: '#3bbf6f',
} as const;

export type ColorToken = keyof typeof colors;

/* ------------------------------------------------------------------ */
/* Typography                                                          */
/* ------------------------------------------------------------------ */

export const fonts = {
  // Poppins — display / headings
  displayBold: 'Poppins_700Bold',
  displaySemibold: 'Poppins_600SemiBold',
  displayMedium: 'Poppins_500Medium',
  display: 'Poppins_400Regular',
  // Inter — body / UI
  body: 'Inter_400Regular',
  bodyLight: 'Inter_300Light',
  bodyMedium: 'Inter_500Medium',
  bodyBold: 'Inter_700Bold',
} as const;

/** Aaply type scale (size + tracking). */
export const typeScale = {
  caption: { fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  body: { fontSize: 16, lineHeight: 24, letterSpacing: 0 },
  subheading: { fontSize: 18, lineHeight: 26, letterSpacing: -0.5 },
  headingSm: { fontSize: 27, lineHeight: 32, letterSpacing: -0.5 },
  heading: { fontSize: 34, lineHeight: 38, letterSpacing: -1 },
  headingLg: { fontSize: 52, lineHeight: 54, letterSpacing: -1.5 },
  display: { fontSize: 57, lineHeight: 58, letterSpacing: -2 },
} as const;

/* ------------------------------------------------------------------ */
/* Shape & spacing                                                     */
/* ------------------------------------------------------------------ */

export const radii = {
  pill: 9999, // buttons & tags — fully rounded
  card: 32, // cards 30–40
  cardLg: 40,
  input: 16,
  frame: 16, // product / mockup frames
  sm: 12,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  dot: 20, // dot-grid spacing
} as const;

/* ------------------------------------------------------------------ */
/* Elevation / neumorphism                                             */
/* ------------------------------------------------------------------ */

/**
 * The single "soft" Aaply shadow — kept for floating accents (yellow pills,
 * the animated splash). Neumorphic surfaces use the dual-shadow presets below.
 */
export const softShadow = {
  shadowColor: 'rgba(0,0,0,0.2)',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 1,
  shadowRadius: 10,
  elevation: 8,
} as const;

/**
 * Neumorphism (soft-UI) presets for `react-native-shadow-2`'s <Shadow>.
 * A raised surface = a dark shadow bottom-right + a light highlight top-left.
 * We render two stacked <Shadow> layers to get the dual effect.
 */
export const neumorph = {
  /** Soft dark shadow (bottom-right). */
  darkShadow: {
    color: colors.shadowGray,
    distance: 8,
    startColor: 'rgba(174,174,192,0.45)',
    offset: [6, 6] as [number, number],
  },
  /** Light highlight (top-left). */
  lightShadow: {
    color: '#ffffff',
    distance: 8,
    startColor: 'rgba(255,255,255,0.9)',
    offset: [-6, -6] as [number, number],
  },
  /** Intensity presets scale the distance/offset. */
  intensity: {
    sm: { distance: 5, offset: 4 },
    md: { distance: 8, offset: 6 },
    lg: { distance: 12, offset: 9 },
  },
} as const;

export type NeumorphIntensity = keyof typeof neumorph.intensity;

/* ------------------------------------------------------------------ */
/* Dot-grid texture                                                    */
/* ------------------------------------------------------------------ */

export const dotGrid = {
  spacing: 20,
  dotSize: 1.5,
  color: colors.hairline,
} as const;

export const theme = {
  colors,
  fonts,
  typeScale,
  radii,
  spacing,
  softShadow,
  neumorph,
  dotGrid,
} as const;

export type Theme = typeof theme;
export default theme;
