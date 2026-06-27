/**
 * Presentational building blocks for the Dashboard screen (STEEP).
 *
 * Editorial, calm, premium. Everything here is FLAT: pure white / fog surfaces,
 * a 1px Dove hairline + the ONE subtle shadow (via Card), small compact
 * padding, the small mobile type scale. Color is punctuation — chrome is
 * monochrome Ink/Graphite, Rust is the only warm stroke, and the two washes
 * (apricot / sky) are reserved for the single data card on the screen.
 *
 * Rules honoured here:
 *  - NO neumorphism, NO dual shadows, NO puffy surfaces, NO accent tints.
 *  - NO lucide, NO emoji — every glyph is an `IconName` through `<Icon />`,
 *    small (~14-17px), thin outline, Ink/Graphite (Rust only for the accent).
 *  - ONE filled Ink pill per screen; secondary actions are TextLinks.
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

import { Card } from '@/components/ui/SoftCard';
import { AppText } from '@/components/ui/Typography';
import { TextLink } from '@/components/ui/PillButton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors, radii, spacing } from '@/theme/tokens';

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
      <AppText variant="headingSm" display weight="medium">
        {title}
      </AppText>
      {actionLabel ? (
        <TextLink label={actionLabel} onPress={onAction} muted size="sm" />
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Streak chip — quiet pill: rust flame + count                        */
/* ------------------------------------------------------------------ */

export function StreakChip({
  count,
  style,
}: {
  count: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          paddingVertical: 5,
          paddingHorizontal: 10,
          borderRadius: radii.pill,
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.dove,
        },
        style,
      ]}
    >
      <Icon name="flame" size={14} color="rust" weight="fill" />
      <AppText variant="caption" weight="medium" color={colors.ink} style={{ fontSize: 12 }}>
        {count}
      </AppText>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Stat card — compact white figure tile                               */
/* ------------------------------------------------------------------ */

