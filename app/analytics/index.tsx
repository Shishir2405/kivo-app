/**
 * Weekly Analytics — the insights report screen.
 *
 * A calm, scannable productivity report built entirely from the Aaply kit on
 * the graphite-mist canvas. From top to bottom:
 *   - back bar + header with the live productivity score and its week-over-week
 *     delta as a Tag,
 *   - a range SegmentedTabs (This week / 30d / 90d / 365d) that re-scopes the
 *     trend chart + heatmap window (NO radios),
 *   - a 2×2 grid of KPI SoftCards (study hours, problems solved, revision rate,
 *     productivity score) each with an inset accent glyph and a delta hint,
 *   - a neumorphic bar/line chart of the productivity trend (ProductivityChart,
 *     Views + reanimated, no chart lib),
 *   - strongest / weakest topic cards,
 *   - a numbered recommendations list,
 *   - the contribution Heatmap scoped to the active range.
 *
 * The active WeeklyReport is the latest (`mockWeeklyReport`); the range tabs are
 * a presentation control over the trend/heatmap windows. Local state only —
 * shared mocks are read, never mutated. ZERO emoji; all glyphs via <Icon />.
 */
import React, { useMemo, useState } from 'react';
import { View, ScrollView, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { SoftIconButton } from '@/components/ui/SoftIconButton';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { Icon, type IconName } from '@/components/ui/Icon';
import { GrayMark } from '@/components/ui/AppHeader';
import { Tag, type TagTone } from '@/components/ui/Tag';
import { Heatmap } from '@/components/Heatmap';
import { ProductivityChart } from '@/components/analytics/ProductivityChart';

import { colors, radii } from '@/theme/tokens';
import {
  mockWeeklyReport,
  mockProductivityTrend,
  mockHeatmap,
} from '@/data/mock';
import type { ProductivityPoint } from '@/types/models';

/* ------------------------------------------------------------------ */
/* Range model                                                         */
/* ------------------------------------------------------------------ */

type Range = 'week' | '30' | '90' | '365';

const RANGE_OPTIONS: SegmentedOption<Range>[] = [
  { label: 'Week', value: 'week' },
  { label: '30d', value: '30' },
  { label: '90d', value: '90' },
  { label: '365d', value: '365' },
];

/** How many trailing trend points + heatmap days each range surfaces. */
const RANGE_CONFIG: Record<Range, { points: number; days: number; label: string }> = {
  week: { points: 4, days: 7, label: 'this week' },
  '30': { points: 5, days: 30, label: 'last 30 days' },
  '90': { points: 7, days: 90, label: 'last 90 days' },
  '365': { points: 8, days: 365, label: 'this year' },
};

/* ------------------------------------------------------------------ */
/* Accent helpers                                                      */
/* ------------------------------------------------------------------ */

type Accent = 'highlighter' | 'signal' | 'peach' | 'annotation' | 'success';

const ACCENT_HEX: Record<Accent, ColorValue> = {
  highlighter: colors.highlighter,
  signal: colors.signal,
  peach: colors.peach,
  annotation: colors.annotation,
  success: colors.success,
};

/* ------------------------------------------------------------------ */
/* KPI card                                                            */
/* ------------------------------------------------------------------ */

type Kpi = {
  key: string;
  label: string;
  value: string;
  unit?: string;
  icon: IconName;
  accent: Accent;
  /** Optional small trend hint, e.g. '+6 vs last wk'. */
  hint?: string;
  hintUp?: boolean;
};

function KpiCard({ kpi, index }: { kpi: Kpi; index: number }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 320, delay: 80 + index * 60 }}
      style={{ width: '47.5%', flexGrow: 1 }}
    >
      <SoftCard radius={radii.card} intensity="md" padding={16} style={{ minHeight: 128 }}>
        <View className="flex-row items-center justify-between">
          <Neumorph variant="inset" radius={13} intensity="sm" padding={9} surface={colors.canvas}>
            <Icon name={kpi.icon} size={20} color={kpi.accent} strokeWidth={2.2} />
          </Neumorph>
          {kpi.hint ? (
            <View className="flex-row items-center" style={{ gap: 3 }}>
              <Icon
                name={kpi.hintUp ? 'trending-up' : 'chevron-down'}
                size={13}
                color={kpi.hintUp ? colors.success : colors.annotation}
                strokeWidth={2.4}
              />
              <AppText
                variant="caption"
                weight="semibold"
                color={kpi.hintUp ? colors.success : colors.annotation}
                style={{ fontSize: 11 }}
              >
                {kpi.hint}
              </AppText>
            </View>
          ) : null}
        </View>

        <View style={{ marginTop: 16 }}>
          <View className="flex-row items-baseline" style={{ gap: 3 }}>
            <AppText variant="headingSm" display weight="bold" style={{ letterSpacing: -0.5 }}>
              {kpi.value}
            </AppText>
            {kpi.unit ? (
              <AppText variant="caption" weight="semibold" color={colors.textMuted}>
                {kpi.unit}
              </AppText>
            ) : null}
          </View>
          <AppText
            variant="caption"
            color={colors.textMuted}
            numberOfLines={1}
            style={{ marginTop: 2, fontSize: 12 }}
          >
            {kpi.label}
          </AppText>
        </View>
      </SoftCard>
    </MotiView>
  );
}

