/**
 * Calendar feature helpers — pure, dependency-free date math + theming maps.
 *
 * No external calendar library: the month grid is built from these primitives.
 * Everything is pinned to the app's deterministic TODAY ('2026-06-26') so the
 * mock data renders consistently.
 *
 * Dates are handled as plain "YYYY-MM-DD" strings to dodge timezone drift —
 * we never construct a `Date` from a date-only string for comparisons, we just
 * compare/format the string parts directly.
 */
import { colors } from '@/theme/tokens';
import type { CalendarEvent, CalendarEventType, IconName } from '@/types/models';

export type Accent = CalendarEvent['accent'];

export const TODAY_KEY = '2026-06-26';

/* ------------------------------------------------------------------ */
/* Accent + type theming                                               */
/* ------------------------------------------------------------------ */

export const ACCENT_HEX: Record<Accent, string> = {
  highlighter: colors.highlighter,
  signal: colors.signal,
  peach: colors.peach,
  annotation: colors.annotation,
  success: colors.success,
};

/** Soft tinted wash backgrounds for inset glyph wells (one per accent). */
export const ACCENT_WASH: Record<Accent, string> = {
  highlighter: '#f7f6c9',
  signal: '#e1e8ff',
  peach: '#ffe6dd',
  annotation: '#ffe2e2',
  success: '#dff5e8',
};

/** Ink that stays legible when laid on top of a solid accent fill. */
export function accentInk(accent: Accent): string {
  return accent === 'highlighter' ? colors.carbon : colors.paper;
}

export type EventTypeMeta = {
  label: string;
  icon: IconName;
  accent: Accent;
};

/** Display metadata for each calendar event type (filter chips + legend). */
export const TYPE_META: Record<CalendarEventType, EventTypeMeta> = {
  TASK: { label: 'Task', icon: 'check-square', accent: 'annotation' },
  REVISION: { label: 'Revision', icon: 'repeat', accent: 'highlighter' },
  SESSION: { label: 'Session', icon: 'timer', accent: 'signal' },
  HABIT: { label: 'Habit', icon: 'flame', accent: 'peach' },
  GOAL: { label: 'Goal', icon: 'target', accent: 'success' },
};

export const TYPE_ORDER: CalendarEventType[] = [
  'TASK',
  'REVISION',
  'SESSION',
  'HABIT',
  'GOAL',
];

