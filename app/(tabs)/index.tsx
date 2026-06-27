/**
 * Dashboard (Home) tab — STEEP.
 *
 * A calm, editorial morning view: a small serif greeting, ONE warm data card
 * (today's goal on the apricot wash with the streak as a rust key stat),
 * compact white stat tiles, a single cool focus card, and a tight "continue"
 * list. Color is punctuation — the chrome is monochrome Ink/Graphite; the two
 * washes + Rust carry the only data accents. Exactly one filled Ink pill CTA
 * (Start focus timer); every other action is a TextLink.
 *
 * Wired to the live `useDashboard` hook with loading skeleton + error + empty
 * states. An API failure can never crash the screen — the hook normalises
 * errors and we render from its flags.
 */
import React, { useCallback, useMemo } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui/Typography';
import { Card, WarmCard, CoolCard } from '@/components/ui/SoftCard';
import { Icon } from '@/components/ui/Icon';
import { PillButton, TextLink } from '@/components/ui/PillButton';
import { GrayMark } from '@/components/ui/AppHeader';

import {
  SectionHeader,
  StreakChip,
  StatCard,
  GoalRing,
  ProgressBar,
  ContinueRow,
  EmptyState,
  ErrorState,
  DashboardSkeleton,
} from '@/components/dashboard/DashboardParts';

import { colors, spacing, radii } from '@/theme/tokens';
import { useDashboard } from '@/hooks/api';
import { useAuthStore } from '@/store/useAuthStore';

/* ================================================================== */
/* Local helpers                                                       */
/* ================================================================== */

/** Time-aware salutation following the real device clock. */
function greetingForHour(hour: number): string {
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Winding down';
}

/** "Friday, Jun 27" from the real device clock. */
function formatToday(d: Date): string {
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  return `${weekday}, ${month} ${d.getDate()}`;
}

function firstName(name?: string | null): string {
  if (!name) return 'there';
  const trimmed = name.trim();
  if (!trimmed) return 'there';
  return trimmed.split(/\s+/)[0];
}

