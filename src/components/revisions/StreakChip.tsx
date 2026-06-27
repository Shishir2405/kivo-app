import React from 'react';
import { View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Icon } from '@/components/ui';
import { fonts, radii } from '@/theme/tokens';
import { useTheme } from '@/theme';

export type StreakChipProps = {
  count: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * A flat Kivo streak pill for the revisions header. A soft peach wash with a
 * matching hairline reads as a warm little achievement badge; the flame glyph
 * and count take the peach accent, the label stays muted. Flat — no fill, no
 * neumorphism. Fully dark-aware.
 */
export function StreakChip({ count, label = 'day streak', style }: StreakChipProps) {
  const { colors, toneStyle } = useTheme();
  const peach = toneStyle('peach');
  return (
    <View
      className="flex-row items-center self-start"
      style={[
        {
          backgroundColor: peach.bg,
          borderRadius: radii.pill,
          paddingVertical: 6,
          paddingHorizontal: 11,
          gap: 6,
          borderWidth: 1,
          borderColor: peach.border,
        },
        style,
      ]}
    >
      <Icon name="flame" size={14} color={peach.accent} />
      <View className="flex-row items-baseline" style={{ gap: 4 }}>
        <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink, letterSpacing: -0.2 }}>
          {count}
        </Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.muted, letterSpacing: -0.1 }}>
          {label}
        </Text>
      </View>
    </View>
  );
}

export default StreakChip;
