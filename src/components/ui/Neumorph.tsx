import React from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';
import { colors, shadow, type NeumorphIntensity } from '@/theme/tokens';

export type NeumorphProps = {
  children?: React.ReactNode;
  /**
   * Legacy soft-UI variant — neutralised under Steep:
   *  - 'raised' → a flat white surface with a 1px Dove hairline + ONE subtle shadow.
   *  - 'inset' / 'flat' → a flat Fog surface with a 1px Dove hairline, no shadow.
   */
  variant?: 'raised' | 'inset' | 'flat';
  radius?: number;
  /** @deprecated Steep is flat; intensity is ignored. */
  intensity?: NeumorphIntensity;
  /** Base surface color (defaults to white for raised, Fog for inset). */
  surface?: string;
  style?: StyleProp<ViewStyle>;
  /** Inner padding applied to the content container. */
  padding?: number;
};

/**
 * STEEP no-op flat surface (formerly the neumorphic wrapper).
 *
 * Neumorphism is gone. This now renders a single FLAT View so that the ~50
 * screens that still wrap content in <Neumorph> keep working — but they read as
 * clean Steep surfaces: white/fog fill, a 1px Dove hairline, and (for 'raised')
 * the one subtle shadow. No dual shadows, no puffy depth.
 *
 * Prefer <Card> for new code; this exists purely for back-compat.
 */
export function Neumorph({
  children,
  variant = 'raised',
  radius = 18,
  surface,
  style,
  padding,
}: NeumorphProps) {
  const isRaised = variant === 'raised';
  const bg = surface ?? (isRaised ? colors.white : colors.fog);

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: radius,
          borderWidth: 1,
          borderColor: colors.dove,
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
