# Notifications

Kivo uses `expo-notifications` for two things:

| Path | What it does | Works in Expo Go? |
| --- | --- | --- |
| **Local reminders** | On-device scheduled notifications (`scheduleLocalReminder`, `scheduleReminderInSeconds`). Fire on the phone even offline / with the app closed. | Scheduling works; a Dev/EAS build is most reliable. |
| **Remote push** | Backend-initiated push via Firebase Admin FCM. Requires a native device push token + Firebase config + a Dev/EAS build. | **No** (SDK 53+ removed remote push from Expo Go). |

The wiring lives in:

- `src/services/notifications.ts` — handler, permissions, token registration, local scheduling.
- `src/hooks/useNotifications.ts` — bootstraps the handler + best-effort push registration on startup (called from `app/_layout.tsx`).
- `app/settings/index.tsx` — permission-aware preference toggles + a **Send a test reminder** button (fires a real local notification ~5s out).
- `app/(tabs)/revisions.tsx` — **Snooze** schedules a real local reminder ~24h out.

## Local reminders — nothing else needed

Local reminders work out of the box. The "Send a test reminder" button in
Settings proves the full path: it requests permission, schedules a notification
~5 seconds out, and the OS delivers it.

## Remote push (FCM) — backend dispatch

The Kivo backend sends push via **Firebase Admin** (`sendEachForMulticast`), so
the app registers the **native device push token** (`getDevicePushTokenAsync()`),
NOT an Expo push token. It POSTs `{ token, platform }` to `/users/me/devices`.

- **Android** → `getDevicePushTokenAsync()` returns the **FCM registration
  token**, which is exactly what the backend needs.
- **iOS** → it returns the raw **APNs token**. To route that through Firebase
  you must configure the Firebase iOS app and upload an APNs key (below).

To actually RECEIVE remote push you must:

1. **Android — DONE.** `google-services.json` (Firebase project `bad-talks-demo`,
   Android package `com.kivo.app`) is in the app root and wired in `app.json`:
   ```json
   "android": { "googleServicesFile": "./google-services.json", "package": "com.kivo.app" }
   ```
   > Keep the file present — `googleServicesFile` must point at a file that
   > exists or `expo prebuild` breaks.

2. **iOS — still TODO.** Add `GoogleService-Info.plist` (iOS bundle
   `com.kivo.app`), set `ios.googleServicesFile` in `app.json`, and upload an
   APNs **`.p8`** auth key to the Firebase project so FCM can deliver to iOS.
   Until then, iOS registers the raw APNs token (acceptable for now).

3. **Build a Dev Client or EAS build** — remote push cannot be received in Expo
   Go on SDK 53+. Run e.g. `eas build --profile development` (or
   `npx expo run:android`). Local reminders still work everywhere, including
   Expo Go.

The `expo-notifications` plugin is already configured in `app.json` with the
notification icon (`./assets/favicon.png`) and accent color (`#e6e51e`).
