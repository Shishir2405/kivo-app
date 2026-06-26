/**
 * Achievements.
 *
 * A trophy room rendered entirely from the Aaply neumorphic kit (ZERO emoji,
 * vector Icons only) on the graphite-mist canvas:
 *
 *  - an XP hero card with the total earned XP, level + a neumorphic progress
 *    bar toward the next level, and three inset stat wells;
 *  - a filterable badge grid (All / Earned / Locked) where earned badges are
 *    full-color raised medallions that spring + glow in, and locked badges are
 *    recessed, desaturated wells showing how close they are;
 *  - a streak milestone ladder (First Week → 30 Days → 100 Days → One Year)
 *    with Icon, requirement, progress and unlock date per rung.
 *
 * Reads the richer `mockAchievementCatalog` (key + xp + category) and the
 * user's profile (level / streak) — everything is read-only mock data.
 */
import React, { useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { SoftIconButton } from '@/components/ui/SoftIconButton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Tag } from '@/components/ui/Tag';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { GrayMark } from '@/components/ui/AppHeader';

import {
  XpProgressBar,
  BadgeTile,
  MilestoneRow,
  type Accent,
} from '@/components/achievements';

import { colors } from '@/theme/tokens';
import { mockAchievementCatalog, mockProfile } from '@/data/mock';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** "2026-01-14" -> "Jan 14". Returns undefined for empty input. */
function shortDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) return undefined;
  return `${MONTHS[m - 1]} ${d}`;
}

