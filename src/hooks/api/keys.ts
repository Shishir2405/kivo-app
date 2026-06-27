/** Centralised TanStack Query keys for Kivo. */
export const queryKeys = {
  me: ['me'] as const,
  profile: ['profile'] as const,
  dashboard: ['dashboard'] as const,
  revisions: ['revisions'] as const,
  tasks: ['tasks'] as const,
  notes: ['notes'] as const,
  note: (id: string) => ['notes', id] as const,
  habits: ['habits'] as const,
  resources: ['resources'] as const,
  dsaTopics: ['dsa', 'topics'] as const,
  dsaProblems: ['dsa', 'problems'] as const,
  studySessions: ['study-sessions'] as const,
  reflections: ['reflections'] as const,
  achievements: ['achievements'] as const,
  notifications: ['notifications'] as const,
  analytics: (slug: string) => ['analytics', slug] as const,
} as const;
