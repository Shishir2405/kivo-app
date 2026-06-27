import React, { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import { AppText } from '@/components/ui/Typography';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/SoftCard';
import { Tag } from '@/components/ui/Tag';
import { Icon } from '@/components/ui/Icon';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import {
  FocusTimer,
  TaskCard,
  HabitCard,
  Timeline,
  SectionHeader,
  EmptyState,
  LoadingState,
  ErrorState,
  StatTile,
  type PlanBlock,
} from '@/components/tracker';
import { useTasks, useHabits, useStudySessions } from '@/hooks/api';
import { queryKeys } from '@/hooks/api/keys';
import { requestData, type ApiError } from '@/services/api';
import { spacing, motion } from '@/theme/tokens';
import { useTheme } from '@/theme';
import type { Task, Habit, Priority } from '@/types/models';

/* ================================================================== */
/* Today                                                               */
/* ================================================================== */

const TODAY = '2026-06-27';

/* ================================================================== */
/* Defensive normalizers                                               */
/*                                                                     */
/* The data hooks are typed to the app models, but the live backend    */
/* uses a slightly different wire shape (task.status instead of .done,  */
/* lowercase priority, habit.stats / completions). These readers accept */
/* either shape so the screen is correct whichever the API returns and  */
/* never throws on an unexpected field.                                 */
/* ================================================================== */

type Loose = Record<string, unknown>;

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function normalizePriority(value: unknown): Priority {
  const v = str(value)?.toUpperCase();
  if (v === 'HIGH' || v === 'URGENT') return 'HIGH';
  if (v === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
}

/** Read a task into the model shape, tolerating the live wire shape. */
function normalizeTask(raw: unknown, index: number): Task {
  const t = (raw ?? {}) as Loose;
  const status = str(t.status);
  const done =
    typeof t.done === 'boolean' ? t.done : status === 'completed' || status === 'done';
  const checklistRaw = asArray<Loose>(t.checklist);
  const checklist = checklistRaw.map((c, i) => ({
    id: str(c.id) ?? `${index}-${i}`,
    label: str(c.label) ?? str(c.title) ?? '',
    done: typeof c.done === 'boolean' ? c.done : str(c.status) === 'completed',
  }));
  return {
    id: str(t.id) ?? `task-${index}`,
    title: str(t.title) ?? 'Untitled task',
    done,
    priority: normalizePriority(t.priority),
    dueDate: str(t.dueDate) ?? str(t.dueAt) ?? str(t.due),
    category: 'OTHER',
    notes: str(t.notes) ?? str(t.description),
    checklist: checklist.length ? checklist : undefined,
  };
}

/** Read a habit into the model shape, tolerating the live wire shape. */
function normalizeHabit(raw: unknown, index: number): Habit {
  const h = (raw ?? {}) as Loose;
  const stats = (h.stats ?? {}) as Loose;

  const completedToday =
    typeof h.completedToday === 'boolean'
      ? h.completedToday
      : typeof stats.completedToday === 'boolean'
        ? stats.completedToday
        : str(h.lastCompletedDay) === TODAY;

  const streak =
    num(h.streak) || num(h.currentStreak) || num(stats.currentStreak) || 0;

  // weekHistory oldest -> newest. Prefer explicit array; else derive from
  // stats.history (newest-first day rows) or completions (day rows).
  let weekHistory: boolean[] = asArray<boolean>(h.weekHistory).map(Boolean);
  if (weekHistory.length !== 7) {
    const history = asArray<Loose>(stats.history);
    if (history.length) {
      const last7 = history
        .slice(0, 7)
        .map((d) => Boolean(d.completed ?? num(d.count) > 0))
        .reverse();
      weekHistory = last7;
    }
  }
  if (weekHistory.length !== 7) {
    const completions = asArray<Loose>(h.completions);
    const doneDays = new Set(
      completions
        .filter((c) => Boolean(c.completed ?? num(c.count) > 0))
        .map((c) => str(c.dayKey)),
    );
    weekHistory = buildWeek(doneDays);
  }

  const targetPerWeek =
    num(h.targetPerWeek) ||
    num(h.targetPerPeriod) ||
    (str(h.frequency) === 'daily' ? 7 : 0) ||
    7;

  return {
    id: str(h.id) ?? `habit-${index}`,
    title: str(h.title) ?? str(h.name) ?? 'Habit',
    emoji: 'flame',
    streak,
    completedToday,
    targetPerWeek,
    weekHistory,
    accent: 'peach',
  };
}

/** Build a 7-flag Mon..Sun-ish window ending today from a set of done day-keys. */
function buildWeek(doneDays: Set<string | undefined>): boolean[] {
  const out: boolean[] = [];
  const base = new Date(`${TODAY}T00:00:00Z`);
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() - i);
    out.push(doneDays.has(d.toISOString().slice(0, 10)));
  }
  return out;
}