export function StatCard({
  value,
  unit,
  label,
  onPress,
  style,
}: {
  value: string;
  unit?: string;
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const body = (
    <Card padding={spacing.md} style={[{ flex: 1 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
        <AppText variant="heading" display weight="medium" style={{ lineHeight: 26 }}>
          {value}
        </AppText>
        {unit ? (
          <AppText variant="caption" color={colors.graphite} style={{ fontSize: 12 }}>
            {unit}
          </AppText>
        ) : null}
      </View>
      <AppText variant="caption" color={colors.graphite} style={{ marginTop: 4 }} numberOfLines={1}>
        {label}
      </AppText>
    </Card>
  );

  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={[{ flex: 1 }, style]}>
      {({ pressed }) => (
        <Card padding={spacing.md} style={{ opacity: pressed ? 0.7 : 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
            <AppText variant="heading" display weight="medium" style={{ lineHeight: 26 }}>
              {value}
            </AppText>
            {unit ? (
              <AppText variant="caption" color={colors.graphite} style={{ fontSize: 12 }}>
                {unit}
              </AppText>
            ) : null}
          </View>
          <AppText variant="caption" color={colors.graphite} style={{ marginTop: 4 }} numberOfLines={1}>
            {label}
          </AppText>
        </Card>
      )}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Goal ring — thin Rust arc on a Dove track                           */
/* ------------------------------------------------------------------ */

export function GoalRing({
  progress,
  size = 64,
  stroke = 6,
  children,
}: {
  /** 0-100. */
  progress: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const pct = Math.max(0, Math.min(100, progress));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.dove} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.rust}
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
/* Progress bar — thin Ink fill on a Fog/Dove track                    */
/* ------------------------------------------------------------------ */

export function ProgressBar({
  progress,
  height = 4,
  color = colors.ink,
  style,
}: {
  /** 0-100. */
  progress: number;
  height?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const pct = Math.max(0, Math.min(100, progress));
  return (
    <View
      style={[
        { height, borderRadius: height, backgroundColor: colors.fog, overflow: 'hidden' },
        style,
      ]}
    >
      <View style={{ height: '100%', width: `${pct}%`, borderRadius: height, backgroundColor: color }} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* List row — title/meta + chevron, hairline divider                   */
/* ------------------------------------------------------------------ */

export function ListRow({
  icon,
  title,
  meta,
  trailing,
  onPress,
  showDivider = true,
}: {
  icon?: IconName;
  title: string;
  meta?: string;
  trailing?: React.ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  showDivider?: boolean;
}) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            paddingVertical: 11,
            borderBottomWidth: showDivider ? 1 : 0,
            borderBottomColor: colors.fog,
            opacity: pressed ? 0.6 : 1,
          }}
        >
          {icon ? <Icon name={icon} size={16} color="graphite" /> : null}
          <View style={{ flex: 1 }}>
            <AppText variant="body" weight="medium" numberOfLines={1}>
              {title}
            </AppText>
            {meta ? (
              <AppText
                variant="caption"
                color={colors.graphite}
                numberOfLines={1}
                style={{ marginTop: 1 }}
              >
                {meta}
              </AppText>
            ) : null}
          </View>
          {trailing ?? <Icon name="chevron-right" size={16} color="dove" />}
        </View>
      )}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Continue row — title + thin progress bar + percent                  */
/* ------------------------------------------------------------------ */

export function ContinueRow({
  title,
  progress,
  onPress,
  showDivider = true,
}: {
  title: string;
  /** 0-100. */
  progress: number;
  onPress?: () => void;
  showDivider?: boolean;
}) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View
          style={{
            paddingVertical: 11,
            borderBottomWidth: showDivider ? 1 : 0,
            borderBottomColor: colors.fog,
            opacity: pressed ? 0.6 : 1,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
            <AppText variant="body" weight="medium" numberOfLines={1} style={{ flex: 1 }}>
              {title}
            </AppText>
            <AppText variant="caption" color={colors.graphite} style={{ fontSize: 12 }}>
              {progress}%
            </AppText>
          </View>
          <ProgressBar progress={progress} style={{ marginTop: 8 }} />
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
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.xl, gap: 6 }}>
      <Icon name={icon} size={20} color="graphite" />
      <AppText variant="body" weight="medium" style={{ marginTop: 2 }}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="caption" color={colors.graphite} style={{ textAlign: 'center' }}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Error state — calm, with a retry TextLink                           */
/* ------------------------------------------------------------------ */

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Card variant="inset" padding={spacing.xl}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Icon name="alert" size={20} color="graphite" />
        <AppText variant="body" weight="medium" style={{ marginTop: 2 }}>
          Couldn&rsquo;t load this
        </AppText>
        <AppText variant="caption" color={colors.graphite} style={{ textAlign: 'center' }}>
          {message}
        </AppText>
        {onRetry ? (
          <TextLink label="Try again" onPress={onRetry} size="sm" style={{ marginTop: 4 }} />
        ) : null}
      </View>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton primitives — quiet Fog blocks for the loading state        */
/* ------------------------------------------------------------------ */

export function SkeletonBlock({
  width = '100%',
  height = 16,
  radius = radii.sm,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.fog },
        style,
      ]}
    />
  );
}

/** The dashboard loading skeleton — mirrors the real layout, all Fog blocks. */
export function DashboardSkeleton() {
  return (
    <View style={{ gap: spacing.xl }}>
      {/* greeting */}
      <View style={{ gap: 8 }}>
        <SkeletonBlock width="40%" height={11} />
        <SkeletonBlock width="70%" height={26} radius={radii.input} />
      </View>

      {/* overview card */}
      <Card padding={spacing.lg}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
          <SkeletonBlock width={64} height={64} radius={32} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonBlock width="60%" height={14} />
            <SkeletonBlock width="90%" height={11} />
            <SkeletonBlock width="100%" height={4} radius={4} />
          </View>
        </View>
      </Card>

      {/* stat row */}
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        {[0, 1, 2].map((i) => (
          <Card key={i} padding={spacing.md} style={{ flex: 1 }}>
            <SkeletonBlock width="50%" height={22} radius={radii.input} />
            <SkeletonBlock width="80%" height={11} style={{ marginTop: 8 }} />
          </Card>
        ))}
      </View>

      {/* data card */}
      <SkeletonBlock width="100%" height={96} radius={radii.cardLg} />

      {/* list card */}
      <Card padding={spacing.lg}>
        <View style={{ gap: spacing.lg }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <SkeletonBlock width={16} height={16} radius={8} />
              <View style={{ flex: 1, gap: 6 }}>
                <SkeletonBlock width="70%" height={13} />
                <SkeletonBlock width="40%" height={11} />
              </View>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}
