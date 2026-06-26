import React from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';
import { Shadow } from 'react-native-shadow-2';
import { colors, type NeumorphIntensity, neumorph } from '@/theme/tokens';

export type NeumorphProps = {
  children?: React.ReactNode;
  /** raised = pops out of the surface; inset = pressed into the surface. */
  variant?: 'raised' | 'inset' | 'flat';
  radius?: number;
  intensity?: NeumorphIntensity;
  /** Base surface color (defaults to the graphite-mist canvas). */
  surface?: string;
  style?: StyleProp<ViewStyle>;
  /** Inner padding applied to the content container. */
  padding?: number;
};

/**
 * Generic neumorphic (soft-UI) wrapper.
 *
 * "raised" stacks a dark shadow (bottom-right) under a light highlight
 * (top-left) using react-native-shadow-2 to fake the dual-light soft-UI look.
 * "inset" simulates a pressed-in well with two inset border highlights — RN
 * can't do true inner shadows cheaply, so we approximate with layered borders
 * + a subtly darker fill, which reads correctly on the gray canvas.
 */
export function Neumorph({
  children,
  variant = 'raised',
  radius = 24,
  intensity = 'md',
  surface = colors.canvas,
  style,
  padding,
}: NeumorphProps) {
  const i = neumorph.intensity[intensity];

  const content = (
    <View
      style={[
        {
          backgroundColor: surface,
          borderRadius: radius,
          ...(padding != null ? { padding } : null),
        },
        variant === 'inset' && {
          borderTopWidth: 1.5,
          borderLeftWidth: 1.5,
          borderTopColor: 'rgba(174,174,192,0.35)',
          borderLeftColor: 'rgba(174,174,192,0.35)',
          borderBottomWidth: 1.5,
          borderRightWidth: 1.5,
          borderBottomColor: 'rgba(255,255,255,0.7)',
          borderRightColor: 'rgba(255,255,255,0.7)',
          backgroundColor: '#ececec',
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (variant !== 'raised') {
    return content;
  }

  // Raised: dark shadow under a light highlight.
  return (
    <Shadow
      distance={i.distance}
      startColor="rgba(255,255,255,0.95)"
      offset={[-i.offset, -i.offset]}
      style={{ borderRadius: radius }}
      containerStyle={style as ViewStyle}
    >
      <Shadow
        distance={i.distance}
        startColor="rgba(174,174,192,0.5)"
        offset={[i.offset, i.offset]}
        style={{ borderRadius: radius }}
      >
        {content}
      </Shadow>
    </Shadow>
  );
}

export default Neumorph;
