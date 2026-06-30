/**
 * Typed data hooks for the Kivo backend (TanStack Query).
 *
 * Every hook:
 *  - goes through the single api client (Bearer attached, errors normalised),
 *  - inherits retry:1 from the query client,
 *  - is gated on `isAuthenticated` so it doesn't fire before login,
 *  - exposes `{ data, isLoading, isError, error, refetch }` where `error` is a
 *    typed `ApiError`.
 *
 * Screens render loading / error / empty states from these flags — a failed
 * request can never crash the app.
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';

import { requestData, type ApiError } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { queryKeys } from './keys';
import type {
  UserProfile,
  DashboardData,
  Revision,
  Task,
  Note,
  Habit,
  Resource,
  DsaTopic,
  Problem,
  StudySession,
  Reflection,
  Achievement,
  AppNotification,
  NotificationPreferences,
  AppPreferences,
} from '@/types/models';

export { queryKeys } from './keys';

/** Convenience: a query result whose error is the normalised ApiError. */
export type ApiQueryResult<T> = UseQueryResult<T, ApiError>;

function useIsAuthed(): boolean {
  return useAuthStore((s) => s.isAuthenticated);
}

/* ================================================================== */
/* Payload mappers — frontend model → STRICT backend schema            */
/*                                                                     */
/* The screen-facing models use legacy field names (title/done/notes/   */
/* body/favorite/…). The backend Zod schemas are `.strict()`, so ANY    */
/* wrong or extra key returns 422 "Unrecognized key". These mappers     */
/* translate a (partial) frontend payload into exactly the keys the     */
/* matching validator accepts, dropping everything the backend rejects. */
/* A value is only included when it is actually present (undefined keys  */
/* are stripped) so PATCH stays a true partial update.                  */
/* ================================================================== */

/** Drop keys whose value is `undefined` so PATCH bodies stay minimal. */
function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

/** A loose record so we can read legacy + new keys off the same input. */
type AnyInput = Record<string, unknown>;

