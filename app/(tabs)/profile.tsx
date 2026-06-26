import React, { useMemo, useState } from 'react';
import { View, ScrollView, Image, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { SoftIconButton } from '@/components/ui/SoftIconButton';
import { Tag } from '@/components/ui/Tag';
import { Icon } from '@/components/ui/Icon';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { Select, type SelectOption } from '@/components/ui/Select';
import { GrayMark } from '@/components/ui/AppHeader';
import { Heatmap } from '@/components/Heatmap';

import {
  AnalyticsStat,
  WeeklyBars,
  PrefRow,
  SettingsRow,
  SectionHeader,
  StatTile,
  StreakHero,
  SocialButton,
} from '@/components/profile';

import {
  DiscordSvg,
  TwitterSvg,
  LinkedInSvg,
  MediumSvg,
} from '@/constants/brandAssets';

import { colors } from '@/theme/tokens';
import {
  mockProfile,
  mockStudySummary,
  mockDashboard,
  mockRevisions,
  mockHeatmap,
} from '@/data/mock';
import { useAuthStore } from '@/store/useAuthStore';

const TAB_BAR_SPACE = 120;

/** Heatmap window options — feeds the SegmentedTabs (string values for the API). */
const RANGE_OPTIONS: SegmentedOption<'30' | '90' | '365'>[] = [
  { value: '30', label: '30d' },
  { value: '90', label: '90d' },
  { value: '365', label: '1 year' },
];

/** Theme options — SegmentedTabs replaces any radio group. */
const THEME_OPTIONS: SegmentedOption<'light' | 'dark' | 'system'>[] = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: 'Auto', icon: 'sparkles' },
];

/** Week-start options — SegmentedTabs (no radios). */
const WEEK_START_OPTIONS: SegmentedOption<'mon' | 'sun'>[] = [
  { value: 'mon', label: 'Monday' },
  { value: 'sun', label: 'Sunday' },
];

/** Quiet-hours window options for the custom Select. */
const QUIET_WINDOW_OPTIONS: SelectOption<'22-7' | '22-8' | '23-8' | '0-9'>[] = [
  { value: '22-7', label: '10:00 PM – 7:00 AM', icon: 'moon' },
  { value: '22-8', label: '10:00 PM – 8:00 AM', icon: 'moon' },
  { value: '23-8', label: '11:00 PM – 8:00 AM', icon: 'moon' },
  { value: '0-9', label: '12:00 AM – 9:00 AM', icon: 'moon' },
];

/** Language options for the custom Select. */
const LANGUAGE_OPTIONS: SelectOption<'en' | 'es' | 'hi' | 'fr'>[] = [
  { value: 'en', label: 'English', icon: 'globe' },
  { value: 'es', label: 'Español', icon: 'globe' },
  { value: 'hi', label: 'हिन्दी', icon: 'globe' },
  { value: 'fr', label: 'Français', icon: 'globe' },
];

