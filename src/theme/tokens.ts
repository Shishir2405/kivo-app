/**
 * KIVO design system tokens — "warm editorial".
 *
 * A calm, premium, paper-warm aesthetic. An editorial SERIF (Newsreader) for
 * screen titles, headlines and key numbers + a clean SANS (Figtree) for body,
 * labels and UI. JetBrains Mono for code / tokens. Color is intentional: a
 * cream canvas, near-black warm ink, a terracotta primary, five soft "card
 * washes" each paired with a deep accent for its icon/number, and three quiet
 * semantic tones. Flat surfaces (1px hairline + ONE soft shadow), small mobile
 * type scale, base-4 spacing.
 *
 * THIS MODULE IS THE SINGLE SOURCE OF TRUTH, consumed by:
 *  - tailwind.config.js (mirrors the palette / radii / spacing)
 *  - the theme system (ThemeProvider / useTheme) which selects light vs dark
 *  - the Kivo primitives (Card / PillButton / SoftInput ...)
 *  - any imperative styling that can't be expressed via NativeWind classes.
 *
 * THEME MODEL
 *  - `lightColors` / `darkColors` are the two FULL palettes (every token).
 *  - `colors` === `lightColors` and is the BACK-COMPAT static export. Older
 *    screens that `import { colors }` keep compiling and render the light
 *    palette. New / re-skinned components should consume `useTheme()` so they
 *    are dark-aware. Both palettes expose the SAME keys.
 *
 * NOTE ON BACK-COMPAT: legacy color/font keys (highlighter, carbon, paper,
 * fog, dove, apricot, displayBold, sansMedium, ...) are preserved as ALIASES
 * remapped onto the Kivo palette so existing code keeps compiling unchanged.
 */

/* ------------------------------------------------------------------ */
/* Color — the Kivo palette (per-theme)                               */
/* ------------------------------------------------------------------ */

/** Per-tone surface styling: wash bg, matching hairline border, deep accent. */
export type ToneStyle = { bg: string; border: string; accent: string };

/** The named card surface tones (the soft-wash color layer). */
export type CardTone = 'default' | 'peach' | 'sky' | 'mint' | 'lavender' | 'butter';

/**
 * The full shape of a Kivo palette. Light and dark both implement EVERY key,
 * so any component can be made dark-aware just by reading from the active
 * palette returned by `useTheme()`.
 */
export type AppColors = {
  /* ---- base & ink ---- */
  canvas: string; // page background (cream / warm dark)
  surface: string; // cards / sheets (white / raised dark)
  surfaceAlt: string; // secondary surface (well / deep dark)
  ink: string; // primary text + the one filled-on-light glyph
  inkInverted: string; // text/icon ON ink / on primary fills
  muted: string; // secondary / tertiary text + icon strokes
  hairline: string; // 1px borders
  primary: string; // terracotta — the single CTA + active accent
  primaryPressed: string; // darker terracotta (pressed)
  primaryWash: string; // faint terracotta tint (rings / tracks / soft fills)
  primaryOnWash: string; // readable terracotta text on cream / on primaryWash
  onPrimary: string; // text/icon ON the filled terracotta CTA — light in BOTH themes

  /* ---- five card washes (bg) ---- */
  peach: string;
  sky: string;
  mint: string;
  lavender: string;
  butter: string;

  /* ---- matching deep accents (icon / number on each wash) ---- */
  peachAccent: string;
  skyAccent: string;
  mintAccent: string;
  lavenderAccent: string;
  butterAccent: string;

  /* ---- semantic ---- */
  success: string;
  warn: string;
  danger: string;
  successWash: string;
  warnWash: string;
  dangerWash: string;

  /* ---- misc ---- */
  shadowTint: string; // base shadow color
  overlay: string; // scrim behind sheets / modals

  /* ===== BACK-COMPAT ALIASES (remapped onto Kivo) ===== */
  white: string; // -> surface
  paper: string; // -> surface
  fog: string; // -> surfaceAlt (secondary surface)
  ash: string; // -> a soft ink for body copy
  graphite: string; // -> muted
  dove: string; // -> hairline
  rust: string; // -> primary (terracotta)
  apricot: string; // -> peach wash
  highlighter: string; // -> ink (legacy bright accent → ink)
  annotation: string; // -> danger
  signal: string; // -> muted
  sunbeam: string; // -> ink
  carbon: string; // -> ink
  shadowGray: string; // -> shadow tint @ low alpha
  textMuted: string; // -> ash
  textSubtle: string; // -> muted
};

