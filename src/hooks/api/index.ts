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
} from '@/types/models';

export { queryKeys } from './keys';

/** Convenience: a query result whose error is the normalised ApiError. */
export type ApiQueryResult<T> = UseQueryResult<T, ApiError>;

function useIsAuthed(): boolean {
  return useAuthStore((s) => s.isAuthenticated);
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

export function useRevisions(): ApiQueryResult<Revision[]> {
  const enabled = useIsAuthed();
  return useQuery<Revision[], ApiError>({
    queryKey: queryKeys.revisions,
    queryFn: () => requestData<Revision[]>({ url: '/revisions', method: 'GET' }),
    enabled,
  });
}

export function useTasks(): ApiQueryResult<Task[]> {
  const enabled = useIsAuthed();
  return useQuery<Task[], ApiError>({
    queryKey: queryKeys.tasks,
    queryFn: () => requestData<Task[]>({ url: '/tasks', method: 'GET' }),
    enabled,
  });
}

export function useNotes(): ApiQueryResult<Note[]> {
  const enabled = useIsAuthed();
  return useQuery<Note[], ApiError>({
    queryKey: queryKeys.notes,
    queryFn: () => requestData<Note[]>({ url: '/notes', method: 'GET' }),
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
    queryFn: () => requestData<Habit[]>({ url: '/habits', method: 'GET' }),
    enabled,
  });
}

export function useResources(): ApiQueryResult<Resource[]> {
  const enabled = useIsAuthed();
  return useQuery<Resource[], ApiError>({
    queryKey: queryKeys.resources,
    queryFn: () => requestData<Resource[]>({ url: '/resources', method: 'GET' }),
    enabled,
  });
}

export function useDsaTopics(): ApiQueryResult<DsaTopic[]> {
  const enabled = useIsAuthed();
  return useQuery<DsaTopic[], ApiError>({
    queryKey: queryKeys.dsaTopics,
    queryFn: () => requestData<DsaTopic[]>({ url: '/dsa/topics', method: 'GET' }),
    enabled,
  });
}

export function useDsaProblems(): ApiQueryResult<Problem[]> {
  const enabled = useIsAuthed();
  return useQuery<Problem[], ApiError>({
    queryKey: queryKeys.dsaProblems,
    queryFn: () => requestData<Problem[]>({ url: '/dsa/problems', method: 'GET' }),
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
    queryFn: () => requestData<AppNotification[]>({ url: '/notifications', method: 'GET' }),
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
      requestData<Task>({ url: `/tasks/${id}`, method: 'PATCH', data: patch }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tasks });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/** Mark a revision reviewed. Invalidates revisions + dashboard on success. */
export function useReviewRevision(): UseMutationResult<Revision, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<Revision, ApiError, string>({
    mutationFn: (id) =>
      requestData<Revision>({ url: `/revisions/${id}/review`, method: 'POST' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.revisions });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}
