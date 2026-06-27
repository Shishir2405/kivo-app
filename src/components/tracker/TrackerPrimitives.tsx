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
import { spacing, radii, type CardTone } from '@/theme/tokens';
import { useTheme } from '@/theme';

/** Accepted StatTile tones — the wash palette plus legacy warm/cool aliases. */
export type StatTileTone = CardTone | 'warm' | 'cool';

/** Normalise a StatTile tone (incl. legacy warm/cool) to a wash CardTone. */
function resolveStatTone(tone: StatTileTone): CardTone {
  if (tone === 'warm') return 'peach';
  if (tone === 'cool') return 'sky';
  return tone;
}

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
  const { colors } = useTheme();
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
  /**
   * Optional wash voice for the icon — a colored phosphor glyph sitting on a
   * matching wash chip warms up the empty state without leaving the quiet Fog
   * well. Omit for the plain Dove icon.
   */
  tone?: CardTone;
  style?: StyleProp<ViewStyle>;
};

/**
 * A calm Steep empty state — a quiet Fog well, one small thin icon, a short
 * title + a line of muted copy. Pass a `tone` to give the icon a colored wash
 * chip so the empty state feels lively (the well itself stays Fog).
 */
export function EmptyState({ icon, title, body, tone, style }: EmptyStateProps) {
  const { colors, toneStyle } = useTheme();
  const ts = tone ? toneStyle(tone) : null;
  return (
    <Card variant="inset" padding={20} style={style}>
      <View className="items-center" style={{ gap: 8 }}>
        {ts ? (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: radii.sm,
              backgroundColor: ts.bg,
              borderWidth: 1,
              borderColor: ts.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={icon} size={20} color={ts.accent} />
          </View>
        ) : (
          <Icon name={icon} size={20} color="dove" />
        )}
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
  const { colors } = useTheme();
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
  const { colors } = useTheme();
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
  /**
   * Wash voice — any of the soft washes ('peach' | 'sky' | 'mint' | 'lavender'
   * | 'butter'). The figure + label stroke in that wash's deeper accent so the
   * tile reads as a colored key-stat. Legacy 'warm'→peach, 'cool'→sky.
   */
  tone?: StatTileTone;
  /** Optional small phosphor glyph above the figure, in the tone accent. */
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
};

/**
 * A compact data tile on one of the soft washes. The figure is the loudest
 * thing and strokes in the wash's deeper accent (the key-data color); the
 * matching hairline pairs with the wash. Used for the tracker's quick-stat row.
 */
export function StatTile({ value, label, tone = 'peach', icon, style }: StatTileProps) {
  const { toneStyle } = useTheme();
  const ts = toneStyle(resolveStatTone(tone));
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: ts.bg,
          borderRadius: radii.card,
          borderWidth: 1,
          borderColor: ts.border,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
        },
        style,
      ]}
    >
      {icon ? (
        <Icon name={icon} size={16} color={ts.accent} weight="fill" />
      ) : null}
      <AppText
        variant="headingLg"
        display
        weight="medium"
        color={ts.accent}
        style={{ fontVariant: ['tabular-nums'], marginTop: icon ? 4 : 0 }}
      >
        {value}
      </AppText>
      <AppText
        variant="caption"
        color={ts.accent}
        style={{ marginTop: 1 }}
      >
        {label}
      </AppText>
    </View>
  );
}

/**
 * Legacy alias — old screen code imported `StatPill`. Maps onto the Steep
 * {@link StatTile}; the legacy `accent` prop is accepted and ignored.
 */
export type StatPillProps = {
  icon?: IconName;
  value: string;
  label: string;
  accent?: string;
  tone?: StatTileTone;
  style?: StyleProp<ViewStyle>;
};

export function StatPill({ value, label, tone, icon, style }: StatPillProps) {
  return <StatTile value={value} label={label} tone={tone} icon={icon} style={style} />;
}