/** Minutes from a study-session row (model `.minutes` or wire `.durationMinutes`). */
function sessionMinutes(raw: unknown): number {
  const s = (raw ?? {}) as Loose;
  return num(s.minutes) || num(s.durationMinutes);
}

/** Day key (YYYY-MM-DD) of a study-session row. */
function sessionDay(raw: unknown): string | undefined {
  const s = (raw ?? {}) as Loose;
  return (str(s.date) ?? str(s.startTime) ?? str(s.createdAt))?.slice(0, 10);
}

/* ================================================================== */
/* Task filter                                                         */
/* ================================================================== */

type TaskFilter = 'open' | 'all' | 'done';

const TASK_FILTERS: SegmentedOption<TaskFilter>[] = [
  { label: 'Open', value: 'open' },
  { label: 'All', value: 'all' },
  { label: 'Done', value: 'done' },
];

/* ================================================================== */
/* Inline mutations (typed ApiError; never throw to render)            */
/* ================================================================== */

function useToggleTask(): UseMutationResult<
  unknown,
  ApiError,
  { id: string; done: boolean }
> {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, { id: string; done: boolean }>({
    mutationFn: ({ id, done }) =>
      requestData({
        url: `/tasks/${id}`,
        method: 'PATCH',
        data: { status: done ? 'completed' : 'pending' },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

function useCompleteHabit(): UseMutationResult<unknown, ApiError, { id: string }> {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, { id: string }>({
    mutationFn: ({ id }) =>
      requestData({ url: `/habits/${id}/complete`, method: 'POST', data: {} }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.habits });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

function useLogStudySession(): UseMutationResult<
  unknown,
  ApiError,
  { minutes: number; timerType: 'pomodoro' | 'deep' }
> {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, { minutes: number; timerType: 'pomodoro' | 'deep' }>({
    mutationFn: ({ minutes, timerType }) => {
      const end = new Date();
      const start = new Date(end.getTime() - minutes * 60_000);
      return requestData({
        url: '/study-sessions',
        method: 'POST',
        data: {
          timerType: timerType === 'deep' ? 'deepwork' : 'pomodoro',
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          durationMinutes: minutes,
        },
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.studySessions });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/* ================================================================== */
/* Screen                                                              */
/* ================================================================== */

export default function TrackerScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const tasksQuery = useTasks();
  const habitsQuery = useHabits();
  const sessionsQuery = useStudySessions();

  const toggleTask = useToggleTask();
  const completeHabit = useCompleteHabit();
  const logSession = useLogStudySession();

  const [taskFilter, setTaskFilter] = useState<TaskFilter>('open');

  /* ---- Normalized data ---- */
  const tasks = useMemo<Task[]>(
    () => asArray<unknown>(tasksQuery.data).map(normalizeTask),
    [tasksQuery.data],
  );
  const habits = useMemo<Habit[]>(
    () => asArray<unknown>(habitsQuery.data).map(normalizeHabit),
    [habitsQuery.data],
  );

  const focusMinutesToday = useMemo<number>(() => {
    const rows = asArray<unknown>(sessionsQuery.data);
    return rows
      .filter((r) => sessionDay(r) === TODAY)
      .reduce<number>((sum, r) => sum + sessionMinutes(r), 0);
  }, [sessionsQuery.data]);

  /* ---- Derived counts ---- */
  const openCount = useMemo(() => tasks.filter((t) => !t.done).length, [tasks]);
  const habitsDoneToday = useMemo(
    () => habits.filter((h) => h.completedToday).length,
    [habits],
  );
  const streak = useMemo(
    () => habits.reduce((max, h) => Math.max(max, h.streak), 0),
    [habits],
  );

  /* ---- Today's plan (from open tasks) ---- */
  const planBlocks = useMemo<PlanBlock[]>(() => {
    const open = tasks.filter((t) => !t.done).slice(0, 4);
    return open.map((t, i) => ({
      id: t.id,
      time: i === 0 ? 'Now' : 'Next',
      title: t.title,
      detail: t.priority === 'HIGH' ? 'High priority' : undefined,
      state: i === 0 ? 'active' : 'upcoming',
    }));
  }, [tasks]);

  /* ---- Visible tasks for the filter ---- */
  const visibleTasks = useMemo(() => {
    if (taskFilter === 'open') return tasks.filter((t) => !t.done);
    if (taskFilter === 'done') return tasks.filter((t) => t.done);
    return tasks;
  }, [tasks, taskFilter]);

  /* ---- Handlers (all wrapped — a failed write never crashes) ---- */
  const onToggleTask = useCallback(
    (id: string, next: boolean) => {
      toggleTask.mutate({ id, done: next });
    },
    [toggleTask],
  );
  const onToggleHabit = useCallback(
    (id: string, next: boolean) => {
      // The backend records a completion; only fire on the "complete" tap.
      if (next) completeHabit.mutate({ id });
    },
    [completeHabit],
  );
  const onSessionComplete = useCallback(
    (minutes: number, mode: 'pomodoro' | 'deep') => {
      if (minutes > 0) logSession.mutate({ minutes, timerType: mode });
    },
    [logSession],
  );

  const refreshing =
    tasksQuery.isFetching || habitsQuery.isFetching || sessionsQuery.isFetching;
  const onRefresh = useCallback(() => {
    void tasksQuery.refetch();
    void habitsQuery.refetch();
    void sessionsQuery.refetch();
  }, [tasksQuery, habitsQuery, sessionsQuery]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.muted}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: 120,
        }}
      >
        {/* ---------- Header ---------- */}
        <AppHeader
          title="Tracker"
          right={
            streak > 0 ? (
              <Tag
                label={`${streak}-day streak`}
                tone="warm"
                size="sm"
                icon={<Icon name="flame" size={11} color="rust" weight="fill" />}
              />
            ) : undefined
          }
        />
        <AppText
          variant="caption"
          color={colors.graphite}
          style={{ marginTop: 2, marginBottom: spacing.lg, marginLeft: 30 }}
        >
          Friday · Jun 27
        </AppText>

        {/* ---------- Quick stats ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: motion.duration.transition }}
          className="flex-row"
          style={{ gap: spacing.md, marginBottom: spacing.xl }}
        >
          <StatTile value={String(openCount)} label="tasks open" tone="warm" />
          <StatTile
            value={`${habitsDoneToday}/${habits.length || 0}`}
            label="habits today"
            tone="cool"
          />
        </MotiView>

        {/* ---------- Today's plan ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: motion.duration.transition, delay: 60 }}
        >
          <SectionHeader eyebrow="Today" title="Plan" />
          <Card style={{ marginBottom: spacing.xl }} padding={spacing.lg}>
            {tasksQuery.isLoading ? (
              <LoadingState label="Loading plan" />
            ) : tasksQuery.isError ? (
              <ErrorState
                message={tasksQuery.error?.message}
                onRetry={() => void tasksQuery.refetch()}
              />
            ) : planBlocks.length > 0 ? (
              <Timeline blocks={planBlocks} />
            ) : (
              <View className="items-center" style={{ gap: 6, paddingVertical: spacing.sm }}>
                <Icon name="check-circle" size={18} color="dove" />
                <AppText variant="caption" color={colors.graphite}>
                  Nothing scheduled — you are all caught up.
                </AppText>
              </View>
            )}
          </Card>
        </MotiView>

        {/* ---------- Focus timer ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: motion.duration.transition, delay: 120 }}
        >
          <SectionHeader eyebrow="Stay in flow" title="Focus" />
          <View style={{ marginBottom: spacing.xl }}>
            <FocusTimer
              focusedTodayMinutes={focusMinutesToday}
              onSessionComplete={onSessionComplete}
            />
          </View>
        </MotiView>

        {/* ---------- Tasks ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: motion.duration.transition, delay: 180 }}
        >
          <SectionHeader eyebrow="Get it done" title="Tasks" />
          <View style={{ marginBottom: spacing.md }}>
            <SegmentedTabs
              options={TASK_FILTERS}
              value={taskFilter}
              onChange={setTaskFilter}
            />
          </View>

          <View style={{ marginBottom: spacing.xl }}>
            {tasksQuery.isLoading ? (
              <LoadingState label="Loading tasks" />
            ) : tasksQuery.isError ? (
              <ErrorState
                message={tasksQuery.error?.message}
                onRetry={() => void tasksQuery.refetch()}
              />
            ) : visibleTasks.length > 0 ? (
              <MotiView
                key={taskFilter}
                from={{ opacity: 0, translateY: 6 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: motion.duration.micro }}
              >
                {visibleTasks.map((task, i) => (
                  <TaskCard key={task.id} task={task} onToggle={onToggleTask} index={i} />
                ))}
              </MotiView>
            ) : (
              <EmptyState
                icon={taskFilter === 'done' ? 'check-circle' : 'badge-check'}
                title={taskFilter === 'done' ? 'Nothing finished yet' : 'All clear'}
                body={
                  taskFilter === 'done'
                    ? 'Complete a task and it lands here.'
                    : 'No open tasks right now.'
                }
              />
            )}
          </View>
        </MotiView>

        {/* ---------- Habits ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: motion.duration.transition, delay: 240 }}
        >
          <SectionHeader eyebrow="Build momentum" title="Habits" />
          {habitsQuery.isLoading ? (
            <LoadingState label="Loading habits" />
          ) : habitsQuery.isError ? (
            <ErrorState
              message={habitsQuery.error?.message}
              onRetry={() => void habitsQuery.refetch()}
            />
          ) : habits.length > 0 ? (
            habits.map((habit, i) => (
              <HabitCard key={habit.id} habit={habit} onToggleToday={onToggleHabit} index={i} />
            ))
          ) : (
            <EmptyState
              icon="repeat"
              title="No habits yet"
              body="Pick one habit to repeat daily and watch the streak grow."
            />
          )}
        </MotiView>
      </ScrollView>
    </View>
  );
}
