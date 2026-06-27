import React from 'react';
import { Text, type TextProps, type TextStyle, type StyleProp } from 'react-native';
import { colors, fonts, typeScale } from '@/theme/tokens';

type Variant =
  | 'display'
  | 'headingLg'
  | 'heading'
  | 'headingSm'
  | 'subheading'
  | 'body'
  | 'caption';

type Weight = 'light' | 'regular' | 'medium' | 'semibold' | 'bold';

export type AppTextProps = TextProps & {
  variant?: Variant;
  weight?: Weight;
  color?: string;
  /**
   * Force the editorial SERIF (Fraunces). Heading/display variants use it by
   * default; pass `display={false}` to render a heading in Inter instead, or
   * `display` on a body variant for a small serif accent (use sparingly).
   */
  display?: boolean;
  style?: StyleProp<TextStyle>;
};

/** Variants that render the editorial serif by default (titles/headlines). */
const SERIF_VARIANTS: Variant[] = ['display', 'headingLg', 'heading'];

function serifFamily(weight: Weight): string {
  if (weight === 'semibold' || weight === 'bold') return fonts.serifSemibold;
  if (weight === 'medium') return fonts.serifMedium;
  return fonts.serif;
}

function sansFamily(weight: Weight): string {
  // Inter only ships 400/500 in Steep — never heavy/childish.
  if (weight === 'medium' || weight === 'semibold' || weight === 'bold') {
    return fonts.sansMedium;
  }
  return fonts.sans;
}

/**
 * AppText — typed text bound to the Steep type scale + font families.
 *
 * Heading/display variants render Fraunces (editorial serif). Body variants
 * render Inter (clean sans, 400/500 only). Default color is Ink. Color is
 * punctuation — pass Ash/Graphite for muted/tertiary copy.
 */
export function AppText({
  variant = 'body',
  weight,
  color = colors.ink,
  display,
  style,
  ...rest
}: AppTextProps) {
  const isSerif = display ?? SERIF_VARIANTS.includes(variant);
  // Serif headlines default to medium; sans body defaults to regular.
  const w: Weight = weight ?? (isSerif ? 'medium' : variant === 'subheading' ? 'medium' : 'regular');
  const scale = typeScale[variant];

  return (
    <Text
      style={[
        {
          fontFamily: isSerif ? serifFamily(w) : sansFamily(w),
          fontSize: scale.fontSize,
          lineHeight: scale.lineHeight,
          letterSpacing: scale.letterSpacing,
          color,
        },
        style,
      ]}
      {...rest}
    />
  );
}

export default AppText;
