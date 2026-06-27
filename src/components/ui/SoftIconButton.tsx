import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, interaction, pressOpacity } from '@/theme/tokens';

export type SoftIconButtonProps = {
  children: React.ReactNode;
  onPress?: () => void;
  size?: number;
  active?: boolean;
  /** When active, fill with this color (defaults to Ink). */
  activeColor?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * Steep round icon button — small, flat. White with a Dove hairline; when
 * `active`, fills with Ink. No neumorphism. Keep these rare (icons are
 * punctuation); prefer a TextLink where a label fits.
 */
export function SoftIconButton({
  children,
  onPress,
  size = 36,
  active = false,
  activeColor = colors.ink,
  style,
  accessibilityLabel,
}: SoftIconButtonProps) {
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
              ? activeColor
              : hovered && !pressed
                ? interaction.hoverWash
                : colors.white,
            borderWidth: 1,
            borderColor: active ? activeColor : pressed ? colors.ink : colors.dove,
          }}
        >
          {children}
        </View>
      )}
    </Pressable>
  );
}

export default SoftIconButton;
