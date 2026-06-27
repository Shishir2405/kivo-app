/**
 * Settings (Steep).
 *
 * A calm, compact preferences screen. Flat grouping cards (the data sections
 * carry a quiet Steep wash), small thin mono glyphs, serif section labels,
 * SegmentedTabs / Select / Stepper for choices and SoftToggle switches for
 * booleans. Everything actionable (sign out, retry) is a TextLink. Preference
 * defaults are seeded from the live `/auth/me` payload; edits are local UI
 * state. Sign out runs the REAL auth-store logout. Reminders fire from REAL
 * actions elsewhere (e.g. revision snooze), so there's no test-notification CTA.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { TextLink } from '@/components/ui/PillButton';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { Select } from '@/components/ui/Select';
import { Stepper } from '@/components/ui/Stepper';
import { Icon } from '@/components/ui/Icon';
import { AppHeader } from '@/components/ui/AppHeader';

import {
  SectionHeader,
  SectionCard,
  RowDivider,
  ToggleRow,
  ControlRow,
} from '@/components/settings/SettingsParts';
import { Eyebrow, StateBlock } from '@/components/account/SteepParts';
import { useAccount, type RawThemeMode } from '@/components/account/accountApi';

import { spacing, motion } from '@/theme/tokens';
import { useTheme } from '@/theme';
import {
  requestNotificationPermissions,
  cancelAllReminders,
} from '@/services/notifications';
import { useAuthStore } from '@/store/useAuthStore';
import type { AppLanguage } from '@/types/models';

/* ------------------------------------------------------------------ */
/* Option lists                                                        */
/* ------------------------------------------------------------------ */

const THEME_OPTIONS: { label: string; value: RawThemeMode; icon: 'sun' | 'moon' | 'settings' }[] = [
  { label: 'System', value: 'system', icon: 'settings' },
  { label: 'Light', value: 'light', icon: 'sun' },
  { label: 'Dark', value: 'dark', icon: 'moon' },
];

const LANGUAGE_OPTIONS: { label: string; value: AppLanguage; icon: 'globe' }[] = [
  { label: 'English', value: 'en', icon: 'globe' },
  { label: 'Español', value: 'es', icon: 'globe' },
  { label: 'हिन्दी', value: 'hi', icon: 'globe' },
  { label: 'Français', value: 'fr', icon: 'globe' },
];

/** Whole-hour ticks 00:00..23:00 for the quiet-hours Select. */
const HOUR_OPTIONS: { label: string; value: string }[] = Array.from({ length: 24 }, (_, h) => {
  const value = String(h);
  const label = `${String(h).padStart(2, '0')}:00`;
  return { label, value };
});

