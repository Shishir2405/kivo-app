import React, { useState } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '@/theme/tokens';

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
  size = 38,
  active = false,
  activeColor = colors.ink,
  style,
  accessibilityLabel,
}: SoftIconButtonProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[{ opacity: pressed ? 0.7 : 1 }, style]}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: active ? activeColor : colors.white,
          borderWidth: 1,
          borderColor: active ? activeColor : colors.dove,
        }}
      >
        {children}
      </View>
    </Pressable>
  );
}

export default SoftIconButton;
