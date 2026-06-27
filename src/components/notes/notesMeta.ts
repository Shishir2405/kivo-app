/**
 * Shared metadata + helpers for the Notes feature screens (STEEP).
 *
 * Keeps folder glyphs, accent → Steep-tone resolution and the lightweight date
 * formatting in one place so the list and the editor stay consistent. Color is
 * punctuation: the legacy per-note `accent` union is collapsed onto the Steep
 * voices — the two washes (apricot / sky) and Rust — never bright/saturated.
 * Pure / deterministic — no Date.now at module scope (callers pass the day in).
 */
import { colors } from '@/theme/tokens';
import type { TagTone } from '@/components/ui/Tag';
import type { IconName, Note, NoteFolder } from '@/types/models';

export type Accent = Note['accent'];

/**
 * Resolve a legacy accent token to a Steep Tag tone. Chrome stays monochrome;
 * the only chromatic chips are the two washes + Rust.
 */
export const ACCENT_TONE: Record<Accent, TagTone> = {
  highlighter: 'ink',
  signal: 'cool',
  peach: 'warm',
  annotation: 'rust',
  success: 'neutral',
};

/** A soft Steep wash background for an accent (apricot / sky / fog). */
export const ACCENT_WASH: Record<Accent, string> = {
  highlighter: colors.fog,
  signal: colors.sky,
  peach: colors.apricot,
  annotation: colors.apricot,
  success: colors.fog,
};

/** All folders, in display order. */
export const NOTE_FOLDERS: NoteFolder[] = [
  'DSA',
  'System Design',
  'Behavioral',
  'Projects',
  'Snippets',
  'General',
];

/** A representative glyph per folder. */
export const FOLDER_ICON: Record<NoteFolder, IconName> = {
  DSA: 'code',
  'System Design': 'layers',
  Behavioral: 'mail',
  Projects: 'rocket',
  Snippets: 'code-xml',
  General: 'folder',
};

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

/** "2026-06-24" -> "Jun 24". */
export function formatShortDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}`;
}

/**
 * Relative-ish "updated" label given a pinned today. Deterministic — no
 * Date.now. Falls back to "Jun 24" for older dates.
 */
export function formatUpdated(iso: string, today: string): string {
  const a = Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${today.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return formatShortDate(iso);
  const days = Math.round((b - a) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return formatShortDate(iso);
}
