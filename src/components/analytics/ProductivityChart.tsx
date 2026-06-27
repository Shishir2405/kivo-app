/**
 * RateBars — a flat, dependency-free set of horizontal rate meters (Steep).
 *
 * Each row is a labelled 0–100% meter: a surfaceAlt track with a thin Ink fill
 * and the percentage as a small serif figure. Used by the analytics screen to
 * show the week's completion rates (revisions, tasks, habits) — data and
 * typography do the talking, no chart library, no neumorphism. Theme-aware
 * (light/dark) via useTheme().
 *
 * The legacy export name `ProductivityChart` is kept so any old import still
 * resolves; new code should use `RateBars`.
 */
import React from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/Typography';
import { useTheme } from '@/theme';

export type RateRow = {
  label: string;
  /** 0–100. */
  value: number;
};

export type RateBarsProps = {
  rows: RateRow[];
};

function clampPct(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function RateBars({ rows }: RateBarsProps) {
  const { colors } = useTheme();

  return (
    <View style={{ gap: 14 }}>
      {rows.map((row) => {
        const pct = clampPct(row.value);
        return (
          <View key={row.label} style={{ gap: 6 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                justifyContent: 'space-between',
              }}
            >
              <AppText variant="caption" color={colors.ash}>
                {row.label}
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 1 }}>
                <AppText variant="subheading" display weight="medium">
                  {pct}
                </AppText>
                <AppText variant="caption" color={colors.muted}>
                  %
                </AppText>
              </View>
            </View>
            <View
              style={{
                height: 6,
                borderRadius: 9999,
                backgroundColor: colors.surfaceAlt,
                borderWidth: 1,
                borderColor: colors.hairline,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  borderRadius: 9999,
                  backgroundColor: colors.ink,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** @deprecated Legacy name — prefer `RateBars`. */
export const ProductivityChart = RateBars;

export default RateBars;
