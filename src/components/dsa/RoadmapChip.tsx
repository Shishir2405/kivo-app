import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { radii, pressOpacity, type CardTone } from '@/theme/tokens';
import { useTheme } from '@/theme';

export type RoadmapChipProps = {
  label: string;
  /** Leading icon glyph (small, thin — never an emoji). */
  icon?: IconName;
  active?: boolean;
  /**
   * Soft wash for the inactive chip — bg + matching hairline + a tone-accent
   * icon, so a row of roadmap chips reads colorful-but-calm. Defaults to plain
   * white. Ignored when `active` (the selected state is the filled Ink pill).
   */
  tone?: CardTone;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * A flat Steep selector chip. Inactive: a soft-wash (or white) pill with a 1px
 * matching hairline, a tone-accent icon and an Ash label. Active: filled Ink
 * pill, white label — the Ink fill is the strong selected state, color stays on
 * the resting chips. No neumorphism.
 */
export function RoadmapChip({
  label,
  icon,
  active = false,
  tone = 'default',
  onPress,
  style,
}: RoadmapChipProps) {
  const { colors, toneStyle } = useTheme();
  const ts = toneStyle(tone);
  const isWashed = tone !== 'default';

  return (
    <Pressable onPress={onPress} style={style}>
      {({ pressed }: { pressed: boolean }) => (
      <View
        className="flex-row items-center"
        style={{
          paddingVertical: 7,
          paddingHorizontal: 14,
          gap: 6,
          borderRadius: radii.pill,
          backgroundColor: active ? colors.ink : ts.bg,
          borderWidth: 1,
          // Pressed unselected chip hints its border toward Ink.
          borderColor: active ? colors.ink : pressed ? colors.ink : ts.border,
          opacity: pressOpacity({ pressed }),
        }}
      >
        {icon ? (
          <Icon
            name={icon}
            size={14}
            color={active ? colors.inkInverted : isWashed ? ts.accent : colors.muted}
          />
        ) : null}
        <AppText
          variant="caption"
          weight="medium"
          color={active ? colors.inkInverted : colors.ash}
          style={{ fontSize: 12.5 }}
        >
          {label}
        </AppText>
      </View>
      )}
    </Pressable>
  );
}

export default RoadmapChip;
