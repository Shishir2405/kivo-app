/**
 * Settings building blocks (Steep).
 *
 * Flat white grouping cards (1px Dove hairline + the one subtle shadow), small
 * compact rows, few small thin monochrome glyphs, serif section labels. No
 * neumorphism, no saturated color, no oversized type. Export names are kept so
 * the Settings screen keeps compiling.
 */
import React from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/Typography';
import { Card, type CardTone } from '@/components/ui/SoftCard';
import { SoftToggle } from '@/components/ui/SoftToggle';
import { Icon, type IconName } from '@/components/ui/Icon';
import { radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme';

/** Legacy accent union — kept for the screen's row config; visually monochrome. */
export type Accent = 'highlighter' | 'signal' | 'peach' | 'annotation' | 'success';

/**
 * Legacy accent → icon ColorToken map. All settings glyphs are the muted ink
 * tone in Kivo (color is reserved for data), and resolve dark-aware via Icon.
 */
export const ACCENT_TOKEN: Record<Accent, 'muted'> = {
  highlighter: 'muted',
  signal: 'muted',
  peach: 'muted',
  annotation: 'muted',
  success: 'muted',
};

/* ------------------------------------------------------------------ */
/* Section header — small serif label + a hairline rule                 */
/* ------------------------------------------------------------------ */

export function SectionHeader({
  title,
}: {
  icon?: IconName;
  title: string;
  accent?: Accent;
  index?: number;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
      }}
    >
      <AppText variant="subheading" display weight="medium">
        {title}
      </AppText>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.hairline }} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Section card — a flat white grouping card                            */
/* ------------------------------------------------------------------ */

export function SectionCard({
  children,
  padding = spacing.xs,
  tone = 'default',
}: {
  children: React.ReactNode;
  index?: number;
  padding?: number;
  /** Optional Steep wash so data sections aren't all-white-dead. */
  tone?: CardTone;
}) {
  return (
    <Card radius={radii.card} padding={padding} tone={tone} style={{ marginBottom: spacing.xl }}>
      {children}
    </Card>
  );
}

/** A thin hairline divider between rows inside a SectionCard. */
export function RowDivider() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: colors.hairline,
        marginLeft: spacing.md + 34,
        marginRight: spacing.md,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Leading glyph chip — a small Fog well with a thin mono glyph          */
/* ------------------------------------------------------------------ */

export function GlyphChip({ icon }: { icon: IconName; accent?: Accent }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 9999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surfaceAlt,
        borderWidth: 1,
        borderColor: colors.hairline,
      }}
    >
      <Icon name={icon} size={16} color="muted" weight="light" />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle row                                                           */
/* ------------------------------------------------------------------ */

export function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: IconName;
  accent?: Accent;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
      }}
    >
      <GlyphChip icon={icon} />
      <View style={{ flex: 1, gap: 1 }}>
        <AppText variant="subheading" weight="regular" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.muted} numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <SoftToggle value={value} onValueChange={onValueChange} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Control row — glyph + label + an arbitrary control                   */
/* ------------------------------------------------------------------ */

export function ControlRow({
  icon,
  title,
  subtitle,
  children,
  align = 'center',
}: {
  icon: IconName;
  accent?: Accent;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  align?: 'center' | 'block';
}) {
  const { colors } = useTheme();
  const Label = (
    <View style={{ flex: 1, gap: 1 }}>
      <AppText variant="subheading" weight="regular" numberOfLines={1}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="caption" color={colors.muted} numberOfLines={2}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );

  if (align === 'block') {
    return (
      <View style={{ paddingVertical: spacing.md, paddingHorizontal: spacing.md, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <GlyphChip icon={icon} />
          {Label}
        </View>
        {children}
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
      }}
    >
      <GlyphChip icon={icon} />
      {Label}
      {children}
    </View>
  );
}
