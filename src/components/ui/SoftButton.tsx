import React, { useState } from 'react';
import {
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
  type PressableProps,
} from 'react-native';
import { Neumorph } from './Neumorph';
import { colors, fonts, radii } from '@/theme/tokens';

export type SoftButtonVariant = 'neutral' | 'yellow' | 'carbon';

export type SoftButtonProps = {
  label?: string;
  children?: React.ReactNode;
  onPress?: PressableProps['onPress'];
  /** neutral = neumorphic gray; yellow = flat highlighter pill; carbon = flat black pill. */
  variant?: SoftButtonVariant;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md' | 'lg';
};

const PAD = {
  sm: { py: 10, px: 18, font: 14 },
  md: { py: 16, px: 32, font: 16 },
  lg: { py: 18, px: 38, font: 17 },
};

/**
 * The Aaply pill button.
 *
 * - `yellow` / `carbon` render as FLAT high-energy fills (carbon text on yellow,
 *   paper text on carbon) — the accent that pops against the neumorphic gray.
 *   Per the spec these are meant to be paired (see <PillPair/>).
 * - `neutral` renders as a raised neumorphic pill that depresses (inset) on press.
 */
export function SoftButton({
  label,
  children,
  onPress,
  variant = 'yellow',
  icon,
  fullWidth,
  disabled,
  radius = radii.pill,
  style,
  size = 'md',
}: SoftButtonProps) {
  const [pressed, setPressed] = useState(false);
  const pad = PAD[size];

  const content = (
    <View
      className="flex-row items-center justify-center"
      style={{
        paddingVertical: pad.py,
        paddingHorizontal: pad.px,
        gap: icon ? 8 : 0,
      }}
    >
      {icon}
      {label ? (
        <Text
          style={{
            fontFamily: fonts.bodyMedium,
            fontSize: pad.font,
            color:
              variant === 'yellow'
                ? colors.carbon
                : variant === 'carbon'
                  ? colors.paper
                  : colors.carbon,
            letterSpacing: 0.2,
          }}
        >
          {label}
        </Text>
      ) : (
        children
      )}
    </View>
  );

  // Flat accent pills (yellow / carbon) — no neumorphism, just energy.
  if (variant === 'yellow' || variant === 'carbon') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[
          {
            borderRadius: radius,
            backgroundColor:
              variant === 'yellow' ? colors.highlighter : colors.carbon,
            opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
            alignSelf: fullWidth ? 'stretch' : 'flex-start',
          },
          style,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  // Neutral neumorphic pill — raised normally, inset when pressed.
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[{ alignSelf: fullWidth ? 'stretch' : 'flex-start' }, style]}
    >
      <Neumorph variant={pressed ? 'inset' : 'raised'} radius={radius} intensity="sm">
        {content}
      </Neumorph>
    </Pressable>
  );
}

export default SoftButton;
