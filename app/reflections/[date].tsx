/**
 * Daily reflection form (STEEP) — keyed by `dayKey` (e.g. /reflections/2026-06-26).
 *
 * The structured end-of-day review: prose fields for what I learned / what
 * challenged me / tomorrow's plan, 1–5 focus + confidence gauges, a checklist of
 * goals completed, and a mood selector — all flat (no radios, no neumorphism).
 * ONE Ink pill CTA commits (local state only; the write endpoint is out of scope
 * here). The form seeds from the live reflection for the day (via `useReflections`)
 * plus the rich journal mock for the deeper fields when present.
 */
import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { SoftInput } from '@/components/ui/SoftInput';
import { Checkbox } from '@/components/ui/Checkbox';
import { Chip } from '@/components/ui/Chip';
import { PillButton, TextLink } from '@/components/ui/PillButton';
import { Tag } from '@/components/ui/Tag';
import { Icon, type IconName } from '@/components/ui/Icon';
import { AppHeader } from '@/components/ui/AppHeader';
import { RatingControl } from '@/components/reflections/RatingControl';

import { radii, motion, pressOpacity } from '@/theme/tokens';
import { useTheme } from '@/theme';
import { TODAY } from '@/data/mock';
import { useReflections } from '@/hooks/api';
import type { Mood, Rating, Reflection } from '@/types/models';
import { MOODS, moodMeta, longDate, relativeDay, journalForDay } from '@/components/reflections/shared';

type Goal = { id: string; label: string; done: boolean };

/* ------------------------------------------------------------------ */
/* Section label                                                       */
/* ------------------------------------------------------------------ */

function SectionLabel({ icon, title }: { icon: IconName; title: string }) {
  const { colors } = useTheme();
  return (
    <View className="flex-row items-center" style={{ gap: 7, marginBottom: 8 }}>
      <Icon name={icon} size={15} color={colors.muted} />
      <AppText variant="subheading" weight="medium" color={colors.ink}>
        {title}
      </AppText>
    </View>
  );
}

