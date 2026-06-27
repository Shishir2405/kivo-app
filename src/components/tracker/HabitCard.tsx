import React from 'react';
import { Pressable, View } from 'react-native';
import { MotiView } from 'moti';
import { Card } from '@/components/ui/SoftCard';
import { AppText } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { colors, radii, spacing } from '@/theme/tokens';
import type { Habit } from '@/types/models';

const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export type HabitCardProps = {
  habit: Habit;
  onToggleToday: (id: string, next: boolean) => void;
};

/**
 * A flat Steep habit row.
 *
 * Title + a small streak line (a tiny Rust flame as the one warm punctuation),
 * a flat circular complete toggle (Ink when done, Dove hairline when not), and a
 * compact row of weekly completion squares — filled Ink for done days, a Dove
 * hairline outline for misses, Rust ring on today. No neumorphism, no emoji.
 */
export function HabitCard({ habit, onToggleToday }: HabitCardProps) {
  const completedThisWeek = habit.weekHistory.filter(Boolean).length;
  const done = habit.completedToday;

  return (
    <Card padding={spacing.md} style={{ marginBottom: spacing.sm }}>
      <View className="flex-row items-center" style={{ gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <AppText variant="body" weight="medium" color={colors.ink} numberOfLines={1}>
            {habit.title}
          </AppText>
          <View
            className="flex-row items-center"
            style={{ gap: 5, marginTop: 3, flexWrap: 'wrap' }}
          >
            <Icon name="flame" size={12} color="rust" weight="fill" />
            <AppText variant="caption" weight="medium" color={colors.ink}>
              {habit.streak}-day streak
            </AppText>
            <AppText variant="caption" color={colors.graphite}>
              {' · '}
              {completedThisWeek}/{habit.targetPerWeek} this week
            </AppText>
          </View>
        </View>

        {/* Flat circular complete toggle. */}
        <Pressable
          onPress={() => onToggleToday(habit.id, !done)}
          accessibilityRole="button"
          accessibilityState={{ selected: done }}
          accessibilityLabel={`Mark ${habit.title} ${done ? 'incomplete' : 'complete'} for today`}
          hitSlop={6}
        >
          <MotiView
            animate={{ scale: done ? 1 : 0.96 }}
            transition={{ type: 'timing', duration: 160 }}
            style={{
              width: 34,
              height: 34,
              borderRadius: radii.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: done ? colors.ink : colors.white,
              borderWidth: 1,
              borderColor: done ? colors.ink : colors.dove,
            }}
          >
            <Icon
              name={done ? 'check' : 'plus'}
              size={16}
              color={done ? 'white' : 'graphite'}
              weight={done ? 'bold' : 'regular'}
            />
          </MotiView>
        </Pressable>
      </View>

      {/* Weekly completion squares, oldest -> newest (Mon..Sun). */}
      <View
        className="flex-row items-center justify-between"
        style={{ marginTop: spacing.md }}
      >
        {habit.weekHistory.map((completed, i) => {
          const isToday = i === habit.weekHistory.length - 1;
          return (
            <View key={i} className="items-center" style={{ gap: 5 }}>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 7,
                  backgroundColor: completed ? colors.ink : colors.white,
                  borderWidth: 1,
                  borderColor: completed
                    ? colors.ink
                    : isToday
                      ? colors.rust
                      : colors.dove,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {completed ? <Icon name="check" size={11} color="white" weight="bold" /> : null}
              </View>
              <AppText
                variant="caption"
                weight={isToday ? 'medium' : 'regular'}
                color={isToday ? colors.ink : colors.dove}
                style={{ fontSize: 10 }}
              >
                {WEEK_LABELS[i]}
              </AppText>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

export default HabitCard;
