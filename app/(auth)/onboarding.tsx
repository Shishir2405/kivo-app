import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import Svg, { Rect, Circle, G, Line, Polyline } from 'react-native-svg';

import { spacing, radii, motion } from '@/theme/tokens';
import { useTheme } from '@/theme';
import { useUiStore } from '@/store';
import { AppText, PillButton, TextLink } from '@/components/ui';
import type { AppColors } from '@/theme/tokens';

/* ------------------------------------------------------------------ */
/* Slide content                                                       */
/* ------------------------------------------------------------------ */

type SlideKey = 'fan' | 'ladder' | 'heatmap';

type Slide = {
  key: SlideKey;
  eyebrow: string;
  headline: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    key: 'fan',
    eyebrow: 'Onboarding · 1 of 3',
    headline: 'Your whole learning life, in one calm place',
    body: 'DSA prep, notes, tasks, habits and focus — no more juggling five apps. Kivo brings it together.',
  },
  {
    key: 'ladder',
    eyebrow: 'Onboarding · 2 of 3',
    headline: 'Remember everything you solve',
    body: 'Every problem you finish schedules its own revisions — spaced just right so it actually sticks.',
  },
  {
    key: 'heatmap',
    eyebrow: 'Onboarding · 3 of 3',
    headline: 'Watch your progress fill in',
    body: 'Streaks, heatmaps and weekly insight turn quiet daily effort into momentum you can see.',
  },
];

/* ------------------------------------------------------------------ */
/* Illustrations — inline react-native-svg using the theme washes      */
/* ------------------------------------------------------------------ */

const ART = 200; // illustration canvas size

/** Slide 1 — FANNED WASHES: three overlapping rounded cards, fanned/stacked. */
function FannedWashes({ colors }: { colors: AppColors }) {
  const { toneStyle } = useTheme();
  const sky = toneStyle('sky');
  const mint = toneStyle('mint');
  const peach = toneStyle('peach');
  const cw = 120;
  const ch = 96;
  return (
    <Svg width={ART} height={ART} viewBox={`0 0 ${ART} ${ART}`}>
      {/* back card — sky, rotated left */}
      <G origin={`${30 + cw / 2}, ${54 + ch / 2}`} rotation={-11}>
        <Rect
          x={30}
          y={54}
          width={cw}
          height={ch}
          rx={20}
          fill={sky.bg}
          stroke={sky.border}
          strokeWidth={1}
        />
      </G>
      {/* middle card — mint, rotated right */}
      <G origin={`${42 + cw / 2}, ${42 + ch / 2}`} rotation={5}>
        <Rect
          x={42}
          y={42}
          width={cw}
          height={ch}
          rx={20}
          fill={mint.bg}
          stroke={mint.border}
          strokeWidth={1}
        />
      </G>
      {/* front card — peach, with the recurring terracotta ring glyph */}
      <Rect
        x={36}
        y={36}
        width={cw}
        height={ch}
        rx={20}
        fill={peach.bg}
        stroke={peach.border}
        strokeWidth={1}
      />
      <Rect
        x={36 + cw / 2 - 19}
        y={36 + ch / 2 - 19}
        width={38}
        height={38}
        rx={12}
        fill={colors.primary}
      />
      <Circle
        cx={36 + cw / 2}
        cy={36 + ch / 2}
        r={7.5}
        fill="none"
        stroke={peach.bg}
        strokeWidth={2.5}
      />
    </Svg>
  );
}

