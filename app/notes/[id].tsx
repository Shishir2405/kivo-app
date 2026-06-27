/**
 * Notes — editor screen (STEEP).
 *
 * Edits an existing note (fetched by id via `useNote`) or composes a new one
 * (`/notes/new`). Flat & editorial: a serif title input, a Write / Preview
 * SegmentedTabs over a markdown body (rendered with the in-app MarkdownView),
 * an editable tag row, favorite + pin SoftToggles, a folder Select and a single
 * Ink pill CTA (Cancel is a TextLink). Loading / error / not-found states are
 * rendered from the query flags so a failed fetch never crashes the app.
 *
 * Saving persists to the backend: a new note CREATEs (`useCreateNote`) and an
 * existing one UPDATEs (`useUpdateNote`) — both invalidate the list / single-note
 * queries. Existing notes can also be deleted (`useDeleteNote`) behind an Alert
 * confirm. Errors surface inline; the screen never crashes on a failed request.
 */
import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { SoftInput } from '@/components/ui/SoftInput';
import { SoftToggle } from '@/components/ui/SoftToggle';
import { PillButton, TextLink } from '@/components/ui/PillButton';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Tag } from '@/components/ui/Tag';
import { Icon, type IconName } from '@/components/ui/Icon';
import { AppHeader } from '@/components/ui/AppHeader';
import { MarkdownView } from '@/components/notes/MarkdownView';

import { fonts, radii, pressOpacity } from '@/theme/tokens';
import { useTheme } from '@/theme';
import { useNote, useCreateNote, useUpdateNote, useDeleteNote } from '@/hooks/api';
import type { Note, NoteFolder } from '@/types/models';
import { FOLDER_ICON, NOTE_FOLDERS, formatShortDate } from '@/components/notes/notesMeta';

const FOLDER_OPTIONS: SelectOption<NoteFolder>[] = NOTE_FOLDERS.map((f) => ({
  label: f,
  value: f,
  icon: FOLDER_ICON[f],
}));

type Mode = 'write' | 'preview';

const BLANK: Pick<Note, 'title' | 'body' | 'tags' | 'folder' | 'favorite' | 'pinned'> = {
  title: '',
  body: '',
  tags: [],
  folder: 'General',
  favorite: false,
  pinned: false,
};

/* ------------------------------------------------------------------ */
/* Validation — mirrors backend createNoteSchema / notes.validator.ts  */
/* ------------------------------------------------------------------ */

const NOTE_LIMITS = {
  TITLE_MAX: 200,
  BODY_MAX: 100000,
  TAGS_MAX: 30,
  TAG_MAX: 40,
} as const;

/* ------------------------------------------------------------------ */
/* Section label                                                       */
/* ------------------------------------------------------------------ */

