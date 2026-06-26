import React, { useState, forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Neumorph } from './Neumorph';
import { colors, fonts, radii } from '@/theme/tokens';

export type SoftInputProps = TextInputProps & {
  label?: string;
  error?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * A neumorphic text field. The input sits inside an inset (pressed-in) well —
 * the classic soft-UI input treatment. Carbon text keeps it legible.
 */
export const SoftInput = forwardRef<TextInput, SoftInputProps>(function SoftInput(
  { label, error, leading, trailing, containerStyle, style, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={containerStyle}>
      {label ? (
        <Text
          style={{
            fontFamily: fonts.bodyMedium,
            fontSize: 14,
            color: colors.carbon,
            marginBottom: 8,
            marginLeft: 4,
          }}
        >
          {label}
        </Text>
      ) : null}

      <Neumorph variant="inset" radius={radii.input}>
        <View
          className="flex-row items-center"
          style={{
            paddingHorizontal: 16,
            minHeight: 54,
            gap: 10,
            borderRadius: radii.input,
            borderWidth: focused ? 1.5 : 0,
            borderColor: error ? colors.annotation : colors.highlighter,
          }}
        >
          {leading}
          <TextInput
            ref={ref}
            placeholderTextColor={colors.textSubtle}
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
                fontFamily: fonts.body,
                fontSize: 16,
                color: colors.carbon,
                paddingVertical: 14,
              },
              style,
            ]}
            {...rest}
          />
          {trailing}
        </View>
      </Neumorph>

      {error ? (
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 13,
            color: colors.annotation,
            marginTop: 6,
            marginLeft: 4,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
});

export default SoftInput;
