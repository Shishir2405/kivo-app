/**
 * Small presentational building blocks shared across the Settings screen.
 *
 * These compose the Aaply neumorphic kit (SoftCard / Neumorph / Icon / AppText)
 * into the repeating shapes the Settings screen needs: a section header, a
 * grouped card, a labelled toggle row, and a generic control row. ZERO emoji —
 * every glyph is a vector Icon.
 */
import React from 'react';
import { View, type ColorValue } from 'react-native';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { SoftToggle } from '@/components/ui/SoftToggle';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors, radii } from '@/theme/tokens';

export type Accent = 'highlighter' | 'signal' | 'peach' | 'annotation' | 'success';

export const ACCENT_HEX: Record<Accent, ColorValue> = {
  highlighter: colors.highlighter,
  signal: colors.signal,
  peach: colors.peach,
  annotation: colors.annotation,
  success: colors.success,
};

/* ------------------------------------------------------------------ */
/* Section header — uppercase eyebrow with an accent glyph + hairline   */
/* ------------------------------------------------------------------ */

export function SectionHeader({
  icon,
  title,
  accent = 'highlighter',
  index = 0,
}: {
  icon: IconName;
  title: string;
  accent?: Accent;
  index?: number;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 320, delay: 60 + index * 40 }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 14 }}
    >
      <Icon name={icon} size={15} color={accent} strokeWidth={2.4} />
      <AppText
        variant="caption"
        weight="bold"
        color={colors.textMuted}
        style={{ textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 12 }}
      >
        {title}
      </AppText>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.hairline }} />
    </MotiView>
  );
}

/* ------------------------------------------------------------------ */
/* Section card — a grouping SoftCard with a consistent inner rhythm    */
/* ------------------------------------------------------------------ */

export function SectionCard({
  children,
  index = 0,
  padding = 6,
}: {
  children: React.ReactNode;
  index?: number;
  padding?: number;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 360, delay: 90 + index * 40 }}
      style={{ marginBottom: 26 }}
    >
      <SoftCard radius={radii.card} padding={padding}>
        {children}
      </SoftCard>
    </MotiView>
  );
}

/** A thin hairline divider between rows inside a SectionCard. */
export function RowDivider() {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: colors.hairline,
        marginLeft: 60,
        marginRight: 14,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Leading glyph chip — inset neumorphic well tinted by accent          */
/* ------------------------------------------------------------------ */

export function GlyphChip({ icon, accent }: { icon: IconName; accent: Accent }) {
  return (
    <Neumorph variant="inset" radius={12} intensity="sm" padding={9} surface={colors.canvas}>
      <Icon name={icon} size={18} color={accent} strokeWidth={2.2} />
    </Neumorph>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle row — title + optional subtitle on the left, SoftToggle right */
/* ------------------------------------------------------------------ */

export function ToggleRow({
  icon,
  accent,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: IconName;
  accent: Accent;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
      }}
    >
      <GlyphChip icon={icon} accent={accent} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="body" weight="semibold" style={{ fontSize: 15 }} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 12 }} numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <SoftToggle value={value} onValueChange={onValueChange} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Control row — a glyph + label on the left, an arbitrary control right */
/* ------------------------------------------------------------------ */

export function ControlRow({
  icon,
  accent,
  title,
  subtitle,
  children,
  align = 'center',
}: {
  icon: IconName;
  accent: Accent;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** 'center' = inline control to the right; 'block' = control stacked below. */
  align?: 'center' | 'block';
}) {
  if (align === 'block') {
    return (
      <View style={{ paddingVertical: 14, paddingHorizontal: 14, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <GlyphChip icon={icon} accent={accent} />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="body" weight="semibold" style={{ fontSize: 15 }} numberOfLines={1}>
              {title}
            </AppText>
            {subtitle ? (
              <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 12 }} numberOfLines={2}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
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
        gap: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
      }}
    >
      <GlyphChip icon={icon} accent={accent} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="body" weight="semibold" style={{ fontSize: 15 }} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 12 }} numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {children}
    </View>
  );
}
