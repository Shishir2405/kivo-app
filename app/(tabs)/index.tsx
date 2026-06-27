/**
 * Dashboard (Home) tab — Kivo.
 *
 * A calm, warm editorial morning view, matching the HTML "Dashboard & live
 * navigation" frame: a small serif greeting with a streak chip + avatar, an
 * italic quote card, a peach "Today" goal card (stat row + daily-goal bar), a
 * 2x2 grid of soft-wash "At a glance" tiles (each with a matching accent icon
 * chip), a quiet "Up next" timeline, and a dark "Continue" banner. Exactly one
 * filled terracotta CTA (Start focus timer); every other action is a TextLink.
 *
 * Fully dark-aware — all color comes from useTheme(); every section fades + lifts
 * in with a small stagger. Wired to the live `useDashboard` hook with loading
 * skeleton + error + empty states. An API failure can never crash the screen.
 */
import React, { useCallback, useMemo } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui/Typography';
import { PillButton, TextLink } from '@/components/ui/PillButton';

import {
  Entrance,
  SectionHeader,
  StreakChip,
  AvatarInitial,
  QuoteCard,
  TodayCard,
  GlanceTile,
  QuickAddChip,
  TimelineRow,
  ContinueBanner,
  ContinueRow,
  EmptyState,
  ErrorState,
  DashboardSkeleton,
} from '@/components/dashboard/DashboardParts';

import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme';
import { useDashboard, useProfile } from '@/hooks/api';
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

/** "Mon 12 May" from the real device clock. */
function formatToday(d: Date): string {
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  return `${weekday} ${d.getDate()} ${month}`;
}

/**
 * Resolve a friendly first name for the greeting. Prefers the real profile /
 * auth name, then falls back to the first part of the email, then "there".
 */
function resolveFirstName(name?: string | null, email?: string | null): string {
  const trimmedName = name?.trim();
  if (trimmedName) return trimmedName.split(/\s+/)[0];

  const localPart = email?.trim().split('@')[0];
  if (localPart) {
    // Normalise "first.last" / "first_last" to just the first token.
    const token = localPart.split(/[._-]+/)[0];
    if (token) return token.charAt(0).toUpperCase() + token.slice(1);
  }

  return 'there';
}

