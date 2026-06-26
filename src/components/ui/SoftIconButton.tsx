import React, { useState } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { Neumorph } from './Neumorph';
import { colors } from '@/theme/tokens';

export type SoftIconButtonProps = {
  children: React.ReactNode;
  onPress?: () => void;
  size?: number;
  active?: boolean;
  /** When active, fill with this accent (defaults to highlighter-yellow). */
  activeColor?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * A round neumorphic icon button. Raised by default, depresses (inset) on press.
 * When `active`, it shows an inset well filled with the accent color — the
 * "selected / pressed-in" soft-UI state.
 */
export function SoftIconButton({
  children,
  onPress,
  size = 48,
  active = false,
  activeColor = colors.highlighter,
  style,
  accessibilityLabel,
}: SoftIconButtonProps) {
  const [pressed, setPressed] = useState(false);
  const variant = active || pressed ? 'inset' : 'raised';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={style}
    >
      <Neumorph
        variant={variant}
        radius={size / 2}
        intensity="sm"
        surface={active ? activeColor : colors.canvas}
      >
        <View
          style={{
            width: size,
            height: size,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </View>
      </Neumorph>
    </Pressable>
  );
}

export default SoftIconButton;
