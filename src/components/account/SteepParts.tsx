/**
 * Shared Steep building blocks for the account screens (profile / settings /
 * analytics / achievements).
 *
 * Editorial, calm, premium: flat white/fog surfaces, a 1px Dove hairline + the
 * ONE subtle shadow, small compact type, serif titles + Inter body, few small
 * thin icons, color as punctuation (Rust + the two washes only). No
 * neumorphism, no saturated UI color, no oversized type.
 */
import React from 'react';
import { ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/Typography';
import { Card } from '@/components/ui/SoftCard';
import { TextLink } from '@/components/ui/PillButton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors, spacing } from '@/theme/tokens';

/* ------------------------------------------------------------------ */
/* Eyebrow — a small uppercase tertiary label above a serif title      */
/* ------------------------------------------------------------------ */

export function Eyebrow({ label }: { label: string }) {
  return (
    <AppText
      variant="caption"
      weight="medium"
      color={colors.graphite}
      style={{ textTransform: 'uppercase', letterSpacing: 1.4, fontSize: 11 }}
    >
      {label}
    </AppText>
  );
}

/* ------------------------------------------------------------------ */
/* SectionLabel — a quiet section divider (tiny serif + hairline rule)  */
/* ------------------------------------------------------------------ */

export function SectionLabel({
  title,
  right,
  style,
}: {
  title: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
        style,
      ]}
    >
      <AppText variant="subheading" display weight="medium">
        {title}
      </AppText>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.dove }} />
      {right ?? null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* IconChip — a tiny circular hairline well holding a thin mono glyph    */
/* ------------------------------------------------------------------ */

export function IconChip({
  icon,
  size = 34,
  color = 'graphite',
  surface = colors.fog,
}: {
  icon: IconName;
  size?: number;
  color?: string;
  surface?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 9999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: surface,
        borderWidth: 1,
        borderColor: colors.dove,
      }}
    >
      <Icon name={icon} size={Math.round(size * 0.46)} color={color} weight="light" />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* DataStat — a small figure-over-label stat (the data does the talking) */
/* ------------------------------------------------------------------ */

export function DataStat({
  value,
  label,
  unit,
  align = 'flex-start',
  valueColor = colors.ink,
}: {
  value: string;
  label: string;
  unit?: string;
  align?: 'flex-start' | 'center';
  valueColor?: string;
}) {
  return (
    <View style={{ alignItems: align, gap: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
        <AppText variant="heading" display weight="medium" color={valueColor} numberOfLines={1}>
          {value}
        </AppText>
        {unit ? (
          <AppText variant="caption" weight="medium" color={colors.graphite}>
            {unit}
          </AppText>
        ) : null}
      </View>
      <AppText variant="caption" color={colors.graphite} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* StateBlock — loading / error / empty inside a quiet fog well         */
/* ------------------------------------------------------------------ */

export type StateBlockProps = {
  kind: 'loading' | 'error' | 'empty';
  /** Headline (error/empty). */
  title?: string;
  /** Secondary line (error/empty). */
  message?: string;
  /** Small glyph for empty/error. */
  icon?: IconName;
  /** Retry handler — renders a TextLink when provided (error). */
  onRetry?: () => void;
  retryLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * The single source of loading / error / empty UI for the account screens.
 * Renders inside a flat Fog well so a failed or pending request reads as a calm
 * placeholder, never a crash.
 */
export function StateBlock({
  kind,
  title,
  message,
  icon,
  onRetry,
  retryLabel = 'Try again',
  style,
}: StateBlockProps) {
  return (
    <Card variant="inset" padding={spacing.xl} style={style}>
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        {kind === 'loading' ? (
          <ActivityIndicator color={colors.graphite} />
        ) : (
          <IconChip icon={icon ?? (kind === 'error' ? 'alert' : 'sparkles')} size={36} />
        )}
        {title ? (
          <AppText variant="subheading" weight="medium" color={colors.ash} style={{ marginTop: 2 }}>
            {title}
          </AppText>
        ) : null}
        {message ? (
          <AppText
            variant="caption"
            color={colors.graphite}
            style={{ textAlign: 'center', maxWidth: 260 }}
          >
            {message}
          </AppText>
        ) : null}
        {kind === 'error' && onRetry ? (
          <View style={{ marginTop: spacing.xs }}>
            <TextLink label={retryLabel} onPress={onRetry} />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

export default StateBlock;
