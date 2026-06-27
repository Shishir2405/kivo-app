import React, { useMemo } from 'react';
import { View, ScrollView, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from '@/components/ui/Typography';
import { useTheme } from '@/theme';
import type { HeatCell } from './revisionUtils';

export type RevisionHeatmapProps = {
  data: HeatCell[];
  cellSize?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * A compact review-activity grid (Kivo). Columns are weeks (Sun→Sat,
 * top→bottom), scrolled horizontally. Empty days are a well with a 1px hairline;
 * activity ramps from a soft peach wash up to its deeper terracotta accent so
 * the grid reads as a calm-but-warm contribution graph — matching the dashboard
 * heatmap in the HTML (#F0DDCC → #E6B08A → #C46A3D). Fully dark-aware.
 */
export function RevisionHeatmap({ data, cellSize = 10, gap = 3, style }: RevisionHeatmapProps) {
  const { colors, isDark, toneStyle } = useTheme();

  // Peach → terracotta ramp. In dark we deepen toward the warm accent.
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

  const { weeks, max } = useMemo(() => {
    const cells = Array.isArray(data) ? data : [];
    const peak = cells.reduce((m, d) => (d.count > m ? d.count : m), 0);

    // Pad the front so the first column starts on a Sunday.
    const firstDow = cells.length ? new Date(`${cells[0].day}T00:00:00`).getDay() : 0;
    const padded: (HeatCell | null)[] = [
      ...Array.from({ length: firstDow }, () => null),
      ...cells,
    ];

    const cols: (HeatCell | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) cols.push(padded.slice(i, i + 7));
    return { weeks: cols, max: peak };
  }, [data]);

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
              const filled = cell && cell.count > 0;
              const ratio = filled && max > 0 ? cell.count / max : 0;
              const bg = !filled ? emptyBg : ratio <= 0.34 ? RAMP[0] : ratio <= 0.67 ? RAMP[1] : RAMP[2];
              const hairlineCell = !filled || ratio <= 0.34;
              return (
                <View
                  key={di}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    borderRadius: 2,
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

      {/* Less → More legend */}
      <View className="flex-row items-center" style={{ marginTop: 10, gap: 4, alignSelf: 'flex-end' }}>
        <AppText variant="caption" color={colors.muted}>
          Less
        </AppText>
        {[emptyBg, RAMP[0], RAMP[1], RAMP[2]].map((c, i) => (
          <View
            key={`${c}-${i}`}
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              backgroundColor: c,
              borderWidth: i <= 1 ? 1 : 0,
              borderColor: i === 0 ? emptyBorder : RAMP[1],
            }}
          />
        ))}
        <AppText variant="caption" color={colors.muted}>
          More
        </AppText>
      </View>
    </View>
  );
}

export default RevisionHeatmap;
