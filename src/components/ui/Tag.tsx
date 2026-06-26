import React from 'react';
import { View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts, radii } from '@/theme/tokens';

export type TagTone =
  | 'yellow'
  | 'carbon'
  | 'signal'
  | 'annotation'
  | 'peach'
  | 'success'
  | 'neutral';

const TONES: Record<TagTone, { bg: string; fg: string }> = {
  yellow: { bg: colors.highlighter, fg: colors.carbon },
  carbon: { bg: colors.carbon, fg: colors.paper },
  signal: { bg: '#e1e8ff', fg: colors.signal },
  annotation: { bg: '#ffe2e2', fg: colors.annotation },
  peach: { bg: '#ffe6dd', fg: '#d8602f' },
  success: { bg: '#dff5e8', fg: '#2c9d5f' },
  neutral: { bg: '#e9e9e9', fg: colors.textMuted },
};

export type TagProps = {
  label: string;
  tone?: TagTone;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
};

/** A fully-rounded label chip (Aaply tag — radius 9999). */
export function Tag({ label, tone = 'neutral', icon, size = 'md', style }: TagProps) {
  const t = TONES[tone];
  const py = size === 'sm' ? 4 : 6;
  const px = size === 'sm' ? 10 : 14;
  const font = size === 'sm' ? 11 : 13;

  return (
    <View
      className="flex-row items-center self-start"
      style={[
        {
          backgroundColor: t.bg,
          borderRadius: radii.pill,
          paddingVertical: py,
          paddingHorizontal: px,
          gap: 5,
        },
        style,
      ]}
    >
      {icon}
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: font, color: t.fg }}>
        {label}
      </Text>
    </View>
  );
}

export default Tag;
