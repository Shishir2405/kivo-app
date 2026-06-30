import React, { useState } from 'react';
import { Pressable, View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Icon } from './Icon';
import { fonts, pressOpacity } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

export type CheckboxProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Optional trailing label. */
  label?: string;
  disabled?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Kivo checkbox — a small rounded square. Unchecked: surface with a hairline.
 * Checked: filled TERRACOTTA with an inverted check (the HTML checkbox). Flat,
 * theme-aware.
 */
export function Checkbox({
  checked,
  onChange,
  label,
  disabled,
  size = 22,
  style,
}: CheckboxProps) {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={() => !disabled && onChange(!checked)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      hitSlop={6}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          opacity: pressOpacity({ pressed }, { disabled, solid: true }),
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 7,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: checked ? colors.primary : colors.surface,
          borderWidth: checked ? 1 : 1.5,
          borderColor: checked ? colors.primary : pressed ? colors.primary : colors.hairline,
        }}
      >
        {checked ? <Icon name="check" size={size * 0.62} color={colors.onPrimary} weight="bold" /> : null}
      </View>
      {label ? (
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 15,
            color: colors.ink,
            flexShrink: 1,
          }}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default Checkbox;
