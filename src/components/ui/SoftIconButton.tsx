import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { interaction, pressOpacity } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

export type SoftIconButtonProps = {
  children: React.ReactNode;
  onPress?: () => void;
  size?: number;
  active?: boolean;
  /** When active, fill with this color (defaults to terracotta primary). */
  activeColor?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * Kivo round icon button — small, flat. Surface with a hairline; when `active`,
 * fills with terracotta (override via `activeColor`). No neumorphism. Keep
 * these rare (icons are punctuation); prefer a TextLink where a label fits.
 * Theme-aware.
 */
export function SoftIconButton({
  children,
  onPress,
  size = 40,
  active = false,
  activeColor,
  style,
  accessibilityLabel,
}: SoftIconButtonProps) {
  const { colors } = useTheme();
  const fill = activeColor ?? colors.primary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [{ opacity: pressOpacity({ pressed }, { solid: true }) }, style]}
    >
      {({ pressed, hovered }) => (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: active
              ? fill
              : hovered && !pressed
                ? interaction.hoverWash
                : colors.surface,
            borderWidth: 1,
            borderColor: active ? fill : pressed ? colors.primary : colors.hairline,
          }}
        >
          {children}
        </View>
      )}
    </Pressable>
  );
}

export default SoftIconButton;