/** Add `days` to an ISO date and return a short "Mon D" label. */
function addDaysLabel(iso: string, days: number): string | undefined {
  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) return undefined;
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${MONTHS[dt.getUTCMonth()]} ${dt.getUTCDate()}`;
}

type Filter = 'all' | 'earned' | 'locked';

const FILTER_OPTIONS: SegmentedOption<Filter>[] = [
  { value: 'all', label: 'All', icon: 'grid' },
  { value: 'earned', label: 'Earned', icon: 'badge-check' },
  { value: 'locked', label: 'Locked', icon: 'lock' },
];

/** A streak milestone rung (independent of the XP catalog). */
type Milestone = {
  key: string;
  icon: IconName;
  title: string;
  requirement: string;
  threshold: number;
  tone: Accent;
};

const MILESTONES: Milestone[] = [
  { key: 'first_week', icon: 'sparkles', title: 'First Week', requirement: '7-day streak', threshold: 7, tone: 'success' },
  { key: 'thirty', icon: 'flame', title: '30 Days', requirement: '30-day streak', threshold: 30, tone: 'peach' },
  { key: 'hundred', icon: 'medal', title: '100 Days', requirement: '100-day streak', threshold: 100, tone: 'signal' },
  { key: 'one_year', icon: 'crown', title: 'One Year', requirement: '365-day streak', threshold: 365, tone: 'highlighter' },
];

/* ------------------------------------------------------------------ */
/* Screen                                                             */
/* ------------------------------------------------------------------ */

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [filter, setFilter] = useState<Filter>('all');

  // ----- Derived XP / progress -----
  const summary = useMemo(() => {
    const total = mockAchievementCatalog.length;
    const earned = mockAchievementCatalog.filter((a) => a.unlocked);
    const earnedCount = earned.length;
    const earnedXp = earned.reduce((sum, a) => sum + a.xp, 0);
    const totalXp = mockAchievementCatalog.reduce((sum, a) => sum + a.xp, 0);
    const completion = total > 0 ? Math.round((earnedCount / total) * 100) : 0;

    // Level progress: blend the profile XP into a clean within-level ratio.
    const XP_PER_LEVEL = 1000;
    const intoLevel = mockProfile.xp % XP_PER_LEVEL;
    const levelRatio = intoLevel / XP_PER_LEVEL;
    const xpToNext = XP_PER_LEVEL - intoLevel;

    return {
      total,
      earnedCount,
      earnedXp,
      totalXp,
      completion,
      levelRatio,
      xpToNext,
    };
  }, []);

  // ----- Filtered, sorted badges (earned first) -----
  const badges = useMemo(() => {
    const list = mockAchievementCatalog.filter((a) => {
      if (filter === 'earned') return a.unlocked;
      if (filter === 'locked') return !a.unlocked;
      return true;
    });
    // Earned first, then by progress descending (closest-to-unlock on top).
    return [...list].sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      return b.progress - a.progress;
    });
  }, [filter]);

  // ----- Milestone unlock dates derived from join date + best streak -----
  const joinIso = mockProfile.joinedAt;
  const bestStreak = mockProfile.longestStreak;

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
          <SoftIconButton size={44} accessibilityLabel="Share achievements" onPress={() => {}}>
            <Icon name="share" size={19} color="carbon" />
          </SoftIconButton>
        </View>

        {/* ---------- Header ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 360 }}
          style={{ marginTop: 18, marginBottom: 20 }}
        >
          <View className="flex-row items-center" style={{ gap: 7 }}>
            <Icon name="trophy" size={14} color="highlighter" strokeWidth={2.4} />
            <AppText
              variant="caption"
              weight="semibold"
              color={colors.textSubtle}
              style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 11 }}
            >
              Achievements
            </AppText>
          </View>
          <AppText variant="heading" display weight="bold" style={{ marginTop: 6 }}>
            Your trophy{'\n'}cabinet
          </AppText>
        </MotiView>

        {/* ---------- XP hero ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 14, scale: 0.97 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 18, stiffness: 160 }}
        >
          <SoftCard radius={32} padding={22}>
            <View className="flex-row items-center justify-between">
              <View>
                <AppText
                  variant="caption"
                  weight="medium"
                  color={colors.textMuted}
                  style={{ fontSize: 12 }}
                >
                  Total XP earned
                </AppText>
                <View className="flex-row items-baseline" style={{ gap: 6, marginTop: 4 }}>
                  <AppText variant="heading" weight="bold" display>
                    {summary.earnedXp.toLocaleString()}
                  </AppText>
                  <AppText variant="subheading" weight="semibold" color={colors.textSubtle}>
                    XP
                  </AppText>
                </View>
              </View>

              {/* Level medallion */}
              <Neumorph variant="raised" radius={18} intensity="sm">
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.highlighter,
                  }}
                >
                  <Icon name="crown" size={20} color="carbon" strokeWidth={2.2} />
                  <AppText
                    variant="caption"
                    weight="bold"
                    color={colors.carbon}
                    style={{ fontSize: 12, marginTop: 1 }}
                  >
                    Lv {mockProfile.level}
                  </AppText>
                </View>
              </Neumorph>
            </View>

            {/* Level progress bar */}
            <View style={{ marginTop: 18 }}>
              <View
                className="flex-row items-center justify-between"
                style={{ marginBottom: 8 }}
              >
                <AppText variant="caption" weight="medium" color={colors.textMuted} style={{ fontSize: 12 }}>
                  Level {mockProfile.level} → {mockProfile.level + 1}
                </AppText>
                <AppText variant="caption" weight="semibold" color={colors.textMuted} style={{ fontSize: 12 }}>
                  {summary.xpToNext.toLocaleString()} XP to go
                </AppText>
              </View>
              <XpProgressBar progress={summary.levelRatio} />
            </View>

            {/* Stat wells */}
            <View className="flex-row" style={{ marginTop: 18, gap: 12 }}>
              <HeroStat
                value={`${summary.earnedCount}`}
                label="unlocked"
                accent="success"
                icon="badge-check"
              />
              <HeroStat
                value={`${summary.completion}%`}
                label="complete"
                accent="signal"
                icon="target"
              />
              <HeroStat
                value={`${summary.total - summary.earnedCount}`}
                label="to earn"
                accent="peach"
                icon="lock"
              />
            </View>
          </SoftCard>
        </MotiView>

        {/* ---------- Filter ---------- */}
        <View style={{ marginTop: 22 }}>
          <View className="flex-row items-center" style={{ gap: 8, marginBottom: 14 }}>
            <Icon name="medal" size={16} color="carbon" strokeWidth={2.2} />
            <AppText
              variant="caption"
              weight="bold"
              color={colors.textMuted}
              style={{ textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 12 }}
            >
              Badges
            </AppText>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.hairline }} />
            <Tag label={`${summary.earnedCount}/${summary.total}`} tone="neutral" size="sm" />
          </View>

          <SegmentedTabs options={FILTER_OPTIONS} value={filter} onChange={setFilter} height={46} />
        </View>

        {/* ---------- Badge grid ---------- */}
        {badges.length > 0 ? (
          <View className="flex-row flex-wrap" style={{ gap: 12, marginTop: 16 }}>
            {badges.map((a, i) => (
              <BadgeTile
                key={a.key}
                title={a.title}
                description={a.description}
                icon={a.icon}
                xp={a.xp}
                tone={a.tone}
                unlocked={a.unlocked}
                progress={a.progress}
                unlockedLabel={shortDate(a.unlockedAt)}
                index={i}
              />
            ))}
          </View>
        ) : (
          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 280 }}
            style={{ marginTop: 16 }}
          >
            <SoftCard variant="inset" radius={28} padding={28}>
              <View className="items-center" style={{ gap: 10 }}>
                <Neumorph variant="raised" radius={18} intensity="sm" padding={14}>
                  <Icon name="trophy" size={24} color="textSubtle" strokeWidth={2} />
                </Neumorph>
                <AppText variant="body" weight="bold" color={colors.textMuted}>
                  {filter === 'earned' ? 'No badges earned yet' : 'Nothing locked here'}
                </AppText>
                <AppText
                  variant="caption"
                  color={colors.textSubtle}
                  style={{ textAlign: 'center', fontSize: 12 }}
                >
                  {filter === 'earned'
                    ? 'Solve, revise and stay consistent to start collecting badges.'
                    : 'You have unlocked everything in this view. Incredible work.'}
                </AppText>
              </View>
            </SoftCard>
          </MotiView>
        )}

        {/* ---------- Milestone ladder ---------- */}
        <View style={{ marginTop: 28 }}>
          <View className="flex-row items-center" style={{ gap: 8, marginBottom: 14 }}>
            <Icon name="trending-up" size={16} color="carbon" strokeWidth={2.2} />
            <AppText
              variant="caption"
              weight="bold"
              color={colors.textMuted}
              style={{ textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 12 }}
            >
              Streak milestones
            </AppText>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.hairline }} />
            <Tag label={`${bestStreak}d best`} tone="peach" size="sm" />
          </View>

          <SoftCard radius={32} padding={20}>
            <View className="flex-row items-center" style={{ gap: 6, marginBottom: 6 }}>
              <Icon name="flame" size={15} color="peach" strokeWidth={2.4} />
              <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 12 }}>
                Current streak {mockProfile.streak} days · best {bestStreak} days
              </AppText>
            </View>

            {MILESTONES.map((ms, i) => (
              <MilestoneRow
                key={ms.key}
                icon={ms.icon}
                title={ms.title}
                requirement={ms.requirement}
                threshold={ms.threshold}
                bestStreak={bestStreak}
                tone={ms.tone}
                unlockedLabel={
                  bestStreak >= ms.threshold ? addDaysLabel(joinIso, ms.threshold) : undefined
                }
                last={i === MILESTONES.length - 1}
                index={i}
              />
            ))}
          </SoftCard>
        </View>

        {/* ---------- Footer ---------- */}
        <View className="items-center" style={{ marginTop: 26 }}>
          <BrandLogo variant="lockup" size={15} color={colors.textSubtle} />
          <AppText variant="caption" color={colors.textSubtle} style={{ marginTop: 8, fontSize: 11 }}>
            Keep showing up. The cabinet fills itself.
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Local hero stat well                                                */
/* ------------------------------------------------------------------ */

function HeroStat({
  value,
  label,
  accent,
  icon,
}: {
  value: string;
  label: string;
  accent: Accent;
  icon: IconName;
}) {
  return (
    <Neumorph variant="inset" radius={18} intensity="sm" padding={12} style={{ flex: 1 }}>
      <View className="items-center" style={{ gap: 6 }}>
        <Icon name={icon} size={16} color={accent} strokeWidth={2.4} />
        <AppText variant="subheading" weight="bold" display numberOfLines={1}>
          {value}
        </AppText>
        <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 11 }}>
          {label}
        </AppText>
      </View>
    </Neumorph>
  );
}
