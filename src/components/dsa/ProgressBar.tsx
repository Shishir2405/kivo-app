import React from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';
import { motion } from '@/theme/tokens';
import { useTheme } from '@/theme';

export type ProgressBarProps = {
  /** 0–100 completion. */
  progress: number;
  /** Track height in px. Kivo is thin: default 6. */
  height?: number;
  /** Fill color (defaults to ink). Pass primary to mark key progress. */
  color?: string;
  /** Animate the fill growing on mount. */
  animate?: boolean;
  /** Stagger the grow animation (ms). */
  delay?: number;
};

/**
 * A flat Kivo progress track — a quiet wash rail with an ink (or terracotta)
 * fill that grows on mount. Thin, small radius, no neumorphism. Dark-aware.
 */
export function ProgressBar({
  progress,
  height = 6,
  color,
  animate = true,
  delay = 0,
}: ProgressBarProps) {
  const { colors } = useTheme();
  const fill = color ?? colors.ink;
  const pct = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));

  return (
    <View
      style={{
        height,
        width: '100%',
        borderRadius: height,
        backgroundColor: colors.surfaceAlt,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.hairline,
      }}
    >
      <MotiView
        from={{ width: animate ? '0%' : `${pct}%` }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'timing', duration: motion.duration.reveal, delay }}
        style={{
          height: '100%',
          borderRadius: height,
          backgroundColor: fill,
        }}
      />
    </View>
  );
}

export default ProgressBar;
