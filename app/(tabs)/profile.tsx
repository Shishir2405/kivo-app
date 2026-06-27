/**
 * Profile (Steep).
 *
 * Editorial, calm, premium. A serif name + handle, a small XP/level data line,
 * two warm/cool data cards (streak + this-week focus), a quiet contribution
 * heatmap, and a flat toolkit menu. Real data from `/auth/me`,
 * `/analytics/weekly` and `/analytics/heatmap` — every request renders a
 * loading / error / empty state and can never crash the app.
 */
import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui/Typography';
import { Card, WarmCard, CoolCard } from '@/components/ui/SoftCard';
import { TextLink } from '@/components/ui/PillButton';
import { Icon } from '@/components/ui/Icon';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { GrayMark } from '@/components/ui/AppHeader';

import { MenuRow } from '@/components/profile';
import {
  Eyebrow,
  SectionLabel,
  StateBlock,
} from '@/components/account/SteepParts';
import { SteepHeatmap } from '@/components/account/SteepHeatmap';
import {
  useAccount,
  useWeeklyReport,
  useHeatmap,
  type HeatmapRange,
} from '@/components/account/accountApi';

import { colors, spacing } from '@/theme/tokens';
import { useAuthStore } from '@/store/useAuthStore';

const TAB_BAR_SPACE = 110;

const RANGE_OPTIONS: SegmentedOption<HeatmapRange>[] = [
  { value: '30', label: '30d' },
  { value: '90', label: '90d' },
  { value: '365', label: '1 year' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const account = useAccount();
  const weekly = useWeeklyReport();
  const [range, setRange] = useState<HeatmapRange>('365');
  const heatmap = useHeatmap(range);

  const a = account.data;
  const w = weekly.data;
  const studyHours = w ? w.studyHours.toFixed(1) : '0.0';

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/welcome');
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + TAB_BAR_SPACE,
          gap: spacing.xl,
        }}
      >
        {/* ---------- Top bar ---------- */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <GrayMark size={20} />
          <TextLink
            label="Settings"
            onPress={() => router.push('/settings')}
            icon={<Icon name="settings" size={16} color="ink" weight="light" />}
          />
        </View>

        {/* ---------- Identity ---------- */}
        {account.isLoading ? (
          <StateBlock kind="loading" />
        ) : account.isError ? (
          <StateBlock
            kind="error"
            title="Couldn't load your profile"
            message={account.error?.message}
            onRetry={() => account.refetch()}
          />
        ) : a ? (
          <View style={{ gap: spacing.md }}>
            <View style={{ gap: 2 }}>
              <Eyebrow label="Your account" />
              <AppText variant="display" display weight="medium" numberOfLines={1}>
                {a.name}
              </AppText>
              <AppText variant="subheading" color={colors.graphite}>
                {a.username}
              </AppText>
            </View>

            {/* Level / XP / joined data line */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
              <InlineStat value={`Lv ${a.level}`} label="level" />
              <Divider />
              <InlineStat value={a.xp.toLocaleString()} label="xp" />
              {a.joinedYear ? (
                <>
                  <Divider />
                  <InlineStat value={a.joinedYear} label="joined" />
                </>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* ---------- Streak + focus data cards ---------- */}
        {a ? (
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <WarmCard style={{ flex: 1 }} padding={spacing.lg}>
              <Icon name="flame" size={16} color="rust" weight="light" />
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: spacing.sm }}>
                <AppText variant="headingLg" display weight="medium" color={colors.rust}>
                  {a.currentStreak}
                </AppText>
                <AppText variant="caption" color={colors.rust}>
                  days
                </AppText>
              </View>
              <AppText variant="caption" color={colors.rust} style={{ marginTop: 1 }}>
                current streak · best {a.longestStreak}
              </AppText>
            </WarmCard>

            <CoolCard style={{ flex: 1 }} padding={spacing.lg}>
              <Icon name="clock" size={16} color="ink" weight="light" />
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: spacing.sm }}>
                <AppText variant="headingLg" display weight="medium">
                  {studyHours}
                </AppText>
                <AppText variant="caption" color={colors.ash}>
                  h
                </AppText>
              </View>
              <AppText variant="caption" color={colors.ash} style={{ marginTop: 1 }}>
                {weekly.isError ? 'this week' : `${w?.problemsSolved ?? 0} solved this week`}
              </AppText>
            </CoolCard>
          </View>
        ) : null}

        {/* ---------- Activity heatmap ---------- */}
        {a ? (
          <View>
            <SectionLabel title="Activity" />
            <Card padding={spacing.lg}>
              <View style={{ marginBottom: spacing.lg }}>
                <SegmentedTabs options={RANGE_OPTIONS} value={range} onChange={setRange} height={36} />
              </View>

              {heatmap.isLoading ? (
                <StateBlock kind="loading" />
              ) : heatmap.isError ? (
                <StateBlock
                  kind="error"
                  message={heatmap.error?.message}
                  onRetry={() => heatmap.refetch()}
                />
              ) : (heatmap.data?.cells.length ?? 0) === 0 ? (
                <View style={{ paddingVertical: spacing.lg, alignItems: 'center', gap: spacing.xs }}>
                  <AppText variant="subheading" weight="medium" color={colors.ash}>
                    No activity yet
                  </AppText>
                  <AppText variant="caption" color={colors.graphite} style={{ textAlign: 'center' }}>
                    Solve, revise and focus to start filling the grid.
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
          </View>
        ) : null}

        {/* ---------- Toolkit ---------- */}
        <View>
          <SectionLabel title="Toolkit" />
          <Card padding={0} style={{ paddingHorizontal: spacing.lg }}>
            <MenuRow icon="bell" title="Notifications" onPress={() => router.push('/notifications')} />
            <MenuRow icon="trophy" title="Achievements" onPress={() => router.push('/achievements')} />
            <MenuRow icon="chart" title="Analytics" onPress={() => router.push('/analytics')} />
            <MenuRow icon="book" title="Reflections" onPress={() => router.push('/reflections')} />
            <MenuRow icon="settings" title="Settings" onPress={() => router.push('/settings')} last />
          </Card>
        </View>

        {/* ---------- Sign out ---------- */}
        <View style={{ alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs }}>
          <TextLink
            label="Sign out"
            onPress={() => void handleLogout()}
            muted
            icon={<Icon name="log-out" size={16} color="ash" weight="light" />}
          />
          {a?.email ? (
            <AppText variant="caption" color={colors.dove}>
              {a.email}
            </AppText>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Local inline stat (level / xp / joined)                             */
/* ------------------------------------------------------------------ */

function InlineStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ gap: 1 }}>
      <AppText variant="headingSm" display weight="medium" numberOfLines={1}>
        {value}
      </AppText>
      <AppText variant="caption" color={colors.graphite}>
        {label}
      </AppText>
    </View>
  );
}

function Divider() {
  return <View style={{ width: 1, height: 26, backgroundColor: colors.dove }} />;
}
