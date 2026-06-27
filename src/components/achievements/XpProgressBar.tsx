/**
 * XpProgressBar — a flat Steep progress meter.
 *
 * A Fog track with a 1px Dove hairline and a thin Ink fill. No neumorphism, no
 * gloss. Used for the level-progress bar on the achievements hero.
 */
import React from 'react';
import { View } from 'react-native';

import { colors } from '@/theme/tokens';

export type XpProgressBarProps = {
  /** 0–1 fill ratio. */
  progress: number;
  /** Fill color (defaults to Ink). */
  color?: string;
  /** Track height in px. */
  height?: number;
};

export function XpProgressBar({ progress, color = colors.ink, height = 8 }: XpProgressBarProps) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;

  return (
    <View
      style={{
        height,
        borderRadius: 9999,
        backgroundColor: colors.fog,
        borderWidth: 1,
        borderColor: colors.dove,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 9999,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

export default XpProgressBar;