/* ------------------------------------------------------------------ */
/* Section label                                                       */
/* ------------------------------------------------------------------ */

function SectionLabel({ icon, title }: { icon: IconName; title: string }) {
  return (
    <View className="flex-row items-center" style={{ gap: 8, marginBottom: 14 }}>
      <Icon name={icon} size={16} color="carbon" strokeWidth={2.2} />
      <AppText
        variant="caption"
        weight="bold"
        color={colors.textMuted}
        style={{ textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 12 }}
      >
        {title}
      </AppText>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.hairline }} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Topic card (strongest / weakest)                                    */
/* ------------------------------------------------------------------ */

function TopicCard({
  kind,
  topic,
}: {
  kind: 'strong' | 'weak';
  topic: string;
}) {
  const strong = kind === 'strong';
  const accent: Accent = strong ? 'success' : 'annotation';
  const tone: TagTone = strong ? 'success' : 'annotation';
  return (
    <View style={{ width: '47.5%', flexGrow: 1 }}>
      <SoftCard radius={radii.card} intensity="md" padding={16} style={{ minHeight: 122 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: ACCENT_HEX[accent],
          }}
        >
          <Icon
            name={strong ? 'trophy' : 'target'}
            size={18}
            color={colors.paper}
            strokeWidth={2.2}
          />
        </View>
        <Tag
          label={strong ? 'Strongest' : 'Needs work'}
          tone={tone}
          size="sm"
          style={{ marginTop: 12 }}
        />
        <AppText variant="body" weight="bold" numberOfLines={2} style={{ marginTop: 6 }}>
          {topic}
        </AppText>
      </SoftCard>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [range, setRange] = useState<Range>('365');

  const report = mockWeeklyReport;
  const cfg = RANGE_CONFIG[range];

  /** Trend points scoped to the active range. */
  const trend: ProductivityPoint[] = useMemo(
    () =>
      mockProductivityTrend.slice(
        Math.max(0, mockProductivityTrend.length - cfg.points),
      ),
    [cfg.points],
  );

  const scoreUp = report.scoreDelta >= 0;

  const kpis: Kpi[] = [
    {
      key: 'hours',
      label: 'Study hours',
      value: report.studyHours.toFixed(1),
      unit: 'h',
      icon: 'clock',
      accent: 'signal',
      hint: `${report.focusSessions} sessions`,
      hintUp: true,
    },
    {
      key: 'solved',
      label: 'Problems solved',
      value: String(report.problemsSolved),
      icon: 'code',
      accent: 'highlighter',
      hint: `${report.longestSession}m peak`,
      hintUp: true,
    },
    {
      key: 'revision',
      label: 'Revision rate',
      value: String(report.revisionRate),
      unit: '%',
      icon: 'repeat',
      accent: 'peach',
      hint: `${report.taskRate}% tasks`,
      hintUp: report.revisionRate >= 70,
    },
    {
      key: 'score',
      label: 'Productivity score',
      value: String(report.productivityScore),
      icon: 'trending-up',
      accent: 'success',
      hint: `${scoreUp ? '+' : ''}${report.scoreDelta} vs last wk`,
      hintUp: scoreUp,
    },
  ];

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
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <SoftIconButton size={44} accessibilityLabel="Go back" onPress={() => router.back()}>
              <Icon name="chevron-left" size={22} color="carbon" />
            </SoftIconButton>
            <GrayMark size={22} />
          </View>
          <View className="flex-row items-center" style={{ gap: 7 }}>
            <Icon name="chart" size={15} color="signal" strokeWidth={2.25} />
            <AppText
              variant="caption"
              weight="semibold"
              color={colors.textSubtle}
              style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 11 }}
            >
              Analytics
            </AppText>
          </View>
          <SoftIconButton size={44} accessibilityLabel="Calendar" onPress={() => router.push('/calendar')}>
            <Icon name="calendar" size={20} color="carbon" />
          </SoftIconButton>
        </View>

        {/* ---------- Header ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 360 }}
          style={{ marginTop: 18, marginBottom: 18 }}
        >
          <AppText variant="heading" display weight="bold">
            Weekly report
          </AppText>
          <View className="flex-row items-center" style={{ gap: 10, marginTop: 8 }}>
            <AppText variant="caption" color={colors.textMuted}>
              {report.label}
            </AppText>
            <Tag
              label={`${scoreUp ? '+' : ''}${report.scoreDelta} pts`}
              tone={scoreUp ? 'success' : 'annotation'}
              size="sm"
              icon={
                <Icon
                  name={scoreUp ? 'trending-up' : 'chevron-down'}
                  size={12}
                  color={scoreUp ? '#2c9d5f' : colors.annotation}
                  strokeWidth={2.6}
                />
              }
            />
          </View>
        </MotiView>

        {/* ---------- Range tabs ---------- */}
        <View style={{ marginBottom: 22 }}>
          <SegmentedTabs options={RANGE_OPTIONS} value={range} onChange={setRange} height={46} />
        </View>

        {/* ---------- KPI grid ---------- */}
        <View className="flex-row flex-wrap" style={{ gap: 12, marginBottom: 26 }}>
          {kpis.map((kpi, i) => (
            <KpiCard key={kpi.key} kpi={kpi} index={i} />
          ))}
        </View>

        {/* ---------- Productivity trend ---------- */}
        <SectionLabel icon="activity" title="Productivity trend" />
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 360, delay: 80 }}
          style={{ marginBottom: 26 }}
        >
          <SoftCard radius={radii.card} intensity="md" padding={20}>
            <View className="flex-row items-center justify-between" style={{ marginBottom: 18 }}>
              <View>
                <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 12 }}>
                  Score over {cfg.label}
                </AppText>
                <View className="flex-row items-baseline" style={{ gap: 4, marginTop: 2 }}>
                  <AppText variant="heading" display weight="bold" style={{ fontSize: 32, lineHeight: 36 }}>
                    {report.productivityScore}
                  </AppText>
                  <AppText variant="caption" weight="semibold" color={colors.textSubtle}>
                    / 100
                  </AppText>
                </View>
              </View>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.highlighter,
                }}
              >
                <Icon name="zap" size={22} color="carbon" strokeWidth={2.3} fill={colors.carbon} />
              </View>
            </View>

            <ProductivityChart data={trend} />
          </SoftCard>
        </MotiView>

        {/* ---------- Topics ---------- */}
        <SectionLabel icon="layers" title="Topic focus" />
        <View className="flex-row flex-wrap" style={{ gap: 12, marginBottom: 26 }}>
          <TopicCard kind="strong" topic={report.strongestTopic} />
          <TopicCard kind="weak" topic={report.weakestTopic} />
        </View>

        {/* ---------- Recommendations ---------- */}
        <SectionLabel icon="lightbulb" title="Coach recommendations" />
        <SoftCard radius={radii.card} intensity="md" padding={18} style={{ marginBottom: 26 }}>
          {report.recommendations.map((rec, i) => (
            <View
              key={rec}
              className="flex-row"
              style={{
                gap: 12,
                paddingVertical: 12,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: colors.hairline,
              }}
            >
              <Neumorph variant="inset" radius={13} intensity="sm" surface={colors.canvas}>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppText variant="caption" weight="bold" color={colors.signal} style={{ fontSize: 12 }}>
                    {i + 1}
                  </AppText>
                </View>
              </Neumorph>
              <AppText
                variant="caption"
                color={colors.carbon}
                style={{ flex: 1, fontSize: 13, lineHeight: 20 }}
              >
                {rec}
              </AppText>
            </View>
          ))}
        </SoftCard>

        {/* ---------- Activity heatmap ---------- */}
        <SectionLabel icon="flame" title="Activity" />
        <SoftCard radius={radii.card} intensity="md" padding={20}>
          <View className="flex-row items-center justify-between" style={{ marginBottom: 16 }}>
            <View>
              <AppText variant="body" weight="bold">
                Consistency
              </AppText>
              <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 2, fontSize: 12 }}>
                {cfg.label}
              </AppText>
            </View>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.peach,
              }}
            >
              <Icon name="flame" size={20} color={colors.paper} strokeWidth={2.3} />
            </View>
          </View>
          <Heatmap data={mockHeatmap} range={cfg.days} cellSize={11} gap={3} />
        </SoftCard>
      </ScrollView>
    </View>
  );
}
