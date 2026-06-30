import React, { useState } from 'react';
import {
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
  type PressableProps,
} from 'react-native';
import { fonts, radii, pressOpacity } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

export type PillVariant = 'primary' | 'ghost' | 'yellow' | 'black';

export type PillButtonProps = {
  label: string;
  onPress?: PressableProps['onPress'];
  /**
   * Kivo mapping:
   *  - 'primary' (default) → the ONE filled TERRACOTTA pill (primary CTA).
   *  - legacy 'yellow' / 'black' → also map to the terracotta pill.
   *  - 'ghost' → a TEXT LINK (terracotta text, no bg/border) for secondary
   *    actions.
   */
  variant?: PillVariant;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
};

// Kivo padding (pill CTA from the HTML: padding ~12, font ~13.5).
const SIZES = {
  sm: { py: 9, px: 16, font: 13 },
  md: { py: 12, px: 20, font: 14 },
  lg: { py: 14, px: 24, font: 15 },
};

/**
 * The Kivo pill button — exactly ONE filled style: a TERRACOTTA pill (primary
 * bg, inverted text, soft terracotta glow shadow). 'primary'/'yellow'/'black'
 * all map to it. 'ghost' renders a TEXT LINK (secondary actions are links,
 * never extra filled/ghost buttons). One filled CTA per screen.
 */
export function PillButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  trailingIcon,
  fullWidth,
  disabled,
  size = 'md',
  style,
}: PillButtonProps) {
  const { colors } = useTheme();
  const s = SIZES[size];
  const [pressed, setPressed] = useState(false);

  if (variant === 'ghost') {
    return (
      <TextLink
        label={label}
        onPress={onPress}
        disabled={disabled}
        icon={icon}
        size={size}
        fullWidth={fullWidth}
        style={style}
      />
    );
  }

  // Static base style — none of these depend on press state.
  const baseStyle: ViewStyle = {
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    opacity: pressOpacity({}, { disabled, solid: true }),
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    // soft terracotta glow (the HTML CTA shadow)
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: disabled ? 0 : 0.45,
    shadowRadius: 18,
    elevation: disabled ? 0 : 4,
  };
  // Press feedback (preserved): swap to primaryPressed bg + solid press opacity.
  const pressedStyle: ViewStyle = {
    backgroundColor: colors.primaryPressed,
    opacity: pressOpacity({ pressed: true }, { disabled, solid: true }),
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[baseStyle, !disabled && pressed && pressedStyle, style]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: s.py,
          paddingHorizontal: s.px,
          gap: 7,
        }}
      >
        {icon}
        <Text style={{ fontFamily: fonts.sansSemibold, fontSize: s.font, color: colors.onPrimary }}>
          {label}
        </Text>
        {trailingIcon}
      </View>
    </Pressable>
  );
}

export type TextLinkProps = {
  label: string;
  onPress?: PressableProps['onPress'];
  icon?: React.ReactNode;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  /** Render in a muted color instead of terracotta. */
  muted?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * TextLink — the Kivo secondary action. Terracotta text, no background, no
 * border. Use for every action that isn't the single filled CTA. `muted`
 * renders it in the theme's muted ink instead.
 */
export function TextLink({
  label,
  onPress,
  icon,
  disabled,
  size = 'md',
  fullWidth,
  muted,
  style,
}: TextLinkProps) {
  const { colors } = useTheme();
  const font = SIZES[size].font;
  const [pressed, setPressed] = useState(false);
  const baseStyle: ViewStyle = {
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    opacity: pressOpacity({}, { disabled }),
  };
  // Press feedback (preserved): link press opacity 0.6.
  const pressedStyle: ViewStyle = { opacity: pressOpacity({ pressed: true }, { disabled }) };
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[baseStyle, !disabled && pressed && pressedStyle, style]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: icon ? 6 : 0,
          justifyContent: fullWidth ? 'center' : 'flex-start',
        }}
      >
        {icon}
        <Text
          style={{
            fontFamily: fonts.sansSemibold,
            fontSize: font,
            color: muted ? colors.muted : colors.primary,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * PillPair — the primary becomes the single filled terracotta pill and the
 * secondary becomes a TEXT LINK (not a second filled button).
 */
export function PillPair({
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  stacked,
  size = 'md',
}: {
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary?: PressableProps['onPress'];
  onSecondary?: PressableProps['onPress'];
  stacked?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <View
      style={{ gap: 12 }}
      className={stacked ? 'flex-col w-full items-center' : 'flex-row items-center'}
    >
      <PillButton
        label={primaryLabel}
        variant="primary"
        onPress={onPrimary}
        size={size}
        fullWidth={stacked}
      />
      <TextLink label={secondaryLabel} onPress={onSecondary} size={size} />
    </View>
  );
}

export default PillButton;
