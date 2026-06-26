/**
 * Habit tracker (stack route `/habits`).
 *
 * A dedicated, engaging tracker for daily routines built entirely from the
 * Aaply neumorphic kit on the graphite-mist canvas — ZERO emoji, vector Icons
 * only. Each habit card carries:
 *   - an inset Icon chip in the habit's accent,
 *   - a weekly completion dot grid (last 7 days, oldest → newest),
 *   - a current-streak StreakBadge,
 *   - a circular ProgressRing showing the week's target attainment,
 *   - a custom neumorphic Checkbox to mark today done (springs the streak +1).
 *
 * A hero summary ring shows today's completion across all habits. The
 * add-habit flow is a neumorphic bottom-sheet with a SoftInput name, an Icon +
 * accent picker, SegmentedTabs for frequency (daily / weekdays / custom) and a
 * Stepper for a custom weekly target. All state is local (mock-seeded) so the
 * screen is fully interactive without a backend.
 */
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Modal,
  type ColorValue,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { SoftIconButton } from '@/components/ui/SoftIconButton';
import { SoftInput } from '@/components/ui/SoftInput';
import { SoftButton } from '@/components/ui/SoftButton';
import { Checkbox } from '@/components/ui/Checkbox';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { Stepper } from '@/components/ui/Stepper';
import { Tag } from '@/components/ui/Tag';
import { Icon, type IconName } from '@/components/ui/Icon';
import { GrayMark } from '@/components/ui/AppHeader';
import { StreakBadge } from '@/components/StreakBadge';
import { ProgressRing } from '@/components/habits/ProgressRing';

import { colors, radii } from '@/theme/tokens';
import { mockHabits } from '@/data/mock';
import type { Habit } from '@/types/models';

/* ------------------------------------------------------------------ */
/* Accent plumbing                                                     */
/* ------------------------------------------------------------------ */

type HabitAccent = Habit['accent']; // 'highlighter' | 'signal' | 'peach' | 'success'

const ACCENT_HEX: Record<HabitAccent, ColorValue> = {
  highlighter: colors.highlighter,
  signal: colors.signal,
  peach: colors.peach,
  success: colors.success,
};

/** Ink that reads on top of each accent fill. */
function accentInk(accent: HabitAccent): string {
  return accent === 'highlighter' ? colors.carbon : colors.paper;
}

/** Day-of-week initials for the 7-day grid (oldest → newest, ending today). */
const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/* ------------------------------------------------------------------ */
/* Weekly completion dot grid                                          */
/* ------------------------------------------------------------------ */

