import React from 'react';
import { Pressable, View } from 'react-native';
import { MotiView } from 'moti';
import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { AppText } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { colors, radii } from '@/theme/tokens';
import type { Habit } from '@/types/models';

const ACCENT_HEX: Record<Habit['accent'], string> = {
  highlighter: colors.highlighter,
  signal: colors.signal,
  peach: colors.peach,
  success: colors.success,
};

const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export type HabitCardProps = {
  habit: Habit;
  onToggleToday: (id: string) => void;
};

/**
 * A habit card with a recessed Icon medallion (driven by the icon-name token in
 * the data — never an emoji), a streak/weekly-target summary, a custom round
 * neumorphic complete toggle, and a row of animated weekly completion dots.
 */
export function HabitCard({ habit, onToggleToday }: HabitCardProps) {
  const accentHex = ACCENT_HEX[habit.accent];
  const completedThisWeek = habit.weekHistory.filter(Boolean).length;
  const done = habit.completedToday;

  return (
    <SoftCard radius={radii.card} intensity="md" padding={18} style={{ marginBottom: 14 }}>
      <View className="flex-row items-center" style={{ gap: 14 }}>
        {/* Icon medallion — tinted when completed today. */}
        <Neumorph variant="inset" radius={20} intensity="sm">
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              backgroundColor: done ? accentHex : 'transparent',
            }}
            className="items-center justify-center"
          >
            <Icon
              name={habit.emoji}
              size={24}
              color={done ? 'carbon' : 'textMuted'}
              strokeWidth={2.2}
            />
          </View>
        </Neumorph>

        <View style={{ flex: 1 }}>
          <AppText variant="body" weight="bold" color={colors.carbon}>
            {habit.title}
          </AppText>
          <View
            className="flex-row items-center"
            style={{ gap: 6, marginTop: 5, flexWrap: 'wrap' }}
          >
            <Icon name="flame" size={14} color="peach" fill="peach" strokeWidth={0} />
            <AppText variant="caption" weight="semibold" color={colors.carbon}>
              {habit.streak} days
            </AppText>
            <View
              style={{
                width: 3,
                height: 3,
                borderRadius: 2,
                backgroundColor: colors.textSubtle,
              }}
            />
            <AppText variant="caption" color={colors.textSubtle}>
              {completedThisWeek}/{habit.targetPerWeek} this week
            </AppText>
          </View>
        </View>

        {/* Custom round complete toggle: inset accent well when done. */}
        <Pressable
          onPress={() => onToggleToday(habit.id)}
          accessibilityRole="button"
          accessibilityState={{ selected: done }}
          accessibilityLabel={`Mark ${habit.title} ${done ? 'incomplete' : 'complete'} for today`}
        >
          <Neumorph
            variant={done ? 'inset' : 'raised'}
            radius={23}
            intensity="sm"
            surface={done ? accentHex : colors.canvas}
          >
            <View
              style={{ width: 46, height: 46 }}
              className="items-center justify-center"
            >
              <MotiView
                animate={{ scale: done ? 1 : 0.9, opacity: done ? 1 : 0.7 }}
                transition={{ type: 'spring', damping: 14, stiffness: 220 }}
              >
                <Icon
                  name={done ? 'check' : 'plus'}
                  size={22}
                  color={done ? 'carbon' : 'textMuted'}
                  strokeWidth={done ? 3 : 2.4}
                />
              </MotiView>
            </View>
          </Neumorph>
        </Pressable>
      </View>

      {/* Weekly completion dots, oldest -> newest (Mon..Sun). */}
      <View
        className="flex-row items-center justify-between"
        style={{ marginTop: 18 }}
      >
        {habit.weekHistory.map((completed, i) => {
          const isToday = i === habit.weekHistory.length - 1;
          return (
            <View key={i} className="items-center" style={{ gap: 7 }}>
              <MotiView
                animate={{ scale: completed ? 1 : 0.86 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 9,
                  backgroundColor: completed ? accentHex : '#e4e4e4',
                  borderWidth: isToday && !completed ? 2 : 0,
                  borderColor: accentHex,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {completed ? (
                  <Icon name="check" size={14} color="carbon" strokeWidth={3} />
                ) : null}
              </MotiView>
              <AppText
                variant="caption"
                weight={isToday ? 'bold' : 'regular'}
                color={isToday ? colors.carbon : colors.textSubtle}
                style={{ fontSize: 10 }}
              >
                {WEEK_LABELS[i]}
              </AppText>
            </View>
          );
        })}
      </View>
    </SoftCard>
  );
}

export default HabitCard;
