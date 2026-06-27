import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Easing } from 'react-native-reanimated';

import KivoMark from '../../assets/brand/kivo-mark.svg';
import { MARK_ASPECT } from '@/components/brand/BrandLogo';
import { colors } from '@/theme/tokens';

export type SplashScreenProps = {
  /** Called after the intro animation completes and the scene fades out. */
  onFinish?: () => void;
  /** Alias kept for backwards compatibility with the previous contract. */
  onAnimationComplete?: () => void;
  /** Override the total duration before `onFinish` fires (ms). */
  durationMs?: number;
};

/** Phase boundaries (ms) within the brief sequence. */
const TIMING = {
  fadeOut: 1150, // the mark begins to fade out
  total: 1500, // onFinish fires
} as const;

const MARK_HEIGHT = 64;

/**
 * Steep splash — a calm, logo-only intro.
 *
 * The Kivo mark fades + scales gently up on a clean Fog canvas, settles for a
 * beat, then the whole scene fades out and calls `onFinish`. No converging
 * icons, no glow, no wordmark — data and typography do the talking once the app
 * opens. Prop-compatible with the previous splash (`onFinish` / `durationMs`);
 * also accepts `onAnimationComplete` as an alias.
 */
export function SplashScreen({
  onFinish,
  onAnimationComplete,
  durationMs = TIMING.total,
}: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fade = setTimeout(() => setVisible(false), TIMING.fadeOut);
    const done = setTimeout(() => {
      onFinish?.();
      onAnimationComplete?.();
    }, durationMs);
    return () => {
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, [onFinish, onAnimationComplete, durationMs]);

  return (
    <View style={styles.root}>
      <AnimatePresence>
        {visible ? (
          <MotiView
            key="mark"
            from={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ type: 'timing', duration: 520, easing: Easing.out(Easing.cubic) }}
            exitTransition={{ type: 'timing', duration: 280, easing: Easing.in(Easing.cubic) }}
            pointerEvents="none"
          >
            <KivoMark width={MARK_HEIGHT * MARK_ASPECT} height={MARK_HEIGHT} />
          </MotiView>
        ) : null}
      </AnimatePresence>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fog,
  },
});

export default SplashScreen;