/* ---- LIGHT ---------------------------------------------------------- */
export const lightColors: AppColors = {
  canvas: '#F7F3ED',
  surface: '#FFFFFF',
  surfaceAlt: '#EDE7DD',
  ink: '#211C17',
  inkInverted: '#F7F3ED',
  muted: '#8C8377',
  hairline: '#E8E1D6',
  primary: '#C46A3D',
  primaryPressed: '#AE5A30',
  primaryWash: '#F6E2DC',
  primaryOnWash: '#A8714B',
  onPrimary: '#F7F3ED',

  peach: '#FAE7DB',
  sky: '#E1EBF0',
  mint: '#E0EDE4',
  lavender: '#EBE6F2',
  butter: '#F4EBD2',

  peachAccent: '#BD6238',
  skyAccent: '#3C7488',
  mintAccent: '#3C7E5D',
  lavenderAccent: '#6A569A',
  butterAccent: '#927428',

  success: '#3C7E5D',
  warn: '#927428',
  danger: '#BE5440',
  successWash: '#E0EDE4',
  warnWash: '#F4EBD2',
  dangerWash: '#F6E2DC',

  shadowTint: '#211C17',
  overlay: 'rgba(33,28,23,0.32)',

  // back-compat
  white: '#FFFFFF',
  paper: '#FFFFFF',
  fog: '#EDE7DD',
  ash: '#3F382F',
  graphite: '#8C8377',
  dove: '#E8E1D6',
  rust: '#C46A3D',
  apricot: '#FAE7DB',
  highlighter: '#211C17',
  annotation: '#BE5440',
  signal: '#8C8377',
  sunbeam: '#211C17',
  carbon: '#211C17',
  shadowGray: 'rgba(33,28,23,0.06)',
  textMuted: '#3F382F',
  textSubtle: '#8C8377',
};

/* ---- DARK ----------------------------------------------------------- */
/* Read from the HTML "Dark theme" section: warm dark canvas #181511, raised
 * surfaces in warm browns (#2a2014 / #2a241b), washes deepened to muted
 * brown-tints, terracotta accent stays #C46A3D, ink inverts to warm cream. */
export const darkColors: AppColors = {
  canvas: '#181511',
  surface: '#23201A', // warm raised card (avg of the dark card browns)
  surfaceAlt: '#0F0D0A', // deepest well
  ink: '#F7F3ED',
  inkInverted: '#181511',
  muted: '#A89F92',
  hairline: '#3A3026',
  primary: '#C46A3D',
  primaryPressed: '#AE5A30',
  primaryWash: '#2E2418',
  primaryOnWash: '#E6B08A',
  onPrimary: '#F7F3ED',

  peach: '#2E2014',
  sky: '#1D2A30',
  mint: '#1C2A22',
  lavender: '#241F33',
  butter: '#2A2414',

  peachAccent: '#E2A884',
  skyAccent: '#9CC3D3',
  mintAccent: '#9CCCB0',
  lavenderAccent: '#B7A6E0',
  butterAccent: '#D8C389',

  success: '#7FBE9B',
  warn: '#D8C389',
  danger: '#E08C76',
  successWash: '#1C2A22',
  warnWash: '#2A2414',
  dangerWash: '#2E2014',

  shadowTint: '#000000',
  overlay: 'rgba(0,0,0,0.55)',

  // back-compat
  white: '#23201A', // legacy "white" surfaces become the raised dark surface
  paper: '#23201A',
  fog: '#0F0D0A',
  ash: '#D8CCBC',
  graphite: '#A89F92',
  dove: '#3A3026',
  rust: '#C46A3D',
  apricot: '#2E2014',
  highlighter: '#F7F3ED',
  annotation: '#E08C76',
  signal: '#A89F92',
  sunbeam: '#F7F3ED',
  carbon: '#F7F3ED',
  shadowGray: 'rgba(0,0,0,0.4)',
  textMuted: '#D8CCBC',
  textSubtle: '#A89F92',
};

/**
 * BACK-COMPAT static export = the LIGHT palette.
 *
 * Screens / components that haven't migrated to `useTheme()` import this and
 * render in light. Newly theme-aware components should read the active palette
 * from `useTheme()` instead (see src/theme/ThemeContext).
 */
