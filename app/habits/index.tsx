/**
 * Habit tracker (STEEP) — stack route `/habits`.
 *
 * Wired to the live `/habits` endpoint via `useHabits()`. Editorial + flat: a
 * serif title, a Sky-wash hero summary with a small Rust progress ring, and
 * compact white habit Cards (Dove hairline + one subtle shadow). Each card shows
 * the week's completion as a thin 7-dot row, a current streak, the week target,
 * and a flat Checkbox to mark today done (optimistic local state). ONE Ink pill
 * CTA (Add habit). Loading / error / empty states come from the query flags so
 * a failed request never crashes the app.
 */
import React, { useMemo, useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui/Typography';
import { SoftCard, CoolCard } from '@/components/ui/SoftCard';
import { Checkbox } from '@/components/ui/Checkbox';
import { Tag } from '@/components/ui/Tag';
import { PillButton, TextLink } from '@/components/ui/PillButton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { AppHeader } from '@/components/ui/AppHeader';
import { ProgressRing } from '@/components/habits/ProgressRing';

import { colors, radii } from '@/theme/tokens';
import { useHabits } from '@/hooks/api';
import type { Habit } from '@/types/models';

const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/* ------------------------------------------------------------------ */
/* Weekly completion dot row                                           */
/* ------------------------------------------------------------------ */

function WeekDots({ history }: { history: boolean[] }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {history.map((done, i) => {
        const isToday = i === history.length - 1;
        return (
          <View key={i} style={{ alignItems: 'center', gap: 5 }}>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 7,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: done ? colors.ink : colors.white,
                borderWidth: 1,
                borderColor: done ? colors.ink : colors.dove,
              }}
            >
              {done ? (
                <Icon name="check" size={11} color="white" weight="bold" />
              ) : isToday ? (
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.dove }} />
              ) : null}
            </View>
            <AppText variant="caption" color={isToday ? colors.ink : colors.graphite}>
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

function HabitCard({ habit, onToggle }: { habit: Habit; onToggle: (id: string) => void }) {
  const doneThisWeek = habit.weekHistory.filter(Boolean).length;
  const weekProgress = habit.targetPerWeek > 0 ? doneThisWeek / habit.targetPerWeek : 0;
  const pct = Math.min(100, Math.round(weekProgress * 100));

  return (
    <SoftCard radius={radii.card} padding={14} style={{ marginBottom: 10 }}>
      {/* Top row: icon + title + ring */}
      <View className="flex-row items-center" style={{ gap: 12 }}>
        <Icon name={habit.emoji} size={18} color="graphite" />
        <View style={{ flex: 1 }}>
          <AppText variant="subheading" weight="medium" numberOfLines={1}>
            {habit.title}
          </AppText>
          <AppText variant="caption" color={colors.graphite} style={{ marginTop: 1 }}>
            {doneThisWeek}/{habit.targetPerWeek} this week
          </AppText>
        </View>
        <ProgressRing
          progress={weekProgress}
          size={46}
          stroke={5}
          color={colors.rust}
          trackColor={colors.fog}
        >
          <AppText variant="caption" weight="medium">
            {pct}%
          </AppText>
        </ProgressRing>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: colors.fog, marginVertical: 12 }} />

      {/* Week dots */}
      <WeekDots history={habit.weekHistory} />

      {/* Bottom row: streak + mark today */}
      <View className="flex-row items-center justify-between" style={{ marginTop: 12 }}>
        <View className="flex-row items-center" style={{ gap: 5 }}>
          <Icon name="flame" size={14} color="rust" />
          <AppText variant="caption" color={colors.ash}>
            {habit.streak}-day streak
          </AppText>
        </View>
        <Checkbox
          checked={habit.completedToday}
          onChange={() => onToggle(habit.id)}
          label={habit.completedToday ? 'Done today' : 'Mark today'}
        />
      </View>
    </SoftCard>
  );
}

/* ------------------------------------------------------------------ */
/* State block                                                         */
/* ------------------------------------------------------------------ */

function CenterNote({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <SoftCard variant="inset" radius={radii.cardLg} padding={24}>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Icon name={icon} size={22} color="graphite" />
        <AppText variant="subheading" weight="medium" style={{ textAlign: 'center' }}>
          {title}
        </AppText>
        <AppText variant="body" color={colors.ash} style={{ textAlign: 'center', maxWidth: 280 }}>
          {body}
        </AppText>
        {action ? <View style={{ marginTop: 4 }}>{action}</View> : null}
      </View>
    </SoftCard>
  );
}

