/**
 * Notes — editor screen.
 *
 * Edits an existing note (by id) or composes a new one (`/notes/new`). A title
 * SoftInput, a Write / Preview segmented control over a markdown body area
 * (rendered with the in-app MarkdownView, complete with inset code-block
 * styling), an editable tag row, favorite + pin SoftToggles, a folder Select
 * and a save PillButton. All local state — mock data is the seed, no mutation
 * of the source. Aaply kit only, ZERO emoji.
 */
import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { SoftIconButton } from '@/components/ui/SoftIconButton';
import { SoftInput } from '@/components/ui/SoftInput';
import { SoftToggle } from '@/components/ui/SoftToggle';
import { PillButton } from '@/components/ui/PillButton';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Icon } from '@/components/ui/Icon';
import { MarkdownView } from '@/components/notes/MarkdownView';

import { colors, fonts, radii } from '@/theme/tokens';
import { mockNotes, TODAY } from '@/data/mock';
import type { Note, NoteFolder } from '@/types/models';
import {
  ACCENT_WASH,
  FOLDER_ICON,
  NOTE_FOLDERS,
  formatShortDate,
} from '@/components/notes/notesMeta';

const FOLDER_OPTIONS: SelectOption<NoteFolder>[] = NOTE_FOLDERS.map((f) => ({
  label: f,
  value: f,
  icon: FOLDER_ICON[f],
}));

type Mode = 'write' | 'preview';

/* ------------------------------------------------------------------ */
/* Tag editor                                                          */
/* ------------------------------------------------------------------ */