/** Slide 2 — SPACING LADDER: ascending wash bars suggesting spaced intervals. */
function SpacingLadder({ colors }: { colors: AppColors }) {
  const { toneStyle } = useTheme();
  const bars: { h: number; tone: ReturnType<typeof toneStyle>; cap?: boolean }[] = [
    { h: 46, tone: toneStyle('lavender') },
    { h: 66, tone: toneStyle('sky') },
    { h: 88, tone: toneStyle('mint') },
    { h: 110, tone: toneStyle('butter') },
    { h: 132, tone: toneStyle('peach'), cap: true },
  ];
  const barW = 30;
  const gap = 9;
  const totalW = bars.length * barW + (bars.length - 1) * gap;
  const baseY = 150; // bottom baseline inside a 150-tall band
  const startX = (ART - totalW) / 2;
  return (
    <Svg width={ART} height={ART} viewBox={`0 0 ${ART} ${ART}`}>
      {bars.map((bar, i) => {
        const x = startX + i * (barW + gap);
        const y = baseY - bar.h;
        return (
          <G key={i}>
            <Rect
              x={x}
              y={y}
              width={barW}
              height={bar.h}
              rx={11}
              fill={bar.tone.bg}
              stroke={bar.tone.border}
              strokeWidth={1}
            />
            {bar.cap ? (
              <Circle cx={x + barW / 2} cy={y + 16} r={8} fill={colors.primary} />
            ) : null}
          </G>
        );
      })}
    </Svg>
  );
}

/** Slide 3 — HEATMAP + STREAK: a small grid of filled/empty squares + flame. */
function HeatmapStreak({ colors }: { colors: AppColors }) {
  const { isDark } = useTheme();
  const cols = 10;
  const rows = 3;
  const cell = 16;
  const cellGap = 4;
  const gridW = cols * cell + (cols - 1) * cellGap;
  const startX = (ART - gridW) / 2;
  const startY = 18;

  // Terracotta heat ramp (light); deepen for dark.
  const empty = isDark ? colors.surfaceAlt : '#EDE6DA';
  const ramp = isDark
    ? [colors.surfaceAlt, colors.peach, colors.primaryWash, colors.primary]
    : ['#F0DDCC', '#E6B08A', '#D98E5C', colors.primary];

  // Intensity pattern (0 = empty, 1..3 = ramp index) — mirrors the HTML grid.
  const pattern = [
    0, 1, 0, 3, 3, 0, 1, 4, 3, 0,
    1, 3, 4, 0, 3, 3, 0, 1, 4, 3,
    3, 0, 1, 4, 3, 0, 3, 0, 1, 3,
  ];

  const colorFor = (v: number): string => (v === 0 ? empty : ramp[Math.min(v, ramp.length)] ?? empty);

  return (
    <View style={{ alignItems: 'center', gap: 18 }}>
      <Svg width={gridW} height={rows * cell + (rows - 1) * cellGap + startY}>
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((__, c) => {
            const idx = r * cols + c;
            const v = pattern[idx] ?? 0;
            return (
              <Rect
                key={idx}
                x={startX + c * (cell + cellGap)}
                y={startY + r * (cell + cellGap)}
                width={cell}
                height={cell}
                rx={3}
                fill={colorFor(v)}
              />
            );
          }),
        )}
      </Svg>

      {/* Streak chip — flame + count + label */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 9,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.hairline,
          borderRadius: radii.pill,
          paddingVertical: 8,
          paddingLeft: 10,
          paddingRight: 16,
          shadowColor: colors.shadowTint,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.4 : 0.18,
          shadowRadius: 14,
          elevation: 3,
        }}
      >
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: colors.peach,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppText variant="body" style={{ fontSize: 15, lineHeight: 18 }}>
            🔥
          </AppText>
        </View>
        <AppText variant="heading" display weight="semibold" style={{ fontSize: 18, lineHeight: 18 }}>
          28
        </AppText>
        <AppText variant="caption" weight="medium" color={colors.muted}>
          day streak
        </AppText>
      </View>
    </View>
  );
}

function Illustration({ slide, colors }: { slide: Slide; colors: AppColors }) {
  if (slide.key === 'fan') return <FannedWashes colors={colors} />;
  if (slide.key === 'ladder') return <SpacingLadder colors={colors} />;
  return <HeatmapStreak colors={colors} />;
}

/* ------------------------------------------------------------------ */
/* Arrow glyph (inline svg) for the advance button                     */
/* ------------------------------------------------------------------ */

