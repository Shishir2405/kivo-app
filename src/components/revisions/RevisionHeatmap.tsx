import React, { useMemo } from 'react';
import { View, ScrollView, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from '@/components/ui/Typography';
import { colors } from '@/theme/tokens';
import type { HeatCell } from './revisionUtils';

export type RevisionHeatmapProps = {
  data: HeatCell[];
  cellSize?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * A compact, monochrome review-activity grid (Steep). Columns are weeks
 * (Sun→Sat, top→bottom), scrolled horizontally. Empty days are a Fog well with
 * a 1px Dove hairline; activity ramps up through tints of Ink. No color, no
 * neumorphism — the data does the talking.
 */
export function RevisionHeatmap({ data, cellSize = 10, gap = 3, style }: RevisionHeatmapProps) {
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
              // Ink ramp via opacity tints — empty days are a Fog well.
              const bg = !filled
                ? colors.fog
                : ratio <= 0.34
                  ? 'rgba(23,25,28,0.28)'
                  : ratio <= 0.67
                    ? 'rgba(23,25,28,0.58)'
                    : colors.ink;
              return (
                <View
                  key={di}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    borderRadius: 2,
                    backgroundColor: bg,
                    borderWidth: filled ? 0 : 1,
                    borderColor: colors.dove,
                  }}
                />
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Less → More legend */}
      <View className="flex-row items-center" style={{ marginTop: 10, gap: 4, alignSelf: 'flex-end' }}>
        <AppText variant="caption" color={colors.graphite}>
          Less
        </AppText>
        {[colors.fog, 'rgba(23,25,28,0.28)', 'rgba(23,25,28,0.58)', colors.ink].map((c, i) => (
          <View
            key={c}
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              backgroundColor: c,
              borderWidth: i === 0 ? 1 : 0,
              borderColor: colors.dove,
            }}
          />
        ))}
        <AppText variant="caption" color={colors.graphite}>
          More
        </AppText>
      </View>
    </View>
  );
}

export default RevisionHeatmap;
