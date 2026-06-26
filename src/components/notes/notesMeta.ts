/**
 * Shared metadata + helpers for the Notes feature screens.
 *
 * Keeps folder glyphs, accent color resolution and the lightweight date
 * formatting in one place so the list and the editor stay consistent. Pure /
 * deterministic — no Date.now at module scope (callers pass the day in).
 */
import type { ColorValue } from 'react-native';
import { colors } from '@/theme/tokens';
import type { IconName, Note, NoteFolder } from '@/types/models';

export type Accent = Note['accent'];

/** Solid accent hex (for filled chips / glyphs). */
export const ACCENT_HEX: Record<Accent, ColorValue> = {
  highlighter: colors.highlighter,
  signal: colors.signal,
  peach: colors.peach,
  annotation: colors.annotation,
  success: colors.success,
};

/** Ink that reads on top of each accent fill. */
export function accentInk(accent: Accent): string {
  return accent === 'highlighter' ? colors.carbon : colors.paper;
}

/** A soft tint background for an accent (matches the Tag tone wash language). */
export const ACCENT_WASH: Record<Accent, string> = {
  highlighter: '#f7f7c2',
  signal: '#e1e8ff',
  peach: '#ffe6dd',
  annotation: '#ffe2e2',
  success: '#dff5e8',
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
