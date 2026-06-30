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
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useQueryClient } from '@tanstack/react-query';

import { AppText } from '@/components/ui/Typography';
import { TextLink } from '@/components/ui/PillButton';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { Select } from '@/components/ui/Select';
import { Stepper } from '@/components/ui/Stepper';
import { Icon } from '@/components/ui/Icon';
import { AppHeader } from '@/components/ui/AppHeader';
import { MenuRow } from '@/components/profile';

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
import { useTheme, useThemeTransition } from '@/theme';
import {
  requestNotificationPermissions,
  cancelAllReminders,
} from '@/services/notifications';
import { useAuthStore } from '@/store/useAuthStore';
import {
  useUpdatePreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/api';
import type {
  AppLanguage,
  AppPreferences,
  NotificationPreferences,
} from '@/types/models';

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

/**
 * Daily problem-goal limits — mirror the backend `users.validator`
 * (`dailyProblemGoal: z.number().int().min(0).max(100)`). The Stepper's own
 * min/max keeps a tap in range, but the value is SEEDED from `/auth/me`, so a
 * corrupt / legacy out-of-range value must still be caught before we PATCH.
 */
const DAILY_GOAL_MIN = 0;
const DAILY_GOAL_MAX = 100;

/** Returns an inline error message if `goal` is outside the backend range. */
function dailyGoalErrorFor(goal: number): string | undefined {
  if (!Number.isInteger(goal)) return 'Daily goal must be a whole number';
  if (goal < DAILY_GOAL_MIN || goal > DAILY_GOAL_MAX)
    return `Daily goal must be between ${DAILY_GOAL_MIN} and ${DAILY_GOAL_MAX}`;
  return undefined;
}

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

/** Convert a whole-hour string ("22") into the "HH:MM" the API expects. */
function hourToHHMM(hour: string): string {
  const h = Math.max(0, Math.min(23, parseInt(hour, 10) || 0));
  return `${String(h).padStart(2, '0')}:00`;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();

  const account = useAccount();
  const logout = useAuthStore((s) => s.logout);

  const updatePrefs = useUpdatePreferences();
  const updateNotif = useUpdateNotificationPreferences();

  // Theme preference is driven by the live ThemeProvider so toggling it here
  // re-skins the whole app instantly (and persists via the UI store).
  const { colors, mode: theme } = useTheme();
  // Circular-reveal theme switch: the new theme "irises" out from the toggle.
  const { transitionTheme } = useThemeTransition();
  // Wraps the theme SegmentedControl so we can measure its on-screen center and
  // use it as the reveal origin (SegmentedControl's onChange gives no touch
  // coords, so the control center is the origin — looks great either way).
  const themeControlRef = useRef<View>(null);

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

  // Save-on-change status surfaced quietly under the screen title.
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Debounce timer for rapid-fire controls (steppers) so we PATCH once they settle.
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashSaved = useCallback(() => {
    setSaveState('saved');
    setSaveError(null);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaveState('idle'), 1600);
  }, []);

  // Persist a slice of app preferences (PATCH /users/me/preferences).
  const savePrefs = useCallback(
    (patch: Partial<AppPreferences>) => {
      setSaveState('saving');
      updatePrefs.mutate(patch, {
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: ['account', 'me'] });
          flashSaved();
        },
        onError: (e) => {
          setSaveState('error');
          setSaveError(e.message);
        },
      });
    },
    [updatePrefs, qc, flashSaved],
  );

  // Persist a slice of notification preferences (PATCH .../notification-preferences).
  const saveNotif = useCallback(
    (patch: Partial<NotificationPreferences>) => {
      setSaveState('saving');
      updateNotif.mutate(patch, {
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: ['account', 'me'] });
          flashSaved();
        },
        onError: (e) => {
          setSaveState('error');
          setSaveError(e.message);
        },
      });
    },
    [updateNotif, qc, flashSaved],
  );

  // Debounced preference save — used by the steppers (goal / focus length) so a
  // run of taps PATCHes once the value settles rather than on every increment.
  const savePrefsDebounced = useCallback(
    (patch: Partial<AppPreferences>) => {
      setSaveState('saving');
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => savePrefs(patch), 600);
    },
    [savePrefs],
  );

  // Theme toggle handler — measure the control's on-screen center and run the
  // circular reveal to `next` (the provider commits the theme + persists once
  // the screen is covered), then persist the backend preference.
  const handleThemeChange = useCallback(
    (next: RawThemeMode) => {
      const measureView = themeControlRef.current;
      if (measureView) {
        measureView.measureInWindow((x, y, w, h) => {
          transitionTheme(next, { x: x + w / 2, y: y + h / 2 });
        });
      } else {
        transitionTheme(next);
      }
      savePrefs({ theme: next });
    },
    [transitionTheme, savePrefs],
  );

  // Enabling a reminder toggle first asks for OS permission; denial keeps it off.
  // On grant it updates local state, runs an optional persister, and saves.
  const enableWithPermission = useCallback(
    async (set: (v: boolean) => void, next: boolean, persist?: (v: boolean) => void) => {
      if (!next) {
        set(false);
        persist?.(false);
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
      persist?.(true);
    },
    [],
  );

  // Inline validation for the daily problem goal (backend range 0–100). The
  // Stepper clamps taps, but the seeded value can be out of range, so we surface
  // an error and gate the PATCH on it below.
  const dailyGoalError = dailyGoalErrorFor(dailyGoal);

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
            {/* Save-on-change status — quiet, never blocks the UI. */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 18, marginTop: 4 }}>
              {saveState === 'saving' ? (
                <>
                  <Icon name="refresh" size={13} color="muted" />
                  <AppText variant="caption" color={colors.muted}>
                    Saving…
                  </AppText>
                </>
              ) : saveState === 'saved' ? (
                <>
                  <Icon name="check" size={13} color="success" />
                  <AppText variant="caption" color={colors.success}>
                    Saved
                  </AppText>
                </>
              ) : saveState === 'error' ? (
                <>
                  <Icon name="alert" size={13} color="danger" />
                  <AppText variant="caption" color={colors.danger} numberOfLines={1} style={{ flex: 1 }}>
                    {saveError ?? 'Couldn’t save — tap to retry'}
                  </AppText>
                </>
              ) : null}
            </View>
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
            onValueChange={(v) =>
              void enableWithPermission(setRevisionReminders, v, (next) =>
                saveNotif({ revisionReminders: next }),
              )
            }
          />
          <RowDivider />
          <ToggleRow
            icon="flame"
            title="Streak alerts"
            subtitle="Protect your streak before midnight"
            value={streakAlerts}
            onValueChange={(v) =>
              void enableWithPermission(setStreakAlerts, v, (next) =>
                saveNotif({ streakAlerts: next }),
              )
            }
          />
          <RowDivider />
          <ToggleRow
            icon="chart"
            title="Weekly report"
            subtitle="Your Sunday productivity recap"
            value={weeklyReport}
            onValueChange={(v) =>
              void enableWithPermission(setWeeklyReport, v, (next) =>
                saveNotif({ weeklyReport: next }),
              )
            }
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
              saveNotif({
                quietHours: v,
                quietStart: hourToHHMM(quietStart),
                quietEnd: hourToHHMM(quietEnd),
              });
            }}
          />
          <RowDivider />
          <View style={{ padding: spacing.md, opacity: quietHours ? 1 : 0.45 }}>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Select
                label="From"
                title="Quiet hours start"
                options={HOUR_OPTIONS}
                value={quietStart}
                onChange={(v) => {
                  // hourToHHMM clamps to 0–23, so the API never sees an out-of-range hour.
                  setQuietStart(v);
                  // Send the FULL quiet-hours triple — the backend's nested schema
                  // is strict and requires { enabled, startHour, endHour } together.
                  saveNotif({
                    quietHours,
                    quietStart: hourToHHMM(v),
                    quietEnd: hourToHHMM(quietEnd),
                  });
                }}
                disabled={!quietHours}
                style={{ flex: 1 }}
              />
              <Select
                label="To"
                title="Quiet hours end"
                options={HOUR_OPTIONS}
                value={quietEnd}
                onChange={(v) => {
                  setQuietEnd(v);
                  saveNotif({
                    quietHours,
                    quietStart: hourToHHMM(quietStart),
                    quietEnd: hourToHHMM(v),
                  });
                }}
                disabled={!quietHours}
                style={{ flex: 1 }}
              />
            </View>
            {/* Backend is lenient on start vs end; this is a non-blocking UX hint. */}
            {quietHours && quietStart === quietEnd ? (
              <AppText variant="caption" color={colors.danger} style={{ marginTop: spacing.sm }}>
                Start and end are the same — pick different hours for a real quiet window.
              </AppText>
            ) : null}
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
            <View ref={themeControlRef} collapsable={false} style={{ alignSelf: 'stretch' }}>
              <SegmentedTabs
                options={THEME_OPTIONS}
                value={theme}
                onChange={handleThemeChange}
              />
            </View>
          </ControlRow>
          <RowDivider />
          <ControlRow icon="globe" title="Language" align="center">
            <Select
              title="Language"
              options={LANGUAGE_OPTIONS}
              value={language}
              onChange={(v) => {
                // Language has no backend preference field — local UI state only.
                setLanguage(v);
              }}
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
          <ControlRow icon="target" title="Daily goal" subtitle="Problems to solve each day" align="block">
            <Stepper
              value={dailyGoal}
              onChange={(v) => {
                setDailyGoal(v);
                // Only PATCH when the new value is within the backend's 0–100
                // range — an out-of-range value would 422 against the schema.
                if (!dailyGoalErrorFor(v)) savePrefsDebounced({ dailyGoal: v });
              }}
              min={1}
              max={20}
              suffix="/ day"
            />
            {dailyGoalError ? (
              <AppText variant="caption" color={colors.danger}>
                {dailyGoalError}
              </AppText>
            ) : null}
          </ControlRow>
          <RowDivider />
          <ControlRow icon="timer" title="Focus length" subtitle="Default deep-work block" align="center">
            <Stepper
              value={focusMinutes}
              onChange={(v) => {
                // Focus length has NO backend preference field — keep it local-only
                // (sending it would 422 against the strict preferences schema).
                setFocusMinutes(v);
              }}
              min={5}
              max={90}
              step={5}
              suffix="min"
            />
          </ControlRow>
        </SectionCard>
        </Enter>

        {/* ============================================================ */}
        {/* Account                                                       */}
        {/* ============================================================ */}
        <Enter delay={300}>
        <SectionHeader title="Account" />
        <SectionCard padding={0}>
          <View style={{ paddingHorizontal: spacing.md }}>
            <MenuRow
              icon="user"
              title="Edit profile"
              onPress={() => router.push('/settings/profile')}
            />
            <MenuRow
              icon="bell"
              title="Notifications"
              onPress={() => router.push('/notifications')}
              last
            />
          </View>
        </SectionCard>
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
