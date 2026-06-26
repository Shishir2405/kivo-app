import React, { useCallback, useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { SoftIconButton } from '@/components/ui/SoftIconButton';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { Icon } from '@/components/ui/Icon';
import { GrayMark } from '@/components/ui/AppHeader';
import { StreakBadge } from '@/components/StreakBadge';
import {
  FocusTimer,
  TaskCard,
  HabitCard,
  Timeline,
  SectionHeader,
  EmptyState,
  StatPill,
} from '@/components/tracker';
import { colors, radii } from '@/theme/tokens';
import { mockTasks, mockHabits, mockDashboard } from '@/data/mock';
import type { Task, Habit } from '@/types/models';

/* ================================================================== */
/* Task filter                                                         */
/* ================================================================== */

type TaskFilter = 'all' | 'open' | 'done';

const TASK_FILTERS: SegmentedOption<TaskFilter>[] = [
  { label: 'Open', value: 'open' },
  { label: 'All', value: 'all' },
  { label: 'Done', value: 'done' },
];

/* ================================================================== */
/* Screen                                                              */
/* ================================================================== */

export default function TrackerScreen() {
  const insets = useSafeAreaInsets();

  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [habits, setHabits] = useState<Habit[]>(mockHabits);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('open');

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  }, []);

  const toggleChecklistItem = useCallback((taskId: string, itemId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId || !t.checklist) return t;
        return {
          ...t,
          checklist: t.checklist.map((c) =>
            c.id === itemId ? { ...c, done: !c.done } : c,
          ),
        };
      }),
    );
  }, []);

  const toggleHabit = useCallback((id: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const completedToday = !h.completedToday;
        const week = [...h.weekHistory];
        week[week.length - 1] = completedToday;
        return {
          ...h,
          completedToday,
          weekHistory: week,
          streak: completedToday
            ? h.streak + (h.completedToday ? 0 : 1)
            : Math.max(0, h.streak - 1),
        };
      }),
    );
  }, []);

  const openCount = useMemo(() => tasks.filter((t) => !t.done).length, [tasks]);
  const habitsDoneToday = useMemo(
    () => habits.filter((h) => h.completedToday).length,
    [habits],
  );

  const visibleTasks = useMemo(() => {
    if (taskFilter === 'open') return tasks.filter((t) => !t.done);
    if (taskFilter === 'done') return tasks.filter((t) => t.done);
    return tasks;
  }, [tasks, taskFilter]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 130,
        }}
      >
        {/* ---------- Gray brand watermark ---------- */}
        <View style={{ marginBottom: 10 }}>
          <GrayMark size={24} />
        </View>

        {/* ---------- Header ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 360 }}
        >
          <View
            className="flex-row items-start justify-between"
            style={{ marginBottom: 18 }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <AppText
                variant="caption"
                weight="semibold"
                color={colors.textSubtle}
                style={{
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  fontSize: 11,
                }}
              >
                Friday · Jun 26
              </AppText>
              <AppText
                variant="heading"
                display
                weight="bold"
                color={colors.carbon}
                style={{ marginTop: 4 }}
              >
                Daily Tracker
              </AppText>
            </View>
            <StreakBadge count={mockDashboard.streak} size="md" />
          </View>

          {/* Quick stats. */}
          <View className="flex-row" style={{ gap: 12, marginBottom: 28 }}>
            <StatPill
              icon="list"
              value={String(openCount)}
              label="tasks open"
              accent={colors.highlighter}
              style={{ flex: 1 }}
            />
            <StatPill
              icon="flame"
              value={`${habitsDoneToday}/${habits.length}`}
              label="habits done"
              accent={colors.peach}
              style={{ flex: 1 }}
            />
          </View>
        </MotiView>

        {/* ---------- Daily planner timeline ---------- */}
        <SectionHeader eyebrow="Today's plan" title="Timeline" icon="calendar" />
        <SoftCard
          radius={radii.card}
          intensity="md"
          padding={18}
          style={{ marginBottom: 28 }}
        >
          <Timeline />
        </SoftCard>

        {/* ---------- Focus timer ---------- */}
        <SectionHeader eyebrow="Stay in flow" title="Focus Timer" icon="timer" />
        <View style={{ marginBottom: 28 }}>
          <FocusTimer focusedTodayMinutes={mockDashboard.focusMinutesToday} />
        </View>

        {/* ---------- Tasks ---------- */}
        <SectionHeader
          eyebrow="Get it done"
          title="Tasks"
          icon="check-square"
          trailing={
            <SoftIconButton
              size={44}
              accessibilityLabel="Add a new task"
              onPress={() => {}}
            >
              <Icon name="plus" size={20} color="carbon" strokeWidth={2.4} />
            </SoftIconButton>
          }
        />

        <View style={{ marginBottom: 16 }}>
          <SegmentedTabs
            options={TASK_FILTERS}
            value={taskFilter}
            onChange={setTaskFilter}
            height={44}
          />
        </View>

        <MotiView
          key={taskFilter}
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 280 }}
          style={{ marginBottom: 28 }}
        >
          {visibleTasks.length > 0 ? (
            visibleTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onToggleChecklistItem={toggleChecklistItem}
              />
            ))
          ) : (
            <EmptyState
              icon={taskFilter === 'done' ? 'check-circle' : 'badge-check'}
              title={
                taskFilter === 'done' ? 'Nothing finished yet' : 'All clear'
              }
              body={
                taskFilter === 'done'
                  ? 'Complete a task and it will land here as proof of progress.'
                  : 'No open tasks right now — add one or take a well-earned break.'
              }
            />
          )}
        </MotiView>

        {/* ---------- Habits ---------- */}
        <SectionHeader
          eyebrow="Build momentum"
          title="Habits"
          icon="repeat"
        />
        {habits.length > 0 ? (
          habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggleToday={toggleHabit}
            />
          ))
        ) : (
          <EmptyState
            icon="sparkles"
            title="No habits yet"
            body="Start small — pick one habit to repeat daily and watch the streak grow."
          />
        )}
      </ScrollView>
    </View>
  );
}
