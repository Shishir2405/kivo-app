/**
 * Achievements (Steep).
 *
 * A calm trophy room. A serif title, an XP/level hero with a flat progress
 * meter and three data figures, a filterable badge grid, and a streak milestone
 * ladder. Real data from `/achievements` (which currently 5xxs — handled
 * gracefully into a calm empty state) plus `/auth/me` and `/analytics/streaks`.
 * Every request renders a loading / error / empty state and can never crash.
 */
import React, { useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui/Typography';
import { Card } from '@/components/ui/SoftCard';
import { Icon, type IconName } from '@/components/ui/Icon';
import { AppHeader } from '@/components/ui/AppHeader';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';

import {
  XpProgressBar,
  BadgeTile,
  MilestoneRow,
  type Accent,
} from '@/components/achievements';
import { Eyebrow, SectionLabel, StateBlock } from '@/components/account/SteepParts';
import {
  useAchievementsSafe,
  useAccount,
  useStreaks,
  type AchievementVM,
  type AchievementCategory,
} from '@/components/account/accountApi';

import { useTheme, motion } from '@/theme';
import { spacing } from '@/theme/tokens';

/* ------------------------------------------------------------------ */
/* Category → glyph + accent (one curated wash per badge category)     */
/* ------------------------------------------------------------------ */

const CATEGORY_ICON: Record<string, IconName> = {
  STREAK: 'flame',
  VOLUME: 'code',
  REVISION: 'repeat',
  FOCUS: 'timer',
  MILESTONE: 'medal',
};

// One curated wash per category so the badge grid reads as an intentional,
// rotating palette rather than a single warm voice.
const CATEGORY_TONE: Record<string, Accent> = {
  STREAK: 'peach',
  VOLUME: 'sky',
  REVISION: 'mint',
  FOCUS: 'lavender',
  MILESTONE: 'butter',
};

function catIcon(c: AchievementCategory): IconName {
  return CATEGORY_ICON[c] ?? 'trophy';
}
function catTone(c: AchievementCategory): Accent {
  return CATEGORY_TONE[c] ?? 'butter';
}

/* ------------------------------------------------------------------ */
/* Date helpers                                                        */
/* ------------------------------------------------------------------ */

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function shortDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/* ------------------------------------------------------------------ */
/* Filter + milestones                                                 */
/* ------------------------------------------------------------------ */

type Filter = 'all' | 'earned' | 'locked';

const FILTER_OPTIONS: SegmentedOption<Filter>[] = [
  { value: 'all', label: 'All' },
  { value: 'earned', label: 'Earned' },
  { value: 'locked', label: 'Locked' },
];

type Milestone = { key: string; icon: IconName; title: string; requirement: string; threshold: number; tone: Accent };

const MILESTONES: Milestone[] = [
  { key: 'first_week', icon: 'sparkles', title: 'First Week', requirement: '7-day streak', threshold: 7, tone: 'sky' },
  { key: 'thirty', icon: 'flame', title: '30 Days', requirement: '30-day streak', threshold: 30, tone: 'peach' },
  { key: 'hundred', icon: 'medal', title: '100 Days', requirement: '100-day streak', threshold: 100, tone: 'mint' },
  { key: 'one_year', icon: 'crown', title: 'One Year', requirement: '365-day streak', threshold: 365, tone: 'butter' },
];

/* ------------------------------------------------------------------ */
/* Screen                                                             */
/* ------------------------------------------------------------------ */

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, accentForTone, toneStyle } = useTheme();

  const achievements = useAchievementsSafe();
  const account = useAccount();
  const streaks = useStreaks();

  const [filter, setFilter] = useState<Filter>('all');

  const list: AchievementVM[] = achievements.data ?? [];

  const summary = useMemo(() => {
    const total = list.length;
    const earned = list.filter((x) => x.unlocked);
    const earnedXp = earned.reduce((s, x) => s + x.xp, 0);
    const completion = total > 0 ? Math.round((earned.length / total) * 100) : 0;
    return { total, earnedCount: earned.length, earnedXp, completion };
  }, [list]);

  const badges = useMemo(() => {
    const filtered = list.filter((x) => {
      if (filter === 'earned') return x.unlocked;
      if (filter === 'locked') return !x.unlocked;
      return true;
    });
    return [...filtered].sort((x, y) => {
      if (x.unlocked !== y.unlocked) return x.unlocked ? -1 : 1;
      return y.progress - x.progress;
    });
  }, [list, filter]);

  const a = account.data;
  const bestStreak = streaks.data?.longestDailyStreak ?? a?.longestStreak ?? 0;
  const currentStreak = streaks.data?.currentDailyStreak ?? a?.currentStreak ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
      >
        <AppHeader title="Achievements" onBack={() => router.back()} />

        {/* ---------- XP / level hero ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: motion.duration.transition }}
        >
          <View style={{ marginTop: spacing.md, marginBottom: spacing.xl, gap: 2 }}>
            <Eyebrow label="Your trophy cabinet" />
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <AppText variant="display" display weight="medium" color={accentForTone('butter')}>
                {(a?.xp ?? 0).toLocaleString()}
              </AppText>
              <AppText variant="subheading" color={colors.muted}>
                XP earned
              </AppText>
            </View>
          </View>

          {a ? (
            <Card tone="butter" padding={spacing.lg} style={{ marginBottom: spacing.xl }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                <AppText variant="caption" color={colors.ash}>
                  Level {a.level} → {a.level + 1}
                </AppText>
                <AppText variant="caption" color={colors.ash}>
                  {a.xpToNext.toLocaleString()} XP to go
                </AppText>
              </View>
              <XpProgressBar progress={a.levelProgress} color={accentForTone('butter')} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg }}>
                <HeroStat value={`${summary.earnedCount}`} label="unlocked" color={accentForTone('mint')} mutedColor={colors.ash} />
                <Sep color={toneStyle('butter').border} />
                <HeroStat value={`${summary.completion}%`} label="complete" color={accentForTone('sky')} mutedColor={colors.ash} />
                <Sep color={toneStyle('butter').border} />
                <HeroStat value={`${currentStreak}`} label="day streak" color={accentForTone('peach')} mutedColor={colors.ash} />
              </View>
            </Card>
          ) : null}
        </MotiView>

        {/* ---------- Badges ---------- */}
        <SectionLabel
          title="Badges"
          right={
            <AppText variant="caption" color={colors.muted}>
              {summary.earnedCount}/{summary.total}
            </AppText>
          }
        />
        <View style={{ marginBottom: spacing.lg }}>
          <SegmentedTabs options={FILTER_OPTIONS} value={filter} onChange={setFilter} height={36} />
        </View>

        {achievements.isLoading ? (
          <StateBlock kind="loading" />
        ) : achievements.isError ? (
          <StateBlock
            kind="error"
            title="Couldn't load badges"
            message={achievements.error?.message}
            onRetry={() => achievements.refetch()}
          />
        ) : badges.length === 0 ? (
          <StateBlock
            kind="empty"
            icon="trophy"
            title={filter === 'earned' ? 'No badges earned yet' : filter === 'locked' ? 'Nothing locked' : 'No badges yet'}
            message="Solve, revise and stay consistent to start collecting badges."
          />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            {badges.map((x, i) => (
              <BadgeTile
                key={x.key}
                title={x.title}
                description={x.description}
                icon={catIcon(x.category)}
                xp={x.xp}
                tone={catTone(x.category)}
                unlocked={x.unlocked}
                progress={x.progress}
                unlockedLabel={shortDate(x.unlockedAt)}
                index={i}
              />
            ))}
          </View>
        )}

        {/* ---------- Streak milestones ---------- */}
        <View style={{ marginTop: spacing.xxl }}>
          <SectionLabel
            title="Streak milestones"
            right={
              <AppText variant="caption" color={colors.primary}>
                {bestStreak}d best
              </AppText>
            }
          />
          <Card padding={spacing.lg}>
            {MILESTONES.map((ms, i) => (
              <MilestoneRow
                key={ms.key}
                icon={ms.icon}
                title={ms.title}
                requirement={ms.requirement}
                threshold={ms.threshold}
                bestStreak={bestStreak}
                tone={ms.tone}
                last={i === MILESTONES.length - 1}
                index={i}
              />
            ))}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Local hero stat                                                     */
/* ------------------------------------------------------------------ */

function HeroStat({
  value,
  label,
  color,
  mutedColor,
}: {
  value: string;
  label: string;
  color?: string;
  mutedColor: string;
}) {
  return (
    <View style={{ alignItems: 'center', gap: 1, flex: 1 }}>
      <AppText variant="heading" display weight="medium" color={color}>
        {value}
      </AppText>
      <AppText variant="caption" color={mutedColor}>
        {label}
      </AppText>
    </View>
  );
}

function Sep({ color }: { color: string }) {
  return <View style={{ width: 1, backgroundColor: color, marginVertical: 2 }} />;
}
