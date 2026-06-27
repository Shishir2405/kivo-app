/**
 * Shared helpers for the Reflections feature screens.
 *
 * Centralises mood metadata (label, icon, accent tone), date formatting and the
 * lookup that pairs a lightweight `Reflection` (the list source) with its rich
 * `JournalEntry` (the form source) by calendar day. Keeps both screens DRY and
 * the icon/tone language consistent.
 */
import type { Mood, Reflection, JournalEntry, Rating } from '@/types/models';
import type { IconName } from '@/components/ui/Icon';
import type { TagTone } from '@/components/ui/Tag';
import { mockReflections, mockJournal } from '@/data/mock';

export type MoodMeta = {
  mood: Mood;
  label: string;
  icon: IconName;
  /** Steep Tag tone used for the mood chip / pill (monochrome + washes only). */
  tone: TagTone;
};

/** Ordered, best → toughest. Drives both the chips and the summary legend. */
export const MOODS: MoodMeta[] = [
  { mood: 'GREAT', label: 'Great', icon: 'flame', tone: 'warm' },
  { mood: 'GOOD', label: 'Good', icon: 'smile', tone: 'cool' },
  { mood: 'OKAY', label: 'Okay', icon: 'sun', tone: 'neutral' },
  { mood: 'TIRED', label: 'Tired', icon: 'moon', tone: 'neutral' },
  { mood: 'STRESSED', label: 'Stressed', icon: 'activity', tone: 'rust' },
];

const MOOD_BY_KEY: Record<Mood, MoodMeta> = MOODS.reduce(
  (acc, m) => ((acc[m.mood] = m), acc),
  {} as Record<Mood, MoodMeta>,
);

export function moodMeta(mood: Mood): MoodMeta {
  return MOOD_BY_KEY[mood];
}

/** Numeric weight (1 toughest … 5 best) for averaging the week's mood. */
export function moodScore(mood: Mood): number {
  switch (mood) {
    case 'GREAT':
      return 5;
    case 'GOOD':
      return 4;
    case 'OKAY':
      return 3;
    case 'TIRED':
      return 2;
    default:
      return 1;
  }
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function parts(dayKey: string): { y: number; m: number; d: number; dow: number } {
  const [y, m, d] = dayKey.split('-').map(Number);
  // Build a UTC date purely from parts so there's no timezone drift.
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { y, m, d, dow };
}

/** "Jun 26" */
export function shortDate(dayKey: string): string {
  const { m, d } = parts(dayKey);
  return `${MONTHS[m - 1]} ${d}`;
}

/** "Friday, Jun 26" */
export function longDate(dayKey: string): string {
  const { m, d, dow } = parts(dayKey);
  return `${WEEKDAYS[dow]}, ${MONTHS[m - 1]} ${d}`;
}

/** "Fri" */
export function weekdayShort(dayKey: string): string {
  return WEEKDAYS[parts(dayKey).dow].slice(0, 3);
}

/** Day-of-month number, e.g. 26. */
export function dayOfMonth(dayKey: string): number {
  return parts(dayKey).d;
}

/** Relative-day label for a key against TODAY. */
export function relativeDay(dayKey: string, today: string): string {
  if (dayKey === today) return 'Today';
  const a = Date.parse(`${dayKey}T00:00:00Z`);
  const b = Date.parse(`${today}T00:00:00Z`);
  const diff = Math.round((b - a) / 86_400_000);
  if (diff === 1) return 'Yesterday';
  if (diff > 1 && diff < 7) return `${diff} days ago`;
  return shortDate(dayKey);
}

/** The rich journal entry for a day, if one exists (form seed source). */
export function journalForDay(dayKey: string): JournalEntry | undefined {
  return mockJournal.find((j) => j.dayKey === dayKey);
}

/** The lightweight reflection for a day, if one exists. */
export function reflectionForDay(dayKey: string): Reflection | undefined {
  return mockReflections.find((r) => r.date === dayKey);
}

/** A blank rating default used when seeding a new/empty form. */
export const DEFAULT_RATING: Rating = 3;