/** A clean right-arrow drawn with svg (arrow shaft + chevron head). */
function AdvanceArrow({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Line
        x1={5}
        y1={12}
        x2={19}
        y2={12}
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <Polyline
        points="13,6 19,12 13,18"
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Animated dots                                                       */
/* ------------------------------------------------------------------ */

function Dots({ count, active, colors }: { count: number; active: number; colors: AppColors }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {Array.from({ length: count }).map((_, i) => {
        const isActive = i === active;
        return (
          <MotiView
            key={i}
            animate={{ width: isActive ? 22 : 7 }}
            transition={motion.springSnappy}
            style={{
              height: 7,
              borderRadius: 99,
              backgroundColor: isActive ? colors.primary : colors.hairline,
            }}
          />
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

/**
 * Onboarding — the 3-slide value carousel a brand-new user sees before welcome.
 *
 * A horizontal paged ScrollView: each slide pairs an inline-SVG illustration
 * (built from the theme card washes) with an editorial serif headline + muted
 * body. The top bar shows the "· X of 3" indicator and a Skip link (hidden on
 * the last slide); the bottom shows three animated dots plus a circular
 * terracotta advance button that becomes a full-width "Get started" pill on the
 * final slide. Dark-aware via useTheme(); matches the HTML "Auth & onboarding"
 * onboarding screens.
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const setOnboardingSeen = useUiStore((s) => s.setOnboardingSeen);

  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [advancePressed, setAdvancePressed] = useState(false);

  const lastIndex = SLIDES.length - 1;
  const isLast = index === lastIndex;

  const finish = useCallback(() => {
    setOnboardingSeen(true);
    router.replace('/(auth)/register');
  }, [router, setOnboardingSeen]);

  const skip = useCallback(() => {
    setOnboardingSeen(true);
    router.replace('/(auth)/login');
  }, [router, setOnboardingSeen]);

  const goToIndex = useCallback(
    (i: number) => {
      scrollRef.current?.scrollTo({ x: i * width, animated: true });
      setIndex(i);
    },
    [width],
  );

  const handleAdvance = useCallback(() => {
    if (isLast) {
      finish();
    } else {
      goToIndex(index + 1);
    }
  }, [isLast, finish, goToIndex, index]);

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / width);
      if (next !== index) setIndex(next);
    },
    [width, index],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* Top bar: "· X of 3" indicator (left) + Skip (right, hidden on last) */}
      <View
        style={{
          paddingTop: insets.top + spacing.sm,
          paddingHorizontal: spacing.xl,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 30,
        }}
      >
        <AppText variant="overline" color={colors.muted}>
          {`${index + 1} of 3`}
        </AppText>
        {isLast ? (
          <View style={{ height: 18 }} />
        ) : (
          <TextLink label="Skip" size="sm" muted onPress={skip} />
        )}
      </View>

      {/* Paged carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide) => (
          <View
            key={slide.key}
            style={{
              width,
              flex: 1,
              paddingHorizontal: spacing.xl + 2,
            }}
          >
            {/* Illustration */}
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: spacing.xl,
              }}
            >
              <Illustration slide={slide} colors={colors} />
            </View>

            {/* Copy block */}
            <View style={{ gap: spacing.md, paddingBottom: spacing.sm }}>
              <AppText variant="overline" color={colors.muted}>
                {slide.eyebrow}
              </AppText>
              <AppText variant="headingLg" display>
                {slide.headline}
              </AppText>
              <AppText variant="body" color={colors.muted}>
                {slide.body}
              </AppText>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom controls: dots + advance / Get started */}
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
          paddingTop: spacing.lg,
        }}
      >
        {isLast ? (
          <View style={{ gap: spacing.lg, alignItems: 'center' }}>
            <Dots count={SLIDES.length} active={index} colors={colors} />
            <PillButton label="Get started" variant="primary" size="lg" fullWidth onPress={finish} />
          </View>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Dots count={SLIDES.length} active={index} colors={colors} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next"
              onPress={handleAdvance}
              onPressIn={() => setAdvancePressed(true)}
              onPressOut={() => setAdvancePressed(false)}
              style={[
                {
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.45,
                  shadowRadius: 18,
                  elevation: 4,
                },
                advancePressed && { backgroundColor: colors.primaryPressed },
              ]}
            >
              <AdvanceArrow color={colors.onPrimary} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
