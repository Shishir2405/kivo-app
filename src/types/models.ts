/**
 * Domain models for the Kivo app.
 *
 * These mirror the backend entities (Spring service at /api/v1) loosely — the
 * shapes here are what the mobile screens consume. Keep these the single
 * source of truth for screen agents; mock data in `src/data/mock.ts` is typed
 * against these.
 */
import type { IconName } from '@/components/ui/Icon';

/* ------------------------------------------------------------------ */
/* Shared primitives                                                   */
/* ------------------------------------------------------------------ */

/**
 * Re-export of the curated icon-name union (105 glyphs) from the design kit.
 *
 * NON-NEGOTIABLE: the app ships ZERO emoji. Every field below that used to hold
 * an emoji codepoint now holds an `IconName` string (e.g. `'flame'`, `'code'`)
 * meant to be rendered with `<Icon name={...} />`. The field is still named
 * `emoji` for backward-compat with existing screen reads, but its VALUE is an
 * icon-name token, never a pictograph.
 */
export type { IconName };

/** ISO-8601 date or datetime string, e.g. "2026-06-26" or "2026-06-26T09:00:00Z". */
export type IsoDate = string;

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type ProblemStatus = 'TODO' | 'ATTEMPTED' | 'SOLVED' | 'MASTERED';

/** Spaced-repetition confidence after a revision (1 = shaky, 5 = solid). */
export type Confidence = 1 | 2 | 3 | 4 | 5;

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

/* ------------------------------------------------------------------ */
/* User                                                                */
/* ------------------------------------------------------------------ */

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  /** Local require()'d avatar asset id, or undefined for initials fallback. */
  avatar?: number;
  bio?: string;
  /** Current consecutive-day streak. */
  streak: number;
  /** Best streak ever achieved. */
  longestStreak: number;
  /** Total problems solved all-time. */
  totalSolved: number;
  /** Experience points / score. */
  xp: number;
  level: number;
  /** Day the user joined. */
  joinedAt: IsoDate;
  /** Self-set daily problem goal. */
  dailyGoal: number;
}

/* ------------------------------------------------------------------ */
/* Roadmap / DSA                                                       */
/* ------------------------------------------------------------------ */

export interface Roadmap {
  id: string;
  title: string;
  description: string;
  /**
   * Icon-name token used as the hero glyph (render with `<Icon name={emoji} />`).
   * Field kept named `emoji` for backward-compat; the value is an `IconName`,
   * never a pictograph.
   */
  emoji: IconName;
  /** Ordered topic ids that make up this roadmap. */
  topicIds: string[];
  totalProblems: number;
  solvedProblems: number;
  /** 0–100 completion. */
  progress: number;
  /** Accent color token name for theming the card. */
  accent: 'highlighter' | 'signal' | 'peach' | 'annotation' | 'success';
  /** Curator / source of the sheet, e.g. 'Striver', 'NeetCode'. */
  curator?: string;
  /** Estimated weeks to finish at the user's pace. */
  estimatedWeeks?: number;
  /** Difficulty mix label, e.g. 'Beginner to Advanced'. */
  level?: string;
}

export interface DsaTopic {
  id: string;
  /** Owning roadmap id. */
  roadmapId: string;
  title: string;
  /** Icon-name token (render with `<Icon name={emoji} />`), never a pictograph. */
  emoji: IconName;
  description: string;
  difficulty: Difficulty;
  totalProblems: number;
  solvedProblems: number;
  /** 0–100 completion. */
  progress: number;
  /** Estimated focus time in minutes. */
  estimatedMinutes: number;
  tags: string[];
  /** Self-rated mastery 0–100 (distinct from raw progress). */
  mastery?: number;
}

export interface Problem {
  id: string;
  topicId: string;
  title: string;
  difficulty: Difficulty;
  status: ProblemStatus;
  /** Optional external practice link label (no remote URLs in app). */
  source?: string;
  tags: string[];
  /** Whether the user starred/bookmarked it. */
  bookmarked: boolean;
  /** Number of times attempted. */
  attempts: number;
  /** Last time it was worked on. */
  lastAttemptedAt?: IsoDate;
  /** Free-form notes. */
  notes?: string;
  /** Practice platform, e.g. 'LeetCode', 'Codeforces', 'GFG'. */
  platform?: string;
  /** Big-O time complexity of the accepted approach, e.g. 'O(n)'. */
  timeComplexity?: string;
  /** Big-O space complexity, e.g. 'O(1)'. */
  spaceComplexity?: string;
  /** One-line approach summary (coding-journal field). */
  approach?: string;
  /** Minutes spent on the best/last solve. */
  timeSpentMinutes?: number;
}

