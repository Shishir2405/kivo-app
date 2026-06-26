/**
 * Reflections — daily journal list.
 *
 * Lists the user's written reflections by date (newest first), with a search
 * field over the title/body and a summary card showing this week's mood spread
 * and average focus. Each row springs in and pushes to /reflections/[dayKey]
 * for the full end-of-day form. Pure Aaply kit, neumorphic, ZERO emoji.
 *
 * The list source is `mockReflections` (the lightweight per-day reflection);
 * the matching rich `JournalEntry` (mockJournal) supplies the focus rating for
 * the summary when present.
 */
import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { SoftIconButton } from '@/components/ui/SoftIconButton';
import { SoftInput } from '@/components/ui/SoftInput';
import { PillButton } from '@/components/ui/PillButton';
import { Tag } from '@/components/ui/Tag';
import { Icon } from '@/components/ui/Icon';
import { GrayMark } from '@/components/ui/AppHeader';

import { colors, radii } from '@/theme/tokens';
import { mockReflections, mockJournal, TODAY } from '@/data/mock';
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
/* Summary card                                                        */
/* ------------------------------------------------------------------ */

function StatPill({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  value: string;
  label: string;
  accent: 'highlighter' | 'signal' | 'peach' | 'success';
}) {
  return (
    <View style={{ flex: 1 }}>
      <Neumorph variant="inset" radius={18} padding={14}>
        <View className="flex-row items-center" style={{ gap: 8, marginBottom: 8 }}>
          <Icon name={icon} size={16} color={accent} strokeWidth={2.3} />
          <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 11.5 }}>
            {label}
          </AppText>
        </View>
        <AppText variant="headingSm" display weight="bold" numberOfLines={1}>
          {value}
        </AppText>
      </Neumorph>
    </View>
  );
}

function SummaryCard() {
  const count = mockReflections.length;

  // Average focus from any paired journal entries (fallback to "—").
  const focusVals: number[] = [];
  for (const r of mockReflections) {
    const f = journalForDay(r.date)?.focus;
    if (typeof f === 'number') focusVals.push(f);
  }
  const avgFocus =
    focusVals.length > 0
      ? (focusVals.reduce((a, b) => a + b, 0) / focusVals.length).toFixed(1)
      : '—';

  // Average mood (weighted) → nearest mood label.
  const avgMoodScore =
    mockReflections.reduce((a, r) => a + moodScore(r.mood), 0) / count;
  const nearest = MOODS.reduce((best, m) =>
    Math.abs(moodScore(m.mood) - avgMoodScore) <
    Math.abs(moodScore(best.mood) - avgMoodScore)
      ? m
      : best,
  );

  // Mood distribution for the legend dots.
  const dist = MOODS.map((m) => ({
    meta: m,
    n: mockReflections.filter((r) => r.mood === m.mood).length,
  })).filter((d) => d.n > 0);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 380 }}
    >
      <SoftCard radius={radii.card} padding={20}>
        <View className="flex-row items-center justify-between">
          <AppText variant="caption" weight="bold" color={colors.textMuted}
            style={{ textTransform: 'uppercase', letterSpacing: 1.4, fontSize: 11.5 }}>
            This week
          </AppText>
          <Tag
            label={moodMeta(nearest.mood).label}
            tone={moodMeta(nearest.mood).tone}
            size="sm"
            icon={<Icon name={nearest.icon} size={13} color="carbon" strokeWidth={2.3} />}
          />
        </View>

        <View className="flex-row" style={{ gap: 12, marginTop: 14 }}>
          <StatPill icon="book" value={`${count}`} label="Entries" accent="signal" />
          <StatPill icon="target" value={`${avgFocus}`} label="Avg focus" accent="peach" />
        </View>

        {/* Mood legend */}
        <View className="flex-row flex-wrap" style={{ gap: 8, marginTop: 16 }}>
          {dist.map((d) => (
            <View
              key={d.meta.mood}
              className="flex-row items-center"
              style={{ gap: 5 }}
            >
              <Icon name={d.meta.icon} size={14} color={d.meta.accent} strokeWidth={2.3} />
              <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 12 }}>
                {d.meta.label} · {d.n}
              </AppText>
            </View>
          ))}
        </View>
      </SoftCard>
    </MotiView>
  );
}

