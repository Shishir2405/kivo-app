/**
 * Notifications service for Kivo.
 *
 * Two delivery paths live here:
 *
 *  1. LOCAL reminders (`scheduleLocalReminder`) — scheduled on-device with
 *     `expo-notifications`. These FIRE ON THE PHONE even when the app is closed
 *     and the device is OFFLINE. This is what powers the "Remind me" actions
 *     (e.g. revision snooze). It works in Expo Go *for the schedule
 *     itself*, though for the most reliable behaviour use a Dev/EAS build.
 *
 *  2. REMOTE push (`registerForPushNotificationsAsync` + `registerDeviceToken`)
 *     — fetches the NATIVE device push token and best-effort POSTs it to the
 *     backend. The Kivo backend sends via Firebase Admin (FCM
 *     `sendEachForMulticast`), so it needs the native FCM/APNs token, NOT an
 *     Expo push token. NOTE: obtaining a device token requires a real device
 *     AND a Dev Client / EAS build with Firebase config (it does NOT work in
 *     Expo Go on SDK 53+). LOCAL reminders above do not need any of this. See
 *     NOTIFICATIONS.md for the Firebase/APNs setup required to receive push.
 */
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { api } from './api';
import { colors } from '@/theme/tokens';

/** Android channel id reused for all Kivo reminders. */
export const KIVO_CHANNEL_ID = 'kivo-reminders';

/* ------------------------------------------------------------------ */
/* Foreground handler                                                  */
/* ------------------------------------------------------------------ */

/**
 * Decide how a notification is presented while the app is in the FOREGROUND.
 * Without this, iOS suppresses the banner when the app is open. Call once at
 * startup (the `useNotifications` hook does this).
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      // Kept for back-compat with older runtimes that read this field.
      shouldShowAlert: true,
    }),
  });
}

/**
 * Ensure the Android notification channel exists. No-op on iOS. Android
 * requires a channel before scheduled notifications will display reliably.
 */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(KIVO_CHANNEL_ID, {
    name: 'Kivo reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: colors.highlighter,
  });
}

/* ------------------------------------------------------------------ */
/* Permissions                                                         */
/* ------------------------------------------------------------------ */

/**
 * Request notification permission. Returns `true` only if the user granted it.
 * Safe to call repeatedly — if already granted it resolves immediately.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain && current.status === 'denied') return false;

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  return requested.granted;
}

/** Whether notification permission is currently granted. */
export async function hasNotificationPermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  return current.granted;
}

/* ------------------------------------------------------------------ */
/* Push registration (remote)                                          */
/* ------------------------------------------------------------------ */

/**
 * Register this device for REMOTE push and return the NATIVE device push token,
 * or `null` when unavailable (simulator/emulator, denied permission, or running
 * in Expo Go / a build without Firebase config). Never throws.
 *
 * `getDevicePushTokenAsync()` returns:
 *   - Android: the FCM registration token — exactly what the backend's Firebase
 *     Admin `sendEachForMulticast` call expects.
 *   - iOS: the raw APNs token. Sending it through Firebase requires the Firebase
 *     iOS app to be configured (GoogleService-Info.plist + an APNs .p8 key
 *     uploaded to Firebase). That iOS Firebase setup is NOT done here yet; the
 *     APNs token is still registered and is acceptable for now (see
 *     NOTIFICATIONS.md).
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    // Push tokens only exist on real hardware.
    if (!Device.isDevice) return null;

    const granted = await requestNotificationPermissions();
    if (!granted) return null;

    await ensureAndroidChannel();

    // Native FCM (Android) / APNs (iOS) token — NOT an Expo push token, because
    // the backend dispatches via Firebase Admin FCM.
    const token = await Notifications.getDevicePushTokenAsync();
    return typeof token.data === 'string' ? token.data : String(token.data);
  } catch {
    // Expo Go (no native push entitlement) / missing Firebase config land here.
    return null;
  }
}

/**
 * Best-effort: hand the native device push token to the backend so its Firebase
 * Admin layer can target this device. Swallows all errors — a failed token sync
 * must never block the UI.
 */
export async function registerDeviceToken(token: string): Promise<void> {
  try {
    await api.post('/users/me/devices', {
      token,
      platform: Platform.OS,
    });
  } catch {
    // Ignored on purpose (auth not wired yet / offline / backend unreachable).
  }
}

/* ------------------------------------------------------------------ */
/* Local reminders                                                     */
/* ------------------------------------------------------------------ */

export type LocalReminderInput = {
  title: string;
  body: string;
  /** When the reminder should fire. Must be in the future. */
  date: Date;
  /** Optional payload echoed back when the user taps the notification. */
  data?: Record<string, unknown>;
};

/**
 * Schedule a LOCAL reminder that fires on the phone at `date` — works offline
 * and even when the app is killed. Requests permission first; returns the
 * scheduled notification id, or `null` if permission was denied or the date is
 * not in the future.
 */
export async function scheduleLocalReminder(
  input: LocalReminderInput,
): Promise<string | null> {
  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  await ensureAndroidChannel();

  // Clamp to at least ~2s out so "now-ish" requests still actually fire.
  const fireAt = new Date(Math.max(input.date.getTime(), Date.now() + 2000));

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: input.title,
      body: input.body,
      sound: true,
      data: input.data ?? {},
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
      channelId: KIVO_CHANNEL_ID,
    },
  });
  return id;
}

/**
 * Convenience: schedule a reminder `seconds` from now. Handy for a "test
 * reminder" button — pass e.g. 5 to get a notification in ~5 seconds.
 */
export async function scheduleReminderInSeconds(
  seconds: number,
  content: { title: string; body: string; data?: Record<string, unknown> },
): Promise<string | null> {
  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  await ensureAndroidChannel();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      sound: true,
      data: content.data ?? {},
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.round(seconds)),
      channelId: KIVO_CHANNEL_ID,
    },
  });
  return id;
}

/** Cancel a single scheduled reminder by id. Never throws. */
export async function cancelReminder(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    /* already fired / unknown id — ignore */
  }
}

/** Cancel every scheduled reminder. Never throws. */
export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    /* ignore */
  }
}
