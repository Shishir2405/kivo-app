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
 * Saving is local-only (the create/update endpoint is out of scope here) — it
 * surfaces a confirmation, then returns to the list.
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

import { colors, fonts, radii, interaction, pressOpacity } from '@/theme/tokens';
import { useNote } from '@/hooks/api';
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
/* Section label                                                       */
/* ------------------------------------------------------------------ */

function SectionLabel({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View className="flex-row items-center" style={{ gap: 6, marginBottom: 8 }}>
      <Icon name={icon} size={14} color="graphite" />
      <AppText
        variant="caption"
        weight="medium"
        color={colors.graphite}
        style={{ letterSpacing: 0.6, textTransform: 'uppercase' }}
      >
        {text}
      </AppText>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Tag editor                                                          */
/* ------------------------------------------------------------------ */

function TagEditor({ tags, onChange }: { tags: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const t = draft.trim();
    if (!t) return;
    if (!tags.some((x) => x.toLowerCase() === t.toLowerCase())) onChange([...tags, t]);
    setDraft('');
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
                  borderColor: colors.dove,
                  backgroundColor: colors.white,
                }}
              >
                <AppText variant="caption" color={colors.ash}>
                  {t}
                </AppText>
                <Icon name="x" size={12} color="graphite" />
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      <SoftInput
        placeholder="Add a tag…"
        value={draft}
        onChangeText={setDraft}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={add}
        leading={<Icon name="tag" size={16} color="graphite" />}
        trailing={
          draft.trim().length > 0 ? (
            <Pressable
              onPress={add}
              accessibilityLabel="Add tag"
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressOpacity({ pressed }) })}
            >
              <Icon name="plus-circle" size={18} color="ink" />
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
  return (
    <View
      className="flex-row items-center"
      style={{
        gap: 12,
        paddingVertical: 12,
        borderTopWidth: divider ? 1 : 0,
        borderTopColor: colors.fog,
      }}
    >
      <Icon name={icon} size={17} color="graphite" />
      <View style={{ flex: 1 }}>
        <AppText variant="subheading" weight="medium">
          {label}
        </AppText>
        <AppText variant="caption" color={colors.graphite} style={{ marginTop: 1 }}>
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
  const { id } = useLocalSearchParams<{ id: string }>();

  const isNew = id === 'new';
  const { data: fetched, isLoading, isError, error, refetch } = useNote(isNew ? '' : (id ?? ''));

  const seed = fetched ?? BLANK;

  const [title, setTitle] = useState(seed.title);
  const [body, setBody] = useState(seed.body);
  const [tags, setTags] = useState<string[]>(seed.tags);
  const [folder, setFolder] = useState<NoteFolder>(seed.folder);
  const [favorite, setFavorite] = useState(seed.favorite);
  const [pinned, setPinned] = useState(seed.pinned);
  const [mode, setMode] = useState<Mode>(isNew ? 'write' : 'preview');
  const [saved, setSaved] = useState(false);
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

  const handleSave = () => setSaved(true);

  /* ----- Loading / error states for an existing note ----- */
  if (!isNew && isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        <View style={{ paddingHorizontal: 20 }}>
          <AppHeader onBack={() => router.back()} />
        </View>
        <View className="flex-1 items-center justify-center" style={{ gap: 12 }}>
          <ActivityIndicator color={colors.ink} />
          <AppText variant="caption" color={colors.graphite}>
            Loading note…
          </AppText>
        </View>
      </View>
    );
  }

  if (!isNew && (isError || !fetched)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        <View style={{ paddingHorizontal: 20 }}>
          <AppHeader onBack={() => router.back()} />
        </View>
        <View className="flex-1 items-center justify-center" style={{ paddingHorizontal: 32, gap: 10 }}>
          <Icon name={isError ? 'alert' : 'file-text'} size={24} color="graphite" />
          <AppText variant="subheading" weight="medium">
            {isError ? 'Couldn’t load this note' : 'Note not found'}
          </AppText>
          <AppText variant="body" color={colors.ash} style={{ textAlign: 'center' }}>
            {isError
              ? error?.message ?? 'We couldn’t reach the server.'
              : 'This note may have been archived or removed.'}
          </AppText>
          <View className="flex-row items-center" style={{ gap: 16, marginTop: 6 }}>
            {isError ? (
              <TextLink label="Try again" onPress={() => void refetch()} icon={<Icon name="repeat" size={14} color="ink" />} />
            ) : null}
            <TextLink label="Back to notes" onPress={() => router.back()} muted />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ paddingHorizontal: 20 }}>
          <AppHeader
            onBack={() => router.back()}
            right={
              !isNew && fetched ? (
                <AppText variant="caption" color={colors.graphite}>
                  Updated {formatShortDate(fetched.updatedAt)}
                </AppText>
              ) : (
                <AppText variant="caption" color={colors.graphite}>
                  New note
                </AppText>
              )
            }
          />
        </View>

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
            value={title}
            onChangeText={setTitle}
            placeholder="Note title"
            style={{ fontFamily: fonts.serifMedium, fontSize: 18 }}
            containerStyle={{ marginBottom: 18 }}
          />

          {/* Body: Write / Preview */}
          <View className="flex-row items-center justify-between" style={{ marginBottom: 8 }}>
            <SectionLabel icon="file-text" text="Body" />
            <AppText variant="caption" color={colors.graphite}>
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
                  borderWidth: 1,
                  borderColor: colors.dove,
                  backgroundColor: colors.white,
                }}
              >
                <TextInput
                  value={body}
                  onChangeText={setBody}
                  placeholder={'# Start writing…\n\nMarkdown supported — headings, **bold**, lists,\n> quotes, and ```code``` fences.'}
                  placeholderTextColor={colors.dove}
                  multiline
                  textAlignVertical="top"
                  style={{
                    minHeight: 240,
                    padding: 14,
                    fontFamily: 'monospace',
                    fontSize: 13,
                    lineHeight: 20,
                    color: colors.ink,
                  }}
                />
              </View>
              <AppText variant="caption" color={colors.graphite} style={{ marginTop: 6 }}>
                Supports Markdown: # headings, lists, `code` and ``` fences.
              </AppText>
            </>
          ) : (
            <SoftCard radius={radii.card} padding={14}>
              {body.trim() ? (
                <MarkdownView source={body} />
              ) : (
                <View className="items-center" style={{ paddingVertical: 24, gap: 8 }}>
                  <Icon name="eye-off" size={22} color="graphite" />
                  <AppText variant="body" color={colors.ash}>
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

          {saved ? (
            <SoftCard variant="inset" radius={radii.card} padding={14} style={{ marginTop: 18 }}>
              <View className="flex-row items-center" style={{ gap: 10 }}>
                <Icon name="check-circle" size={18} color="ink" />
                <AppText variant="body" color={colors.ash} style={{ flex: 1 }}>
                  Saved. Your changes are stored on this device.
                </AppText>
              </View>
            </SoftCard>
          ) : null}
        </ScrollView>

        {/* Save bar — ONE Ink pill + a Cancel TextLink */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: insets.bottom + 14,
            backgroundColor: colors.white,
            borderTopWidth: 1,
            borderTopColor: colors.fog,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <TextLink label="Cancel" onPress={() => router.back()} muted />
          <View style={{ flex: 1 }} />
          <PillButton
            label={isNew ? 'Create note' : 'Save changes'}
            onPress={handleSave}
            disabled={title.trim() === '' && body.trim() === ''}
            icon={<Icon name="check" size={15} color="white" />}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
