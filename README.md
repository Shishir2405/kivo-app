# Kivo — Mobile App

The **Kivo** mobile app — a student productivity & DSA-prep platform built with **React Native (Expo)**.
It pairs a DSA / interview-prep workspace with a daily productivity tracker, a Smart Revision queue,
focus tools, and analytics — wrapped in a custom **neumorphic** design system.

> Backend: [kivo-backend](https://github.com/Shishir2405/kivo-backend) — layered TypeScript API
> (Express · Firebase Admin · Redis · BullMQ · Socket.IO). Live API base: `https://kivo-backend-xi.vercel.app/api/v1`.

---

## Tech stack

| Concern        | Tech                                                            |
| -------------- | -------------------------------------------------------------- |
| Framework      | Expo (SDK 56), React Native, TypeScript (strict)               |
| Navigation     | expo-router (typed routes)                                     |
| Styling        | NativeWind v4 (Tailwind) + a custom neumorphic component kit   |
| Animation      | react-native-reanimated, Moti                                  |
| Icons          | lucide-react-native (no emoji — a 105-icon registry)           |
| Vectors        | react-native-svg (+ svg transformer)                           |
| Notifications  | expo-notifications (local reminders + FCM device token)        |
| State / forms  | Zustand, React Hook Form, Zod                                  |

## Design system

A "digital sketchpad" aesthetic rendered as **soft-UI / neumorphism** on a graphite-mist `#f2f2f2` canvas:

- **Palette** — highlighter-yellow `#e6e51e` (accent), carbon `#000`, paper-white `#fff`,
  signal-blue `#466cf3`, annotation-red `#f34646`, hairline-gray `#e6e6e6`.
- **Type** — Poppins (display/headings), Inter (body) via `Typography`.
- **Logo** — the Kivo mark (yellow twin-lobe shape + upward growth arrow) + Poppins wordmark; a muted
  gray watermark of the mark sits in the header of every screen.
- **Components** (`src/components/ui/`) — `SoftCard`, `SoftButton`, `SoftIconButton`, `SoftInput`,
  `SoftToggle`, `Neumorph`, `Checkbox`, `Select`, `SegmentedTabs` (no radio buttons), `Chip`, `Stepper`,
  `Icon`, `AppHeader`, `Tag`, `Typography`, `DotGridBackground`.

## Screens

- **Onboarding / Auth** — animated splash (8 brand icons converge on the animated Kivo logo), welcome, login, register.
- **Tabs** — Dashboard, DSA (roadmaps · topics · problem detail · coding journal), Revisions (Smart
  Revision queue with confidence rating, heatmap), Tracker (planner · tasks · habits · focus timer), Profile.
- **Feature stack** (via the **More** hub) — Notes (+editor), Resources, Habits, Reflections, Notifications,
  Achievements, Analytics, Calendar, Focus Timer, Settings.

## Getting started

```bash
npm install
npx expo start            # press i / a, or scan the QR in Expo Go
```

Override the API base URL with `EXPO_PUBLIC_API_BASE_URL` if needed.

## Push notifications

- **Local reminders** work out of the box (even in Expo Go): e.g. the Settings → "Send a test reminder"
  button and the revision **Snooze** action schedule real on-device notifications.
- **Remote push** (server → FCM → device) requires: the bundled `google-services.json` (Android,
  package `com.kivo.app`, already in place), a `GoogleService-Info.plist` + APNs key for iOS, and a
  **dev/EAS build** (Expo Go can't receive remote push on SDK 53+). See [`NOTIFICATIONS.md`](./NOTIFICATIONS.md).

## Project layout

```
app/          expo-router routes (auth, tabs, feature stack)
src/
  components/ ui kit, brand, navigation, per-feature pieces
  theme/      tokens + fonts
  services/   api client, notifications
  store/      zustand
  data/       typed mock data
  hooks/      useNotifications, etc.
assets/       icons, splash, brand assets (svg/png)
```
