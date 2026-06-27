import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors, radii } from '@/theme/tokens';

export type RoadmapChipProps = {
  label: string;
  /** Leading icon glyph (small, thin — never an emoji). */
  icon?: IconName;
  active?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * A flat Steep selector chip. Inactive: white pill with a 1px Dove hairline,
 * graphite label. Active: filled Ink pill, white label. No neumorphism, no
 * bright accent — the Ink fill is the selected state.
 */
export function RoadmapChip({
  label,
  icon,
  active = false,
  onPress,
  style,
}: RoadmapChipProps) {
  return (
    <Pressable onPress={onPress} style={style}>
      <View
        className="flex-row items-center"
        style={{
          paddingVertical: 7,
          paddingHorizontal: 14,
          gap: 6,
          borderRadius: radii.pill,
          backgroundColor: active ? colors.ink : colors.white,
          borderWidth: 1,
          borderColor: active ? colors.ink : colors.dove,
        }}
      >
        {icon ? (
          <Icon name={icon} size={14} color={active ? 'white' : 'graphite'} />
        ) : null}
        <AppText
          variant="caption"
          weight="medium"
          color={active ? colors.white : colors.ash}
          style={{ fontSize: 12.5 }}
        >
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

export default RoadmapChip;