export const colors = lightColors;

export type ColorToken = keyof AppColors;

/** Legacy raw palette object (kept for code that imports `palette`). */
export const palette = {
  ink: lightColors.ink,
  white: lightColors.surface,
  fog: lightColors.fog,
  ash: lightColors.ash,
  graphite: lightColors.muted,
  dove: lightColors.hairline,
  rust: lightColors.primary,
  apricot: lightColors.peach,
  sky: lightColors.sky,
  peach: lightColors.peach,
  mint: lightColors.mint,
  lavender: lightColors.lavender,
  butter: lightColors.butter,
  peachAccent: lightColors.peachAccent,
  skyAccent: lightColors.skyAccent,
  mintAccent: lightColors.mintAccent,
  lavenderAccent: lightColors.lavenderAccent,
  butterAccent: lightColors.butterAccent,
  success: lightColors.success,
  warn: lightColors.warn,
  danger: lightColors.danger,
} as const;

export type PaletteToken = keyof typeof palette;

/* ------------------------------------------------------------------ */
/* Card tones — the soft-wash COLOR layer (per-theme)                 */
/* ------------------------------------------------------------------ */

/** Build the {bg,border,accent} map for a given palette. */
export function buildToneStyles(c: AppColors): Record<CardTone, ToneStyle> {
  return {
    default: { bg: c.surface, border: c.hairline, accent: c.ink },
    peach: { bg: c.peach, border: mixBorder(c.peach, c), accent: c.peachAccent },
    sky: { bg: c.sky, border: mixBorder(c.sky, c), accent: c.skyAccent },
    mint: { bg: c.mint, border: mixBorder(c.mint, c), accent: c.mintAccent },
    lavender: { bg: c.lavender, border: mixBorder(c.lavender, c), accent: c.lavenderAccent },
    butter: { bg: c.butter, border: mixBorder(c.butter, c), accent: c.butterAccent },
  };
}

/**
 * The wash-tint hairline. In light, washes use a slightly deeper tint border
 * (matches the HTML, e.g. peach #FAE7DB / border #EFD6C6). We keep an explicit
 * map for light fidelity and derive a subtle dark border otherwise.
 */
const LIGHT_TONE_BORDERS: Record<Exclude<CardTone, 'default'>, string> = {
  peach: '#EFD6C6',
  sky: '#CFDEE6',
  mint: '#CCE0D2',
  lavender: '#DBD3E8',
  butter: '#E6D9B8',
};
function mixBorder(washBg: string, c: AppColors): string {
  if (c === lightColors) {
    const key = (Object.keys(LIGHT_TONE_BORDERS) as Array<keyof typeof LIGHT_TONE_BORDERS>).find(
      (k) => c[k] === washBg,
    );
    if (key) return LIGHT_TONE_BORDERS[key];
    return c.hairline;
  }
  // dark: a warm hairline reads better than a tint
  return c.hairline;
}

/** Light tone styles (back-compat for direct `toneStyles` importers). */
export const toneStyles: Record<CardTone, ToneStyle> = buildToneStyles(lightColors);

/**
 * Ordered washes for rotating color across a grid so it looks intentional, not
 * random. (Excludes `default`, which you reserve for dense content.)
 */
export const cardTones = ['peach', 'sky', 'mint', 'lavender', 'butter'] as const;

/** Cycle the wash palette by index — e.g. `toneAt(i)` for the i-th grid card. */
export function toneAt(index: number): CardTone {
  const list = cardTones;
  return list[((index % list.length) + list.length) % list.length];
}

/** Full {bg,border,accent} for a tone in the LIGHT palette (back-compat). */
export function toneStyle(tone: CardTone = 'default'): ToneStyle {
  return toneStyles[tone] ?? toneStyles.default;
}

/** The deeper accent/icon color for a tone in the LIGHT palette (back-compat). */
export function accentForTone(tone: CardTone = 'default'): string {
  return toneStyle(tone).accent;
}

/* ------------------------------------------------------------------ */
/* Typography — Newsreader (serif) + Figtree (sans) + JetBrains Mono   */
/* ------------------------------------------------------------------ */

