import React, { useMemo } from 'react';
import { View, ScrollView, Text, type StyleProp, type ViewStyle } from 'react-native';
import { fonts } from '@/theme/tokens';
import { useTheme } from '@/theme';
import type { HeatmapDay } from '@/types/models';

export type HeatmapProps = {
  /** Per-day activity counts (any order; sorted internally by day ascending). */
  data: HeatmapDay[];
  /** How many trailing days to render (e.g. 365 = a year, 91 = a quarter). */
  range?: number;
  /** Cell edge length in px. */
  cellSize?: number;
  /** Gap between cells in px. */
  gap?: number;
  /** Show weekday labels column. */
  showWeekdayLabels?: boolean;
  /** Show the less -> more legend. */
  showLegend?: boolean;
  style?: StyleProp<ViewStyle>;
};

const WEEKDAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

/**
 * GitHub-style contribution grid (Kivo). Columns are weeks (Sun..Sat
 * top->bottom), horizontally scrollable. Empty days are a soft well with a 1px
 * hairline; activity ramps from a warm peach wash up to the terracotta accent —
 * matching the dashboard heatmap in the HTML. Pure presentational and fully
 * dark-aware. Feed it `mockHeatmap`.
 */
export function Heatmap({
  data,
  range = 365,
  cellSize = 12,
  gap = 3,
  showWeekdayLabels = true,
  showLegend = true,
  style,
}: HeatmapProps) {
  const { colors, isDark, toneStyle } = useTheme();

  const RAMP = useMemo(() => {
    const peach = toneStyle('peach');
    return [
      isDark ? peach.bg : '#F0DDCC',
      isDark ? peach.border : '#E6B08A',
      colors.primary,
    ] as const;
  }, [colors.primary, isDark, toneStyle]);

  const emptyBg = colors.surfaceAlt;
  const emptyBorder = colors.hairline;

  function intensityColor(count: number, max: number): string {
    if (count <= 0) return emptyBg;
    const ratio = max > 0 ? count / max : 0;
    if (ratio <= 0.34) return RAMP[0];
    if (ratio <= 0.67) return RAMP[1];
    return RAMP[2];
  }

  const { weeks, max } = useMemo(() => {
    const sorted = [...data].sort((a, b) => a.day.localeCompare(b.day));
    const sliced = sorted.slice(Math.max(0, sorted.length - range));
    const peak = sliced.reduce((m, d) => (d.count > m ? d.count : m), 0);

    // Pad the front so the first column starts on a Sunday.
    const firstDow = sliced.length ? new Date(`${sliced[0].day}T00:00:00Z`).getUTCDay() : 0;
    const cells: (HeatmapDay | null)[] = [
      ...Array.from({ length: firstDow }, () => null),
      ...sliced,
    ];

    const cols: (HeatmapDay | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      cols.push(cells.slice(i, i + 7));
    }
    return { weeks: cols, max: peak };
  }, [data, range]);

  const rowOffset = cellSize + gap;

  return (
    <View style={style}>
      <View className="flex-row">
        {showWeekdayLabels ? (
          <View style={{ marginRight: 6, justifyContent: 'flex-start' }}>
            {WEEKDAYS.map((label, i) => (
              <View key={i} style={{ height: rowOffset, justifyContent: 'center' }}>
                <Text style={{ fontFamily: fonts.sans, fontSize: 9, color: colors.muted, width: 22 }}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexDirection: 'row', gap }}
        >
          {weeks.map((week, wi) => (
            <View key={wi} style={{ gap }}>
              {Array.from({ length: 7 }, (_, di) => {
                const cell = week[di] ?? null;
                const filled = cell && cell.count > 0;
                const bg = cell ? intensityColor(cell.count, max) : emptyBg;
                const ratio = filled && max > 0 ? cell!.count / max : 0;
                const hairlineCell = !filled || ratio <= 0.34;
                return (
                  <View
                    key={di}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: 3,
                      backgroundColor: bg,
                      borderWidth: hairlineCell ? 1 : 0,
                      borderColor: filled ? RAMP[1] : emptyBorder,
                    }}
                  />
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>

      {showLegend ? (
        <View
          className="flex-row items-center"
          style={{ marginTop: 10, gap: 5, alignSelf: 'flex-end' }}
        >
          <Text style={{ fontFamily: fonts.sans, fontSize: 10, color: colors.muted }}>Less</Text>
          {[emptyBg, RAMP[0], RAMP[1], RAMP[2]].map((c, i) => (
            <View
              key={`${c}-${i}`}
              style={{
                width: 11,
                height: 11,
                borderRadius: 3,
                backgroundColor: c,
                borderWidth: i <= 1 ? 1 : 0,
                borderColor: i === 0 ? emptyBorder : RAMP[1],
              }}
            />
          ))}
          <Text style={{ fontFamily: fonts.sans, fontSize: 10, color: colors.muted }}>More</Text>
        </View>
      ) : null}
    </View>
  );
}

export default Heatmap;
