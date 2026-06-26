/**
 * Revision (spaced-repetition) helpers for the Smart Revision queue screen.
 *
 * Pure, deterministic logic — no Date.now / Math.random. "Today" is pinned to
 * TODAY (from the mock layer) so due-today grouping and snooze math are stable.
 */
import type { Difficulty, Confidence, Revision } from '@/types/models';
import type { TagTone } from '@/components/ui/Tag';
import type { IconName } from '@/components/ui';
import { colors } from '@/theme/tokens';
import { TODAY } from '@/data/mock';

const DAY_MS = 86_400_000;

/* ------------------------------------------------------------------ */
/* Confidence grades (Easy / Medium / Hard recall outcome)             */
/* ------------------------------------------------------------------ */

/** The three recall outcomes a user can pick when completing a revision. */
export type RecallGrade = 'EASY' | 'MEDIUM' | 'HARD';

export type RecallGradeMeta = {
  grade: RecallGrade;
  label: string;
  /** Vector icon (no emoji) shown alongside the grade. */
  icon: IconName;
  /** Resulting confidence written back to the revision. */
  confidence: Confidence;
  /** Multiplier applied to the current interval to schedule the next review. */
  intervalFactor: number;
  accentHex: string;
  tone: TagTone;
};

/**
 * SM-2-flavoured grade table. Hard shrinks the interval (review sooner), Medium
 * keeps it growing modestly, Easy stretches it out (review much later).
 */
export const RECALL_GRADES: RecallGradeMeta[] = [
  {
    grade: 'HARD',
    label: 'Hard',
    icon: 'flame',
    confidence: 1,
    intervalFactor: 0.5,
    accentHex: colors.annotation,
    tone: 'annotation',
  },
  {
    grade: 'MEDIUM',
    label: 'Medium',
    icon: 'brain',
    confidence: 3,
    intervalFactor: 1.4,
    accentHex: colors.signal,
    tone: 'signal',
  },
  {
    grade: 'EASY',
    label: 'Easy',
    icon: 'zap',
    confidence: 5,
    intervalFactor: 2.5,
    accentHex: colors.success,
    tone: 'success',
  },
];

/** Look up grade metadata by its key. */
export function gradeMeta(grade: RecallGrade): RecallGradeMeta {
  return RECALL_GRADES.find((g) => g.grade === grade) ?? RECALL_GRADES[1];
}

/* ------------------------------------------------------------------ */
/* Difficulty styling                                                  */
/* ------------------------------------------------------------------ */