export const fonts = {
  // --- editorial SERIF (Newsreader) for titles / headlines / key numbers ---
  serif: 'Newsreader_400Regular',
  serifMedium: 'Newsreader_500Medium',
  serifSemibold: 'Newsreader_600SemiBold',
  serifItalic: 'Newsreader_400Regular_Italic',
  serifMediumItalic: 'Newsreader_500Medium_Italic',

  // --- clean SANS (Figtree) for body / labels / UI ---
  sans: 'Figtree_400Regular',
  sansMedium: 'Figtree_500Medium',
  sansSemibold: 'Figtree_600SemiBold',
  sansBold: 'Figtree_700Bold',

  // --- monospace (JetBrains Mono) for code / tokens / numeric chips ---
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',

  // --- Legacy aliases (display* → serif; body* → Figtree) ---
  displayBold: 'Newsreader_600SemiBold',
  displaySemibold: 'Newsreader_600SemiBold',
  displayMedium: 'Newsreader_500Medium',
  display: 'Newsreader_400Regular',
  body: 'Figtree_400Regular',
  bodyLight: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodyBold: 'Figtree_600SemiBold',
} as const;

export type FontToken = keyof typeof fonts;

/**
 * KIVO mobile type scale (from the HTML "Type" panel, tuned for mobile):
 *  Display 40 (serif) · H1 ~30 (serif) · H2 ~22–26 (serif) · H3 17 (sans 600)
 *  · Body 15 (sans) · Caption ~13 · Overline 11 (.14em uppercase).
 *
 * Variant names are kept stable so existing screens keep compiling:
 *  display=Display, headingLg=H2, heading=H1-ish, headingSm=H3, subheading,
 *  body, caption. (`overline` added.)
 */
export const typeScale = {
  overline: { fontSize: 11, lineHeight: 14, letterSpacing: 1.5 }, // .14em ≈ 1.5px @ 11
  caption: { fontSize: 13, lineHeight: 17, letterSpacing: 0 },
  body: { fontSize: 15, lineHeight: 21, letterSpacing: -0.1 },
  subheading: { fontSize: 16, lineHeight: 22, letterSpacing: -0.15 },
  headingSm: { fontSize: 17, lineHeight: 23, letterSpacing: -0.2 }, // H3 sans 600
  heading: { fontSize: 24, lineHeight: 29, letterSpacing: -0.3 }, // H2 serif
  headingLg: { fontSize: 28, lineHeight: 32, letterSpacing: -0.4 }, // big serif
  display: { fontSize: 36, lineHeight: 40, letterSpacing: -0.6 }, // Display serif
} as const;

export type TypeVariant = keyof typeof typeScale;

/**
 * Default weight per variant. Heading/display variants render Newsreader; body
 * variants render Figtree. headingSm (H3) is sans-600 per the HTML.
 */
export const typeWeights = {
  overline: 'semibold',
  caption: 'regular',
  body: 'regular',
  subheading: 'medium',
  headingSm: 'semibold',
  heading: 'medium',
  headingLg: 'medium',
  display: 'medium',
} as const;

/* ------------------------------------------------------------------ */
/* Shape & spacing                                                     */
/* ------------------------------------------------------------------ */

export const radii = {
  pill: 9999, // buttons, tags, avatars, the dock — fully rounded
  card: 16, // cards 16
  cardLg: 18, // large card / sheet 18
  input: 12, // inputs 12
  frame: 14, // generic framed surfaces
  sm: 10, // small chips / inner elements
} as const;

/** Kivo spacing — base 4px: 4 · 8 · 12 · 16 · 24 · 32. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  dot: 20,
} as const;

/**
 * Default component paddings. Shared so primitives and screens stay consistent.
 */
export const componentPadding = {
  card: 16, // inner card padding
  cardLg: 20, // roomier card
  input: { x: 13, y: 11, minHeight: 44 }, // text field
  control: 40, // height for small controls (segments, icon buttons)
} as const;

/* ------------------------------------------------------------------ */
/* Elevation — ONE soft shadow                                         */
/* ------------------------------------------------------------------ */

/**
 * The single Kivo elevation: one soft, subtle drop shadow paired with a 1px
 * hairline border on the surface. NO neumorphism, NO dual soft shadows.
 *
 * Use `shadow` for the static light value, or `shadowFor(colors)` to tint the
 * shadow per-theme (dark shadows are pure black + stronger).
 */
