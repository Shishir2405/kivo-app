/**
 * Dashboard (Home) tab.
 *
 * The morning command-center: a welcome header (brand mark + time-aware greeting
 * + streak), a daily quote, Today's Overview (goal ring + metric tiles), an
 * at-a-glance stat carousel, Quick Actions, a Heatmap preview, the weekly focus
 * mini-chart, and the Upcoming Schedule.
 *
 * Everything is composed from the Aaply neumorphic kit (SoftCard / Neumorph /
 * Icon / Tag / Heatmap) + the dashboard-namespaced building blocks in
 * `@/components/dashboard/DashboardParts`. ZERO emoji — every glyph is a vector
 * `Icon`. No new visual language is invented; this is layout + data wiring
 * against the enriched mock.
 */
import React, { useCallback, useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Tag, type TagTone } from '@/components/ui/Tag';
import { Heatmap } from '@/components/Heatmap';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { GrayMark } from '@/components/ui/AppHeader';
import { SoftIconButton } from '@/components/ui/SoftIconButton';

import {
  SectionHeader,
  StatCard,
  OverviewTile,
  ScheduleRow,
  QuickAction,
  ProgressRing,
  ProgressBar,
  WeeklyBars,
  ContinueRow,
  StreakChip,
  EmptyState,
  Chevron,
  accentInk,
  type Accent,
} from '@/components/dashboard/DashboardParts';

import { colors, radii } from '@/theme/tokens';
import {
  TODAY,
  mockProfile,
  mockDashboard,
  mockQuote,
  mockHeatmap,
  mockRevisions,
  mockTasks,
  mockStudySummary,
} from '@/data/mock';
import type { Difficulty, Task } from '@/types/models';

/* ================================================================== */
/* Local helpers                                                       */
/* ================================================================== */

/**
 * Time-aware greeting. The *data* stays pinned to TODAY, but the salutation can
 * follow the real device clock so it reads naturally at any hour. Also returns
 * a matching sun/moon icon for the header.
 */
function greetingForHour(hour: number): { text: string; icon: IconName } {
  if (hour < 5) return { text: 'Burning the midnight oil', icon: 'moon' };
  if (hour < 12) return { text: 'Good morning', icon: 'sun' };
  if (hour < 17) return { text: 'Good afternoon', icon: 'sun' };
  if (hour < 21) return { text: 'Good evening', icon: 'sun' };
  return { text: 'Winding down', icon: 'moon' };
}

/** "Friday · Jun 26" from the pinned ISO TODAY (UTC, deterministic). */
function formatToday(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  const month = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  return `${weekday} · ${month} ${d.getUTCDate()}`;
}

const DIFFICULTY_TONE: Record<Difficulty, TagTone> = {
  EASY: 'success',
  MEDIUM: 'peach',
  HARD: 'annotation',
};

/** Category -> icon + accent for schedule/task rows. */
const CATEGORY_META: Record<Task['category'], { icon: IconName; accent: Accent }> = {
  DSA: { icon: 'code', accent: 'signal' },
  PROJECT: { icon: 'folder', accent: 'peach' },
  REVISION: { icon: 'repeat', accent: 'highlighter' },
  OTHER: { icon: 'pin', accent: 'annotation' },
};

