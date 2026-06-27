import React from 'react';
import { View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Icon } from '@/components/ui';
import { colors, fonts, radii, hairline } from '@/theme/tokens';

export type StreakChipProps = {
  count: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * A flat Steep streak pill for the revisions header. White surface, 1px Dove
 * hairline, a small thin flame glyph in Rust (the one warm voice) and the count
 * in Ink. No neumorphism, no fill, no yellow.
 */
export function StreakChip({ count, label = 'day streak', style }: StreakChipProps) {
  return (
    <View
      className="flex-row items-center self-start"
      style={[
        {
          backgroundColor: colors.white,
          borderRadius: radii.pill,
          paddingVertical: 6,
          paddingHorizontal: 11,
          gap: 6,
          ...hairline,
        },
        style,
      ]}
    >
      <Icon name="flame" size={14} color="rust" />
      <View className="flex-row items-baseline" style={{ gap: 4 }}>
        <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink, letterSpacing: -0.2 }}>
          {count}
        </Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.graphite, letterSpacing: -0.1 }}>
          {label}
        </Text>
      </View>
    </View>
  );
}

export default StreakChip;
