/**
 * Resource library.
 *
 * A saved-links workspace: search + a horizontally-scrolling type filter
 * (All / YouTube / Playlist / Article / Docs / GitHub / PDF / Blog) backed by
 * the custom neumorphic <Chip/> group (never a radio / native Picker), plus a
 * "favorites only" toggle. Each link is a raised SoftCard with its type Icon in
 * an accent-tinted well, title, source / host, a topic <Tag/> and consumed/
 * favorite state. Tapping a card opens the URL; the heart toggles a star.
 *
 * An add-resource FAB springs up a neumorphic bottom-sheet form (title, URL,
 * topic, type via the custom <Select/>, accent via a <Chip/> row) that prepends
 * a new Resource to local state. Pure Aaply soft-UI on the graphite-mist canvas,
 * vector Icons only — ZERO emoji.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Modal,
  Linking,
  TextInput,
  type ColorValue,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { SoftIconButton } from '@/components/ui/SoftIconButton';
import { SoftInput } from '@/components/ui/SoftInput';
import { Chip } from '@/components/ui/Chip';
import { Select } from '@/components/ui/Select';
import { Tag, type TagTone } from '@/components/ui/Tag';
import { PillButton } from '@/components/ui/PillButton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { GrayMark } from '@/components/ui/AppHeader';

import { colors, radii } from '@/theme/tokens';
import { mockResources } from '@/data/mock';
import type { Resource, ResourceType } from '@/types/models';

/* ------------------------------------------------------------------ */
/* Type / accent metadata                                              */
/* ------------------------------------------------------------------ */

type Accent = 'highlighter' | 'signal' | 'peach' | 'annotation' | 'success';

const ACCENT_HEX: Record<Accent, ColorValue> = {
  highlighter: colors.highlighter,
  signal: colors.signal,
  peach: colors.peach,
  annotation: colors.annotation,
  success: colors.success,
};

/** Tag tones map 1:1 onto the accent unions used across the kit. */
const ACCENT_TAG: Record<Accent, TagTone> = {
  highlighter: 'yellow',
  signal: 'signal',
  peach: 'peach',
  annotation: 'annotation',
  success: 'success',
};

/** Per-type display metadata (label + glyph) for the filter + cards. */
const TYPE_META: Record<ResourceType, { label: string; icon: IconName }> = {
  youtube: { label: 'YouTube', icon: 'play' },
  playlist: { label: 'Playlist', icon: 'list' },
  article: { label: 'Article', icon: 'file-text' },
  documentation: { label: 'Docs', icon: 'book-open' },
  github: { label: 'GitHub', icon: 'code-xml' },
  pdf: { label: 'PDF', icon: 'book' },
  blog: { label: 'Blog', icon: 'pen' },
};

const TYPE_ORDER: ResourceType[] = [
  'youtube',
  'playlist',
  'article',
  'documentation',
  'github',
  'pdf',
  'blog',
];

type Filter = 'all' | ResourceType;

/** Strip protocol / path down to a friendly host for the meta line. */
function hostOf(url: string): string {
  const m = url.match(/^[a-z]+:\/\/(?:www\.)?([^/]+)/i);
  return m ? m[1] : url;
}

/* ------------------------------------------------------------------ */
/* Resource card                                                       */
/* ------------------------------------------------------------------ */

