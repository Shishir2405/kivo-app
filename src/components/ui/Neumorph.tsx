import React from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';
import { type NeumorphIntensity } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

export type NeumorphProps = {
  children?: React.ReactNode;
  /**
   * Legacy soft-UI variant — neutralised under Kivo:
   *  - 'raised' → a flat surface with a 1px hairline + ONE soft shadow.
   *  - 'inset' / 'flat' → a flat well surface with a 1px hairline, no shadow.
   */
  variant?: 'raised' | 'inset' | 'flat';
  radius?: number;
  /** @deprecated Kivo is flat; intensity is ignored. */
  intensity?: NeumorphIntensity;
  /** Base surface color (defaults to surface for raised, well for inset). */
  surface?: string;
  style?: StyleProp<ViewStyle>;
  /** Inner padding applied to the content container. */
  padding?: number;
};

/**
 * Kivo no-op flat surface (formerly the neumorphic wrapper).
 *
 * Neumorphism is gone. This renders a single FLAT View so the screens that
 * still wrap content in <Neumorph> keep working — reading as clean Kivo
 * surfaces: surface/well fill, a 1px hairline, and (for 'raised') the one soft
 * shadow. Theme-aware. Prefer <Card> for new code; this exists for back-compat.
 */
export function Neumorph({
  children,
  variant = 'raised',
  radius = 18,
  surface,
  style,
  padding,
}: NeumorphProps) {
  const { colors, shadow } = useTheme();
  const isRaised = variant === 'raised';
  const bg = surface ?? (isRaised ? colors.surface : colors.surfaceAlt);

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: radius,
          borderWidth: 1,
          borderColor: colors.hairline,
          ...(padding != null ? { padding } : null),
        },
        isRaised ? shadow : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default Neumorph;
