import React, { useState, forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, fonts, radii, componentPadding, interaction } from '@/theme/tokens';

export type SoftInputProps = TextInputProps & {
  label?: string;
  error?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  /** Focus border accents in Rust instead of Ink (for warm/data fields). */
  accent?: boolean;
};

/**
 * Steep text field — small & flat. White fill, 1px Dove hairline that on FOCUS
 * deepens to Ink (or Rust with `accent`), danger on error; blurs back to Dove.
 * Radius ~12, small Inter text, Dove placeholder. No neumorphic well.
 */
export const SoftInput = forwardRef<TextInput, SoftInputProps>(function SoftInput(
  { label, error, leading, trailing, containerStyle, accent, style, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);

  const focusColor = accent ? interaction.focusBorderAccent : interaction.focusBorder;
  const borderColor = error
    ? colors.danger
    : focused
      ? focusColor
      : interaction.idleBorder;

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
          paddingHorizontal: componentPadding.input.x,
          minHeight: componentPadding.input.minHeight,
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
              fontSize: 13,
              color: colors.ink,
              paddingVertical: componentPadding.input.y,
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
