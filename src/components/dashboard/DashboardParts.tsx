/**
 * Presentational building blocks for the Dashboard (Home) screen — Kivo.
 *
 * Warm editorial morning view. Every surface reads the ACTIVE palette via
 * useTheme() so the whole screen flips light <-> dark live. Color is calm
 * punctuation: a peach "Today" goal card, a 2x2 grid of soft-wash glance tiles
 * (sky / mint / lavender / butter) each with a matching deep-accent icon chip,
 * an italic quote card, a quiet "Up next" timeline, and a dark "Continue"
 * banner. Type stays ink/muted; the terracotta primary is the single CTA.
 *
 * Rules honoured here:
 *  - Dark-aware: NO static colors import — colors come from useTheme().
 *  - NO neumorphism / dual shadows / gradients / hardcoded hex.
 *  - NO emoji — every glyph is an `IconName` through `<Icon />`.
 *  - Titles/labels coerced to strings so a stray API object can never render.
 */
import React from 'react';
import {
  View,
  Pressable,
  type StyleProp,
  type ViewStyle,
  type GestureResponderEvent,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { MotiView } from 'moti';

import { Card, type CardTone } from '@/components/ui/SoftCard';
import { AppText } from '@/components/ui/Typography';
import { TextLink } from '@/components/ui/PillButton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Skeleton';
import { radii, spacing, interaction, pressOpacity, motion } from '@/theme/tokens';
import { useTheme } from '@/theme';

/** Always render a string title — never let an object (e.g. an API error) through. */
function asTitle(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

/** Normalise legacy warm/cool to a wash tone for deriving accents locally. */
function washOf(tone: CardTone): 'default' | 'peach' | 'sky' | 'mint' | 'lavender' | 'butter' {
  if (tone === 'warm') return 'peach';
  if (tone === 'cool') return 'sky';
  return tone;
}

/* ------------------------------------------------------------------ */
/* Staggered entrance wrapper — subtle fade + lift per item            */
/* ------------------------------------------------------------------ */

export function Entrance({
  index = 0,
  children,
  style,
}: {
  index?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: motion.duration.transition,
        delay: index * 60,
      }}
      style={style}
    >
      {children}
    </MotiView>
  );
}

/* ------------------------------------------------------------------ */
/* Section header — small serif title + optional TextLink action       */
/* ------------------------------------------------------------------ */

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  style,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        },
        style,
      ]}
    >
      <AppText
        variant="overline"
        weight="semibold"
        color={colors.primaryOnWash}
        style={{ letterSpacing: 1.4 }}
      >
        {asTitle(title)}
      </AppText>
      {actionLabel ? (
        <TextLink label={asTitle(actionLabel)} onPress={onAction} muted size="sm" />
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Streak chip — peach pill: terracotta flame + count                  */
/* ------------------------------------------------------------------ */

export function StreakChip({
  count,
  style,
}: {
  count: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, toneStyle } = useTheme();
  const peach = toneStyle('peach');
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          paddingVertical: 5,
          paddingLeft: 8,
          paddingRight: 11,
          borderRadius: radii.pill,
          backgroundColor: peach.bg,
          borderWidth: 1,
          borderColor: peach.border,
        },
        style,
      ]}
    >
      <Icon name="flame" size={14} color={colors.primary} weight="fill" />
      <AppText variant="caption" weight="bold" color={peach.accent} style={{ fontSize: 13 }}>
        {count}
      </AppText>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Avatar initial — small mint circle with a serif letter              */
/* ------------------------------------------------------------------ */

