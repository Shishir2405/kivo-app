/**
 * useNotifications — one-time notification bootstrap for the app.
 *
 * On mount it:
 *   1. installs the foreground presentation handler,
 *   2. ensures the Android channel exists,
 *   3. best-effort registers for remote push (real device + Dev/EAS build only)
 *      and syncs the token to the backend.
 *
 * It does NOT prompt for permission on its own — permission is requested
 * lazily the first time the user enables reminders or schedules one, so the OS
 * prompt appears in context rather than on a cold start. Call this once, high
 * in the tree (app/_layout.tsx).
 */
import { useEffect, useRef } from 'react';
import type { EventSubscription } from 'expo-modules-core';
import * as Notifications from 'expo-notifications';

import {
  configureNotificationHandler,
  ensureAndroidChannel,
  registerForPushNotificationsAsync,
  registerDeviceToken,
} from '@/services/notifications';

export function useNotifications(): void {
  const receivedSub = useRef<EventSubscription | null>(null);
  const responseSub = useRef<EventSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Foreground display behaviour + Android channel.
    configureNotificationHandler();
    void ensureAndroidChannel();

    // Best-effort remote-push registration (no-op in Expo Go / simulators).
    void (async () => {
      const token = await registerForPushNotificationsAsync();
      if (!cancelled && token) {
        await registerDeviceToken(token);
      }
    })();

    // Keep listeners alive so taps/foreground deliveries are handled cleanly.
    receivedSub.current = Notifications.addNotificationReceivedListener(() => {
      /* foreground delivery — handler above controls presentation */
    });
    responseSub.current = Notifications.addNotificationResponseReceivedListener(() => {
      /* user tapped a notification — deep-linking can hook in here later */
    });

    return () => {
      cancelled = true;
      receivedSub.current?.remove();
      responseSub.current?.remove();
    };
  }, []);
}

export default useNotifications;
