import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Easing } from 'react-native-reanimated';

import KivoMark from '../../assets/brand/kivo-mark.svg';
import DiscordSvg from '../../assets/brand/discord.svg';
import TwitterSvg from '../../assets/brand/twitter.svg';
import MediumSvg from '../../assets/brand/medium.svg';
import LinkedInSvg from '../../assets/brand/linkedin.svg';
import IconAddSvg from '../../assets/brand/icon-add.svg';
import IconMessageAddSvg from '../../assets/brand/icon-message-add.svg';
import VectorMark1Svg from '../../assets/brand/vector-mark-1.svg';
import VectorMark2Svg from '../../assets/brand/vector-mark-2.svg';

import { BrandLogo, MARK_ASPECT } from '@/components/brand/BrandLogo';
import { DotGridBackground } from '@/components/ui/DotGridBackground';
import { OrbitIcon } from '@/components/splash/OrbitIcon';
import { colors } from '@/theme/tokens';

export type SplashScreenProps = {
  /** Called after the full intro animation completes and the scene fades out. */
  onFinish?: () => void;
  /** Alias kept for backwards compatibility with the previous contract. */
  onAnimationComplete?: () => void;
  /** Override the total duration before `onFinish` fires (ms). */
  durationMs?: number;
};

/**
 * Eight brand icons converging on the eight compass points around the logo.
 * `aspect` = source width / height (keeps each glyph undistorted at a fixed
 * icon height). Delays are staggered so the constellation snaps in like a
 * pinwheel rather than all at once.
 */
const ORBIT = [
  { Icon: TwitterSvg, aspect: 1, angle: -90, delay: 60 }, // N
  { Icon: IconAddSvg, aspect: 1, angle: -45, delay: 140 }, // NE
  { Icon: LinkedInSvg, aspect: 1, angle: 0, delay: 100 }, // E
  { Icon: VectorMark2Svg, aspect: 32 / 25, angle: 45, delay: 200 }, // SE
  { Icon: MediumSvg, aspect: 1, angle: 90, delay: 80 }, // S
  { Icon: IconMessageAddSvg, aspect: 1, angle: 135, delay: 180 }, // SW
  { Icon: DiscordSvg, aspect: 1, angle: 180, delay: 120 }, // W
  { Icon: VectorMark1Svg, aspect: 15 / 11, angle: 225, delay: 220 }, // NW
] as const;

/** Phase boundaries (ms) within the ~2.2s sequence. */
const TIMING = {
  logoReveal: 620, // mark springs up after icons start converging
  wordmark: 960, // wordmark slides in
  settlePulse: 1180, // accent pulse settles
  fadeOut: 1880, // whole scene begins to fade
  total: 2200, // onFinish fires
} as const;

/**
 * Premium animated in-app splash on the graphite-mist dot-grid canvas.
 *
 * Sequence (~2.2s):
 *   1. Eight brand icons fly in from all sides, settling at the compass points
 *      around the center with a staggered spring.
 *   2. The yellow Kivo mark springs up from scale 0 with a subtle rotation and a
 *      highlighter-yellow accent glow/pulse.
 *   3. The "Kivo" wordmark slides + fades in beneath the mark.
 *   4. The scene settles, pulses once, then fades out and calls `onFinish`.
 *
 * Prop-compatible with the previous splash (`onFinish` / `durationMs`); also
 * accepts `onAnimationComplete` as an alias.
 */
export function SplashScreen({
  onFinish,
  onAnimationComplete,
  durationMs = TIMING.total,
}: SplashScreenProps) {
  const { width, height } = useWindowDimensions();
  const [visible, setVisible] = useState(true);

  // Orbit geometry derives from screen size: resting radius hugs the logo, the
  // fly-in origin sits well off-screen along the same bearing.
  const restRadius = Math.min(width, height) * 0.32;
  const flyRadius = Math.max(width, height) * 0.95;

  const chips = useMemo(
    () =>
      ORBIT.map(({ Icon, aspect, angle, delay }, i) => {
        const rad = (angle * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        return {
          key: i,
          Icon: Icon as React.FC<{ width: number; height: number }>,
          aspect,
          delay,
          restX: cos * restRadius,
          restY: sin * restRadius,
          fromX: cos * flyRadius,
          fromY: sin * flyRadius,
        };
      }),
    [restRadius, flyRadius],
  );

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
    <DotGridBackground style={styles.root}>
      <AnimatePresence>
        {visible ? (
          <MotiView
            key="scene"
            from={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            exitTransition={{ type: 'timing', duration: 300, easing: Easing.in(Easing.cubic) }}
            style={styles.scene}
          >
            {/* Converging constellation, centered on the stage. */}
            <View style={styles.stage} pointerEvents="none">
              {chips.map((c) => (
                <OrbitIcon
                  key={c.key}
                  Icon={c.Icon}
                  aspect={c.aspect}
                  delay={c.delay}
                  restX={c.restX}
                  restY={c.restY}
                  fromX={c.fromX}
                  fromY={c.fromY}
                />
              ))}

              {/* Highlighter-yellow accent glow pulsing behind the mark. */}
              <MotiView
                from={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 0.5, scale: 1.18 }}
                transition={{
                  type: 'timing',
                  duration: 760,
                  delay: TIMING.logoReveal,
                  loop: true,
                  repeatReverse: true,
                  easing: Easing.inOut(Easing.ease),
                }}
                style={styles.glow}
                pointerEvents="none"
              />
            </View>

            {/* Center logo build-in: mark springs + rotates, wordmark slides up. */}
            <View style={styles.logoStack} pointerEvents="none">
              <MotiView
                from={{ opacity: 0, scale: 0, rotate: '-28deg' }}
                animate={{ opacity: 1, scale: 1, rotate: '0deg' }}
                transition={{
                  type: 'spring',
                  delay: TIMING.logoReveal,
                  damping: 11,
                  mass: 0.8,
                  stiffness: 140,
                }}
              >
                <KivoMark width={72 * MARK_ASPECT} height={72} />
              </MotiView>

              <MotiView
                from={{ opacity: 0, translateY: 16 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: 'timing',
                  duration: 460,
                  delay: TIMING.wordmark,
                  easing: Easing.out(Easing.cubic),
                }}
                style={styles.wordmark}
              >
                <BrandLogo variant="lockup" size={26} />
              </MotiView>
            </View>
          </MotiView>
        ) : null}
      </AnimatePresence>
    </DotGridBackground>
  );
}

const fill = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scene: {
    ...fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    ...fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: colors.highlighter,
    // lift to sit on the mark, not the whole lockup stack
    marginBottom: 44,
  },
  logoStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    marginTop: 22,
  },
});

export default SplashScreen;
