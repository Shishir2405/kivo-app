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

export type PillVariant = 'yellow' | 'black' | 'ghost';

export type PillButtonProps = {
  label: string;
  onPress?: PressableProps['onPress'];
  variant?: PillVariant;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
};

const SIZES = {
  sm: { py: 10, px: 18, font: 14 },
  md: { py: 16, px: 32, font: 16 }, // spec: yellow pill 16x32, Inter 500 16
  lg: { py: 18, px: 38, font: 17 },
};

/**
 * Aaply pill button — fully rounded (radius 9999).
 *  - yellow: bg #e6e51e, carbon text (primary brand action).
 *  - black:  bg carbon, paper text (the companion to the yellow pill).
 *  - ghost:  transparent with a hairline outline (low-emphasis).
 *
 * Pair the yellow + black variants with <PillPair/> — never split them.
 */
export function PillButton({
  label,
  onPress,
  variant = 'yellow',
  icon,
  trailingIcon,
  fullWidth,
  disabled,
  size = 'md',
  style,
}: PillButtonProps) {
  const [pressed, setPressed] = useState(false);
  const s = SIZES[size];

  const bg =
    variant === 'yellow'
      ? colors.highlighter
      : variant === 'black'
        ? colors.carbon
        : 'transparent';
  const fg =
    variant === 'black' ? colors.paper : colors.carbon;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        {
          borderRadius: radii.pill,
          backgroundColor: bg,
          borderWidth: variant === 'ghost' ? 1.5 : 0,
          borderColor: colors.carbon,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      <View
        className="flex-row items-center justify-center"
        style={{ paddingVertical: s.py, paddingHorizontal: s.px, gap: 8 }}
      >
        {icon}
        <Text
          style={{
            fontFamily: fonts.bodyMedium,
            fontSize: s.font,
            color: fg,
            letterSpacing: 0.2,
          }}
        >
          {label}
        </Text>
        {trailingIcon}
      </View>
    </Pressable>
  );
}

/**
 * The signature Aaply device: a yellow primary pill paired with a black
 * companion. Keep them together.
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
      className={stacked ? 'flex-col w-full' : 'flex-row items-center'}
    >
      <PillButton
        label={primaryLabel}
        variant="yellow"
        onPress={onPrimary}
        size={size}
        fullWidth={stacked}
      />
      <PillButton
        label={secondaryLabel}
        variant="black"
        onPress={onSecondary}
        size={size}
        fullWidth={stacked}
      />
    </View>
  );
}

export default PillButton;