export function AvatarInitial({ name, size = 36 }: { name: string; size?: number }) {
  const { toneStyle } = useTheme();
  const mint = toneStyle('mint');
  const letter = (name.trim()[0] ?? '?').toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: mint.bg,
        borderWidth: 1,
        borderColor: mint.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppText variant="subheading" display weight="semibold" color={mint.accent}>
        {letter}
      </AppText>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Quote card — italic serif line with a big terracotta quote mark     */
/* ------------------------------------------------------------------ */

export function QuoteCard({ text, author }: { text: string; author?: string }) {
  const { colors } = useTheme();
  return (
    <Card padding={spacing.md} radius={radii.card}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
        <AppText
          display
          italic
          variant="headingLg"
          color={colors.primary}
          style={{ lineHeight: 24, marginTop: 2 }}
        >
          {'“'}
        </AppText>
        <View style={{ flex: 1 }}>
          <AppText display italic variant="body" color={colors.ash} style={{ fontSize: 14.5, lineHeight: 20 }}>
            {asTitle(text)}
          </AppText>
          {author ? (
            <AppText variant="caption" color={colors.muted} style={{ marginTop: 4, fontSize: 11.5 }}>
              — {asTitle(author)}
            </AppText>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Today card — peach wash: a stat row + the daily-goal progress bar   */
/* ------------------------------------------------------------------ */

export function TodayCard({
  dateLabel,
  stats,
  goalPct,
}: {
  dateLabel: string;
  /** Up to three figures shown in the divided row. */
  stats: { value: string | number; label: string }[];
  /** Daily goal completion 0-100. */
  goalPct: number;
}) {
  const { colors, toneStyle } = useTheme();
  const peach = toneStyle('peach');
  const pct = Math.max(0, Math.min(100, Math.round(goalPct)));

  return (
    <Card tone="peach" padding={spacing.lg} radius={radii.cardLg}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        }}
      >
        <AppText variant="headingSm" weight="bold" color={peach.accent}>
          Today
        </AppText>
        <AppText variant="caption" weight="semibold" color={colors.primaryOnWash} style={{ fontSize: 12 }}>
          {asTitle(dateLabel)}
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
        {stats.map((s, i) => (
          <React.Fragment key={`${s.label}-${i}`}>
            {i > 0 ? (
              <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: peach.border }} />
            ) : null}
            <View style={{ alignItems: 'center', flex: 1 }}>
              <AppText display variant="heading" weight="semibold" color={peach.accent} style={{ lineHeight: 24 }}>
                {asTitle(s.value)}
              </AppText>
              <AppText variant="caption" color={colors.primaryOnWash} style={{ fontSize: 10.5, marginTop: 3 }}>
                {asTitle(s.label)}
              </AppText>
            </View>
          </React.Fragment>
        ))}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <AppText variant="caption" weight="semibold" color={colors.primaryOnWash} style={{ fontSize: 11.5 }}>
          Daily goal
        </AppText>
        <AppText variant="caption" weight="bold" color={peach.accent} style={{ fontSize: 11.5 }}>
          {pct}%
        </AppText>
      </View>
      <ProgressBar progress={pct} height={8} color={colors.primary} track={peach.border} />
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Glance tile — washed stat tile with a filled accent icon chip       */
/* (matches the HTML 2x2 quick-stats grid).                            */
/* ------------------------------------------------------------------ */

export function GlanceTile({
  value,
  unit,
  label,
  icon,
  tone = 'sky',
  onPress,
  style,
}: {
  value: string | number;
  unit?: string;
  label: string;
  icon: IconName;
  tone?: CardTone;
  onPress?: (e: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, toneStyle } = useTheme();
  const wash = washOf(tone);
  const ts = toneStyle(wash);

  const inner = (
    <Card tone={tone} padding={spacing.md} radius={radii.card} style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            backgroundColor: ts.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={14} color={ts.bg} weight="bold" />
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: spacing.sm }}>
        <AppText display variant="heading" weight="semibold" color={ts.accent} style={{ lineHeight: 24 }}>
          {asTitle(value)}
        </AppText>
        {unit ? (
          <AppText variant="caption" color={ts.accent} style={{ fontSize: 11 }}>
            {asTitle(unit)}
          </AppText>
        ) : null}
      </View>
      <AppText variant="caption" color={colors.muted} style={{ marginTop: 2, fontSize: 11 }} numberOfLines={1}>
        {asTitle(label)}
      </AppText>
    </Card>
  );

  if (!onPress) return <View style={[{ flex: 1 }, style]}>{inner}</View>;

  return (
    <Pressable onPress={onPress} style={[{ flex: 1 }, style]}>
      {({ pressed }) => (
        <View
          style={
            pressed
              ? { opacity: interaction.pressOpacitySolid, transform: [{ scale: interaction.pressScale }] }
              : null
          }
        >
          {inner}
        </View>
      )}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Quick-add chip — white pill with a terracotta + and a label         */
/* ------------------------------------------------------------------ */

export function QuickAddChip({
  label,
  onPress,
}: {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 8,
            paddingHorizontal: 13,
            borderRadius: radii.pill,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.hairline,
            opacity: pressOpacity({ pressed }),
          }}
        >
          <Icon name="plus" size={14} color={colors.primary} weight="bold" />
          <AppText variant="caption" weight="semibold" color={colors.ash} style={{ fontSize: 12.5 }}>
            {asTitle(label)}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Timeline row — a node on the rail + a white event card              */
/* ------------------------------------------------------------------ */

export function TimelineRow({
  title,
  meta,
  time,
  active = false,
  isLast = false,
  onPress,
}: {
  title: string;
  meta?: string;
  time?: string;
  /** First/next event gets a filled terracotta node. */
  active?: boolean;
  isLast?: boolean;
  onPress?: (e: GestureResponderEvent) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.md }}>
      {/* rail */}
      <View style={{ alignItems: 'center', paddingTop: 4 }}>
        <View
          style={{
            width: 9,
            height: 9,
            borderRadius: 5,
            backgroundColor: active ? colors.primary : 'transparent',
            borderWidth: active ? 0 : 2,
            borderColor: colors.hairline,
          }}
        />
        {!isLast ? (
          <View style={{ width: 1.5, flex: 1, backgroundColor: colors.hairline, marginVertical: 3 }} />
        ) : null}
      </View>
      {/* card */}
      <Pressable onPress={onPress} style={{ flex: 1, paddingBottom: isLast ? 0 : spacing.sm }}>
        {({ pressed }) => (
          <Card padding={spacing.md} radius={radii.input} style={{ opacity: pressOpacity({ pressed }) }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <AppText variant="body" weight="semibold" numberOfLines={1} style={{ flex: 1 }}>
                {asTitle(title)}
              </AppText>
              {time ? (
                <AppText variant="caption" color={colors.muted} style={{ fontSize: 11.5 }}>
                  {asTitle(time)}
                </AppText>
              ) : null}
            </View>
            {meta ? (
              <AppText variant="caption" color={colors.muted} numberOfLines={1} style={{ marginTop: 2, fontSize: 11.5 }}>
                {asTitle(meta)}
              </AppText>
            ) : null}
          </Card>
        )}
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Continue banner — dark surface row: icon chip + label + chevron     */
/* ------------------------------------------------------------------ */

export function ContinueBanner({
  eyebrow,
  title,
  icon = 'rocket',
  onPress,
}: {
  eyebrow: string;
  title: string;
  icon?: IconName;
  onPress?: () => void;
}) {
  const { isDark, colors, shadow } = useTheme();
  // The "ink" banner: near-black in light, the deepest well in dark. The icon
  // chip sits a step lighter than the banner — surfaceAlt reads right in dark,
  // and the primary wash gives a warm chip on the dark ink banner in light.
  const bannerBg = isDark ? colors.surfaceAlt : colors.ink;
  const chipBg = isDark ? colors.surface : colors.primaryPressed;
  const onBanner = colors.inkInverted;

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              backgroundColor: bannerBg,
              borderRadius: radii.card,
              borderWidth: isDark ? 1 : 0,
              borderColor: colors.hairline,
              paddingVertical: 14,
              paddingHorizontal: 15,
              opacity: pressOpacity({ pressed }),
            },
            shadow,
          ]}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              backgroundColor: chipBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={icon} size={17} color={colors.primaryOnWash} weight="regular" />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" color={colors.muted} style={{ fontSize: 11 }}>
              {asTitle(eyebrow)}
            </AppText>
            <AppText variant="body" weight="semibold" color={onBanner} numberOfLines={1} style={{ marginTop: 1 }}>
              {asTitle(title)}
            </AppText>
          </View>
          <Icon name="chevron-right" size={18} color={colors.primary} weight="bold" />
        </View>
      )}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Goal ring — thin terracotta arc on a wash track                     */
/* ------------------------------------------------------------------ */

export function GoalRing({
  progress,
  size = 64,
  stroke = 6,
  color,
  track,
  children,
}: {
  /** 0-100. */
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const arc = color ?? colors.primary;
  const bg = track ?? colors.hairline;
  const pct = Math.max(0, Math.min(100, progress));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={bg} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={arc}
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
/* Progress bar — thin fill on a track                                 */
/* ------------------------------------------------------------------ */

export function ProgressBar({
  progress,
  height = 4,
  color,
  track,
  style,
}: {
  /** 0-100. */
  progress: number;
  height?: number;
  color?: string;
  track?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const fill = color ?? colors.ink;
  const bg = track ?? colors.surfaceAlt;
  const pct = Math.max(0, Math.min(100, progress));
  return (
    <View style={[{ height, borderRadius: height, backgroundColor: bg, overflow: 'hidden' }, style]}>
      <View style={{ height: '100%', width: `${pct}%`, borderRadius: height, backgroundColor: fill }} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Continue row — title + thin progress bar + percent                  */
/* ------------------------------------------------------------------ */

export function ContinueRow({
  title,
  progress,
  icon,
  onPress,
  showDivider = true,
}: {
  title: string;
  /** 0-100. */
  progress: number;
  icon?: IconName;
  onPress?: () => void;
  showDivider?: boolean;
}) {
  const { colors } = useTheme();
  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View
          style={{
            paddingVertical: 10,
            borderBottomWidth: showDivider ? 1 : 0,
            borderBottomColor: colors.hairline,
            opacity: pressOpacity({ pressed }),
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            {icon ? <Icon name={icon} size={14} color={colors.muted} weight="light" /> : null}
            <AppText variant="body" weight="medium" numberOfLines={1} style={{ flex: 1 }}>
              {asTitle(title)}
            </AppText>
            <AppText variant="caption" color={colors.muted} style={{ fontSize: 11 }}>
              {pct}%
            </AppText>
          </View>
          <ProgressBar progress={pct} color={colors.primary} style={{ marginTop: 7 }} />
        </View>
      )}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state — quiet, icon-led                                       */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon = 'check-circle',
  title,
  subtitle,
  iconColor,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  iconColor?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.xl, gap: 6 }}>
      <Icon name={icon} size={20} color={iconColor ?? colors.muted} weight="light" />
      <AppText variant="body" weight="medium" style={{ marginTop: 2 }}>
        {asTitle(title)}
      </AppText>
      {subtitle ? (
        <AppText variant="caption" color={colors.muted} style={{ textAlign: 'center' }}>
          {asTitle(subtitle)}
        </AppText>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Error state — calm, with a retry TextLink                           */
/* ------------------------------------------------------------------ */

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { colors } = useTheme();
  return (
    <Card variant="inset" padding={spacing.xl}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Icon name="alert" size={20} color={colors.muted} weight="light" />
        <AppText variant="body" weight="medium" style={{ marginTop: 2 }}>
          Couldn&rsquo;t load this
        </AppText>
        <AppText variant="caption" color={colors.muted} style={{ textAlign: 'center' }}>
          {asTitle(message, 'Something went wrong.')}
        </AppText>
        {onRetry ? (
          <TextLink label="Try again" onPress={onRetry} size="sm" style={{ marginTop: 4 }} />
        ) : null}
      </View>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Loading skeleton — mirrors the real layout, all shimmer blocks      */
/* ------------------------------------------------------------------ */

export function DashboardSkeleton() {
  return (
    <View style={{ gap: spacing.xl }}>
      {/* quote */}
      <Card padding={spacing.md} radius={radii.card}>
        <Skeleton width="90%" height={14} radius={radii.sm} />
        <Skeleton width="60%" height={14} radius={radii.sm} style={{ marginTop: 8 }} />
      </Card>

      {/* today card */}
      <Card tone="peach" padding={spacing.lg} radius={radii.cardLg}>
        <Skeleton width="35%" height={16} radius={radii.sm} />
        <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <Skeleton width={32} height={24} radius={radii.sm} />
              <Skeleton width="70%" height={10} radius={radii.sm} />
            </View>
          ))}
        </View>
        <Skeleton width="100%" height={8} radius={radii.pill} style={{ marginTop: spacing.md }} />
      </Card>

      {/* glance grid */}
      <View style={{ gap: spacing.md }}>
        {[0, 1].map((row) => (
          <View key={row} style={{ flexDirection: 'row', gap: spacing.md }}>
            {[0, 1].map((col) => (
              <Card key={col} padding={spacing.md} style={{ flex: 1 }}>
                <Skeleton width={26} height={26} radius={8} />
                <Skeleton width="50%" height={20} radius={radii.sm} style={{ marginTop: spacing.sm }} />
                <Skeleton width="80%" height={10} radius={radii.sm} style={{ marginTop: 7 }} />
              </Card>
            ))}
          </View>
        ))}
      </View>

      {/* continue banner */}
      <Skeleton width="100%" height={66} radius={radii.card} />
    </View>
  );
}