export const shadow = {
  shadowColor: '#211C17',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 14,
  elevation: 2,
} as const;

/** Per-theme shadow (dark gets a deeper black shadow). */
export function shadowFor(c: AppColors) {
  const dark = c === darkColors;
  return {
    shadowColor: c.shadowTint,
    shadowOffset: { width: 0, height: dark ? 10 : 4 },
    shadowOpacity: dark ? 0.5 : 0.06,
    shadowRadius: dark ? 22 : 14,
    elevation: dark ? 6 : 2,
  } as const;
}

/** The 1px hairline border that pairs with every flat surface. */
export const hairline = {
  borderWidth: 1,
  borderColor: lightColors.hairline,
} as const;

/** Legacy alias — old code imported `softShadow`. */
export const softShadow = shadow;

/* ------------------------------------------------------------------ */
/* Motion tokens — the Kivo timing language.                          */
/* ------------------------------------------------------------------ */

/**
 * Durations (ms) and easings from the HTML:
 *  - micro      150–220ms (toggles, taps, opacity)
 *  - transition 280–360ms (cards in, sheet/segment moves)
 *  - reveal     ~600ms     (entrance fades — `.6s` cubic-bezier(.22,1,.36,1))
 *  - spring     cubic-bezier(.34,1.56,.64,1) — overshoot (segment / dock pill)
 *  - easing     cubic-bezier(.22,1,.36,1)    — smooth ease-out (everything else)
 */
export const motion = {
  duration: {
    micro: 180, // 150–220
    microFast: 150,
    transition: 320, // 280–360
    transitionSlow: 360,
    reveal: 600,
  },
  /** Cubic-bezier control points (use with reanimated `Easing.bezier(...)`). */
  bezier: {
    /** smooth ease-out — the default for fades / moves. */
    easing: [0.22, 1, 0.36, 1] as const,
    /** overshoot spring — segmented pill & dock indicator. */
    spring: [0.34, 1.56, 0.64, 1] as const,
    /** gentle ease-in (for exits). */
    easeIn: [0.4, 0, 1, 1] as const,
  },
  /** Reanimated / moti spring config approximating the overshoot bezier. */
  spring: {
    type: 'spring' as const,
    stiffness: 520,
    damping: 30,
    mass: 0.8,
  },
  /** A snappier spring for small indicators (dock / segment pill). */
  springSnappy: {
    type: 'spring' as const,
    stiffness: 600,
    damping: 34,
    mass: 0.7,
  },
} as const;

/* ------------------------------------------------------------------ */
/* Interaction states — shared convention for every pressable.        */
/* ------------------------------------------------------------------ */

export const interaction = {
  pressOpacity: 0.6, // links / icon buttons / rows
  pressOpacitySolid: 0.9, // filled primary pills (keep them barely move)
  pressScale: 0.98, // optional slight scale for tappable cards
  disabledOpacity: 0.45,
  hoverWash: 'rgba(33,28,23,0.035)', // faint ink wash on web hover
  focusBorder: lightColors.primary, // input focus border (terracotta)
  focusBorderAccent: lightColors.primary, // (same; kept for back-compat)
  idleBorder: lightColors.hairline, // input/idle hairline
  /** Terracotta focus glow (box-shadow 0 0 0 4px rgba(196,106,61,.1)). */
  focusRing: 'rgba(196,106,61,0.12)',
} as const;

/**
 * Resolve the opacity for a pressable given its press/disabled state.
 * `solid` selects the gentler value used by filled buttons.
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

/** @deprecated Kivo is flat. These values intentionally render flat. */
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
/* Dot-grid texture — legacy (Kivo has no dot grid; near-invisible).   */
/* ------------------------------------------------------------------ */

export const dotGrid = {
  spacing: 20,
  dotSize: 1,
  color: lightColors.hairline,
} as const;

export const theme = {
  lightColors,
  darkColors,
  palette,
  colors,
  toneStyles,
  cardTones,
  toneAt,
  toneStyle,
  accentForTone,
  buildToneStyles,
  fonts,
  typeScale,
  typeWeights,
  radii,
  spacing,
  componentPadding,
  shadow,
  shadowFor,
  hairline,
  softShadow,
  motion,
  interaction,
  neumorph,
  dotGrid,
} as const;

export type Theme = typeof theme;
export default theme;
