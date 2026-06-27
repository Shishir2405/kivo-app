import React from 'react';
import { View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { fonts } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

export type BrandLogoVariant = 'mark' | 'lockup';

/** The Kivo mark PNG (terracotta "K + upward arrow"). */
export const KIVO_MARK = require('../../../assets/brand/kivo-mark.png');

/**
 * Intrinsic aspect of the official Kivo mark PNG (647×785 → w/h ≈ 0.824). The
 * mark is taller than wide, so derive its WIDTH from the requested height to
 * keep it undistorted.
 */
export const MARK_ASPECT = 647 / 785; // ≈ 0.824 (width / height)

export type BrandLogoProps = {
  variant?: BrandLogoVariant;
  /** Mark height in px (wordmark scales with it). */
  size?: number;
  /** Render the wordmark light (for dark/colored surfaces). Overrides theme. */
  onDark?: boolean;
  /** Explicit wordmark color override. */
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Kivo brand logo.
 *  - `mark`   -> the terracotta Kivo glyph only (PNG).
 *  - `lockup` -> glyph + "Kivo" wordmark in Newsreader (editorial serif),
 *                rendered as TEXT in the theme ink so it adapts to light/dark
 *                (we don't use the baked-in ink wordmark from kivo-logo.png,
 *                which is invisible on dark).
 *
 * The mark is terracotta and reads fine on both light and dark backgrounds, so
 * it needs no tinting.
 */
export function BrandLogo({
  variant = 'lockup',
  size = 28,
  onDark,
  color,
  style,
}: BrandLogoProps) {
  const { colors } = useTheme();
  const markWidth = size * MARK_ASPECT;
  const wordColor = color ?? (onDark != null ? (onDark ? '#F7F3ED' : '#211C17') : colors.ink);

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: size * 0.3 }, style]}>
      <Image
        source={KIVO_MARK}
        style={{ width: markWidth, height: size }}
        contentFit="contain"
        accessibilityLabel="Kivo"
      />
      {variant === 'lockup' ? (
        <Text
          style={{
            fontFamily: fonts.serifSemibold,
            fontSize: size * 1.0,
            lineHeight: size * 1.12,
            letterSpacing: -size * 0.02,
            color: wordColor,
          }}
        >
          Kivo
        </Text>
      ) : null}
    </View>
  );
}

export default BrandLogo;