export const DIFFICULTY_TONE: Record<Difficulty, TagTone> = {
  EASY: 'success',
  MEDIUM: 'peach',
  HARD: 'annotation',
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

/* ------------------------------------------------------------------ */
/* Confidence visualisation                                            */
/* ------------------------------------------------------------------ */

/** Maps a 1..5 confidence to an accent colour for the meter pips. */
export function confidenceColor(level: Confidence): string {
  if (level <= 2) return colors.annotation;
  if (level === 3) return colors.peach;
  if (level === 4) return colors.signal;
  return colors.success;
}

export function confidenceLabel(level: Confidence): string {
  switch (level) {
    case 1:
      return 'Shaky';
    case 2:
      return 'Wobbly';
    case 3:
      return 'Okay';
    case 4:
      return 'Solid';
    default:
      return 'Locked in';
  }
}

/* ------------------------------------------------------------------ */
/* Date helpers (pinned to TODAY)                                      */
/* ------------------------------------------------------------------ */

function parseIso(day: string): number {
  return Date.parse(`${day.slice(0, 10)}T00:00:00Z`);
}

function toIso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Whole-day difference of `day` relative to TODAY (negative = past). */
export function daysFromToday(day: string): number {
  return Math.round((parseIso(day) - parseIso(TODAY)) / DAY_MS);
}

/** "Today", "Tomorrow", "In 3 days", "Mon, Jul 5", etc. */
export function relativeDueLabel(day: string): string {
  const delta = daysFromToday(day);
  if (delta < 0) return delta === -1 ? 'Yesterday' : `${-delta} days ago`;
  if (delta === 0) return 'Today';
  if (delta === 1) return 'Tomorrow';
  if (delta <= 6) return `In ${delta} days`;
  return formatCalendarDate(day);
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** "Sun, Jun 28" style label. */
export function formatCalendarDate(day: string): string {
  const d = new Date(parseIso(day));
  return `${WEEKDAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** Short calendar chip parts for the upcoming preview. */
export function calendarChip(day: string): {
  weekday: string;
  dayNum: string;
  month: string;
} {
  const d = new Date(parseIso(day));
  return {
    weekday: WEEKDAYS[d.getUTCDay()],
    dayNum: String(d.getUTCDate()),
    month: MONTHS[d.getUTCMonth()],
  };
}

/* ------------------------------------------------------------------ */
/* Scheduling transforms                                               */
/* ------------------------------------------------------------------ */

/** Adds `n` days to an ISO date string (pinned-safe). */
export function addDays(day: string, n: number): string {
  return toIso(parseIso(day) + n * DAY_MS);
}

/**
 * Apply a recall grade to a revision: bump the review count, write the new
 * confidence, grow/shrink the interval and schedule the next due date off TODAY.
 */
export function applyGrade(rev: Revision, meta: RecallGradeMeta): Revision {
  const nextInterval = Math.max(
    1,
    Math.round(rev.intervalDays * meta.intervalFactor),
  );
  const nextDue = addDays(TODAY, nextInterval);
  return {
    ...rev,
    confidence: meta.confidence,
    intervalDays: nextInterval,
    reviewCount: rev.reviewCount + 1,
    lastReviewedAt: TODAY,
    dueDate: nextDue,
    dueToday: false,
  };
}

/** Snooze a due revision forward by `n` days (default 1). */
export function snoozeRevision(rev: Revision, n = 1): Revision {
  const nextDue = addDays(TODAY, n);
  return {
    ...rev,
    dueDate: nextDue,
    dueToday: daysFromToday(nextDue) <= 0,
  };
}

/**
 * Human preview of when a given grade would schedule the next review, e.g.
 * "in 6 days" / "in ~3 weeks". Used to telegraph the SM-2 outcome before the
 * user commits to a grade.
 */
export function nextReviewPreview(rev: Revision, meta: RecallGradeMeta): string {
  const days = Math.max(1, Math.round(rev.intervalDays * meta.intervalFactor));
  if (days === 1) return 'in 1 day';
  if (days < 14) return `in ${days} days`;
  const weeks = Math.round(days / 7);
  return `in ~${weeks} week${weeks === 1 ? '' : 's'}`;
}

/* ------------------------------------------------------------------ */
/* Upcoming grouping                                                   */
/* ------------------------------------------------------------------ */

export type UpcomingGroup = {
  dueDate: string;
  label: string;
  items: Revision[];
};

/**
 * Group future (not-due-today) revisions by their due date, ascending. Skips
 * anything still due today — those live in the Due Today queue.
 */
export function groupUpcoming(revisions: Revision[]): UpcomingGroup[] {
  const future = revisions
    .filter((r) => !r.dueToday && daysFromToday(r.dueDate) > 0)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const byDate = new Map<string, Revision[]>();
  for (const r of future) {
    const list = byDate.get(r.dueDate) ?? [];
    list.push(r);
    byDate.set(r.dueDate, list);
  }

  return [...byDate.entries()].map(([dueDate, items]) => ({
    dueDate,
    label: relativeDueLabel(dueDate),
    items,
  }));
}

/* ------------------------------------------------------------------ */
/* Revision activity heatmap                                           */
/* ------------------------------------------------------------------ */

/**
 * Deterministic per-day *revision* activity for the last `days`, ending TODAY.
 * Distinct from the global problem heatmap — this is reviews completed per day,
 * derived from a pure index hash so it renders identically every reload.
 */
export function buildRevisionHeatmap(
  days = 182,
): { day: string; count: number }[] {
  const endMs = parseIso(TODAY);
  const out: { day: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const ms = endMs - i * DAY_MS;
    const d = new Date(ms);
    const dow = d.getUTCDay();
    // Weave a couple of integer sequences for a believable review cadence.
    const seed = (i * 2654435761 + 40503) >>> 9;
    let count = seed % 5; // 0..4 reviews
    if (dow === 0 || dow === 6) count = Math.max(0, count - 2); // lighter weekends
    if (i % 13 === 0) count = 0; // skipped days
    if (i % 9 === 0) count = Math.min(6, count + 3); // catch-up sessions
    out.push({ day: toIso(ms), count });
  }
  return out;
}
