/**
 * XpProgressBar — a flat Steep progress meter.
 *
 * A surfaceAlt track with a 1px hairline and a thin fill (Ink by default, or a
 * passed accent). No neumorphism, no gloss. Theme-aware (light/dark) via
 * useTheme(). Used for the level-progress bar on the achievements hero.
 */
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme';

export type XpProgressBarProps = {
  /** 0–1 fill ratio. */
  progress: number;
  /** Fill color (defaults to Ink). */
  color?: string;
  /** Track height in px. */
  height?: number;
};

export function XpProgressBar({ progress, color, height = 8 }: XpProgressBarProps) {
  const { colors } = useTheme();
  const pct = Math.max(0, Math.min(1, progress)) * 100;

  return (
    <View
      style={{
        height,
        borderRadius: 9999,
        backgroundColor: colors.surfaceAlt,
        borderWidth: 1,
        borderColor: colors.hairline,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 9999,
          backgroundColor: color ?? colors.ink,
        }}
      />
    </View>
  );
}

export default XpProgressBar;
