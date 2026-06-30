/**
 * MenuRow — a single tappable navigation row for the profile toolkit (Steep).
 *
 * A small thin leading glyph, an Inter label, an optional value, and a quiet
 * chevron. Flat, compact, hairline-divided. No chips, no neumorphism.
 */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';
import { AppText } from '@/components/ui/Typography';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme';

export type MenuRowProps = {
  icon: IconName;
  title: string;
  /** Optional right-aligned value text before the chevron. */
  value?: string;
  onPress?: () => void;
  /** Drop the bottom hairline (last row in a group). */
  last?: boolean;
};

export function MenuRow({ icon, title, value, onPress, last }: MenuRowProps) {
  const { colors, isDark } = useTheme();
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={{
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.hairline,
        opacity: pressed ? 0.55 : 1,
        backgroundColor:
          hovered && !pressed
            ? isDark
              ? 'rgba(255,255,255,0.04)'
              : 'rgba(33,28,23,0.035)'
            : 'transparent',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingVertical: spacing.md,
        }}
      >
        <Icon name={icon} size={17} color="muted" weight="light" />
        <AppText variant="subheading" weight="regular" style={{ flex: 1 }} numberOfLines={1}>
          {title}
        </AppText>
        {value ? (
          <AppText variant="caption" color={colors.muted}>
            {value}
          </AppText>
        ) : null}
        <Icon name="chevron-right" size={16} color="muted" weight="light" />
      </View>
    </Pressable>
  );
}

export default MenuRow;