/* ------------------------------------------------------------------ */
/* Revisions (spaced repetition)                                       */
/* ------------------------------------------------------------------ */

export interface Revision {
  id: string;
  problemId: string;
  /** Denormalised for list rendering. */
  problemTitle: string;
  topicTitle: string;
  difficulty: Difficulty;
  /** When this revision is due. */
  dueDate: IsoDate;
  /** True when dueDate is today or earlier. */
  dueToday: boolean;
  /** Confidence recorded at the last review. */
  confidence: Confidence;
  /** Spaced-repetition interval in days until next review. */
  intervalDays: number;
  /** How many times reviewed so far. */
  reviewCount: number;
  lastReviewedAt?: IsoDate;
}

/* ------------------------------------------------------------------ */
/* Tracker — tasks, habits, sessions, reflections                      */
/* ------------------------------------------------------------------ */

/** A single sub-step inside a task's checklist. */
export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
  priority: Priority;
  /** Optional due date. */
  dueDate?: IsoDate;
  /** Optional linked topic. */
  topicId?: string;
  category: 'DSA' | 'PROJECT' | 'REVISION' | 'OTHER';
  /** Icon-name token for the category glyph, never a pictograph. */
  icon?: IconName;
  /** Optional longer description. */
  notes?: string;
  /** Optional ordered checklist of sub-steps. */
  checklist?: ChecklistItem[];
}

export interface Habit {
  id: string;
  title: string;
  /** Icon-name token (render with `<Icon name={emoji} />`), never a pictograph. */
  emoji: IconName;
  /** Current streak in days. */
  streak: number;
  /** Whether completed for today. */
  completedToday: boolean;
  /** Target days-per-week. */
  targetPerWeek: number;
  /** Last 7 days completion flags, oldest -> newest. */
  weekHistory: boolean[];
  accent: 'highlighter' | 'signal' | 'peach' | 'success';
}

export interface StudySession {
  id: string;
  date: IsoDate;
  /** Minutes focused. */
  minutes: number;
  /** What was studied. */
  topic: string;
  /** Problems solved during the session. */
  problemsSolved: number;
}

/** Aggregated study stats for the tracker / dashboard. */
export interface StudySummary {
  totalMinutesThisWeek: number;
  totalMinutesAllTime: number;
  sessionsThisWeek: number;
  averageMinutesPerDay: number;
  /** Minutes per weekday Mon..Sun for the weekly bar chart. */
  weeklyMinutes: number[];
  recentSessions: StudySession[];
}

export interface Reflection {
  id: string;
  date: IsoDate;
  /** Short mood label. */
  mood: 'GREAT' | 'GOOD' | 'OKAY' | 'TIRED' | 'STRESSED';
  /** Icon-name token for the mood glyph, never a pictograph. */
  emoji: IconName;
  /** The reflection body. */
  note: string;
  /** Optional gratitude / win line. */
  win?: string;
}

/* ------------------------------------------------------------------ */
/* Gamification                                                        */
/* ------------------------------------------------------------------ */

export interface Achievement {
  id: string;
  title: string;
  description: string;
  /** Icon-name token (render with `<Icon name={emoji} />`), never a pictograph. */
  emoji: IconName;
  /** True once earned. */
  unlocked: boolean;
  /** Date unlocked, if earned. */
  unlockedAt?: IsoDate;
  /** 0–100 progress toward unlocking. */
  progress: number;
  tone: 'highlighter' | 'signal' | 'peach' | 'annotation' | 'success';
}

/* ------------------------------------------------------------------ */
/* Heatmap / dashboard composites                                      */
/* ------------------------------------------------------------------ */

/** One cell of the contribution heatmap. */
export interface HeatmapDay {
  /** "YYYY-MM-DD". */
  day: IsoDate;
  /** Activity count for that day. */
  count: number;
}

export interface Quote {
  text: string;
  author: string;
}

/** Everything the Dashboard screen needs in one payload. */
export interface DashboardData {
  greeting: string;
  /** Problems solved today vs the user's daily goal. */
  solvedToday: number;
  dailyGoal: number;
  streak: number;
  /** Count of revisions due today. */
  revisionsDueToday: number;
  /** Open task count. */
  openTasks: number;
  /** Minutes focused today. */
  focusMinutesToday: number;
  /** A few topics to continue. */
  continueTopics: DsaTopic[];
  quote: Quote;
}

/* ================================================================== */
/* EXPANSION — feature-screen domain models                            */
/* ================================================================== */

