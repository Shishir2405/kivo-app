/**
 * ThemeTransition — the CIRCULAR REVEAL ("iris") theme switcher.
 *
 * Renders a full-screen overlay ABOVE all app content. When a theme change is
 * requested via `useThemeTransition().transitionTheme(nextMode, origin)`, a
 * circle filled with the TARGET theme's canvas color expands from the tapped
 * point until it covers the screen, the underlying theme is committed at the
 * moment the screen is fully covered (so the old UI is never seen flipping),
 * then the overlay fades out to reveal the freshly-themed app underneath.
 *
 * Driven on the UI thread with reanimated (scale of a circle View) for 60fps.
 * The overlay only mounts while a transition is running and never intercepts
 * touches (pointerEvents="none"), so the idle app is untouched.
 *
 * Mount `ThemeTransitionProvider` INSIDE `ThemeProvider` (it reads the active
 * palette + calls `setMode`) but so that its overlay layers above the app.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Appearance, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { lightColors, darkColors, motion } from './tokens';
import { useTheme, type ThemeMode } from './ThemeContext';

/* ------------------------------------------------------------------ */
/* Types & context                                                     */
/* ------------------------------------------------------------------ */

/** A screen-space origin point (px) the reveal circle expands from. */
export type TransitionOrigin = { x: number; y: number };

export type ThemeTransitionValue = {
  /**
   * Animate to `nextMode` with a circular reveal originating at `origin`
   * (screen coordinates). Falls back to an instant switch if a transition is
   * already running or no origin is given.
   */
  transitionTheme: (nextMode: ThemeMode, origin?: TransitionOrigin) => void;
  /** True while a reveal is animating. */
  isTransitioning: boolean;
};

const ThemeTransitionContext = createContext<ThemeTransitionValue>({
  transitionTheme: () => {},
  isTransitioning: false,
});

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Resolve the canvas color the app WILL show once `mode` is applied. */
function targetCanvasFor(mode: ThemeMode): string {
  const resolved: 'light' | 'dark' =
    mode === 'system'
      ? Appearance.getColorScheme() === 'dark'
        ? 'dark'
        : 'light'
      : mode;
  return resolved === 'dark' ? darkColors.canvas : lightColors.canvas;
}

/** Farthest distance from `origin` to any of the 4 screen corners. */
function coverRadius(origin: TransitionOrigin, w: number, h: number): number {
  const dx = Math.max(origin.x, w - origin.x);
  const dy = Math.max(origin.y, h - origin.y);
  return Math.hypot(dx, dy);
}

/** Timings (ms). Reveal expands, then the overlay fades to hand off. */
const EXPAND_MS = 480;
const FADE_MS = 180;

/* ------------------------------------------------------------------ */
/* Provider                                                           */
/* ------------------------------------------------------------------ */

export function ThemeTransitionProvider({ children }: { children: React.ReactNode }) {
  const { setMode } = useTheme();
  const { width, height } = useWindowDimensions();

  // Mounts the overlay only while a reveal is in flight.
  const [active, setActive] = useState(false);
  // The circle's fill = the TARGET theme canvas. Drives nothing animated.
  const [fill, setFill] = useState<string>(lightColors.canvas);
  // Final circle diameter (covers the screen). The base View is this size and
  // we scale it 0 -> 1 on the UI thread.
  const [diameter, setDiameter] = useState(0);
  const [topLeft, setTopLeft] = useState<TransitionOrigin>({ x: 0, y: 0 });

  // Guards against overlapping triggers (taps mid-animation).
  const runningRef = useRef(false);
  // Whether the theme has been committed for the in-flight transition, and a
  // JS-thread safety timer that GUARANTEES teardown even if a reanimated
  // completion callback is ever dropped (otherwise the full-screen target
  // canvas circle could stay mounted and blank the app — cream in light mode).
  const committedRef = useRef(false);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Cleanup after the fade: unmount the overlay + release the guard.
  const finish = useCallback(() => {
    if (safetyRef.current) {
      clearTimeout(safetyRef.current);
      safetyRef.current = null;
    }
    setActive(false);
    runningRef.current = false;
  }, []);

  // Fade the (now full-screen, freshly-themed-circle) overlay away to reveal
  // the real themed UI rendered underneath.
  const fadeOut = useCallback(() => {
    opacity.value = withTiming(
      0,
      { duration: FADE_MS, easing: Easing.bezier(...motion.bezier.easing) },
      (done) => {
        'worklet';
        if (done) runOnJS(finish)();
      },
    );
  }, [opacity, finish]);

  // Commit the theme once the circle has fully covered the screen, THEN fade.
  // At this instant the whole viewport is the target canvas color, so flipping
  // the underlying palette is invisible — there is no flash of the old theme.
  const commitAndFade = useCallback(
    (nextMode: ThemeMode) => {
      committedRef.current = true;
      setMode(nextMode);
      fadeOut();
    },
    [setMode, fadeOut],
  );

  const transitionTheme = useCallback(
    (nextMode: ThemeMode, origin?: TransitionOrigin) => {
      // No origin or no measured screen, or a transition already running:
      // just switch instantly — never get stuck or stack reveals.
      if (!origin || width <= 0 || height <= 0 || runningRef.current) {
        setMode(nextMode);
        return;
      }

      runningRef.current = true;

      const radius = coverRadius(origin, width, height);
      const d = radius * 2;
      const targetFill = targetCanvasFor(nextMode);

      // Position a `d x d` box centered on the origin, scaled from 0.
      setDiameter(d);
      setFill(targetFill);
      setTopLeft({ x: origin.x - radius, y: origin.y - radius });

      scale.value = 0;
      opacity.value = 1;
      committedRef.current = false;
      setActive(true);

      // JS-thread safety net: if the reanimated completion callbacks below ever
      // fail to fire, this still commits the theme and tears the overlay down,
      // so the screen can never stay blanked under the cover circle.
      if (safetyRef.current) clearTimeout(safetyRef.current);
      safetyRef.current = setTimeout(() => {
        if (!committedRef.current) {
          committedRef.current = true;
          setMode(nextMode);
        }
        finish();
      }, EXPAND_MS + FADE_MS + 400);

      // Expand on the UI thread, then commit + fade on the JS thread.
      scale.value = withTiming(
        1,
        { duration: EXPAND_MS, easing: Easing.bezier(...motion.bezier.easing) },
        (done) => {
          'worklet';
          if (done) runOnJS(commitAndFade)(nextMode);
        },
      );
    },
    [width, height, setMode, scale, opacity, commitAndFade, finish],
  );

  const circleStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const value = useMemo<ThemeTransitionValue>(
    () => ({ transitionTheme, isTransitioning: active }),
    [transitionTheme, active],
  );

  return (
    <ThemeTransitionContext.Provider value={value}>
      {children}
      {active ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: topLeft.x,
                top: topLeft.y,
                width: diameter,
                height: diameter,
                borderRadius: diameter / 2,
                backgroundColor: fill,
              },
              circleStyle,
            ]}
          />
        </View>
      ) : null}
    </ThemeTransitionContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Hook                                                               */
/* ------------------------------------------------------------------ */

/**
 * useThemeTransition — trigger the circular reveal theme switch.
 *
 *   const { transitionTheme } = useThemeTransition();
 *   transitionTheme('dark', { x: pageX, y: pageY });
 *
 * Safe to call outside the provider (returns a no-op that just switches), so
 * it never throws in isolated previews.
 */
export function useThemeTransition(): ThemeTransitionValue {
  return useContext(ThemeTransitionContext);
}

export default ThemeTransitionProvider;
