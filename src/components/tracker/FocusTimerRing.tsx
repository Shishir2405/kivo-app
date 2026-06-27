import React, { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AppText } from '@/components/ui/Typography';
import { colors } from '@/theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type FocusTimerRingProps = {
  /** Diameter of the ring in px. */
  size?: number;
  /** Ring stroke thickness. */
  stroke?: number;
  /** 0..1 fraction of the session remaining (1 = full, 0 = done). */
  progress: number;
  /** Big centre label, e.g. "24:00". */
  timeLabel: string;
  /** Small label under the time, e.g. "Deep focus". */
  modeLabel: string;
  /** @deprecated Steep ring is Rust-only; legacy `accent` is accepted + ignored. */
  accent?: string;
  /** @deprecated legacy pulse flag — accepted + ignored (Steep ring is calm). */
  running?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * A clean, flat Steep focus-timer ring.
 *
 * A thin 1px-feel Dove track with a Rust progress arc sweeping over it (the one
 * warm key-data stroke), animated via reanimated `strokeDashoffset`. The centre
 * shows the remaining time (editorial serif, tabular) and a small muted mode
 * label. No neumorphism, no gradient, no glow.
 */
export function FocusTimerRing({
  size = 188,
  stroke = 8,
  progress,
  timeLabel,
  modeLabel,
  style,
}: FocusTimerRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProgress = useSharedValue(progress);
  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, animatedProgress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View style={style} className="items-center justify-center">
      <View
        style={{ width: size, height: size }}
        className="items-center justify-center"
      >
        <Svg width={size} height={size}>
          {/* Track ring — quiet Dove hairline. */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.fog}
            strokeWidth={stroke}
            fill="none"
          />
          {/* Rust progress arc — starts at 12 o'clock. */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.rust}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>

        {/* Centre readout. */}
        <View
          style={{ position: 'absolute' }}
          className="items-center justify-center"
          pointerEvents="none"
        >
          <AppText
            variant="display"
            display
            weight="medium"
            color={colors.ink}
            style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.5 }}
          >
            {timeLabel}
          </AppText>
          <AppText
            variant="caption"
            weight="medium"
            color={colors.graphite}
            style={{ marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}
          >
            {modeLabel}
          </AppText>
        </View>
      </View>
    </View>
  );
}

export default FocusTimerRing;
