import React from 'react';
import { View, Pressable, type ViewStyle, type StyleProp } from 'react-native';
import {
  radii,
  componentPadding,
  interaction,
  type CardTone as WashTone,
  type NeumorphIntensity,
} from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

/**
 * Card surface tone. The soft-wash COLOR layer:
 *   'default' (surface) | 'peach' | 'sky' | 'mint' | 'lavender' | 'butter'
 * Legacy 'warm' → peach and 'cool' → sky are accepted for back-compat.
 */
export type CardTone = WashTone | 'warm' | 'cool';

/** Normalise any accepted tone (incl. legacy warm/cool) to a wash tone. */
function resolveTone(tone: CardTone): WashTone {
  if (tone === 'warm') return 'peach';
  if (tone === 'cool') return 'sky';
  return tone;
}

export type SoftCardProps = {
  /**
   * Card content. May be a render-prop receiving the tone's deeper `accent`
   * color so child icons/stats can match the wash without re-deriving it.
   */
  children?: React.ReactNode | ((ctx: { accent: string }) => React.ReactNode);
  className?: string;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  /** @deprecated Kivo is flat; intensity is ignored. */
  intensity?: NeumorphIntensity;
  /**
   * 'raised'/'flat' → card with hairline + the one soft shadow.
   * 'inset' → flat well (hairline, no shadow) for empty/secondary states.
   */
  variant?: 'raised' | 'inset' | 'flat';
  /**
   * Surface tone — the soft-wash color layer. 'default' is the plain surface
   * (reserve for dense content); 'peach' | 'sky' | 'mint' | 'lavender' |
   * 'butter' are calm washes for stat tiles / quick actions / highlights so a
   * grid is never all-dead. Each wash applies a matching hairline + the one
   * soft shadow, and exposes a deeper `accent` for child icons (see render-prop
   * children or useTheme().accentForTone(tone)). Legacy 'warm'→peach,
   * 'cool'→sky. All washes adapt to dark.
   */
  tone?: CardTone;
  /** Inner padding. Kivo default 16. */
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
 * Card — the flat Kivo surface for grouping content.
 *
 * radius 16–18, a 1px hairline + ONE soft shadow (gentle depth, NOT puffy
 * neumorphism), comfortable padding. `tone` adds one of the five washes for
 * data cards. `variant="inset"` is a quiet well (empty/secondary blocks). Pass
 * `onPress` to make it tappable. Fully theme-aware via useTheme().
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
  const { colors, shadow, toneStyle } = useTheme();
  const isInset = variant === 'inset';
  const washTone = resolveTone(tone);
  const ts = toneStyle(washTone);
  const accent = ts.accent;
  const bg = surface ?? (isInset ? colors.surfaceAlt : ts.bg);
  const borderColor = isInset ? colors.hairline : ts.border;
  const withShadow = !isInset && !flat;

  const resolvedChildren =
    typeof children === 'function' ? children({ accent }) : children;

  const baseStyle: ViewStyle = {
    backgroundColor: bg,
    borderRadius: radius,
    borderWidth: 1,
    borderColor,
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
        {resolvedChildren}
      </Pressable>
    );
  }

  return (
    <View className={className} style={[baseStyle, withShadow ? shadow : null, style]}>
      {resolvedChildren}
    </View>
  );
}

/** Kivo alias — prefer `Card` in new code. Identical to SoftCard. */
export const Card = SoftCard;
export type CardProps = SoftCardProps;

export type ToneCardProps = Omit<SoftCardProps, 'tone' | 'surface'>;

/**
 * WarmCard — a data widget on the Peach wash with the subtle Kivo depth (soft
 * shadow + matching hairline). Pair with a warm key-stat inside.
 */
export function WarmCard(props: ToneCardProps) {
  return <SoftCard {...props} tone="peach" />;
}

/** CoolCard — a data widget on the Sky wash. Counterpart to WarmCard. */
export function CoolCard(props: ToneCardProps) {
  return <SoftCard {...props} tone="sky" />;
}

/** Re-export the LIGHT tone color helpers (back-compat). Prefer useTheme(). */
export { accentForTone, toneStyle } from '@/theme/tokens';

export default SoftCard;
