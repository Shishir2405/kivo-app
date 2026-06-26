import React from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';
import { AppText } from '@/components/ui/Typography';
import { colors } from '@/theme/tokens';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export type WeeklyBarsProps = {
  /** Minutes per weekday Mon..Sun (length 7). */
  weeklyMinutes: number[];
  /** Index of "today" within the week (0=Mon..6=Sun) to highlight. */
  todayIndex?: number;
  /** Max bar height in px. */
  height?: number;
};

/**
 * The weekly focus-minutes bar chart. Each column is an inset neumorphic well
 * with a highlighter-yellow bar that springs up on mount (moti, staggered).
 * Today's bar gets the full accent + a floating minutes caption; the rest use a
 * soft tint so the current day reads as the hero. Empty days show a flat dot.
 */
export function WeeklyBars({
  weeklyMinutes,
  todayIndex = 5,
  height = 96,
}: WeeklyBarsProps) {
  const max = Math.max(1, ...weeklyMinutes);

  return (
    <View className="flex-row items-end justify-between" style={{ gap: 9 }}>
      {weeklyMinutes.map((mins, i) => {
        const ratio = mins / max;
        const barH = Math.max(6, Math.round(ratio * height));
        const isToday = i === todayIndex;
        const isEmpty = mins <= 0;
        return (
          <View key={i} className="items-center" style={{ flex: 1, gap: 9 }}>
            {/* Track */}
            <View
              style={{
                height,
                width: '100%',
                borderRadius: 11,
                backgroundColor: '#ececec',
                justifyContent: 'flex-end',
                alignItems: 'center',
                overflow: 'hidden',
                borderTopWidth: 1.5,
                borderLeftWidth: 1.5,
                borderTopColor: 'rgba(174,174,192,0.30)',
                borderLeftColor: 'rgba(174,174,192,0.30)',
                borderBottomWidth: 1.5,
                borderRightWidth: 1.5,
                borderBottomColor: 'rgba(255,255,255,0.65)',
                borderRightColor: 'rgba(255,255,255,0.65)',
              }}
            >
              {/* Floating minutes caption on today's hero bar */}
              {isToday && !isEmpty ? (
                <MotiView
                  from={{ opacity: 0, translateY: 6 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 360, delay: 520 }}
                  style={{ position: 'absolute', top: 6 }}
                >
                  <AppText
                    variant="caption"
                    weight="bold"
                    display
                    color={colors.carbon}
                    style={{ fontSize: 11 }}
                  >
                    {mins}
                  </AppText>
                </MotiView>
              ) : null}

              {isEmpty ? (
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.hairline,
                    marginBottom: 8,
                  }}
                />
              ) : (
                <MotiView
                  from={{ height: 0 }}
                  animate={{ height: barH }}
                  transition={{ type: 'spring', damping: 17, stiffness: 150, delay: i * 65 }}
                  style={{
                    width: '100%',
                    borderRadius: 11,
                    backgroundColor: isToday ? colors.highlighter : '#f0ef8f',
                    borderWidth: isToday ? 1.5 : 0,
                    borderColor: colors.carbon,
                  }}
                />
              )}
            </View>

            <AppText
              variant="caption"
              weight={isToday ? 'bold' : 'regular'}
              color={isToday ? colors.carbon : colors.textSubtle}
              style={{ fontSize: 11 }}
            >
              {DAY_LABELS[i]}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

export default WeeklyBars;
