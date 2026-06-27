/**
 * Notes — list screen (Kivo).
 *
 * A searchable, filterable notebook wired to the live `/notes` endpoint via
 * `useNotes()`. Warm-editorial + flat: a serif "Notes" title with a count
 * eyebrow and a terracotta "+" square, a search field, flat quick + folder
 * Chips, and "Pinned" / "All notes" overline sections. Pinned notes sit on the
 * peach wash; the rest rotate the soft washes. ONE terracotta CTA (the + square /
 * New); everything else is a TextLink. Loading / error / empty states render
 * from the query flags so a failed request never crashes the app. Fully
 * theme-aware (light / dark) via useTheme(), with a subtle entrance.
 */
import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { SoftInput } from '@/components/ui/SoftInput';
import { Chip } from '@/components/ui/Chip';
import { Tag } from '@/components/ui/Tag';
import { PillButton, TextLink } from '@/components/ui/PillButton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { AppHeader } from '@/components/ui/AppHeader';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { AddButton, QuickAddRow, EmptyStateCTA } from '@/components/ui/AddButton';

import { radii, motion, interaction, pressOpacity, toneAt } from '@/theme/tokens';
import { useTheme } from '@/theme';
import { TODAY } from '@/data/mock';
import { useNotes } from '@/hooks/api';
import type { Note, NoteFolder } from '@/types/models';
import { FOLDER_ICON, NOTE_FOLDERS, formatUpdated } from '@/components/notes/notesMeta';

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
/* Overline section header                                              */
/* ------------------------------------------------------------------ */

function Overline({ children, style }: { children: string; style?: object }) {
  const { colors } = useTheme();
  return (
    <AppText
      variant="overline"
      uppercase
      weight="bold"
      color={colors.primaryOnWash}
      style={style}
    >
      {children}
    </AppText>
  );
}

/* ------------------------------------------------------------------ */
/* Note row — flat wash card                                           */
/* ------------------------------------------------------------------ */

