import React from 'react';
import { View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Icon } from '@/components/ui';
import { fonts } from '@/theme/tokens';
import { useTheme } from '@/theme';

export type StreakBadgeProps = {
  /** Current streak count in days. */
  count: number;
  /** Small = inline chip, lg = hero stat. */
  size?: 'sm' | 'md' | 'lg';
  /** Optional label under/after the number (defaults to "day streak"). */
  label?: string;
  /** Kept for back-compat; the badge is always flat (no neumorphism). */
  flat?: boolean;
  style?: StyleProp<ViewStyle>;
};

const SIZES = {
  sm: { glyph: 14, num: 14, label: 10, py: 6, px: 12, gap: 5, radius: 9999, stacked: false },
  md: { glyph: 18, num: 20, label: 11, py: 8, px: 14, gap: 7, radius: 9999, stacked: false },
  lg: { glyph: 26, num: 30, label: 12, py: 14, px: 18, gap: 10, radius: 20, stacked: true },
};

/**
 * The fire-streak badge (Kivo). A flat peach-wash pill with a 1px matching
 * hairline; the flame glyph + count take the peach accent, the label stays
 * muted. Editorial serif for the number. No emoji, no neumorphism, fully
 * dark-aware.
 */
export function StreakBadge({
  count,
  size = 'md',
  label = 'day streak',
  style,
}: StreakBadgeProps) {
  const { colors, toneStyle } = useTheme();
  const s = SIZES[size];
  const peach = toneStyle('peach');

  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: s.py,
          paddingHorizontal: s.px,
          gap: s.gap,
          borderRadius: s.radius,
          backgroundColor: peach.bg,
          borderWidth: 1,
          borderColor: peach.border,
        },
        style,
      ]}
    >
      <Icon name="flame" size={s.glyph} color={peach.accent} />
      <View
        style={{
          flexDirection: s.stacked ? 'column' : 'row',
          alignItems: s.stacked ? 'flex-start' : 'baseline',
          gap: s.stacked ? 1 : 5,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.serifSemibold,
            fontSize: s.num,
            color: colors.ink,
            letterSpacing: -0.5,
            lineHeight: s.num,
          }}
        >
          {count}
        </Text>
        <Text
          style={{
            fontFamily: fonts.sansMedium,
            fontSize: s.label,
            color: colors.muted,
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

export default StreakBadge;
