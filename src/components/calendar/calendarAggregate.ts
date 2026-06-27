/**
 * Calendar aggregation — builds `CalendarEvent[]` from the REAL domain lists.
 *
 * There is no `/calendar` endpoint by design. The Calendar screen reads the
 * existing GET hooks (`useTasks`, `useRevisions`, `useStudySessions`,
 * `useReflections`) and folds them into the flat `CalendarEvent` shape the
 * month / week / agenda views already render. Pure + dependency-free so it can
 * be memoised in the screen.
 *
 * Dates are normalised to "YYYY-MM-DD" string keys (the views compare strings to
 * dodge timezone drift). Datetime values ("...T09:00:00Z") contribute both the
 * day key AND an "HH:MM" time; date-only values are all-day.
 */
import type {
  CalendarEvent,
  Task,
  Revision,
  StudySession,
  Reflection,
  IsoDate,
} from '@/types/models';

/** Pull the "YYYY-MM-DD" day part out of a date or datetime string. */
export function toDayKey(iso?: IsoDate | null): string | null {
  if (!iso) return null;
  const day = String(iso).slice(0, 10);
  // Cheap shape guard so a malformed value can't poison the grid.
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

/** Pull a local "HH:MM" out of a datetime string, or undefined for date-only. */
export function toTime(iso?: IsoDate | null): string | undefined {
  if (!iso) return undefined;
  const s = String(iso);
  if (!s.includes('T')) return undefined;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    // Fall back to the literal HH:MM after the T (no tz math).
    const m = s.match(/T(\d{2}):(\d{2})/);
    return m ? `${m[1]}:${m[2]}` : undefined;
  }
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/* ------------------------------------------------------------------ */
/* Per-source mappers                                                  */
/* ------------------------------------------------------------------ */

function taskToEvent(task: Task): CalendarEvent | null {
  const date = toDayKey(task.dueDate);
  if (!date) return null;
  const priority =
    task.priority === 'HIGH'
      ? 'high priority'
      : task.priority === 'LOW'
        ? 'low priority'
        : 'medium priority';
  return {
    id: `task_${task.id}`,
    date,
    time: toTime(task.dueDate),
    type: 'TASK',
    title: task.title,
    subtitle: `${task.category} · ${priority}`,
    icon: task.icon ?? 'check-square',
    accent: 'annotation',
    done: task.done,
  };
}

function revisionToEvent(rev: Revision): CalendarEvent | null {
  const date = toDayKey(rev.dueDate);
  if (!date) return null;
  return {
    id: `rev_${rev.id}`,
    date,
    time: toTime(rev.dueDate),
    type: 'REVISION',
    title: rev.problemTitle,
    subtitle: rev.topicTitle ? `Revise · ${rev.topicTitle}` : 'Spaced repetition',
    icon: 'repeat',
    accent: 'highlighter',
    // A revision is "done" for the day once it's been reviewed today.
    done: !!rev.lastReviewedAt && toDayKey(rev.lastReviewedAt) === date,
  };
}

function sessionToEvent(session: StudySession): CalendarEvent | null {
  const date = toDayKey(session.date);
  if (!date) return null;
  const solved = session.problemsSolved > 0 ? ` · ${session.problemsSolved} solved` : '';
  return {
    id: `session_${session.id}`,
    date,
    time: toTime(session.date),
    type: 'SESSION',
    title: session.topic || 'Study session',
    subtitle: `${session.minutes} min focus${solved}`,
    icon: 'timer',
    accent: 'signal',
    // Logged sessions are records of completed work.
    done: true,
  };
}

function reflectionToEvent(reflection: Reflection): CalendarEvent | null {
  const date = toDayKey(reflection.date);
  if (!date) return null;
  const note = (reflection.note ?? '').trim();
  return {
    id: `reflection_${reflection.id}`,
    date,
    time: toTime(reflection.date),
    type: 'GOAL',
    title: 'Reflection',
    subtitle: note ? note : reflection.win ? reflection.win : 'Daily journal',
    icon: reflection.emoji ?? 'sparkles',
    accent: 'success',
    done: true,
  };
}

/* ------------------------------------------------------------------ */
/* Aggregate                                                           */
/* ------------------------------------------------------------------ */

export type CalendarSources = {
  tasks?: Task[] | null;
  revisions?: Revision[] | null;
  sessions?: StudySession[] | null;
  reflections?: Reflection[] | null;
};

/**
 * Fold every available domain list into one `CalendarEvent[]`. Any source can
 * be missing (still loading / errored) — it simply contributes nothing.
 */
export function aggregateCalendarEvents({
  tasks,
  revisions,
  sessions,
  reflections,
}: CalendarSources): CalendarEvent[] {
  const out: CalendarEvent[] = [];

  if (Array.isArray(tasks)) {
    for (const t of tasks) {
      if (!t) continue;
      const ev = taskToEvent(t);
      if (ev) out.push(ev);
    }
  }
  if (Array.isArray(revisions)) {
    for (const r of revisions) {
      if (!r) continue;
      const ev = revisionToEvent(r);
      if (ev) out.push(ev);
    }
  }
  if (Array.isArray(sessions)) {
    for (const s of sessions) {
      if (!s) continue;
      const ev = sessionToEvent(s);
      if (ev) out.push(ev);
    }
  }
  if (Array.isArray(reflections)) {
    for (const rf of reflections) {
      if (!rf) continue;
      const ev = reflectionToEvent(rf);
      if (ev) out.push(ev);
    }
  }

  return out;
}