/* ================================================================== */
/* Screen                                                              */
/* ================================================================== */

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();

  const user = useAuthStore((s) => s.user);
  const { data: profile } = useProfile();
  const { data, isLoading, isError, error, refetch, isRefetching } = useDashboard();

  const now = new Date();
  const greeting = greetingForHour(now.getHours());
  const name = resolveFirstName(
    profile?.name ?? user?.name,
    profile?.email ?? user?.email,
  );

  /* ---- Derived figures (safe even before data arrives) ------------ */

  const goalPct = useMemo(() => {
    if (!data) return 0;
    return Math.round((data.solvedToday / Math.max(1, data.dailyGoal)) * 100);
  }, [data]);

  const focusHours = useMemo(() => {
    if (!data) return '0.0';
    return (data.focusMinutesToday / 60).toFixed(1);
  }, [data]);

  const continueTopics = data?.continueTopics ?? [];

  /* ---- Navigation ------------------------------------------------- */

  const goRevisions = useCallback(() => router.push('/(tabs)/revisions'), [router]);
  const goTracker = useCallback(() => router.push('/(tabs)/tracker'), [router]);
  const goDsa = useCallback(() => router.push('/(tabs)/dsa'), [router]);
  const goMore = useCallback(() => router.push('/more'), [router]);
  const goFocusTimer = useCallback(() => router.push('/focus-timer'), [router]);

  /* ---- Body ------------------------------------------------------- */

  const renderBody = () => {
    if (isLoading) return <DashboardSkeleton />;

    if (isError) {
      const errorMessage = error?.isNetwork
        ? 'Check your connection and try again.'
        : typeof error?.message === 'string' && error.message
          ? error.message
          : 'Something went wrong.';
      return <ErrorState message={errorMessage} onRetry={() => void refetch()} />;
    }

    if (!data) {
      return (
        <EmptyState
          icon="rocket"
          title="Nothing here yet"
          subtitle="Solve a problem or start a session to see your day take shape."
          iconColor={colors.lavenderAccent}
        />
      );
    }

    const nextTopic = continueTopics[0];

    return (
      <View style={{ gap: spacing.xl }}>
        {/* ---- Quote --------------------------------------------------- */}
        <Entrance index={0}>
          <QuoteCard text={data.quote.text} author={data.quote.author} />
        </Entrance>

        {/* ---- Today goal card ---------------------------------------- */}
        <Entrance index={1}>
          <TodayCard
            dateLabel={formatToday(now)}
            stats={[
              { value: data.revisionsDueToday, label: 'revisions' },
              { value: data.openTasks, label: 'tasks' },
              { value: `${focusHours}h`, label: 'focus' },
            ]}
            goalPct={goalPct}
          />
        </Entrance>

        {/* ---- At a glance — 2x2 wash grid ---------------------------- */}
        <Entrance index={2}>
          <View>
            <SectionHeader title="At a glance" />
            <View style={{ gap: spacing.md }}>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <GlanceTile
                  value={focusHours}
                  unit="h"
                  label="studied today"
                  icon="clock"
                  tone="sky"
                  onPress={goTracker}
                />
                <GlanceTile
                  value={data.solvedToday}
                  label="problems solved"
                  icon="check-circle"
                  tone="mint"
                  onPress={goDsa}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <GlanceTile
                  value={data.openTasks}
                  label="open tasks"
                  icon="check-square"
                  tone="lavender"
                  onPress={goTracker}
                />
                <GlanceTile
                  value={`${goalPct}%`}
                  label="daily goal"
                  icon="repeat"
                  tone="butter"
                  onPress={goRevisions}
                />
              </View>
            </View>
          </View>
        </Entrance>

        {/* ---- Quick add ---------------------------------------------- */}
        <Entrance index={3}>
          <View>
            <SectionHeader title="Quick add" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              <QuickAddChip label="Task" onPress={goTracker} />
              <QuickAddChip label="Note" onPress={goMore} />
              <QuickAddChip label="Timer" onPress={goFocusTimer} />
              <QuickAddChip label="Reminder" onPress={goTracker} />
            </View>
          </View>
        </Entrance>

        {/* ---- Continue — DSA progress list --------------------------- */}
        <Entrance index={4}>
          <View>
            <SectionHeader title="Continue" actionLabel="All topics" onAction={goDsa} />
            {continueTopics.length > 0 ? (
              <View>
                {continueTopics.slice(0, 3).map((topic, i, arr) => (
                  <ContinueRow
                    key={topic.id}
                    title={topic.title}
                    progress={topic.progress}
                    icon={topic.emoji}
                    showDivider={i < arr.length - 1}
                    onPress={() => router.push(`/dsa-topic/${topic.id}`)}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                title="You're all caught up"
                subtitle="No topics in progress — pick a new one to begin."
              />
            )}
          </View>
        </Entrance>

        {/* ---- Up next timeline --------------------------------------- */}
        <Entrance index={5}>
          <View>
            <SectionHeader title="Up next" />
            <TimelineRow
              title={`Revise · ${data.revisionsDueToday} due`}
              meta="Spaced review queue"
              time="9:30"
              active
              onPress={goRevisions}
            />
            <TimelineRow
              title={`${data.openTasks} open task${data.openTasks === 1 ? '' : 's'}`}
              meta="Tracker"
              time="11:00"
              onPress={goTracker}
            />
            <TimelineRow
              title="Deep focus block"
              meta={`Goal · ${focusHours}h today`}
              time="16:00"
              isLast
              onPress={goFocusTimer}
            />
          </View>
        </Entrance>

        {/* ---- Continue banner + the single CTA ----------------------- */}
        <Entrance index={6}>
          <View style={{ gap: spacing.md }}>
            {nextTopic ? (
              <ContinueBanner
                eyebrow="Continue where you left off"
                title={nextTopic.title}
                icon={nextTopic.emoji}
                onPress={() => router.push(`/dsa-topic/${nextTopic.id}`)}
              />
            ) : null}
            <PillButton label="Start focus timer" onPress={goFocusTimer} fullWidth />
          </View>
        </Entrance>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
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
            tintColor={colors.muted}
          />
        }
      >
        {/* ---- Header — menu link ------------------------------------- */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            minHeight: 22,
          }}
        >
          <TextLink label="Menu" onPress={goMore} muted size="sm" />
        </View>

        {/* ---- Greeting — eyebrow + serif name + streak + avatar ------ */}
        <Entrance index={0}>
          <View
            style={{
              marginTop: spacing.lg,
              marginBottom: spacing.xl,
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1 }}>
              <AppText variant="caption" weight="medium" color={colors.muted} style={{ fontSize: 13 }}>
                {greeting}
              </AppText>
              <AppText variant="headingLg" display weight="medium" style={{ marginTop: 4 }}>
                {name}
              </AppText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              {data ? <StreakChip count={data.streak} /> : null}
              <AvatarInitial name={name} />
            </View>
          </View>
        </Entrance>

        {renderBody()}
      </ScrollView>
    </View>
  );
}
