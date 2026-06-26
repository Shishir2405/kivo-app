/**
 * Settings.
 *
 * A calm, organised preferences screen composed entirely from the Aaply
 * neumorphic kit on the graphite-mist canvas. ZERO emoji — every glyph is a
 * vector Icon. NO radio buttons / native pickers: theme uses SegmentedTabs,
 * quiet-hours start/end use the custom Select bottom-sheet, per-category
 * notification settings use SoftToggle switches, and the daily goal uses the
 * neumorphic Stepper. Account actions are SoftButtons.
 *
 * Reads `mockSettings` for the initial state; all edits are local UI state
 * (this is a front-end-only mock app, nothing is persisted).
 */
import React, { useCallback, useState } from 'react';
import { View, ScrollView, Image, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { SoftIconButton } from '@/components/ui/SoftIconButton';
import { SoftButton } from '@/components/ui/SoftButton';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { Select } from '@/components/ui/Select';
import { Stepper } from '@/components/ui/Stepper';
import { Tag } from '@/components/ui/Tag';
import { Icon } from '@/components/ui/Icon';
import { GrayMark } from '@/components/ui/AppHeader';

import {
  SectionHeader,
  SectionCard,
  RowDivider,
  ToggleRow,
  ControlRow,
} from '@/components/settings/SettingsParts';

import { colors, radii } from '@/theme/tokens';
import {
  requestNotificationPermissions,
  scheduleReminderInSeconds,
  cancelAllReminders,
} from '@/services/notifications';
import { mockSettings } from '@/data/mock';
import type {
  NotificationPreferences,
  ThemeMode,
  WeekStart,
  AppLanguage,
} from '@/types/models';

/* ------------------------------------------------------------------ */
/* Option lists                                                        */
/* ------------------------------------------------------------------ */

const THEME_OPTIONS: { label: string; value: ThemeMode; icon: 'settings' | 'sun' | 'moon' }[] = [
  { label: 'System', value: 'system', icon: 'settings' },
  { label: 'Light', value: 'light', icon: 'sun' },
  { label: 'Dark', value: 'dark', icon: 'moon' },
];

const WEEK_START_OPTIONS: { label: string; value: WeekStart; icon: 'calendar' }[] = [
  { label: 'Monday', value: 'mon', icon: 'calendar' },
  { label: 'Sunday', value: 'sun', icon: 'calendar' },
];

const LANGUAGE_OPTIONS: { label: string; value: AppLanguage; icon: 'globe' }[] = [
  { label: 'English', value: 'en', icon: 'globe' },
  { label: 'Español', value: 'es', icon: 'globe' },
  { label: 'हिन्दी', value: 'hi', icon: 'globe' },
  { label: 'Français', value: 'fr', icon: 'globe' },
];

/** Half-hour ticks 00:00 .. 23:30 for the quiet-hours Select. */
const TIME_OPTIONS: { label: string; value: string }[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  const value = `${String(h).padStart(2, '0')}:${m}`;
  return { label: value, value };
});

