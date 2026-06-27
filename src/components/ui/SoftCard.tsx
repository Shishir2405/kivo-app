import React from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';
import { colors, radii, shadow, type NeumorphIntensity } from '@/theme/tokens';

export type SoftCardProps = {
  children?: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  /** @deprecated Steep is flat; intensity is ignored. */
  intensity?: NeumorphIntensity;
  /**
   * 'raised'/'flat' → white card with hairline + subtle shadow.
   * 'inset' → flat Fog well (hairline, no shadow) for empty/secondary states.
   */
  variant?: 'raised' | 'inset' | 'flat';
  /** Inner padding. Steep is compact: default 14. */
  padding?: number;
  /** Override the surface fill (e.g. a wash for data widgets). */
  surface?: string;
  /** Drop the shadow (hairline only) — for nested/secondary cards. */
  flat?: boolean;
};

/**
 * Card — the flat Steep surface for grouping content.
 *
 * Pure white, radius ~16–20, a 1px Dove hairline + ONE subtle shadow, small
 * (compact) padding. No neumorphism. Use `variant="inset"` for a quiet Fog
 * well (empty states / secondary blocks).
 */
export function SoftCard({
  children,
  className,
  style,
  radius = radii.card,
  variant = 'raised',
  padding = 14,
  surface,
  flat,
}: SoftCardProps) {
  const isInset = variant === 'inset';
  const bg = surface ?? (isInset ? colors.fog : colors.white);
  const withShadow = !isInset && !flat;

  return (
    <View
      className={className}
      style={[
        {
          backgroundColor: bg,
          borderRadius: radius,
          borderWidth: 1,
          borderColor: colors.dove,
          padding,
        },
        withShadow ? shadow : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Steep alias — prefer `Card` in new code. Identical to SoftCard. */
export const Card = SoftCard;
export type CardProps = SoftCardProps;

/**
 * WarmCard — a data widget on the Apricot Wash (#fbe1d1).
 *
 * Use for a single highlighted data figure. No shadow (the wash IS the accent);
 * pair with a Rust key-stat stroke/number inside.
 */
export function WarmCard({
  children,
  style,
  radius = radii.card,
  padding = 14,
  className,
}: Omit<SoftCardProps, 'surface' | 'variant' | 'intensity' | 'flat'>) {
  return (
    <View
      className={className}
      style={[
        {
          backgroundColor: colors.apricot,
          borderRadius: radius,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** CoolCard — a data widget on the Sky Wash (#d3e3fc). Counterpart to WarmCard. */
export function CoolCard({
  children,
  style,
  radius = radii.card,
  padding = 14,
  className,
}: Omit<SoftCardProps, 'surface' | 'variant' | 'intensity' | 'flat'>) {
  return (
    <View
      className={className}
      style={[
        {
          backgroundColor: colors.sky,
          borderRadius: radius,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default SoftCard;
