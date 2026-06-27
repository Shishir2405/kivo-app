import React, { forwardRef } from 'react';
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
  /** @deprecated kept for back-compat; focus no longer re-styles via state. */
  accent?: boolean;
};

/**
 * Kivo text field — calm & flat. 1px hairline (danger on error), radius 12,
 * Figtree text, muted placeholder, theme-aware.
 *
 * CRITICAL: this field intentionally keeps NO React `focused` state. Setting
 * state in onFocus re-rendered the field, and on Android that re-render BLURRED
 * the freshly-focused native TextInput — so focus bounced across the whole form
 * (Name→Email→Password→…) and you could never type. The border is therefore
 * static. Any future focus accent MUST be done WITHOUT a React re-render of this
 * component (e.g. Reanimated useAnimatedStyle driven on the UI thread).
 */
export const SoftInput = forwardRef<TextInput, SoftInputProps>(function SoftInput(
  {
    label,
    error,
    leading,
    trailing,
    containerStyle,
    accent: _accent,
    style,
    onChangeText,
    onFocus,
    onBlur,
    // Drop any incoming autoComplete so our autofill-disable (below) always wins.
    autoComplete: _autoComplete,
    ...rest
  },
  ref,
) {
  const { colors } = useTheme();
  const borderColor = error ? colors.danger : colors.hairline;

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
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: componentPadding.input.x,
          minHeight: componentPadding.input.minHeight,
          gap: 8,
          borderRadius: radii.input,
          backgroundColor: colors.surface,
          borderWidth: error ? 1.5 : 1,
          borderColor,
        }}
      >
        {leading}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.muted}
          // Hard-disable Android autofill (it can hijack focus across a form).
          importantForAutofill="no"
          autoComplete="off"
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
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
