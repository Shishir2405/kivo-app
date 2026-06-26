/**
 * Notes — list screen.
 *
 * A searchable, filterable notebook of rich markdown notes rendered as raised
 * neumorphic cards on the graphite-mist canvas. Filters are custom neumorphic
 * Chips (folders + favorites / pinned / archived), never radios. A yellow FAB
 * adds a new note. Pinned notes float to the top. Entirely Aaply kit, ZERO
 * emoji, vector Icons only.
 */
import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { SoftIconButton } from '@/components/ui/SoftIconButton';
import { SoftInput } from '@/components/ui/SoftInput';
import { Chip } from '@/components/ui/Chip';
import { Tag } from '@/components/ui/Tag';
import { Icon, type IconName } from '@/components/ui/Icon';
import { GrayMark } from '@/components/ui/AppHeader';

import { colors, radii } from '@/theme/tokens';
import { mockNotes, TODAY } from '@/data/mock';
import type { Note, NoteFolder } from '@/types/models';
import {
  ACCENT_HEX,
  ACCENT_WASH,
  FOLDER_ICON,
  NOTE_FOLDERS,
  accentInk,
  formatUpdated,
} from '@/components/notes/notesMeta';

/* ------------------------------------------------------------------ */
/* Filter model                                                        */
/* ------------------------------------------------------------------ */

type QuickFilter = 'all' | 'favorites' | 'pinned' | 'archived';

const QUICK_FILTERS: { key: QuickFilter; label: string; icon: IconName }[] = [
  { key: 'all', label: 'All', icon: 'layers' },
  { key: 'favorites', label: 'Favorites', icon: 'star' },
  { key: 'pinned', label: 'Pinned', icon: 'pin' },
  { key: 'archived', label: 'Archived', icon: 'folder' },
];

/* ------------------------------------------------------------------ */
/* Note card                                                           */
/* ------------------------------------------------------------------ */

