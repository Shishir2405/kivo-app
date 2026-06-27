/**
 * Shared mapping helpers for the DSA surfaces — difficulty / status / mastery
 * tokens so every DSA screen labels things identically.
 *
 * COLOR: the calm-but-colorful wash layer. Chrome stays Ink/Ash for text, but
 * meaningful glyphs (difficulty / status / mastery) carry a matching wash
 * accent so the DSA surfaces feel lively without going childish. Tag tones use
 * the on-brand Steep tag set; glyph stroke colors map to the wash accents via
 * `accentForTone`. Every glyph is an `IconName` from the curated registry.
 */
import type { Difficulty, ProblemStatus } from '@/types/models';
import type { TagTone } from '@/components/ui/Tag';
import type { IconName } from '@/components/ui/Icon';
import type { AppColors, CardTone } from '@/theme/tokens';

/**
 * The two theme bits the color-mapping helpers need from `useTheme()`:
 * the ACTIVE palette and its tone-accent resolver. Passing these in keeps
 * every DSA glyph color dark-aware (no static light-only palette baked in).
 */
type AccentForTone = (tone?: CardTone) => string;

/* ------------------------------------------------------------------ */
/* Difficulty                                                          */
/* ------------------------------------------------------------------ */

/** Difficulty -> Steep tag tone. Easy=cool (sky) wash, Medium=warm, Hard=rust. */
export const DIFFICULTY_TONE: Record<Difficulty, TagTone> = {
  EASY: 'cool',
  MEDIUM: 'warm',
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

/**
 * Difficulty -> a matching wash accent for the difficulty glyph: Easy reads
 * mint (calm/green), Medium butter (steady/amber), Hard peach (warm/rust).
 * Dark-aware — resolves against the ACTIVE palette via `accentForTone`.
 */
export function difficultyColor(difficulty: Difficulty, accentForTone: AccentForTone): string {
  const tone: Record<Difficulty, CardTone> = {
    EASY: 'mint',
    MEDIUM: 'butter',
    HARD: 'peach',
  };
  return accentForTone(tone[difficulty]);
}

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
 * Problem status -> stroke color for the status glyph. The journey warms up as
 * you progress: To-do stays quiet hairline, Attempted picks up the butter
 * accent, Solved lands on mint (done/green), Mastered crowns it with the
 * peach/rust accent. Dark-aware — resolved against the ACTIVE palette.
 */
export function statusColor(
  status: ProblemStatus,
  colors: AppColors,
  accentForTone: AccentForTone,
): string {
  switch (status) {
    case 'TODO':
      return colors.muted;
    case 'ATTEMPTED':
      return accentForTone('butter');
    case 'SOLVED':
      return accentForTone('mint');
    case 'MASTERED':
      return accentForTone('peach');
  }
}

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
 * and stroke color — used for the mastery Tag on topic surfaces. The glyph
 * stroke climbs the wash accents as mastery grows: just-started Graphite ->
 * in-progress sky -> confident butter -> mastering peach/rust crown.
 */
export function masteryMeta(
  score: number,
  accentForTone: AccentForTone,
  colors: AppColors,
): MasteryMeta {
  if (score >= 80)
    return { label: 'Mastering', tone: 'ink', icon: 'crown', color: accentForTone('peach') };
  if (score >= 55)
    return { label: 'Confident', tone: 'cool', icon: 'trending-up', color: accentForTone('butter') };
  if (score >= 30)
    return { label: 'In progress', tone: 'warm', icon: 'activity', color: accentForTone('sky') };
  return { label: 'Just started', tone: 'neutral', icon: 'rocket', color: colors.muted };
}

/**
 * Progress-bar fill color from a 0–100 score: terracotta once you're past the
 * halfway mark (the key-data accent), else ink. Dark-aware via the ACTIVE
 * palette. Used sparingly.
 */
export function progressColor(score: number, colors: AppColors): string {
  return score >= 50 ? colors.primary : colors.ink;
}