function SectionLabel({ icon, text }: { icon: IconName; text: string }) {
  const { colors } = useTheme();
  return (
    <View className="flex-row items-center" style={{ gap: 6, marginBottom: 8 }}>
      <Icon name={icon} size={14} color={colors.muted} />
      <AppText variant="overline" uppercase weight="semibold" color={colors.muted}>
        {text}
      </AppText>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Tag editor                                                          */
/* ------------------------------------------------------------------ */

function TagEditor({ tags, onChange }: { tags: string[]; onChange: (next: string[]) => void }) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState('');
  const [tagErr, setTagErr] = useState('');

  const add = () => {
    const t = draft.trim();
    if (!t) {
      setTagErr('Tag is required');
      return;
    }
    if (t.length > NOTE_LIMITS.TAG_MAX) {
      setTagErr(`Tag must be at most ${NOTE_LIMITS.TAG_MAX} characters`);
      return;
    }
    if (tags.length >= NOTE_LIMITS.TAGS_MAX) {
      setTagErr(`At most ${NOTE_LIMITS.TAGS_MAX} tags allowed`);
      return;
    }
    if (!tags.some((x) => x.toLowerCase() === t.toLowerCase())) onChange([...tags, t]);
    setDraft('');
    setTagErr('');
  };

  const remove = (t: string) => onChange(tags.filter((x) => x !== t));

  return (
    <View>
      {tags.length > 0 ? (
        <View className="flex-row flex-wrap" style={{ gap: 6, marginBottom: 10 }}>
          {tags.map((t) => (
            <Pressable
              key={t}
              onPress={() => remove(t)}
              accessibilityLabel={`Remove tag ${t}`}
              style={({ pressed }) => ({ opacity: pressOpacity({ pressed }) })}
            >
              <View
                className="flex-row items-center"
                style={{
                  gap: 5,
                  paddingVertical: 5,
                  paddingHorizontal: 10,
                  borderRadius: radii.pill,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  backgroundColor: colors.surface,
                }}
              >
                <AppText variant="caption" color={colors.ink}>
                  {t}
                </AppText>
                <Icon name="x" size={12} color={colors.muted} />
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      <SoftInput
        key="note-tag-draft"
        placeholder="Add a tag…"
        value={draft}
        onChangeText={(v) => {
          setDraft(v);
          if (tagErr) setTagErr('');
        }}
        error={tagErr || undefined}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={add}
        leading={<Icon name="tag" size={16} color={colors.muted} />}
        trailing={
          draft.trim().length > 0 ? (
            <Pressable
              onPress={add}
              accessibilityLabel="Add tag"
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressOpacity({ pressed }) })}
            >
              <Icon name="plus-circle" size={18} color={colors.primary} weight="fill" />
            </Pressable>
          ) : undefined
        }
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Option row                                                          */
/* ------------------------------------------------------------------ */

function OptionRow({
  icon,
  label,
  sub,
  value,
  onChange,
  divider,
}: {
  icon: IconName;
  label: string;
  sub: string;
  value: boolean;
  onChange: (next: boolean) => void;
  divider?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      className="flex-row items-center"
      style={{
        gap: 12,
        paddingVertical: 12,
        borderTopWidth: divider ? 1 : 0,
        borderTopColor: colors.hairline,
      }}
    >
      <Icon name={icon} size={17} color={colors.muted} />
      <View style={{ flex: 1 }}>
        <AppText variant="subheading" weight="medium" color={colors.ink}>
          {label}
        </AppText>
        <AppText variant="caption" color={colors.muted} style={{ marginTop: 1 }}>
          {sub}
        </AppText>
      </View>
      <SoftToggle value={value} onValueChange={onChange} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function NoteEditorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const isNew = id === 'new';
  const { data: fetched, isLoading, isError, error, refetch } = useNote(isNew ? '' : (id ?? ''));

  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const seed = fetched ?? BLANK;

  const [title, setTitle] = useState(seed.title);
  const [body, setBody] = useState(seed.body);
  const [tags, setTags] = useState<string[]>(seed.tags);
  const [folder, setFolder] = useState<NoteFolder>(seed.folder);
  const [favorite, setFavorite] = useState(seed.favorite);
  const [pinned, setPinned] = useState(seed.pinned);
  const [mode, setMode] = useState<Mode>(isNew ? 'write' : 'preview');
  const [saveErr, setSaveErr] = useState('');
  const [titleErr, setTitleErr] = useState('');
  const [bodyErr, setBodyErr] = useState('');
  // Re-seed once the fetch lands (keyed so we only adopt server values once).
  const [seededId, setSeededId] = useState<string | null>(null);

  if (fetched && seededId !== fetched.id) {
    setSeededId(fetched.id);
    setTitle(fetched.title);
    setBody(fetched.body);
    setTags(fetched.tags);
    setFolder(fetched.folder);
    setFavorite(fetched.favorite);
    setPinned(fetched.pinned);
  }

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  const saving = createNote.isPending || updateNote.isPending;
  // Form is valid when there's something to save and no length violations.
  const canSave =
    (title.trim() !== '' || body.trim() !== '') &&
    title.trim().length <= NOTE_LIMITS.TITLE_MAX &&
    body.length <= NOTE_LIMITS.BODY_MAX;

  const handleSave = () => {
    const t = title.trim();
    const b = body.trim();

    // Per-field validation mirroring the backend note schema.
    let ok = true;
    if (!t && !b) {
      setSaveErr('Add a title or some body text before saving.');
      ok = false;
    } else {
      setSaveErr('');
    }
    if (t.length > NOTE_LIMITS.TITLE_MAX) {
      setTitleErr(`Title must be at most ${NOTE_LIMITS.TITLE_MAX} characters`);
      ok = false;
    } else {
      setTitleErr('');
    }
    if (body.length > NOTE_LIMITS.BODY_MAX) {
      setBodyErr(`Body must be at most ${NOTE_LIMITS.BODY_MAX} characters`);
      ok = false;
    } else {
      setBodyErr('');
    }
    if (!ok) return;

    // Fall back to a derived title so the note is never untitled on the server.
    const finalTitle = t || b.split('\n')[0].slice(0, 60) || 'Untitled note';
    const preview = b.replace(/[#>*`_-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);

    if (isNew) {
      createNote.mutate(
        { title: finalTitle, body, tags, folder, favorite, pinned, preview, wordCount },
        {
          onSuccess: () => router.back(),
          onError: (e) => setSaveErr(e.message),
        },
      );
    } else if (id) {
      updateNote.mutate(
        { id, patch: { title: finalTitle, body, tags, folder, favorite, pinned, preview, wordCount } },
        {
          onSuccess: () => router.back(),
          onError: (e) => setSaveErr(e.message),
        },
      );
    }
  };

  const handleDelete = () => {
    if (isNew || !id) return;
    Alert.alert(
      'Delete note?',
      `"${fetched?.title || title || 'This note'}" will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteNote.mutate(id, {
              onSuccess: () => router.back(),
              onError: (e) => setSaveErr(e.message),
            });
          },
        },
      ],
    );
  };

  /* ----- Loading / error states for an existing note ----- */
  if (!isNew && isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <View style={{ paddingHorizontal: 20 }}>
          <AppHeader onBack={() => router.back()} />
        </View>
        <View className="flex-1 items-center justify-center" style={{ gap: 12 }}>
          <ActivityIndicator color={colors.primary} />
          <AppText variant="caption" color={colors.muted}>
            Loading note…
          </AppText>
        </View>
      </View>
    );
  }

  if (!isNew && (isError || !fetched)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <View style={{ paddingHorizontal: 20 }}>
          <AppHeader onBack={() => router.back()} />
        </View>
        <View className="flex-1 items-center justify-center" style={{ paddingHorizontal: 32, gap: 10 }}>
          <Icon name={isError ? 'alert' : 'file-text'} size={24} color={colors.muted} />
          <AppText variant="subheading" weight="medium" color={colors.ink}>
            {isError ? 'Couldn’t load this note' : 'Note not found'}
          </AppText>
          <AppText variant="body" color={colors.muted} style={{ textAlign: 'center' }}>
            {isError
              ? error?.message ?? 'We couldn’t reach the server.'
              : 'This note may have been archived or removed.'}
          </AppText>
          <View className="flex-row items-center" style={{ gap: 16, marginTop: 6 }}>
            {isError ? (
              <TextLink label="Try again" onPress={() => void refetch()} icon={<Icon name="repeat" size={14} color={colors.ink} />} />
            ) : null}
            <TextLink label="Back to notes" onPress={() => router.back()} muted />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ paddingHorizontal: 20 }}>
          <AppHeader
            onBack={() => router.back()}
            right={
              !isNew && fetched ? (
                <View className="flex-row items-center" style={{ gap: 14 }}>
                  <AppText variant="caption" color={colors.muted}>
                    Updated {formatShortDate(fetched.updatedAt)}
                  </AppText>
                  <Pressable
                    onPress={handleDelete}
                    disabled={deleteNote.isPending}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Delete note"
                    style={({ pressed }) => ({
                      opacity: pressOpacity({ pressed }, { disabled: deleteNote.isPending }),
                    })}
                  >
                    <Icon name="trash" size={18} color={colors.danger} />
                  </Pressable>
                </View>
              ) : (
                <AppText variant="caption" color={colors.muted}>
                  New note
                </AppText>
              )
            }
          />
        </View>

        <View style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: insets.bottom + 120,
            }}
          >
          {/* Title */}
          <SoftInput
            key="note-title"
            value={title}
            onChangeText={(v) => {
              setTitle(v);
              if (titleErr) setTitleErr('');
            }}
            error={titleErr || undefined}
            placeholder="Note title"
            maxLength={NOTE_LIMITS.TITLE_MAX}
            style={{ fontFamily: fonts.serifMedium, fontSize: 18 }}
            containerStyle={{ marginBottom: 18 }}
          />

          {/* Body: Write / Preview */}
          <View className="flex-row items-center justify-between" style={{ marginBottom: 8 }}>
            <SectionLabel icon="file-text" text="Body" />
            <AppText variant="caption" color={colors.muted}>
              {wordCount} words
            </AppText>
          </View>

          <SegmentedTabs<Mode>
            options={[
              { label: 'Write', value: 'write', icon: 'pen' },
              { label: 'Preview', value: 'preview', icon: 'eye' },
            ]}
            value={mode}
            onChange={setMode}
            style={{ marginBottom: 12 }}
          />

          {mode === 'write' ? (
            <>
              <View
                style={{
                  borderRadius: radii.input,
                  borderWidth: bodyErr ? 1.5 : 1,
                  borderColor: bodyErr ? colors.danger : colors.hairline,
                  backgroundColor: colors.surface,
                }}
              >
                <TextInput
                  key="note-body"
                  value={body}
                  onChangeText={(v) => {
                    setBody(v);
                    if (bodyErr) setBodyErr('');
                  }}
                  placeholder={'# Start writing…\n\nMarkdown supported — headings, **bold**, lists,\n> quotes, and ```code``` fences.'}
                  placeholderTextColor={colors.muted}
                  multiline
                  textAlignVertical="top"
                  style={{
                    minHeight: 240,
                    padding: 14,
                    fontFamily: fonts.mono,
                    fontSize: 13,
                    lineHeight: 20,
                    color: colors.ink,
                  }}
                />
              </View>
              {bodyErr ? (
                <AppText variant="caption" color={colors.danger} style={{ marginTop: 5 }}>
                  {bodyErr}
                </AppText>
              ) : null}
              <AppText variant="caption" color={colors.muted} style={{ marginTop: 6 }}>
                Supports Markdown: # headings, lists, `code` and ``` fences.
              </AppText>
            </>
          ) : (
            <SoftCard radius={radii.card} padding={14}>
              {body.trim() ? (
                <MarkdownView source={body} />
              ) : (
                <View className="items-center" style={{ paddingVertical: 24, gap: 8 }}>
                  <Icon name="eye-off" size={22} color={colors.muted} />
                  <AppText variant="body" color={colors.muted}>
                    Nothing to preview yet
                  </AppText>
                </View>
              )}
            </SoftCard>
          )}

          {/* Folder */}
          <View style={{ marginTop: 20 }}>
            <SectionLabel icon="folder" text="Folder" />
            <Select<NoteFolder>
              options={FOLDER_OPTIONS}
              value={folder}
              onChange={setFolder}
              title="Choose a folder"
              placeholder="Choose a folder"
            />
          </View>

          {/* Tags */}
          <View style={{ marginTop: 20 }}>
            <SectionLabel icon="tag" text="Tags" />
            <TagEditor tags={tags} onChange={setTags} />
          </View>

          {/* Options */}
          <View style={{ marginTop: 20 }}>
            <SectionLabel icon="settings" text="Options" />
            <SoftCard radius={radii.card} padding={12}>
              <OptionRow
                icon="star"
                label="Favorite"
                sub="Keep in your starred notes"
                value={favorite}
                onChange={setFavorite}
              />
              <OptionRow
                icon="pin"
                label="Pinned"
                sub="Keep at the top of the list"
                value={pinned}
                onChange={setPinned}
                divider
              />
            </SoftCard>
          </View>

          {/* Delete affordance for existing notes (also in the header). */}
          {!isNew && fetched ? (
            <View style={{ marginTop: 22, alignItems: 'flex-start' }}>
              <TextLink
                label="Delete note"
                onPress={handleDelete}
                disabled={deleteNote.isPending}
                icon={<Icon name="trash" size={14} color={colors.danger} />}
              />
            </View>
          ) : null}

          {saveErr ? (
            <SoftCard variant="inset" radius={radii.card} padding={14} style={{ marginTop: 18 }}>
              <View className="flex-row items-center" style={{ gap: 10 }}>
                <Icon name="alert" size={18} color={colors.danger} />
                <AppText variant="body" color={colors.danger} style={{ flex: 1 }}>
                  {saveErr}
                </AppText>
              </View>
            </SoftCard>
          ) : null}
          </ScrollView>
        </View>

        {/* Save bar — ONE terracotta pill + a Cancel TextLink */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: insets.bottom + 14,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.hairline,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <TextLink label="Cancel" onPress={() => router.back()} muted disabled={saving} />
          <View style={{ flex: 1 }} />
          {saving ? <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 4 }} /> : null}
          <PillButton
            label={isNew ? 'Create note' : 'Save changes'}
            onPress={handleSave}
            disabled={!canSave || saving}
            icon={<Icon name="check" size={15} color={colors.onPrimary} />}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
