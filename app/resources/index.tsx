/**
 * Resource library (Kivo).
 *
 * A saved-links workspace wired to the live `/resources` endpoint via
 * `useResources()`. Warm-editorial + flat: a count eyebrow + serif title, a
 * search field, a flat-Chip type filter, and white Cards (hairline + one soft
 * shadow) — each leads with a rounded wash icon tile colored to its type.
 * Tapping a card opens the URL; a small star toggles a favorite locally. ONE
 * terracotta CTA. Loading / error / empty states come from the query flags so a
 * failed request never crashes. Fully theme-aware via useTheme() + entrance.
 *
 * Favoriting is a local-only optimistic override layered on the fetched list.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, Linking, RefreshControl } from 'react-native';
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

import { radii, motion, interaction, pressOpacity, toneAt } from '@/theme/tokens';
import { useTheme } from '@/theme';
import { useResources } from '@/hooks/api';
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

type Filter = 'all' | ResourceType;

/** Strip protocol / path down to a friendly host. */
function hostOf(url: string): string {
  const m = url.match(/^[a-z]+:\/\/(?:www\.)?([^/]+)/i);
  return m ? m[1] : url;
}

/* ------------------------------------------------------------------ */
/* Resource card                                                       */
/* ------------------------------------------------------------------ */

function ResourceCard({
  resource,
  onOpen,
  onToggleFavorite,
  toneIndex,
  index,
}: {
  resource: Resource;
  onOpen: (r: Resource) => void;
  onToggleFavorite: (id: string) => void;
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
        accessibilityRole="link"
        accessibilityLabel={`Open ${resource.title}`}
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
                  onPress={() => onToggleFavorite(resource.id)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={resource.favorite ? 'Unstar' : 'Star'}
                  style={({ pressed }) => ({ opacity: pressOpacity({ pressed }) })}
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

  // Local favorite overrides (id -> favorite) layered over fetched data.
  const [favOverrides, setFavOverrides] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const resources = useMemo<Resource[]>(() => {
    const list = Array.isArray(data) ? data.filter(Boolean) : [];
    return list.map((r) => (r.id in favOverrides ? { ...r, favorite: favOverrides[r.id] } : r));
  }, [data, favOverrides]);

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

  const toggleFavorite = useCallback(
    (id: string) => {
      setFavOverrides((prev) => {
        const current = prev[id];
        const base = resources.find((r) => r.id === id)?.favorite ?? false;
        const next = current === undefined ? !base : !current;
        return { ...prev, [id]: next };
      });
    },
    [resources],
  );

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
        <AppHeader onBack={() => router.back()} />
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
          <CenterNote
            icon="book-open"
            title={hasFilters ? 'Nothing matches' : 'No resources yet'}
            body={
              hasFilters
                ? 'No saved links match this filter. Try a different type or clear the search.'
                : 'Save your first link — a course sheet, a playlist, a deep-dive article.'
            }
            action={hasFilters ? <TextLink label="Clear filters" onPress={resetFilters} /> : undefined}
          />
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
                onToggleFavorite={toggleFavorite}
                toneIndex={i}
                index={i}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
