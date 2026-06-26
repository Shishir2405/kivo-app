import React, { useMemo } from 'react';
import { View, ScrollView, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts } from '@/theme/tokens';
import { Text } from 'react-native';
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
 * Maps a count to one of 5 neumorphic-friendly intensity buckets:
 * empty (recessed gray well) -> highlighter-yellow ramp.
 */
function intensityColor(count: number, max: number): string {
  if (count <= 0) return '#e4e4e4'; // empty well on the gray canvas
  const ratio = max > 0 ? count / max : 0;
  if (ratio <= 0.25) return '#f6f5a8';
  if (ratio <= 0.5) return '#f0ef6d';
  if (ratio <= 0.75) return '#ebe93c';
  return colors.highlighter; // #e6e51e — peak grind
}

const LEGEND_SWATCHES = ['#e4e4e4', '#f6f5a8', '#f0ef6d', '#ebe93c', colors.highlighter];

/**
 * GitHub-style contribution grid rendered with neumorphic cells and a
 * highlighter-yellow intensity ramp. Columns are weeks (Sun..Sat top->bottom),
 * horizontally scrollable. Pure presentational — feed it `mockHeatmap`.
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
  const { weeks, max } = useMemo(() => {
    const sorted = [...data].sort((a, b) => a.day.localeCompare(b.day));
    const sliced = sorted.slice(Math.max(0, sorted.length - range));
    const peak = sliced.reduce((m, d) => (d.count > m ? d.count : m), 0);

    // Pad the front so the first column starts on a Sunday.
    const firstDow = sliced.length
      ? new Date(`${sliced[0].day}T00:00:00Z`).getUTCDay()
      : 0;
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
              <View
                key={i}
                style={{ height: rowOffset, justifyContent: 'center' }}
              >
                <Text
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 9,
                    color: colors.textSubtle,
                    width: 22,
                  }}
                >
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
                const bg = cell ? intensityColor(cell.count, max) : 'transparent';
                return (
                  <View
                    key={di}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: 3,
                      backgroundColor: bg,
                      // subtle recessed look on filled / empty cells
                      borderWidth: cell ? 0.5 : 0,
                      borderColor: 'rgba(0,0,0,0.04)',
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
          <Text
            style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textSubtle }}
          >
            Less
          </Text>
          {LEGEND_SWATCHES.map((c) => (
            <View
              key={c}
              style={{ width: 11, height: 11, borderRadius: 3, backgroundColor: c }}
            />
          ))}
          <Text
            style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textSubtle }}
          >
            More
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default Heatmap;
