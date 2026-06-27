/**
 * Shared mapping helpers for the DSA surfaces — difficulty / status / mastery
 * tokens so every DSA screen labels things identically.
 *
 * STEEP: chrome is monochrome (ink / graphite / dove); Rust + the two washes
 * (apricot / sky) are the only chromatic voices. Tags use the Steep `TagTone`
 * set. Every glyph is an `IconName` from the curated registry — ZERO emoji.
 */
import type { Difficulty, ProblemStatus } from '@/types/models';
import type { TagTone } from '@/components/ui/Tag';
import type { IconName } from '@/components/ui/Icon';
import { colors } from '@/theme/tokens';

/* ------------------------------------------------------------------ */
/* Difficulty                                                          */
/* ------------------------------------------------------------------ */

/** Difficulty -> Steep tag tone. Easy=cool wash, Medium=neutral, Hard=rust. */
export const DIFFICULTY_TONE: Record<Difficulty, TagTone> = {
  EASY: 'cool',
  MEDIUM: 'neutral',
  HARD: 'rust',
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

/** Difficulty -> a small thin glyph (rendered with <Icon />). */
export const DIFFICULTY_ICON: Record<Difficulty, IconName> = {
  EASY: 'circle',
  MEDIUM: 'activity',
  HARD: 'flame',
};

/* ------------------------------------------------------------------ */
/* Problem status                                                      */
/* ------------------------------------------------------------------ */

/** Problem status -> Steep tag tone. */
export const STATUS_TONE: Record<ProblemStatus, TagTone> = {
  TODO: 'neutral',
  ATTEMPTED: 'warm',
  SOLVED: 'cool',
  MASTERED: 'ink',
};

export const STATUS_LABEL: Record<ProblemStatus, string> = {
  TODO: 'To do',
  ATTEMPTED: 'Attempted',
  SOLVED: 'Solved',
  MASTERED: 'Mastered',
};

/** Problem status -> a small thin glyph, never a pictograph. */
export const STATUS_ICON: Record<ProblemStatus, IconName> = {
  TODO: 'circle',
  ATTEMPTED: 'repeat',
  SOLVED: 'check-circle',
  MASTERED: 'crown',
};

/**
 * Problem status -> a monochrome/Rust stroke color for the status glyph.
 * Chrome stays graphite/ink; solved+mastered earn the Rust accent.
 */
export const STATUS_COLOR: Record<ProblemStatus, string> = {
  TODO: colors.dove,
  ATTEMPTED: colors.graphite,
  SOLVED: colors.rust,
  MASTERED: colors.ink,
};

/* ------------------------------------------------------------------ */
/* Confidence (spaced-repetition revision history)                     */
/* ------------------------------------------------------------------ */

/** Confidence (1..5) -> a short label for revision history rows. */
export const CONFIDENCE_LABEL: Record<number, string> = {
  1: 'Shaky',
  2: 'Low',
  3: 'Okay',
  4: 'Solid',
  5: 'Strong',
};

/** Confidence (1..5) -> Steep tag tone (shaky=rust -> strong=ink). */
export const CONFIDENCE_TONE: Record<number, TagTone> = {
  1: 'rust',
  2: 'warm',
  3: 'neutral',
  4: 'cool',
  5: 'ink',
};

/* ------------------------------------------------------------------ */
/* Date / minute formatting                                            */
/* ------------------------------------------------------------------ */

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
  /** Stroke color for the mastery glyph — monochrome, Rust for the top band. */
  color: string;
};

/**
 * Map a 0–100 mastery/progress score onto a labelled band with a tone, icon
 * and stroke color — used for the mastery Tag on topic surfaces.
 */
export function masteryMeta(score: number): MasteryMeta {
  if (score >= 80)
    return { label: 'Mastering', tone: 'ink', icon: 'crown', color: colors.ink };
  if (score >= 55)
    return { label: 'Confident', tone: 'cool', icon: 'trending-up', color: colors.rust };
  if (score >= 30)
    return { label: 'In progress', tone: 'warm', icon: 'activity', color: colors.graphite };
  return { label: 'Just started', tone: 'neutral', icon: 'rocket', color: colors.graphite };
}

/**
 * Progress-bar fill color from a 0–100 score: Rust once you're past the
 * halfway mark (the key-data accent), else Ink. Rust used sparingly.
 */
export function progressColor(score: number): string {
  return score >= 50 ? colors.rust : colors.ink;
}
