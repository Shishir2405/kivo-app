import React, { useState } from 'react';
import {
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
  type PressableProps,
} from 'react-native';
import { colors, fonts, radii } from '@/theme/tokens';

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

// Compact Steep padding — tight 8x16, small ~13–14 label.
const PAD = {
  sm: { py: 7, px: 14, font: 13 },
  md: { py: 9, px: 18, font: 14 },
  lg: { py: 11, px: 22, font: 14 },
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
  const [pressed, setPressed] = useState(false);
  const pad = PAD[size];
  const isLink = variant === 'neutral';

  if (isLink) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        hitSlop={8}
        style={[
          {
            alignSelf: fullWidth ? 'stretch' : 'flex-start',
            opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
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

  // The single filled Ink pill.
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        {
          borderRadius: radius,
          backgroundColor: colors.ink,
          opacity: disabled ? 0.4 : pressed ? 0.88 : 1,
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
