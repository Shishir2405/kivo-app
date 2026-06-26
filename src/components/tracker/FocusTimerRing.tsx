import React, { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Neumorph } from '@/components/ui/Neumorph';
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
  /** Small label under the time, e.g. "Deep Focus". */
  modeLabel: string;
  /** Tint of the progress arc (defaults to highlighter-yellow). */
  accent?: string;
  /** Whether the timer is currently running (drives the breathing pulse). */
  running?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * A neumorphic circular focus-timer ring.
 *
 * The dial sits in a recessed (inset) neumorphic well; an SVG track ring is
 * carved into it, and a highlighter-yellow progress arc sweeps over the top
 * (animated via reanimated `strokeDashoffset`). When running, a subtle breathing
 * pulse animates the arc opacity to signal "in session".
 */
export function FocusTimerRing({
  size = 232,
  stroke = 18,
  progress,
  timeLabel,
  modeLabel,
  accent = colors.highlighter,
  running = false,
  style,
}: FocusTimerRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Animated fraction of the ring that is "filled".
  const animatedProgress = useSharedValue(progress);
  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 450,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, animatedProgress]);

  // Breathing pulse while running — gently animates the arc opacity.
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withTiming(running ? 0.78 : 1, { duration: 1100 });
  }, [running, pulse]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const pulseStyle = useDerivedValue(() => pulse.value);
  const arcOpacityProps = useAnimatedProps(() => ({
    opacity: pulseStyle.value,
  }));

  return (
    <View style={style} className="items-center justify-center">
      <Neumorph variant="inset" radius={size / 2} intensity="lg">
        <View
          style={{ width: size, height: size }}
          className="items-center justify-center"
        >
          <Svg width={size} height={size}>
            <Defs>
              <LinearGradient id="focusArc" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={accent} stopOpacity={1} />
                <Stop offset="1" stopColor={accent} stopOpacity={0.7} />
              </LinearGradient>
            </Defs>

            {/* Recessed track ring. */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#e1e1e1"
              strokeWidth={stroke}
              fill="none"
            />

            {/* Highlighter progress arc — starts at 12 o'clock. */}
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#focusArc)"
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={circumference}
              animatedProps={{ ...animatedProps, ...arcOpacityProps }}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>

          {/* Centre readout overlay. */}
          <View
            style={{ position: 'absolute' }}
            className="items-center justify-center"
            pointerEvents="none"
          >
            <AppText
              variant="heading"
              display
              weight="bold"
              color={colors.carbon}
              style={{ letterSpacing: -1, fontVariant: ['tabular-nums'] }}
            >
              {timeLabel}
            </AppText>
            <AppText
              variant="caption"
              weight="medium"
              color={colors.textMuted}
              style={{ marginTop: 4, textTransform: 'uppercase', letterSpacing: 1.5 }}
            >
              {modeLabel}
            </AppText>
          </View>
        </View>
      </Neumorph>
    </View>
  );
}

export default FocusTimerRing;
