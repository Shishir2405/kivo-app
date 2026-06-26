import React from 'react';
import { View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Neumorph } from '@/components/ui/Neumorph';
import { Icon } from '@/components/ui';
import { colors, fonts } from '@/theme/tokens';

export type StreakChipProps = {
  count: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Emoji-free streak chip for the revisions header. A raised neumorphic pill on
 * the graphite-mist canvas with a yellow-welled flame icon (vector, never a
 * pictograph) and the streak count in carbon ink.
 */
export function StreakChip({ count, label = 'day streak', style }: StreakChipProps) {
  return (
    <Neumorph variant="raised" radius={9999} intensity="sm" style={style}>
      <View
        className="flex-row items-center"
        style={{ paddingVertical: 7, paddingHorizontal: 10, gap: 9 }}
      >
        <Neumorph variant="raised" radius={9999} intensity="sm" surface={colors.highlighter}>
          <View
            style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="flame" size={16} color="carbon" strokeWidth={2.3} fill={colors.highlighter} />
          </View>
        </Neumorph>
        <View className="flex-row items-baseline" style={{ gap: 5, paddingRight: 4 }}>
          <Text
            style={{
              fontFamily: fonts.displayBold,
              fontSize: 20,
              color: colors.carbon,
              letterSpacing: -0.5,
            }}
          >
            {count}
          </Text>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textMuted }}>
            {label}
          </Text>
        </View>
      </View>
    </Neumorph>
  );
}

export default StreakChip;