/* ------------------------------------------------------------------ */
/* Notes — rich markdown notebook                                      */
/* ------------------------------------------------------------------ */

/** A grouping folder for notes (label + glyph token). */
export type NoteFolder =
  | 'DSA'
  | 'System Design'
  | 'Behavioral'
  | 'Projects'
  | 'Snippets'
  | 'General';

export interface Note {
  id: string;
  title: string;
  /** Markdown body (headings, lists, code fences, blockquotes supported). */
  body: string;
  /** Short preview line derived from the body, for list rows. */
  preview: string;
  tags: string[];
  folder: NoteFolder;
  /** Icon-name token (render with `<Icon name={icon} />`), never a pictograph. */
  icon: IconName;
  /** Accent color token for the note card. */
  accent: 'highlighter' | 'signal' | 'peach' | 'annotation' | 'success';
  favorite: boolean;
  pinned: boolean;
  archived: boolean;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  /** Approx. word count of the body, for the list meta line. */
  wordCount: number;
}

/* ------------------------------------------------------------------ */
/* Resources — saved learning links                                    */
/* ------------------------------------------------------------------ */

export type ResourceType =
  | 'youtube'
  | 'playlist'
  | 'article'
  | 'documentation'
  | 'github'
  | 'pdf'
  | 'blog';

export interface Resource {
  id: string;
  title: string;
  /** External URL (links out; never fetched in-app). */
  url: string;
  type: ResourceType;
  /** Topic / subject label, e.g. 'Graphs', 'System Design'. */
  topic: string;
  /** Optional source / channel / author, e.g. 'takeUforward'. */
  source?: string;
  /** Short one-line description. */
  description?: string;
  /** Icon-name token for the type glyph, never a pictograph. */
  icon: IconName;
  /** Accent color token. */
  accent: 'highlighter' | 'signal' | 'peach' | 'annotation' | 'success';
  /** Whether the user starred it. */
  favorite: boolean;
  /** Whether the user has marked it consumed. */
  completed: boolean;
  /** Optional estimated duration label, e.g. '12 min', '3h 20m'. */
  duration?: string;
  addedAt: IsoDate;
}

/* ------------------------------------------------------------------ */
/* Daily journal / reflections (rich)                                  */
/* ------------------------------------------------------------------ */

export type Mood = 'GREAT' | 'GOOD' | 'OKAY' | 'TIRED' | 'STRESSED';

/** A 1–5 self-rating used for focus / confidence sliders. */
export type Rating = 1 | 2 | 3 | 4 | 5;

/**
 * A full daily journal entry. Distinct from the lightweight `Reflection`
 * (kept for backward-compat) — this is the structured end-of-day review the
 * Reflections feature screen reads/writes, keyed by calendar day.
 */
export interface JournalEntry {
  id: string;
  /** "YYYY-MM-DD" — the natural key, one entry per day. */
  dayKey: IsoDate;
  /** What I learned today. */
  learned: string;
  /** What challenged me / where I struggled. */
  challenged: string;
  /** Goals completed today (free-text bullets). */
  goalsCompleted: string[];
  /** Self-rated focus quality 1–5. */
  focus: Rating;
  /** Self-rated confidence 1–5. */
  confidence: Rating;
  /** Plan for tomorrow. */
  tomorrowPlan: string;
  mood: Mood;
  /** Icon-name token for the mood glyph, never a pictograph. */
  moodIcon: IconName;
}

/* ------------------------------------------------------------------ */
/* Notifications (history)                                             */
/* ------------------------------------------------------------------ */

export type NotificationType =
  | 'REVISION_DUE'
  | 'DAILY_GOAL'
  | 'STREAK'
  | 'HABIT'
  | 'ACHIEVEMENT'
  | 'TASK_DUE'
  | 'FOCUS_SESSION'
  | 'WEEKLY_REPORT'
  | 'SYSTEM';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Icon-name token (render with `<Icon name={icon} />`), never a pictograph. */
  icon: IconName;
  /** Accent color token for the leading glyph chip. */
  accent: 'highlighter' | 'signal' | 'peach' | 'annotation' | 'success';
  read: boolean;
  createdAt: IsoDate;
  /** Optional in-app deep link, e.g. '/revisions' or '/achievements'. */
  href?: string;
}

/* ------------------------------------------------------------------ */
/* Achievement catalog (earned + locked)                               */
/* ------------------------------------------------------------------ */

/**
 * A richer achievement record for the Achievements feature screen. Adds an XP
 * reward and a stable `key`. The original `Achievement` interface (above) is
 * preserved for existing screens; this one is additive.
 */