function ResourceCard({
  resource,
  index,
  onOpen,
  onToggleFavorite,
}: {
  resource: Resource;
  index: number;
  onOpen: (r: Resource) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const [pressed, setPressed] = useState(false);
  const accent = resource.accent as Accent;
  const meta = TYPE_META[resource.type];

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 320, delay: Math.min(index, 8) * 55 }}
      style={{ marginBottom: 14 }}
    >
      <Pressable
        onPress={() => onOpen(resource)}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        accessibilityRole="link"
        accessibilityLabel={`Open ${resource.title}`}
      >
        <SoftCard variant={pressed ? 'inset' : 'raised'} radius={radii.card} intensity="md" padding={16}>
          <View className="flex-row items-start" style={{ gap: 14 }}>
            {/* Type glyph in an accent-tinted inset well */}
            <Neumorph variant="inset" radius={16} intensity="sm" padding={12} surface={colors.canvas}>
              <Icon name={resource.icon} size={22} color={accent} strokeWidth={2.2} />
            </Neumorph>

            <View style={{ flex: 1 }}>
              <View className="flex-row items-start justify-between" style={{ gap: 10 }}>
                <AppText variant="body" weight="bold" numberOfLines={2} style={{ flex: 1, lineHeight: 21 }}>
                  {resource.title}
                </AppText>

                {/* Favorite toggle */}
                <Pressable
                  onPress={() => onToggleFavorite(resource.id)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={resource.favorite ? 'Unstar resource' : 'Star resource'}
                >
                  <Icon
                    name="star"
                    size={20}
                    color={resource.favorite ? 'highlighter' : 'textSubtle'}
                    fill={resource.favorite ? 'highlighter' : 'none'}
                    strokeWidth={2}
                  />
                </Pressable>
              </View>

              {/* Host / source line */}
              <View className="flex-row items-center" style={{ gap: 5, marginTop: 5 }}>
                <Icon name="link" size={12} color="textSubtle" strokeWidth={2} />
                <AppText variant="caption" color={colors.textMuted} numberOfLines={1} style={{ flex: 1, fontSize: 12 }}>
                  {resource.source ? `${resource.source} · ` : ''}
                  {hostOf(resource.url)}
                </AppText>
              </View>

              {resource.description ? (
                <AppText
                  variant="caption"
                  color={colors.textMuted}
                  numberOfLines={2}
                  style={{ marginTop: 8, fontSize: 13, lineHeight: 19 }}
                >
                  {resource.description}
                </AppText>
              ) : null}

              {/* Footer: topic tag + type/duration + completed */}
              <View className="flex-row items-center flex-wrap" style={{ gap: 8, marginTop: 12 }}>
                <Tag label={resource.topic} tone={ACCENT_TAG[accent]} size="sm" />
                <View
                  className="flex-row items-center"
                  style={{ gap: 5, backgroundColor: '#e9e9e9', borderRadius: radii.pill, paddingVertical: 4, paddingHorizontal: 10 }}
                >
                  <Icon name={meta.icon} size={12} color="textMuted" strokeWidth={2} />
                  <AppText variant="caption" weight="medium" color={colors.textMuted} style={{ fontSize: 11 }}>
                    {resource.duration ? `${meta.label} · ${resource.duration}` : meta.label}
                  </AppText>
                </View>
                {resource.completed ? (
                  <View className="flex-row items-center" style={{ gap: 4 }}>
                    <Icon name="check-circle" size={14} color="success" strokeWidth={2.4} />
                    <AppText variant="caption" weight="medium" color={colors.success} style={{ fontSize: 11 }}>
                      Done
                    </AppText>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </SoftCard>
      </Pressable>
    </MotiView>
  );
}

/* ------------------------------------------------------------------ */
/* Add-resource sheet                                                  */
/* ------------------------------------------------------------------ */

const ACCENT_OPTIONS: Accent[] = ['highlighter', 'signal', 'peach', 'annotation', 'success'];

function AddResourceSheet({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (draft: { title: string; url: string; topic: string; type: ResourceType; accent: Accent }) => void;
}) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<ResourceType>('article');
  const [accent, setAccent] = useState<Accent>('signal');

  const canSave = title.trim().length > 0 && url.trim().length > 0;

  function reset() {
    setTitle('');
    setUrl('');
    setTopic('');
    setType('article');
    setAccent('signal');
  }

  function handleSave() {
    if (!canSave) return;
    onAdd({
      title: title.trim(),
      url: url.trim(),
      topic: topic.trim() || 'General',
      type,
      accent,
    });
    reset();
    onClose();
  }

  function handleClose() {
    reset();
    onClose();
  }

  const typeOptions = TYPE_ORDER.map((t) => ({
    label: TYPE_META[t].label,
    value: t,
    icon: TYPE_META[t].icon,
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable
        onPress={handleClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', justifyContent: 'flex-end' }}
      >
        <MotiView
          from={{ translateY: 60, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        >
          <Pressable onPress={() => {}}>
            <View
              style={{
                backgroundColor: colors.canvas,
                borderTopLeftRadius: radii.cardLg,
                borderTopRightRadius: radii.cardLg,
                paddingTop: 12,
                paddingBottom: insets.bottom + 18,
                paddingHorizontal: 20,
              }}
            >
              {/* Grabber */}
              <View
                style={{
                  alignSelf: 'center',
                  width: 44,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: colors.hairline,
                  marginBottom: 16,
                }}
              />

              <View className="flex-row items-center" style={{ gap: 10, marginBottom: 18 }}>
                <Neumorph variant="inset" radius={12} intensity="sm" padding={9} surface={colors.canvas}>
                  <Icon name="plus" size={18} color="signal" strokeWidth={2.4} />
                </Neumorph>
                <AppText variant="subheading" weight="bold">
                  Add a resource
                </AppText>
              </View>

              <ScrollView
                bounces={false}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 420 }}
                contentContainerStyle={{ gap: 14, paddingBottom: 4 }}
                showsVerticalScrollIndicator={false}
              >
                <SoftInput
                  label="Title"
                  placeholder="e.g. Graph Series — full playlist"
                  value={title}
                  onChangeText={setTitle}
                  leading={<Icon name="pen" size={18} color="textMuted" />}
                />
                <SoftInput
                  label="URL"
                  placeholder="https://…"
                  value={url}
                  onChangeText={setUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  leading={<Icon name="link" size={18} color="textMuted" />}
                />
                <SoftInput
                  label="Topic"
                  placeholder="e.g. Graphs"
                  value={topic}
                  onChangeText={setTopic}
                  leading={<Icon name="tag" size={18} color="textMuted" />}
                />

                <Select
                  label="Type"
                  title="Resource type"
                  options={typeOptions}
                  value={type}
                  onChange={(v) => setType(v)}
                />

                <View>
                  <AppText variant="caption" weight="medium" style={{ marginBottom: 8, marginLeft: 4, fontSize: 14 }}>
                    Accent
                  </AppText>
                  <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                    {ACCENT_OPTIONS.map((a) => (
                      <Pressable
                        key={a}
                        onPress={() => setAccent(a)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: accent === a }}
                      >
                        <Neumorph
                          variant={accent === a ? 'inset' : 'raised'}
                          radius={radii.pill}
                          intensity="sm"
                          surface={colors.canvas}
                        >
                          <View
                            style={{
                              width: 40,
                              height: 40,
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: radii.pill,
                            }}
                          >
                            <View
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                backgroundColor: ACCENT_HEX[a],
                                borderWidth: accent === a ? 2 : 0,
                                borderColor: colors.carbon,
                              }}
                            />
                          </View>
                        </Neumorph>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View className="flex-row items-center" style={{ gap: 12, marginTop: 18 }}>
                <PillButton label="Cancel" variant="ghost" size="md" onPress={handleClose} style={{ flex: 1 }} />
                <PillButton
                  label="Save link"
                  variant="yellow"
                  size="md"
                  disabled={!canSave}
                  onPress={handleSave}
                  style={{ flex: 1 }}
                  icon={<Icon name="check" size={18} color="carbon" strokeWidth={2.6} />}
                />
              </View>
            </View>
          </Pressable>
        </MotiView>
      </Pressable>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function ResourcesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const searchRef = useRef<TextInput>(null);

  const [resources, setResources] = useState<Resource[]>(mockResources);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  /* ---- Derived counts per type (for filter badges) ---- */
  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: resources.length,
      youtube: 0,
      playlist: 0,
      article: 0,
      documentation: 0,
      github: 0,
      pdf: 0,
      blog: 0,
    };
    for (const r of resources) c[r.type] += 1;
    return c;
  }, [resources]);

  const favoriteCount = useMemo(() => resources.filter((r) => r.favorite).length, [resources]);
  const completedCount = useMemo(() => resources.filter((r) => r.completed).length, [resources]);

  /* ---- Filtered list ---- */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (filter !== 'all' && r.type !== filter) return false;
      if (favoritesOnly && !r.favorite) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.topic.toLowerCase().includes(q) ||
        (r.source?.toLowerCase().includes(q) ?? false) ||
        (r.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [resources, query, filter, favoritesOnly]);

  /* ---- Actions ---- */
  const openResource = useCallback((r: Resource) => {
    Linking.openURL(r.url).catch(() => {
      /* swallow — invalid / unsupported URL, nothing to surface in mock */
    });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setResources((prev) => prev.map((r) => (r.id === id ? { ...r, favorite: !r.favorite } : r)));
  }, []);

  const addResource = useCallback(
    (draft: { title: string; url: string; topic: string; type: ResourceType; accent: Accent }) => {
      const next: Resource = {
        id: `res_local_${Date.now()}`,
        title: draft.title,
        url: draft.url,
        type: draft.type,
        topic: draft.topic,
        source: hostOf(draft.url),
        icon: TYPE_META[draft.type].icon,
        accent: draft.accent,
        favorite: false,
        completed: false,
        addedAt: new Date().toISOString().slice(0, 10),
      };
      setResources((prev) => [next, ...prev]);
      setFilter('all');
      setFavoritesOnly(false);
      setQuery('');
    },
    [],
  );

  const clearSearch = useCallback(() => {
    setQuery('');
    searchRef.current?.blur();
  }, []);

  /* ---- Filter chip options (All + per-type, only types that exist) ---- */
  const filterChips: { value: Filter; label: string; icon?: IconName }[] = [
    { value: 'all', label: 'All', icon: 'layers' },
    ...TYPE_ORDER.filter((t) => counts[t] > 0).map((t) => ({
      value: t as Filter,
      label: TYPE_META[t].label,
      icon: TYPE_META[t].icon,
    })),
  ];

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
          <SoftIconButton size={44} accessibilityLabel="Go back" onPress={() => router.back()}>
            <Icon name="chevron-left" size={22} color="carbon" />
          </SoftIconButton>
          <GrayMark size={24} />
          <SoftIconButton
            size={44}
            active={favoritesOnly}
            accessibilityLabel="Toggle favorites only"
            onPress={() => setFavoritesOnly((v) => !v)}
          >
            <Icon
              name="star"
              size={20}
              color="carbon"
              fill={favoritesOnly ? 'carbon' : 'none'}
            />
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
            <Icon name="book-open" size={14} color="signal" strokeWidth={2.25} />
            <AppText
              variant="caption"
              weight="semibold"
              color={colors.textSubtle}
              style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 11 }}
            >
              Library
            </AppText>
          </View>
          <AppText variant="heading" display weight="bold" style={{ marginTop: 6 }}>
            Saved resources
          </AppText>

          {/* Stat strip */}
          <View className="flex-row" style={{ gap: 10, marginTop: 16 }}>
            <StatPill icon="link" label="Saved" value={resources.length} accent="signal" />
            <StatPill icon="star" label="Starred" value={favoriteCount} accent="highlighter" />
            <StatPill icon="check-circle" label="Done" value={completedCount} accent="success" />
          </View>
        </MotiView>

        {/* ---------- Search ---------- */}
        <SoftInput
          ref={searchRef}
          placeholder="Search links, topics, sources…"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          leading={<Icon name="search" size={18} color="textMuted" />}
          trailing={
            query.length > 0 ? (
              <Pressable onPress={clearSearch} hitSlop={8} accessibilityLabel="Clear search">
                <Icon name="x-circle" size={18} color="textSubtle" />
              </Pressable>
            ) : undefined
          }
          containerStyle={{ marginBottom: 16 }}
        />

        {/* ---------- Type filter (custom chips, not radios) ---------- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingRight: 4, paddingVertical: 2 }}
          style={{ marginHorizontal: -20, paddingHorizontal: 20, marginBottom: 18 }}
        >
          {filterChips.map((c) => (
            <Chip
              key={c.value}
              label={c.value === 'all' ? `${c.label} (${counts.all})` : `${c.label} (${counts[c.value]})`}
              icon={c.icon}
              selected={filter === c.value}
              onPress={() => setFilter(c.value)}
            />
          ))}
        </ScrollView>

        {/* ---------- Active-filter summary ---------- */}
        <View className="flex-row items-center justify-between" style={{ marginBottom: 14 }}>
          <AppText variant="caption" weight="medium" color={colors.textMuted} style={{ fontSize: 13 }}>
            {filtered.length} {filtered.length === 1 ? 'resource' : 'resources'}
            {favoritesOnly ? ' · starred' : ''}
          </AppText>
          {(filter !== 'all' || favoritesOnly || query.length > 0) ? (
            <Pressable
              onPress={() => {
                setFilter('all');
                setFavoritesOnly(false);
                setQuery('');
              }}
              hitSlop={8}
              accessibilityLabel="Reset filters"
              className="flex-row items-center"
              style={{ gap: 4 }}
            >
              <Icon name="rotate" size={13} color="signal" strokeWidth={2.4} />
              <AppText variant="caption" weight="semibold" color={colors.signal} style={{ fontSize: 12 }}>
                Reset
              </AppText>
            </Pressable>
          ) : null}
        </View>

        {/* ---------- List / empty state ---------- */}
        <AnimatePresence>
          {filtered.length === 0 ? (
            <MotiView
              key="empty"
              from={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'timing', duration: 280 }}
            >
              <SoftCard variant="inset" radius={radii.card} padding={28} style={{ marginTop: 6 }}>
                <View className="items-center">
                  <Neumorph variant="raised" radius={999} intensity="sm" padding={18} surface={colors.canvas}>
                    <Icon name="search" size={26} color="textSubtle" strokeWidth={2} />
                  </Neumorph>
                  <AppText variant="subheading" weight="bold" style={{ marginTop: 16 }}>
                    Nothing here yet
                  </AppText>
                  <AppText
                    variant="caption"
                    color={colors.textMuted}
                    style={{ marginTop: 6, textAlign: 'center', maxWidth: 260 }}
                  >
                    No saved links match this filter. Try a different type, clear the search, or add a new
                    resource.
                  </AppText>
                  <PillButton
                    label="Add a resource"
                    variant="yellow"
                    size="sm"
                    onPress={() => setSheetOpen(true)}
                    style={{ marginTop: 18 }}
                    icon={<Icon name="plus" size={16} color="carbon" strokeWidth={2.6} />}
                  />
                </View>
              </SoftCard>
            </MotiView>
          ) : (
            <View key="list">
              {filtered.map((r, i) => (
                <ResourceCard
                  key={r.id}
                  resource={r}
                  index={i}
                  onOpen={openResource}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </View>
          )}
        </AnimatePresence>
      </ScrollView>

      {/* ---------- Add FAB ---------- */}
      <MotiView
        from={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 16, stiffness: 220, delay: 280 }}
        style={{ position: 'absolute', right: 22, bottom: insets.bottom + 22 }}
      >
        <Pressable
          onPress={() => setSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Add a resource"
        >
          <Neumorph variant="raised" radius={999} intensity="md" surface={colors.highlighter}>
            <View style={{ width: 60, height: 60, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={28} color="carbon" strokeWidth={2.6} />
            </View>
          </Neumorph>
        </Pressable>
      </MotiView>

      {/* ---------- Add sheet ---------- */}
      <AddResourceSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} onAdd={addResource} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Small stat pill                                                     */
/* ------------------------------------------------------------------ */

function StatPill({
  icon,
  label,
  value,
  accent,
}: {
  icon: IconName;
  label: string;
  value: number;
  accent: Accent;
}) {
  return (
    <View style={{ flex: 1 }}>
      <SoftCard variant="raised" radius={20} intensity="sm" padding={12}>
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <Icon name={icon} size={16} color={accent} strokeWidth={2.2} />
          <View>
            <AppText variant="subheading" weight="bold" style={{ fontSize: 18, lineHeight: 22 }}>
              {value}
            </AppText>
            <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 11 }}>
              {label}
            </AppText>
          </View>
        </View>
      </SoftCard>
    </View>
  );
}