/** Coerce a `YYYY-MM-DD` (or already-ISO) string into an ISO-8601 datetime. */
function toIsoDateTime(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const v = value.trim();
  if (v.includes('T')) return v; // already a datetime
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T00:00:00.000Z`;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/* ---- Tasks ---- */

const TASK_PRIORITY_MAP: Record<string, string> = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

/** Map frontend task fields → createTaskSchema / updateTaskSchema keys. */
function mapTaskPayload(input: AnyInput): AnyInput {
  const out: AnyInput = {};
  if (typeof input.title === 'string') out.title = input.title;
  // `notes` (frontend) → `description` (backend); explicit `description` wins.
  if (typeof input.description === 'string') out.description = input.description;
  else if (typeof input.notes === 'string') out.description = input.notes;
  if (typeof input.priority === 'string')
    out.priority = TASK_PRIORITY_MAP[input.priority] ?? String(input.priority).toLowerCase();
  // `done` boolean → `status`; explicit `status` (already backend-cased) wins.
  if (typeof input.status === 'string') out.status = input.status;
  else if (typeof input.done === 'boolean') out.status = input.done ? 'completed' : 'pending';
  const due = toIsoDateTime(input.dueDate);
  if (due) out.dueDate = due;
  const reminder = toIsoDateTime(input.reminderAt);
  if (reminder) out.reminderAt = reminder;
  if (Array.isArray(input.tags)) out.tags = input.tags;
  // `checklist` items use {label,done} in the UI → backend {id,text,completed}.
  if (Array.isArray(input.checklist)) {
    out.checklist = (input.checklist as AnyInput[]).map((c, i) => ({
      id: typeof c.id === 'string' ? c.id : `c_${i}`,
      text: typeof c.text === 'string' ? c.text : String(c.label ?? ''),
      completed: typeof c.completed === 'boolean' ? c.completed : Boolean(c.done),
    }));
  }
  // Intentionally dropped (not in the strict schema): category, icon, topicId.
  return compact(out);
}

/* ---- Notes ---- */

/** Map frontend note fields → createNoteSchema / updateNoteSchema keys. */
function mapNotePayload(input: AnyInput): AnyInput {
  const out: AnyInput = {};
  if (typeof input.title === 'string') out.title = input.title;
  // `body` (frontend) → `content` (backend); explicit `content` wins.
  if (typeof input.content === 'string') out.content = input.content;
  else if (typeof input.body === 'string') out.content = input.body;
  if (Array.isArray(input.tags)) out.tags = input.tags;
  if (typeof input.folder === 'string') out.folder = input.folder;
  if (typeof input.isFavorite === 'boolean') out.isFavorite = input.isFavorite;
  else if (typeof input.favorite === 'boolean') out.isFavorite = input.favorite;
  if (typeof input.isPinned === 'boolean') out.isPinned = input.isPinned;
  else if (typeof input.pinned === 'boolean') out.isPinned = input.pinned;
  if (typeof input.isArchived === 'boolean') out.isArchived = input.isArchived;
  else if (typeof input.archived === 'boolean') out.isArchived = input.archived;
  // Dropped (not in schema): preview, wordCount, icon, accent.
  return compact(out);
}

/* ---- Habits ---- */

/** Map frontend habit fields → create/updateHabitSchema keys. */
function mapHabitPayload(input: AnyInput): AnyInput {
  const out: AnyInput = {};
  // `title` (frontend) → `name` (backend); explicit `name` wins.
  if (typeof input.name === 'string') out.name = input.name;
  else if (typeof input.title === 'string') out.name = input.title;
  if (typeof input.emoji === 'string') out.emoji = input.emoji;
  if (typeof input.color === 'string') out.color = input.color;
  if (typeof input.frequency === 'string') out.frequency = input.frequency;
  if (Array.isArray(input.daysOfWeek)) out.daysOfWeek = input.daysOfWeek;
  // `targetPerWeek` (UI 3/5/7) → frequency + targetPerPeriod.
  if (typeof input.targetPerPeriod === 'number') out.targetPerPeriod = input.targetPerPeriod;
  else if (typeof input.targetPerWeek === 'number') {
    if (input.targetPerWeek >= 7) {
      out.frequency = out.frequency ?? 'daily';
      out.targetPerPeriod = 1;
    } else {
      out.frequency = out.frequency ?? 'weekly';
      out.targetPerPeriod = input.targetPerWeek;
    }
  }
  if (typeof input.reminderTime === 'string') out.reminderTime = input.reminderTime;
  if (typeof input.isArchived === 'boolean') out.isArchived = input.isArchived;
  // Dropped: streak, completedToday, weekHistory, accent.
  return compact(out);
}

/* ---- Reflections ---- */

const MOOD_MAP: Record<string, string> = {
  GREAT: 'great',
  GOOD: 'good',
  OKAY: 'okay',
  TIRED: 'low',
  STRESSED: 'bad',
  LOW: 'low',
  BAD: 'bad',
};

function mapMood(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return MOOD_MAP[value] ?? value.toLowerCase();
}

function clampRating(value: unknown): number | undefined {
  if (typeof value !== 'number' || Number.isNaN(value)) return undefined;
  return Math.max(1, Math.min(5, Math.round(value)));
}

/** Map frontend reflection fields → create/updateReflectionSchema keys. */
function mapReflectionPayload(input: AnyInput, opts?: { forCreate?: boolean }): AnyInput {
  const out: AnyInput = {};
  // `date` (frontend) → `dayKey` (backend); explicit `dayKey` wins.
  if (typeof input.dayKey === 'string') out.dayKey = input.dayKey;
  else if (typeof input.date === 'string') out.dayKey = String(input.date).slice(0, 10);
  // `note`/`win` (lightweight model) feed the structured `learned` field when no
  // explicit `learned` is supplied; explicit structured fields always win.
  if (typeof input.learned === 'string') out.learned = input.learned;
  else if (typeof input.note === 'string') {
    const win = typeof input.win === 'string' && input.win.trim() ? `\n\nWin: ${input.win.trim()}` : '';
    out.learned = `${input.note}${win}`;
  }
  if (typeof input.challenged === 'string') out.challenged = input.challenged;
  if (typeof input.tomorrowPlan === 'string') out.tomorrowPlan = input.tomorrowPlan;
  if (typeof input.goalsCompleted === 'boolean') out.goalsCompleted = input.goalsCompleted;
  const focus = clampRating(input.focusLevel ?? input.focus);
  if (focus !== undefined) out.focusLevel = focus;
  const conf = clampRating(input.confidence);
  if (conf !== undefined) out.confidence = conf;
  const mood = mapMood(input.mood);
  if (mood !== undefined) out.mood = mood;
  // Create requires focusLevel + confidence — default to a neutral 3 if absent.
  if (opts?.forCreate) {
    if (out.focusLevel === undefined) out.focusLevel = 3;
    if (out.confidence === undefined) out.confidence = 3;
  }
  // Dropped: win (folded into learned), emoji, id.
  return compact(out);
}

/* ---- DSA topics ---- */

/** Map frontend topic fields → create/updateTopicSchema keys. */
function mapTopicPayload(input: AnyInput): AnyInput {
  const out: AnyInput = {};
  // `title` (frontend) → `name` (backend); explicit `name` wins.
  if (typeof input.name === 'string') out.name = input.name;
  else if (typeof input.title === 'string') out.name = input.title;
  if (typeof input.description === 'string') out.description = input.description;
  if (Array.isArray(input.tags)) out.tags = input.tags;
  // Update-only fields.
  if (typeof input.progress === 'number') out.progress = input.progress;
  if (typeof input.masteryLevel === 'string') out.masteryLevel = input.masteryLevel;
  if (typeof input.studyTimeMinutes === 'number') out.studyTimeMinutes = input.studyTimeMinutes;
  // Dropped (not in schema): difficulty, emoji, roadmapId, progress counts, etc.
  return compact(out);
}

/* ---- DSA problems ---- */

const PROBLEM_DIFFICULTY_MAP: Record<string, string> = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
};

const PROBLEM_STATUS_MAP: Record<string, string> = {
  TODO: 'not_started',
  ATTEMPTED: 'in_progress',
  SOLVED: 'completed',
  MASTERED: 'mastered',
};

/** Map frontend problem fields → create/updateProblemSchema keys. */
function mapProblemPayload(input: AnyInput): AnyInput {
  const out: AnyInput = {};
  if (typeof input.topicId === 'string') out.topicId = input.topicId;
  if (typeof input.title === 'string') out.title = input.title;
  // `source`/`platform` (frontend) → `platform` (backend).
  if (typeof input.platform === 'string') out.platform = input.platform;
  else if (typeof input.source === 'string') out.platform = input.source;
  if (typeof input.url === 'string') out.url = input.url;
  if (typeof input.difficulty === 'string')
    out.difficulty = PROBLEM_DIFFICULTY_MAP[input.difficulty] ?? String(input.difficulty).toLowerCase();
  if (Array.isArray(input.tags)) out.tags = input.tags;
  if (typeof input.status === 'string')
    out.status = PROBLEM_STATUS_MAP[input.status] ?? String(input.status).toLowerCase();
  if (typeof input.timeTakenMinutes === 'number') out.timeTakenMinutes = input.timeTakenMinutes;
  else if (typeof input.timeSpentMinutes === 'number') out.timeTakenMinutes = input.timeSpentMinutes;
  if (typeof input.notes === 'string') out.notes = input.notes;
  if (typeof input.approach === 'string') out.approach = input.approach;
  if (typeof input.timeComplexity === 'string') out.timeComplexity = input.timeComplexity;
  if (typeof input.spaceComplexity === 'string') out.spaceComplexity = input.spaceComplexity;
  if (typeof input.journal === 'string') out.journal = input.journal;
  // Dropped: bookmarked, attempts, lastAttemptedAt.
  return compact(out);
}

/* ---- Resources ---- */

const RESOURCE_TYPE_MAP: Record<string, string> = {
  youtube: 'youtube',
  playlist: 'youtube',
  article: 'article',
  documentation: 'docs',
  docs: 'docs',
  github: 'github',
  pdf: 'pdf',
  blog: 'article',
  other: 'other',
};

/** Map frontend resource fields → create/updateResourceSchema keys. */
function mapResourcePayload(input: AnyInput): AnyInput {
  const out: AnyInput = {};
  if (typeof input.topicId === 'string') out.topicId = input.topicId;
  if (typeof input.title === 'string') out.title = input.title;
  if (typeof input.url === 'string') out.url = input.url;
  if (typeof input.type === 'string')
    out.type = RESOURCE_TYPE_MAP[input.type] ?? 'other';
  if (typeof input.description === 'string') out.description = input.description;
  if (Array.isArray(input.tags)) out.tags = input.tags;
  if (typeof input.isCompleted === 'boolean') out.isCompleted = input.isCompleted;
  else if (typeof input.completed === 'boolean') out.isCompleted = input.completed;
  // Dropped (not in schema): topic (free string), source, favorite, icon, accent, duration.
  return compact(out);
}

/* ---- Study sessions ---- */

const TIMER_TYPE_MAP: Record<string, string> = {
  pomodoro: 'pomodoro',
  deep: 'deep_focus',
  deepwork: 'deep_focus',
  deep_focus: 'deep_focus',
  stopwatch: 'stopwatch',
  countdown: 'countdown',
  custom: 'custom',
};

/** Map frontend study-session fields → create/updateStudySessionSchema keys. */
function mapStudySessionPayload(input: AnyInput): AnyInput {
  const out: AnyInput = {};
  if (typeof input.timerType === 'string')
    out.timerType = TIMER_TYPE_MAP[input.timerType] ?? 'custom';
  // `minutes` (frontend) → `durationMinutes` (backend).
  const minutes =
    typeof input.durationMinutes === 'number'
      ? input.durationMinutes
      : typeof input.minutes === 'number'
        ? input.minutes
        : undefined;
  if (minutes !== undefined) out.durationMinutes = minutes;
  // Synthesize a start/end window from `date` + duration when not provided.
  let start = typeof input.startTime === 'string' ? input.startTime : undefined;
  let end = typeof input.endTime === 'string' ? input.endTime : undefined;
  if (!start || !end) {
    const base =
      typeof input.date === 'string' && input.date
        ? new Date(`${String(input.date).slice(0, 10)}T12:00:00.000Z`)
        : new Date();
    const endDate = Number.isNaN(base.getTime()) ? new Date() : base;
    const startDate = new Date(endDate.getTime() - (minutes ?? 0) * 60_000);
    start = start ?? startDate.toISOString();
    end = end ?? endDate.toISOString();
  }
  out.startTime = start;
  out.endTime = end;
  if (typeof input.topicId === 'string') out.topicId = input.topicId;
  // `topic` (frontend) → `topicName` (backend).
  if (typeof input.topicName === 'string') out.topicName = input.topicName;
  else if (typeof input.topic === 'string' && input.topic.trim()) out.topicName = input.topic;
  if (typeof input.notes === 'string') out.notes = input.notes;
  if (typeof input.interruptions === 'number') out.interruptions = input.interruptions;
  // For a create the schema requires timerType — default to custom if missing.
  if (out.timerType === undefined) out.timerType = 'custom';
  // Dropped: problemsSolved, date (folded into start/end), id.
  return compact(out);
}

/* ------------------------------------------------------------------ */
/* GET hooks                                                           */
/* ------------------------------------------------------------------ */

export function useProfile(): ApiQueryResult<UserProfile> {
  const enabled = useIsAuthed();
  return useQuery<UserProfile, ApiError>({
    queryKey: queryKeys.profile,
    queryFn: () => requestData<UserProfile>({ url: '/auth/me', method: 'GET' }),
    enabled,
  });
}

/**
 * The backend GET /dashboard returns a NESTED payload
 * ({ welcome, todayOverview, quickStats, ... }), but the Dashboard screen wants
 * a FLAT `DashboardData` (it reads e.g. `data.quote.text` directly). Map it here
 * with a SAFE DEFAULT for every field so a missing/renamed backend field can
 * never crash the dashboard.
 */
interface BackendDashboard {
  welcome?: { greeting?: string; currentStreak?: number; dailyQuote?: string };
  todayOverview?: {
    pendingRevisionsCount?: number;
    todaysTasks?: unknown[];
    dailyGoals?: {
      studyMinutesDone?: number;
      problemsGoal?: number;
      problemsDone?: number;
    };
  };
  quickStats?: { studyHoursToday?: number; problemsSolved?: number };
}

function mapDashboard(raw: BackendDashboard | null | undefined): DashboardData {
  const w = raw?.welcome ?? {};
  const to = raw?.todayOverview ?? {};
  const goals = to.dailyGoals ?? {};
  const qs = raw?.quickStats ?? {};
  return {
    greeting: w.greeting ?? 'Welcome',
    solvedToday: qs.problemsSolved ?? goals.problemsDone ?? 0,
    dailyGoal: goals.problemsGoal ?? 5,
    streak: w.currentStreak ?? 0,
    revisionsDueToday: to.pendingRevisionsCount ?? 0,
    openTasks: Array.isArray(to.todaysTasks) ? to.todaysTasks.length : 0,
    focusMinutesToday: goals.studyMinutesDone ?? Math.round((qs.studyHoursToday ?? 0) * 60),
    continueTopics: [],
    quote: { text: w.dailyQuote ?? 'Small steps, every day.', author: '' },
  };
}

export function useDashboard(): ApiQueryResult<DashboardData> {
  const enabled = useIsAuthed();
  return useQuery<DashboardData, ApiError>({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const raw = await requestData<BackendDashboard>({ url: '/dashboard', method: 'GET' });
      return mapDashboard(raw);
    },
    enabled,
  });
}

/* ---- DSA topic inbound mapper (backend shape → screen-facing DsaTopic) ---- */

/**
 * The backend topic uses `name` / `completedProblems` / `masteryLevel`
 * (a string enum) / `totalProblems` / `isCompleted`, but every DSA screen
 * (TopicCard, dsa tab, topic detail) reads the legacy `DsaTopic` shape:
 * `title` / `solvedProblems` / `mastery` (0–100 number) / `emoji` / `difficulty`
 * / `estimatedMinutes` / `roadmapId`. The backend doesn't store the latter four,
 * so we map what exists and default the rest. Mirrors `mapDashboard` (every field
 * gets a safe default so a missing/renamed backend field can't crash a screen).
 */
interface BackendDsaTopic {
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  progress?: number;
  masteryLevel?: string;
  mastery?: number;
  studyTimeMinutes?: number;
  estimatedMinutes?: number;
  totalProblems?: number;
  completedProblems?: number;
  solvedProblems?: number;
  tags?: string[];
  isCompleted?: boolean;
  emoji?: string;
  difficulty?: string;
  roadmapId?: string;
}

/** Backend `masteryLevel` enum → an approximate 0–100 mastery score. */
const MASTERY_LEVEL_SCORE: Record<string, number> = {
  learning: 25,
  familiar: 50,
  proficient: 75,
  mastered: 100,
};

function mapDsaTopic(raw: BackendDsaTopic | null | undefined): DsaTopic {
  const r = raw ?? {};
  const masteryFromLevel =
    typeof r.masteryLevel === 'string' ? MASTERY_LEVEL_SCORE[r.masteryLevel] : undefined;
  return {
    id: r.id ?? '',
    // Backend doesn't store these — keep screen-safe defaults.
    roadmapId: r.roadmapId ?? '',
    title: r.title ?? r.name ?? 'Untitled topic',
    emoji: (r.emoji as DsaTopic['emoji']) ?? 'code',
    description: r.description ?? '',
    difficulty: (r.difficulty as DsaTopic['difficulty']) ?? 'MEDIUM',
    totalProblems: r.totalProblems ?? 0,
    solvedProblems: r.solvedProblems ?? r.completedProblems ?? 0,
    progress: typeof r.progress === 'number' ? r.progress : 0,
    estimatedMinutes: r.estimatedMinutes ?? r.studyTimeMinutes ?? 0,
    tags: Array.isArray(r.tags) ? r.tags : [],
    mastery: typeof r.mastery === 'number' ? r.mastery : masteryFromLevel,
  };
}

export function useRevisions(): ApiQueryResult<Revision[]> {
  const enabled = useIsAuthed();
  return useQuery<Revision[], ApiError>({
    queryKey: queryKeys.revisions,
    queryFn: () =>
      requestData<Revision[]>({ url: '/revisions', method: 'GET', params: { limit: 100 } }),
    enabled,
  });
}

export function useTasks(): ApiQueryResult<Task[]> {
  const enabled = useIsAuthed();
  return useQuery<Task[], ApiError>({
    queryKey: queryKeys.tasks,
    queryFn: () => requestData<Task[]>({ url: '/tasks', method: 'GET', params: { limit: 100 } }),
    enabled,
  });
}

export function useNotes(): ApiQueryResult<Note[]> {
  const enabled = useIsAuthed();
  return useQuery<Note[], ApiError>({
    queryKey: queryKeys.notes,
    queryFn: () => requestData<Note[]>({ url: '/notes', method: 'GET', params: { limit: 100 } }),
    enabled,
  });
}

export function useNote(id: string): ApiQueryResult<Note> {
  const enabled = useIsAuthed() && !!id;
  return useQuery<Note, ApiError>({
    queryKey: queryKeys.note(id),
    queryFn: () => requestData<Note>({ url: `/notes/${id}`, method: 'GET' }),
    enabled,
  });
}

export function useHabits(): ApiQueryResult<Habit[]> {
  const enabled = useIsAuthed();
  return useQuery<Habit[], ApiError>({
    queryKey: queryKeys.habits,
    queryFn: () => requestData<Habit[]>({ url: '/habits', method: 'GET', params: { limit: 100 } }),
    enabled,
  });
}

export function useResources(): ApiQueryResult<Resource[]> {
  const enabled = useIsAuthed();
  return useQuery<Resource[], ApiError>({
    queryKey: queryKeys.resources,
    queryFn: () =>
      requestData<Resource[]>({ url: '/resources', method: 'GET', params: { limit: 100 } }),
    enabled,
  });
}

export function useDsaTopics(): ApiQueryResult<DsaTopic[]> {
  const enabled = useIsAuthed();
  return useQuery<DsaTopic[], ApiError>({
    queryKey: queryKeys.dsaTopics,
    queryFn: async () => {
      const raw = await requestData<BackendDsaTopic[]>({
        url: '/dsa/topics',
        method: 'GET',
        params: { limit: 100 },
      });
      return (Array.isArray(raw) ? raw : []).map(mapDsaTopic);
    },
    enabled,
  });
}

/**
 * Fetch ONE topic by id via GET /dsa/topics/:id — the list is capped, so a topic
 * outside the first page would be unreachable from `useDsaTopics().find(...)`.
 * Mirrors `useNote(id)`: enabled only when authed && id present. Maps the backend
 * shape to the screen-facing `DsaTopic`.
 */
export function useDsaTopic(id: string): ApiQueryResult<DsaTopic> {
  const enabled = useIsAuthed() && !!id;
  return useQuery<DsaTopic, ApiError>({
    queryKey: queryKeys.dsaTopic(id),
    queryFn: async () => {
      const raw = await requestData<BackendDsaTopic>({ url: `/dsa/topics/${id}`, method: 'GET' });
      return mapDsaTopic(raw);
    },
    enabled,
  });
}

/**
 * DSA problems. Pass `{ topicId }` to fetch only that topic's problems via the
 * backend `?topicId` filter (server-side, not client-filtered over a capped list).
 * Either way we request `limit: 100` so effectively all rows load.
 */
export function useDsaProblems(opts?: { topicId?: string }): ApiQueryResult<Problem[]> {
  const topicId = opts?.topicId;
  const enabled = useIsAuthed();
  return useQuery<Problem[], ApiError>({
    queryKey: topicId ? queryKeys.dsaProblemsByTopic(topicId) : queryKeys.dsaProblems,
    queryFn: () =>
      requestData<Problem[]>({
        url: '/dsa/problems',
        method: 'GET',
        params: topicId ? { limit: 100, topicId } : { limit: 100 },
      }),
    enabled,
  });
}

export function useStudySessions(): ApiQueryResult<StudySession[]> {
  const enabled = useIsAuthed();
  return useQuery<StudySession[], ApiError>({
    queryKey: queryKeys.studySessions,
    queryFn: () => requestData<StudySession[]>({ url: '/study-sessions', method: 'GET' }),
    enabled,
  });
}

export function useReflections(): ApiQueryResult<Reflection[]> {
  const enabled = useIsAuthed();
  return useQuery<Reflection[], ApiError>({
    queryKey: queryKeys.reflections,
    queryFn: () => requestData<Reflection[]>({ url: '/reflections', method: 'GET' }),
    enabled,
  });
}

export function useAchievements(): ApiQueryResult<Achievement[]> {
  const enabled = useIsAuthed();
  return useQuery<Achievement[], ApiError>({
    queryKey: queryKeys.achievements,
    queryFn: () => requestData<Achievement[]>({ url: '/achievements', method: 'GET' }),
    enabled,
  });
}

export function useNotifications(): ApiQueryResult<AppNotification[]> {
  const enabled = useIsAuthed();
  return useQuery<AppNotification[], ApiError>({
    queryKey: queryKeys.notifications,
    queryFn: () =>
      requestData<AppNotification[]>({ url: '/notifications', method: 'GET', params: { limit: 100 } }),
    enabled,
  });
}

/**
 * Generic analytics hook — `/analytics/<slug>` (e.g. 'overview', 'weekly').
 * Returns the raw payload typed by the caller via the generic.
 */
export function useAnalytics<T = unknown>(slug: string): ApiQueryResult<T> {
  const enabled = useIsAuthed() && !!slug;
  return useQuery<T, ApiError>({
    queryKey: queryKeys.analytics(slug),
    queryFn: () => requestData<T>({ url: `/analytics/${slug}`, method: 'GET' }),
    enabled,
  });
}

/* ------------------------------------------------------------------ */
/* Mutation helpers (examples — extend per screen as needed)           */
/* ------------------------------------------------------------------ */

/**
 * Toggle / update a task. Invalidates the tasks + dashboard queries on success.
 * Mutation `error` is a typed `ApiError`; the caller surfaces it (never throws).
 */
export function useUpdateTask(): UseMutationResult<
  Task,
  ApiError,
  { id: string; patch: Partial<Task> }
> {
  const qc = useQueryClient();
  return useMutation<Task, ApiError, { id: string; patch: Partial<Task> }>({
    mutationFn: ({ id, patch }) =>
      requestData<Task>({ url: `/tasks/${id}`, method: 'PATCH', data: mapTaskPayload(patch as AnyInput) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/** Recall grade as the UI models it; maps to the backend ConfidenceRating. */
export type ReviewConfidence = 'EASY' | 'MEDIUM' | 'HARD';

const CONFIDENCE_MAP: Record<string, string> = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
};

/**
 * Mark a revision reviewed via POST /revisions/:id/complete.
 *
 * The endpoint is `/complete` (not `/review`) and REQUIRES a `confidence` enum
 * (easy/medium/hard). Accepts either a bare id (defaults to "medium") or
 * `{ id, confidence }` so existing call sites keep working.
 */
export function useReviewRevision(): UseMutationResult<
  Revision,
  ApiError,
  string | { id: string; confidence?: ReviewConfidence }
> {
  const qc = useQueryClient();
  return useMutation<Revision, ApiError, string | { id: string; confidence?: ReviewConfidence }>({
    mutationFn: (arg) => {
      const id = typeof arg === 'string' ? arg : arg.id;
      const grade = typeof arg === 'string' ? 'MEDIUM' : arg.confidence ?? 'MEDIUM';
      return requestData<Revision>({
        url: `/revisions/${id}/complete`,
        method: 'POST',
        data: { confidence: CONFIDENCE_MAP[grade] ?? 'medium' },
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.revisions });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/* ================================================================== */
/* CRUD MUTATION HOOKS                                                  */
/*                                                                     */
/* Every mutation below:                                               */
/*  - calls the correct backend endpoint through `requestData`,        */
/*  - rejects with a typed `ApiError` (call sites surface it inline),  */
/*  - invalidates the precise queryKeys it affects (+ dashboard where  */
/*    the change is reflected on the dashboard).                        */
/*                                                                     */
/* Convention: list-writing hooks take a typed `input` payload; row    */
/* hooks take `{ id, patch }` or just `id`.                            */
/* ================================================================== */

/* ------------------------------------------------------------------ */
/* Tasks                                                               */
/* ------------------------------------------------------------------ */

/** Payload for creating a task. `title` is required; the rest is optional. */
export type CreateTaskInput = Pick<Task, 'title'> &
  Partial<Omit<Task, 'id' | 'title'>>;

/** Create a task. Invalidates tasks + dashboard on success. */
export function useCreateTask(): UseMutationResult<Task, ApiError, CreateTaskInput> {
  const qc = useQueryClient();
  return useMutation<Task, ApiError, CreateTaskInput>({
    mutationFn: (input) =>
      requestData<Task>({ url: '/tasks', method: 'POST', data: mapTaskPayload(input as AnyInput) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/** Toggle the done flag (or update status) of a task via PATCH /tasks/:id/status. */
export function useUpdateTaskStatus(): UseMutationResult<
  Task,
  ApiError,
  { id: string; done: boolean }
> {
  const qc = useQueryClient();
  return useMutation<Task, ApiError, { id: string; done: boolean }>({
    mutationFn: ({ id, done }) =>
      requestData<Task>({
        url: `/tasks/${id}/status`,
        method: 'PATCH',
        data: { status: done ? 'completed' : 'pending' },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/** Delete a task. Invalidates tasks + dashboard on success. */
export function useDeleteTask(): UseMutationResult<void, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => requestData<void>({ url: `/tasks/${id}`, method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Notes                                                               */
/* ------------------------------------------------------------------ */

/** Payload for creating a note. `title` + `body` required; rest optional. */
export type CreateNoteInput = Pick<Note, 'title' | 'body'> &
  Partial<Omit<Note, 'id' | 'title' | 'body' | 'createdAt' | 'updatedAt'>>;

/** Create a note. Invalidates the notes list on success. */
export function useCreateNote(): UseMutationResult<Note, ApiError, CreateNoteInput> {
  const qc = useQueryClient();
  return useMutation<Note, ApiError, CreateNoteInput>({
    mutationFn: (input) =>
      requestData<Note>({ url: '/notes', method: 'POST', data: mapNotePayload(input as AnyInput) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notes });
    },
  });
}

/** Update a note. Invalidates the notes list + the single-note query. */
export function useUpdateNote(): UseMutationResult<
  Note,
  ApiError,
  { id: string; patch: Partial<Note> }
> {
  const qc = useQueryClient();
  return useMutation<Note, ApiError, { id: string; patch: Partial<Note> }>({
    mutationFn: ({ id, patch }) =>
      requestData<Note>({ url: `/notes/${id}`, method: 'PATCH', data: mapNotePayload(patch as AnyInput) }),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.notes });
      void qc.invalidateQueries({ queryKey: queryKeys.note(id) });
    },
  });
}

/** Delete a note. Invalidates the notes list on success. */
export function useDeleteNote(): UseMutationResult<void, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => requestData<void>({ url: `/notes/${id}`, method: 'DELETE' }),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.notes });
      void qc.invalidateQueries({ queryKey: queryKeys.note(id) });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Habits                                                              */
/* ------------------------------------------------------------------ */

/** Payload for creating a habit. `title` required; rest optional. */
export type CreateHabitInput = Pick<Habit, 'title'> &
  Partial<Omit<Habit, 'id' | 'title'>>;

/** Create a habit. Invalidates habits + dashboard on success. */
export function useCreateHabit(): UseMutationResult<Habit, ApiError, CreateHabitInput> {
  const qc = useQueryClient();
  return useMutation<Habit, ApiError, CreateHabitInput>({
    mutationFn: (input) =>
      requestData<Habit>({ url: '/habits', method: 'POST', data: mapHabitPayload(input as AnyInput) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.habits });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/** Update a habit. Invalidates habits + dashboard on success. */
export function useUpdateHabit(): UseMutationResult<
  Habit,
  ApiError,
  { id: string; patch: Partial<Habit> }
> {
  const qc = useQueryClient();
  return useMutation<Habit, ApiError, { id: string; patch: Partial<Habit> }>({
    mutationFn: ({ id, patch }) =>
      requestData<Habit>({ url: `/habits/${id}`, method: 'PATCH', data: mapHabitPayload(patch as AnyInput) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.habits });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/** Delete a habit. Invalidates habits + dashboard on success. */
export function useDeleteHabit(): UseMutationResult<void, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => requestData<void>({ url: `/habits/${id}`, method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.habits });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/** Mark a habit complete for today. Invalidates habits + dashboard. */
export function useCompleteHabit(): UseMutationResult<Habit, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<Habit, ApiError, string>({
    mutationFn: (id) =>
      requestData<Habit>({ url: `/habits/${id}/complete`, method: 'POST', data: {} }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.habits });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/** Undo today's habit completion. Invalidates habits + dashboard. */
export function useUncompleteHabit(): UseMutationResult<Habit, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<Habit, ApiError, string>({
    mutationFn: (id) =>
      requestData<Habit>({ url: `/habits/${id}/uncomplete`, method: 'POST', data: {} }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.habits });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Reflections                                                         */
/* ------------------------------------------------------------------ */

/** Payload for creating a reflection. `note` required; rest optional. */
export type CreateReflectionInput = Pick<Reflection, 'note'> &
  Partial<Omit<Reflection, 'id' | 'note'>>;

/** Create a reflection. Invalidates reflections + dashboard on success. */
export function useCreateReflection(): UseMutationResult<
  Reflection,
  ApiError,
  CreateReflectionInput
> {
  const qc = useQueryClient();
  return useMutation<Reflection, ApiError, CreateReflectionInput>({
    mutationFn: (input) =>
      requestData<Reflection>({
        url: '/reflections',
        method: 'POST',
        data: mapReflectionPayload(input as AnyInput, { forCreate: true }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.reflections });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/** Update a reflection. Invalidates reflections + dashboard on success. */
export function useUpdateReflection(): UseMutationResult<
  Reflection,
  ApiError,
  { id: string; patch: Partial<Reflection> }
> {
  const qc = useQueryClient();
  return useMutation<Reflection, ApiError, { id: string; patch: Partial<Reflection> }>({
    mutationFn: ({ id, patch }) =>
      requestData<Reflection>({
        url: `/reflections/${id}`,
        method: 'PATCH',
        data: mapReflectionPayload(patch as AnyInput),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.reflections });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/** Delete a reflection. Invalidates reflections + dashboard on success. */
export function useDeleteReflection(): UseMutationResult<void, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      requestData<void>({ url: `/reflections/${id}`, method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.reflections });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/* ------------------------------------------------------------------ */
/* DSA — topics                                                        */
/* ------------------------------------------------------------------ */

/** Payload for creating a DSA topic. `title` required; rest optional. */
export type CreateDsaTopicInput = Pick<DsaTopic, 'title'> &
  Partial<Omit<DsaTopic, 'id' | 'title'>>;

/** Create a DSA topic. Invalidates topics + dashboard on success. */
export function useCreateDsaTopic(): UseMutationResult<
  DsaTopic,
  ApiError,
  CreateDsaTopicInput
> {
  const qc = useQueryClient();
  return useMutation<DsaTopic, ApiError, CreateDsaTopicInput>({
    mutationFn: (input) =>
      requestData<DsaTopic>({ url: '/dsa/topics', method: 'POST', data: mapTopicPayload(input as AnyInput) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.dsaTopics });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/** Update a DSA topic. Invalidates topics + dashboard on success. */
export function useUpdateDsaTopic(): UseMutationResult<
  DsaTopic,
  ApiError,
  { id: string; patch: Partial<DsaTopic> }
> {
  const qc = useQueryClient();
  return useMutation<DsaTopic, ApiError, { id: string; patch: Partial<DsaTopic> }>({
    mutationFn: ({ id, patch }) =>
      requestData<DsaTopic>({ url: `/dsa/topics/${id}`, method: 'PATCH', data: mapTopicPayload(patch as AnyInput) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.dsaTopics });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/** Mark a DSA topic complete. Invalidates topics + dashboard on success. */
export function useCompleteDsaTopic(): UseMutationResult<DsaTopic, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<DsaTopic, ApiError, string>({
    mutationFn: (id) =>
      requestData<DsaTopic>({ url: `/dsa/topics/${id}/complete`, method: 'POST', data: {} }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.dsaTopics });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/** Delete a DSA topic. Invalidates topics + dashboard on success. */
export function useDeleteDsaTopic(): UseMutationResult<void, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      requestData<void>({ url: `/dsa/topics/${id}`, method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.dsaTopics });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/* ------------------------------------------------------------------ */
/* DSA — problems                                                      */
/* ------------------------------------------------------------------ */

/** Payload for creating a problem. `title` + `topicId` required; rest optional. */
export type CreateProblemInput = Pick<Problem, 'title' | 'topicId'> &
  Partial<Omit<Problem, 'id' | 'title' | 'topicId'>>;

/** Create a DSA problem. Invalidates problems + topics + dashboard on success. */
export function useCreateProblem(): UseMutationResult<
  Problem,
  ApiError,
  CreateProblemInput
> {
  const qc = useQueryClient();
  return useMutation<Problem, ApiError, CreateProblemInput>({
    mutationFn: (input) =>
      requestData<Problem>({ url: '/dsa/problems', method: 'POST', data: mapProblemPayload(input as AnyInput) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.dsaProblems });
      void qc.invalidateQueries({ queryKey: queryKeys.dsaTopics });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/** Update a DSA problem. Invalidates problems + topics + dashboard on success. */
export function useUpdateProblem(): UseMutationResult<
  Problem,
  ApiError,
  { id: string; patch: Partial<Problem> }
> {
  const qc = useQueryClient();
  return useMutation<Problem, ApiError, { id: string; patch: Partial<Problem> }>({
    mutationFn: ({ id, patch }) =>
      requestData<Problem>({ url: `/dsa/problems/${id}`, method: 'PATCH', data: mapProblemPayload(patch as AnyInput) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.dsaProblems });
      void qc.invalidateQueries({ queryKey: queryKeys.dsaTopics });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/** Delete a DSA problem. Invalidates problems + topics + dashboard on success. */
export function useDeleteProblem(): UseMutationResult<void, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      requestData<void>({ url: `/dsa/problems/${id}`, method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.dsaProblems });
      void qc.invalidateQueries({ queryKey: queryKeys.dsaTopics });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Resources                                                           */
/* ------------------------------------------------------------------ */

/** Payload for creating a resource. `title` + `url` required; rest optional. */
export type CreateResourceInput = Pick<Resource, 'title' | 'url'> &
  Partial<Omit<Resource, 'id' | 'title' | 'url' | 'addedAt'>>;

/** Create a resource. Invalidates the resources list on success. */
export function useCreateResource(): UseMutationResult<
  Resource,
  ApiError,
  CreateResourceInput
> {
  const qc = useQueryClient();
  return useMutation<Resource, ApiError, CreateResourceInput>({
    mutationFn: (input) =>
      requestData<Resource>({ url: '/resources', method: 'POST', data: mapResourcePayload(input as AnyInput) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.resources });
    },
  });
}

/** Update a resource. Invalidates the resources list on success. */
export function useUpdateResource(): UseMutationResult<
  Resource,
  ApiError,
  { id: string; patch: Partial<Resource> }
> {
  const qc = useQueryClient();
  return useMutation<Resource, ApiError, { id: string; patch: Partial<Resource> }>({
    mutationFn: ({ id, patch }) =>
      requestData<Resource>({ url: `/resources/${id}`, method: 'PATCH', data: mapResourcePayload(patch as AnyInput) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.resources });
    },
  });
}

/** Delete a resource. Invalidates the resources list on success. */
export function useDeleteResource(): UseMutationResult<void, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      requestData<void>({ url: `/resources/${id}`, method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.resources });
    },
  });
}

/**
 * Toggle a resource's favorite flag.
 *
 * The backend resource schema is `.strict()` and has NO `favorite` field, so a
 * PATCH carrying `{ favorite }` would 422 ("Unrecognized key"). Favorite is a
 * client-only concept here: we update the cached resources list optimistically
 * and never hit the network, so the star toggles instantly and never errors.
 */
export function useToggleResourceFavorite(): UseMutationResult<
  Resource | null,
  ApiError,
  { id: string; favorite: boolean }
> {
  const qc = useQueryClient();
  return useMutation<Resource | null, ApiError, { id: string; favorite: boolean }>({
    mutationFn: ({ id, favorite }) => {
      qc.setQueryData<Resource[]>(queryKeys.resources, (prev) =>
        Array.isArray(prev)
          ? prev.map((r) => (r.id === id ? { ...r, favorite } : r))
          : prev,
      );
      return Promise.resolve(null);
    },
  });
}

/* ------------------------------------------------------------------ */
/* Revisions — snooze / skip / reschedule                              */
/* ------------------------------------------------------------------ */

/** Snooze a due revision. Invalidates revisions + dashboard on success. */
export function useSnoozeRevision(): UseMutationResult<Revision, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<Revision, ApiError, string>({
    mutationFn: (id) =>
      requestData<Revision>({ url: `/revisions/${id}/snooze`, method: 'POST', data: {} }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.revisions });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/** Skip a due revision. Invalidates revisions + dashboard on success. */
export function useSkipRevision(): UseMutationResult<Revision, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<Revision, ApiError, string>({
    mutationFn: (id) =>
      requestData<Revision>({ url: `/revisions/${id}/skip`, method: 'POST' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.revisions });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/** Reschedule a revision to a new date. Invalidates revisions + dashboard. */
export function useRescheduleRevision(): UseMutationResult<
  Revision,
  ApiError,
  { id: string; dueDate: string }
> {
  const qc = useQueryClient();
  return useMutation<Revision, ApiError, { id: string; dueDate: string }>({
    mutationFn: ({ id, dueDate }) =>
      requestData<Revision>({
        url: `/revisions/${id}/reschedule`,
        method: 'POST',
        // The schema expects `dueAt` as an ISO-8601 datetime, not `dueDate`.
        data: { dueAt: toIsoDateTime(dueDate) ?? new Date(dueDate).toISOString() },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.revisions });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Study sessions                                                      */
/* ------------------------------------------------------------------ */

/** Payload for creating a study session. `minutes` + `topic` required. */
export type CreateStudySessionInput = Pick<StudySession, 'minutes' | 'topic'> &
  Partial<Omit<StudySession, 'id' | 'minutes' | 'topic'>>;

/** Create a study session. Invalidates sessions + dashboard on success. */
export function useCreateStudySession(): UseMutationResult<
  StudySession,
  ApiError,
  CreateStudySessionInput
> {
  const qc = useQueryClient();
  return useMutation<StudySession, ApiError, CreateStudySessionInput>({
    mutationFn: (input) =>
      requestData<StudySession>({
        url: '/study-sessions',
        method: 'POST',
        data: mapStudySessionPayload(input as AnyInput),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.studySessions });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/** Update a study session. Invalidates sessions + dashboard on success. */
export function useUpdateStudySession(): UseMutationResult<
  StudySession,
  ApiError,
  { id: string; patch: Partial<StudySession> }
> {
  const qc = useQueryClient();
  return useMutation<StudySession, ApiError, { id: string; patch: Partial<StudySession> }>({
    mutationFn: ({ id, patch }) =>
      requestData<StudySession>({
        url: `/study-sessions/${id}`,
        method: 'PATCH',
        data: mapStudySessionPayload(patch as AnyInput),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.studySessions });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/** Delete a study session. Invalidates sessions + dashboard on success. */
export function useDeleteStudySession(): UseMutationResult<void, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      requestData<void>({ url: `/study-sessions/${id}`, method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.studySessions });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Profile / preferences                                              */
/* ------------------------------------------------------------------ */

/** Editable profile fields (subset of UserProfile). */
export type UpdateProfileInput = Partial<
  Pick<UserProfile, 'name' | 'username' | 'bio' | 'avatar' | 'dailyGoal'>
> & { displayName?: string; photoUrl?: string };

/**
 * Map UI preference fields → the STRICT updatePreferencesSchema keys.
 * Accepts only: theme, dailyStudyGoalMinutes, dailyProblemGoal, reminderHour,
 * timezone. `dailyGoal` → `dailyProblemGoal`; `focusDuration`, `weekStart`,
 * `language`, `breakDuration`, `haptics`, `soundEffects` have NO backend field
 * and are dropped (kept as local UI state by the screens).
 */
function mapPreferencesPayload(input: AnyInput): AnyInput {
  const out: AnyInput = {};
  if (input.theme === 'light' || input.theme === 'dark' || input.theme === 'system')
    out.theme = input.theme;
  if (typeof input.dailyStudyGoalMinutes === 'number')
    out.dailyStudyGoalMinutes = Math.max(0, Math.min(1440, Math.round(input.dailyStudyGoalMinutes)));
  if (typeof input.dailyProblemGoal === 'number')
    out.dailyProblemGoal = Math.max(0, Math.min(100, Math.round(input.dailyProblemGoal)));
  else if (typeof input.dailyGoal === 'number')
    out.dailyProblemGoal = Math.max(0, Math.min(100, Math.round(input.dailyGoal)));
  if (typeof input.reminderHour === 'number')
    out.reminderHour = Math.max(0, Math.min(23, Math.round(input.reminderHour)));
  if (typeof input.timezone === 'string') out.timezone = input.timezone;
  return compact(out);
}

/**
 * Update the signed-in user's profile.
 *
 * PATCH /users/me accepts ONLY { displayName, photoUrl }. `name` → `displayName`;
 * `bio`/`username`/`avatar` are NOT profile fields and are dropped. `dailyGoal`
 * is NOT a profile field either — it is routed to PATCH /users/me/preferences as
 * `dailyProblemGoal` in the same call so the editor's single "Save" works.
 */
export function useUpdateProfile(): UseMutationResult<
  UserProfile,
  ApiError,
  UpdateProfileInput
> {
  const qc = useQueryClient();
  return useMutation<UserProfile, ApiError, UpdateProfileInput>({
    mutationFn: async (input) => {
      const profilePatch: AnyInput = {};
      if (typeof input.displayName === 'string') profilePatch.displayName = input.displayName;
      else if (typeof input.name === 'string') profilePatch.displayName = input.name;
      if (typeof input.photoUrl === 'string') profilePatch.photoUrl = input.photoUrl;

      // Route the daily goal to the preferences endpoint (it isn't a profile field).
      if (typeof input.dailyGoal === 'number') {
        await requestData({
          url: '/users/me/preferences',
          method: 'PATCH',
          data: { dailyProblemGoal: Math.max(0, Math.min(100, Math.round(input.dailyGoal))) },
        });
      }

      // Skip the profile PATCH entirely if there's nothing valid to send.
      if (Object.keys(profilePatch).length === 0) {
        return requestData<UserProfile>({ url: '/auth/me', method: 'GET' });
      }
      return requestData<UserProfile>({ url: '/users/me', method: 'PATCH', data: profilePatch });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.profile });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      void qc.invalidateQueries({ queryKey: ['account', 'me'] });
    },
  });
}

/**
 * Update app preferences via PATCH /users/me/preferences.
 *
 * Only the five keys the strict schema allows are sent; UI-only preferences
 * (focusDuration, weekStart, language, …) are dropped so the request never 422s.
 */
export function useUpdatePreferences(): UseMutationResult<
  AppPreferences,
  ApiError,
  Partial<AppPreferences>
> {
  const qc = useQueryClient();
  return useMutation<AppPreferences, ApiError, Partial<AppPreferences>>({
    mutationFn: async (input) => {
      const data = mapPreferencesPayload(input as AnyInput);
      // Nothing maps to a real backend preference — resolve without a 422.
      if (Object.keys(data).length === 0) {
        return requestData<AppPreferences>({ url: '/auth/me', method: 'GET' });
      }
      return requestData<AppPreferences>({
        url: '/users/me/preferences',
        method: 'PATCH',
        data,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.profile });
      void qc.invalidateQueries({ queryKey: ['account', 'me'] });
    },
  });
}

/** Parse a quiet-hours value ("HH:MM" or a whole-hour number/string) to 0–23. */
function toHour(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value))
    return Math.max(0, Math.min(23, Math.round(value)));
  if (typeof value === 'string' && value.trim()) {
    const h = parseInt(value.split(':')[0], 10);
    if (!Number.isNaN(h)) return Math.max(0, Math.min(23, h));
  }
  return undefined;
}

/** The UI's notification-category toggles → backend NotificationType keys. */
const NOTIF_CATEGORY_KEY: Record<string, string> = {
  revisionReminders: 'revision_reminder',
  dailyGoalAlerts: 'daily_goal',
  streakAlerts: 'streak_warning',
  habitReminders: 'habit_reminder',
  taskReminders: 'revision_reminder',
  achievementAlerts: 'achievement_unlocked',
  weeklyReport: 'weekly_analytics',
};

/**
 * Update notification preferences via PATCH /users/me/notification-preferences.
 *
 * The strict schema accepts { pushEnabled, quietHours:{enabled,startHour,endHour},
 * categories }. The UI sends a flat shape (pushEnabled, per-type booleans,
 * quietHours + quietStart/quietEnd as "HH:MM"). This maps the flat UI shape into
 * the nested backend shape and routes per-type toggles into `categories`.
 */
export function useUpdateNotificationPreferences(): UseMutationResult<
  NotificationPreferences,
  ApiError,
  Partial<NotificationPreferences>
> {
  const qc = useQueryClient();
  return useMutation<NotificationPreferences, ApiError, Partial<NotificationPreferences>>({
    mutationFn: (input) => {
      const src = input as AnyInput;
      const out: AnyInput = {};

      if (typeof src.pushEnabled === 'boolean') out.pushEnabled = src.pushEnabled;

      // Quiet hours: combine the master switch + start/end hours when any is set.
      const hasQuiet =
        'quietHours' in src || 'quietStart' in src || 'quietEnd' in src;
      if (hasQuiet) {
        const quiet: AnyInput = {};
        if (typeof src.quietHours === 'boolean') quiet.enabled = src.quietHours;
        else if (typeof src.quietHours === 'object' && src.quietHours)
          Object.assign(quiet, src.quietHours);
        const startHour = toHour(src.quietStart);
        const endHour = toHour(src.quietEnd);
        if (startHour !== undefined) quiet.startHour = startHour;
        if (endHour !== undefined) quiet.endHour = endHour;
        // The nested schema is strict & requires all three keys — only send the
        // object when we have a complete shape.
        if (
          typeof quiet.enabled === 'boolean' &&
          typeof quiet.startHour === 'number' &&
          typeof quiet.endHour === 'number'
        ) {
          out.quietHours = quiet;
        }
      }

      // Per-type toggles → categories map keyed by backend NotificationType.
      const categories: Record<string, boolean> = {};
      for (const [uiKey, backendKey] of Object.entries(NOTIF_CATEGORY_KEY)) {
        if (typeof src[uiKey] === 'boolean') categories[backendKey] = src[uiKey] as boolean;
      }
      if (typeof src.categories === 'object' && src.categories)
        Object.assign(categories, src.categories);
      if (Object.keys(categories).length > 0) out.categories = categories;

      return requestData<NotificationPreferences>({
        url: '/users/me/notification-preferences',
        method: 'PATCH',
        data: out,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.profile });
      void qc.invalidateQueries({ queryKey: ['account', 'me'] });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

/** Mark one notification read via PATCH /notifications/:id/read. */
export function useMarkNotificationRead(): UseMutationResult<
  AppNotification,
  ApiError,
  string
> {
  const qc = useQueryClient();
  return useMutation<AppNotification, ApiError, string>({
    mutationFn: (id) =>
      requestData<AppNotification>({ url: `/notifications/${id}/read`, method: 'PATCH' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}

/** Mark every notification read via POST /notifications/read-all. */
export function useMarkAllNotificationsRead(): UseMutationResult<void, ApiError, void> {
  const qc = useQueryClient();
  return useMutation<void, ApiError, void>({
    mutationFn: () =>
      requestData<void>({ url: '/notifications/read-all', method: 'POST' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}
