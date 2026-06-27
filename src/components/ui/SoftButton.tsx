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

export type SoftButtonVariant = 'neutral' | 'yellow' | 'carbon';

export type SoftButtonProps = {
  label?: string;
  children?: React.ReactNode;
  onPress?: PressableProps['onPress'];
  /**
   * Steep mapping:
   *  - 'carbon' / 'yellow' → the ONE filled INK pill (primary CTA).
   *  - 'neutral' → a TEXT LINK (Ink text, no bg/border) for secondary actions.
   */
  variant?: SoftButtonVariant;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md' | 'lg';
};

// Compact Steep padding — tight, small ~12–13 label.
const PAD = {
  sm: { py: 6, px: 13, font: 12 },
  md: { py: 8, px: 16, font: 13 },
  lg: { py: 10, px: 20, font: 14 },
};

/**
 * The Steep button.
 *
 * There is exactly ONE filled button style: an Ink pill (Ink bg, white text,
 * small label, tight padding). Both 'carbon' and 'yellow' map to it. The
 * 'neutral' variant renders a TEXT LINK — secondary actions are links, not
 * extra filled/ghost buttons. One filled Ink CTA per screen.
 */
export function SoftButton({
  label,
  children,
  onPress,
  variant = 'carbon',
  icon,
  fullWidth,
  disabled,
  radius = radii.pill,
  style,
  size = 'md',
}: SoftButtonProps) {
  const pad = PAD[size];
  const isLink = variant === 'neutral';

  if (isLink) {
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
          {label ? (
            <Text style={{ fontFamily: fonts.sansMedium, fontSize: pad.font, color: colors.ink }}>
              {label}
            </Text>
          ) : (
            children
          )}
        </View>
      </Pressable>
    );
  }

  // The single filled Ink pill. Hover (web): faint lift via opacity.
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed, hovered }) => [
        {
          borderRadius: radius,
          backgroundColor: colors.ink,
          opacity: pressOpacity({ pressed }, { disabled, solid: true }) * (hovered && !pressed ? 0.94 : 1),
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      <View
        className="flex-row items-center justify-center"
        style={{ paddingVertical: pad.py, paddingHorizontal: pad.px, gap: icon ? 6 : 0 }}
      >
        {icon}
        {label ? (
          <Text style={{ fontFamily: fonts.sansMedium, fontSize: pad.font, color: colors.white }}>
            {label}
          </Text>
        ) : (
          children
        )}
      </View>
    </Pressable>
  );
}

export default SoftButton;
