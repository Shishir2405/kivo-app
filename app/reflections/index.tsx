/**
 * Reflections — daily journal list (STEEP).
 *
 * Wired to the live `/reflections` endpoint via `useReflections()`. Editorial +
 * flat: a serif title, an Apricot-wash "this week" summary, a search field and
 * compact white entry Cards (Dove hairline + one subtle shadow). Each row pushes
 * to /reflections/[date] for the full end-of-day form. ONE Ink pill CTA (Write
 * today). Loading / error / empty states come from the query flags so a failed
 * request never crashes the app.
 */
import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui/Typography';
import { SoftCard, WarmCard } from '@/components/ui/SoftCard';
import { SoftInput } from '@/components/ui/SoftInput';
import { Tag } from '@/components/ui/Tag';
import { PillButton, TextLink } from '@/components/ui/PillButton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { AppHeader } from '@/components/ui/AppHeader';

import { colors, radii } from '@/theme/tokens';
import { TODAY } from '@/data/mock';
import { useReflections } from '@/hooks/api';
import type { Reflection } from '@/types/models';
import {
  MOODS,
  moodMeta,
  moodScore,
  journalForDay,
  relativeDay,
  shortDate,
  weekdayShort,
  dayOfMonth,
} from '@/components/reflections/shared';

/* ------------------------------------------------------------------ */
/* Summary (Apricot wash)                                              */
/* ------------------------------------------------------------------ */

function SummaryCard({ reflections }: { reflections: Reflection[] }) {
  const count = reflections.length;
  if (count === 0) return null;

  const avgMoodScore = reflections.reduce((a, r) => a + moodScore(r.mood), 0) / count;
  const nearest = MOODS.reduce((best, m) =>
    Math.abs(moodScore(m.mood) - avgMoodScore) < Math.abs(moodScore(best.mood) - avgMoodScore) ? m : best,
  );

  const dist = MOODS.map((m) => ({
    meta: m,
    n: reflections.filter((r) => r.mood === m.mood).length,
  })).filter((d) => d.n > 0);

  return (
    <WarmCard radius={radii.cardLg} padding={16} style={{ marginBottom: 16 }}>
      <View className="flex-row items-center justify-between">
        <AppText variant="caption" color={colors.rust} style={{ letterSpacing: 0.6, textTransform: 'uppercase' }}>
          This week
        </AppText>
        <Tag label={moodMeta(nearest.mood).label} tone="rust" size="sm" />
      </View>

      <View className="flex-row items-baseline" style={{ gap: 6, marginTop: 10 }}>
        <AppText variant="headingLg" display weight="semibold">
          {count}
        </AppText>
        <AppText variant="caption" color={colors.ash}>
          {count === 1 ? 'entry' : 'entries'} logged
        </AppText>
      </View>

      <View className="flex-row flex-wrap" style={{ gap: 12, marginTop: 12 }}>
        {dist.map((d) => (
          <View key={d.meta.mood} className="flex-row items-center" style={{ gap: 5 }}>
            <Icon name={d.meta.icon} size={13} color="rust" />
            <AppText variant="caption" color={colors.ash}>
              {d.meta.label} · {d.n}
            </AppText>
          </View>
        ))}
      </View>
    </WarmCard>
  );
}

/* ------------------------------------------------------------------ */
/* Entry row                                                           */
/* ------------------------------------------------------------------ */

