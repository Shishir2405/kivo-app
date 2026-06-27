/**
 * Profile (Kivo).
 *
 * Matches the HTML "Profile & settings" mockup: a centered identity block
 * (mint avatar well + serif initial, serif name, joined line), a Level chip
 * with an XP progress track, a 3-up stat grid (streak / solved / focus), a
 * quiet contribution heatmap, and a flat toolkit menu. Real data from
 * `/auth/me`, `/analytics/weekly` and `/analytics/heatmap` — every request
 * renders a loading / error / empty state and can never crash the app.
 * Fully light + dark via useTheme(); entrance motion on each block.
 */
import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { Card } from '@/components/ui/SoftCard';
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

import { spacing, motion } from '@/theme/tokens';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/store/useAuthStore';

const TAB_BAR_SPACE = 110;

const RANGE_OPTIONS: SegmentedOption<HeatmapRange>[] = [
  { value: '30', label: '30d' },
  { value: '90', label: '90d' },
  { value: '365', label: '1 year' },
];

/** A subtle staggered entrance block. */
function Enter({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: motion.duration.transition, delay }}
    >
      {children}
    </MotiView>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, toneStyle } = useTheme();
  const logout = useAuthStore((s) => s.logout);

  const account = useAccount();
  const weekly = useWeeklyReport();
  const [range, setRange] = useState<HeatmapRange>('365');
  const heatmap = useHeatmap(range);

  const a = account.data;
  const w = weekly.data;
  const studyHours = w ? w.studyHours.toFixed(1) : '0.0';
  const mint = toneStyle('mint');
  const xpPct = a ? Math.max(0, Math.min(1, a.levelProgress)) : 0;

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
            <TextLink
              label="Edit profile"
              onPress={() => router.push('/settings/profile')}
              icon={<Icon name="user" size={16} color="muted" weight="light" />}
            />
            <TextLink
              label="Settings"
              onPress={() => router.push('/settings')}
              icon={<Icon name="settings" size={16} color="muted" weight="light" />}
            />
          </View>
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
          <Enter>
            <Pressable
              onPress={() => router.push('/settings/profile')}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, alignItems: 'center', gap: spacing.sm })}
            >
              {/* Avatar well */}
              <View
                style={{
                  width: 78,
                  height: 78,
                  borderRadius: 9999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: mint.bg,
                  borderWidth: 1,
                  borderColor: mint.border,
                }}
              >
                <AppText variant="headingLg" display weight="semibold" color={mint.accent}>
                  {a.initial}
                </AppText>
              </View>

              <View style={{ alignItems: 'center', gap: 2 }}>
                <AppText variant="heading" display weight="medium" numberOfLines={1}>
                  {a.name}
                </AppText>
                <AppText variant="caption" color={colors.muted}>
                  {a.joinedYear ? `Joined ${a.joinedYear}` : a.username}
                </AppText>
              </View>

              {/* Level chip + XP track */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 }}>
                <View
                  style={{
                    backgroundColor: colors.primaryWash,
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 9999,
                  }}
                >
                  <AppText variant="caption" weight="bold" color={colors.primaryOnWash} style={{ fontSize: 11.5 }}>
                    Level {a.level}
                  </AppText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <View
                    style={{
                      width: 80,
                      height: 6,
                      borderRadius: 9999,
                      backgroundColor: colors.surfaceAlt,
                      overflow: 'hidden',
                    }}
                  >
                    <MotiView
                      from={{ width: 0 }}
                      animate={{ width: Math.round(xpPct * 80) }}
                      transition={{ type: 'timing', duration: motion.duration.reveal }}
                      style={{ height: '100%', backgroundColor: colors.primary }}
                    />
                  </View>
                  <AppText variant="caption" color={colors.muted} style={{ fontSize: 11 }}>
                    {a.xp.toLocaleString()} XP
                  </AppText>
                </View>
              </View>
            </Pressable>
          </Enter>
        ) : null}

        {/* ---------- Stat grid (streak / solved / focus) ---------- */}
        {a ? (
          <Enter delay={60}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <StatTile value={`${a.currentStreak}`} label="streak" />
              <StatTile value={`${w?.problemsSolved ?? 0}`} label="solved" />
              <StatTile value={`${studyHours}h`} label="focus" />
            </View>
          </Enter>
        ) : null}

        {/* ---------- Activity heatmap ---------- */}
        {a ? (
          <Enter delay={120}>
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
                    <AppText variant="subheading" weight="medium" color={colors.ink}>
                      No activity yet
                    </AppText>
                    <AppText variant="caption" color={colors.muted} style={{ textAlign: 'center' }}>
                      Solve, revise and focus to start filling the grid.
                    </AppText>
                  </View>
                ) : (
                  <>
                    <SteepHeatmap cells={heatmap.data!.cells} range={Number(range)} />
                    <AppText variant="caption" color={colors.muted} style={{ marginTop: spacing.md }}>
                      {heatmap.data!.totalContributions} contributions · {heatmap.data!.activeDays} active days
                    </AppText>
                  </>
                )}
              </Card>
            </View>
          </Enter>
        ) : null}

        {/* ---------- Toolkit ---------- */}
        <Enter delay={180}>
          <View>
            <SectionLabel title="Toolkit" />
            <Card padding={0} style={{ paddingHorizontal: spacing.lg }}>
              <MenuRow icon="chart" title="Weekly analytics" onPress={() => router.push('/analytics')} />
              <MenuRow icon="user" title="Edit profile" onPress={() => router.push('/settings/profile')} />
              <MenuRow icon="bell" title="Notifications" onPress={() => router.push('/notifications')} />
              <MenuRow icon="trophy" title="Achievements" onPress={() => router.push('/achievements')} />
              <MenuRow icon="book" title="Reflections" onPress={() => router.push('/reflections')} />
              <MenuRow icon="settings" title="Settings" onPress={() => router.push('/settings')} last />
            </Card>
          </View>
        </Enter>

        {/* ---------- Sign out ---------- */}
        <View style={{ alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs }}>
          <TextLink
            label="Sign out"
            onPress={() => void handleLogout()}
            muted
            icon={<Icon name="log-out" size={16} color="muted" weight="light" />}
          />
          {a?.email ? (
            <AppText variant="caption" color={colors.muted}>
              {a.email}
            </AppText>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Stat tile — a flat surface tile with a terracotta figure + label    */
/* ------------------------------------------------------------------ */

function StatTile({ value, label }: { value: string; label: string }) {
  const { colors, shadow } = useTheme();
  return (
    <View
      style={[
        {
          flex: 1,
          alignItems: 'center',
          paddingVertical: spacing.md,
          borderRadius: 14,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.hairline,
        },
        shadow,
      ]}
    >
      <AppText variant="headingLg" display weight="semibold" color={colors.primary}>
        {value}
      </AppText>
      <AppText variant="caption" color={colors.muted} style={{ marginTop: 2, fontSize: 10.5 }}>
        {label}
      </AppText>
    </View>
  );
}
