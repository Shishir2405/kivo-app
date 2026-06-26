import React from 'react';
import { View, Text, type StyleProp, type ViewStyle } from 'react-native';
import KivoMark from '../../../assets/brand/kivo-mark.svg';
import { colors, fonts } from '@/theme/tokens';

export type BrandLogoVariant = 'mark' | 'lockup';

/**
 * Intrinsic aspect of the redesigned Kivo mark (twin-lobe shape with the
 * upward-right growth arrow). The SVG is authored at width=80 height=62 with
 * viewBox "-2 -2 40 31", so the on-screen box is ~1.29:1 (wider than tall).
 * Scale the rendered width from the requested height to keep it undistorted.
 */
export const MARK_ASPECT = 80 / 62; // ≈ 1.29

export type BrandLogoProps = {
  variant?: BrandLogoVariant;
  /** Mark height in px (wordmark scales with it). */
  size?: number;
  /** Render the wordmark in paper-white for dark/yellow surfaces. */
  onDark?: boolean;
  /** Explicit wordmark color override. */
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Kivo brand logo.
 *  - `mark`   -> the Kivo glyph only (yellow twin-lobe shape + growth arrow).
 *  - `lockup` -> glyph + "Kivo" wordmark (Poppins 700, tight tracking).
 *
 * The mark's intrinsic box is ~1.29:1 (see MARK_ASPECT); we derive its width
 * from the requested `size` (height) so it never stretches or clips. The
 * wordmark cap height tracks the mark height for a balanced lockup.
 */
export function BrandLogo({
  variant = 'lockup',
  size = 28,
  onDark = false,
  color,
  style,
}: BrandLogoProps) {
  const markWidth = size * MARK_ASPECT;
  const wordColor = color ?? (onDark ? colors.paper : colors.carbon);

  return (
    <View className="flex-row items-center" style={[{ gap: size * 0.34 }, style]}>
      <KivoMark width={markWidth} height={size} />
      {variant === 'lockup' ? (
        <Text
          style={{
            fontFamily: fonts.displayBold,
            fontSize: size * 1.18,
            lineHeight: size * 1.3,
            letterSpacing: -size * 0.05,
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
