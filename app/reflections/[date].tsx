/**
 * Daily reflection form — keyed by `dayKey` (e.g. /reflections/2026-06-26).
 *
 * The structured end-of-day review: prose fields for what I learned / what
 * challenged me / tomorrow's plan, a 1–5 focus + confidence gauge, a checklist
 * of goals completed, and a mood selector — all built from the Aaply kit with
 * ZERO radios and ZERO emoji. A yellow PillButton commits (local state only;
 * mock data is the read-only seed).
 *
 * Seed: the matching rich `JournalEntry` (mockJournal) when present, else the
 * lightweight `Reflection` (mockReflections), else sensible blanks.
 */
import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { SoftIconButton } from '@/components/ui/SoftIconButton';
import { SoftInput } from '@/components/ui/SoftInput';
import { Checkbox } from '@/components/ui/Checkbox';
import { Chip } from '@/components/ui/Chip';
import { PillButton } from '@/components/ui/PillButton';
import { Tag } from '@/components/ui/Tag';
import { Icon, type IconName } from '@/components/ui/Icon';
import { RatingControl } from '@/components/reflections/RatingControl';

import { colors, radii } from '@/theme/tokens';
import { TODAY } from '@/data/mock';
import type { Mood, Rating } from '@/types/models';
import {
  MOODS,
  moodMeta,
  longDate,
  relativeDay,
  journalForDay,
  reflectionForDay,
} from '@/components/reflections/shared';

/* ------------------------------------------------------------------ */
/* Local goal item shape                                               */
/* ------------------------------------------------------------------ */

type Goal = { id: string; label: string; done: boolean };

/* ------------------------------------------------------------------ */
/* Section header                                                      */
/* ------------------------------------------------------------------ */

