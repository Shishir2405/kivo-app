/**
 * ProductivityChart — a dependency-free neumorphic bar/line chart.
 *
 * Renders the weekly productivity-score trend as a row of inset wells with
 * a highlighter-yellow bar filling each well to its score height, plus a thin
 * "line" — a row of dots connected visually by the bar tops — and a soft
 * gridline at the average. Bars grow in with a staggered reanimated spring on
 * mount; the most-recent (latest) bar is emphasised in carbon ink.
 *
 * Pure presentational: feed it `mockProductivityTrend`. No chart library, no
 * SVG paths — just Views + reanimated, on the graphite-mist canvas.
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/Typography';
import { Neumorph } from '@/components/ui/Neumorph';
import { colors } from '@/theme/tokens';
import type { ProductivityPoint } from '@/types/models';

export type ProductivityChartProps = {
  data: ProductivityPoint[];
  /** Plot area height in px (excludes the label row). */
  height?: number;
};

/* ------------------------------------------------------------------ */
/* Single bar                                                          */
/* ------------------------------------------------------------------ */

function Bar({
  ratio,
  height,
  index,
  emphasised,
}: {
  ratio: number;
  height: number;
  index: number;
  emphasised: boolean;
}) {
  const grow = useSharedValue(0);

  useEffect(() => {
    grow.value = withDelay(
      120 + index * 70,
      withSpring(1, { damping: 16, stiffness: 140 }),
    );
  }, [grow, index]);

  const fillStyle = useAnimatedStyle(() => ({
    height: Math.max(6, grow.value * ratio * height),
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: grow.value,
    transform: [{ scale: grow.value }],
  }));

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* The well the bar sits inside — gives the inset/recessed track look. */}
      <Neumorph
        variant="inset"
        radius={10}
        intensity="sm"
        surface={colors.canvas}
        style={{
          width: 22,
          height,
          alignItems: 'center',
          justifyContent: 'flex-end',
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[
            {
              width: 18,
              borderRadius: 8,
              backgroundColor: emphasised ? colors.carbon : colors.highlighter,
              marginBottom: 2,
            },
            fillStyle,
          ]}
        >
          {/* "Line"/node marker pinned to the top of each bar. */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: -3,
                alignSelf: 'center',
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: colors.paper,
                borderWidth: 2,
                borderColor: emphasised ? colors.carbon : '#cfce1a',
              },
              dotStyle,
            ]}
          />
        </Animated.View>
      </Neumorph>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Chart                                                               */
/* ------------------------------------------------------------------ */

export function ProductivityChart({ data, height = 150 }: ProductivityChartProps) {
  const scores = data.map((d) => d.score);
  const peak = Math.max(100, ...scores);
  const avg =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
  const lastIndex = data.length - 1;

  return (
    <View>
      {/* Plot area with an average gridline overlay. */}
      <View style={{ height, position: 'relative' }}>
        {/* Average reference line. */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: (avg / peak) * height,
            height: 1,
            backgroundColor: 'rgba(70,108,243,0.30)',
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: 0,
            bottom: (avg / peak) * height + 2,
          }}
        >
          <AppText variant="caption" weight="semibold" color={colors.signal} style={{ fontSize: 10 }}>
            {`avg ${avg}`}
          </AppText>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            height,
            gap: 4,
          }}
        >
          {data.map((point, i) => (
            <Bar
              key={point.weekStart}
              ratio={point.score / peak}
              height={height}
              index={i}
              emphasised={i === lastIndex}
            />
          ))}
        </View>
      </View>

      {/* X-axis labels. */}
      <View style={{ flexDirection: 'row', marginTop: 10, gap: 4 }}>
        {data.map((point, i) => (
          <View key={point.weekStart} style={{ flex: 1, alignItems: 'center' }}>
            <AppText
              variant="caption"
              weight={i === lastIndex ? 'bold' : 'regular'}
              color={i === lastIndex ? colors.carbon : colors.textSubtle}
              numberOfLines={1}
              style={{ fontSize: 10 }}
            >
              {point.label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

export default ProductivityChart;
