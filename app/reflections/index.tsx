/**
 * Reflections — daily journal list (Kivo).
 *
 * Wired to the live `/reflections` endpoint via `useReflections()`. Warm-
 * editorial + flat: a count eyebrow + serif title, a peach-wash "this week"
 * summary, a search field and compact entry Cards with a quiet date chip. Each
 * row pushes to /reflections/[date] for the full end-of-day form. ONE terracotta
 * CTA (Write). Loading / error / empty states come from the query flags so a
 * failed request never crashes the app. Theme-aware via useTheme() + entrance.
 */
import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard, WarmCard } from '@/components/ui/SoftCard';
import { SoftInput } from '@/components/ui/SoftInput';
import { Tag } from '@/components/ui/Tag';
import { PillButton, TextLink } from '@/components/ui/PillButton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { AppHeader } from '@/components/ui/AppHeader';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';

import { radii, motion, interaction, pressOpacity } from '@/theme/tokens';
import { useTheme } from '@/theme';
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
/* Summary (peach wash)                                                */
/* ------------------------------------------------------------------ */

function SummaryCard({ reflections }: { reflections: Reflection[] }) {
  const { colors } = useTheme();
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
      {({ accent }) => (
        <>
          <View className="flex-row items-center justify-between">
            <AppText variant="overline" uppercase weight="bold" color={accent}>
              This week
            </AppText>
            <Tag label={moodMeta(nearest.mood).label} tone="warm" size="sm" />
          </View>

          <View className="flex-row items-baseline" style={{ gap: 6, marginTop: 10 }}>
            <AppText variant="headingLg" display weight="semibold" color={accent}>
              {count}
            </AppText>
            <AppText variant="caption" color={accent} style={{ opacity: 0.85 }}>
              {count === 1 ? 'entry' : 'entries'} logged
            </AppText>
          </View>

          <View className="flex-row flex-wrap" style={{ gap: 12, marginTop: 12 }}>
            {dist.map((d) => (
              <View key={d.meta.mood} className="flex-row items-center" style={{ gap: 5 }}>
                <Icon name={d.meta.icon} size={13} color={accent} />
                <AppText variant="caption" color={accent} style={{ opacity: 0.85 }}>
                  {d.meta.label} · {d.n}
                </AppText>
              </View>
            ))}
          </View>
        </>
      )}
    </WarmCard>
  );
}

/* ------------------------------------------------------------------ */
/* Entry row                                                           */
/* ------------------------------------------------------------------ */

function EntryRow({ reflection, onPress, index }: { reflection: Reflection; onPress: () => void; index: number }) {
  const { colors } = useTheme();
  const meta = moodMeta(reflection.mood);
  const journal = journalForDay(reflection.date);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: motion.duration.transition, delay: Math.min(index, 8) * 45 }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Reflection for ${shortDate(reflection.date)}`}
        style={({ pressed }) => ({
          opacity: pressOpacity({ pressed }, { solid: true }),
          transform: [{ scale: pressed ? interaction.pressScale : 1 }],
        })}
      >
        <SoftCard radius={radii.card} padding={14} style={{ marginBottom: 10 }}>
          <View className="flex-row" style={{ gap: 12 }}>
            {/* Date chip */}
            <View
              style={{
                width: 50,
                borderRadius: radii.sm,
                backgroundColor: colors.surfaceAlt,
                borderWidth: 1,
                borderColor: colors.hairline,
                paddingVertical: 8,
                alignItems: 'center',
              }}
            >
              <AppText variant="overline" uppercase color={colors.muted}>
                {weekdayShort(reflection.date)}
              </AppText>
              <AppText variant="heading" display weight="medium" color={colors.ink}>
                {dayOfMonth(reflection.date)}
              </AppText>
            </View>

            {/* Body */}
            <View style={{ flex: 1 }}>
              <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
                <View className="flex-row items-center" style={{ gap: 6, flexShrink: 1 }}>
                  <Icon name={meta.icon} size={14} color={colors.muted} />
                  <AppText variant="caption" color={colors.muted} numberOfLines={1}>
                    {meta.label} · {relativeDay(reflection.date, TODAY)}
                  </AppText>
                </View>
                <Icon name="chevron-right" size={15} color={colors.hairline} />
              </View>

              <AppText variant="body" color={colors.ink} numberOfLines={2} style={{ marginTop: 5 }}>
                {reflection.note}
              </AppText>

              {reflection.win ? (
                <View className="flex-row items-start" style={{ gap: 5, marginTop: 7 }}>
                  <Icon name="sparkles" size={12} color={colors.primary} />
                  <AppText variant="caption" color={colors.muted} numberOfLines={1} style={{ flex: 1 }}>
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
    </MotiView>
  );
}

/* ------------------------------------------------------------------ */
/* State block                                                         */
/* ------------------------------------------------------------------ */

function CenterNote({
  icon,
  title,
  body,
  tone = 'mint',
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
          <View className="flex-row" style={{ gap: 12 }}>
            <Skeleton width={50} height={50} radius={radii.sm} />
            <View style={{ flex: 1 }}>
              <Skeleton width="50%" height={11} radius={6} style={{ marginBottom: 8 }} />
              <SkeletonText lines={2} />
            </View>
          </View>
        </SoftCard>
      ))}
      <AppText variant="caption" color={colors.muted} style={{ textAlign: 'center', marginTop: 4 }}>
        Loading your reflections…
      </AppText>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function ReflectionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
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
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: motion.duration.transition }}
        >
          <View className="flex-row items-end justify-between" style={{ marginBottom: 16 }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <AppText variant="caption" weight="medium" color={colors.muted}>
                {isError ? 'Couldn’t load your journal' : 'A short end-of-day review'}
              </AppText>
              <AppText variant="display" display weight="semibold" color={colors.ink} style={{ marginTop: 2 }}>
                Reflections
              </AppText>
            </View>
            {!todayHasEntry ? (
              <PillButton
                label="Write"
                size="sm"
                onPress={() => router.push(`/reflections/${TODAY}`)}
                icon={<Icon name="pen" size={14} color={colors.inkInverted} />}
              />
            ) : null}
          </View>
        </MotiView>

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
        ) : (
          <>
            <SummaryCard reflections={reflections} />

            {reflections.length > 0 ? (
              <SoftInput
                key="reflections-search"
                placeholder="Search reflections"
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
                containerStyle={{ marginBottom: 14 }}
              />
            ) : null}

            {filtered.length > 0 ? (
              filtered.map((r, i) => (
                <EntryRow key={r.id} reflection={r} onPress={() => router.push(`/reflections/${r.date}`)} index={i} />
              ))
            ) : reflections.length === 0 ? (
              <CenterNote
                icon="book"
                title="No reflections yet"
                body="Capture what you learned today while it’s fresh — the learning compounds."
                action={
                  <PillButton
                    label="Write today"
                    onPress={() => router.push(`/reflections/${TODAY}`)}
                    icon={<Icon name="pen" size={14} color={colors.inkInverted} />}
                  />
                }
              />
            ) : (
              <CenterNote
                icon="search"
                tone="sky"
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
