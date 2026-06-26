import React from 'react';
import { View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Neumorph } from '@/components/ui/Neumorph';
import { colors, fonts } from '@/theme/tokens';

export type StreakBadgeProps = {
  /** Current streak count in days. */
  count: number;
  /** Small = inline chip, lg = hero stat. */
  size?: 'sm' | 'md' | 'lg';
  /** Optional label under/after the number (defaults to "day streak"). */
  label?: string;
  /** Render as a raised neumorphic pill (default) or flat. */
  flat?: boolean;
  style?: StyleProp<ViewStyle>;
};

const SIZES = {
  sm: { emoji: 14, num: 14, label: 10, py: 6, px: 12, gap: 5, radius: 9999 },
  md: { emoji: 18, num: 20, label: 11, py: 8, px: 14, gap: 7, radius: 9999 },
  lg: { emoji: 26, num: 30, label: 12, py: 14, px: 18, gap: 10, radius: 20 },
};

/**
 * The fire-streak badge. Raised neumorphic pill on the gray canvas with a flame
 * emoji (signature emoji device) + the streak number in carbon ink, plus a
 * highlighter-yellow underline accent on the count.
 */
export function StreakBadge({
  count,
  size = 'md',
  label = 'day streak',
  flat = false,
  style,
}: StreakBadgeProps) {
  const s = SIZES[size];

  const inner = (
    <View
      className="flex-row items-center"
      style={{ paddingVertical: s.py, paddingHorizontal: s.px, gap: s.gap }}
    >
      <Text style={{ fontSize: s.emoji }}>{'\u{1F525}'}</Text>
      <View className="flex-row items-baseline" style={{ gap: 5 }}>
        <Text
          style={{
            fontFamily: fonts.displayBold,
            fontSize: s.num,
            color: colors.carbon,
            letterSpacing: -0.5,
          }}
        >
          {count}
        </Text>
        <Text
          style={{
            fontFamily: fonts.bodyMedium,
            fontSize: s.label,
            color: colors.textMuted,
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );

  if (flat) {
    return (
      <View
        style={[
          {
            alignSelf: 'flex-start',
            borderRadius: s.radius,
            backgroundColor: colors.highlighter,
          },
          style,
        ]}
      >
        {inner}
      </View>
    );
  }

  return (
    <Neumorph variant="raised" radius={s.radius} intensity="sm" style={style}>
      {inner}
    </Neumorph>
  );
}

export default StreakBadge;
