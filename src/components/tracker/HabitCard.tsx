import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { MotiView } from 'moti';
import { Card } from '@/components/ui/SoftCard';
import { AppText } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { radii, spacing, pressOpacity, toneAt } from '@/theme/tokens';
import { useTheme } from '@/theme';
import type { Habit } from '@/types/models';

const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export type HabitCardProps = {
  habit: Habit;
  onToggleToday: (id: string, next: boolean) => void;
  /** Tap-the-title to edit. When set, tapping the row's text opens the editor. */
  onEdit?: (habit: Habit) => void;
  /**
   * Position in the list — rotates the soft wash so the habit stack reads as an
   * intentionally colorful set, each habit with its own calm voice.
   */
  index?: number;
};

/**
 * A flat Steep habit row on a rotating soft wash.
 *
 * Title + a small streak line (a tiny flame in the wash accent), a circular
 * complete toggle (filled in the wash accent when done, matching hairline when
 * not), and a compact row of weekly completion squares — filled accent for done
 * days, a matching hairline outline for misses, accent ring on today. No
 * neumorphism, no emoji — calm-but-colorful.
 */
export function HabitCard({ habit, onToggleToday, onEdit, index = 0 }: HabitCardProps) {
  const { colors, toneStyle } = useTheme();
  const [editPressed, setEditPressed] = useState(false);
  const [togglePressed, setTogglePressed] = useState(false);
  const completedThisWeek = habit.weekHistory.filter(Boolean).length;
  const done = habit.completedToday;
  const canEdit = !!onEdit;

  const tone = toneAt(index);
  const ts = toneStyle(tone);

  return (
    <Card tone={tone} padding={spacing.md} style={{ marginBottom: spacing.sm }}>
      <View className="flex-row items-center" style={{ gap: spacing.md }}>
        <Pressable
          style={{ flex: 1, opacity: canEdit ? pressOpacity({ pressed: editPressed }) : 1 }}
          disabled={!canEdit}
          onPress={canEdit ? () => onEdit?.(habit) : undefined}
          onPressIn={() => setEditPressed(true)}
          onPressOut={() => setEditPressed(false)}
          accessibilityRole={canEdit ? 'button' : undefined}
          accessibilityLabel={canEdit ? `Edit ${habit.title}` : undefined}
        >
          <AppText variant="body" weight="medium" color={colors.ink} numberOfLines={1}>
            {habit.title}
          </AppText>
          <View
            className="flex-row items-center"
            style={{ gap: 5, marginTop: 3, flexWrap: 'wrap' }}
          >
            <Icon name="flame" size={12} color={ts.accent} weight="fill" />
            <AppText variant="caption" weight="medium" color={colors.ink}>
              {habit.streak}-day streak
            </AppText>
            <AppText variant="caption" color={colors.graphite}>
              {' · '}
              {completedThisWeek}/{habit.targetPerWeek} this week
            </AppText>
          </View>
        </Pressable>

        {/* Flat circular complete toggle. */}
        <Pressable
          onPress={() => onToggleToday(habit.id, !done)}
          onPressIn={() => setTogglePressed(true)}
          onPressOut={() => setTogglePressed(false)}
          accessibilityRole="button"
          accessibilityState={{ selected: done }}
          accessibilityLabel={`Mark ${habit.title} ${done ? 'incomplete' : 'complete'} for today`}
          hitSlop={6}
          style={{ opacity: pressOpacity({ pressed: togglePressed }) }}
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
              backgroundColor: done ? ts.accent : colors.white,
              borderWidth: 1,
              borderColor: done ? ts.accent : ts.border,
            }}
          >
            <Icon
              name={done ? 'check' : 'plus'}
              size={16}
              color={done ? colors.white : ts.accent}
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
                  backgroundColor: completed ? ts.accent : colors.white,
                  borderWidth: 1,
                  borderColor: completed
                    ? ts.accent
                    : isToday
                      ? ts.accent
                      : ts.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {completed ? <Icon name="check" size={11} color="white" weight="bold" /> : null}
              </View>
              <AppText
                variant="caption"
                weight={isToday ? 'medium' : 'regular'}
                color={isToday ? colors.ink : colors.graphite}
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
