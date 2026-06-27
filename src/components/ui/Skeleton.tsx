import React, { useState } from 'react';
import { View, type StyleProp, type ViewStyle, type DimensionValue } from 'react-native';
import { MotiView } from 'moti';
import { radii } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

export type SkeletonProps = {
  /** Width (px or %). Default '100%'. */
  width?: DimensionValue;
  /** Height in px. Default 14. */
  height?: number;
  /** Corner radius. Default 8 (use radii.pill for circles/lines). */
  radius?: number;
  /** Make it a circle of `height` diameter. */
  circle?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Skeleton — a single shimmering placeholder block (the HTML's kvShimmer).
 *
 * A muted base with a soft highlight band that sweeps left→right on a ~1.1s
 * loop (the `kvShimmer` keyframe). Theme-aware: base + highlight adapt to dark.
 * Compose several to build loading states, or use SkeletonGroup / SkeletonText.
 */
export function Skeleton({
  width = '100%',
  height = 14,
  radius = 8,
  circle = false,
  style,
}: SkeletonProps) {
  const { isDark } = useTheme();
  const [w, setW] = useState(0);

  const base = isDark ? '#2A2419' : '#EDE6DA';
  const highlight = isDark ? '#3A3226' : '#F7F1E7';
  const r = circle ? height / 2 : radius;

  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={[
        {
          width: circle ? height : width,
          height,
          borderRadius: r,
          backgroundColor: base,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {w > 0 ? (
        <MotiView
          from={{ translateX: -w * 0.6 }}
          animate={{ translateX: w }}
          transition={{
            type: 'timing',
            duration: 1100,
            loop: true,
            repeatReverse: false,
          }}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            // a soft highlight band (~60% of the block width) sweeping across
            width: Math.max(40, w * 0.6),
            backgroundColor: highlight,
            opacity: 0.9,
          }}
        />
      ) : null}
    </View>
  );
}

/**
 * SkeletonText — N shimmer lines (the last one shorter), for paragraph loaders.
 */
export function SkeletonText({
  lines = 3,
  lineHeight = 13,
  gap = 9,
  lastWidth = '60%',
  style,
}: {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  lastWidth?: DimensionValue;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ gap }, style]}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={lineHeight}
          radius={radii.sm}
          width={i === lines - 1 ? lastWidth : '100%'}
        />
      ))}
    </View>
  );
}

/**
 * SkeletonCard — a card-shaped loader: a small icon block, a title line, and a
 * couple of body lines, on a hairline card. Drop into grids while data loads.
 */
export function SkeletonCard({
  height,
  style,
}: {
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: radii.card,
          borderWidth: 1,
          borderColor: colors.hairline,
          backgroundColor: colors.surface,
          padding: 16,
          gap: 12,
          ...(height != null ? { height } : null),
        },
        style,
      ]}
    >
      <Skeleton width={28} height={28} radius={8} />
      <Skeleton width="70%" height={16} radius={6} />
      <SkeletonText lines={2} />
    </View>
  );
}

export default Skeleton;
