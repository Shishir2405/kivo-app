import React from 'react';
import { Text, type TextProps, type TextStyle, type StyleProp } from 'react-native';
import { fonts, typeScale, type TypeVariant } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

type Variant = TypeVariant; // display | headingLg | heading | headingSm | subheading | body | caption | overline

type Weight = 'light' | 'regular' | 'medium' | 'semibold' | 'bold';

export type AppTextProps = TextProps & {
  variant?: Variant;
  weight?: Weight;
  color?: string;
  /**
   * Force the editorial SERIF (Newsreader). Heading/display variants use it by
   * default; pass `display={false}` to render a heading in Figtree instead, or
   * `display` on a body variant for a small serif accent (use sparingly).
   */
  display?: boolean;
  /** Italic serif — for editorial eyebrows / numerals (Newsreader italic). */
  italic?: boolean;
  /** Uppercase the text (used by `overline`). */
  uppercase?: boolean;
  style?: StyleProp<TextStyle>;
};

/** Variants that render the editorial serif by default (titles/headlines/key numbers). */
const SERIF_VARIANTS: Variant[] = ['display', 'headingLg', 'heading'];

function serifFamily(weight: Weight, italic?: boolean): string {
  if (italic) {
    return weight === 'medium' || weight === 'semibold' || weight === 'bold'
      ? fonts.serifMediumItalic
      : fonts.serifItalic;
  }
  if (weight === 'semibold' || weight === 'bold') return fonts.serifSemibold;
  if (weight === 'medium') return fonts.serifMedium;
  return fonts.serif;
}

function sansFamily(weight: Weight): string {
  // Figtree ships 400/500/600/700.
  if (weight === 'bold') return fonts.sansBold;
  if (weight === 'semibold') return fonts.sansSemibold;
  if (weight === 'medium') return fonts.sansMedium;
  return fonts.sans;
}

/**
 * Defensively coerce children so a non-primitive value (e.g. an API error
 * object {code, message, requestId}) can never throw "Objects are not valid as
 * a React child" and white-screen the app.
 */
function coerceChild(children: React.ReactNode): React.ReactNode {
  if (
    children == null ||
    typeof children === 'string' ||
    typeof children === 'number' ||
    typeof children === 'boolean' ||
    Array.isArray(children) ||
    React.isValidElement(children)
  ) {
    return children;
  }
  if (typeof children === 'object') {
    const msg = (children as { message?: unknown }).message;
    return typeof msg === 'string' ? msg : '';
  }
  return children;
}

/**
 * AppText — typed text bound to the Kivo type scale + font families.
 *
 * Heading/display variants render Newsreader (editorial serif); body variants
 * render Figtree (clean sans). `headingSm` (H3) is sans-600. `overline` is a
 * small uppercase Figtree-600 eyebrow with wide tracking. Default color is the
 * ACTIVE theme ink (dark-aware) — pass a `color` for muted/secondary copy.
 */
export function AppText({
  variant = 'body',
  weight,
  color,
  display,
  italic,
  uppercase,
  style,
  children,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();
  const isSerif = display ?? SERIF_VARIANTS.includes(variant);
  const defaultWeight: Weight =
    variant === 'overline'
      ? 'semibold'
      : variant === 'headingSm'
        ? 'semibold'
        : variant === 'subheading'
          ? 'medium'
          : isSerif
            ? 'medium'
            : 'regular';
  const w: Weight = weight ?? defaultWeight;
  const scale = typeScale[variant];

  return (
    <Text
      style={[
        {
          fontFamily: isSerif ? serifFamily(w, italic) : sansFamily(w),
          fontSize: scale.fontSize,
          lineHeight: scale.lineHeight,
          letterSpacing: scale.letterSpacing,
          color: color ?? colors.ink,
          textTransform: uppercase || variant === 'overline' ? 'uppercase' : undefined,
        },
        style,
      ]}
      {...rest}
    >
      {coerceChild(children)}
    </Text>
  );
}

export default AppText;
