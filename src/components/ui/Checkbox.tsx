import React from 'react';
import { Pressable, View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Icon } from './Icon';
import { colors, fonts, pressOpacity } from '@/theme/tokens';

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
 * Steep checkbox — a simple small square. Unchecked: white with a Dove
 * hairline. Checked: filled Ink with a white check. Flat, no neumorphism.
 */
export function Checkbox({
  checked,
  onChange,
  label,
  disabled,
  size = 20,
  style,
}: CheckboxProps) {
  return (
    <Pressable
      onPress={() => !disabled && onChange(!checked)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      hitSlop={6}
      style={({ pressed }) => [
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
      {({ pressed }) => (
        <>
          <View
            style={{
              width: size,
              height: size,
              borderRadius: 6,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: checked ? colors.ink : colors.white,
              borderWidth: 1,
              borderColor: checked ? colors.ink : pressed ? colors.ink : colors.dove,
            }}
          >
            {checked ? <Icon name="check" size={size * 0.7} color="white" weight="bold" /> : null}
          </View>
          {label ? (
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 13,
                color: colors.ink,
                flexShrink: 1,
              }}
            >
              {label}
            </Text>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

export default Checkbox;
