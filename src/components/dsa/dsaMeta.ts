/**
 * Shared mapping helpers for the DSA surfaces — difficulty / status / accent
 * tokens so every DSA screen labels things identically.
 *
 * ZERO EMOJI: every glyph here is an `IconName` from the curated registry,
 * rendered through `<Icon name={...} />`. No pictographs anywhere.
 */
import type { Difficulty, ProblemStatus } from '@/types/models';
import type { TagTone } from '@/components/ui/Tag';
import type { IconName } from '@/components/ui/Icon';
import { colors } from '@/theme/tokens';

/** Roadmap / topic accent token name -> concrete hex. */
export type AccentName =
  | 'highlighter'
  | 'signal'
  | 'peach'
  | 'annotation'
  | 'success';

export const ACCENT_HEX: Record<AccentName, string> = {
  highlighter: colors.highlighter,
  signal: colors.signal,
  peach: colors.peach,
  annotation: colors.annotation,
  success: colors.success,
};

/** Difficulty -> tag tone + display label. */
export const DIFFICULTY_TONE: Record<Difficulty, TagTone> = {
  EASY: 'success',
  MEDIUM: 'signal',
  HARD: 'annotation',
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

/** Difficulty -> icon glyph (rendered with <Icon />). */
export const DIFFICULTY_ICON: Record<Difficulty, IconName> = {
  EASY: 'circle',
  MEDIUM: 'activity',
  HARD: 'flame',
};

/** Problem status -> mastery tag tone, label and a small icon glyph. */
export const STATUS_TONE: Record<ProblemStatus, TagTone> = {
  TODO: 'neutral',
  ATTEMPTED: 'peach',
  SOLVED: 'signal',
  MASTERED: 'success',
};

export const STATUS_LABEL: Record<ProblemStatus, string> = {
  TODO: 'To do',
  ATTEMPTED: 'Attempted',
  SOLVED: 'Solved',
  MASTERED: 'Mastered',
};

/** Problem status -> icon glyph (rendered with <Icon />), never a pictograph. */
export const STATUS_ICON: Record<ProblemStatus, IconName> = {
  TODO: 'circle',
  ATTEMPTED: 'repeat',
  SOLVED: 'check-circle',
  MASTERED: 'crown',
};

/** Problem status -> ink color for the status glyph / accent. */
export const STATUS_COLOR: Record<ProblemStatus, string> = {
  TODO: colors.textSubtle,
  ATTEMPTED: colors.peach,
  SOLVED: colors.signal,
  MASTERED: colors.success,
};

/** Confidence (1..5) -> a short label for revision history rows. */
export const CONFIDENCE_LABEL: Record<number, string> = {
  1: 'Shaky',
  2: 'Low',
  3: 'Okay',
  4: 'Solid',
  5: 'Strong',
};

/** Confidence (1..5) -> tag tone (ramps shaky -> strong). */
export const CONFIDENCE_TONE: Record<number, TagTone> = {
  1: 'annotation',
  2: 'annotation',
  3: 'peach',
  4: 'signal',
  5: 'success',
};

/** Format an ISO "YYYY-MM-DD" into a compact human label like "Jun 20". */
export function formatShortDate(iso?: string): string {
  if (!iso) return '—';
  const ms = Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(ms)) return iso;
  const d = new Date(ms);
  const month = [
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
  ][d.getUTCMonth()];
  return `${month} ${d.getUTCDate()}`;
}

/** Turn minutes into a compact "Xh Ym" / "Ym" label. */
export function formatMinutes(mins: number): string {
  if (mins <= 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/* ------------------------------------------------------------------ */
/* Mastery — derived from a 0–100 score                                */
/* ------------------------------------------------------------------ */

export type MasteryMeta = {
  label: string;
  tone: TagTone;
  icon: IconName;
  color: string;
};

/**
 * Map a 0–100 mastery/progress score onto a labelled band with a tone, icon
 * and accent color — used for the mastery Tag/Chip on topic surfaces.
 */
export function masteryMeta(score: number): MasteryMeta {
  if (score >= 80)
    return { label: 'Mastering', tone: 'success', icon: 'crown', color: colors.success };
  if (score >= 55)
    return { label: 'Confident', tone: 'signal', icon: 'trending-up', color: colors.signal };
  if (score >= 30)
    return { label: 'In progress', tone: 'peach', icon: 'activity', color: colors.peach };
  return { label: 'Just started', tone: 'neutral', icon: 'rocket', color: colors.textMuted };
}
