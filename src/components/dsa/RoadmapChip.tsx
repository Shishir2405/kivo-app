import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { Neumorph } from '@/components/ui/Neumorph';
import { AppText } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors } from '@/theme/tokens';

export type RoadmapChipProps = {
  label: string;
  /** Leading icon glyph (rendered via the Icon system — never an emoji). */
  icon?: IconName;
  active?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * A roadmap selector chip. Raised neumorphic pill on the gray canvas; when
 * selected it fills with highlighter-yellow (flat accent) and goes carbon-ink —
 * the inset/selected soft-UI state with the brand pop.
 */
export function RoadmapChip({
  label,
  icon,
  active = false,
  onPress,
  style,
}: RoadmapChipProps) {
  const inner = (
    <View
      className="flex-row items-center"
      style={{ paddingVertical: 10, paddingHorizontal: 16, gap: 8 }}
    >
      {icon ? (
        <Icon
          name={icon}
          size={16}
          color={active ? 'carbon' : 'textMuted'}
          strokeWidth={active ? 2.4 : 2}
        />
      ) : null}
      <AppText
        variant="caption"
        weight={active ? 'bold' : 'medium'}
        color={active ? colors.carbon : colors.textMuted}
        style={{ fontSize: 13.5 }}
      >
        {label}
      </AppText>
    </View>
  );

  // Active = flat yellow pill (accent pop). Inactive = raised neumorphic pill.
  if (active) {
    return (
      <Pressable onPress={onPress} style={style}>
        <View
          style={{
            borderRadius: 9999,
            backgroundColor: colors.highlighter,
          }}
        >
          {inner}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={style}>
      <Neumorph variant="raised" radius={9999} intensity="sm">
        {inner}
      </Neumorph>
    </Pressable>
  );
}

export default RoadmapChip;