function SectionLabel({ icon, title }: { icon: IconName; title: string }) {
  return (
    <View className="flex-row items-center" style={{ gap: 8, marginBottom: 10 }}>
      <Icon name={icon} size={16} color="carbon" strokeWidth={2.2} />
      <AppText variant="body" weight="semibold">
        {title}
      </AppText>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function ReflectionDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ date: string }>();
  const dayKey = typeof params.date === 'string' ? params.date : TODAY;

  const journal = journalForDay(dayKey);
  const reflection = reflectionForDay(dayKey);
  const isNew = !journal && !reflection;

  /* ---- Seeded local form state (mock is read-only) ---- */
  const seedGoals = useMemo<Goal[]>(
    () =>
      (journal?.goalsCompleted ?? []).map((label, i) => ({
        id: `g_${i}`,
        label,
        done: true,
      })),
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

  function toggleGoal(id: string) {
    setGoals((gs) => gs.map((g) => (g.id === id ? { ...g, done: !g.done } : g)));
  }

  function removeGoal(id: string) {
    setGoals((gs) => gs.filter((g) => g.id !== id));
  }

  function addGoal() {
    const label = newGoal.trim();
    if (!label) return;
    setGoals((gs) => [...gs, { id: `g_${Date.now()}`, label, done: true }]);
    setNewGoal('');
  }

  function onSave() {
    setSaved(true);
    // Local-only confirmation; return to the list after a beat.
    setTimeout(() => router.back(), 650);
  }

  const moodM = moodMeta(mood);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
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
            <Tag
              label={relativeDay(dayKey, TODAY)}
              tone={dayKey === TODAY ? 'yellow' : 'neutral'}
              size="sm"
              icon={
                <Icon
                  name="calendar"
                  size={12}
                  color={dayKey === TODAY ? 'carbon' : 'textMuted'}
                  strokeWidth={2.3}
                />
              }
            />
          </View>

          {/* ---------- Header ---------- */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 340 }}
            style={{ marginTop: 18, marginBottom: 18 }}
          >
            <View className="flex-row items-center" style={{ gap: 7 }}>
              <Icon name="notebook-pen" size={14} color="success" strokeWidth={2.3} />
              <AppText variant="caption" weight="semibold" color={colors.textSubtle}
                style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 11 }}>
                {isNew ? 'New entry' : 'Daily review'}
              </AppText>
            </View>
            <AppText variant="heading" display weight="bold" style={{ marginTop: 6 }}>
              {longDate(dayKey)}
            </AppText>
          </MotiView>

          {/* ---------- Mood ---------- */}
          <SoftCard radius={radii.card} padding={20} style={{ marginBottom: 16 }}>
            <View className="flex-row items-center justify-between" style={{ marginBottom: 14 }}>
              <SectionLabel icon="smile" title="How did today feel?" />
              <Tag
                label={moodM.label}
                tone={moodM.tone}
                size="sm"
                icon={<Icon name={moodM.icon} size={13} color="carbon" strokeWidth={2.3} />}
              />
            </View>
            <View className="flex-row flex-wrap" style={{ gap: 10 }}>
              {MOODS.map((m) => (
                <Chip
                  key={m.mood}
                  label={m.label}
                  icon={m.icon}
                  selected={mood === m.mood}
                  onPress={() => setMood(m.mood)}
                />
              ))}
            </View>
          </SoftCard>

          {/* ---------- Ratings ---------- */}
          <SoftCard radius={radii.card} padding={20} style={{ marginBottom: 16 }}>
            <RatingControl
              label="Focus"
              icon="target"
              value={focus}
              onChange={setFocus}
              captions={['Scattered', 'Distracted', 'Steady', 'Locked in', 'Deep flow']}
            />
            <View style={{ height: 20 }} />
            <RatingControl
              label="Confidence"
              icon="trending-up"
              value={confidence}
              onChange={setConfidence}
              captions={['Shaky', 'Unsure', 'Okay', 'Solid', 'Sharp']}
            />
          </SoftCard>

          {/* ---------- Prose: learned ---------- */}
          <SoftCard radius={radii.card} padding={20} style={{ marginBottom: 16 }}>
            <SectionLabel icon="lightbulb" title="What I learned" />
            <SoftInput
              placeholder="A concept that clicked, a pattern you spotted…"
              value={learned}
              onChangeText={setLearned}
              multiline
              style={{ minHeight: 84, textAlignVertical: 'top', paddingTop: 4 }}
            />

            <View style={{ height: 18 }} />

            <SectionLabel icon="flag" title="What challenged me" />
            <SoftInput
              placeholder="Where you got stuck or what felt hard…"
              value={challenged}
              onChangeText={setChallenged}
              multiline
              style={{ minHeight: 84, textAlignVertical: 'top', paddingTop: 4 }}
            />
          </SoftCard>

          {/* ---------- Goals completed ---------- */}
          <SoftCard radius={radii.card} padding={20} style={{ marginBottom: 16 }}>
            <View className="flex-row items-center justify-between" style={{ marginBottom: 12 }}>
              <SectionLabel icon="check-square" title="Goals completed" />
              {goalCount > 0 ? (
                <Tag label={`${doneCount}/${goalCount}`} tone="success" size="sm" />
              ) : null}
            </View>

            {goals.length > 0 ? (
              <View style={{ gap: 12, marginBottom: 14 }}>
                <AnimatePresence>
                  {goals.map((g) => (
                    <MotiView
                      key={g.id}
                      from={{ opacity: 0, translateX: -8 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      exit={{ opacity: 0, translateX: 8 }}
                      transition={{ type: 'timing', duration: 220 }}
                      className="flex-row items-center justify-between"
                      style={{ gap: 12 }}
                    >
                      <Checkbox
                        checked={g.done}
                        onChange={() => toggleGoal(g.id)}
                        label={g.label}
                        style={{ flex: 1 }}
                      />
                      <Pressable
                        onPress={() => removeGoal(g.id)}
                        hitSlop={8}
                        accessibilityLabel={`Remove ${g.label}`}
                      >
                        <Icon name="x" size={16} color="textSubtle" strokeWidth={2.2} />
                      </Pressable>
                    </MotiView>
                  ))}
                </AnimatePresence>
              </View>
            ) : (
              <Neumorph variant="inset" radius={16} padding={16} style={{ marginBottom: 14 }}>
                <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
                  No goals logged yet — add what you shipped today.
                </AppText>
              </Neumorph>
            )}

            <SoftInput
              placeholder="Add a goal you completed"
              value={newGoal}
              onChangeText={setNewGoal}
              returnKeyType="done"
              onSubmitEditing={addGoal}
              leading={<Icon name="plus-circle" size={18} color="textMuted" />}
              trailing={
                newGoal.trim().length > 0 ? (
                  <Pressable onPress={addGoal} hitSlop={8} accessibilityLabel="Add goal">
                    <Icon name="check-circle" size={20} color="success" strokeWidth={2.3} />
                  </Pressable>
                ) : undefined
              }
            />
          </SoftCard>

          {/* ---------- Tomorrow's plan ---------- */}
          <SoftCard radius={radii.card} padding={20} style={{ marginBottom: 8 }}>
            <SectionLabel icon="arrow-right" title="Plan for tomorrow" />
            <SoftInput
              placeholder="The one thing to start with…"
              value={tomorrowPlan}
              onChangeText={setTomorrowPlan}
              multiline
              style={{ minHeight: 72, textAlignVertical: 'top', paddingTop: 4 }}
            />
          </SoftCard>
        </ScrollView>

        {/* ---------- Save bar ---------- */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: insets.bottom + 14,
            backgroundColor: colors.canvas,
            borderTopWidth: 1,
            borderTopColor: colors.hairline,
          }}
        >
          <AnimatePresence exitBeforeEnter>
            {saved ? (
              <MotiView
                key="saved"
                from={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 16, stiffness: 220 }}
                className="flex-row items-center justify-center"
                style={{ gap: 8, paddingVertical: 16 }}
              >
                <Icon name="check-circle" size={20} color="success" strokeWidth={2.4} />
                <AppText variant="body" weight="bold" color={colors.success}>
                  Reflection saved
                </AppText>
              </MotiView>
            ) : (
              <MotiView key="save" from={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <PillButton
                  label={isNew ? 'Save reflection' : 'Update reflection'}
                  fullWidth
                  icon={<Icon name="save" size={18} color="carbon" strokeWidth={2.3} />}
                  onPress={onSave}
                />
              </MotiView>
            )}
          </AnimatePresence>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