/* ================================================================== */
/* Screen                                                              */
/* ================================================================== */

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, error, refetch, isRefetching } = useDashboard();

  const now = new Date();
  const greeting = greetingForHour(now.getHours());
  const name = firstName(user?.name);

  /* ---- Derived figures (safe even before data arrives) ------------ */

  const goalPct = useMemo(() => {
    if (!data) return 0;
    return Math.round((data.solvedToday / Math.max(1, data.dailyGoal)) * 100);
  }, [data]);

  const focusHours = useMemo(() => {
    if (!data) return '0.0';
    return (data.focusMinutesToday / 60).toFixed(1);
  }, [data]);

  const remaining = data ? Math.max(0, data.dailyGoal - data.solvedToday) : 0;
  const continueTopics = data?.continueTopics ?? [];

  /* ---- Navigation ------------------------------------------------- */

  const goRevisions = useCallback(() => router.push('/(tabs)/revisions'), [router]);
  const goTracker = useCallback(() => router.push('/(tabs)/tracker'), [router]);
  const goDsa = useCallback(() => router.push('/(tabs)/dsa'), [router]);
  const goMore = useCallback(() => router.push('/more'), [router]);
  const goFocusTimer = useCallback(() => router.push('/focus-timer'), [router]);

  /* ---- Shared chrome (header + scroll frame) ---------------------- */

  const renderBody = () => {
    if (isLoading) return <DashboardSkeleton />;

    if (isError) {
      // Never surface a raw error object — derive a plain string message only.
      const errorMessage = error?.isNetwork
        ? 'Check your connection and try again.'
        : typeof error?.message === 'string' && error.message
          ? error.message
          : 'Something went wrong.';
      return <ErrorState message={errorMessage} onRetry={() => void refetch()} />;
    }

    if (!data) {
      return (
        <Card variant="inset" padding={spacing.xl}>
          <EmptyState
            icon="rocket"
            title="Nothing here yet"
            subtitle="Solve a problem or start a session to see your day take shape."
          />
        </Card>
      );
    }

    return (
      <View style={{ gap: spacing.xl }}>
        {/* ============================================================ */}
        {/* Today — the single warm data card                            */}
        {/* ============================================================ */}
        <View>
          <SectionHeader title="Today" actionLabel="Revisions" onAction={goRevisions} />
          <WarmCard radius={radii.cardLg} padding={spacing.md}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
              <GoalRing progress={goalPct} size={60} stroke={5}>
                <View style={{ alignItems: 'center' }}>
                  <AppText variant="heading" display weight="medium" color={colors.rust} style={{ lineHeight: 20 }}>
                    {data.solvedToday}
                  </AppText>
                  <AppText variant="caption" color={colors.rust} style={{ fontSize: 10, marginTop: -1 }}>
                    of {data.dailyGoal}
                  </AppText>
                </View>
              </GoalRing>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="target" size={14} color="rust" weight="light" />
                  <AppText variant="subheading" weight="medium" color={colors.ink}>
                    {goalPct >= 100 ? 'Daily goal complete' : 'Daily goal in progress'}
                  </AppText>
                </View>
                <AppText variant="caption" color={colors.ash} style={{ marginTop: 2 }}>
                  {goalPct >= 100
                    ? 'Nicely done — the goal is in the bag.'
                    : `${remaining} more problem${remaining === 1 ? '' : 's'} to go.`}
                </AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 }}>
                  <Icon name="flame" size={13} color="rust" weight="fill" />
                  <AppText variant="caption" weight="medium" color={colors.rust} style={{ fontSize: 11 }}>
                    {data.streak}-day streak
                  </AppText>
                </View>
              </View>
            </View>
          </WarmCard>
        </View>

        {/* ============================================================ */}
        {/* At a glance — compact white stat tiles                       */}
        {/* ============================================================ */}
        <View>
          <SectionHeader title="At a glance" />
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <StatCard
              value={data.revisionsDueToday}
              label="Revisions due"
              icon="repeat"
              tone="warm"
              accent={data.revisionsDueToday > 0}
              onPress={goRevisions}
            />
            <StatCard
              value={data.openTasks}
              label="Open tasks"
              icon="check-square"
              tone="cool"
              onPress={goTracker}
            />
            <StatCard
              value={data.solvedToday}
              unit={`/ ${data.dailyGoal}`}
              label="Solved"
              icon="check-circle"
            />
          </View>
        </View>

        {/* ============================================================ */}
        {/* Focus — the single cool data card                            */}
        {/* ============================================================ */}
        <View>
          <SectionHeader title="Focus" actionLabel="Tracker" onAction={goTracker} />
          <CoolCard radius={radii.cardLg} padding={spacing.md}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <AppText variant="headingLg" display weight="medium" color={colors.ink}>
                    {focusHours}
                  </AppText>
                  <AppText variant="caption" color={colors.ash} style={{ fontSize: 11 }}>
                    hrs
                  </AppText>
                </View>
                <AppText variant="caption" color={colors.ash} style={{ marginTop: 2 }}>
                  Focused today
                </AppText>
              </View>
              <Icon name="timer" size={16} color="rust" weight="light" />
            </View>
            <View style={{ marginTop: spacing.md }}>
              <PillButton label="Start focus timer" onPress={goFocusTimer} size="sm" />
            </View>
          </CoolCard>
        </View>

        {/* ============================================================ */}
        {/* Continue — tight DSA list                                    */}
        {/* ============================================================ */}
        <View>
          <SectionHeader title="Continue" actionLabel="All topics" onAction={goDsa} />
          <Card padding={spacing.md}>
            {continueTopics.length > 0 ? (
              continueTopics.slice(0, 3).map((topic, i, arr) => (
                <ContinueRow
                  key={topic.id}
                  title={topic.title}
                  progress={topic.progress}
                  icon={topic.emoji}
                  showDivider={i < arr.length - 1}
                  onPress={() => router.push(`/dsa-topic/${topic.id}`)}
                />
              ))
            ) : (
              <EmptyState
                title="You're all caught up"
                subtitle="No topics in progress — pick a new one to begin."
              />
            )}
          </Card>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: 130,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={colors.graphite}
          />
        }
      >
        {/* ============================================================ */}
        {/* Header — gray mark + streak chip + menu link                 */}
        {/* ============================================================ */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <GrayMark size={22} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            {data ? <StreakChip count={data.streak} /> : null}
            <TextLink label="Menu" onPress={goMore} muted size="sm" />
          </View>
        </View>

        {/* ============================================================ */}
        {/* Greeting — small serif headline                              */}
        {/* ============================================================ */}
        <View style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}>
          <AppText
            variant="caption"
            weight="medium"
            color={colors.graphite}
            style={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 11 }}
          >
            {formatToday(now)}
          </AppText>
          <AppText variant="display" display weight="medium" style={{ marginTop: 6 }}>
            {greeting}, {name}
          </AppText>
        </View>

        {renderBody()}
      </ScrollView>
    </View>
  );
}
