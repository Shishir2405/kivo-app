/**
 * Presentational building blocks for the Dashboard screen.
 *
 * Dashboard-namespaced (not the shared UI kit) so they can stay opinionated to
 * this screen's layout while leaning entirely on the Aaply neumorphic kit +
 * tokens. NOTHING here invents new visual language — every part composes
 * SoftCard / Neumorph / AppText / Tag / Icon with the palette in tokens.ts.
 *
 * Rules honoured here:
 *  - ZERO emoji. Every glyph is an `IconName` rendered through `<Icon />`.
 *  - Neumorphism everywhere: raised idle surfaces, inset wells for "pressed /
 *    active" states, on the graphite-mist #f2f2f2 canvas.
 *  - Tasteful motion via moti springs on press.
 */
import React, { useState } from 'react';
import {
  View,
  Pressable,
  type StyleProp,
  type ViewStyle,
  type GestureResponderEvent,
} from 'react-native';
import { MotiView } from 'moti';
import Svg, { Circle } from 'react-native-svg';

import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { AppText } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors } from '@/theme/tokens';

/* ------------------------------------------------------------------ */
/* Accent token resolution                                             */
/* ------------------------------------------------------------------ */

export type Accent =
  | 'highlighter'
  | 'signal'
  | 'peach'
  | 'annotation'
  | 'success';

/** Solid accent color for a token name. */
export function accentColor(a: Accent): string {
  return colors[a];
}

/** Soft tinted fill used behind accent icon wells. */
export function accentTint(a: Accent): string {
  switch (a) {
    case 'highlighter':
      return '#f6f5a8';
    case 'signal':
      return '#e1e8ff';
    case 'peach':
      return '#ffe6dd';
    case 'annotation':
      return '#ffe2e2';
    case 'success':
      return '#dff5e8';
  }
}

/** Readable ink color for an icon sitting on its accent tint. */
export function accentInk(a: Accent): string {
  switch (a) {
    case 'highlighter':
      return '#8a8900';
    case 'signal':
      return colors.signal;
    case 'peach':
      return '#d8602f';
    case 'annotation':
      return colors.annotation;
    case 'success':
      return '#2c9d5f';
  }
}

/* ------------------------------------------------------------------ */
/* Chevron (forward affordance)                                        */
/* ------------------------------------------------------------------ */

export function Chevron({
  size = 18,
  color = colors.textMuted,
}: {
  size?: number;
  color?: string;
}) {
  return <Icon name="chevron-right" size={size} color={color} strokeWidth={2.25} />;
}

/* ------------------------------------------------------------------ */
/* Rounded-square icon well (the recurring accent tile)                */
/* ------------------------------------------------------------------ */