function NoteCard({
  note,
  onPress,
  toneIndex,
  index,
}: {
  note: Note;
  onPress: () => void;
  toneIndex: number;
  index: number;
}) {
  const { colors, toneStyle } = useTheme();
  // Pinned notes ride the peach wash so they read warm & important; the rest
  // rotate through the soft washes so the list feels colorful but intentional.
  const tone = note.pinned ? 'peach' : toneAt(toneIndex);
  const ts = toneStyle(tone);
  const accent = ts.accent;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: motion.duration.transition, delay: Math.min(index, 8) * 45 }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Open note: ${note.title}`}
        style={({ pressed }) => ({
          opacity: pressOpacity({ pressed }, { solid: true }),
          transform: [{ scale: pressed ? interaction.pressScale : 1 }],
        })}
      >
        <SoftCard tone={tone} radius={radii.card} padding={14} style={{ marginBottom: 10 }}>
          {/* Folder eyebrow + status glyphs */}
          <View className="flex-row items-center justify-between" style={{ marginBottom: 5 }}>
            <View className="flex-row items-center" style={{ gap: 5, flex: 1 }}>
              <Icon name={FOLDER_ICON[note.folder]} size={13} color={accent} />
              <AppText variant="caption" color={accent} numberOfLines={1}>
                {note.folder}
              </AppText>
            </View>
            <View className="flex-row items-center" style={{ gap: 8 }}>
              {note.pinned ? <Icon name="pin" size={13} color={accent} weight="fill" /> : null}
              {note.favorite ? <Icon name="star" size={13} color={accent} weight="fill" /> : null}
            </View>
          </View>

          {/* Title (serif) */}
          <AppText
            variant="headingSm"
            display
            weight="medium"
            color={note.pinned ? accent : colors.ink}
            numberOfLines={2}
          >
            {note.title}
          </AppText>

          {/* Preview */}
          {note.preview ? (
            <AppText
              variant="body"
              color={note.pinned ? accent : colors.muted}
              numberOfLines={2}
              style={{ marginTop: 6, opacity: note.pinned ? 0.85 : 1 }}
            >
              {note.preview}
            </AppText>
          ) : null}

          {/* Tags */}
          {note.tags.length > 0 ? (
            <View className="flex-row flex-wrap" style={{ gap: 6, marginTop: 10 }}>
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
              gap: 12,
              marginTop: 12,
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: ts.border,
            }}
          >
            <AppText variant="caption" color={note.pinned ? accent : colors.muted}>
              {formatUpdated(note.updatedAt, TODAY)}
            </AppText>
            <AppText variant="caption" color={note.pinned ? accent : colors.muted}>
              {note.wordCount} words
            </AppText>
            <View style={{ flex: 1 }} />
            <Icon name="chevron-right" size={15} color={note.pinned ? accent : colors.hairline} />
          </View>
        </SoftCard>
      </Pressable>
    </MotiView>
  );
}

/* ------------------------------------------------------------------ */
/* State blocks                                                        */
/* ------------------------------------------------------------------ */

function CenterNote({
  icon,
  title,
  body,
  tone = 'sky',
  action,
}: {
  icon: IconName;
  title: string;
  body: string;
  tone?: 'sky' | 'peach' | 'mint' | 'default';
  action?: React.ReactNode;
}) {
  const { colors, toneStyle } = useTheme();
  const t = toneStyle(tone);
  return (
    <SoftCard variant="inset" radius={radii.cardLg} padding={28}>
      <View style={{ alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: t.bg,
            borderWidth: 1,
            borderColor: t.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={28} color={t.accent} />
        </View>
        <AppText variant="heading" display weight="medium" color={colors.ink} style={{ textAlign: 'center' }}>
          {title}
        </AppText>
        <AppText variant="body" color={colors.muted} style={{ textAlign: 'center', maxWidth: 280 }}>
          {body}
        </AppText>
        {action ? <View style={{ marginTop: 4 }}>{action}</View> : null}
      </View>
    </SoftCard>
  );
}

function LoadingBlock() {
  const { colors } = useTheme();
  return (
    <View>
      {[0, 1, 2].map((i) => (
        <SoftCard key={i} radius={radii.card} padding={14} style={{ marginBottom: 10 }}>
          <Skeleton width={90} height={12} radius={6} style={{ marginBottom: 10 }} />
          <SkeletonText lines={2} />
          <Skeleton width="40%" height={12} radius={6} style={{ marginTop: 12 }} />
        </SoftCard>
      ))}
      <AppText variant="caption" color={colors.muted} style={{ textAlign: 'center', marginTop: 4 }}>
        Loading your notes…
      </AppText>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();

  const { data, isLoading, isError, error, refetch, isFetching } = useNotes();

  const [query, setQuery] = useState('');
  const [quick, setQuick] = useState<QuickFilter>('all');
  const [folder, setFolder] = useState<NoteFolder | null>(null);

  const notes = useMemo<Note[]>(() => (Array.isArray(data) ? data.filter(Boolean) : []), [data]);

  const activeFolders = useMemo(
    () => NOTE_FOLDERS.filter((f) => notes.some((n) => n.folder === f)),
    [notes],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = notes.filter((n) => {
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
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.updatedAt < b.updatedAt ? 1 : -1;
    });
  }, [notes, query, quick, folder]);

  const pinned = useMemo(() => filtered.filter((n) => n.pinned), [filtered]);
  const rest = useMemo(() => filtered.filter((n) => !n.pinned), [filtered]);

  const visibleTotal = useMemo(() => notes.filter((n) => !n.archived).length, [notes]);

  const resetFilters = () => {
    setQuery('');
    setQuick('all');
    setFolder(null);
  };

  const hasFilters = query.trim() !== '' || quick !== 'all' || folder !== null;

  const goNew = () => router.push('/notes/new');

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={{ paddingHorizontal: 20 }}>
        <AppHeader
          onBack={() => router.back()}
          markSize={20}
          right={<AddButton onPress={goNew} accessibilityLabel="Write a new note" />}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: insets.bottom + 40,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => void refetch()}
            tintColor={colors.muted}
          />
        }
      >
        {/* Header — count eyebrow + serif title + terracotta + square */}
        <View>
          <View className="flex-row items-end justify-between" style={{ marginBottom: 16 }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <AppText variant="caption" weight="medium" color={colors.muted}>
                {isError ? 'Couldn’t load your notebook' : `${visibleTotal} ${visibleTotal === 1 ? 'note' : 'notes'}`}
              </AppText>
              <AppText variant="display" display weight="semibold" color={colors.ink} style={{ marginTop: 2 }}>
                Notes
              </AppText>
            </View>
            <PillButton
              label="New"
              size="sm"
              onPress={goNew}
              icon={<Icon name="plus" size={15} color={colors.onPrimary} />}
            />
          </View>

          {/* Search */}
          <SoftInput
            key="notes-search"
            placeholder="Search notes, tags, code…"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            leading={<Icon name="search" size={16} color={colors.muted} />}
            trailing={
              query.length > 0 ? (
                <Pressable
                  onPress={() => setQuery('')}
                  accessibilityLabel="Clear search"
                  hitSlop={8}
                  style={({ pressed }) => ({ opacity: pressOpacity({ pressed }) })}
                >
                  <Icon name="x-circle" size={16} color={colors.muted} />
                </Pressable>
              ) : undefined
            }
            containerStyle={{ marginBottom: 12 }}
          />

          {/* Quick filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 10 }}
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

          {/* Folder filters */}
          {activeFolders.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 6 }}
            >
              <Chip label="All folders" selected={folder === null} onPress={() => setFolder(null)} />
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
          ) : null}
        </View>

        {/* Results meta */}
        <View className="flex-row items-center justify-between" style={{ marginTop: 14, marginBottom: 12 }}>
          <AppText variant="caption" color={colors.muted}>
            {filtered.length} {filtered.length === 1 ? 'note' : 'notes'}
          </AppText>
          {hasFilters ? <TextLink label="Reset" onPress={resetFilters} size="sm" muted /> : null}
        </View>

        {/* States */}
        {isError ? (
          <CenterNote
            icon="alert"
            title="Something went wrong"
            tone="peach"
            body={error?.message ?? 'We couldn’t reach the server. Pull to refresh or try again.'}
            action={<TextLink label="Try again" onPress={() => void refetch()} icon={<Icon name="repeat" size={14} color={colors.ink} />} />}
          />
        ) : isLoading ? (
          <LoadingBlock />
        ) : filtered.length === 0 ? (
          hasFilters ? (
            <CenterNote
              icon="notebook-pen"
              title="No notes match"
              body="Nothing matches your search or filters. Try clearing them."
              action={<TextLink label="Clear filters" onPress={resetFilters} />}
            />
          ) : (
            <EmptyStateCTA
              icon="notebook-pen"
              title="No notes yet"
              description="Capture an idea, a snippet, or a lesson — it’ll live here, searchable forever."
              actionLabel="Write your first note"
              onAction={goNew}
            />
          )
        ) : (
          <>
            {pinned.length > 0 ? (
              <>
                <Overline style={{ marginBottom: 10 }}>Pinned</Overline>
                {pinned.map((note, i) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onPress={() => router.push(`/notes/${note.id}`)}
                    toneIndex={i}
                    index={i}
                  />
                ))}
              </>
            ) : null}

            {rest.length > 0 ? (
              <>
                <Overline style={{ marginTop: pinned.length > 0 ? 6 : 0, marginBottom: 10 }}>
                  {pinned.length > 0 ? 'All notes' : 'Notes'}
                </Overline>
                {rest.map((note, i) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onPress={() => router.push(`/notes/${note.id}`)}
                    toneIndex={i}
                    index={pinned.length + i}
                  />
                ))}
              </>
            ) : null}

            {/* Inline quick-add at the foot of the list. */}
            <QuickAddRow onPress={goNew} label="Write a new note" style={{ marginTop: 4 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}