/* ------------------------------------------------------------------ */
/* Entry row                                                           */
/* ------------------------------------------------------------------ */

function EntryRow({
  dayKey,
  index,
  onPress,
}: {
  dayKey: string;
  index: number;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const reflection = mockReflections.find((r) => r.date === dayKey)!;
  const meta = moodMeta(reflection.mood);
  const journal = journalForDay(dayKey);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 320, delay: 80 + index * 55 }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        accessibilityRole="button"
        accessibilityLabel={`Reflection for ${shortDate(dayKey)}`}
      >
        <SoftCard
          variant={pressed ? 'inset' : 'raised'}
          radius={radii.card}
          padding={16}
        >
          <View className="flex-row" style={{ gap: 14 }}>
            {/* Date chip */}
            <Neumorph variant="inset" radius={16} intensity="sm" surface={colors.canvas}>
              <View
                style={{
                  width: 56,
                  paddingVertical: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                }}
              >
                <AppText variant="caption" color={colors.textSubtle}
                  style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {weekdayShort(dayKey)}
                </AppText>
                <AppText variant="subheading" display weight="bold">
                  {dayOfMonth(dayKey)}
                </AppText>
              </View>
            </Neumorph>

            {/* Body */}
            <View style={{ flex: 1 }}>
              <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
                <View className="flex-row items-center" style={{ gap: 7, flexShrink: 1 }}>
                  <Icon name={meta.icon} size={16} color={meta.accent} strokeWidth={2.3} />
                  <AppText variant="caption" weight="semibold" color={colors.textMuted}
                    numberOfLines={1} style={{ fontSize: 12.5 }}>
                    {meta.label} · {relativeDay(dayKey, TODAY)}
                  </AppText>
                </View>
                <Icon name="chevron-right" size={16} color="textSubtle" strokeWidth={2.2} />
              </View>

              <AppText variant="body" style={{ marginTop: 6 }} numberOfLines={2}>
                {reflection.note}
              </AppText>

              {reflection.win ? (
                <View className="flex-row items-start" style={{ gap: 6, marginTop: 8 }}>
                  <Icon name="sparkles" size={13} color="highlighter" strokeWidth={2.4} />
                  <AppText variant="caption" color={colors.textMuted}
                    numberOfLines={1} style={{ fontSize: 12, flex: 1 }}>
                    {reflection.win}
                  </AppText>
                </View>
              ) : null}

              {journal ? (
                <View className="flex-row" style={{ gap: 8, marginTop: 10 }}>
                  <Tag
                    label={`Focus ${journal.focus}`}
                    tone="peach"
                    size="sm"
                    icon={<Icon name="target" size={11} color="#d8602f" strokeWidth={2.4} />}
                  />
                  <Tag
                    label={`${journal.goalsCompleted.length} goals`}
                    tone="success"
                    size="sm"
                    icon={<Icon name="check" size={11} color="#2c9d5f" strokeWidth={2.6} />}
                  />
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
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function ReflectionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState('');

  // Newest-first list of day keys, deduped across reflections + journal.
  const allDays = useMemo(() => {
    const keys = new Set<string>([
      ...mockReflections.map((r) => r.date),
      ...mockJournal.map((j) => j.dayKey),
    ]);
    return Array.from(keys).sort((a, b) => (a < b ? 1 : -1));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Only days that actually have a reflection row to render.
    const withReflection = allDays.filter((d) =>
      mockReflections.some((r) => r.date === d),
    );
    if (!q) return withReflection;
    return withReflection.filter((d) => {
      const r = mockReflections.find((x) => x.date === d);
      const j = journalForDay(d);
      const hay = [
        r?.note,
        r?.win,
        j?.learned,
        j?.challenged,
        j?.tomorrowPlan,
        j?.goalsCompleted.join(' '),
        moodMeta(r!.mood).label,
        shortDate(d),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [allDays, query]);

  const todayHasEntry = mockReflections.some((r) => r.date === TODAY);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 40,
        }}
      >
        {/* ---------- Top bar ---------- */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <SoftIconButton size={44} accessibilityLabel="Go back" onPress={() => router.back()}>
              <Icon name="chevron-left" size={22} color="carbon" />
            </SoftIconButton>
            <GrayMark size={22} />
          </View>
          <SoftIconButton
            size={44}
            accessibilityLabel="New reflection"
            onPress={() => router.push(`/reflections/${TODAY}`)}
          >
            <Icon name="plus" size={22} color="carbon" />
          </SoftIconButton>
        </View>

        {/* ---------- Header ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 360 }}
          style={{ marginTop: 18, marginBottom: 20 }}
        >
          <View className="flex-row items-center" style={{ gap: 7 }}>
            <Icon name="book" size={14} color="success" strokeWidth={2.3} />
            <AppText variant="caption" weight="semibold" color={colors.textSubtle}
              style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 11 }}>
              Journal
            </AppText>
          </View>
          <AppText variant="heading" display weight="bold" style={{ marginTop: 6 }}>
            Reflections
          </AppText>
          <AppText variant="body" color={colors.textMuted} style={{ marginTop: 6 }}>
            A short end-of-day review keeps the learning compounding.
          </AppText>
        </MotiView>

        {/* ---------- Summary ---------- */}
        <SummaryCard />

        {/* ---------- Today CTA ---------- */}
        {!todayHasEntry ? (
          <View style={{ marginTop: 16 }}>
            <SoftCard radius={radii.card} padding={18}>
              <View className="flex-row items-center justify-between" style={{ gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <AppText variant="body" weight="bold">
                    No entry for today yet
                  </AppText>
                  <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 2 }}>
                    Capture what you learned while it's fresh.
                  </AppText>
                </View>
                <PillButton
                  label="Write"
                  size="sm"
                  icon={<Icon name="pen" size={15} color="carbon" strokeWidth={2.4} />}
                  onPress={() => router.push(`/reflections/${TODAY}`)}
                />
              </View>
            </SoftCard>
          </View>
        ) : null}

        {/* ---------- Search ---------- */}
        <View style={{ marginTop: 18, marginBottom: 6 }}>
          <SoftInput
            placeholder="Search reflections"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            leading={<Icon name="search" size={18} color="textMuted" />}
            trailing={
              query.length > 0 ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
                  <Icon name="x-circle" size={18} color="textSubtle" />
                </Pressable>
              ) : undefined
            }
          />
        </View>

        {/* ---------- List ---------- */}
        <View style={{ marginTop: 12, gap: 12 }}>
          {filtered.length > 0 ? (
            filtered.map((dayKey, i) => (
              <EntryRow
                key={dayKey}
                dayKey={dayKey}
                index={i}
                onPress={() => router.push(`/reflections/${dayKey}`)}
              />
            ))
          ) : (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 300 }}
            >
              <SoftCard variant="inset" radius={radii.card} padding={28}>
                <View className="items-center">
                  <Neumorph variant="raised" radius={20} intensity="sm" padding={14}>
                    <Icon name="search" size={24} color="textSubtle" strokeWidth={2.1} />
                  </Neumorph>
                  <AppText variant="body" weight="bold" style={{ marginTop: 14 }}>
                    No matches
                  </AppText>
                  <AppText variant="caption" color={colors.textMuted}
                    style={{ marginTop: 4, textAlign: 'center' }}>
                    Nothing matches “{query.trim()}”. Try a different word.
                  </AppText>
                </View>
              </SoftCard>
            </MotiView>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