function NoteCard({
  note,
  index,
  onPress,
}: {
  note: Note;
  index: number;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const accentHex = ACCENT_HEX[note.accent] as string;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 320, delay: 40 + index * 50 }}
      style={{ marginBottom: 14 }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        accessibilityRole="button"
        accessibilityLabel={`Open note: ${note.title}`}
      >
        <SoftCard variant={pressed ? 'inset' : 'raised'} radius={radii.card} padding={18}>
          {/* Accent rail + header */}
          <View className="flex-row items-start" style={{ gap: 14 }}>
            <Neumorph
              variant="inset"
              radius={14}
              intensity="sm"
              padding={11}
              surface={ACCENT_WASH[note.accent]}
            >
              <Icon name={note.icon} size={22} color={note.accent} strokeWidth={2.2} />
            </Neumorph>

            <View style={{ flex: 1 }}>
              <View className="flex-row items-center" style={{ gap: 6, marginBottom: 3 }}>
                <Icon name={FOLDER_ICON[note.folder]} size={12} color="textSubtle" strokeWidth={2.2} />
                <AppText
                  variant="caption"
                  weight="semibold"
                  color={colors.textSubtle}
                  style={{ fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' }}
                  numberOfLines={1}
                >
                  {note.folder}
                </AppText>
              </View>
              <AppText variant="subheading" weight="bold" display numberOfLines={2}>
                {note.title}
              </AppText>
            </View>

            {/* Status glyphs */}
            <View style={{ alignItems: 'flex-end', gap: 8 }}>
              {note.pinned ? (
                <Icon name="pin" size={16} color={note.accent} fill={accentHex} strokeWidth={1.5} />
              ) : null}
              {note.favorite ? (
                <Icon
                  name="star"
                  size={16}
                  color="highlighter"
                  fill={colors.highlighter}
                  strokeWidth={1.5}
                />
              ) : null}
            </View>
          </View>

          {/* Snippet */}
          <AppText
            variant="body"
            color={colors.textMuted}
            numberOfLines={2}
            style={{ marginTop: 12, fontSize: 14, lineHeight: 21 }}
          >
            {note.preview}
          </AppText>

          {/* Tags */}
          {note.tags.length > 0 ? (
            <View className="flex-row flex-wrap" style={{ gap: 7, marginTop: 12 }}>
              {note.tags.slice(0, 3).map((t) => (
                <Tag key={t} label={t} tone="neutral" size="sm" />
              ))}
              {note.tags.length > 3 ? (
                <Tag label={`+${note.tags.length - 3}`} tone="neutral" size="sm" />
              ) : null}
            </View>
          ) : null}

          {/* Meta footer */}
          <View
            className="flex-row items-center"
            style={{
              gap: 14,
              marginTop: 14,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: colors.hairline,
            }}
          >
            <View className="flex-row items-center" style={{ gap: 5 }}>
              <Icon name="clock" size={13} color="textSubtle" strokeWidth={2} />
              <AppText variant="caption" color={colors.textSubtle} style={{ fontSize: 12 }}>
                {formatUpdated(note.updatedAt, TODAY)}
              </AppText>
            </View>
            <View className="flex-row items-center" style={{ gap: 5 }}>
              <Icon name="file-text" size={13} color="textSubtle" strokeWidth={2} />
              <AppText variant="caption" color={colors.textSubtle} style={{ fontSize: 12 }}>
                {note.wordCount} words
              </AppText>
            </View>
            <View style={{ flex: 1 }} />
            <Icon name="chevron-right" size={16} color="textSubtle" strokeWidth={2.2} />
          </View>
        </SoftCard>
      </Pressable>
    </MotiView>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 360 }}
      style={{ marginTop: 28 }}
    >
      <SoftCard variant="inset" radius={radii.cardLg} padding={32}>
        <View className="items-center">
          <Neumorph variant="raised" radius={28} intensity="md" padding={20} surface={colors.canvas}>
            <Icon name="notebook-pen" size={34} color="textSubtle" strokeWidth={1.8} />
          </Neumorph>
          <AppText variant="subheading" weight="bold" display style={{ marginTop: 18 }}>
            No notes here yet
          </AppText>
          <AppText
            variant="body"
            color={colors.textMuted}
            style={{ marginTop: 6, textAlign: 'center', fontSize: 14, lineHeight: 21 }}
          >
            Nothing matches your search or filters. Try clearing them, or capture a fresh idea.
          </AppText>
          <Pressable onPress={onReset} style={{ marginTop: 18 }} accessibilityRole="button">
            <Neumorph variant="raised" radius={radii.pill} intensity="sm" surface={colors.canvas}>
              <View
                className="flex-row items-center"
                style={{ gap: 8, paddingVertical: 11, paddingHorizontal: 20 }}
              >
                <Icon name="refresh" size={16} color="carbon" strokeWidth={2.2} />
                <AppText variant="body" weight="semibold" style={{ fontSize: 14 }}>
                  Clear filters
                </AppText>
              </View>
            </Neumorph>
          </Pressable>
        </View>
      </SoftCard>
    </MotiView>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [quick, setQuick] = useState<QuickFilter>('all');
  const [folder, setFolder] = useState<NoteFolder | null>(null);

  // Folders that actually have notes, for the chip row.
  const activeFolders = useMemo(
    () => NOTE_FOLDERS.filter((f) => mockNotes.some((n) => n.folder === f)),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = mockNotes.filter((n) => {
      // Archived is an explicit view — otherwise hide archived notes.
      if (quick === 'archived') {
        if (!n.archived) return false;
      } else {
        if (n.archived) return false;
        if (quick === 'favorites' && !n.favorite) return false;
        if (quick === 'pinned' && !n.pinned) return false;
      }
      if (folder && n.folder !== folder) return false;
      if (q) {
        const hay = `${n.title} ${n.preview} ${n.tags.join(' ')} ${n.folder}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // Pinned first, then most-recently updated.
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.updatedAt < b.updatedAt ? 1 : -1;
    });
  }, [query, quick, folder]);

  const visibleTotal = useMemo(
    () => mockNotes.filter((n) => !n.archived).length,
    [],
  );

  const resetFilters = () => {
    setQuery('');
    setQuick('all');
    setFolder(null);
  };

  const hasFilters = query.trim() !== '' || quick !== 'all' || folder !== null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 120,
        }}
      >
        {/* ---------- Top bar ---------- */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <SoftIconButton size={44} accessibilityLabel="Go back" onPress={() => router.back()}>
              <Icon name="chevron-left" size={22} color="carbon" />
            </SoftIconButton>
            <GrayMark size={22} />
          </View>
          <SoftIconButton
            size={44}
            accessibilityLabel="New note"
            activeColor={colors.highlighter}
            onPress={() => router.push('/notes/new')}
          >
            <Icon name="plus" size={22} color="carbon" strokeWidth={2.4} />
          </SoftIconButton>
        </View>

        {/* ---------- Header ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 360 }}
          style={{ marginTop: 18, marginBottom: 18 }}
        >
          <View className="flex-row items-center" style={{ gap: 7 }}>
            <Icon name="notebook-pen" size={14} color="highlighter" strokeWidth={2.4} />
            <AppText
              variant="caption"
              weight="semibold"
              color={colors.textSubtle}
              style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 11 }}
            >
              Notebook
            </AppText>
          </View>
          <AppText variant="heading" display weight="bold" style={{ marginTop: 6 }}>
            Your notes
          </AppText>
          <AppText variant="body" color={colors.textMuted} style={{ marginTop: 6, fontSize: 14 }}>
            {visibleTotal} notes · {mockNotes.filter((n) => n.pinned && !n.archived).length} pinned
          </AppText>
        </MotiView>

        {/* ---------- Search ---------- */}
        <SoftInput
          placeholder="Search notes, tags, folders…"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          leading={<Icon name="search" size={18} color="textMuted" />}
          trailing={
            query.length > 0 ? (
              <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search" hitSlop={8}>
                <Icon name="x-circle" size={18} color="textSubtle" />
              </Pressable>
            ) : undefined
          }
        />

        {/* ---------- Quick filters ---------- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingVertical: 16 }}
        >
          {QUICK_FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              icon={f.icon}
              selected={quick === f.key}
              onPress={() => setQuick(f.key)}
            />
          ))}
        </ScrollView>

        {/* ---------- Folder filters ---------- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingBottom: 6 }}
        >
          <Chip
            label="All folders"
            icon="folder"
            selected={folder === null}
            onPress={() => setFolder(null)}
          />
          {activeFolders.map((f) => (
            <Chip
              key={f}
              label={f}
              icon={FOLDER_ICON[f]}
              selected={folder === f}
              onPress={() => setFolder((cur) => (cur === f ? null : f))}
            />
          ))}
        </ScrollView>

        {/* ---------- Results meta ---------- */}
        <View
          className="flex-row items-center justify-between"
          style={{ marginTop: 16, marginBottom: 14 }}
        >
          <AppText variant="caption" weight="semibold" color={colors.textMuted} style={{ fontSize: 13 }}>
            {filtered.length} {filtered.length === 1 ? 'note' : 'notes'}
          </AppText>
          {hasFilters ? (
            <Pressable onPress={resetFilters} accessibilityRole="button" hitSlop={6}>
              <View className="flex-row items-center" style={{ gap: 5 }}>
                <Icon name="x" size={13} color="textMuted" strokeWidth={2.4} />
                <AppText variant="caption" weight="semibold" color={colors.textMuted} style={{ fontSize: 13 }}>
                  Reset
                </AppText>
              </View>
            </Pressable>
          ) : null}
        </View>

        {/* ---------- List / empty ---------- */}
        {filtered.length === 0 ? (
          <EmptyState onReset={resetFilters} />
        ) : (
          filtered.map((note, idx) => (
            <NoteCard
              key={note.id}
              note={note}
              index={idx}
              onPress={() => router.push(`/notes/${note.id}`)}
            />
          ))
        )}
      </ScrollView>

      {/* ---------- FAB ---------- */}
      <MotiView
        from={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 250 }}
        style={{ position: 'absolute', right: 20, bottom: insets.bottom + 24 }}
      >
        <Pressable
          onPress={() => router.push('/notes/new')}
          accessibilityRole="button"
          accessibilityLabel="Add a new note"
        >
          {({ pressed }) => (
            <Neumorph variant={pressed ? 'inset' : 'raised'} radius={32} intensity="lg" surface={colors.highlighter}>
              <View
                className="flex-row items-center"
                style={{ height: 60, paddingHorizontal: 22, gap: 9 }}
              >
                <Icon name="plus" size={24} color="carbon" strokeWidth={2.6} />
                <AppText variant="body" weight="bold" color={accentInk('highlighter')} style={{ fontSize: 15 }}>
                  New note
                </AppText>
              </View>
            </Neumorph>
          )}
        </Pressable>
      </MotiView>
    </View>
  );
}
