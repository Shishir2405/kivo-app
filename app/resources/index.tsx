/**
 * Resource library (Kivo).
 *
 * A saved-links workspace wired to the live `/resources` endpoint via
 * `useResources()`. Warm-editorial + flat: a count eyebrow + serif title, a
 * search field, a flat-Chip type filter, and white Cards (hairline + one soft
 * shadow) — each leads with a rounded wash icon tile colored to its type.
 * Tapping a card opens the URL; long-press edits; a small star toggles favorite.
 *
 * Full CRUD: create (header "+", quick-add row, empty-state CTA), edit
 * (long-press a card → the shared FormSheet), and delete (Alert confirm from
 * the edit sheet). The star toggle PERSISTS via useToggleResourceFavorite().
 * Loading / error / empty states come from the query flags so a failed request
 * never crashes. Fully theme-aware via useTheme() + entrance.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, Linking, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard, WarmCard, CoolCard } from '@/components/ui/SoftCard';
import { SoftInput } from '@/components/ui/SoftInput';
import { Chip } from '@/components/ui/Chip';
import { Tag } from '@/components/ui/Tag';
import { TextLink } from '@/components/ui/PillButton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { AppHeader } from '@/components/ui/AppHeader';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { FormSheet } from '@/components/ui/FormSheet';
import { AddButton, QuickAddRow, EmptyStateCTA } from '@/components/ui/AddButton';
import { Select, type SelectOption } from '@/components/ui/Select';

import { radii, motion, interaction, pressOpacity, toneAt } from '@/theme/tokens';
import { useTheme } from '@/theme';
import {
  useResources,
  useCreateResource,
  useUpdateResource,
  useDeleteResource,
  useToggleResourceFavorite,
} from '@/hooks/api';
import type { Resource, ResourceType } from '@/types/models';

/* ------------------------------------------------------------------ */
/* Type metadata                                                       */
/* ------------------------------------------------------------------ */

const TYPE_META: Record<ResourceType, { label: string; icon: IconName }> = {
  youtube: { label: 'Video', icon: 'play' },
  playlist: { label: 'Playlist', icon: 'list' },
  article: { label: 'Article', icon: 'file-text' },
  documentation: { label: 'Docs', icon: 'book-open' },
  github: { label: 'Repo', icon: 'code-xml' },
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

/** Type options for the create / edit Select. */
const TYPE_SELECT_OPTIONS: SelectOption<ResourceType>[] = TYPE_ORDER.map((t) => ({
  label: TYPE_META[t].label,
  value: t,
  icon: TYPE_META[t].icon,
}));

type Filter = 'all' | ResourceType;

/** Strip protocol / path down to a friendly host. */
function hostOf(url: string): string {
  const m = url.match(/^[a-z]+:\/\/(?:www\.)?([^/]+)/i);
  return m ? m[1] : url;
}

/* ------------------------------------------------------------------ */
/* Validation — mirrors backend createResourceSchema                   */
/* (resources.validator.ts): title req min1 max200, url req valid URL, */
/* description optional max2000.                                        */
/* ------------------------------------------------------------------ */

const RESOURCE_LIMITS = {
  TITLE_MAX: 200,
  DESCRIPTION_MAX: 2000,
  TOPIC_MAX: 200,
  SOURCE_MAX: 200,
} as const;

/**
 * Matches the backend `z.string().url()` semantics (requires a protocol).
 * Uses the WHATWG URL parser when available and falls back to a regex so the
 * check is reliable regardless of the Hermes URL polyfill.
 */
function isValidUrl(value: string): boolean {
  if (!/^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(value)) return false;
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return true;
  } catch {
    // URL ctor missing/incomplete — the regex above already vouched for it.
    return true;
  }
}

type ResourceFieldErrors = {
  title?: string;
  url?: string;
  topic?: string;
  source?: string;
  description?: string;
};

