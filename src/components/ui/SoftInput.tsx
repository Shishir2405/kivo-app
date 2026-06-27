import React, { useState, forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { fonts, radii, componentPadding } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

export type SoftInputProps = TextInputProps & {
  label?: string;
  error?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  /** @deprecated focus already accents in terracotta; kept for back-compat. */
  accent?: boolean;
};

/**
 * Kivo text field — calm & flat. On the canvas-tinted fill it carries a 1px
 * hairline that on FOCUS deepens to TERRACOTTA + a soft terracotta focus ring
 * (the HTML's `box-shadow 0 0 0 4px rgba(196,106,61,.1)`), and danger on error.
 * Radius 12, Figtree text, muted placeholder. Theme-aware via useTheme().
 */
export const SoftInput = forwardRef<TextInput, SoftInputProps>(function SoftInput(
  { label, error, leading, trailing, containerStyle, accent: _accent, style, onFocus, onBlur, ...rest },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.primary : colors.hairline;
  // The terracotta focus glow (only while focused, no error).
  const ring =
    focused && !error
      ? {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.18,
          shadowRadius: 6,
          elevation: 0,
        }
      : null;

  return (
    <View style={containerStyle}>
      {label ? (
        <Text
          style={{
            fontFamily: fonts.sansMedium,
            fontSize: 13,
            color: colors.muted,
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: componentPadding.input.x,
            minHeight: componentPadding.input.minHeight,
            gap: 8,
            borderRadius: radii.input,
            backgroundColor: colors.surface,
            borderWidth: focused || error ? 1.5 : 1,
            borderColor,
          },
          ring,
        ]}
      >
        {leading}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.muted}
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
              fontSize: 15,
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
            fontSize: 12,
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
