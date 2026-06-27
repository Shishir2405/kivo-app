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
import { View, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard, CoolCard } from '@/components/ui/SoftCard';
import { Tag } from '@/components/ui/Tag';
import { PillButton, TextLink } from '@/components/ui/PillButton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { AppHeader } from '@/components/ui/AppHeader';
import { ProgressRing } from '@/components/habits/ProgressRing';
import { Skeleton, SkeletonText } from '@/components/ui';

import { radii, toneAt, motion } from '@/theme/tokens';
import { useTheme } from '@/theme';
import { useHabits } from '@/hooks/api';
import type { Habit } from '@/types/models';

/* ------------------------------------------------------------------ */
/* Weekly completion square grid                                       */
/*                                                                     */
/* The HTML habit card shows the week as a flush row of seven equal    */
/* squares (radius 5, gap 5): a day done filled with the habit's accent,*/
/* a missed day on a faint cream tile. No day letters — the grid is a   */
/* quiet completion glyph, not a calendar.                              */
/* ------------------------------------------------------------------ */

function WeekGrid({ history, accent, miss }: { history: boolean[]; accent: string; miss: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 5 }}>
      {history.map((done, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            aspectRatio: 1,
            borderRadius: 5,
            backgroundColor: done ? accent : miss,
          }}
        />
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Habit card                                                          */
/* ------------------------------------------------------------------ */

function HabitCard({ habit, onToggle, toneIndex }: { habit: Habit; onToggle: (id: string) => void; toneIndex: number }) {
  const { colors, toneStyle } = useTheme();
  const tone = toneAt(toneIndex);
  const ts = toneStyle(tone);
  const done = habit.completedToday;

  return (
    <SoftCard radius={radii.cardLg} padding={14} style={{ marginBottom: 12 }}>
      {/* Top row: colored glyph tile + title/streak + flat complete toggle */}
      <View className="flex-row items-center" style={{ gap: 11, marginBottom: 12 }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: ts.bg,
          }}
        >
          <Icon name={habit.emoji} size={16} color={ts.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="subheading" weight="semibold" numberOfLines={1}>
            {habit.title}
          </AppText>
          <View className="flex-row items-center" style={{ gap: 4, marginTop: 1 }}>
            {habit.streak > 0 ? (
              <Icon name="flame" size={11} color="rust" weight="fill" />
            ) : null}
            <AppText variant="caption" color={colors.muted}>
              {habit.streak > 0 ? `${habit.streak} day streak` : 'Not done yet'}
            </AppText>
          </View>
        </View>

        {/* Flat 26px tile toggle — accent + check when done, hairline when not. */}
        <Pressable
          onPress={() => onToggle(habit.id)}
          accessibilityRole="button"
          accessibilityState={{ selected: done }}
          accessibilityLabel={`Mark ${habit.title} ${done ? 'incomplete' : 'complete'} for today`}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: done ? ts.accent : colors.surface,
              borderWidth: done ? 0 : 1.5,
              borderColor: colors.hairline,
            }}
          >
            {done ? <Icon name="check" size={14} color="white" weight="bold" /> : null}
          </View>
        </Pressable>
      </View>

      {/* Weekly completion square grid (oldest -> newest). */}
      <WeekGrid history={habit.weekHistory} accent={ts.accent} miss={colors.hairline} />
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
  const { colors } = useTheme();
  return (
    <SoftCard variant="inset" radius={radii.cardLg} padding={24}>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Icon name={icon} size={22} color="graphite" />
        <AppText variant="subheading" weight="medium" style={{ textAlign: 'center' }}>
          {title}
        </AppText>
        <AppText variant="body" color={colors.muted} style={{ textAlign: 'center', maxWidth: 280 }}>
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
  const { colors } = useTheme();
  const todayFraction = total > 0 ? doneToday / total : 0;
  const allDone = total > 0 && doneToday === total;

  return (
    <CoolCard radius={radii.cardLg} padding={16} style={{ marginBottom: 16 }}>
    {({ accent }) => (
      <View className="flex-row items-center" style={{ gap: 16 }}>
        <ProgressRing progress={todayFraction} size={84} stroke={8} color={accent}>
          <AppText variant="headingLg" display weight="semibold" color={accent}>
            {doneToday}
          </AppText>
          <AppText variant="caption" color={colors.muted} style={{ marginTop: -2 }}>
            of {total}
          </AppText>
        </ProgressRing>

        <View style={{ flex: 1 }}>
          <AppText variant="caption" color={colors.muted} style={{ letterSpacing: 0.6, textTransform: 'uppercase' }}>
            Today
          </AppText>
          <AppText variant="subheading" weight="medium" style={{ marginTop: 2 }}>
            {allDone ? 'All done — nice work' : `${doneToday} of ${total} complete`}
          </AppText>
          <View className="flex-row" style={{ gap: 16, marginTop: 10 }}>
            <View>
              <AppText variant="caption" color={colors.muted}>
                Best streak
              </AppText>
              <AppText variant="subheading" weight="medium">
                {bestStreak}
              </AppText>
            </View>
            <View>
              <AppText variant="caption" color={colors.muted}>
                Week
              </AppText>
              <AppText variant="subheading" weight="medium">
                {weekRate}%
              </AppText>
            </View>
          </View>
        </View>
      </View>
    )}
    </CoolCard>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function HabitsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();

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
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
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
            tintColor={colors.muted}
          />
        }
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: motion.duration.transition }}
          className="flex-row items-end justify-between"
          style={{ marginBottom: 16 }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <AppText variant="display" display weight="semibold">
              Habits
            </AppText>
            <AppText variant="body" color={colors.muted} style={{ marginTop: 4 }}>
              {isError ? 'Couldn’t load your habits' : 'Build a daily rhythm'}
            </AppText>
          </View>
          {!isError && !isLoading && habits.length > 0 ? (
            <PillButton label="Add" size="sm" onPress={() => refetch()} icon={<Icon name="plus" size={15} color="white" />} />
          ) : null}
        </MotiView>

        {/* States */}
        {isError ? (
          <CenterNote
            icon="alert"
            title="Something went wrong"
            body={error?.message ?? 'We couldn’t reach the server. Pull to refresh or try again.'}
            action={<TextLink label="Try again" onPress={() => void refetch()} icon={<Icon name="repeat" size={14} color="ink" />} />}
          />
        ) : isLoading ? (
          <View style={{ gap: 12 }}>
            {/* Summary skeleton */}
            <SoftCard radius={radii.cardLg} padding={16}>
              <View className="flex-row items-center" style={{ gap: 16 }}>
                <Skeleton width={84} height={84} circle />
                <View style={{ flex: 1, gap: 8 }}>
                  <Skeleton width="40%" height={11} radius={6} />
                  <Skeleton width="75%" height={14} radius={6} />
                  <SkeletonText lines={1} lineHeight={11} lastWidth="55%" />
                </View>
              </View>
            </SoftCard>
            {/* Habit card skeletons */}
            {[0, 1, 2].map((i) => (
              <SoftCard key={i} radius={radii.cardLg} padding={14}>
                <View className="flex-row items-center" style={{ gap: 11, marginBottom: 12 }}>
                  <Skeleton width={34} height={34} radius={10} />
                  <View style={{ flex: 1, gap: 7 }}>
                    <Skeleton width="65%" height={14} radius={6} />
                    <Skeleton width="40%" height={11} radius={6} />
                  </View>
                  <Skeleton width={26} height={26} radius={8} />
                </View>
                <View className="flex-row" style={{ gap: 5 }}>
                  {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                    <View key={d} style={{ flex: 1 }}>
                      <Skeleton width="100%" height={34} radius={5} />
                    </View>
                  ))}
                </View>
              </SoftCard>
            ))}
          </View>
        ) : habits.length === 0 ? (
          <CenterNote
            icon="repeat"
            title="No habits yet"
            body="Add a routine and check it off each day to grow a streak. Consistency over intensity."
          />
        ) : (
          <>
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: motion.duration.transition, delay: 60 }}
            >
              <SummaryCard doneToday={doneToday} total={total} bestStreak={bestStreak} weekRate={weekRate} />

              <View className="flex-row items-center" style={{ gap: 8, marginBottom: 12 }}>
                <AppText variant="heading" display weight="medium">
                  Your habits
                </AppText>
                <View style={{ flex: 1 }} />
                <Tag label={`${total}`} tone="neutral" size="sm" />
              </View>
            </MotiView>

            {habits.map((habit, i) => (
              <MotiView
                key={habit.id}
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: 'timing',
                  duration: motion.duration.transition,
                  delay: 120 + i * 50,
                }}
              >
                <HabitCard habit={habit} onToggle={toggleToday} toneIndex={i} />
              </MotiView>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