const WEEK_BAR_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/* ================================================================== */
/* Screen                                                              */
/* ================================================================== */

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const profileName = mockProfile.name.split(' ')[0];
  const greeting = greetingForHour(new Date().getHours());

  const d = mockDashboard;

  /* ---- Derived figures (deterministic from the mock) -------------- */

  const goalPct = useMemo(
    () => Math.round((d.solvedToday / Math.max(1, d.dailyGoal)) * 100),
    [d.solvedToday, d.dailyGoal],
  );

  const openTasks = useMemo(() => mockTasks.filter((t) => !t.done), []);
  const doneTasks = useMemo(() => mockTasks.filter((t) => t.done).length, []);

  const dueRevisions = useMemo(() => mockRevisions.filter((r) => r.dueToday), []);

  // Revision completion % across all scheduled revisions (mastery proxy).
  const revisionPct = useMemo(() => {
    const total = mockRevisions.length;
    const notDue = total - dueRevisions.length;
    return total ? Math.round((notDue / total) * 100) : 0;
  }, [dueRevisions.length]);

  const studyHours = useMemo(() => (d.focusMinutesToday / 60).toFixed(1), [d.focusMinutesToday]);

  // Weekly score: blend of consistency + volume, capped 0–100 (deterministic).
  const weeklyScore = useMemo(() => {
    const days = mockStudySummary.weeklyMinutes.filter((m) => m > 0).length;
    const minutesScore = Math.min(70, Math.round(mockStudySummary.totalMinutesThisWeek / 12));
    return Math.min(100, days * 5 + minutesScore);
  }, []);

  // Heatmap solved-day count for the preview subtitle (last 90 days).
  const activeDays90 = useMemo(
    () =>
      mockHeatmap
        .slice(Math.max(0, mockHeatmap.length - 90))
        .filter((h) => h.count > 0).length,
    [],
  );

  const remindersToday = useMemo(
    () => dueRevisions.length + openTasks.filter((t) => t.dueDate === TODAY).length,
    [dueRevisions.length, openTasks],
  );

  /* ---- Upcoming schedule (revisions due + open tasks merged) ------ */

  const schedule = useMemo(() => {
    const revItems = dueRevisions.map((r) => ({
      key: `rev_${r.id}`,
      icon: 'repeat' as IconName,
      accent: 'highlighter' as Accent,
      title: r.problemTitle,
      meta: `Revision · ${r.topicTitle}`,
      difficulty: r.difficulty as Difficulty | undefined,
      isRevision: true,
    }));
    const taskItems = openTasks.map((t) => {
      const cm = CATEGORY_META[t.category];
      return {
        key: `task_${t.id}`,
        icon: t.icon ?? cm.icon,
        accent: cm.accent,
        title: t.title,
        meta:
          t.dueDate === TODAY
            ? `Task · Due today · ${t.priority.toLowerCase()}`
            : `Task · ${t.category.toLowerCase()}`,
        difficulty: undefined as Difficulty | undefined,
        isRevision: false,
      };
    });
    return [...revItems, ...taskItems].slice(0, 5);
  }, [dueRevisions, openTasks]);

  /* ---- Navigation helpers ----------------------------------------- */

  const goRevisions = useCallback(() => router.push('/(tabs)/revisions'), [router]);
  const goTracker = useCallback(() => router.push('/(tabs)/tracker'), [router]);
  const goProfile = useCallback(() => router.push('/(tabs)/profile'), [router]);
  const goMore = useCallback(() => router.push('/more'), [router]);
  const goNotes = useCallback(() => router.push('/notes'), [router]);
  const goResources = useCallback(() => router.push('/resources'), [router]);
  const goFocusTimer = useCallback(() => router.push('/focus-timer'), [router]);
  const goCalendar = useCallback(() => router.push('/calendar'), [router]);
  const goNotifications = useCallback(() => router.push('/notifications'), [router]);

  /* ---- Quick actions ---------------------------------------------- */

  const quickActions: Array<{
    key: string;
    label: string;
    icon: IconName;
    onPress: () => void;
    accent?: boolean;
  }> = [
    { key: 'note', label: 'Add Note', icon: 'notebook-pen', onPress: goNotes },
    { key: 'resource', label: 'Resource', icon: 'book-open', onPress: goResources },
    { key: 'timer', label: 'Start Timer', icon: 'timer', onPress: goFocusTimer, accent: true },
    { key: 'calendar', label: 'Calendar', icon: 'calendar', onPress: goCalendar },
    { key: 'reminder', label: 'Reminder', icon: 'bell', onPress: goNotifications },
  ];

  /* ---- Quick-stat cards ------------------------------------------- */

  const stats: Array<{
    icon: IconName;
    value: string;
    unit?: string;
    label: string;
    accent: Accent;
    trend?: string;
  }> = [
    { icon: 'timer', value: studyHours, unit: 'h', label: 'Focus today', accent: 'signal' },
    {
      icon: 'check-circle',
      value: `${d.solvedToday}`,
      unit: `/ ${d.dailyGoal}`,
      label: 'Problems solved',
      accent: 'highlighter',
    },
    {
      icon: 'clipboard',
      value: `${doneTasks}`,
      unit: `/ ${mockTasks.length}`,
      label: 'Tasks completed',
      accent: 'peach',
    },
    { icon: 'repeat', value: `${revisionPct}`, unit: '%', label: 'Revisions on track', accent: 'success' },
    { icon: 'trending-up', value: `${weeklyScore}`, label: 'Weekly score', accent: 'annotation', trend: 'this wk' },
  ];

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
        {/* ============================================================ */}
        {/* Welcome header                                               */}
        {/* ============================================================ */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 360 }}
        >
          <View className="flex-row items-center justify-between">
            <GrayMark size={26} />
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <StreakChip count={d.streak} size="md" />
              <SoftIconButton size={44} accessibilityLabel="Open menu" onPress={goMore}>
                <Icon name="menu" size={20} color="carbon" />
              </SoftIconButton>
            </View>
          </View>

          <View style={{ marginTop: 18 }}>
            <View className="flex-row items-center" style={{ gap: 7 }}>
              <Icon name={greeting.icon} size={14} color="peach" strokeWidth={2.25} />
              <AppText
                variant="caption"
                weight="semibold"
                color={colors.textSubtle}
                style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 11 }}
              >
                {formatToday(TODAY)}
              </AppText>
            </View>
            <AppText
              variant="heading"
              display
              weight="bold"
              color={colors.carbon}
              style={{ marginTop: 6 }}
            >
              {greeting.text},{'\n'}
              {profileName}
            </AppText>
          </View>
        </MotiView>

        {/* Daily quote */}
        <SoftCard
          variant="inset"
          radius={radii.card}
          intensity="sm"
          padding={18}
          style={{ marginTop: 18, marginBottom: 28 }}
        >
          <View className="flex-row" style={{ gap: 12 }}>
            <View style={{ width: 4, borderRadius: 2, backgroundColor: colors.highlighter }} />
            <View style={{ flex: 1 }}>
              <Icon name="sparkles" size={15} color="highlighter" fill="highlighter" strokeWidth={2} />
              <AppText
                variant="body"
                weight="medium"
                color={colors.carbon}
                style={{ fontStyle: 'italic', lineHeight: 23, marginTop: 8 }}
              >
                {mockQuote.text}
              </AppText>
              <AppText
                variant="caption"
                weight="semibold"
                color={colors.textMuted}
                style={{ marginTop: 8 }}
              >
                {mockQuote.author}
              </AppText>
            </View>
          </View>
        </SoftCard>

        {/* ============================================================ */}
        {/* Today's Overview                                             */}
        {/* ============================================================ */}
        <SectionHeader title="Today's Overview" icon="target" accent="highlighter" />
        <SoftCard radius={radii.cardLg} intensity="md" padding={18} style={{ marginBottom: 28 }}>
          {/* Daily goal ring */}
          <View className="flex-row items-center" style={{ gap: 16, marginBottom: 18 }}>
            <ProgressRing progress={goalPct} size={72} stroke={8} accent="highlighter">
              <View className="items-center">
                <AppText variant="subheading" weight="bold" style={{ fontSize: 20 }}>
                  {d.solvedToday}
                </AppText>
                <AppText
                  variant="caption"
                  color={colors.textMuted}
                  style={{ fontSize: 10, marginTop: -2 }}
                >
                  of {d.dailyGoal}
                </AppText>
              </View>
            </ProgressRing>
            <View style={{ flex: 1 }}>
              <AppText variant="body" weight="bold">
                Daily goal {goalPct >= 100 ? 'complete' : 'in progress'}
              </AppText>
              <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 3 }}>
                {goalPct >= 100
                  ? 'Nice — goal smashed for today.'
                  : `${Math.max(0, d.dailyGoal - d.solvedToday)} more problem${
                      d.dailyGoal - d.solvedToday === 1 ? '' : 's'
                    } to hit your goal.`}
              </AppText>
              <ProgressBar progress={goalPct} accent="highlighter" style={{ marginTop: 10 }} />
            </View>
          </View>

          {/* Overview tiles grid (2 columns) */}
          <View className="flex-row flex-wrap" style={{ gap: 12 }}>
            <OverviewTile
              style={{ width: '47.5%', flexGrow: 1 }}
              icon="repeat"
              value={`${d.revisionsDueToday}`}
              label="Revisions due"
              accent="peach"
              onPress={goRevisions}
            />
            <OverviewTile
              style={{ width: '47.5%', flexGrow: 1 }}
              icon="check-square"
              value={`${d.openTasks}`}
              label="Open tasks"
              accent="signal"
              onPress={goTracker}
            />
            <OverviewTile
              style={{ width: '47.5%', flexGrow: 1 }}
              icon="bell"
              value={`${remindersToday}`}
              label="Reminders today"
              accent="annotation"
              onPress={goRevisions}
            />
            <OverviewTile
              style={{ width: '47.5%', flexGrow: 1 }}
              icon="timer"
              value={`${studyHours}h`}
              label="Focused today"
              accent="highlighter"
              onPress={goTracker}
            />
          </View>
        </SoftCard>

        {/* ============================================================ */}
        {/* Quick-stat cards row                                         */}
        {/* ============================================================ */}
        <SectionHeader title="At a Glance" icon="activity" accent="signal" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingRight: 4 }}
          style={{ marginBottom: 28, marginHorizontal: -2, paddingHorizontal: 2 }}
        >
          {stats.map((s) => (
            <StatCard
              key={s.label}
              icon={s.icon}
              value={s.value}
              unit={s.unit}
              label={s.label}
              accent={s.accent}
              trend={s.trend}
              style={{ width: 150 }}
            />
          ))}
        </ScrollView>

        {/* ============================================================ */}
        {/* Quick Actions                                                */}
        {/* ============================================================ */}
        <SectionHeader title="Quick Actions" icon="zap" accent="highlighter" />
        <View className="flex-row items-start justify-between" style={{ marginBottom: 28 }}>
          {quickActions.map((a) => (
            <QuickAction
              key={a.key}
              icon={a.icon}
              label={a.label}
              accent={a.accent}
              onPress={a.onPress}
              style={{ width: '18%' }}
            />
          ))}
        </View>

        {/* ============================================================ */}
        {/* Heatmap preview                                              */}
        {/* ============================================================ */}
        <SectionHeader
          title="Activity"
          icon="flame"
          accent="peach"
          actionLabel="Profile"
          onAction={goProfile}
        />
        <SoftCard radius={radii.cardLg} intensity="md" padding={18} style={{ marginBottom: 28 }}>
          <View className="flex-row items-end justify-between" style={{ marginBottom: 14 }}>
            <View>
              <AppText variant="subheading" weight="bold">
                {activeDays90} active days
              </AppText>
              <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 2 }}>
                in the last 90 days · {mockProfile.longestStreak} day best streak
              </AppText>
            </View>
            <StreakChip count={d.streak} size="sm" flat />
          </View>
          <Heatmap data={mockHeatmap} range={119} cellSize={12} gap={3} showWeekdayLabels showLegend />
        </SoftCard>

        {/* ============================================================ */}
        {/* Weekly focus mini-chart                                      */}
        {/* ============================================================ */}
        <SectionHeader title="This Week" icon="chart" accent="success" />
        <SoftCard radius={radii.card} intensity="md" padding={18} style={{ marginBottom: 28 }}>
          <View className="flex-row items-baseline justify-between" style={{ marginBottom: 16 }}>
            <View className="flex-row items-baseline" style={{ gap: 6 }}>
              <AppText variant="heading" weight="bold" style={{ fontSize: 28, lineHeight: 30 }}>
                {(mockStudySummary.totalMinutesThisWeek / 60).toFixed(1)}
              </AppText>
              <AppText variant="caption" weight="semibold" color={colors.textMuted}>
                hrs focused
              </AppText>
            </View>
            <Tag
              label={`avg ${mockStudySummary.averageMinutesPerDay}m / day`}
              tone="neutral"
              size="sm"
              icon={<Icon name="clock" size={12} color={colors.textMuted} strokeWidth={2.25} />}
            />
          </View>
          <WeeklyBars
            values={mockStudySummary.weeklyMinutes}
            labels={WEEK_BAR_LABELS}
            highlightIndex={5}
          />
        </SoftCard>

        {/* ============================================================ */}
        {/* Upcoming Schedule                                            */}
        {/* ============================================================ */}
        <SectionHeader
          title="Upcoming Schedule"
          icon="calendar"
          accent="annotation"
          actionLabel="All"
          onAction={goTracker}
        />
        <SoftCard radius={radii.cardLg} intensity="md" padding={18}>
          {schedule.length > 0 ? (
            schedule.map((item, i) => (
              <ScheduleRow
                key={item.key}
                icon={item.icon}
                accent={item.accent}
                title={item.title}
                meta={item.meta}
                showDivider={i < schedule.length - 1}
                onPress={item.isRevision ? goRevisions : goTracker}
                trailing={
                  item.difficulty ? (
                    <Tag
                      label={item.difficulty}
                      tone={DIFFICULTY_TONE[item.difficulty]}
                      size="sm"
                    />
                  ) : (
                    <Chevron />
                  )
                }
              />
            ))
          ) : (
            <EmptyState
              icon="check-circle"
              title="You're all caught up"
              subtitle="Nothing scheduled — go get ahead."
              accent="success"
            />
          )}

          {/* Continue where you left off */}
          <View
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: colors.hairline,
            }}
          >
            <View className="flex-row items-center" style={{ gap: 6, marginBottom: 12 }}>
              <Icon name="play" size={12} color={accentInk('signal')} fill={accentInk('signal')} strokeWidth={2} />
              <AppText
                variant="caption"
                weight="semibold"
                color={colors.textSubtle}
                style={{ textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 10 }}
              >
                Continue where you left off
              </AppText>
            </View>
            {d.continueTopics.slice(0, 2).map((topic) => (
              <ContinueRow
                key={topic.id}
                icon={topic.emoji}
                title={topic.title}
                progress={topic.progress}
                accent="signal"
                onPress={() => router.push(`/dsa-topic/${topic.id}`)}
              />
            ))}
          </View>
        </SoftCard>

        {/* Footer signature */}
        <View className="items-center" style={{ marginTop: 24 }}>
          <BrandLogo variant="lockup" size={16} color={colors.textSubtle} />
          <AppText
            variant="caption"
            color={colors.textSubtle}
            style={{ marginTop: 8, fontSize: 11 }}
          >
            One problem a day. Keep the streak alive.
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}
