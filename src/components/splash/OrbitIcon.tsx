import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import { Neumorph } from '@/components/ui/Neumorph';
import { colors } from '@/theme/tokens';

export type OrbitIconProps = {
  /** The brand SVG component to render inside the soft chip. */
  Icon: React.FC<{ width: number; height: number }>;
  /** Native aspect of the icon (width / height in source units). */
  aspect?: number;
  /** Rendered icon height in px. */
  iconSize?: number;
  /** Resting offset from center (px) — where the chip settles. */
  restX: number;
  restY: number;
  /** Off-screen start offset (px) — the fly-in origin, further out. */
  fromX: number;
  fromY: number;
  /** Stagger delay (ms) before this chip flies in. */
  delay?: number;
  /** Diameter of the round neumorphic chip. */
  chip?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * A single brand icon that flies in from off-screen and settles at its compass
 * point around the logo. Rendered as a round raised neumorphic chip so the eight
 * of them read as a cohesive orbiting constellation on the graphite-mist canvas.
 *
 * Absolutely positioned at the parent's center; `restX/restY` place the chip,
 * `fromX/fromY` are the entry origin. A staggered spring drives the convergence.
 */
export function OrbitIcon({
  Icon,
  aspect = 1,
  iconSize = 22,
  restX,
  restY,
  fromX,
  fromY,
  delay = 0,
  chip = 52,
  style,
}: OrbitIconProps) {
  return (
    <MotiView
      from={{
        opacity: 0,
        scale: 0.4,
        translateX: fromX,
        translateY: fromY,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        translateX: restX,
        translateY: restY,
      }}
      transition={{
        type: 'spring',
        delay,
        damping: 14,
        mass: 0.9,
        stiffness: 120,
        opacity: { type: 'timing', duration: 280, delay },
      }}
      style={[
        {
          position: 'absolute',
          width: chip,
          height: chip,
          marginLeft: -chip / 2,
          marginTop: -chip / 2,
        },
        style,
      ]}
      pointerEvents="none"
    >
      <Neumorph
        radius={chip / 2}
        intensity="sm"
        surface={colors.paper}
        style={{
          width: chip,
          height: chip,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon width={iconSize * aspect} height={iconSize} />
      </Neumorph>
    </MotiView>
  );
}

export default OrbitIcon;