/* ------------------------------------------------------------------ */
/* Summary card                                                        */
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
    <CoolCard radius={radii.cardLg} padding={16} style={{ marginBottom: 16 }}>
      <View className="flex-row items-center" style={{ gap: 16 }}>
        <ProgressRing progress={todayFraction} size={84} stroke={8} color={colors.rust} trackColor="rgba(23,25,28,0.08)">
          <AppText variant="headingLg" display weight="semibold">
            {doneToday}
          </AppText>
          <AppText variant="caption" color={colors.ash} style={{ marginTop: -2 }}>
            of {total}
          </AppText>
        </ProgressRing>

        <View style={{ flex: 1 }}>
          <AppText variant="caption" color={colors.ash} style={{ letterSpacing: 0.6, textTransform: 'uppercase' }}>
            Today
          </AppText>
          <AppText variant="subheading" weight="medium" style={{ marginTop: 2 }}>
            {allDone ? 'All done — nice work' : `${doneToday} of ${total} complete`}
          </AppText>
          <View className="flex-row" style={{ gap: 16, marginTop: 10 }}>
            <View>
              <AppText variant="caption" color={colors.ash}>
                Best streak
              </AppText>
              <AppText variant="subheading" weight="medium">
                {bestStreak}
              </AppText>
            </View>
            <View>
              <AppText variant="caption" color={colors.ash}>
                Week
              </AppText>
              <AppText variant="subheading" weight="medium">
                {weekRate}%
              </AppText>
            </View>
          </View>
        </View>
      </View>
    </CoolCard>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function HabitsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data, isLoading, isError, error, refetch, isFetching } = useHabits();

  // Optimistic local toggles layered over fetched data.
  const [toggles, setToggles] = useState<Record<string, boolean>>({});

  const habits = useMemo<Habit[]>(() => {
    const list = Array.isArray(data) ? data.filter(Boolean) : [];
    return list.map((h) => {
      if (!(h.id in toggles)) return h;
      const nextDone = toggles[h.id];
      if (nextDone === h.completedToday) return h;
      const nextHistory = [...h.weekHistory];
      nextHistory[nextHistory.length - 1] = nextDone;
      return {
        ...h,
        completedToday: nextDone,
        weekHistory: nextHistory,
        streak: nextDone ? h.streak + 1 : Math.max(0, h.streak - 1),
      };
    });
  }, [data, toggles]);

  const toggleToday = useCallback((id: string) => {
    setToggles((prev) => {
      const base = (Array.isArray(data) ? data : []).find((h) => h.id === id)?.completedToday ?? false;
      const current = prev[id] ?? base;
      return { ...prev, [id]: !current };
    });
  }, [data]);

  const { doneToday, total, bestStreak, weekRate } = useMemo(() => {
    const totalCount = habits.length;
    const done = habits.filter((h) => h.completedToday).length;
    const best = habits.reduce((m, h) => Math.max(m, h.streak), 0);
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={{ paddingHorizontal: 20 }}>
        <AppHeader onBack={() => router.back()} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: insets.bottom + 40,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => void refetch()}
            tintColor={colors.graphite}
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-end justify-between" style={{ marginBottom: 16 }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <AppText variant="display" display weight="semibold">
              Habits
            </AppText>
            <AppText variant="body" color={colors.ash} style={{ marginTop: 4 }}>
              {isError ? 'Couldn’t load your habits' : 'Build a daily rhythm'}
            </AppText>
          </View>
          {!isError && !isLoading && habits.length > 0 ? (
            <PillButton label="Add" size="sm" onPress={() => refetch()} icon={<Icon name="plus" size={15} color="white" />} />
          ) : null}
        </View>

        {/* States */}
        {isError ? (
          <CenterNote
            icon="alert"
            title="Something went wrong"
            body={error?.message ?? 'We couldn’t reach the server. Pull to refresh or try again.'}
            action={<TextLink label="Try again" onPress={() => void refetch()} icon={<Icon name="repeat" size={14} color="ink" />} />}
          />
        ) : isLoading ? (
          <SoftCard variant="inset" radius={radii.cardLg} padding={28}>
            <View style={{ alignItems: 'center', gap: 12 }}>
              <ActivityIndicator color={colors.ink} />
              <AppText variant="caption" color={colors.graphite}>
                Loading your habits…
              </AppText>
            </View>
          </SoftCard>
        ) : habits.length === 0 ? (
          <CenterNote
            icon="repeat"
            title="No habits yet"
            body="Add a routine and check it off each day to grow a streak. Consistency over intensity."
          />
        ) : (
          <>
            <SummaryCard doneToday={doneToday} total={total} bestStreak={bestStreak} weekRate={weekRate} />

            <View className="flex-row items-center" style={{ gap: 8, marginBottom: 12 }}>
              <AppText variant="heading" display weight="medium">
                Your habits
              </AppText>
              <View style={{ flex: 1 }} />
              <Tag label={`${total}`} tone="neutral" size="sm" />
            </View>

            {habits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} onToggle={toggleToday} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
