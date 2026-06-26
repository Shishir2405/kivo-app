import React from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';
import { Neumorph } from '@/components/ui/Neumorph';
import { colors } from '@/theme/tokens';

export type XpProgressBarProps = {
  /** 0–1 fill ratio. */
  progress: number;
  /** Fill color (defaults to highlighter-yellow). */
  color?: string;
  /** Track height in px. */
  height?: number;
  /** Mount-animation delay (ms). */
  delay?: number;
};

/**
 * A neumorphic progress bar: an inset well carved into the surface holding an
 * animated accent fill. The fill grows from 0 to `progress` with a spring on
 * mount and carries a soft top highlight so it reads as a glossy filled track.
 */
export function XpProgressBar({
  progress,
  color = colors.highlighter,
  height = 14,
  delay = 220,
}: XpProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const pct = `${clamped * 100}%` as const;

  return (
    <Neumorph variant="inset" radius={height / 2} intensity="sm">
      <View style={{ height, borderRadius: height / 2, overflow: 'hidden' }}>
        <MotiView
          from={{ width: '0%' }}
          animate={{ width: pct }}
          transition={{ type: 'spring', damping: 20, stiffness: 120, delay }}
          style={{
            height,
            borderRadius: height / 2,
            backgroundColor: color,
            justifyContent: 'flex-start',
          }}
        >
          {/* Glossy top highlight on the fill. */}
          <View
            style={{
              height: height * 0.42,
              marginTop: 2,
              marginHorizontal: 3,
              borderRadius: height,
              backgroundColor: 'rgba(255,255,255,0.35)',
            }}
          />
        </MotiView>
      </View>
    </Neumorph>
  );
}

export default XpProgressBar;