/** Wrap a form section with the subtle staggered entrance. */
function Section({ index, children, style }: { index: number; children: React.ReactNode; style?: object }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: motion.duration.transition, delay: Math.min(index, 8) * 50 }}
      style={style}
    >
      {children}
    </MotiView>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function ReflectionDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ date: string }>();
  const dayKey = typeof params.date === 'string' ? params.date : TODAY;

  // The reflection for this day comes from the live list (cached query).
  const { data } = useReflections();
  const reflection = useMemo<Reflection | undefined>(
    () => (Array.isArray(data) ? data.find((r) => r.date === dayKey) : undefined),
    [data, dayKey],
  );
  // Rich fields (learned/challenged/plan/focus/goals) fall back to the journal mock.
  const journal = journalForDay(dayKey);
  const isNew = !journal && !reflection;

  const seedGoals = useMemo<Goal[]>(
    () => (journal?.goalsCompleted ?? []).map((label, i) => ({ id: `g_${i}`, label, done: true })),
    [journal],
  );

  const [learned, setLearned] = useState(journal?.learned ?? '');
  const [challenged, setChallenged] = useState(journal?.challenged ?? '');
  const [tomorrowPlan, setTomorrowPlan] = useState(journal?.tomorrowPlan ?? '');
  const [focus, setFocus] = useState<Rating>(journal?.focus ?? 3);
  const [confidence, setConfidence] = useState<Rating>(journal?.confidence ?? 3);
  const [mood, setMood] = useState<Mood>(journal?.mood ?? reflection?.mood ?? 'GOOD');
  const [goals, setGoals] = useState<Goal[]>(seedGoals);
  const [newGoal, setNewGoal] = useState('');
  const [saved, setSaved] = useState(false);

  const goalCount = goals.length;
  const doneCount = goals.filter((g) => g.done).length;

  const toggleGoal = (id: string) => setGoals((gs) => gs.map((g) => (g.id === id ? { ...g, done: !g.done } : g)));
  const removeGoal = (id: string) => setGoals((gs) => gs.filter((g) => g.id !== id));
  const addGoal = () => {
    const label = newGoal.trim();
    if (!label) return;
    setGoals((gs) => [...gs, { id: `g_${Date.now()}`, label, done: true }]);
    setNewGoal('');
  };

  const onSave = () => {
    setSaved(true);
    setTimeout(() => router.back(), 650);
  };

  const moodM = moodMeta(mood);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ paddingHorizontal: 20 }}>
          <AppHeader
            onBack={() => router.back()}
            right={<Tag label={relativeDay(dayKey, TODAY)} tone={dayKey === TODAY ? 'ink' : 'neutral'} size="sm" />}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: insets.bottom + 110,
          }}
        >
          {/* Header */}
          <Section index={0} style={{ marginBottom: 16 }}>
            <AppText variant="overline" uppercase color={colors.muted}>
              {isNew ? 'New entry' : 'Daily review'}
            </AppText>
            <AppText variant="headingLg" display weight="semibold" color={colors.ink} style={{ marginTop: 4 }}>
              {longDate(dayKey)}
            </AppText>
          </Section>

          {/* Mood */}
          <Section index={1}>
            <SoftCard radius={radii.card} padding={14} style={{ marginBottom: 12 }}>
              <View className="flex-row items-center justify-between" style={{ marginBottom: 12 }}>
                <SectionLabel icon="smile" title="How did today feel?" />
                <Tag label={moodM.label} tone={moodM.tone} size="sm" />
              </View>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {MOODS.map((m) => (
                  <Chip key={m.mood} label={m.label} icon={m.icon} selected={mood === m.mood} onPress={() => setMood(m.mood)} />
                ))}
              </View>
            </SoftCard>
          </Section>

          {/* Ratings */}
          <Section index={2}>
            <SoftCard radius={radii.card} padding={14} style={{ marginBottom: 12 }}>
              <RatingControl
                label="Focus"
                icon="target"
                value={focus}
                onChange={setFocus}
                captions={['Scattered', 'Distracted', 'Steady', 'Locked in', 'Deep flow']}
              />
              <View style={{ height: 16 }} />
              <RatingControl
                label="Confidence"
                icon="trending-up"
                value={confidence}
                onChange={setConfidence}
                captions={['Shaky', 'Unsure', 'Okay', 'Solid', 'Sharp']}
              />
            </SoftCard>
          </Section>

          {/* Prose */}
          <View>
            <SoftCard radius={radii.card} padding={14} style={{ marginBottom: 12 }}>
              <SectionLabel icon="lightbulb" title="What I learned" />
              <SoftInput
                key="reflection-learned"
                placeholder="A concept that clicked, a pattern you spotted…"
                value={learned}
                onChangeText={setLearned}
                multiline
                style={{ minHeight: 76, textAlignVertical: 'top', paddingTop: 4 }}
              />
              <View style={{ height: 16 }} />
              <SectionLabel icon="flag" title="What challenged me" />
              <SoftInput
                key="reflection-challenged"
                placeholder="Where you got stuck or what felt hard…"
                value={challenged}
                onChangeText={setChallenged}
                multiline
                style={{ minHeight: 76, textAlignVertical: 'top', paddingTop: 4 }}
              />
            </SoftCard>
          </View>

          {/* Goals */}
          <View>
            <SoftCard radius={radii.card} padding={14} style={{ marginBottom: 12 }}>
              <View className="flex-row items-center justify-between" style={{ marginBottom: 10 }}>
                <SectionLabel icon="check-square" title="Goals completed" />
                {goalCount > 0 ? <Tag label={`${doneCount}/${goalCount}`} tone="neutral" size="sm" /> : null}
              </View>

              {goals.length > 0 ? (
                <View style={{ gap: 10, marginBottom: 12 }}>
                  {goals.map((g) => (
                    <View key={g.id} className="flex-row items-center justify-between" style={{ gap: 12 }}>
                      <Checkbox checked={g.done} onChange={() => toggleGoal(g.id)} label={g.label} style={{ flex: 1 }} />
                      <Pressable
                        onPress={() => removeGoal(g.id)}
                        hitSlop={8}
                        accessibilityLabel={`Remove ${g.label}`}
                        style={({ pressed }) => ({ opacity: pressOpacity({ pressed }) })}
                      >
                        <Icon name="x" size={15} color={colors.muted} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={{ paddingVertical: 8, marginBottom: 12 }}>
                  <AppText variant="caption" color={colors.muted} style={{ textAlign: 'center' }}>
                    No goals logged yet — add what you shipped today.
                  </AppText>
                </View>
              )}

              <SoftInput
                key="reflection-new-goal"
                placeholder="Add a goal you completed"
                value={newGoal}
                onChangeText={setNewGoal}
                returnKeyType="done"
                onSubmitEditing={addGoal}
                leading={<Icon name="plus-circle" size={16} color={colors.muted} />}
                trailing={
                  newGoal.trim().length > 0 ? (
                    <Pressable
                      onPress={addGoal}
                      hitSlop={8}
                      accessibilityLabel="Add goal"
                      style={({ pressed }) => ({ opacity: pressOpacity({ pressed }) })}
                    >
                      <Icon name="check-circle" size={18} color={colors.primary} weight="fill" />
                    </Pressable>
                  ) : undefined
                }
              />
            </SoftCard>
          </View>

          {/* Tomorrow */}
          <View>
            <SoftCard radius={radii.card} padding={14}>
              <SectionLabel icon="arrow-right" title="Plan for tomorrow" />
              <SoftInput
                key="reflection-tomorrow-plan"
                placeholder="The one thing to start with…"
                value={tomorrowPlan}
                onChangeText={setTomorrowPlan}
                multiline
                style={{ minHeight: 64, textAlignVertical: 'top', paddingTop: 4 }}
              />
            </SoftCard>
          </View>
        </ScrollView>

        {/* Save bar */}
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
          {saved ? (
            <View className="flex-row items-center" style={{ gap: 8, flex: 1, justifyContent: 'center', paddingVertical: 4 }}>
              <Icon name="check-circle" size={18} color={colors.success} weight="fill" />
              <AppText variant="subheading" weight="medium" color={colors.ink}>
                Reflection saved
              </AppText>
            </View>
          ) : (
            <>
              <TextLink label="Cancel" onPress={() => router.back()} muted />
              <View style={{ flex: 1 }} />
              <PillButton
                label={isNew ? 'Save reflection' : 'Update'}
                onPress={onSave}
                icon={<Icon name="check" size={15} color={colors.inkInverted} />}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
