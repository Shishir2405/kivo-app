/**
 * Account data layer for the Steep profile / settings / analytics / achievements
 * screens.
 *
 * The live backend's account/analytics shapes differ from the legacy
 * `UserProfile` / `Achievement` models, so these typed hooks read the REAL
 * payloads (`/auth/me`, `/analytics/*`, `/achievements`) through the single api
 * client and normalise them into small view models the screens render.
 *
 * ROBUSTNESS: every hook goes through `requestData` (always throws a typed
 * `ApiError`), inherits the query client's retry policy, is gated on
 * `isAuthenticated`, and exposes `{ data, isLoading, isError, error, refetch }`.
 * A failed request renders an error/empty state — it can NEVER crash the app.
 * `/achievements` currently 500s on the backend; `useAchievementsSafe` swallows
 * that into an empty list so the screen degrades gracefully.
 */
import {
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';

import { requestData, type ApiError, isApiError } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';

export type AccountQueryResult<T> = UseQueryResult<T, ApiError>;

function useIsAuthed(): boolean {
  return useAuthStore((s) => s.isAuthenticated);
}

/* ================================================================== */
/* Account (/auth/me)                                                  */
/* ================================================================== */

/** Theme preference as the backend stores it. */
export type RawThemeMode = 'light' | 'dark' | 'system';

/** Raw user payload from `/auth/me` (only the fields the screens use). */
export interface RawAccount {
  id: string;
  uid: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  role: string;
  preferences?: {
    theme?: RawThemeMode;
    dailyStudyGoalMinutes?: number;
    dailyProblemGoal?: number;
    reminderHour?: number;
    timezone?: string;
  };
  notificationPreferences?: {
    pushEnabled?: boolean;
    quietHours?: { enabled?: boolean; startHour?: number; endHour?: number };
    categories?: Record<string, boolean>;
  };
  currentStreak?: number;
  longestStreak?: number;
  lastActiveDay?: string | null;
  xp?: number;
  createdAt?: string;
  lastLoginAt?: string;
}

/** The clean view model the profile / settings screens consume. */
export interface Account {
  id: string;
  email: string;
  /** Derived display name (falls back to the email local-part). */
  name: string;
  /** "@handle" derived from the email local-part. */
  username: string;
  initial: string;
  currentStreak: number;
  longestStreak: number;
  xp: number;
  level: number;
  /** Within-level progress 0–1 toward the next level. */
  levelProgress: number;
  /** XP remaining to reach the next level. */
  xpToNext: number;
  theme: RawThemeMode;
  dailyProblemGoal: number;
  dailyStudyGoalMinutes: number;
  reminderHour: number;
  pushEnabled: boolean;
  quietHoursEnabled: boolean;
  quietStartHour: number;
  quietEndHour: number;
  joinedAt?: string;
  /** Pretty join year, e.g. "2026". */
  joinedYear?: string;
}

const XP_PER_LEVEL = 1000;

function deriveName(raw: RawAccount): string {
  const dn = raw.displayName?.trim();
  if (dn) return dn;
  const local = raw.email?.split('@')[0] ?? 'Learner';
  // Title-case the email local part lightly so it reads like a name.
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function mapAccount(raw: RawAccount): Account {
  const name = deriveName(raw);
  const local = raw.email?.split('@')[0] ?? 'learner';
  const xp = Math.max(0, raw.xp ?? 0);
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const intoLevel = xp % XP_PER_LEVEL;
  const prefs = raw.preferences ?? {};
  const notif = raw.notificationPreferences ?? {};
  const quiet = notif.quietHours ?? {};

  return {
    id: raw.id,
    email: raw.email ?? '',
    name,
    username: `@${local}`,
    initial: (name.slice(0, 1) || 'K').toUpperCase(),
    currentStreak: Math.max(0, raw.currentStreak ?? 0),
    longestStreak: Math.max(0, raw.longestStreak ?? 0),
    xp,
    level,
    levelProgress: intoLevel / XP_PER_LEVEL,
    xpToNext: XP_PER_LEVEL - intoLevel,
    theme: prefs.theme ?? 'system',
    dailyProblemGoal: prefs.dailyProblemGoal ?? 3,
    dailyStudyGoalMinutes: prefs.dailyStudyGoalMinutes ?? 120,
    reminderHour: prefs.reminderHour ?? 9,
    pushEnabled: notif.pushEnabled ?? true,
    quietHoursEnabled: quiet.enabled ?? false,
    quietStartHour: quiet.startHour ?? 22,
    quietEndHour: quiet.endHour ?? 7,
    joinedAt: raw.createdAt,
    joinedYear: raw.createdAt ? raw.createdAt.slice(0, 4) : undefined,
  };
}

export function useAccount(): AccountQueryResult<Account> {
  const enabled = useIsAuthed();
  return useQuery<Account, ApiError>({
    queryKey: ['account', 'me'],
    queryFn: async () => mapAccount(await requestData<RawAccount>({ url: '/auth/me', method: 'GET' })),
    enabled,
  });
}

/* ================================================================== */
/* Analytics — weekly report (/analytics/weekly)                       */
/* ================================================================== */

export interface RawWeeklyReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  studyHours: number;
  problemsSolved: number;
  topicsCompleted: number;
  revisionCompletionRate: number;
  taskCompletionRate: number;
  focusSessions: number;
  habitCompletionRate: number;
  longestSessionMinutes: number;
  productivityScore: number;
  recommendations: string[];
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** "2026-06-22T00:00:00.000Z" → "Jun 22". */
function shortIso(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export interface WeeklyReportVM {
  /** Human label, e.g. "Jun 22 – Jun 28". */
  label: string;
  studyHours: number;
  problemsSolved: number;
  topicsCompleted: number;
  revisionRate: number;
  taskRate: number;
  habitRate: number;
  focusSessions: number;
  longestSession: number;
  productivityScore: number;
  recommendations: string[];
}

export function mapWeekly(raw: RawWeeklyReport): WeeklyReportVM {
  const start = shortIso(raw.weekStart);
  // weekEnd is exclusive (next Monday); show the inclusive Sunday.
  const endDate = raw.weekEnd ? new Date(raw.weekEnd) : undefined;
  if (endDate) endDate.setUTCDate(endDate.getUTCDate() - 1);
  const end = endDate ? `${MONTHS[endDate.getUTCMonth()]} ${endDate.getUTCDate()}` : undefined;
  const label = start && end ? `${start} – ${end}` : start ?? 'This week';

  return {
    label,
    studyHours: raw.studyHours ?? 0,
    problemsSolved: raw.problemsSolved ?? 0,
    topicsCompleted: raw.topicsCompleted ?? 0,
    revisionRate: Math.round(raw.revisionCompletionRate ?? 0),
    taskRate: Math.round(raw.taskCompletionRate ?? 0),
    habitRate: Math.round(raw.habitCompletionRate ?? 0),
    focusSessions: raw.focusSessions ?? 0,
    longestSession: raw.longestSessionMinutes ?? 0,
    productivityScore: Math.round(raw.productivityScore ?? 0),
    recommendations: Array.isArray(raw.recommendations) ? raw.recommendations : [],
  };
}

export function useWeeklyReport(): AccountQueryResult<WeeklyReportVM> {
  const enabled = useIsAuthed();
  return useQuery<WeeklyReportVM, ApiError>({
    queryKey: ['analytics', 'weekly'],
    queryFn: async () =>
      mapWeekly(await requestData<RawWeeklyReport>({ url: '/analytics/weekly', method: 'GET' })),
    enabled,
  });
}

/* ================================================================== */
/* Analytics — streaks (/analytics/streaks)                            */
/* ================================================================== */

export interface StreaksVM {
  currentDailyStreak: number;
  longestDailyStreak: number;
  currentWeeklyStreak: number;
  longestWeeklyStreak: number;
}

export function useStreaks(): AccountQueryResult<StreaksVM> {
  const enabled = useIsAuthed();
  return useQuery<StreaksVM, ApiError>({
    queryKey: ['analytics', 'streaks'],
    queryFn: () => requestData<StreaksVM>({ url: '/analytics/streaks', method: 'GET' }),
    enabled,
  });
}

/* ================================================================== */
/* Analytics — contribution heatmap (/analytics/heatmap)              */
/* ================================================================== */

export type HeatmapRange = '30' | '90' | '365';

export interface RawHeatmapCell {
  date?: string;
  day?: string;
  count?: number;
  level?: number;
}

export interface RawHeatmap {
  range: string;
  startDate: string;
  endDate: string;
  totalContributions: number;
  activeDays: number;
  cells: RawHeatmapCell[];
}

export interface HeatmapCell {
  day: string;
  count: number;
}

export interface HeatmapVM {
  startDate: string;
  endDate: string;
  totalContributions: number;
  activeDays: number;
  cells: HeatmapCell[];
}

export function mapHeatmap(raw: RawHeatmap): HeatmapVM {
  const cells: HeatmapCell[] = (raw.cells ?? []).map((c) => ({
    day: c.date ?? c.day ?? '',
    count: Math.max(0, c.count ?? c.level ?? 0),
  }));
  return {
    startDate: raw.startDate,
    endDate: raw.endDate,
    totalContributions: raw.totalContributions ?? 0,
    activeDays: raw.activeDays ?? 0,
    cells,
  };
}

export function useHeatmap(range: HeatmapRange): AccountQueryResult<HeatmapVM> {
  const enabled = useIsAuthed();
  return useQuery<HeatmapVM, ApiError>({
    queryKey: ['analytics', 'heatmap', range],
    queryFn: async () =>
      mapHeatmap(
        await requestData<RawHeatmap>({
          url: '/analytics/heatmap',
          method: 'GET',
          params: { range },
        }),
      ),
    enabled,
  });
}

/* ================================================================== */
/* Achievements (/achievements) — degrades gracefully on 5xx          */
/* ================================================================== */

export type AchievementCategory =
  | 'STREAK'
  | 'VOLUME'
  | 'REVISION'
  | 'FOCUS'
  | 'MILESTONE'
  | string;

export interface RawAchievement {
  id?: string;
  key?: string;
  title?: string;
  name?: string;
  description?: string;
  icon?: string;
  xp?: number;
  xpReward?: number;
  unlocked?: boolean;
  earned?: boolean;
  unlockedAt?: string;
  earnedAt?: string;
  progress?: number;
  category?: AchievementCategory;
}

export interface AchievementVM {
  key: string;
  title: string;
  description: string;
  xp: number;
  unlocked: boolean;
  unlockedAt?: string;
  /** 0–100. */
  progress: number;
  category: AchievementCategory;
}

export function mapAchievement(raw: RawAchievement, idx: number): AchievementVM {
  const unlocked = raw.unlocked ?? raw.earned ?? false;
  return {
    key: raw.key ?? raw.id ?? `ach_${idx}`,
    title: raw.title ?? raw.name ?? 'Achievement',
    description: raw.description ?? '',
    xp: raw.xp ?? raw.xpReward ?? 0,
    unlocked,
    unlockedAt: raw.unlockedAt ?? raw.earnedAt,
    progress: Math.max(0, Math.min(100, Math.round(raw.progress ?? (unlocked ? 100 : 0)))),
    category: raw.category ?? 'MILESTONE',
  };
}

/**
 * Achievements list. The backend route currently 500s; rather than surfacing a
 * hard error, this resolves to an empty list on any server (5xx) / parse
 * failure so the screen shows a calm empty state. Real auth/network errors
 * (other than 5xx) still propagate so the standard error state can render.
 */
export function useAchievementsSafe(): AccountQueryResult<AchievementVM[]> {
  const enabled = useIsAuthed();
  return useQuery<AchievementVM[], ApiError>({
    queryKey: ['achievements', 'safe'],
    queryFn: async () => {
      try {
        const list = await requestData<RawAchievement[]>({ url: '/achievements', method: 'GET' });
        if (!Array.isArray(list)) return [];
        return list.map(mapAchievement);
      } catch (e) {
        // The endpoint is unstable (5xx). Degrade to empty rather than crash.
        if (isApiError(e) && (e.status >= 500 || e.status === 0)) return [];
        throw e;
      }
    },
    enabled,
  });
}
