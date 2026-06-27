/**
 * Revision (spaced-repetition) helpers for the Steep revisions screen.
 *
 * Pure, deterministic transforms over the live `/revisions` payload. Date math
 * is anchored to the real device "today" (start-of-day) so due grouping and the
 * activity heatmap stay correct regardless of when the screen renders. Every
 * helper is null/shape tolerant — a malformed record can never throw.
 */
import type { Difficulty, Confidence, Revision } from '@/types/models';
import type { TagTone } from '@/components/ui/Tag';
import type { IconName } from '@/components/ui';
import { palette } from '@/theme/tokens';

const DAY_MS = 86_400_000;

/* ------------------------------------------------------------------ */
/* Recall grades (the segmented confidence control)                    */
/* ------------------------------------------------------------------ */

/** The three recall outcomes a user can pick when reviewing a revision. */
export type RecallGrade = 'HARD' | 'MEDIUM' | 'EASY';

export type RecallGradeMeta = {
  grade: RecallGrade;
  label: string;
  /** Thin outline glyph shown in the segment (no emoji). */
  icon: IconName;
  /** Resulting confidence written back to the revision. */
  confidence: Confidence;
  /** Multiplier applied to the current interval to schedule the next review. */
  intervalFactor: number;
  /** Steep tone for the next-interval hint. */
  tone: TagTone;
};

/**
 * SM-2-flavoured grade table. Hard shrinks the interval (review sooner), Medium
 * grows it modestly, Easy stretches it out. Color is punctuation — only the
 * next-interval hint carries a tone.
 */
export const RECALL_GRADES: RecallGradeMeta[] = [
  { grade: 'HARD', label: 'Hard', icon: 'flame', confidence: 1, intervalFactor: 0.5, tone: 'rust' },
  { grade: 'MEDIUM', label: 'Medium', icon: 'brain', confidence: 3, intervalFactor: 1.5, tone: 'cool' },
  { grade: 'EASY', label: 'Easy', icon: 'check', confidence: 5, intervalFactor: 2.5, tone: 'ink' },
];

/** Look up grade metadata by its key (defaults to Medium). */
export function gradeMeta(grade: RecallGrade): RecallGradeMeta {
  return RECALL_GRADES.find((g) => g.grade === grade) ?? RECALL_GRADES[1];
}

/* ------------------------------------------------------------------ */
/* Difficulty + confidence styling (monochrome / washes only)          */
/* ------------------------------------------------------------------ */

export const DIFFICULTY_TONE: Record<Difficulty, TagTone> = {
  EASY: 'neutral',
  MEDIUM: 'cool',
  HARD: 'rust',
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

/** Clamp any value into the 1..5 confidence band. */
export function clampConfidence(value: unknown): Confidence {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n <= 1) return 1;
  if (n >= 5) return 5;
  return n as Confidence;
}

/**
 * The confidence meter is monochrome: filled pips are Ink, empty pips Dove. The
 * single warm Rust voice is reserved for the lowest (shaky) band only.
 */
