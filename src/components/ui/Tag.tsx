import React from 'react';
import { View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { fonts, radii, type AppColors } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

export type TagTone =
  | 'yellow'
  | 'carbon'
  | 'signal'
  | 'annotation'
  | 'peach'
  | 'success'
  | 'neutral'
  // Kivo tones (prefer these):
  | 'ink'
  | 'primary'
  | 'warm'
  | 'cool'
  | 'rust'
  | 'mint'
  | 'lavender'
  | 'butter'
  | 'sky';

/**
 * Kivo tag tones — resolved against the ACTIVE palette so they adapt to dark.
 * Legacy names remap onto the Kivo washes / accents.
 */
function tonesFor(c: AppColors): Record<TagTone, { bg: string; fg: string; border?: string }> {
  return {
    // Kivo
    // ink bg inverts per-theme → inkInverted is correct. Terracotta-filled
    // tones stay terracotta in BOTH themes → use onPrimary (cream both themes)
    // so the label never flips to near-black on terracotta in dark.
    ink: { bg: c.ink, fg: c.inkInverted },
    primary: { bg: c.primary, fg: c.onPrimary },
    rust: { bg: c.primary, fg: c.onPrimary },
    neutral: { bg: c.surface, fg: c.muted, border: c.hairline },
    warm: { bg: c.peach, fg: c.peachAccent },
    peach: { bg: c.peach, fg: c.peachAccent },
    cool: { bg: c.sky, fg: c.skyAccent },
    sky: { bg: c.sky, fg: c.skyAccent },
    mint: { bg: c.mint, fg: c.mintAccent },
    lavender: { bg: c.lavender, fg: c.lavenderAccent },
    butter: { bg: c.butter, fg: c.butterAccent },
    success: { bg: c.successWash, fg: c.success },
    // legacy aliases
    yellow: { bg: c.primary, fg: c.onPrimary },
    carbon: { bg: c.ink, fg: c.inkInverted },
    signal: { bg: c.sky, fg: c.skyAccent },
    annotation: { bg: c.dangerWash, fg: c.danger },
  };
}

export type TagProps = {
  label: string;
  tone?: TagTone;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
};

/** A small fully-rounded label chip (Kivo tag — radius 9999, flat). Theme-aware. */
export function Tag({ label, tone = 'neutral', icon, size = 'md', style }: TagProps) {
  const { colors } = useTheme();
  const t = tonesFor(colors)[tone];
  const py = size === 'sm' ? 4 : 5;
  const px = size === 'sm' ? 9 : 11;
  const font = size === 'sm' ? 11 : 11.5;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          backgroundColor: t.bg,
          borderRadius: radii.pill,
          paddingVertical: py,
          paddingHorizontal: px,
          gap: 4,
          ...(t.border ? { borderWidth: 1, borderColor: t.border } : null),
        },
        style,
      ]}
    >
      {icon}
      <Text style={{ fontFamily: fonts.sansSemibold, fontSize: font, color: t.fg, letterSpacing: -0.1 }}>
        {label}
      </Text>
    </View>
  );
}

export default Tag;
