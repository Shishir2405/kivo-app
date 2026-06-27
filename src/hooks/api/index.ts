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
      requestData<Task>({ url: '/tasks', method: 'POST', data: input }),
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
      requestData<Task>({ url: `/tasks/${id}/status`, method: 'PATCH', data: { done } }),
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
      requestData<Note>({ url: '/notes', method: 'POST', data: input }),
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
      requestData<Note>({ url: `/notes/${id}`, method: 'PATCH', data: patch }),
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
      requestData<Habit>({ url: '/habits', method: 'POST', data: input }),
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
      requestData<Habit>({ url: `/habits/${id}`, method: 'PATCH', data: patch }),
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
      requestData<Habit>({ url: `/habits/${id}/complete`, method: 'POST' }),
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
      requestData<Habit>({ url: `/habits/${id}/uncomplete`, method: 'POST' }),
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
      requestData<Reflection>({ url: '/reflections', method: 'POST', data: input }),
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
      requestData<Reflection>({ url: `/reflections/${id}`, method: 'PATCH', data: patch }),
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
      requestData<DsaTopic>({ url: '/dsa/topics', method: 'POST', data: input }),
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
      requestData<DsaTopic>({ url: `/dsa/topics/${id}`, method: 'PATCH', data: patch }),
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
      requestData<DsaTopic>({ url: `/dsa/topics/${id}/complete`, method: 'POST' }),
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
      requestData<Problem>({ url: '/dsa/problems', method: 'POST', data: input }),
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
      requestData<Problem>({ url: `/dsa/problems/${id}`, method: 'PATCH', data: patch }),
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
      requestData<Resource>({ url: '/resources', method: 'POST', data: input }),
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
      requestData<Resource>({ url: `/resources/${id}`, method: 'PATCH', data: patch }),
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

/** Toggle a resource's favorite flag via PATCH /resources/:id. */
export function useToggleResourceFavorite(): UseMutationResult<
  Resource,
  ApiError,
  { id: string; favorite: boolean }
> {
  const qc = useQueryClient();
  return useMutation<Resource, ApiError, { id: string; favorite: boolean }>({
    mutationFn: ({ id, favorite }) =>
      requestData<Resource>({ url: `/resources/${id}`, method: 'PATCH', data: { favorite } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.resources });
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
      requestData<Revision>({ url: `/revisions/${id}/snooze`, method: 'POST' }),
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
        data: { dueDate },
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
      requestData<StudySession>({ url: '/study-sessions', method: 'POST', data: input }),
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
        data: patch,
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
>;

/** Update the signed-in user's profile via PATCH /users/me. */
export function useUpdateProfile(): UseMutationResult<
  UserProfile,
  ApiError,
  UpdateProfileInput
> {
  const qc = useQueryClient();
  return useMutation<UserProfile, ApiError, UpdateProfileInput>({
    mutationFn: (input) =>
      requestData<UserProfile>({ url: '/users/me', method: 'PATCH', data: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.profile });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/** Update app preferences via PATCH /users/me/preferences. */
export function useUpdatePreferences(): UseMutationResult<
  AppPreferences,
  ApiError,
  Partial<AppPreferences>
> {
  const qc = useQueryClient();
  return useMutation<AppPreferences, ApiError, Partial<AppPreferences>>({
    mutationFn: (input) =>
      requestData<AppPreferences>({
        url: '/users/me/preferences',
        method: 'PATCH',
        data: input,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}

/** Update notification preferences via PATCH /users/me/notification-preferences. */
export function useUpdateNotificationPreferences(): UseMutationResult<
  NotificationPreferences,
  ApiError,
  Partial<NotificationPreferences>
> {
  const qc = useQueryClient();
  return useMutation<NotificationPreferences, ApiError, Partial<NotificationPreferences>>({
    mutationFn: (input) =>
      requestData<NotificationPreferences>({
        url: '/users/me/notification-preferences',
        method: 'PATCH',
        data: input,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.profile });
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