export function confidencePipColor(level: Confidence): string {
  return level <= 2 ? palette.rust : palette.ink;
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
/* Date helpers (anchored to real local "today")                       */
/* ------------------------------------------------------------------ */

/** Local midnight (ms) for the supplied date — defaults to now. */
function startOfDayMs(d: Date = new Date()): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Parse an ISO date/datetime to its local start-of-day ms, or NaN. */
function parseDayMs(day: string | undefined | null): number {
  if (!day) return NaN;
  const parsed = new Date(day);
  if (Number.isNaN(parsed.getTime())) return NaN;
  return startOfDayMs(parsed);
}

/** "YYYY-MM-DD" for a ms timestamp (local). */
function toIso(ms: number): string {
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Whole-day difference of `day` relative to today (negative = past). */
export function daysFromToday(day: string | undefined | null): number {
  const ms = parseDayMs(day);
  if (Number.isNaN(ms)) return Number.POSITIVE_INFINITY;
  return Math.round((ms - startOfDayMs()) / DAY_MS);
}

/** A revision is "due" when its due date is today or already past. */
export function isDue(rev: Revision): boolean {
  if (rev.dueToday) return true;
  const delta = daysFromToday(rev.dueDate);
  return Number.isFinite(delta) && delta <= 0;
}

/** "Overdue", "Today", "Tomorrow", "In 3 days", "Mon, Jul 5". */
export function relativeDueLabel(day: string): string {
  const delta = daysFromToday(day);
  if (!Number.isFinite(delta)) return 'Scheduled';
  if (delta < 0) return delta === -1 ? 'Yesterday' : `${-delta} days ago`;
  if (delta === 0) return 'Today';
  if (delta === 1) return 'Tomorrow';
  if (delta <= 6) return `In ${delta} days`;
  return formatCalendarDate(day);
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Sun, Jun 28" style label. */
export function formatCalendarDate(day: string): string {
  const ms = parseDayMs(day);
  if (Number.isNaN(ms)) return 'Scheduled';
  const d = new Date(ms);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** Short calendar chip parts for the upcoming column. */
export function calendarChip(day: string): { weekday: string; dayNum: string; month: string } {
  const ms = parseDayMs(day);
  if (Number.isNaN(ms)) return { weekday: '', dayNum: '–', month: '' };
  const d = new Date(ms);
  return {
    weekday: WEEKDAYS[d.getDay()],
    dayNum: String(d.getDate()),
    month: MONTHS[d.getMonth()].toUpperCase(),
  };
}

/* ------------------------------------------------------------------ */
/* Next-review preview                                                  */
/* ------------------------------------------------------------------ */

/**
 * Human preview of when a given grade would schedule the next review, e.g.
 * "in 6 days" / "in ~3 weeks". Telegraphs the SM-2 outcome before committing.
 */
export function nextReviewPreview(rev: Revision, meta: RecallGradeMeta): string {
  const base = Number.isFinite(rev.intervalDays) && rev.intervalDays > 0 ? rev.intervalDays : 1;
  const days = Math.max(1, Math.round(base * meta.intervalFactor));
  if (days === 1) return 'in 1 day';
  if (days < 14) return `in ${days} days`;
  const weeks = Math.round(days / 7);
  return `in ~${weeks} week${weeks === 1 ? '' : 's'}`;
}

/* ------------------------------------------------------------------ */
/* Grouping                                                            */
/* ------------------------------------------------------------------ */

export type UpcomingGroup = {
  dueDate: string;
  label: string;
  items: Revision[];
};

/**
 * Split a revision list into the due-today queue and the upcoming groups, with a
 * couple of headline figures. Pure and shape-tolerant: anything missing a valid
 * due date is treated as scheduled-later rather than crashing the screen.
 */
export function partitionRevisions(revisions: Revision[]): {
  due: Revision[];
  upcoming: UpcomingGroup[];
  totalReviews: number;
  masteredCount: number;
} {
  const list = Array.isArray(revisions) ? revisions : [];

  const due: Revision[] = [];
  const future: Revision[] = [];
  let totalReviews = 0;
  let masteredCount = 0;

  for (const rev of list) {
    if (!rev) continue;
    totalReviews += Number.isFinite(rev.reviewCount) ? rev.reviewCount : 0;
    if (clampConfidence(rev.confidence) >= 5) masteredCount += 1;
    if (isDue(rev)) due.push(rev);
    else future.push(rev);
  }

  // Due soonest-first (most overdue at the top).
  due.sort((a, b) => daysFromToday(a.dueDate) - daysFromToday(b.dueDate));

  // Group the future revisions by calendar day, ascending.
  future.sort((a, b) => daysFromToday(a.dueDate) - daysFromToday(b.dueDate));
  const byDate = new Map<string, Revision[]>();
  for (const r of future) {
    const key = toIso(parseDayMs(r.dueDate));
    const bucket = byDate.get(key) ?? [];
    bucket.push(r);
    byDate.set(key, bucket);
  }
  const upcoming: UpcomingGroup[] = [...byDate.entries()].map(([dueDate, items]) => ({
    dueDate,
    label: relativeDueLabel(dueDate),
    items,
  }));

  return { due, upcoming, totalReviews, masteredCount };
}

/* ------------------------------------------------------------------ */
/* Activity heatmap (derived from the real data)                       */
/* ------------------------------------------------------------------ */

export type HeatCell = { day: string; count: number };

/**
 * Per-day review activity for the last `days`, ending today. Derived from each
 * revision's `lastReviewedAt` so the grid reflects real reviews; days with no
 * recorded review read as empty. Deterministic and crash-safe.
 */
export function buildActivity(revisions: Revision[], days = 119): HeatCell[] {
  const list = Array.isArray(revisions) ? revisions : [];
  const counts = new Map<string, number>();
  for (const rev of list) {
    const ms = parseDayMs(rev?.lastReviewedAt);
    if (Number.isNaN(ms)) continue;
    const key = toIso(ms);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const end = startOfDayMs();
  const out: HeatCell[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = toIso(end - i * DAY_MS);
    out.push({ day: key, count: counts.get(key) ?? 0 });
  }
  return out;
}