function WeekDots({ history, accent }: { history: boolean[]; accent: HabitAccent }) {
  const hex = ACCENT_HEX[accent];
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {history.map((done, i) => {
        const isToday = i === history.length - 1;
        return (
          <View key={i} style={{ alignItems: 'center', gap: 6 }}>
            <Neumorph
              variant={done ? 'raised' : 'inset'}
              radius={7}
              intensity="sm"
              surface={done ? (hex as string) : colors.canvas}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 7,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {done ? (
                  <Icon name="check" size={13} color={accentInk(accent)} strokeWidth={3} />
                ) : isToday ? (
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: colors.textSubtle,
                    }}
                  />
                ) : null}
              </View>
            </Neumorph>
            <AppText
              variant="caption"
              color={isToday ? colors.carbon : colors.textSubtle}
              weight={isToday ? 'bold' : 'regular'}
              style={{ fontSize: 10 }}
            >
              {WEEK_LABELS[i]}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Habit card                                                          */
/* ------------------------------------------------------------------ */

function HabitCard({
  habit,
  index,
  onToggle,
}: {
  habit: Habit;
  index: number;
  onToggle: (id: string) => void;
}) {
  const accentHex = ACCENT_HEX[habit.accent];
  const doneThisWeek = habit.weekHistory.filter(Boolean).length;
  const weekProgress = habit.targetPerWeek > 0 ? doneThisWeek / habit.targetPerWeek : 0;
  const pct = Math.min(100, Math.round(weekProgress * 100));

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 320, delay: 80 + index * 55 }}
      style={{ marginBottom: 14 }}
    >
      <SoftCard radius={radii.card} padding={18}>
        {/* Top row: icon + title + ring */}
        <View className="flex-row items-center" style={{ gap: 14 }}>
          <Neumorph variant="inset" radius={16} intensity="sm" padding={12} surface={colors.canvas}>
            <Icon name={habit.emoji} size={22} color={habit.accent} strokeWidth={2.2} />
          </Neumorph>

          <View style={{ flex: 1 }}>
            <AppText variant="subheading" weight="bold" numberOfLines={1}>
              {habit.title}
            </AppText>
            <View className="flex-row items-center" style={{ gap: 6, marginTop: 3 }}>
              <Icon name="target" size={13} color="textMuted" strokeWidth={2.2} />
              <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 12.5 }}>
                {doneThisWeek}/{habit.targetPerWeek} this week
              </AppText>
            </View>
          </View>

          <ProgressRing
            progress={weekProgress}
            size={54}
            stroke={6}
            color={accentHex as string}
          >
            <AppText variant="caption" weight="bold" style={{ fontSize: 13 }}>
              {pct}%
            </AppText>
          </ProgressRing>
        </View>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: colors.hairline,
            marginVertical: 16,
          }}
        />

        {/* Weekly dot grid */}
        <WeekDots history={habit.weekHistory} accent={habit.accent} />

        {/* Bottom row: streak + mark-today */}
        <View className="flex-row items-center justify-between" style={{ marginTop: 16 }}>
          <StreakBadge count={habit.streak} size="sm" label="day streak" />

          <Pressable
            onPress={() => onToggle(habit.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: habit.completedToday }}
            accessibilityLabel={`Mark ${habit.title} done for today`}
          >
            <Neumorph
              variant={habit.completedToday ? 'inset' : 'raised'}
              radius={radii.pill}
              intensity="sm"
              surface={habit.completedToday ? (accentHex as string) : colors.canvas}
            >
              <View
                className="flex-row items-center"
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: 14,
                  gap: 8,
                  borderRadius: radii.pill,
                }}
              >
                <AnimatePresence>
                  {habit.completedToday ? (
                    <MotiView
                      key="done"
                      from={{ opacity: 0, scale: 0.4 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.4 }}
                      transition={{ type: 'spring', damping: 14, stiffness: 220 }}
                    >
                      <Icon
                        name="check-circle-filled"
                        size={16}
                        color={accentInk(habit.accent)}
                        strokeWidth={2.4}
                      />
                    </MotiView>
                  ) : (
                    <MotiView
                      key="todo"
                      from={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Icon name="circle" size={16} color="textMuted" strokeWidth={2.2} />
                    </MotiView>
                  )}
                </AnimatePresence>
                <AppText
                  variant="caption"
                  weight="bold"
                  color={habit.completedToday ? accentInk(habit.accent) : colors.textMuted}
                  style={{ fontSize: 13 }}
                >
                  {habit.completedToday ? 'Done today' : 'Mark today'}
                </AppText>
              </View>
            </Neumorph>
          </Pressable>
        </View>
      </SoftCard>
    </MotiView>
  );
}

/* ------------------------------------------------------------------ */
/* Add-habit sheet                                                     */
/* ------------------------------------------------------------------ */

type Frequency = 'daily' | 'weekdays' | 'custom';

const ICON_CHOICES: IconName[] = [
  'code',
  'book-open',
  'notebook-pen',
  'dumbbell',
  'brain',
  'coffee',
  'target',
  'flame',
];

const ACCENT_CHOICES: HabitAccent[] = ['highlighter', 'signal', 'peach', 'success'];