/** The notification categories, in display order, with their glyph + accent. */
const NOTIFICATION_ROWS: {
  key: keyof NotificationPreferences;
  icon: 'repeat' | 'target' | 'flame' | 'calendar-check' | 'clipboard' | 'trophy' | 'chart';
  accent: 'highlighter' | 'signal' | 'peach' | 'annotation' | 'success';
  title: string;
  subtitle: string;
}[] = [
  {
    key: 'revisionReminders',
    icon: 'repeat',
    accent: 'highlighter',
    title: 'Revision reminders',
    subtitle: 'When spaced revisions are due',
  },
  {
    key: 'dailyGoalAlerts',
    icon: 'target',
    accent: 'signal',
    title: 'Daily goal alerts',
    subtitle: 'Nudge when you are close to your goal',
  },
  {
    key: 'streakAlerts',
    icon: 'flame',
    accent: 'peach',
    title: 'Streak alerts',
    subtitle: 'Protect your streak before midnight',
  },
  {
    key: 'habitReminders',
    icon: 'calendar-check',
    accent: 'success',
    title: 'Habit reminders',
    subtitle: 'Daily routine check-ins',
  },
  {
    key: 'taskReminders',
    icon: 'clipboard',
    accent: 'annotation',
    title: 'Task reminders',
    subtitle: 'Upcoming and overdue tasks',
  },
  {
    key: 'achievementAlerts',
    icon: 'trophy',
    accent: 'highlighter',
    title: 'Achievement alerts',
    subtitle: 'When you unlock a new badge',
  },
  {
    key: 'weeklyReport',
    icon: 'chart',
    accent: 'signal',
    title: 'Weekly report',
    subtitle: 'Your Sunday productivity recap',
  },
];

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Local, in-memory edit state seeded from the mock payload.
  const { profile } = mockSettings;
  const [notifications, setNotifications] = useState<NotificationPreferences>(
    mockSettings.notifications,
  );
  const [theme, setTheme] = useState<ThemeMode>(mockSettings.preferences.theme);
  const [weekStart, setWeekStart] = useState<WeekStart>(mockSettings.preferences.weekStart);
  const [language, setLanguage] = useState<AppLanguage>(mockSettings.preferences.language);
  const [dailyGoal, setDailyGoal] = useState<number>(mockSettings.preferences.dailyGoal);
  const [focusDuration, setFocusDuration] = useState<number>(
    mockSettings.preferences.focusDuration,
  );
  const [haptics, setHaptics] = useState<boolean>(mockSettings.preferences.haptics);
  const [soundEffects, setSoundEffects] = useState<boolean>(
    mockSettings.preferences.soundEffects,
  );

  function setNotif<K extends keyof NotificationPreferences>(
    key: K,
    val: NotificationPreferences[K],
  ) {
    setNotifications((prev) => ({ ...prev, [key]: val }));
  }

  // Boolean keys are the on/off reminder categories (everything but the quiet
  // window times, which are strings).
  type NotifBoolKey = {
    [K in keyof NotificationPreferences]: NotificationPreferences[K] extends boolean ? K : never;
  }[keyof NotificationPreferences];

  /**
   * Enabling any reminder toggle requests OS notification permission first. If
   * the user denies it, the toggle stays OFF and we surface a short hint.
   * Turning a toggle off never prompts.
   */
  const toggleNotif = useCallback(
    async (key: NotifBoolKey, next: boolean) => {
      if (!next) {
        setNotif(key, false);
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
      setNotif(key, true);
    },
    [],
  );

  // Fire a real local notification a few seconds out so the user can confirm
  // phone reminders work end-to-end.
  const [testState, setTestState] = useState<'idle' | 'scheduled'>('idle');
  const sendTestReminder = useCallback(async () => {
    const id = await scheduleReminderInSeconds(5, {
      title: 'Kivo reminder',
      body: 'This is a test reminder — your phone notifications are working.',
      data: { kind: 'test' },
    });
    if (!id) {
      Alert.alert(
        'Notifications are off',
        'Enable notifications for Kivo in your device Settings to receive reminders.',
      );
      return;
    }
    setTestState('scheduled');
    setTimeout(() => setTestState('idle'), 6000);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 44,
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
            <Icon name="settings" size={16} color="carbon" strokeWidth={2.2} />
            <AppText variant="body" weight="bold" style={{ fontSize: 16 }}>
              Settings
            </AppText>
          </View>
          {/* Spacer to balance the cluster and center the title. */}
          <View style={{ width: 44 }} />
        </View>

        {/* ---------- Header ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 360 }}
          style={{ marginTop: 18, marginBottom: 24 }}
        >
          <View className="flex-row items-center" style={{ gap: 7 }}>
            <Icon name="user" size={14} color="signal" strokeWidth={2.25} />
            <AppText
              variant="caption"
              weight="semibold"
              color={colors.textSubtle}
              style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 11 }}
            >
              Your account
            </AppText>
          </View>
          <AppText variant="heading" display weight="bold" style={{ marginTop: 6 }}>
            Tune Kivo to you
          </AppText>
        </MotiView>

        {/* ============================================================ */}
        {/* Profile                                                       */}
        {/* ============================================================ */}
        <SectionHeader icon="user" title="Profile" accent="signal" index={0} />
        <SectionCard index={0} padding={20}>
          <View className="flex-row items-center" style={{ gap: 16 }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Edit avatar">
              <Neumorph variant="raised" radius={999} intensity="sm" padding={5}>
                {profile.avatar != null ? (
                  <Image
                    source={profile.avatar}
                    style={{ width: 66, height: 66, borderRadius: 999 }}
                  />
                ) : (
                  <View
                    style={{
                      width: 66,
                      height: 66,
                      borderRadius: 999,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.highlighter,
                    }}
                  >
                    <AppText variant="subheading" display weight="bold">
                      {profile.name.slice(0, 1)}
                    </AppText>
                  </View>
                )}
              </Neumorph>
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
                <Icon name="camera" size={12} color="carbon" strokeWidth={2.4} />
              </View>
            </Pressable>

            <View style={{ flex: 1, gap: 3 }}>
              <AppText variant="subheading" display weight="bold" numberOfLines={1}>
                {profile.name}
              </AppText>
              <View className="flex-row items-center" style={{ gap: 5 }}>
                <Icon name="at-sign" size={13} color="textMuted" strokeWidth={2.2} />
                <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 13 }} numberOfLines={1}>
                  {profile.username}
                </AppText>
              </View>
              <View className="flex-row items-center" style={{ gap: 5 }}>
                <Icon name="mail" size={13} color="textMuted" strokeWidth={2.2} />
                <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 13 }} numberOfLines={1}>
                  {profile.email}
                </AppText>
              </View>
            </View>
          </View>

          {profile.bio ? (
            <View style={{ marginTop: 16 }}>
              <Neumorph variant="inset" radius={radii.input} intensity="sm" padding={14} surface={colors.canvas}>
                <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 13, lineHeight: 19 }}>
                  {profile.bio}
                </AppText>
              </Neumorph>
            </View>
          ) : null}

          <View style={{ marginTop: 16 }}>
            <SoftButton
              variant="neutral"
              fullWidth
              label="Edit profile"
              icon={<Icon name="edit" size={17} color="carbon" />}
              onPress={() => router.back()}
            />
          </View>
        </SectionCard>

        {/* ============================================================ */}
        {/* Notification preferences                                      */}
        {/* ============================================================ */}
        <SectionHeader icon="bell" title="Notifications" accent="annotation" index={1} />
        <SectionCard index={1}>
          {NOTIFICATION_ROWS.map((row, i) => (
            <View key={row.key}>
              <ToggleRow
                icon={row.icon}
                accent={row.accent}
                title={row.title}
                subtitle={row.subtitle}
                value={notifications[row.key] as boolean}
                onValueChange={(v) => {
                  void toggleNotif(row.key as NotifBoolKey, v);
                }}
              />
              {i < NOTIFICATION_ROWS.length - 1 ? <RowDivider /> : null}
            </View>
          ))}
        </SectionCard>

        {/* Real phone reminder — schedules a LOCAL notification ~5s out. */}
        <View style={{ marginBottom: 22, gap: 8 }}>
          <SoftButton
            variant={testState === 'scheduled' ? 'neutral' : 'yellow'}
            fullWidth
            label={testState === 'scheduled' ? 'Reminder scheduled' : 'Send a test reminder'}
            icon={
              <Icon
                name={testState === 'scheduled' ? 'check' : 'bell'}
                size={18}
                color="carbon"
                strokeWidth={2.3}
              />
            }
            onPress={() => {
              void sendTestReminder();
            }}
          />
          <AppText
            variant="caption"
            color={colors.textSubtle}
            style={{ fontSize: 11.5, textAlign: 'center', lineHeight: 17 }}
          >
            Fires a real notification on your phone in ~5 seconds — even if you
            close the app.
          </AppText>
        </View>

        {/* ---------- Quiet hours ---------- */}
        <SectionHeader icon="moon" title="Quiet hours" accent="peach" index={2} />
        <SectionCard index={2}>
          <ToggleRow
            icon="moon"
            accent="peach"
            title="Pause notifications"
            subtitle="Mute alerts during your sleep window"
            value={notifications.quietHours}
            onValueChange={(v) => {
              setNotif('quietHours', v);
              // Pausing clears any pending local reminders so nothing fires
              // during the quiet window.
              if (v) void cancelAllReminders();
            }}
          />
          <RowDivider />
          <View style={{ flexDirection: 'row', gap: 12, padding: 14, opacity: notifications.quietHours ? 1 : 0.45 }}>
            <Select
              label="From"
              title="Quiet hours start"
              options={TIME_OPTIONS}
              value={notifications.quietStart}
              onChange={(v) => setNotif('quietStart', v)}
              disabled={!notifications.quietHours}
              style={{ flex: 1 }}
            />
            <Select
              label="To"
              title="Quiet hours end"
              options={TIME_OPTIONS}
              value={notifications.quietEnd}
              onChange={(v) => setNotif('quietEnd', v)}
              disabled={!notifications.quietHours}
              style={{ flex: 1 }}
            />
          </View>
        </SectionCard>

        {/* ============================================================ */}
        {/* Appearance                                                    */}
        {/* ============================================================ */}
        <SectionHeader icon="sun" title="Appearance" accent="highlighter" index={3} />
        <SectionCard index={3}>
          <ControlRow icon="sun" accent="highlighter" title="Theme" subtitle="System follows your device" align="block">
            <SegmentedTabs options={THEME_OPTIONS} value={theme} onChange={setTheme} />
          </ControlRow>
          <RowDivider />
          <ControlRow icon="globe" accent="signal" title="Language" align="center">
            <Select
              title="Language"
              options={LANGUAGE_OPTIONS}
              value={language}
              onChange={setLanguage}
              style={{ width: 150 }}
            />
          </ControlRow>
        </SectionCard>

        {/* ============================================================ */}
        {/* Study preferences                                             */}
        {/* ============================================================ */}
        <SectionHeader icon="target" title="Study" accent="success" index={4} />
        <SectionCard index={4}>
          <ControlRow
            icon="target"
            accent="highlighter"
            title="Daily goal"
            subtitle="Problems to solve each day"
            align="center"
          >
            <Stepper value={dailyGoal} onChange={setDailyGoal} min={1} max={20} suffix="/ day" />
          </ControlRow>
          <RowDivider />
          <ControlRow
            icon="timer"
            accent="signal"
            title="Focus length"
            subtitle="Default deep-work session"
            align="center"
          >
            <Stepper
              value={focusDuration}
              onChange={setFocusDuration}
              min={5}
              max={90}
              step={5}
              suffix="min"
            />
          </ControlRow>
          <RowDivider />
          <ControlRow icon="calendar" accent="peach" title="Week starts on" align="center">
            <SegmentedTabs
              options={WEEK_START_OPTIONS}
              value={weekStart}
              onChange={setWeekStart}
              fullWidth={false}
              style={{ width: 188 }}
            />
          </ControlRow>
        </SectionCard>

        {/* ============================================================ */}
        {/* Feedback                                                      */}
        {/* ============================================================ */}
        <SectionHeader icon="zap" title="Feedback" accent="signal" index={5} />
        <SectionCard index={5}>
          <ToggleRow
            icon="zap"
            accent="highlighter"
            title="Haptics"
            subtitle="Vibrate on key interactions"
            value={haptics}
            onValueChange={setHaptics}
          />
          <RowDivider />
          <ToggleRow
            icon="volume-up"
            accent="signal"
            title="Sound effects"
            subtitle="Chime when a session ends"
            value={soundEffects}
            onValueChange={setSoundEffects}
          />
        </SectionCard>

        {/* ============================================================ */}
        {/* Account                                                       */}
        {/* ============================================================ */}
        <SectionHeader icon="lock" title="Account" accent="annotation" index={6} />
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 360, delay: 90 + 6 * 40 }}
          style={{ marginBottom: 22, gap: 12 }}
        >
          <SoftButton
            variant="neutral"
            fullWidth
            label="Export my data"
            icon={<Icon name="download" size={18} color="carbon" />}
          />
          <SoftButton
            variant="neutral"
            fullWidth
            label="Sign out"
            icon={<Icon name="log-out" size={18} color="carbon" />}
            onPress={() => router.replace('/(auth)/login')}
          />
          {/* Destructive action — annotation-red ink to flag it. */}
          <Pressable accessibilityRole="button" accessibilityLabel="Delete account">
            <SoftCard radius={radii.pill} padding={0} intensity="sm">
              <View
                className="flex-row items-center justify-center"
                style={{ paddingVertical: 16, gap: 8 }}
              >
                <Icon name="trash" size={18} color="annotation" />
                <AppText variant="body" weight="semibold" color={colors.annotation} style={{ fontSize: 16 }}>
                  Delete account
                </AppText>
              </View>
            </SoftCard>
          </Pressable>
        </MotiView>

        {/* ============================================================ */}
        {/* About                                                         */}
        {/* ============================================================ */}
        <View className="items-center" style={{ marginTop: 4, gap: 8 }}>
          <Neumorph variant="raised" radius={16} intensity="sm" padding={12} surface={colors.canvas}>
            <Icon name="zap" size={22} color="highlighter" strokeWidth={2.2} fill="highlighter" />
          </Neumorph>
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <AppText variant="body" weight="bold" style={{ fontSize: 15 }}>
              Kivo
            </AppText>
            <Tag label={`v${mockSettings.appVersion}`} tone="neutral" size="sm" />
          </View>
          <AppText variant="caption" color={colors.textSubtle} style={{ fontSize: 11 }}>
            Consistency over intensity.
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}