/* ------------------------------------------------------------------ */
/* Date primitives (string-based)                                      */
/* ------------------------------------------------------------------ */

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WEEKDAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_SHORT = [
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

const WEEKDAY_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function dateKey(year: number, monthIndex0: number, day: number): string {
  return `${year}-${pad2(monthIndex0 + 1)}-${pad2(day)}`;
}

/** Parse "YYYY-MM-DD" into numeric parts (no Date, no tz). */
export function parseKey(key: string): { y: number; m0: number; d: number } {
  const [y, m, d] = key.split('-').map((s) => parseInt(s, 10));
  return { y, m0: (m ?? 1) - 1, d: d ?? 1 };
}

/** Days in a given month (m0 is 0-based). */
export function daysInMonth(year: number, m0: number): number {
  return new Date(year, m0 + 1, 0).getDate();
}

/**
 * Weekday index for the 1st of a month, normalized to a Monday-first grid
 * (0 = Monday … 6 = Sunday).
 */
export function firstWeekdayMonFirst(year: number, m0: number): number {
  const jsDay = new Date(year, m0, 1).getDay(); // 0 = Sun
  return (jsDay + 6) % 7;
}

/** 0 = Mon … 6 = Sun for an arbitrary day key. */
export function weekdayMonFirst(key: string): number {
  const { y, m0, d } = parseKey(key);
  return (new Date(y, m0, d).getDay() + 6) % 7;
}

export function monthLabel(year: number, m0: number): string {
  return `${MONTH_NAMES[m0]} ${year}`;
}

export function monthYearShort(year: number, m0: number): string {
  return `${MONTH_SHORT[m0]} ${year}`;
}

/** "Fri, Jun 26" style label for a day key. */
export function longDayLabel(key: string): string {
  const { y, m0, d } = parseKey(key);
  const wd = new Date(y, m0, d).getDay();
  return `${WEEKDAY_SHORT[wd]}, ${MONTH_SHORT[m0]} ${d}`;
}

/** "Friday" weekday name for a day key. */
export function weekdayName(key: string): string {
  const { y, m0, d } = parseKey(key);
  return WEEKDAY_LONG[new Date(y, m0, d).getDay()];
}

/** Add (or subtract) days from a key, returning a new "YYYY-MM-DD". */
export function addDays(key: string, delta: number): string {
  const { y, m0, d } = parseKey(key);
  const dt = new Date(y, m0, d + delta);
  return dateKey(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

/** Monday key of the week containing `key`. */
export function startOfWeek(key: string): string {
  return addDays(key, -weekdayMonFirst(key));
}

/** The 7 Monday-first day keys of the week containing `key`. */
export function weekKeys(key: string): string[] {
  const mon = startOfWeek(key);
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
}

/** Same month + year as the reference (m0 0-based). */
export function isSameMonth(key: string, year: number, m0: number): boolean {
  const p = parseKey(key);
  return p.y === year && p.m0 === m0;
}

/* ------------------------------------------------------------------ */
/* Month grid construction                                             */
/* ------------------------------------------------------------------ */

export type GridCell = {
  /** "YYYY-MM-DD" for this cell. */
  key: string;
  /** Day-of-month number to render. */
  day: number;
  /** Whether the cell belongs to the focused month (vs. spill-over). */
  inMonth: boolean;
  isToday: boolean;
};

/**
 * Build a 6-row (42-cell) Monday-first grid for the given month, padded with
 * trailing days of the previous month and leading days of the next so every
 * row is full — the classic fixed-height calendar layout.
 */
export function buildMonthGrid(year: number, m0: number): GridCell[] {
  const lead = firstWeekdayMonFirst(year, m0);
  const total = daysInMonth(year, m0);

  const prevM0 = m0 === 0 ? 11 : m0 - 1;
  const prevY = m0 === 0 ? year - 1 : year;
  const prevTotal = daysInMonth(prevY, prevM0);

  const nextM0 = m0 === 11 ? 0 : m0 + 1;
  const nextY = m0 === 11 ? year + 1 : year;

  const cells: GridCell[] = [];

  // Leading spill-over (previous month).
  for (let i = 0; i < lead; i += 1) {
    const day = prevTotal - lead + 1 + i;
    const key = dateKey(prevY, prevM0, day);
    cells.push({ key, day, inMonth: false, isToday: key === TODAY_KEY });
  }

  // Days of the focused month.
  for (let day = 1; day <= total; day += 1) {
    const key = dateKey(year, m0, day);
    cells.push({ key, day, inMonth: true, isToday: key === TODAY_KEY });
  }

  // Trailing spill-over (next month) to fill 42 cells.
  let nextDay = 1;
  while (cells.length < 42) {
    const key = dateKey(nextY, nextM0, nextDay);
    cells.push({ key, day: nextDay, inMonth: false, isToday: key === TODAY_KEY });
    nextDay += 1;
  }

  return cells;
}

/* ------------------------------------------------------------------ */
/* Event indexing + sorting                                            */
/* ------------------------------------------------------------------ */

/** Group events by their day key for O(1) per-cell lookups. */
export function indexByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const list = map.get(ev.date);
    if (list) list.push(ev);
    else map.set(ev.date, [ev]);
  }
  for (const list of map.values()) list.sort(byTime);
  return map;
}

/** All-day events first, then ascending by time. */
export function byTime(a: CalendarEvent, b: CalendarEvent): number {
  if (!a.time && !b.time) return 0;
  if (!a.time) return -1;
  if (!b.time) return 1;
  return a.time.localeCompare(b.time);
}

/** "8:00 AM" style 12-hour label, or "All day" when no time. */
export function timeLabel(time?: string): string {
  if (!time) return 'All day';
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr ?? '00';
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${period}`;
}

/**
 * Section the events into Today / Upcoming / Earlier relative to TODAY,
 * sorted within each section. Used by the Agenda view.
 */
export type AgendaSection = {
  key: 'today' | 'upcoming' | 'earlier';
  title: string;
  /** Day-grouped rows so the agenda can show date sub-headers. */
  days: { key: string; events: CalendarEvent[] }[];
};

export function buildAgenda(events: CalendarEvent[]): AgendaSection[] {
  const today: CalendarEvent[] = [];
  const upcoming: CalendarEvent[] = [];
  const earlier: CalendarEvent[] = [];

  for (const ev of events) {
    if (ev.date === TODAY_KEY) today.push(ev);
    else if (ev.date > TODAY_KEY) upcoming.push(ev);
    else earlier.push(ev);
  }

  const groupByDay = (list: CalendarEvent[], dir: 1 | -1) => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of list) {
      const arr = map.get(ev.date);
      if (arr) arr.push(ev);
      else map.set(ev.date, [ev]);
    }
    const keys = Array.from(map.keys()).sort((a, b) =>
      dir === 1 ? a.localeCompare(b) : b.localeCompare(a),
    );
    return keys.map((key) => ({
      key,
      events: (map.get(key) ?? []).slice().sort(byTime),
    }));
  };

  const sections: AgendaSection[] = [];
  if (today.length) {
    sections.push({
      key: 'today',
      title: 'Today',
      days: [{ key: TODAY_KEY, events: today.slice().sort(byTime) }],
    });
  }
  if (upcoming.length) {
    sections.push({ key: 'upcoming', title: 'Upcoming', days: groupByDay(upcoming, 1) });
  }
  if (earlier.length) {
    sections.push({ key: 'earlier', title: 'Earlier', days: groupByDay(earlier, -1) });
  }
  return sections;
}