export function IconWell({
  icon,
  accent = 'highlighter',
  size = 36,
  radius = 12,
  iconSize,
}: {
  icon: IconName;
  accent?: Accent;
  size?: number;
  radius?: number;
  iconSize?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: accentTint(accent),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon
        name={icon}
        size={iconSize ?? Math.round(size * 0.5)}
        color={accentInk(accent)}
        strokeWidth={2.25}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Section header (icon + title + optional action)                     */
/* ------------------------------------------------------------------ */

export function SectionHeader({
  title,
  icon,
  accent = 'highlighter',
  actionLabel,
  onAction,
  style,
}: {
  title: string;
  icon?: IconName;
  accent?: Accent;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      className="flex-row items-center justify-between"
      style={[{ marginBottom: 14 }, style]}
    >
      <View className="flex-row items-center" style={{ gap: 10 }}>
        {icon ? <IconWell icon={icon} accent={accent} size={30} radius={10} /> : null}
        <AppText variant="headingSm" weight="bold">
          {title}
        </AppText>
      </View>
      {actionLabel ? (
        <Pressable
          onPress={onAction}
          hitSlop={8}
          className="flex-row items-center"
          style={{ gap: 2 }}
        >
          <AppText variant="caption" weight="semibold" color={colors.textMuted}>
            {actionLabel}
          </AppText>
          <Chevron size={15} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Streak chip (Icon-based replacement for shared StreakBadge)         */
/* ------------------------------------------------------------------ */

export function StreakChip({
  count,
  size = 'md',
  flat = false,
  style,
}: {
  count: number;
  size?: 'sm' | 'md';
  flat?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const py = size === 'sm' ? 6 : 8;
  const px = size === 'sm' ? 11 : 14;
  const num = size === 'sm' ? 14 : 19;
  const glyph = size === 'sm' ? 14 : 17;

  const inner = (
    <View
      className="flex-row items-center"
      style={{ paddingVertical: py, paddingHorizontal: px, gap: 7 }}
    >
      <Icon name="flame" size={glyph} color={colors.peach} fill={colors.peach} strokeWidth={2} />
      <View className="flex-row items-baseline" style={{ gap: 4 }}>
        <AppText
          variant="subheading"
          display
          weight="bold"
          style={{ fontSize: num, lineHeight: num + 2 }}
        >
          {count}
        </AppText>
        <AppText
          variant="caption"
          weight="medium"
          color={colors.textMuted}
          style={{ fontSize: size === 'sm' ? 10 : 11 }}
        >
          day streak
        </AppText>
      </View>
    </View>
  );

  if (flat) {
    return (
      <View
        style={[
          { alignSelf: 'flex-start', borderRadius: 9999, backgroundColor: colors.highlighter },
          style,
        ]}
      >
        {inner}
      </View>
    );
  }

  return (
    <Neumorph variant="raised" radius={9999} intensity="sm" style={style}>
      {inner}
    </Neumorph>
  );
}

/* ------------------------------------------------------------------ */
/* Linear progress bar (inset well + accent fill, animated)            */
/* ------------------------------------------------------------------ */

export function ProgressBar({
  progress,
  accent = 'highlighter',
  height = 8,
  style,
}: {
  /** 0–100. */
  progress: number;
  accent?: Accent;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const pct = Math.max(0, Math.min(100, progress));
  return (
    <View
      style={[
        { height, borderRadius: height, backgroundColor: '#e4e4e4', overflow: 'hidden' },
        style,
      ]}
    >
      <MotiView
        from={{ width: '0%' }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'timing', duration: 600, delay: 120 }}
        style={{ height: '100%', borderRadius: height, backgroundColor: accentColor(accent) }}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Circular progress ring (SVG) — for the daily goal                   */
/* ------------------------------------------------------------------ */

export function ProgressRing({
  progress,
  size = 64,
  stroke = 7,
  accent = 'highlighter',
  children,
}: {
  /** 0–100. */
  progress: number;
  size?: number;
  stroke?: number;
  accent?: Accent;
  children?: React.ReactNode;
}) {
  const pct = Math.max(0, Math.min(100, progress));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#e2e2e2" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={accentColor(accent)}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </View>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Quick-stat card (horizontal carousel tile)                          */
/* ------------------------------------------------------------------ */

export function StatCard({
  icon,
  value,
  unit,
  label,
  accent = 'highlighter',
  trend,
  style,
}: {
  icon: IconName;
  value: string;
  unit?: string;
  label: string;
  accent?: Accent;
  /** Optional small trailing trend label, e.g. '+12%'. */
  trend?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SoftCard radius={24} intensity="sm" padding={16} style={style}>
      <View className="flex-row items-center justify-between" style={{ marginBottom: 14 }}>
        <IconWell icon={icon} accent={accent} size={38} radius={13} />
        {trend ? (
          <View className="flex-row items-center" style={{ gap: 2 }}>
            <Icon name="trending-up" size={13} color={accentInk(accent)} strokeWidth={2.5} />
            <AppText variant="caption" weight="semibold" color={accentInk(accent)} style={{ fontSize: 11 }}>
              {trend}
            </AppText>
          </View>
        ) : null}
      </View>
      <View className="flex-row items-baseline" style={{ gap: 3 }}>
        <AppText variant="heading" weight="bold" style={{ fontSize: 26, lineHeight: 30 }}>
          {value}
        </AppText>
        {unit ? (
          <AppText variant="caption" weight="semibold" color={colors.textMuted}>
            {unit}
          </AppText>
        ) : null}
      </View>
      <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 2 }}>
        {label}
      </AppText>
    </SoftCard>
  );
}

/* ------------------------------------------------------------------ */
/* Overview tile (inset metric inside Today's Overview)                */
/* ------------------------------------------------------------------ */

export function OverviewTile({
  icon,
  value,
  label,
  accent = 'highlighter',
  onPress,
  style,
}: {
  icon: IconName;
  value: string;
  label: string;
  accent?: Accent;
  onPress?: (e: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={style}
    >
      <MotiView animate={{ scale: pressed ? 0.97 : 1 }} transition={{ type: 'timing', duration: 120 }}>
        <Neumorph variant="inset" radius={18} intensity="sm" padding={12}>
          <View className="flex-row items-center" style={{ gap: 10 }}>
            <IconWell icon={icon} accent={accent} size={34} radius={11} />
            <View style={{ flex: 1 }}>
              <AppText variant="subheading" weight="bold" style={{ fontSize: 19 }}>
                {value}
              </AppText>
              <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 12 }}>
                {label}
              </AppText>
            </View>
          </View>
        </Neumorph>
      </MotiView>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Quick action (round neumorphic button + caption)                    */
/* ------------------------------------------------------------------ */

export function QuickAction({
  icon,
  label,
  onPress,
  accent = false,
  style,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
  /** Accent the primary action with a highlighter-yellow inset well. */
  accent?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [pressed, setPressed] = useState(false);
  const inset = accent || pressed;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="items-center"
      style={[{ gap: 8 }, style]}
    >
      <MotiView animate={{ scale: pressed ? 0.92 : 1 }} transition={{ type: 'timing', duration: 110 }}>
        <Neumorph
          variant={inset ? 'inset' : 'raised'}
          radius={20}
          intensity="sm"
          surface={accent ? colors.highlighter : colors.canvas}
        >
          <View style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size={23} color="carbon" strokeWidth={2.1} />
          </View>
        </Neumorph>
      </MotiView>
      <AppText
        variant="caption"
        weight="medium"
        color={colors.textMuted}
        numberOfLines={1}
        style={{ fontSize: 11, textAlign: 'center' }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Schedule row (raised icon well + title/meta + trailing)             */
/* ------------------------------------------------------------------ */

export function ScheduleRow({
  icon,
  accent = 'highlighter',
  title,
  meta,
  trailing,
  onPress,
  showDivider = true,
}: {
  icon: IconName;
  accent?: Accent;
  title: string;
  meta: string;
  trailing?: React.ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  showDivider?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable onPress={onPress} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}>
      <MotiView animate={{ opacity: pressed ? 0.6 : 1 }} transition={{ type: 'timing', duration: 100 }}>
        <View
          className="flex-row items-center"
          style={{
            gap: 12,
            paddingVertical: 12,
            borderBottomWidth: showDivider ? 1 : 0,
            borderBottomColor: colors.hairline,
          }}
        >
          <Neumorph variant="raised" radius={13} intensity="sm">
            <View style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={icon} size={19} color={accentInk(accent)} strokeWidth={2.1} />
            </View>
          </Neumorph>
          <View style={{ flex: 1 }}>
            <AppText variant="body" weight="semibold" numberOfLines={1}>
              {title}
            </AppText>
            <AppText
              variant="caption"
              color={colors.textMuted}
              numberOfLines={1}
              style={{ marginTop: 1 }}
            >
              {meta}
            </AppText>
          </View>
          {trailing ?? <Chevron />}
        </View>
      </MotiView>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Weekly focus bars (mini chart)                                      */
/* ------------------------------------------------------------------ */

export function WeeklyBars({
  values,
  labels,
  highlightIndex,
  height = 80,
  barWidth = 22,
}: {
  values: number[];
  labels: string[];
  /** Index to render in highlighter-yellow (e.g. today). */
  highlightIndex?: number;
  height?: number;
  barWidth?: number;
}) {
  const peak = Math.max(1, ...values);
  return (
    <View className="flex-row items-end justify-between" style={{ height: height + 16 }}>
      {values.map((mins, i) => {
        const isHi = i === highlightIndex;
        const h = Math.max(6, Math.round((mins / peak) * height));
        return (
          <View key={i} className="items-center" style={{ flex: 1, gap: 6 }}>
            <View className="justify-end" style={{ height }}>
              <MotiView
                from={{ height: 6 }}
                animate={{ height: h }}
                transition={{ type: 'timing', duration: 520, delay: i * 50 }}
              >
                <Neumorph
                  variant={mins > 0 ? 'raised' : 'inset'}
                  radius={8}
                  intensity="sm"
                  surface={mins <= 0 ? '#ececec' : isHi ? colors.highlighter : colors.canvas}
                >
                  <View style={{ width: barWidth, height: h }} />
                </Neumorph>
              </MotiView>
            </View>
            <AppText
              variant="caption"
              weight={isHi ? 'bold' : 'regular'}
              color={isHi ? colors.carbon : colors.textSubtle}
              style={{ fontSize: 11 }}
            >
              {labels[i]}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Continue-where-you-left-off row                                     */
/* ------------------------------------------------------------------ */

export function ContinueRow({
  icon,
  title,
  progress,
  accent = 'signal',
  onPress,
}: {
  icon: IconName;
  title: string;
  /** 0–100. */
  progress: number;
  accent?: Accent;
  onPress?: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable onPress={onPress} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}>
      <MotiView animate={{ scale: pressed ? 0.98 : 1 }} transition={{ type: 'timing', duration: 110 }}>
        <View className="flex-row items-center" style={{ gap: 12, paddingVertical: 10 }}>
          <Neumorph variant="raised" radius={14} intensity="sm">
            <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={icon} size={20} color={accentInk(accent)} strokeWidth={2.1} />
            </View>
          </Neumorph>
          <View style={{ flex: 1 }}>
            <AppText variant="body" weight="semibold" numberOfLines={1}>
              {title}
            </AppText>
            <View className="flex-row items-center" style={{ gap: 8, marginTop: 6 }}>
              <ProgressBar progress={progress} accent={accent} height={6} style={{ flex: 1 }} />
              <AppText
                variant="caption"
                weight="semibold"
                color={colors.textMuted}
                style={{ fontSize: 11 }}
              >
                {progress}%
              </AppText>
            </View>
          </View>
          <Icon name="arrow-right" size={19} color={colors.textMuted} strokeWidth={2.1} />
        </View>
      </MotiView>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state (icon-led, for all-clear lists)                         */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon,
  title,
  subtitle,
  accent = 'success',
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  accent?: Accent;
}) {
  return (
    <View className="items-center" style={{ paddingVertical: 22, gap: 10 }}>
      <Neumorph variant="raised" radius={22} intensity="sm">
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 22,
            backgroundColor: accentTint(accent),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={26} color={accentInk(accent)} strokeWidth={2.1} />
        </View>
      </Neumorph>
      <AppText variant="body" weight="bold" style={{ marginTop: 2 }}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}
