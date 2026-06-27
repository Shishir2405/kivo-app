/**
 * Analytics (Steep).
 *
 * The weekly productivity report. A serif title + the week label, the
 * productivity score as the hero figure, two warm/cool data cards (study hours
 * + problems solved), flat completion-rate meters, a streak data line, the
 * coach recommendations, and a quiet contribution heatmap. All data from
 * `/analytics/weekly`, `/analytics/streaks` and `/analytics/heatmap` — every
 * request renders a loading / error / empty state and can never crash the app.
 */
import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui/Typography';
import { Card, WarmCard, CoolCard } from '@/components/ui/SoftCard';
import { TextLink } from '@/components/ui/PillButton';
import { Icon } from '@/components/ui/Icon';
import { AppHeader } from '@/components/ui/AppHeader';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { RateBars } from '@/components/analytics/ProductivityChart';

import { Eyebrow, SectionLabel, StateBlock } from '@/components/account/SteepParts';
import { SteepHeatmap } from '@/components/account/SteepHeatmap';
import {
  useWeeklyReport,
  useStreaks,
  useHeatmap,
  type HeatmapRange,
} from '@/components/account/accountApi';

import { colors, spacing } from '@/theme/tokens';

const RANGE_OPTIONS: SegmentedOption<HeatmapRange>[] = [
  { value: '30', label: '30d' },
  { value: '90', label: '90d' },
  { value: '365', label: '1 year' },
];

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const weekly = useWeeklyReport();
  const streaks = useStreaks();
  const [range, setRange] = useState<HeatmapRange>('365');
  const heatmap = useHeatmap(range);

  const w = weekly.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
      >
        <AppHeader
          title="Analytics"
          onBack={() => router.back()}
          right={
            <TextLink
              label="Calendar"
              onPress={() => router.push('/calendar')}
              icon={<Icon name="calendar" size={16} color="ink" weight="light" />}
            />
          }
        />

        {/* ---------- Hero: week label + score ---------- */}
        {weekly.isLoading ? (
          <StateBlock kind="loading" style={{ marginTop: spacing.lg }} />
        ) : weekly.isError ? (
          <StateBlock
            kind="error"
            title="Couldn't load your report"
            message={weekly.error?.message}
            onRetry={() => weekly.refetch()}
            style={{ marginTop: spacing.lg }}
          />
        ) : w ? (
          <>
            <View style={{ marginTop: spacing.md, marginBottom: spacing.xl, gap: 2 }}>
              <Eyebrow label={`Week of ${w.label}`} />
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <AppText variant="display" display weight="medium">
                  {w.productivityScore}
                </AppText>
                <AppText variant="subheading" color={colors.graphite}>
                  / 100 productivity
                </AppText>
              </View>
            </View>

            {/* ---------- Key data cards ---------- */}
            <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl }}>
              <CoolCard style={{ flex: 1 }} padding={spacing.lg}>
                <Icon name="clock" size={16} color="ink" weight="light" />
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: spacing.sm }}>
                  <AppText variant="headingLg" display weight="medium">
                    {w.studyHours.toFixed(1)}
                  </AppText>
                  <AppText variant="caption" color={colors.ash}>
                    h
                  </AppText>
                </View>
                <AppText variant="caption" color={colors.ash} style={{ marginTop: 1 }}>
                  {w.focusSessions} focus sessions
                </AppText>
              </CoolCard>

              <WarmCard style={{ flex: 1 }} padding={spacing.lg}>
                <Icon name="code" size={16} color="rust" weight="light" />
                <AppText variant="headingLg" display weight="medium" color={colors.rust} style={{ marginTop: spacing.sm }}>
                  {w.problemsSolved}
                </AppText>
                <AppText variant="caption" color={colors.rust} style={{ marginTop: 1 }}>
                  problems · {w.topicsCompleted} topics
                </AppText>
              </WarmCard>
            </View>

            {/* ---------- Completion rates ---------- */}
            <SectionLabel title="Completion" />
            <Card padding={spacing.lg} style={{ marginBottom: spacing.xl }}>
              <RateBars
                rows={[
                  { label: 'Revisions', value: w.revisionRate },
                  { label: 'Tasks', value: w.taskRate },
                  { label: 'Habits', value: w.habitRate },
                ]}
              />
            </Card>
          </>
        ) : null}

        {/* ---------- Streaks ---------- */}
        <SectionLabel title="Streaks" />
        <Card padding={spacing.lg} style={{ marginBottom: spacing.xl }}>
          {streaks.isLoading ? (
            <StateBlock kind="loading" />
          ) : streaks.isError ? (
            <StateBlock kind="error" message={streaks.error?.message} onRetry={() => streaks.refetch()} />
          ) : streaks.data ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <StreakStat value={streaks.data.currentDailyStreak} label="current daily" />
              <Sep />
              <StreakStat value={streaks.data.longestDailyStreak} label="best daily" />
              <Sep />
              <StreakStat value={streaks.data.currentWeeklyStreak} label="current weekly" />
              <Sep />
              <StreakStat value={streaks.data.longestWeeklyStreak} label="best weekly" />
            </View>
          ) : null}
        </Card>

        {/* ---------- Recommendations ---------- */}
        {w && w.recommendations.length > 0 ? (
          <>
            <SectionLabel title="Coach notes" />
            <Card padding={spacing.lg} style={{ marginBottom: spacing.xl }}>
              {w.recommendations.slice(0, 5).map((rec, i) => (
                <View
                  key={rec}
                  style={{
                    flexDirection: 'row',
                    gap: spacing.md,
                    paddingTop: i === 0 ? 0 : spacing.md,
                    paddingBottom: i === Math.min(4, w.recommendations.length - 1) ? 0 : spacing.md,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: colors.dove,
                  }}
                >
                  <AppText variant="caption" display weight="medium" color={colors.rust} style={{ width: 16 }}>
                    {i + 1}
                  </AppText>
                  <AppText variant="body" color={colors.ash} style={{ flex: 1 }}>
                    {rec}
                  </AppText>
                </View>
              ))}
            </Card>
          </>
        ) : null}

        {/* ---------- Activity heatmap ---------- */}
        <SectionLabel title="Consistency" />
        <Card padding={spacing.lg}>
          <View style={{ marginBottom: spacing.lg }}>
            <SegmentedTabs options={RANGE_OPTIONS} value={range} onChange={setRange} height={36} />
          </View>
          {heatmap.isLoading ? (
            <StateBlock kind="loading" />
          ) : heatmap.isError ? (
            <StateBlock kind="error" message={heatmap.error?.message} onRetry={() => heatmap.refetch()} />
          ) : (heatmap.data?.cells.length ?? 0) === 0 ? (
            <View style={{ paddingVertical: spacing.lg, alignItems: 'center', gap: spacing.xs }}>
              <AppText variant="subheading" weight="medium" color={colors.ash}>
                No activity yet
              </AppText>
              <AppText variant="caption" color={colors.graphite} style={{ textAlign: 'center' }}>
                Your contribution grid fills as you study.
              </AppText>
            </View>
          ) : (
            <>
              <SteepHeatmap cells={heatmap.data!.cells} range={Number(range)} />
              <AppText variant="caption" color={colors.graphite} style={{ marginTop: spacing.md }}>
                {heatmap.data!.totalContributions} contributions · {heatmap.data!.activeDays} active days
              </AppText>
            </>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Local streak stat                                                   */
/* ------------------------------------------------------------------ */

function StreakStat({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 1, flex: 1 }}>
      <AppText variant="heading" display weight="medium">
        {value}
      </AppText>
      <AppText variant="caption" color={colors.graphite} numberOfLines={1} style={{ fontSize: 10 }}>
        {label}
      </AppText>
    </View>
  );
}

function Sep() {
  return <View style={{ width: 1, backgroundColor: colors.dove, marginVertical: 2 }} />;
}