const SOCIALS = [
  { key: 'discord', Svg: DiscordSvg, tint: colors.signal, label: 'Discord' },
  { key: 'twitter', Svg: TwitterSvg, tint: colors.paper, label: 'X / Twitter' },
  { key: 'linkedin', Svg: LinkedInSvg, tint: colors.signal, label: 'LinkedIn' },
  { key: 'medium', Svg: MediumSvg, tint: colors.paper, label: 'Medium' },
] as const;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  // ----- Heatmap window -----
  const [range, setRange] = useState<'30' | '90' | '365'>('365');
  const rangeDays = Number(range);

  // ----- Notification preferences (local UI state) -----
  const [revisionReminders, setRevisionReminders] = useState(true);
  const [dailyGoalAlerts, setDailyGoalAlerts] = useState(true);
  const [habitReminders, setHabitReminders] = useState(false);
  const [quietHours, setQuietHours] = useState(true);
  const [quietWindow, setQuietWindow] =
    useState<'22-7' | '22-8' | '23-8' | '0-9'>('22-8');

  // ----- Preferences -----
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('light');
  const [weekStart, setWeekStart] = useState<'mon' | 'sun'>('mon');
  const [language, setLanguage] = useState<'en' | 'es' | 'hi' | 'fr'>('en');

  // ----- Derived analytics -----
  const analytics = useMemo(() => {
    const weekMinutes = mockStudySummary.totalMinutesThisWeek;
    const studyHours = (weekMinutes / 60).toFixed(1);

    const totalProblems = mockStudySummary.recentSessions.reduce(
      (sum, s) => sum + s.problemsSolved,
      0,
    );

    const dueToday = mockRevisions.filter((r) => r.dueToday).length;
    const revisionPct =
      mockRevisions.length > 0
        ? Math.round(
            ((mockRevisions.length - dueToday) / mockRevisions.length) * 100,
          )
        : 0;

    // Productivity score: blend goal completion, weekly consistency and avg.
    const goalRatio = Math.min(
      1,
      mockDashboard.solvedToday / Math.max(1, mockDashboard.dailyGoal),
    );
    const activeDays = mockStudySummary.weeklyMinutes.filter((m) => m > 0).length;
    const consistency = activeDays / 7;
    const avgRatio = Math.min(1, mockStudySummary.averageMinutesPerDay / 90);
    const score = Math.round(
      (goalRatio * 0.3 + consistency * 0.4 + avgRatio * 0.3) * 100,
    );

    return {
      studyHours,
      totalProblems,
      revisionPct,
      score,
      weeklyMinutes: mockStudySummary.weeklyMinutes,
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + TAB_BAR_SPACE,
          gap: 18,
        }}
      >
        {/* ---------- Top bar: brand + settings ---------- */}
        <View className="flex-row items-center justify-between">
          <GrayMark size={24} />
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <SoftIconButton
              size={44}
              accessibilityLabel="Open menu"
              onPress={() => router.push('/more')}
            >
              <Icon name="menu" size={20} color="carbon" />
            </SoftIconButton>
            <SoftIconButton
              size={44}
              accessibilityLabel="Settings"
              onPress={() => router.push('/settings')}
            >
              <Icon name="settings" size={20} color="carbon" />
            </SoftIconButton>
          </View>
        </View>

        {/* ---------- Profile header ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 160 }}
        >
          <SoftCard radius={32} padding={22}>
            <View className="flex-row items-center" style={{ gap: 16 }}>
              <Pressable accessibilityRole="button" accessibilityLabel="Edit avatar">
                <Neumorph variant="raised" radius={999} intensity="sm" padding={5}>
                  <Image
                    source={mockProfile.avatar}
                    style={{ width: 70, height: 70, borderRadius: 999 }}
                  />
                </Neumorph>
                {/* Edit badge overlay */}
                <View
                  style={{
                    position: 'absolute',
                    right: -2,
                    bottom: -2,
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.highlighter,
                    borderWidth: 2.5,
                    borderColor: colors.paper,
                  }}
                >
                  <Icon name="pen" size={12} color="carbon" strokeWidth={2.4} />
                </View>
              </Pressable>

              <View style={{ flex: 1, gap: 4 }}>
                <AppText variant="headingSm" weight="bold" display numberOfLines={1}>
                  {mockProfile.name}
                </AppText>
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  <Icon name="at-sign" size={13} color="textMuted" strokeWidth={2.2} />
                  <AppText variant="caption" color={colors.textMuted}>
                    {mockProfile.username}
                  </AppText>
                </View>
                <View
                  className="flex-row items-center"
                  style={{ gap: 6, marginTop: 5 }}
                >
                  <Tag label={`Level ${mockProfile.level}`} tone="yellow" size="sm" />
                  <Tag
                    label={`${mockProfile.xp.toLocaleString()} XP`}
                    tone="neutral"
                    size="sm"
                  />
                </View>
              </View>
            </View>

            {mockProfile.bio ? (
              <AppText
                variant="body"
                color={colors.textMuted}
                style={{ marginTop: 16, fontSize: 14, lineHeight: 21 }}
              >
                {mockProfile.bio}
              </AppText>
            ) : null}

            {/* Solved / goal / joined inline stats */}
            <View className="flex-row" style={{ marginTop: 18, gap: 12 }}>
              <StatTile value={`${mockProfile.totalSolved}`} label="solved" />
              <StatTile value={`${mockProfile.dailyGoal}/day`} label="goal" />
              <StatTile value={mockProfile.joinedAt.slice(0, 4)} label="joined" />
            </View>
          </SoftCard>
        </MotiView>

        {/* ---------- Streak summary ---------- */}
        <SoftCard radius={28} padding={18}>
          <StreakHero
            streak={mockProfile.streak}
            longestStreak={mockProfile.longestStreak}
          />
        </SoftCard>

        {/* ---------- Feature menu ---------- */}
        <SoftCard radius={32} padding={20}>
          <SectionHeader
            icon="layers"
            title="Your toolkit"
            subtitle="Jump into any Kivo feature"
            right={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open menu hub"
                onPress={() => router.push('/more')}
              >
                <Tag label="See all" tone="neutral" size="sm" />
              </Pressable>
            }
          />
          <View style={{ marginTop: 10 }}>
            <SettingsRow
              icon="bell"
              title="Notifications"
              onPress={() => router.push('/notifications')}
              tint="#ffe6dd"
            />
            <SettingsRow
              icon="trophy"
              title="Achievements"
              onPress={() => router.push('/achievements')}
              tint={colors.highlighter}
            />
            <SettingsRow
              icon="chart"
              title="Analytics"
              onPress={() => router.push('/analytics')}
              tint="#e1e8ff"
            />
            <SettingsRow
              icon="book"
              title="Reflections"
              onPress={() => router.push('/reflections')}
              tint="#dff5e8"
            />
            <SettingsRow
              icon="settings"
              title="Settings"
              onPress={() => router.push('/settings')}
              last
            />
          </View>
        </SoftCard>

        {/* ---------- Weekly analytics ---------- */}
        <SoftCard radius={32} padding={20}>
          <SectionHeader
            icon="activity"
            title="This week"
            subtitle={`${mockStudySummary.sessionsThisWeek} sessions · ${mockStudySummary.averageMinutesPerDay}m avg / day`}
            right={<Tag label={`${analytics.score} score`} tone="success" size="sm" />}
          />

          {/* Weekly focus bars */}
          <View style={{ marginTop: 18 }}>
            <WeeklyBars weeklyMinutes={analytics.weeklyMinutes} todayIndex={5} />
          </View>

          {/* Stat tiles */}
          <View className="flex-row" style={{ marginTop: 18, gap: 12 }}>
            <AnalyticsStat
              icon="clock"
              value={analytics.studyHours}
              unit="h"
              label="study time"
              tint={colors.highlighter}
              index={0}
            />
            <AnalyticsStat
              icon="check-circle"
              value={`${analytics.totalProblems}`}
              label="problems"
              tint="#dff5e8"
              iconColor="success"
              index={1}
            />
          </View>
          <View className="flex-row" style={{ marginTop: 12, gap: 12 }}>
            <AnalyticsStat
              icon="repeat"
              value={`${analytics.revisionPct}`}
              unit="%"
              label="revisions done"
              tint="#e1e8ff"
              iconColor="signal"
              index={2}
            />
            <AnalyticsStat
              icon="zap"
              value={`${analytics.score}`}
              unit="pts"
              label="productivity"
              tint="#ffe6dd"
              iconColor="peach"
              index={3}
            />
          </View>
        </SoftCard>

        {/* ---------- Activity heatmap ---------- */}
        <SoftCard radius={32} padding={20}>
          <SectionHeader
            icon="flame"
            title="Activity"
            subtitle={`${mockProfile.totalSolved} contributions`}
          />

          <View style={{ marginTop: 16 }}>
            <SegmentedTabs
              options={RANGE_OPTIONS}
              value={range}
              onChange={setRange}
              height={44}
            />
          </View>

          <View style={{ marginTop: 18 }}>
            <Heatmap
              data={mockHeatmap}
              range={rangeDays}
              cellSize={rangeDays <= 30 ? 22 : rangeDays <= 90 ? 14 : 11}
              gap={rangeDays <= 30 ? 5 : 3}
            />
          </View>
        </SoftCard>

        {/* ---------- Notification preferences ---------- */}
        <SoftCard radius={32} padding={20}>
          <SectionHeader
            icon="bell"
            title="Notifications"
            subtitle="Choose what reaches you"
          />

          <View style={{ marginTop: 6 }}>
            <PrefRow
              icon="repeat"
              title="Revision reminders"
              subtitle="Ping me when spaced reviews are due"
              value={revisionReminders}
              onValueChange={setRevisionReminders}
              tint={colors.signal}
            />
            <PrefRow
              icon="target"
              title="Daily goal alerts"
              subtitle={`Nudge if I'm short of ${mockProfile.dailyGoal} solves`}
              value={dailyGoalAlerts}
              onValueChange={setDailyGoalAlerts}
            />
            <PrefRow
              icon="dumbbell"
              title="Habit reminders"
              subtitle="Keep my daily habits on track"
              value={habitReminders}
              onValueChange={setHabitReminders}
              tint={colors.peach}
            />
            <PrefRow
              icon="moon"
              title="Quiet hours"
              subtitle="Mute all alerts overnight"
              value={quietHours}
              onValueChange={setQuietHours}
              tint={colors.signal}
              last
            />
          </View>

          {/* Quiet-hours window — revealed only when quiet hours is on */}
          {quietHours ? (
            <MotiView
              key="quiet-window"
              from={{ opacity: 0, translateY: -6 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 220 }}
              style={{ marginTop: 14 }}
            >
              <Select
                label="Mute window"
                title="Quiet hours window"
                options={QUIET_WINDOW_OPTIONS}
                value={quietWindow}
                onChange={setQuietWindow}
              />
            </MotiView>
          ) : null}
        </SoftCard>

        {/* ---------- Theme & preferences ---------- */}
        <SoftCard radius={32} padding={20}>
          <SectionHeader
            icon="settings"
            title="Preferences"
            subtitle="Make Kivo yours"
          />

          {/* Theme — SegmentedTabs (no radio group) */}
          <View style={{ marginTop: 16, gap: 8 }}>
            <AppText variant="caption" weight="medium" color={colors.textMuted} style={{ marginLeft: 4 }}>
              Appearance
            </AppText>
            <SegmentedTabs options={THEME_OPTIONS} value={themeMode} onChange={setThemeMode} />
          </View>

          {/* Week starts on — SegmentedTabs */}
          <View style={{ marginTop: 16, gap: 8 }}>
            <AppText variant="caption" weight="medium" color={colors.textMuted} style={{ marginLeft: 4 }}>
              Week starts on
            </AppText>
            <SegmentedTabs options={WEEK_START_OPTIONS} value={weekStart} onChange={setWeekStart} />
          </View>

          {/* Language — custom Select */}
          <View style={{ marginTop: 16 }}>
            <Select
              label="Language"
              title="App language"
              options={LANGUAGE_OPTIONS}
              value={language}
              onChange={setLanguage}
            />
          </View>

          {/* Tappable rows */}
          <View style={{ marginTop: 10 }}>
            <SettingsRow icon="lock" title="Privacy & data" onPress={() => {}} tint="#e1e8ff" />
            <SettingsRow icon="help" title="Help & support" onPress={() => {}} tint="#dff5e8" />
            <SettingsRow icon="info" title="About Kivo" value="v1.0.0" onPress={() => {}} />
            <SettingsRow
              icon="log-out"
              title="Log out"
              onPress={() => {
                logout();
                router.replace('/(auth)/welcome');
              }}
              danger
              last
            />
          </View>
        </SoftCard>

        {/* ---------- Social / community ---------- */}
        <View className="items-center" style={{ marginTop: 4, gap: 14 }}>
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <Icon name="heart" size={14} color="annotation" strokeWidth={2.4} />
            <AppText variant="caption" weight="medium" color={colors.textMuted}>
              Join the Kivo community
            </AppText>
          </View>
          <View className="flex-row" style={{ gap: 14 }}>
            {SOCIALS.map(({ key, Svg, tint, label }) => (
              <SocialButton
                key={key}
                Svg={Svg}
                tint={tint}
                accessibilityLabel={label}
                onPress={() => {}}
              />
            ))}
          </View>
          <AppText
            variant="caption"
            color={colors.textSubtle}
            style={{ fontSize: 11, marginTop: 2 }}
          >
            Member since {mockProfile.joinedAt}
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}