function TagEditor({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const t = draft.trim();
    if (!t) return;
    if (!tags.some((x) => x.toLowerCase() === t.toLowerCase())) {
      onChange([...tags, t]);
    }
    setDraft('');
  };

  const remove = (t: string) => onChange(tags.filter((x) => x !== t));

  return (
    <View>
      <View className="flex-row flex-wrap" style={{ gap: 8, marginBottom: tags.length ? 12 : 0 }}>
        {tags.map((t) => (
          <Pressable key={t} onPress={() => remove(t)} accessibilityLabel={`Remove tag ${t}`}>
            <Neumorph variant="raised" radius={radii.pill} intensity="sm" surface={colors.canvas}>
              <View
                className="flex-row items-center"
                style={{ gap: 6, paddingVertical: 8, paddingHorizontal: 13 }}
              >
                <Icon name="hash" size={13} color="textMuted" strokeWidth={2.2} />
                <AppText variant="caption" weight="medium" style={{ fontSize: 13 }}>
                  {t}
                </AppText>
                <Icon name="x" size={13} color="textSubtle" strokeWidth={2.4} />
              </View>
            </Neumorph>
          </Pressable>
        ))}
      </View>

      <SoftInput
        placeholder="Add a tag…"
        value={draft}
        onChangeText={setDraft}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={add}
        leading={<Icon name="tag" size={17} color="textMuted" />}
        trailing={
          draft.trim().length > 0 ? (
            <Pressable onPress={add} accessibilityLabel="Add tag" hitSlop={8}>
              <Icon name="plus-circle" size={20} color="signal" strokeWidth={2.2} />
            </Pressable>
          ) : undefined
        }
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Section label                                                       */
/* ------------------------------------------------------------------ */

function SectionLabel({ icon, text }: { icon: Parameters<typeof Icon>[0]['name']; text: string }) {
  return (
    <View className="flex-row items-center" style={{ gap: 7, marginBottom: 10 }}>
      <Icon name={icon} size={15} color="carbon" strokeWidth={2.2} />
      <AppText
        variant="caption"
        weight="bold"
        color={colors.textMuted}
        style={{ fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' }}
      >
        {text}
      </AppText>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

const BLANK: Pick<Note, 'title' | 'body' | 'tags' | 'folder' | 'favorite' | 'pinned'> = {
  title: '',
  body: '',
  tags: [],
  folder: 'General',
  favorite: false,
  pinned: false,
};

export default function NoteEditorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const isNew = id === 'new';
  const existing = useMemo<Note | undefined>(
    () => (isNew ? undefined : mockNotes.find((n) => n.id === id)),
    [id, isNew],
  );

  const seed = existing ?? BLANK;

  const [title, setTitle] = useState(seed.title);
  const [body, setBody] = useState(seed.body);
  const [tags, setTags] = useState<string[]>(seed.tags);
  const [folder, setFolder] = useState<NoteFolder>(seed.folder);
  const [favorite, setFavorite] = useState(seed.favorite);
  const [pinned, setPinned] = useState(seed.pinned);
  const [mode, setMode] = useState<Mode>(isNew ? 'write' : 'preview');
  const [saved, setSaved] = useState(false);

  const accent = existing?.accent ?? 'highlighter';
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  const handleSave = () => {
    // Mock app — surface a confirmation, then return to the list.
    setSaved(true);
  };

  // Missing-note guard (deleted / bad id).
  if (!isNew && !existing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <View
          style={{ paddingTop: insets.top + 8, paddingHorizontal: 20 }}
          className="flex-row items-center"
        >
          <SoftIconButton size={44} accessibilityLabel="Go back" onPress={() => router.back()}>
            <Icon name="chevron-left" size={22} color="carbon" />
          </SoftIconButton>
        </View>
        <View className="flex-1 items-center justify-center" style={{ paddingHorizontal: 32 }}>
          <Neumorph variant="inset" radius={28} intensity="md" padding={22} surface={colors.canvas}>
            <Icon name="file-text" size={34} color="textSubtle" strokeWidth={1.8} />
          </Neumorph>
          <AppText variant="subheading" weight="bold" display style={{ marginTop: 18 }}>
            Note not found
          </AppText>
          <AppText
            variant="body"
            color={colors.textMuted}
            style={{ marginTop: 6, textAlign: 'center', fontSize: 14 }}
          >
            This note may have been archived or removed.
          </AppText>
          <PillButton
            label="Back to notes"
            variant="black"
            size="sm"
            style={{ marginTop: 20 }}
            onPress={() => router.back()}
            icon={<Icon name="arrow-left" size={16} color="paper" strokeWidth={2.2} />}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: insets.top + 8,
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 130,
          }}
        >
          {/* ---------- Top bar ---------- */}
          <View className="flex-row items-center justify-between">
            <SoftIconButton size={44} accessibilityLabel="Go back" onPress={() => router.back()}>
              <Icon name="chevron-left" size={22} color="carbon" />
            </SoftIconButton>

            <View className="flex-row items-center" style={{ gap: 10 }}>
              <SoftIconButton
                size={44}
                active={favorite}
                activeColor={colors.highlighter}
                accessibilityLabel={favorite ? 'Unfavorite' : 'Favorite'}
                onPress={() => setFavorite((v) => !v)}
              >
                <Icon
                  name="star"
                  size={20}
                  color="carbon"
                  fill={favorite ? colors.carbon : 'none'}
                  strokeWidth={2}
                />
              </SoftIconButton>
              <SoftIconButton
                size={44}
                active={pinned}
                activeColor={colors.highlighter}
                accessibilityLabel={pinned ? 'Unpin' : 'Pin'}
                onPress={() => setPinned((v) => !v)}
              >
                <Icon
                  name="pin"
                  size={20}
                  color="carbon"
                  fill={pinned ? colors.carbon : 'none'}
                  strokeWidth={2}
                />
              </SoftIconButton>
            </View>
          </View>

          {/* ---------- Eyebrow ---------- */}
          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 320 }}
            style={{ marginTop: 18, marginBottom: 16 }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center" style={{ gap: 7 }}>
                <Icon name={isNew ? 'plus-circle' : 'pen'} size={14} color="highlighter" strokeWidth={2.4} />
                <AppText
                  variant="caption"
                  weight="semibold"
                  color={colors.textSubtle}
                  style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 11 }}
                >
                  {isNew ? 'New note' : 'Editing'}
                </AppText>
              </View>
              {!isNew && existing ? (
                <AppText variant="caption" color={colors.textSubtle} style={{ fontSize: 12 }}>
                  Updated {formatShortDate(existing.updatedAt)}
                </AppText>
              ) : null}
            </View>
          </MotiView>

          {/* ---------- Title ---------- */}
          <SoftInput
            value={title}
            onChangeText={setTitle}
            placeholder="Note title"
            style={{ fontFamily: fonts.displaySemibold, fontSize: 19 }}
            containerStyle={{ marginBottom: 18 }}
          />

          {/* ---------- Body: Write / Preview ---------- */}
          <View className="flex-row items-center justify-between" style={{ marginBottom: 10 }}>
            <SectionLabel icon="file-text" text="Body" />
            <AppText variant="caption" color={colors.textSubtle} style={{ fontSize: 12 }}>
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
            height={44}
            style={{ marginBottom: 14 }}
          />

          <AnimatePresence exitBeforeEnter>
            {mode === 'write' ? (
              <MotiView
                key="write"
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'timing', duration: 180 }}
              >
                <Neumorph variant="inset" radius={radii.input}>
                  <TextInput
                    value={body}
                    onChangeText={setBody}
                    placeholder={
                      '# Start writing…\n\nMarkdown is supported — headings, **bold**, lists,\n> quotes, and ```code``` fences.'
                    }
                    placeholderTextColor={colors.textSubtle}
                    multiline
                    textAlignVertical="top"
                    style={{
                      minHeight: 260,
                      padding: 16,
                      fontFamily: 'monospace',
                      fontSize: 14,
                      lineHeight: 22,
                      color: colors.carbon,
                    }}
                  />
                </Neumorph>
                <View className="flex-row items-center" style={{ gap: 6, marginTop: 8, marginLeft: 4 }}>
                  <Icon name="info" size={13} color="textSubtle" strokeWidth={2} />
                  <AppText variant="caption" color={colors.textSubtle} style={{ fontSize: 12 }}>
                    Supports Markdown: # headings, lists, {'`code`'} and ``` fences.
                  </AppText>
                </View>
              </MotiView>
            ) : (
              <MotiView
                key="preview"
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'timing', duration: 180 }}
              >
                <SoftCard variant="raised" radius={radii.card} padding={18}>
                  {body.trim() ? (
                    <MarkdownView source={body} accent={accent} />
                  ) : (
                    <View className="items-center" style={{ paddingVertical: 28 }}>
                      <Icon name="eye-off" size={26} color="textSubtle" strokeWidth={1.8} />
                      <AppText
                        variant="body"
                        color={colors.textMuted}
                        style={{ marginTop: 10, fontSize: 14 }}
                      >
                        Nothing to preview yet
                      </AppText>
                    </View>
                  )}
                </SoftCard>
              </MotiView>
            )}
          </AnimatePresence>

          {/* ---------- Folder ---------- */}
          <View style={{ marginTop: 22 }}>
            <SectionLabel icon="folder" text="Folder" />
            <Select<NoteFolder>
              options={FOLDER_OPTIONS}
              value={folder}
              onChange={setFolder}
              placeholder="Choose a folder"
            />
          </View>

          {/* ---------- Tags ---------- */}
          <View style={{ marginTop: 22 }}>
            <SectionLabel icon="tag" text="Tags" />
            <TagEditor tags={tags} onChange={setTags} />
          </View>

          {/* ---------- Options ---------- */}
          <View style={{ marginTop: 22 }}>
            <SectionLabel icon="settings" text="Options" />
            <SoftCard variant="raised" radius={radii.card} padding={6}>
              <OptionRow
                icon="star"
                label="Favorite"
                sub="Pin to your starred notes"
                value={favorite}
                onChange={setFavorite}
              />
              <View style={{ height: 1, backgroundColor: colors.hairline, marginHorizontal: 14 }} />
              <OptionRow
                icon="pin"
                label="Pinned"
                sub="Keep at the top of the list"
                value={pinned}
                onChange={setPinned}
              />
            </SoftCard>
          </View>

          {/* ---------- Saved confirmation ---------- */}
          <AnimatePresence>
            {saved ? (
              <MotiView
                key="saved"
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'timing', duration: 240 }}
                style={{ marginTop: 20 }}
              >
                <Neumorph
                  variant="inset"
                  radius={radii.card}
                  intensity="sm"
                  surface={ACCENT_WASH.success}
                >
                  <View
                    className="flex-row items-center"
                    style={{ gap: 10, padding: 16 }}
                  >
                    <Icon name="check-circle" size={20} color="success" strokeWidth={2.2} />
                    <AppText variant="body" weight="semibold" style={{ flex: 1, fontSize: 14 }}>
                      Saved. Your changes are stored locally.
                    </AppText>
                  </View>
                </Neumorph>
              </MotiView>
            ) : null}
          </AnimatePresence>
        </ScrollView>

        {/* ---------- Save bar ---------- */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: insets.bottom + 14,
            backgroundColor: colors.canvas,
            borderTopWidth: 1,
            borderTopColor: colors.hairline,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Neumorph variant="raised" radius={radii.pill} intensity="sm" surface={colors.canvas}>
              <View style={{ width: 56, height: 54, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="x" size={22} color="carbon" strokeWidth={2.2} />
              </View>
            </Neumorph>
          </Pressable>

          <PillButton
            label={isNew ? 'Create note' : 'Save changes'}
            variant="yellow"
            size="md"
            fullWidth
            onPress={handleSave}
            disabled={title.trim() === '' && body.trim() === ''}
            icon={<Icon name="save" size={18} color="carbon" strokeWidth={2.2} />}
            style={{ flex: 1 }}
          />
        </View>
      </KeyboardAvoidingView>
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
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  label: string;
  sub: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  const accentHex: string = value ? colors.highlighter : colors.canvas;
  return (
    <View className="flex-row items-center" style={{ gap: 14, padding: 14 }}>
      <Neumorph variant="inset" radius={12} intensity="sm" padding={9} surface={accentHex}>
        <Icon name={icon} size={18} color="carbon" strokeWidth={2.2} fill={value ? colors.carbon : 'none'} />
      </Neumorph>
      <View style={{ flex: 1 }}>
        <AppText variant="body" weight="semibold" style={{ fontSize: 15 }}>
          {label}
        </AppText>
        <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 12, marginTop: 1 }}>
          {sub}
        </AppText>
      </View>
      <SoftToggle value={value} onValueChange={onChange} />
    </View>
  );
}
