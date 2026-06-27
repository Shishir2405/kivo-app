import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MotiView, AnimatePresence } from 'moti';
import { Easing } from 'react-native-reanimated';

import { KIVO_MARK, MARK_ASPECT } from '@/components/brand/BrandLogo';
import { fonts, motion } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

export type SplashScreenProps = {
  /** Called after the intro animation completes and the scene fades out. */
  onFinish?: () => void;
  /** Alias kept for backwards compatibility with the previous contract. */
  onAnimationComplete?: () => void;
  /** Override the total duration before `onFinish` fires (ms). */
  durationMs?: number;
};

/** Phase boundaries (ms) within the sequence. */
const TIMING = {
  fadeOut: 1450, // the scene begins to fade out
  total: 1850, // onFinish fires
} as const;

const MARK_HEIGHT = 92;

/**
 * Kivo splash — a refined, warm-editorial intro.
 *
 * On the theme canvas (cream in light, warm dark in dark) the terracotta Kivo
 * mark springs + fades in with the Kivo overshoot spring; the "Kivo" wordmark
 * fades up beneath it in Newsreader (the editorial serif) using the .6s reveal
 * easing. The whole scene settles, then fades out and calls `onFinish` — the
 * existing handoff contract (also accepts `onAnimationComplete` / `durationMs`).
 */
export function SplashScreen({
  onFinish,
  onAnimationComplete,
  durationMs = TIMING.total,
}: SplashScreenProps) {
  const { colors } = useTheme();
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
    <View style={[styles.root, { backgroundColor: colors.canvas }]}>
      <AnimatePresence>
        {visible ? (
          <MotiView
            key="kivo-splash"
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'timing', duration: 320, easing: Easing.out(Easing.cubic) }}
            exitTransition={{ type: 'timing', duration: 360, easing: Easing.in(Easing.cubic) }}
            pointerEvents="none"
            style={styles.center}
          >
            {/* Mark: spring + scale in (the Kivo overshoot). */}
            <MotiView
              from={{ opacity: 0, scale: 0.78, translateY: 6 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ ...motion.spring, delay: 60 }}
            >
              <Image
                source={KIVO_MARK}
                style={{ width: MARK_HEIGHT * MARK_ASPECT, height: MARK_HEIGHT }}
                contentFit="contain"
              />
            </MotiView>

            {/* Wordmark: fade up beneath (.6s reveal easing). */}
            <MotiView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: 'timing',
                duration: motion.duration.reveal,
                delay: 320,
                easing: Easing.bezier(...motion.bezier.easing),
              }}
            >
              <Text
                style={{
                  marginTop: 18,
                  fontFamily: fonts.serifMedium,
                  fontSize: 34,
                  letterSpacing: -0.5,
                  color: colors.ink,
                }}
              >
                Kivo
              </Text>
            </MotiView>
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
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SplashScreen;
