import React from 'react';
import { View, Pressable, type ViewStyle, type StyleProp } from 'react-native';
import {
  colors,
  radii,
  shadow,
  componentPadding,
  interaction,
  type NeumorphIntensity,
} from '@/theme/tokens';

/** Card surface tone — default white, or a Steep data wash. */
export type CardTone = 'default' | 'warm' | 'cool';

const TONE_BG: Record<CardTone, string> = {
  default: colors.white,
  warm: colors.apricot, // Apricot wash (#fbe1d1)
  cool: colors.sky, // Sky wash (#d3e3fc)
};

export type SoftCardProps = {
  children?: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  /** @deprecated Steep is flat; intensity is ignored. */
  intensity?: NeumorphIntensity;
  /**
   * 'raised'/'flat' → card with hairline + subtle shadow.
   * 'inset' → flat Fog well (hairline, no shadow) for empty/secondary states.
   */
  variant?: 'raised' | 'inset' | 'flat';
  /**
   * Surface tone. 'default' white, 'warm' Apricot wash, 'cool' Sky wash. Data
   * cards should pick warm/cool so the grid isn't all-white-dead.
   */
  tone?: CardTone;
  /** Inner padding. Steep is compact: default 12. */
  padding?: number;
  /** Override the surface fill explicitly (wins over `tone`). */
  surface?: string;
  /** Drop the shadow (hairline only) — for nested/secondary cards. */
  flat?: boolean;
  /** Make the card tappable; adds pressed/hover interaction states. */
  onPress?: () => void;
  accessibilityLabel?: string;
};

/**
 * Card — the flat Steep surface for grouping content.
 *
 * radius ~16–18, a 1px Dove hairline + ONE subtle shadow (gentle depth, NOT
 * puffy neumorphism), compact padding. `tone` adds the Apricot/Sky wash for
 * data cards. `variant="inset"` is a quiet Fog well (empty/secondary blocks).
 * Pass `onPress` to make it tappable (pressed: slight scale + opacity).
 */
export function SoftCard({
  children,
  className,
  style,
  radius = radii.card,
  variant = 'raised',
  tone = 'default',
  padding = componentPadding.card,
  surface,
  flat,
  onPress,
  accessibilityLabel,
}: SoftCardProps) {
  const isInset = variant === 'inset';
  const toneBg = TONE_BG[tone];
  const bg = surface ?? (isInset ? colors.fog : toneBg);
  const withShadow = !isInset && !flat;

  const baseStyle: ViewStyle = {
    backgroundColor: bg,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.dove,
    padding,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        className={className}
        style={({ pressed }) => [
          baseStyle,
          withShadow ? shadow : null,
          pressed
            ? { opacity: interaction.pressOpacitySolid, transform: [{ scale: interaction.pressScale }] }
            : null,
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={className} style={[baseStyle, withShadow ? shadow : null, style]}>
      {children}
    </View>
  );
}

/** Steep alias — prefer `Card` in new code. Identical to SoftCard. */
export const Card = SoftCard;
export type CardProps = SoftCardProps;

export type ToneCardProps = Omit<SoftCardProps, 'tone' | 'surface'>;

/**
 * WarmCard — a data widget on the Apricot Wash (#fbe1d1) with the subtle Steep
 * depth (soft shadow + Dove hairline). Pair with a Rust key-stat inside.
 */
export function WarmCard(props: ToneCardProps) {
  return <SoftCard {...props} tone="warm" />;
}

/** CoolCard — a data widget on the Sky Wash (#d3e3fc). Counterpart to WarmCard. */
export function CoolCard(props: ToneCardProps) {
  return <SoftCard {...props} tone="cool" />;
}

export default SoftCard;
