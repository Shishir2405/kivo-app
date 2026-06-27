import React from 'react';
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

export type SoftButtonVariant = 'neutral' | 'yellow' | 'carbon' | 'primary';

export type SoftButtonProps = {
  label?: string;
  children?: React.ReactNode;
  onPress?: PressableProps['onPress'];
  /**
   * Kivo mapping:
   *  - 'carbon' / 'yellow' / 'primary' → the ONE filled TERRACOTTA pill (CTA).
   *  - 'neutral' → a TEXT LINK (terracotta text, no bg/border) for secondary.
   */
  variant?: SoftButtonVariant;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md' | 'lg';
};

// Kivo padding.
const PAD = {
  sm: { py: 9, px: 16, font: 13 },
  md: { py: 12, px: 20, font: 14 },
  lg: { py: 14, px: 24, font: 15 },
};

/**
 * The Kivo button. There is exactly ONE filled style: a terracotta pill.
 * 'carbon'/'yellow'/'primary' map to it. 'neutral' renders a TEXT LINK —
 * secondary actions are links, not extra filled/ghost buttons. Theme-aware.
 */
export function SoftButton({
  label,
  children,
  onPress,
  variant = 'primary',
  icon,
  fullWidth,
  disabled,
  radius = radii.pill,
  style,
  size = 'md',
}: SoftButtonProps) {
  const { colors } = useTheme();
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
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: icon ? 6 : 0,
            justifyContent: fullWidth ? 'center' : 'flex-start',
          }}
        >
          {icon}
          {label ? (
            <Text style={{ fontFamily: fonts.sansSemibold, fontSize: pad.font, color: colors.primary }}>
              {label}
            </Text>
          ) : (
            children
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          borderRadius: radius,
          backgroundColor: pressed && !disabled ? colors.primaryPressed : colors.primary,
          opacity: pressOpacity({ pressed }, { disabled, solid: true }),
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: disabled ? 0 : 0.45,
          shadowRadius: 18,
          elevation: disabled ? 0 : 4,
        },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: pad.py,
          paddingHorizontal: pad.px,
          gap: icon ? 7 : 0,
        }}
      >
        {icon}
        {label ? (
          <Text style={{ fontFamily: fonts.sansSemibold, fontSize: pad.font, color: colors.onPrimary }}>
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
