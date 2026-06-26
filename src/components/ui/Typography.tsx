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
  /** Use the Poppins display family instead of Inter (auto for headings). */
  display?: boolean;
  style?: StyleProp<TextStyle>;
};

const DISPLAY_VARIANTS: Variant[] = [
  'display',
  'headingLg',
  'heading',
  'headingSm',
];

function fontFor(display: boolean, weight: Weight): string {
  if (display) {
    if (weight === 'bold') return fonts.displayBold;
    if (weight === 'semibold') return fonts.displaySemibold;
    if (weight === 'medium') return fonts.displayMedium;
    return fonts.display;
  }
  switch (weight) {
    case 'light':
      return fonts.bodyLight;
    case 'medium':
      return fonts.bodyMedium;
    case 'semibold':
    case 'bold':
      return fonts.bodyBold;
    default:
      return fonts.body;
  }
}

/**
 * Typed text component bound to the Aaply type scale + font families.
 * Heading variants default to Poppins; body variants to Inter.
 */
export function AppText({
  variant = 'body',
  weight,
  color = colors.carbon,
  display,
  style,
  ...rest
}: AppTextProps) {
  const isDisplay = display ?? DISPLAY_VARIANTS.includes(variant);
  const w: Weight = weight ?? (isDisplay ? 'bold' : 'regular');
  const scale = typeScale[variant];

  return (
    <Text
      style={[
        {
          fontFamily: fontFor(isDisplay, w),
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
