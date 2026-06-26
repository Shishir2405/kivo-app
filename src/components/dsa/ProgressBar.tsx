import React from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';
import { colors } from '@/theme/tokens';

export type ProgressBarProps = {
  /** 0–100 completion. */
  progress: number;
  /** Track height in px. */
  height?: number;
  /** Fill color (defaults to highlighter-yellow). */
  color?: string;
  /** Animate the fill growing on mount. */
  animate?: boolean;
  /** Stagger the grow animation (ms). */
  delay?: number;
};

/**
 * A neumorphic progress track — an inset well on the gray canvas with a
 * highlighter-yellow fill that grows on mount. Used in roadmap and topic cards.
 */
export function ProgressBar({
  progress,
  height = 10,
  color = colors.highlighter,
  animate = true,
  delay = 0,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, progress));

  return (
    <View
      style={{
        height,
        width: '100%',
        borderRadius: height,
        backgroundColor: '#e6e6e6',
        overflow: 'hidden',
        borderTopWidth: 1,
        borderTopColor: 'rgba(174,174,192,0.28)',
      }}
    >
      <MotiView
        from={{ width: animate ? '0%' : `${pct}%` }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'timing', duration: 640, delay }}
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