export interface AchievementEntry {
  /** Stable catalog key, e.g. 'streak_30'. */
  key: string;
  title: string;
  description: string;
  /** Icon-name token (render with `<Icon name={icon} />`), never a pictograph. */
  icon: IconName;
  /** XP awarded on unlock. */
  xp: number;
  /** True once earned. */
  unlocked: boolean;
  /** Date unlocked, if earned. */
  unlockedAt?: IsoDate;
  /** 0–100 progress toward unlocking. */
  progress: number;
  /** Category for grouping/filtering. */
  category: 'STREAK' | 'VOLUME' | 'REVISION' | 'FOCUS' | 'MILESTONE';
  tone: 'highlighter' | 'signal' | 'peach' | 'annotation' | 'success';
}

/* ------------------------------------------------------------------ */
/* Analytics — weekly reports + trend                                  */
/* ------------------------------------------------------------------ */

export interface WeeklyReport {
  id: string;
  /** ISO Monday of the week this report covers. */
  weekStart: IsoDate;
  /** Human label, e.g. 'Jun 22 – Jun 28'. */
  label: string;
  studyHours: number;
  problemsSolved: number;
  /** % of due revisions cleared. */
  revisionRate: number;
  /** % of tasks completed. */
  taskRate: number;
  focusSessions: number;
  /** % of habit targets met. */
  habitRate: number;
  /** Longest single focus session in minutes. */
  longestSession: number;
  strongestTopic: string;
  weakestTopic: string;
  /** 0–100 blended productivity score. */
  productivityScore: number;
  /** Delta vs. previous week's productivity score (can be negative). */
  scoreDelta: number;
  /** Coaching recommendations for the upcoming week. */
  recommendations: string[];
}

/** One point on the productivity trend line. */
export interface ProductivityPoint {
  /** ISO Monday of the week. */
  weekStart: IsoDate;
  /** Short label, e.g. 'W1', or 'Jun 22'. */
  label: string;
  /** 0–100 productivity score. */
  score: number;
}

/* ------------------------------------------------------------------ */
/* Calendar                                                            */
/* ------------------------------------------------------------------ */

export type CalendarEventType = 'TASK' | 'REVISION' | 'SESSION' | 'HABIT' | 'GOAL';

export interface CalendarEvent {
  id: string;
  /** "YYYY-MM-DD". */
  date: IsoDate;
  /** "HH:MM" 24h, or undefined for all-day. */
  time?: string;
  type: CalendarEventType;
  title: string;
  /** Optional secondary line, e.g. topic or duration. */
  subtitle?: string;
  /** Icon-name token (render with `<Icon name={icon} />`), never a pictograph. */
  icon: IconName;
  /** Accent color token. */
  accent: 'highlighter' | 'signal' | 'peach' | 'annotation' | 'success';
  /** Whether it is already done/past. */
  done?: boolean;
}

/* ------------------------------------------------------------------ */
/* Settings & preferences                                              */
/* ------------------------------------------------------------------ */

export type ThemeMode = 'light' | 'dark' | 'system';
export type WeekStart = 'mon' | 'sun';
export type AppLanguage = 'en' | 'es' | 'hi' | 'fr';

/** Per-notification-type toggles plus quiet hours. */
export interface NotificationPreferences {
  revisionReminders: boolean;
  dailyGoalAlerts: boolean;
  streakAlerts: boolean;
  habitReminders: boolean;
  taskReminders: boolean;
  achievementAlerts: boolean;
  weeklyReport: boolean;
  /** Master quiet-hours switch. */
  quietHours: boolean;
  /** Quiet-hours start "HH:MM" 24h. */
  quietStart: string;
  /** Quiet-hours end "HH:MM" 24h. */
  quietEnd: string;
}

export interface AppPreferences {
  theme: ThemeMode;
  weekStart: WeekStart;
  language: AppLanguage;
  /** Self-set daily problem goal (mirrors profile). */
  dailyGoal: number;
  /** Default focus-timer length in minutes. */
  focusDuration: number;
  /** Default break length in minutes. */
  breakDuration: number;
  /** Haptic feedback on interactions. */
  haptics: boolean;
  /** Play a sound when a focus session ends. */
  soundEffects: boolean;
}

/** The full settings payload the Settings screen reads. */
export interface Settings {
  /** Editable profile fields. */
  profile: {
    name: string;
    username: string;
    email: string;
    bio: string;
    /** Local require()'d avatar asset id. */
    avatar?: number;
  };
  notifications: NotificationPreferences;
  preferences: AppPreferences;
  /** App version string for the About row. */
  appVersion: string;
}
