import React, { useState, forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, fonts, radii } from '@/theme/tokens';

export type SoftInputProps = TextInputProps & {
  label?: string;
  error?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Steep text field — small & flat. White fill, 1px Dove hairline (Ink on
 * focus, danger on error), radius ~13, small Inter text, Dove placeholder.
 * No neumorphic well.
 */
export const SoftInput = forwardRef<TextInput, SoftInputProps>(function SoftInput(
  { label, error, leading, trailing, containerStyle, style, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.ink : colors.dove;

  return (
    <View style={containerStyle}>
      {label ? (
        <Text
          style={{
            fontFamily: fonts.sansMedium,
            fontSize: 12,
            color: colors.ash,
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      ) : null}

      <View
        className="flex-row items-center"
        style={{
          paddingHorizontal: 12,
          minHeight: 44,
          gap: 8,
          borderRadius: radii.input,
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor,
        }}
      >
        {leading}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.dove}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            {
              flex: 1,
              fontFamily: fonts.sans,
              fontSize: 14,
              color: colors.ink,
              paddingVertical: 10,
            },
            style,
          ]}
          {...rest}
        />
        {trailing}
      </View>

      {error ? (
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 11,
            color: colors.danger,
            marginTop: 5,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
});

export default SoftInput;
