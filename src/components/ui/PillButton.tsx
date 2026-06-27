import React from 'react';
import {
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
  type PressableProps,
} from 'react-native';
import { colors, fonts, radii, pressOpacity } from '@/theme/tokens';

export type PillVariant = 'yellow' | 'black' | 'ghost';

export type PillButtonProps = {
  label: string;
  onPress?: PressableProps['onPress'];
  /**
   * Steep mapping:
   *  - 'yellow' / 'black' → the ONE filled INK pill (primary CTA).
   *  - 'ghost' → a TEXT LINK (Ink text, no bg/border) for secondary actions.
   */
  variant?: PillVariant;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
};

// Compact Steep padding.
const SIZES = {
  sm: { py: 6, px: 13, font: 12 },
  md: { py: 8, px: 16, font: 13 },
  lg: { py: 10, px: 20, font: 14 },
};

/**
 * The Steep pill button — exactly ONE filled style: an Ink pill (Ink bg, white
 * text, small label, tight padding). 'yellow' and 'black' both map to it.
 * 'ghost' renders a TEXT LINK (secondary actions are links, never extra
 * filled/ghost buttons). One filled Ink CTA per screen.
 */
export function PillButton({
  label,
  onPress,
  variant = 'black',
  icon,
  trailingIcon,
  fullWidth,
  disabled,
  size = 'md',
  style,
}: PillButtonProps) {
  const s = SIZES[size];

  if (variant === 'ghost') {
    return <TextLink label={label} onPress={onPress} disabled={disabled} icon={icon} size={size} fullWidth={fullWidth} style={style} />;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed, hovered }) => [
        {
          borderRadius: radii.pill,
          backgroundColor: colors.ink,
          opacity: pressOpacity({ pressed }, { disabled, solid: true }) * (hovered && !pressed ? 0.94 : 1),
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      <View
        className="flex-row items-center justify-center"
        style={{ paddingVertical: s.py, paddingHorizontal: s.px, gap: 6 }}
      >
        {icon}
        <Text style={{ fontFamily: fonts.sansMedium, fontSize: s.font, color: colors.white }}>
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
  /** Render in a muted color (Ash) instead of Ink. */
  muted?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * TextLink — the Steep secondary action. Ink text, no background, no border.
 * Use for every action that isn't the single filled Ink CTA.
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
  const font = SIZES[size].font;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        {
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: pressOpacity({ pressed }, { disabled }),
        },
        style,
      ]}
    >
      <View
        className="flex-row items-center"
        style={{ gap: icon ? 6 : 0, justifyContent: fullWidth ? 'center' : 'flex-start' }}
      >
        {icon}
        <Text style={{ fontFamily: fonts.sansMedium, fontSize: font, color: muted ? colors.ash : colors.ink }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * PillPair — under Steep, the primary becomes the single filled Ink pill and
 * the secondary becomes a TEXT LINK (not a second filled button).
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
        variant="black"
        onPress={onPrimary}
        size={size}
        fullWidth={stacked}
      />
      <TextLink label={secondaryLabel} onPress={onSecondary} size={size} />
    </View>
  );
}

export default PillButton;
