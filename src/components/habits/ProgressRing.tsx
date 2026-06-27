import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/theme';

export type ProgressRingProps = {
  /** Completion fraction 0..1. Clamped. */
  progress: number;
  /** Outer diameter in px. */
  size?: number;
  /** Stroke thickness in px. */
  stroke?: number;
  /** Progress arc color (hex or rgba). Defaults to the terracotta primary. */
  color?: string;
  /** Track (unfilled) color. */
  trackColor?: string;
  /** Centered content (e.g. a percent label or an Icon). */
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * A lightweight circular progress ring built on react-native-svg.
 *
 * The track is a faint hairline circle; the progress arc draws clockwise from
 * 12 o'clock using a stroke-dash offset. Centered children let callers drop a
 * percent label or a glyph inside the ring. Pure SVG — no animation deps — so
 * it composes cleanly inside neumorphic cards on the graphite-mist canvas.
 */
export function ProgressRing({
  progress,
  size = 56,
  stroke = 6,
  color,
  trackColor,
  children,
  style,
}: ProgressRingProps) {
  const { colors, isDark } = useTheme();
  const arcColor = color ?? colors.primary;
  const track =
    trackColor ?? (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(33,28,23,0.08)');
  const clamped = Math.max(0, Math.min(1, progress));
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - clamped);

  return (
    <View
      style={[
        { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute' }}
        // Rotate so the arc starts at 12 o'clock and sweeps clockwise.
        rotation={-90}
        originX={cx}
        originY={cy}
      >
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={track}
          strokeWidth={stroke}
          fill="none"
        />
        {clamped > 0 ? (
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={arcColor}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        ) : null}
      </Svg>
      {children}
    </View>
  );
}

export default ProgressRing;
