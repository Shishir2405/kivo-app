import React from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';
import { colors } from '@/theme/tokens';

export type ProgressBarProps = {
  /** 0–100 completion. */
  progress: number;
  /** Track height in px. Steep is thin: default 6. */
  height?: number;
  /** Fill color (defaults to Ink). Pass Rust to mark key progress. */
  color?: string;
  /** Animate the fill growing on mount. */
  animate?: boolean;
  /** Stagger the grow animation (ms). */
  delay?: number;
};

/**
 * A flat Steep progress track — a quiet Fog rail with an Ink (or Rust) fill
 * that grows on mount. Thin, small radius, no neumorphism.
 */
export function ProgressBar({
  progress,
  height = 6,
  color = colors.ink,
  animate = true,
  delay = 0,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));

  return (
    <View
      style={{
        height,
        width: '100%',
        borderRadius: height,
        backgroundColor: colors.fog,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.dove,
      }}
    >
      <MotiView
        from={{ width: animate ? '0%' : `${pct}%` }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'timing', duration: 560, delay }}
        style={{
          height: '100%',
          borderRadius: height,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

export default ProgressBar;
