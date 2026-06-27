/**
 * SteepHeatmap — a quiet contribution grid in the Steep voice.
 *
 * GitHub-style columns (weeks, Sun..Sat top→bottom), horizontally scrollable.
 * Empty days are flat Fog cells; activity ramps through the Apricot wash up to
 * Rust at the peak — one warm chromatic voice, no saturated greens. Pure
 * presentational: feed it the mapped `cells` ({ day, count }).
 */
import React, { useMemo } from 'react';
import { View, ScrollView, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/Typography';
import { useTheme } from '@/theme';

export type SteepHeatmapCell = { day: string; count: number };

export type SteepHeatmapProps = {
  cells: SteepHeatmapCell[];
  /** Trailing days to render. */
  range?: number;
  cellSize?: number;
  gap?: number;
  showLegend?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Empty → Peach wash ramp → Primary (terracotta) at the peak.
 * The active-day ramp is theme-derived so it deepens correctly in dark mode;
 * empty days fall back to the surface-alt well.
 */
function buildRamp(c: { peach: string; primary: string }) {
  return [c.peach, '#E6B08A', '#D98E5C', c.primary] as const;
}

function intensity(count: number, max: number, ramp: readonly string[], empty: string): string {
  if (count <= 0) return empty;
  const ratio = max > 0 ? count / max : 0;
  if (ratio <= 0.25) return ramp[0];
  if (ratio <= 0.5) return ramp[1];
  if (ratio <= 0.75) return ramp[2];
  return ramp[3];
}

export function SteepHeatmap({
  cells,
  range = 365,
  cellSize = 11,
  gap = 3,
  showLegend = true,
  style,
}: SteepHeatmapProps) {
  const { colors } = useTheme();
  const RAMP = useMemo(() => buildRamp(colors), [colors]);
  const legendRamp = useMemo(() => [colors.surfaceAlt, ...RAMP], [colors, RAMP]);
  const { weeks, max } = useMemo(() => {
    const sorted = [...cells].sort((a, b) => a.day.localeCompare(b.day));
    const sliced = sorted.slice(Math.max(0, sorted.length - range));
    const peak = sliced.reduce((m, d) => (d.count > m ? d.count : m), 0);

    const firstDow = sliced.length
      ? new Date(`${sliced[0].day}T00:00:00Z`).getUTCDay()
      : 0;
    const padded: (SteepHeatmapCell | null)[] = [
      ...Array.from({ length: firstDow }, () => null),
      ...sliced,
    ];
    const cols: (SteepHeatmapCell | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) cols.push(padded.slice(i, i + 7));
    return { weeks: cols, max: peak };
  }, [cells, range]);

  return (
    <View style={style}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: 'row', gap }}
      >
        {weeks.map((week, wi) => (
          <View key={wi} style={{ gap }}>
            {Array.from({ length: 7 }, (_, di) => {
              const cell = week[di] ?? null;
              return (
                <View
                  key={di}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    borderRadius: 3,
                    backgroundColor: cell
                      ? intensity(cell.count, max, RAMP, colors.surfaceAlt)
                      : 'transparent',
                    borderWidth: cell ? 1 : 0,
                    borderColor: colors.hairline,
                  }}
                />
              );
            })}
          </View>
        ))}
      </ScrollView>

      {showLegend ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            marginTop: 10,
            alignSelf: 'flex-end',
          }}
        >
          <AppText variant="caption" color={colors.muted} style={{ fontSize: 10 }}>
            Less
          </AppText>
          {legendRamp.map((c, i) => (
            <View
              key={`${c}-${i}`}
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: c,
                borderWidth: 1,
                borderColor: colors.hairline,
              }}
            />
          ))}
          <AppText variant="caption" color={colors.muted} style={{ fontSize: 10 }}>
            More
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

export default SteepHeatmap;