/** Validate the resource form; returns a map of field → message. */
function validateResource(values: {
  title: string;
  url: string;
  topic: string;
  source: string;
  description: string;
}): ResourceFieldErrors {
  const errs: ResourceFieldErrors = {};
  const title = values.title.trim();
  const url = values.url.trim();
  const topic = values.topic.trim();
  const source = values.source.trim();
  const description = values.description.trim();

  if (!title) errs.title = 'Title is required';
  else if (title.length > RESOURCE_LIMITS.TITLE_MAX)
    errs.title = `Title must be at most ${RESOURCE_LIMITS.TITLE_MAX} characters`;

  if (!url) errs.url = 'URL is required';
  else if (!isValidUrl(url)) errs.url = 'Enter a valid URL (https://…)';

  // Topic is sent as a free string (defaults to "General" when blank).
  if (topic.length > RESOURCE_LIMITS.TOPIC_MAX)
    errs.topic = `Topic must be at most ${RESOURCE_LIMITS.TOPIC_MAX} characters`;

  if (source.length > RESOURCE_LIMITS.SOURCE_MAX)
    errs.source = `Source must be at most ${RESOURCE_LIMITS.SOURCE_MAX} characters`;

  if (description.length > RESOURCE_LIMITS.DESCRIPTION_MAX)
    errs.description = `Description must be at most ${RESOURCE_LIMITS.DESCRIPTION_MAX} characters`;

  return errs;
}

/* ------------------------------------------------------------------ */
/* Resource card                                                       */
/* ------------------------------------------------------------------ */

