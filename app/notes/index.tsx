/**
 * Notes — list screen (STEEP).
 *
 * A searchable, filterable notebook wired to the live `/notes` endpoint via
 * `useNotes()`. Editorial + flat: serif screen title, Inter body, small thin
 * icons, compact white Cards with a Dove hairline + one subtle shadow. Filters
 * are flat Chips (folders + favorites / pinned / archived). ONE Ink pill CTA
 * (New note); everything else is a TextLink. Loading / error / empty states are
 * rendered from the query flags so a failed request never crashes the app.
 */
import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { SoftInput } from '@/components/ui/SoftInput';
import { Chip } from '@/components/ui/Chip';
import { Tag } from '@/components/ui/Tag';
import { PillButton, TextLink } from '@/components/ui/PillButton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { AppHeader } from '@/components/ui/AppHeader';

import { colors, radii } from '@/theme/tokens';
import { TODAY } from '@/data/mock';
import { useNotes } from '@/hooks/api';
import type { Note, NoteFolder } from '@/types/models';
import {
  ACCENT_TONE,
  FOLDER_ICON,
  NOTE_FOLDERS,
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
/* Note row — flat white card                                          */
/* ------------------------------------------------------------------ */

function NoteCard({ note, onPress }: { note: Note; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open note: ${note.title}`}>
      <SoftCard radius={radii.card} padding={14} style={{ marginBottom: 10 }}>
        {/* Folder eyebrow + status glyphs */}
        <View className="flex-row items-center justify-between" style={{ marginBottom: 4 }}>
          <View className="flex-row items-center" style={{ gap: 5 }}>
            <Icon name={FOLDER_ICON[note.folder]} size={13} color="graphite" />
            <AppText variant="caption" color={colors.graphite} numberOfLines={1}>
              {note.folder}
            </AppText>
          </View>
          <View className="flex-row items-center" style={{ gap: 8 }}>
            {note.pinned ? <Icon name="pin" size={13} color="rust" /> : null}
            {note.favorite ? <Icon name="star" size={13} color="rust" /> : null}
          </View>
        </View>

        {/* Title (serif) */}
        <AppText variant="headingSm" display weight="medium" numberOfLines={2}>
          {note.title}
        </AppText>

        {/* Preview */}
        {note.preview ? (
          <AppText variant="body" color={colors.ash} numberOfLines={2} style={{ marginTop: 6 }}>
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
            borderTopColor: colors.fog,
          }}
        >
          <AppText variant="caption" color={colors.graphite}>
            {formatUpdated(note.updatedAt, TODAY)}
          </AppText>
          <AppText variant="caption" color={colors.graphite}>
            {note.wordCount} words
          </AppText>
          <View style={{ flex: 1 }} />
          <Icon name="chevron-right" size={15} color="dove" />
        </View>
      </SoftCard>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* State blocks                                                        */
/* ------------------------------------------------------------------ */

function CenterNote({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <SoftCard variant="inset" radius={radii.cardLg} padding={24}>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Icon name={icon} size={22} color="graphite" />
        <AppText variant="subheading" weight="medium" style={{ textAlign: 'center' }}>
          {title}
        </AppText>
        <AppText variant="body" color={colors.ash} style={{ textAlign: 'center', maxWidth: 280 }}>
          {body}
        </AppText>
        {action ? <View style={{ marginTop: 4 }}>{action}</View> : null}
      </View>
    </SoftCard>
  );
}

function LoadingBlock() {
  return (
    <SoftCard variant="inset" radius={radii.cardLg} padding={28}>
      <View style={{ alignItems: 'center', gap: 12 }}>
        <ActivityIndicator color={colors.ink} />
        <AppText variant="caption" color={colors.graphite}>
          Loading your notes…
        </AppText>
      </View>
    </SoftCard>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

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

  const visibleTotal = useMemo(() => notes.filter((n) => !n.archived).length, [notes]);
  const pinnedTotal = useMemo(() => notes.filter((n) => n.pinned && !n.archived).length, [notes]);

  const resetFilters = () => {
    setQuery('');
    setQuick('all');
    setFolder(null);
  };

  const hasFilters = query.trim() !== '' || quick !== 'all' || folder !== null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={{ paddingHorizontal: 20 }}>
        <AppHeader onBack={() => router.back()} markSize={20} />
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
            tintColor={colors.graphite}
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-end justify-between" style={{ marginBottom: 16 }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <AppText variant="display" display weight="semibold">
              Notes
            </AppText>
            <AppText variant="body" color={colors.ash} style={{ marginTop: 4 }}>
              {isError
                ? 'Couldn’t load your notebook'
                : `${visibleTotal} notes · ${pinnedTotal} pinned`}
            </AppText>
          </View>
          <PillButton
            label="New"
            size="sm"
            onPress={() => router.push('/notes/new')}
            icon={<Icon name="plus" size={15} color="white" />}
          />
        </View>

        {/* Search */}
        <SoftInput
          placeholder="Search notes, tags, folders…"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          leading={<Icon name="search" size={16} color="graphite" />}
          trailing={
            query.length > 0 ? (
              <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search" hitSlop={8}>
                <Icon name="x-circle" size={16} color="graphite" />
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

        {/* Results meta */}
        <View className="flex-row items-center justify-between" style={{ marginTop: 14, marginBottom: 12 }}>
          <AppText variant="caption" color={colors.graphite}>
            {filtered.length} {filtered.length === 1 ? 'note' : 'notes'}
          </AppText>
          {hasFilters ? <TextLink label="Reset" onPress={resetFilters} size="sm" muted /> : null}
        </View>

        {/* States */}
        {isError ? (
          <CenterNote
            icon="alert"
            title="Something went wrong"
            body={error?.message ?? 'We couldn’t reach the server. Pull to refresh or try again.'}
            action={<TextLink label="Try again" onPress={() => void refetch()} icon={<Icon name="repeat" size={14} color="ink" />} />}
          />
        ) : isLoading ? (
          <LoadingBlock />
        ) : filtered.length === 0 ? (
          <CenterNote
            icon="notebook-pen"
            title={hasFilters ? 'No notes match' : 'No notes yet'}
            body={
              hasFilters
                ? 'Nothing matches your search or filters. Try clearing them.'
                : 'Capture your first idea — templates, cheat sheets, write-ups.'
            }
            action={
              hasFilters ? (
                <TextLink label="Clear filters" onPress={resetFilters} />
              ) : (
                <TextLink
                  label="New note"
                  onPress={() => router.push('/notes/new')}
                  icon={<Icon name="plus" size={14} color="ink" />}
                />
              )
            }
          />
        ) : (
          filtered.map((note) => (
            <NoteCard key={note.id} note={note} onPress={() => router.push(`/notes/${note.id}`)} />
          ))
        )}
      </ScrollView>
    </View>
  );
}
