import React from 'react';
import {
  ActivityIndicator,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { AppText } from '@/components/ui/Typography';
import { Card } from '@/components/ui/SoftCard';
import { TextLink } from '@/components/ui/PillButton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors, spacing } from '@/theme/tokens';

/* ================================================================== */
/* Section header                                                      */
/* ================================================================== */

export type SectionHeaderProps = {
  /** The section title (Inter 500 — quiet, not the screen serif title). */
  title: string;
  /** Optional small uppercase eyebrow above the title. */
  eyebrow?: string;
  /** Optional small thin leading icon. */
  icon?: IconName;
  /** Optional trailing slot — prefer a TextLink (one Ink CTA per screen). */
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * A quiet Steep section header: optional small uppercase eyebrow + a compact
 * Inter-500 title, with an optional trailing TextLink. No icon medallions, no
 * neumorphism — the editorial serif is reserved for the screen title only.
 */
export function SectionHeader({
  title,
  eyebrow,
  icon,
  trailing,
  style,
}: SectionHeaderProps) {
  return (
    <View
      className="flex-row items-end justify-between"
      style={[{ marginBottom: spacing.md }, style]}
    >
      <View style={{ flex: 1 }}>
        {eyebrow ? (
          <AppText
            variant="caption"
            weight="medium"
            color={colors.graphite}
            style={{ textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}
          >
            {eyebrow}
          </AppText>
        ) : null}
        <View className="flex-row items-center" style={{ gap: 7 }}>
          {icon ? <Icon name={icon} size={16} color="graphite" /> : null}
          <AppText variant="headingSm" weight="medium" color={colors.ink}>
            {title}
          </AppText>
        </View>
      </View>
      {trailing}
    </View>
  );
}

/* ================================================================== */
/* Empty state                                                         */
/* ================================================================== */

export type EmptyStateProps = {
  icon: IconName;
  title: string;
  body: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * A calm Steep empty state — a quiet Fog well, one small thin icon, a short
 * title + a line of muted copy. No medallions, no decoration.
 */
export function EmptyState({ icon, title, body, style }: EmptyStateProps) {
  return (
    <Card variant="inset" padding={20} style={style}>
      <View className="items-center" style={{ gap: 8 }}>
        <Icon name={icon} size={20} color="dove" />
        <AppText variant="subheading" weight="medium" color={colors.ink}>
          {title}
        </AppText>
        <AppText
          variant="caption"
          color={colors.graphite}
          style={{ textAlign: 'center', maxWidth: 240 }}
        >
          {body}
        </AppText>
      </View>
    </Card>
  );
}

/* ================================================================== */
/* Loading state                                                       */
/* ================================================================== */

export type LoadingStateProps = {
  /** Optional muted line under the spinner. */
  label?: string;
  style?: StyleProp<ViewStyle>;
};

/** A small, quiet loading row for a list section. */
export function LoadingState({ label, style }: LoadingStateProps) {
  return (
    <Card variant="inset" padding={20} style={style}>
      <View className="items-center" style={{ gap: 8 }}>
        <ActivityIndicator size="small" color={colors.graphite} />
        {label ? (
          <AppText variant="caption" color={colors.graphite}>
            {label}
          </AppText>
        ) : null}
      </View>
    </Card>
  );
}

/* ================================================================== */
/* Error state                                                         */
/* ================================================================== */

export type ErrorStateProps = {
  /** Human-readable, already-normalised message. */
  message?: string;
  /** Retry handler — rendered as a TextLink (never a second filled button). */
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * A non-alarming error block — muted copy + a "Try again" TextLink. Used when a
 * data hook reports `isError`; tapping retry calls `refetch`.
 */
export function ErrorState({ message, onRetry, style }: ErrorStateProps) {
  return (
    <Card variant="inset" padding={20} style={style}>
      <View className="items-center" style={{ gap: 8 }}>
        <Icon name="alert" size={20} color="rust" />
        <AppText
          variant="caption"
          color={colors.ash}
          style={{ textAlign: 'center', maxWidth: 260 }}
        >
          {message ?? 'Could not load this right now.'}
        </AppText>
        {onRetry ? <TextLink label="Try again" onPress={onRetry} size="sm" /> : null}
      </View>
    </Card>
  );
}

/* ================================================================== */
/* Mini data tile — a wash-backed key figure                           */
/* ================================================================== */

export type StatTileProps = {
  /** The big figure, e.g. "3" or "2/4". */
  value: string;
  /** A short caption under the figure. */
  label: string;
  /** Wash voice — 'warm' (apricot) or 'cool' (sky). */
  tone?: 'warm' | 'cool';
  style?: StyleProp<ViewStyle>;
};

/**
 * A compact data tile on one of the two washes (Apricot / Sky). The figure is
 * the loudest thing; on the warm wash it strokes in Rust (the key-data accent).
 * Used for the tracker's quick-stat row.
 */
export function StatTile({ value, label, tone = 'warm', style }: StatTileProps) {
  const warm = tone === 'warm';
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: warm ? colors.apricot : colors.sky,
          borderRadius: 16,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
        },
        style,
      ]}
    >
      <AppText
        variant="headingLg"
        display
        weight="medium"
        color={warm ? colors.rust : colors.ink}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {value}
      </AppText>
      <AppText
        variant="caption"
        color={warm ? colors.rust : colors.ash}
        style={{ marginTop: 1 }}
      >
        {label}
      </AppText>
    </View>
  );
}

/**
 * Legacy alias — old screen code imported `StatPill`. Maps onto the Steep
 * {@link StatTile}; the legacy `icon`/`accent` props are accepted and ignored.
 */
export type StatPillProps = {
  icon?: IconName;
  value: string;
  label: string;
  accent?: string;
  tone?: 'warm' | 'cool';
  style?: StyleProp<ViewStyle>;
};

export function StatPill({ value, label, tone, style }: StatPillProps) {
  return <StatTile value={value} label={label} tone={tone} style={style} />;
}