function ResourceCard({
  resource,
  onOpen,
  onEdit,
  onToggleFavorite,
  favoritePending,
  toneIndex,
  index,
}: {
  resource: Resource;
  onOpen: (r: Resource) => void;
  onEdit: (r: Resource) => void;
  onToggleFavorite: (r: Resource) => void;
  favoritePending: boolean;
  toneIndex: number;
  index: number;
}) {
  const { colors, toneStyle } = useTheme();
  const meta = TYPE_META[resource.type];
  const ts = toneStyle(toneAt(toneIndex));

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: motion.duration.transition, delay: Math.min(index, 8) * 45 }}
    >
      <Pressable
        onPress={() => onOpen(resource)}
        onLongPress={() => onEdit(resource)}
        delayLongPress={300}
        accessibilityRole="link"
        accessibilityLabel={`Open ${resource.title}. Long-press to edit.`}
        style={({ pressed }) => ({
          opacity: pressOpacity({ pressed }, { solid: true }),
          transform: [{ scale: pressed ? interaction.pressScale : 1 }],
        })}
      >
        <SoftCard radius={radii.card} padding={14} style={{ marginBottom: 10 }}>
          <View className="flex-row items-center" style={{ gap: 12 }}>
            {/* Rounded wash icon tile, colored to its type */}
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: ts.bg,
                borderWidth: 1,
                borderColor: ts.border,
              }}
            >
              <Icon name={resource.icon ?? meta.icon} size={18} color={ts.accent} />
            </View>

            <View style={{ flex: 1 }}>
              <View className="flex-row items-start justify-between" style={{ gap: 10 }}>
                <AppText
                  variant="subheading"
                  weight="semibold"
                  color={colors.ink}
                  numberOfLines={2}
                  style={{ flex: 1 }}
                >
                  {resource.title}
                </AppText>
                <Pressable
                  onPress={() => onToggleFavorite(resource)}
                  disabled={favoritePending}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={resource.favorite ? 'Unstar' : 'Star'}
                  style={({ pressed }) => ({ opacity: pressOpacity({ pressed }, { disabled: favoritePending }) })}
                >
                  <Icon
                    name="star"
                    size={17}
                    color={resource.favorite ? colors.primary : colors.hairline}
                    weight={resource.favorite ? 'fill' : 'regular'}
                  />
                </Pressable>
              </View>

              {/* Source / type / host */}
              <AppText variant="caption" color={colors.muted} numberOfLines={1} style={{ marginTop: 3 }}>
                {resource.source ? `${resource.source} · ` : ''}
                {resource.duration ? `${meta.label} · ${resource.duration}` : meta.label}
              </AppText>
            </View>
          </View>

          {resource.description ? (
            <AppText variant="body" color={colors.muted} numberOfLines={2} style={{ marginTop: 10 }}>
              {resource.description}
            </AppText>
          ) : null}

          {/* Footer */}
          <View className="flex-row items-center flex-wrap" style={{ gap: 8, marginTop: 10 }}>
            <Tag label={resource.topic} tone="neutral" size="sm" />
            {resource.completed ? (
              <View className="flex-row items-center" style={{ gap: 4 }}>
                <Icon name="check-circle" size={13} color={colors.success} weight="fill" />
                <AppText variant="caption" color={colors.muted}>
                  Done
                </AppText>
              </View>
            ) : null}
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={() => onEdit(resource)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${resource.title}`}
              style={({ pressed }) => ({
                opacity: pressOpacity({ pressed }),
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              })}
            >
              <Icon name="pen" size={13} color={colors.muted} />
              <AppText variant="caption" color={colors.muted}>
                Edit
              </AppText>
            </Pressable>
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
  tone = 'lavender',
  action,
}: {
  icon: IconName;
  title: string;
  body: string;
  tone?: 'sky' | 'peach' | 'mint' | 'lavender' | 'default';
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
      {[0, 1, 2, 3].map((i) => (
        <SoftCard key={i} radius={radii.card} padding={14} style={{ marginBottom: 10 }}>
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <Skeleton width={40} height={40} radius={11} />
            <View style={{ flex: 1 }}>
              <Skeleton width="70%" height={14} radius={7} style={{ marginBottom: 6 }} />
              <Skeleton width="45%" height={11} radius={6} />
            </View>
          </View>
        </SoftCard>
      ))}
      <AppText variant="caption" color={colors.muted} style={{ textAlign: 'center', marginTop: 4 }}>
        Loading your library…
      </AppText>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Wash stat figure                                                    */
/* ------------------------------------------------------------------ */

function StatFigure({ value, label, accent }: { value: number; label: string; accent: string }) {
  const { colors } = useTheme();
  return (
    <>
      <AppText variant="headingLg" display weight="semibold" color={accent}>
        {value}
      </AppText>
      <AppText variant="caption" color={colors.muted} style={{ marginTop: 2 }}>
        {label}
      </AppText>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function ResourcesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();

  const { data, isLoading, isError, error, refetch, isFetching } = useResources();

  const createResource = useCreateResource();
  const updateResource = useUpdateResource();
  const deleteResource = useDeleteResource();
  const toggleFav = useToggleResourceFavorite();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Create / edit sheet state. `editing` null ⇒ creating; otherwise editing it.
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [fTitle, setFTitle] = useState('');
  const [fUrl, setFUrl] = useState('');
  const [fType, setFType] = useState<ResourceType>('article');
  const [fTopic, setFTopic] = useState('');
  const [fSource, setFSource] = useState('');
  const [fDescription, setFDescription] = useState('');
  const [formErr, setFormErr] = useState('');
  const [fieldErrs, setFieldErrs] = useState<ResourceFieldErrors>({});
  // Id whose star toggle is in flight, so we only disable that one card.
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const resources = useMemo<Resource[]>(
    () => (Array.isArray(data) ? data.filter(Boolean) : []),
    [data],
  );

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

  const openResource = useCallback((r: Resource) => {
    Linking.openURL(r.url).catch(() => {
      /* swallow — invalid / unsupported URL */
    });
  }, []);

  // Persist the star via the dedicated PATCH hook (no more local-only override).
  const toggleFavorite = useCallback(
    (r: Resource) => {
      setTogglingId(r.id);
      toggleFav.mutate(
        { id: r.id, favorite: !r.favorite },
        { onSettled: () => setTogglingId(null) },
      );
    },
    [toggleFav],
  );

  const resetSheet = useCallback(() => {
    setEditing(null);
    setFTitle('');
    setFUrl('');
    setFType('article');
    setFTopic('');
    setFSource('');
    setFDescription('');
    setFormErr('');
    setFieldErrs({});
    createResource.reset();
    updateResource.reset();
  }, [createResource, updateResource]);

  const openCreate = useCallback(() => {
    resetSheet();
    setSheetOpen(true);
  }, [resetSheet]);

  const openEdit = useCallback((r: Resource) => {
    setEditing(r);
    setFTitle(r.title);
    setFUrl(r.url);
    setFType(r.type);
    setFTopic(r.topic);
    setFSource(r.source ?? '');
    setFDescription(r.description ?? '');
    setFormErr('');
    setFieldErrs({});
    createResource.reset();
    updateResource.reset();
    setSheetOpen(true);
  }, [createResource, updateResource]);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
  }, []);

  const submitSheet = useCallback(() => {
    const errs = validateResource({
      title: fTitle,
      url: fUrl,
      topic: fTopic,
      source: fSource,
      description: fDescription,
    });
    if (Object.keys(errs).length > 0) {
      setFieldErrs(errs);
      return;
    }
    setFieldErrs({});
    setFormErr('');

    const title = fTitle.trim();
    const url = fUrl.trim();
    const topic = fTopic.trim() || 'General';
    const source = fSource.trim();
    const description = fDescription.trim();

    if (editing) {
      updateResource.mutate(
        {
          id: editing.id,
          patch: {
            title,
            url,
            type: fType,
            topic,
            source: source || undefined,
            description: description || undefined,
          },
        },
        {
          onSuccess: () => {
            setSheetOpen(false);
            resetSheet();
          },
          onError: (e) => setFormErr(e.message),
        },
      );
    } else {
      createResource.mutate(
        {
          title,
          url,
          type: fType,
          topic,
          source: source || undefined,
          description: description || undefined,
        },
        {
          onSuccess: () => {
            setSheetOpen(false);
            resetSheet();
          },
          onError: (e) => setFormErr(e.message),
        },
      );
    }
  }, [fTitle, fUrl, fType, fTopic, fSource, fDescription, editing, updateResource, createResource, resetSheet]);

  const confirmDelete = useCallback(() => {
    if (!editing) return;
    const target = editing;
    Alert.alert(
      'Delete resource?',
      `"${target.title}" will be removed from your library.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteResource.mutate(target.id, {
              onSuccess: () => {
                setSheetOpen(false);
                resetSheet();
              },
              onError: (e) => setFormErr(e.message),
            });
          },
        },
      ],
    );
  }, [editing, deleteResource, resetSheet]);

  const resetFilters = () => {
    setFilter('all');
    setFavoritesOnly(false);
    setQuery('');
  };

  const filterChips: { value: Filter; label: string; icon?: IconName }[] = [
    { value: 'all', label: 'All', icon: 'layers' },
    ...TYPE_ORDER.filter((t) => counts[t] > 0).map((t) => ({
      value: t as Filter,
      label: TYPE_META[t].label,
      icon: TYPE_META[t].icon,
    })),
  ];

  const hasFilters = filter !== 'all' || favoritesOnly || query.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={{ paddingHorizontal: 20 }}>
        <AppHeader
          onBack={() => router.back()}
          right={<AddButton onPress={openCreate} accessibilityLabel="Add a resource" />}
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
        {/* Header */}
        <View>
          <View style={{ marginBottom: 16 }}>
            <AppText variant="caption" weight="medium" color={colors.muted}>
              {isError ? 'Couldn’t load your library' : `${resources.length} saved`}
            </AppText>
            <AppText variant="display" display weight="semibold" color={colors.ink} style={{ marginTop: 2 }}>
              Resources
            </AppText>
          </View>

          {/* Wash stat pair */}
          {!isError ? (
            <View className="flex-row" style={{ gap: 10, marginBottom: 16 }}>
              <WarmCard style={{ flex: 1 }} padding={14}>
                {({ accent }) => <StatFigure value={favoriteCount} label="Starred" accent={accent} />}
              </WarmCard>
              <CoolCard style={{ flex: 1 }} padding={14}>
                {({ accent }) => <StatFigure value={completedCount} label="Completed" accent={accent} />}
              </CoolCard>
            </View>
          ) : null}

          {/* Search */}
          <SoftInput
            key="resources-search"
            placeholder="Search links, topics, sources…"
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
                  hitSlop={8}
                  accessibilityLabel="Clear search"
                  style={({ pressed }) => ({ opacity: pressOpacity({ pressed }) })}
                >
                  <Icon name="x-circle" size={16} color={colors.muted} />
                </Pressable>
              ) : undefined
            }
            containerStyle={{ marginBottom: 12 }}
          />

          {/* Type filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 10 }}
          >
            {filterChips.map((c) => (
              <Chip
                key={c.value}
                label={c.label}
                icon={c.icon}
                selected={filter === c.value}
                onPress={() => setFilter(c.value)}
              />
            ))}
          </ScrollView>

          {/* Favorites toggle + reset */}
          <View className="flex-row items-center justify-between" style={{ marginBottom: 12 }}>
            <Chip
              label="Starred only"
              icon="star"
              selected={favoritesOnly}
              onPress={() => setFavoritesOnly((v) => !v)}
            />
            {hasFilters ? <TextLink label="Reset" onPress={resetFilters} size="sm" muted /> : null}
          </View>
        </View>

        {/* States */}
        {isError ? (
          <CenterNote
            icon="alert"
            tone="peach"
            title="Something went wrong"
            body={error?.message ?? 'We couldn’t reach the server. Pull to refresh or try again.'}
            action={<TextLink label="Try again" onPress={() => void refetch()} icon={<Icon name="repeat" size={14} color={colors.ink} />} />}
          />
        ) : isLoading ? (
          <LoadingBlock />
        ) : filtered.length === 0 ? (
          hasFilters ? (
            <CenterNote
              icon="book-open"
              title="Nothing matches"
              body="No saved links match this filter. Try a different type or clear the search."
              action={<TextLink label="Clear filters" onPress={resetFilters} />}
            />
          ) : (
            <EmptyStateCTA
              icon="book-open"
              title="No resources yet"
              description="Save your first link — a course sheet, a playlist, a deep-dive article."
              actionLabel="Add a resource"
              onAction={openCreate}
            />
          )
        ) : (
          <>
            <AppText variant="caption" color={colors.muted} style={{ marginBottom: 10 }}>
              {filtered.length} {filtered.length === 1 ? 'resource' : 'resources'}
            </AppText>
            {filtered.map((r, i) => (
              <ResourceCard
                key={r.id}
                resource={r}
                onOpen={openResource}
                onEdit={openEdit}
                onToggleFavorite={toggleFavorite}
                favoritePending={togglingId === r.id}
                toneIndex={i}
                index={i}
              />
            ))}
            {/* Inline quick-add at the foot of the list. */}
            <QuickAddRow
              onPress={openCreate}
              label="Add a resource"
              style={{ marginTop: 4 }}
            />
          </>
        )}
      </ScrollView>

      {/* Create / edit sheet */}
      <FormSheet
        visible={sheetOpen}
        onClose={closeSheet}
        onSubmit={submitSheet}
        title={editing ? 'Edit resource' : 'New resource'}
        subtitle={editing ? 'Update this saved link.' : 'Save a link to your library.'}
        submitLabel={editing ? 'Save changes' : 'Add resource'}
        pending={createResource.isPending || updateResource.isPending || deleteResource.isPending}
        submitDisabled={
          Object.keys(
            validateResource({
              title: fTitle,
              url: fUrl,
              topic: fTopic,
              source: fSource,
              description: fDescription,
            }),
          ).length > 0
        }
        error={formErr || createResource.error?.message || updateResource.error?.message || null}
      >
        <SoftInput
          label="Title"
          placeholder="e.g. Graphs — full playlist"
          value={fTitle}
          onChangeText={(v) => {
            setFTitle(v);
            if (fieldErrs.title) setFieldErrs((p) => ({ ...p, title: undefined }));
          }}
          autoCapitalize="sentences"
          maxLength={RESOURCE_LIMITS.TITLE_MAX}
          error={fieldErrs.title}
        />
        <SoftInput
          label="Link URL"
          placeholder="https://…"
          value={fUrl}
          onChangeText={(v) => {
            setFUrl(v);
            if (fieldErrs.url) setFieldErrs((p) => ({ ...p, url: undefined }));
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          leading={<Icon name="link" size={16} color={colors.muted} />}
          error={fieldErrs.url}
        />

        <View>
          <AppText variant="overline" uppercase weight="semibold" color={colors.muted} style={{ marginBottom: 8 }}>
            Type
          </AppText>
          <Select<ResourceType>
            options={TYPE_SELECT_OPTIONS}
            value={fType}
            onChange={setFType}
            title="Choose a type"
            placeholder="Choose a type"
          />
        </View>

        <SoftInput
          label="Topic"
          placeholder="e.g. Graphs, System Design"
          value={fTopic}
          onChangeText={(v) => {
            setFTopic(v);
            if (fieldErrs.topic) setFieldErrs((p) => ({ ...p, topic: undefined }));
          }}
          autoCapitalize="words"
          maxLength={RESOURCE_LIMITS.TOPIC_MAX}
          leading={<Icon name="tag" size={16} color={colors.muted} />}
          error={fieldErrs.topic}
        />
        <SoftInput
          label="Source (optional)"
          placeholder="e.g. takeUforward"
          value={fSource}
          onChangeText={(v) => {
            setFSource(v);
            if (fieldErrs.source) setFieldErrs((p) => ({ ...p, source: undefined }));
          }}
          autoCapitalize="words"
          maxLength={RESOURCE_LIMITS.SOURCE_MAX}
          error={fieldErrs.source}
        />
        <SoftInput
          label="Description (optional)"
          placeholder="A one-line note about this link…"
          value={fDescription}
          onChangeText={(v) => {
            setFDescription(v);
            if (fieldErrs.description) setFieldErrs((p) => ({ ...p, description: undefined }));
          }}
          autoCapitalize="sentences"
          maxLength={RESOURCE_LIMITS.DESCRIPTION_MAX}
          error={fieldErrs.description}
        />

        {editing ? (
          <View style={{ alignItems: 'flex-start' }}>
            <TextLink
              label="Delete resource"
              onPress={confirmDelete}
              icon={<Icon name="trash" size={14} color={colors.danger} />}
            />
          </View>
        ) : null}
      </FormSheet>
    </View>
  );
}