const FREQUENCY_OPTIONS: { label: string; value: Frequency; icon: IconName }[] = [
  { label: 'Daily', value: 'daily', icon: 'repeat' },
  { label: 'Weekdays', value: 'weekdays', icon: 'calendar' },
  { label: 'Custom', value: 'custom', icon: 'target' },
];

function targetForFrequency(freq: Frequency, custom: number): number {
  if (freq === 'daily') return 7;
  if (freq === 'weekdays') return 5;
  return custom;
}

function AddHabitSheet({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (habit: Habit) => void;
}) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState<IconName>('code');
  const [accent, setAccent] = useState<HabitAccent>('highlighter');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [customTarget, setCustomTarget] = useState(3);
  const [touched, setTouched] = useState(false);

  const target = targetForFrequency(frequency, customTarget);
  const trimmed = title.trim();
  const valid = trimmed.length > 0;

  const reset = useCallback(() => {
    setTitle('');
    setIcon('code');
    setAccent('highlighter');
    setFrequency('daily');
    setCustomTarget(3);
    setTouched(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleCreate = useCallback(() => {
    if (!valid) {
      setTouched(true);
      return;
    }
    onCreate({
      id: `habit_new_${Date.now()}`,
      title: trimmed,
      emoji: icon,
      streak: 0,
      completedToday: false,
      targetPerWeek: target,
      weekHistory: [false, false, false, false, false, false, false],
      accent,
    });
    reset();
  }, [valid, trimmed, icon, target, accent, onCreate, reset]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        {/* Scrim */}
        <Pressable
          onPress={handleClose}
          style={{ ...StyleSheetAbsoluteFill, backgroundColor: 'rgba(0,0,0,0.35)' }}
          accessibilityLabel="Dismiss"
        />

        <MotiView
          from={{ translateY: 40, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        >
          <View
            style={{
              backgroundColor: colors.canvas,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingTop: 12,
              paddingHorizontal: 20,
              paddingBottom: insets.bottom + 20,
            }}
          >
            {/* Grabber */}
            <View
              style={{
                alignSelf: 'center',
                width: 44,
                height: 5,
                borderRadius: 3,
                backgroundColor: colors.hairline,
                marginBottom: 16,
              }}
            />

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 560 }}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between" style={{ marginBottom: 18 }}>
                <View className="flex-row items-center" style={{ gap: 12 }}>
                  <Neumorph variant="inset" radius={14} intensity="sm" padding={10}>
                    <Icon name={icon} size={20} color={accent} strokeWidth={2.2} />
                  </Neumorph>
                  <AppText variant="subheading" weight="bold">
                    New habit
                  </AppText>
                </View>
                <SoftIconButton size={40} accessibilityLabel="Close" onPress={handleClose}>
                  <Icon name="x" size={18} color="carbon" />
                </SoftIconButton>
              </View>

              {/* Name */}
              <SoftInput
                label="Habit name"
                placeholder="e.g. Solve a problem"
                value={title}
                onChangeText={setTitle}
                error={touched && !valid ? 'Give your habit a name' : undefined}
                leading={<Icon name="pen" size={18} color="textMuted" />}
                returnKeyType="done"
                onSubmitEditing={handleCreate}
                containerStyle={{ marginBottom: 20 }}
              />

              {/* Icon picker */}
              <AppText variant="caption" weight="bold" style={{ marginBottom: 10, marginLeft: 4 }}>
                Icon
              </AppText>
              <View className="flex-row flex-wrap" style={{ gap: 10, marginBottom: 20 }}>
                {ICON_CHOICES.map((name) => {
                  const selected = icon === name;
                  return (
                    <Pressable
                      key={name}
                      onPress={() => setIcon(name)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`Icon ${name}`}
                    >
                      <Neumorph
                        variant={selected ? 'inset' : 'raised'}
                        radius={14}
                        intensity="sm"
                        surface={selected ? (ACCENT_HEX[accent] as string) : colors.canvas}
                      >
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon
                            name={name}
                            size={21}
                            color={selected ? accentInk(accent) : colors.textMuted}
                            strokeWidth={2.2}
                          />
                        </View>
                      </Neumorph>
                    </Pressable>
                  );
                })}
              </View>

              {/* Accent picker */}
              <AppText variant="caption" weight="bold" style={{ marginBottom: 10, marginLeft: 4 }}>
                Color
              </AppText>
              <View className="flex-row" style={{ gap: 12, marginBottom: 22 }}>
                {ACCENT_CHOICES.map((a) => {
                  const selected = accent === a;
                  return (
                    <Pressable
                      key={a}
                      onPress={() => setAccent(a)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`Color ${a}`}
                    >
                      <Neumorph variant={selected ? 'inset' : 'raised'} radius={radii.pill} intensity="sm">
                        <View
                          style={{
                            width: 46,
                            height: 46,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <View
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 13,
                              backgroundColor: ACCENT_HEX[a],
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {selected ? (
                              <Icon
                                name="check"
                                size={15}
                                color={accentInk(a)}
                                strokeWidth={3}
                              />
                            ) : null}
                          </View>
                        </View>
                      </Neumorph>
                    </Pressable>
                  );
                })}
              </View>

              {/* Frequency */}
              <AppText variant="caption" weight="bold" style={{ marginBottom: 10, marginLeft: 4 }}>
                Frequency
              </AppText>
              <SegmentedTabs
                options={FREQUENCY_OPTIONS}
                value={frequency}
                onChange={setFrequency}
                style={{ marginBottom: 16 }}
              />

              {/* Target — daily/weekdays show a read-only summary, custom shows a stepper */}
              {frequency === 'custom' ? (
                <View className="flex-row items-center justify-between" style={{ marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="caption" weight="bold" style={{ marginLeft: 4 }}>
                      Days per week
                    </AppText>
                    <AppText
                      variant="caption"
                      color={colors.textMuted}
                      style={{ marginLeft: 4, fontSize: 12 }}
                    >
                      How many days you aim to do it
                    </AppText>
                  </View>
                  <Stepper value={customTarget} onChange={setCustomTarget} min={1} max={7} />
                </View>
              ) : (
                <Neumorph variant="inset" radius={radii.input}>
                  <View
                    className="flex-row items-center"
                    style={{ paddingVertical: 14, paddingHorizontal: 16, gap: 10 }}
                  >
                    <Icon name="calendar-check" size={18} color="textMuted" strokeWidth={2.2} />
                    <AppText variant="caption" color={colors.textMuted} style={{ flex: 1, fontSize: 13 }}>
                      {frequency === 'daily' ? 'Every day' : 'Monday to Friday'}
                    </AppText>
                    <Tag label={`${target}× / week`} tone="neutral" size="sm" />
                  </View>
                </Neumorph>
              )}

              {/* Create */}
              <SoftButton
                label="Create habit"
                variant="yellow"
                fullWidth
                onPress={handleCreate}
                icon={<Icon name="plus" size={18} color="carbon" strokeWidth={2.6} />}
                style={{ marginTop: 22 }}
              />
            </ScrollView>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 360 }}
    >
      <SoftCard variant="inset" radius={radii.cardLg} padding={32} style={{ alignItems: 'center' }}>
        <Neumorph variant="raised" radius={28} intensity="md" padding={20}>
          <Icon name="repeat" size={34} color="peach" strokeWidth={2} />
        </Neumorph>
        <AppText variant="subheading" weight="bold" style={{ marginTop: 20, textAlign: 'center' }}>
          No habits yet
        </AppText>
        <AppText
          variant="caption"
          color={colors.textMuted}
          style={{ marginTop: 6, textAlign: 'center', fontSize: 13.5, lineHeight: 20 }}
        >
          Build momentum one day at a time. Add a routine and check it off each day to grow a streak.
        </AppText>
        <SoftButton
          label="Add your first habit"
          variant="yellow"
          onPress={onAdd}
          icon={<Icon name="plus" size={18} color="carbon" strokeWidth={2.6} />}
          style={{ marginTop: 22 }}
        />
      </SoftCard>
    </MotiView>
  );
}

/* ------------------------------------------------------------------ */
/* Summary header card                                                 */
/* ------------------------------------------------------------------ */

function SummaryCard({
  doneToday,
  total,
  bestStreak,
  weekRate,
}: {
  doneToday: number;
  total: number;
  bestStreak: number;
  weekRate: number;
}) {
  const todayFraction = total > 0 ? doneToday / total : 0;
  const allDone = total > 0 && doneToday === total;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 380 }}
      style={{ marginBottom: 22 }}
    >
      <SoftCard radius={radii.cardLg} padding={22}>
        <View className="flex-row items-center" style={{ gap: 20 }}>
          <ProgressRing
            progress={todayFraction}
            size={104}
            stroke={11}
            color={colors.highlighter}
          >
            <AppText variant="heading" display weight="bold" style={{ fontSize: 30 }}>
              {doneToday}
            </AppText>
            <AppText
              variant="caption"
              color={colors.textMuted}
              style={{ fontSize: 11, marginTop: -2 }}
            >
              of {total}
            </AppText>
          </ProgressRing>

          <View style={{ flex: 1 }}>
            <AppText
              variant="caption"
              weight="semibold"
              color={colors.textSubtle}
              style={{ textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 11 }}
            >
              Today
            </AppText>
            <AppText variant="subheading" weight="bold" style={{ marginTop: 2 }}>
              {allDone ? 'All done — nice work' : `${doneToday} of ${total} complete`}
            </AppText>

            <View className="flex-row" style={{ gap: 10, marginTop: 14 }}>
              <View style={{ flex: 1 }}>
                <Neumorph variant="inset" radius={14} intensity="sm">
                  <View style={{ paddingVertical: 10, paddingHorizontal: 12 }}>
                    <View className="flex-row items-center" style={{ gap: 5 }}>
                      <Icon name="flame" size={13} color="peach" strokeWidth={2.4} />
                      <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 11 }}>
                        Best
                      </AppText>
                    </View>
                    <AppText variant="subheading" weight="bold" style={{ marginTop: 2 }}>
                      {bestStreak}
                    </AppText>
                  </View>
                </Neumorph>
              </View>

              <View style={{ flex: 1 }}>
                <Neumorph variant="inset" radius={14} intensity="sm">
                  <View style={{ paddingVertical: 10, paddingHorizontal: 12 }}>
                    <View className="flex-row items-center" style={{ gap: 5 }}>
                      <Icon name="trending-up" size={13} color="signal" strokeWidth={2.4} />
                      <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 11 }}>
                        Week
                      </AppText>
                    </View>
                    <AppText variant="subheading" weight="bold" style={{ marginTop: 2 }}>
                      {weekRate}%
                    </AppText>
                  </View>
                </Neumorph>
              </View>
            </View>
          </View>
        </View>
      </SoftCard>
    </MotiView>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function HabitsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [habits, setHabits] = useState<Habit[]>(() => mockHabits.map((h) => ({ ...h })));
  const [sheetOpen, setSheetOpen] = useState(false);

  const toggleToday = useCallback((id: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const nextDone = !h.completedToday;
        // Reflect today's flag in the last cell of the week grid and nudge the streak.
        const nextHistory = [...h.weekHistory];
        nextHistory[nextHistory.length - 1] = nextDone;
        return {
          ...h,
          completedToday: nextDone,
          weekHistory: nextHistory,
          streak: nextDone ? h.streak + 1 : Math.max(0, h.streak - 1),
        };
      }),
    );
  }, []);

  const addHabit = useCallback((habit: Habit) => {
    setHabits((prev) => [...prev, habit]);
    setSheetOpen(false);
  }, []);

  /* Derived summary stats. */
  const { doneToday, total, bestStreak, weekRate } = useMemo(() => {
    const totalCount = habits.length;
    const done = habits.filter((h) => h.completedToday).length;
    const best = habits.reduce((m, h) => Math.max(m, h.streak), 0);
    // Aggregate week-target attainment across all habits, capped per-habit at 100%.
    let attained = 0;
    let possible = 0;
    for (const h of habits) {
      const hits = h.weekHistory.filter(Boolean).length;
      attained += Math.min(hits, h.targetPerWeek);
      possible += h.targetPerWeek;
    }
    const rate = possible > 0 ? Math.round((attained / possible) * 100) : 0;
    return { doneToday: done, total: totalCount, bestStreak: best, weekRate: rate };
  }, [habits]);

  const isEmpty = habits.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 40,
        }}
      >
        {/* ---------- Top bar ---------- */}
        <View className="flex-row items-center justify-between">
          <SoftIconButton size={44} accessibilityLabel="Go back" onPress={() => router.back()}>
            <Icon name="chevron-left" size={22} color="carbon" />
          </SoftIconButton>
          <GrayMark size={24} />
          <SoftIconButton
            size={44}
            accessibilityLabel="Add habit"
            onPress={() => setSheetOpen(true)}
          >
            <Icon name="plus" size={20} color="carbon" strokeWidth={2.4} />
          </SoftIconButton>
        </View>

        {/* ---------- Header ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 360 }}
          style={{ marginTop: 18, marginBottom: 22 }}
        >
          <View className="flex-row items-center" style={{ gap: 7 }}>
            <Icon name="repeat" size={14} color="peach" strokeWidth={2.25} />
            <AppText
              variant="caption"
              weight="semibold"
              color={colors.textSubtle}
              style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 11 }}
            >
              Habits
            </AppText>
          </View>
          <AppText variant="heading" display weight="bold" style={{ marginTop: 6 }}>
            Build your{'\n'}daily rhythm
          </AppText>
        </MotiView>

        {/* ---------- Summary ---------- */}
        {!isEmpty ? (
          <SummaryCard
            doneToday={doneToday}
            total={total}
            bestStreak={bestStreak}
            weekRate={weekRate}
          />
        ) : null}

        {/* ---------- List ---------- */}
        {isEmpty ? (
          <EmptyState onAdd={() => setSheetOpen(true)} />
        ) : (
          <>
            <View className="flex-row items-center" style={{ gap: 8, marginBottom: 14 }}>
              <Icon name="list" size={16} color="carbon" strokeWidth={2.2} />
              <AppText
                variant="caption"
                weight="bold"
                color={colors.textMuted}
                style={{ textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 12 }}
              >
                Your habits
              </AppText>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.hairline }} />
              <Tag label={`${total}`} tone="neutral" size="sm" />
            </View>

            {habits.map((habit, i) => (
              <HabitCard key={habit.id} habit={habit} index={i} onToggle={toggleToday} />
            ))}

            {/* Add-another affordance */}
            <Pressable
              onPress={() => setSheetOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Add habit"
              style={{ marginTop: 4 }}
            >
              <SoftCard variant="inset" radius={radii.card} padding={18}>
                <View className="flex-row items-center justify-center" style={{ gap: 10 }}>
                  <Icon name="plus-circle" size={20} color="textMuted" strokeWidth={2.2} />
                  <AppText variant="body" weight="medium" color={colors.textMuted}>
                    Add a habit
                  </AppText>
                </View>
              </SoftCard>
            </Pressable>
          </>
        )}
      </ScrollView>

      {/* ---------- Add sheet ---------- */}
      <AddHabitSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCreate={addHabit}
      />
    </View>
  );
}

const StyleSheetAbsoluteFill = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};
