import React from 'react';
import { View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts, palette, radii } from '@/theme/tokens';

export type TagTone =
  | 'yellow'
  | 'carbon'
  | 'signal'
  | 'annotation'
  | 'peach'
  | 'success'
  | 'neutral'
  // Steep tones (prefer these):
  | 'ink'
  | 'warm'
  | 'cool'
  | 'rust';

/**
 * Steep tones — monochrome chrome + the two washes + Rust. Legacy tone names
 * are remapped so they stay on-brand (no bright/saturated chips).
 */
const TONES: Record<TagTone, { bg: string; fg: string; border?: string }> = {
  // Steep
  ink: { bg: palette.ink, fg: palette.white },
  neutral: { bg: palette.white, fg: palette.ash, border: palette.dove },
  warm: { bg: palette.apricot, fg: palette.rust },
  cool: { bg: palette.sky, fg: palette.ink },
  rust: { bg: palette.apricot, fg: palette.rust },
  // Legacy aliases → Steep
  yellow: { bg: palette.ink, fg: palette.white },
  carbon: { bg: palette.ink, fg: palette.white },
  signal: { bg: palette.sky, fg: palette.ink },
  annotation: { bg: palette.apricot, fg: palette.rust },
  peach: { bg: palette.apricot, fg: palette.rust },
  success: { bg: palette.white, fg: palette.success, border: palette.dove },
};

export type TagProps = {
  label: string;
  tone?: TagTone;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
};

/** A small fully-rounded label chip (Steep tag — radius 9999, flat). */
export function Tag({ label, tone = 'neutral', icon, size = 'md', style }: TagProps) {
  const t = TONES[tone];
  const py = size === 'sm' ? 3 : 4;
  const px = size === 'sm' ? 8 : 10;
  const font = size === 'sm' ? 10 : 11;

  return (
    <View
      className="flex-row items-center self-start"
      style={[
        {
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
      <Text style={{ fontFamily: fonts.sansMedium, fontSize: font, color: t.fg, letterSpacing: -0.1 }}>
        {label}
      </Text>
    </View>
  );
}

export default Tag;