function EntryRow({ reflection, onPress }: { reflection: Reflection; onPress: () => void }) {
  const meta = moodMeta(reflection.mood);
  const journal = journalForDay(reflection.date);

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Reflection for ${shortDate(reflection.date)}`}>
      <SoftCard radius={radii.card} padding={14} style={{ marginBottom: 10 }}>
        <View className="flex-row" style={{ gap: 12 }}>
          {/* Date chip */}
          <View
            style={{
              width: 50,
              borderRadius: radii.sm,
              backgroundColor: colors.fog,
              borderWidth: 1,
              borderColor: colors.dove,
              paddingVertical: 8,
              alignItems: 'center',
            }}
          >
            <AppText variant="caption" color={colors.graphite} style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {weekdayShort(reflection.date)}
            </AppText>
            <AppText variant="heading" display weight="medium">
              {dayOfMonth(reflection.date)}
            </AppText>
          </View>

          {/* Body */}
          <View style={{ flex: 1 }}>
            <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
              <View className="flex-row items-center" style={{ gap: 6, flexShrink: 1 }}>
                <Icon name={meta.icon} size={14} color="graphite" />
                <AppText variant="caption" color={colors.graphite} numberOfLines={1}>
                  {meta.label} · {relativeDay(reflection.date, TODAY)}
                </AppText>
              </View>
              <Icon name="chevron-right" size={15} color="dove" />
            </View>

            <AppText variant="body" color={colors.ash} numberOfLines={2} style={{ marginTop: 5 }}>
              {reflection.note}
            </AppText>

            {reflection.win ? (
              <View className="flex-row items-start" style={{ gap: 5, marginTop: 7 }}>
                <Icon name="sparkles" size={12} color="rust" />
                <AppText variant="caption" color={colors.graphite} numberOfLines={1} style={{ flex: 1 }}>
                  {reflection.win}
                </AppText>
              </View>
            ) : null}

            {journal ? (
              <View className="flex-row" style={{ gap: 8, marginTop: 8 }}>
                <Tag label={`Focus ${journal.focus}`} tone="warm" size="sm" />
                <Tag label={`${journal.goalsCompleted.length} goals`} tone="neutral" size="sm" />
              </View>
            ) : null}
          </View>
        </View>
      </SoftCard>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* State block                                                         */
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

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function ReflectionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState('');

  const { data, isLoading, isError, error, refetch, isFetching } = useReflections();

  const reflections = useMemo<Reflection[]>(
    () =>
      (Array.isArray(data) ? data.filter(Boolean) : []).slice().sort((a, b) => (a.date < b.date ? 1 : -1)),
    [data],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reflections;
    return reflections.filter((r) => {
      const j = journalForDay(r.date);
      const hay = [r.note, r.win, j?.learned, j?.challenged, j?.tomorrowPlan, moodMeta(r.mood).label, shortDate(r.date)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [reflections, query]);

  const todayHasEntry = reflections.some((r) => r.date === TODAY);

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
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
            tintColor={colors.graphite}
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-end justify-between" style={{ marginBottom: 16 }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <AppText variant="display" display weight="semibold">
              Reflections
            </AppText>
            <AppText variant="body" color={colors.ash} style={{ marginTop: 4 }}>
              {isError ? 'Couldn’t load your journal' : 'A short end-of-day review'}
            </AppText>
          </View>
          {!todayHasEntry ? (
            <PillButton
              label="Write"
              size="sm"
              onPress={() => router.push(`/reflections/${TODAY}`)}
              icon={<Icon name="pen" size={14} color="white" />}
            />
          ) : null}
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
          <SoftCard variant="inset" radius={radii.cardLg} padding={28}>
            <View style={{ alignItems: 'center', gap: 12 }}>
              <ActivityIndicator color={colors.ink} />
              <AppText variant="caption" color={colors.graphite}>
                Loading your reflections…
              </AppText>
            </View>
          </SoftCard>
        ) : (
          <>
            <SummaryCard reflections={reflections} />

            {reflections.length > 0 ? (
              <SoftInput
                placeholder="Search reflections"
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                leading={<Icon name="search" size={16} color="graphite" />}
                trailing={
                  query.length > 0 ? (
                    <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
                      <Icon name="x-circle" size={16} color="graphite" />
                    </Pressable>
                  ) : undefined
                }
                containerStyle={{ marginBottom: 14 }}
              />
            ) : null}

            {filtered.length > 0 ? (
              filtered.map((r) => (
                <EntryRow key={r.id} reflection={r} onPress={() => router.push(`/reflections/${r.date}`)} />
              ))
            ) : reflections.length === 0 ? (
              <CenterNote
                icon="book"
                title="No reflections yet"
                body="Capture what you learned today while it’s fresh — the learning compounds."
                action={
                  <TextLink
                    label="Write today"
                    onPress={() => router.push(`/reflections/${TODAY}`)}
                    icon={<Icon name="pen" size={14} color="ink" />}
                  />
                }
              />
            ) : (
              <CenterNote
                icon="search"
                title="No matches"
                body={`Nothing matches “${query.trim()}”. Try a different word.`}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