/* ------------------------------------------------------------------ */
/* A subtle staggered entrance wrapper                                  */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const account = useAccount();
  const logout = useAuthStore((s) => s.logout);

  // Theme preference is driven by the live ThemeProvider so toggling it here
  // re-skins the whole app instantly (and persists via the UI store).
  const { colors, mode: theme, setMode: setTheme } = useTheme();

  // Local preference state — seeded from the live account once it loads.
  const [language, setLanguage] = useState<AppLanguage>('en');
  const [dailyGoal, setDailyGoal] = useState(3);
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [revisionReminders, setRevisionReminders] = useState(true);
  const [streakAlerts, setStreakAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [quietHours, setQuietHours] = useState(false);
  const [quietStart, setQuietStart] = useState('22');
  const [quietEnd, setQuietEnd] = useState('7');
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    const a = account.data;
    if (!a || seeded) return;
    // Theme preference is owned by the local ThemeProvider/store (persisted),
    // so we don't overwrite it from the account here.
    setDailyGoal(a.dailyProblemGoal);
    setFocusMinutes(Math.max(5, Math.round(a.dailyStudyGoalMinutes / 4)));
    setPushEnabled(a.pushEnabled);
    setQuietHours(a.quietHoursEnabled);
    setQuietStart(String(a.quietStartHour));
    setQuietEnd(String(a.quietEndHour));
    setSeeded(true);
  }, [account.data, seeded]);

  // Enabling a reminder toggle first asks for OS permission; denial keeps it off.
  const enableWithPermission = useCallback(
    async (set: (v: boolean) => void, next: boolean) => {
      if (!next) {
        set(false);
        return;
      }
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Notifications are off',
          'Enable notifications for Kivo in your device Settings to receive reminders.',
        );
        return;
      }
      set(true);
    },
    [],
  );

  const confirmLogout = useCallback(() => {
    Alert.alert('Sign out', 'You can sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await logout();
            router.replace('/(auth)/login');
          })();
        },
      },
    ]);
  }, [logout, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
      >
        <AppHeader title="Settings" onBack={() => router.back()} />

        {/* ---------- Intro ---------- */}
        <Enter>
          <View style={{ marginTop: spacing.md, marginBottom: spacing.xl, gap: 2 }}>
            <Eyebrow label="Preferences" />
            <AppText variant="headingLg" display weight="medium">
              Tune Kivo to you
            </AppText>
          </View>
        </Enter>

        {account.isError && !account.data ? (
          <StateBlock
            kind="error"
            title="Couldn't load your settings"
            message={account.error?.message}
            onRetry={() => account.refetch()}
            style={{ marginBottom: spacing.xl }}
          />
        ) : null}

        {/* ============================================================ */}
        {/* Notifications                                                  */}
        {/* ============================================================ */}
        <Enter delay={60}>
        <SectionHeader title="Notifications" />
        <SectionCard tone="cool">
          <ToggleRow
            icon="bell"
            title="Push notifications"
            subtitle="Master switch for all reminders"
            value={pushEnabled}
            onValueChange={(v) => void enableWithPermission(setPushEnabled, v)}
          />
          <RowDivider />
          <ToggleRow
            icon="repeat"
            title="Revision reminders"
            subtitle="When spaced reviews are due"
            value={revisionReminders}
            onValueChange={(v) => void enableWithPermission(setRevisionReminders, v)}
          />
          <RowDivider />
          <ToggleRow
            icon="flame"
            title="Streak alerts"
            subtitle="Protect your streak before midnight"
            value={streakAlerts}
            onValueChange={(v) => void enableWithPermission(setStreakAlerts, v)}
          />
          <RowDivider />
          <ToggleRow
            icon="chart"
            title="Weekly report"
            subtitle="Your Sunday productivity recap"
            value={weeklyReport}
            onValueChange={(v) => void enableWithPermission(setWeeklyReport, v)}
          />
        </SectionCard>
        </Enter>

        {/* ============================================================ */}
        {/* Quiet hours                                                   */}
        {/* ============================================================ */}
        <Enter delay={120}>
        <SectionHeader title="Quiet hours" />
        <SectionCard tone="warm">
          <ToggleRow
            icon="moon"
            title="Pause overnight"
            subtitle="Mute alerts during your sleep window"
            value={quietHours}
            onValueChange={(v) => {
              setQuietHours(v);
              if (v) void cancelAllReminders();
            }}
          />
          <RowDivider />
          <View
            style={{
              flexDirection: 'row',
              gap: spacing.md,
              padding: spacing.md,
              opacity: quietHours ? 1 : 0.45,
            }}
          >
            <Select
              label="From"
              title="Quiet hours start"
              options={HOUR_OPTIONS}
              value={quietStart}
              onChange={setQuietStart}
              disabled={!quietHours}
              style={{ flex: 1 }}
            />
            <Select
              label="To"
              title="Quiet hours end"
              options={HOUR_OPTIONS}
              value={quietEnd}
              onChange={setQuietEnd}
              disabled={!quietHours}
              style={{ flex: 1 }}
            />
          </View>
        </SectionCard>
        </Enter>

        {/* ============================================================ */}
        {/* Appearance                                                    */}
        {/* ============================================================ */}
        <Enter delay={180}>
        <SectionHeader title="Appearance" />
        <SectionCard>
          <ControlRow icon="sun" title="Theme" subtitle="Auto follows your device" align="block">
            <SegmentedTabs options={THEME_OPTIONS} value={theme} onChange={setTheme} />
          </ControlRow>
          <RowDivider />
          <ControlRow icon="globe" title="Language" align="center">
            <Select
              title="Language"
              options={LANGUAGE_OPTIONS}
              value={language}
              onChange={setLanguage}
              style={{ width: 150 }}
            />
          </ControlRow>
        </SectionCard>
        </Enter>

        {/* ============================================================ */}
        {/* Study                                                         */}
        {/* ============================================================ */}
        <Enter delay={240}>
        <SectionHeader title="Study" />
        <SectionCard>
          <ControlRow icon="target" title="Daily goal" subtitle="Problems to solve each day" align="center">
            <Stepper value={dailyGoal} onChange={setDailyGoal} min={1} max={20} suffix="/ day" />
          </ControlRow>
          <RowDivider />
          <ControlRow icon="timer" title="Focus length" subtitle="Default deep-work block" align="center">
            <Stepper value={focusMinutes} onChange={setFocusMinutes} min={5} max={90} step={5} suffix="min" />
          </ControlRow>
        </SectionCard>
        </Enter>

        {/* ============================================================ */}
        {/* Account                                                       */}
        {/* ============================================================ */}
        <Enter delay={300}>
        <SectionHeader title="Account" />
        <View style={{ alignItems: 'center', gap: spacing.md, marginTop: spacing.xs }}>
          <TextLink
            label="Sign out"
            onPress={confirmLogout}
            muted
            icon={<Icon name="log-out" size={16} color="muted" weight="light" />}
          />
          <AppText variant="caption" color={colors.muted}>
            {account.data?.email ?? 'Kivo'} · v1.0.0
          </AppText>
        </View>
        </Enter>
      </ScrollView>
    </View>
  );
}
