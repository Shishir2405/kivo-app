import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Tag } from '@/components/ui/Tag';
import { SoftInput } from '@/components/ui/SoftInput';
import { PillButton, TextLink } from '@/components/ui/PillButton';
import { Icon } from '@/components/ui/Icon';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { ScreenHeader } from '@/components/dsa/ScreenHeader';
import { SectionHeading } from '@/components/dsa/SectionHeading';
import { InfoTile } from '@/components/dsa/InfoTile';
import { JournalField } from '@/components/dsa/JournalField';
import { ApproachCard } from '@/components/dsa/ApproachCard';
import { LoadingState, ErrorState, EmptyState } from '@/components/dsa/StateViews';
import {
  DIFFICULTY_ICON,
  DIFFICULTY_LABEL,
  DIFFICULTY_TONE,
  statusColor,
  STATUS_ICON,
  STATUS_LABEL,
  STATUS_TONE,
  formatShortDate,
} from '@/components/dsa/dsaMeta';
import {
  useDsaProblems,
  useDsaTopics,
  useUpdateProblem,
  useDeleteProblem,
} from '@/hooks/api';
import { motion, interaction, radii } from '@/theme/tokens';
import { useTheme } from '@/theme';
import type { Problem, ProblemStatus } from '@/types/models';

/**
 * Pressable with a static opacity-dip press feedback. NativeWind drops the
 * FUNCTION form of `style`, so feedback is driven by local state + a static
 * style array instead of `style={({ pressed }) => ...}`.
 */
function PressFade({
  style,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: React.ComponentProps<typeof Pressable>) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      style={[style as any, pressed && { opacity: interaction.pressOpacity }]}
    >
      {children}
    </Pressable>
  );
}

/* ================================================================== */
/* Coding-journal local state (seeded from the problem's fields)       */
/* ================================================================== */

type Journal = {
  approach: string;
  mistakes: string;
  optimal: string;
  interviewTip: string;
  timeComplexity: string;
  spaceComplexity: string;
};

function seedJournal(problem: Problem): Journal {
  return {
    approach: problem.approach ?? '',
    mistakes: '',
    optimal: '',
    interviewTip: '',
    timeComplexity: problem.timeComplexity ?? '',
    spaceComplexity: problem.spaceComplexity ?? '',
  };
}

/* ================================================================== */
/* Status selector (segmented control)                                 */
/* ================================================================== */

const STATUS_OPTIONS: SegmentedOption<ProblemStatus>[] = [
  { label: 'To do', value: 'TODO' },
  { label: 'Tried', value: 'ATTEMPTED' },
  { label: 'Solved', value: 'SOLVED' },
  { label: 'Master', value: 'MASTERED' },
];

/* ================================================================== */
/* Screen                                                              */
/* ================================================================== */

export default function ProblemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, accentForTone } = useTheme();

  const problemsQuery = useDsaProblems();
  const topicsQuery = useDsaTopics();

  const problem = useMemo<Problem | undefined>(
    () => (problemsQuery.data ?? []).find((p) => p.id === id),
    [problemsQuery.data, id],
  );
  const topic = useMemo(
    () => (topicsQuery.data ?? []).find((t) => t.id === problem?.topicId),
    [topicsQuery.data, problem],
  );

  const updateProblem = useUpdateProblem();
  const deleteProblem = useDeleteProblem();

  const [status, setStatus] = useState<ProblemStatus>('TODO');
  const [bookmarked, setBookmarked] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [journal, setJournal] = useState<Journal>({
    approach: '',
    mistakes: '',
    optimal: '',
    interviewTip: '',
    timeComplexity: '',
    spaceComplexity: '',
  });

  // Seed local edit state once the problem resolves (id change = new problem).
  useEffect(() => {
    if (problem) {
      setStatus(problem.status);
      setBookmarked(problem.bookmarked ?? false);
      setJournal(seedJournal(problem));
    }
  }, [problem?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function patchJournal(key: keyof Journal) {
    return (next: string) => {
      setJournal((j) => ({ ...j, [key]: next }));
      if (saveError) setSaveError(null);
    };
  }

  // Compose the journal's free-text fields into the persisted `notes` blob so
  // mistakes / optimal / interview-tip survive a round-trip (the Problem model
  // has no dedicated columns for them).
  function composeNotes(j: Journal): string {
    const parts: string[] = [];
    if (j.mistakes.trim()) parts.push(`Mistakes:\n${j.mistakes.trim()}`);
    if (j.optimal.trim()) parts.push(`Optimal:\n${j.optimal.trim()}`);
    if (j.interviewTip.trim()) parts.push(`Interview tip:\n${j.interviewTip.trim()}`);
    return parts.join('\n\n');
  }

  /* ---- Per-field validation (mirrors the dsa-problem backend validator) ---- */
  // approach max 5000; the composed notes blob max 5000; time/space max 60 each.
  const APPROACH_MAX = 5000;
  const NOTES_MAX = 5000;
  const COMPLEXITY_MAX = 60;
  const approachError =
    journal.approach.trim().length > APPROACH_MAX
      ? `Keep the approach under ${APPROACH_MAX.toLocaleString()} characters.`
      : undefined;
  // mistakes / optimal / interview-tip all flow into the single `notes` blob.
  const composedNotesLen = composeNotes(journal).length;
  const notesError =
    composedNotesLen > NOTES_MAX
      ? `The journal notes total ${composedNotesLen.toLocaleString()} — keep them under ${NOTES_MAX.toLocaleString()} characters.`
      : undefined;
  const timeError =
    journal.timeComplexity.trim().length > COMPLEXITY_MAX
      ? `Must be at most ${COMPLEXITY_MAX} characters.`
      : undefined;
  const spaceError =
    journal.spaceComplexity.trim().length > COMPLEXITY_MAX
      ? `Must be at most ${COMPLEXITY_MAX} characters.`
      : undefined;
  const journalValid = !approachError && !notesError && !timeError && !spaceError;

  const handleBack = () => {
    if (router.canGoBack()) router.back();
  };

  // Persist a status change immediately (also surfaced by the Mark-solved CTA).
  const applyStatus = (next: ProblemStatus) => {
    setStatus(next);
    if (!problem) return;
    updateProblem.mutate(
      { id: problem.id, patch: { status: next } },
      { onError: (e) => Alert.alert('Couldn’t update status', e.message) },
    );
  };

  // Persist the coding-journal fields + status.
  const onSaveJournal = () => {
    if (!problem) return;
    if (!journalValid) {
      setSaveError('Fix the highlighted fields before saving.');
      return;
    }
    setSaveError(null);
    updateProblem.mutate(
      {
        id: problem.id,
        patch: {
          status,
          approach: journal.approach.trim() || undefined,
          notes: composeNotes(journal) || undefined,
          timeComplexity: journal.timeComplexity.trim() || undefined,
          spaceComplexity: journal.spaceComplexity.trim() || undefined,
          bookmarked,
        },
      },
      {
        onSuccess: () => {
          setSavedFlash(true);
          setTimeout(() => setSavedFlash(false), 1600);
        },
        onError: (e) => setSaveError(e.message),
      },
    );
  };

  const onDelete = () => {
    if (!problem || deleteProblem.isPending) return;
    Alert.alert(
      'Delete problem',
      `Remove “${problem.title}”? This can’t be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteProblem.mutate(problem.id, {
              onSuccess: () => handleBack(),
              onError: (e) => Alert.alert('Couldn’t delete', e.message),
            }),
        },
      ],
    );
  };

  /* ---- Loading ---- */
  if (problemsQuery.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16 }}>
          <ScreenHeader eyebrow="Problem" title="Loading…" onBack={handleBack} style={{ marginBottom: 20 }} />
          <LoadingState label="Loading problem" />
        </View>
      </View>
    );
  }

  /* ---- Error ---- */
  if (problemsQuery.isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16 }}>
          <ScreenHeader eyebrow="Problem" title="Couldn't load" onBack={handleBack} style={{ marginBottom: 20 }} />
          <ErrorState
            error={problemsQuery.error}
            onRetry={() => void problemsQuery.refetch()}
            title="Couldn't load problem"
          />
        </View>
      </View>
    );
  }

  /* ---- Not found ---- */
  if (!problem) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16 }}>
          <ScreenHeader eyebrow="Problem" title="Not found" onBack={handleBack} style={{ marginBottom: 20 }} />
          <EmptyState
            icon="alert"
            title="This problem doesn't exist"
            body="It may have been removed. Go back and pick another problem."
          />
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <PressFade
              onPress={handleBack}
              hitSlop={8}
            >
              <AppText variant="body" weight="medium" color={colors.ink}>
                Back
              </AppText>
            </PressFade>
          </View>
        </View>
      </View>
    );
  }

  const platform = problem.platform ?? (problem.source ?? 'Practice').split(' ')[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: 40,
        }}
      >
        {/* ---------- Header ---------- */}
        <ScreenHeader
          eyebrow={topic ? topic.title : 'Problem'}
          title={problem.title}
          onBack={handleBack}
          trailing={
            <View className="flex-row items-center" style={{ gap: 14 }}>
              <PressFade
                onPress={onDelete}
                hitSlop={10}
                disabled={deleteProblem.isPending}
                accessibilityRole="button"
                accessibilityLabel="Delete problem"
                style={deleteProblem.isPending ? { opacity: 0.4 } : undefined}
              >
                {deleteProblem.isPending ? (
                  <ActivityIndicator size="small" color={colors.muted} />
                ) : (
                  <Icon name="trash" size={19} color="danger" />
                )}
              </PressFade>
              <PressFade
                onPress={() => setBookmarked((b) => !b)}
                hitSlop={10}
                accessibilityLabel="Bookmark problem"
              >
                <Icon
                  name="bookmark"
                  size={20}
                  color={bookmarked ? 'primary' : 'muted'}
                  weight={bookmarked ? 'fill' : 'light'}
                />
              </PressFade>
            </View>
          }
          style={{ marginBottom: 20 }}
        />

        {/* ---------- Title / source / tags ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: motion.duration.transition }}
        >
          <SoftCard radius={18} padding={16} style={{ marginBottom: 16 }}>
            <View className="flex-row items-center" style={{ gap: 10 }}>
              <Icon name={STATUS_ICON[status]} size={18} color={statusColor(status, colors, accentForTone)} />
              <View style={{ flex: 1 }}>
                {problem.source ? (
                  <AppText
                    variant="caption"
                    weight="medium"
                    color={colors.muted}
                    style={{ fontSize: 10.5, letterSpacing: 0.6, textTransform: 'uppercase' }}
                  >
                    {problem.source}
                  </AppText>
                ) : null}
                <AppText variant="heading" display numberOfLines={2} style={{ marginTop: problem.source ? 1 : 0 }}>
                  {problem.title}
                </AppText>
              </View>
            </View>

            <View className="flex-row flex-wrap items-center" style={{ gap: 6, marginTop: 12 }}>
              <Tag
                label={DIFFICULTY_LABEL[problem.difficulty]}
                tone={DIFFICULTY_TONE[problem.difficulty]}
                size="sm"
                icon={<Icon name={DIFFICULTY_ICON[problem.difficulty]} size={11} color={colors.muted} />}
              />
              <Tag label={STATUS_LABEL[status]} tone={STATUS_TONE[status]} size="sm" />
              {(problem.tags ?? []).map((t) => (
                <Tag key={t} label={t} tone="neutral" size="sm" />
              ))}
            </View>
          </SoftCard>
        </MotiView>

        {/* ---------- Meta: attempts / last attempt / platform ---------- */}
        <View className="flex-row" style={{ gap: 10, marginBottom: 22 }}>
          <InfoTile icon="repeat" value={String(problem.attempts ?? 0)} label="Attempts" style={{ flex: 1 }} />
          <InfoTile
            icon="calendar"
            value={formatShortDate(problem.lastAttemptedAt)}
            label="Last tried"
            style={{ flex: 1 }}
          />
          <InfoTile icon="code" value={platform} label="Platform" style={{ flex: 1 }} />
        </View>

        {/* ---------- Approach snapshot (dark code card) ---------- */}
        {problem.approach ? (
          <View style={{ marginBottom: 24 }}>
            <SectionHeading icon="lightbulb" title="Approach" />
            <ApproachCard approach={problem.approach} />
          </View>
        ) : null}

        {/* ---------- Status selector (segmented) ---------- */}
        <SectionHeading icon="flag" title="Status" />
        <SegmentedTabs
          options={STATUS_OPTIONS}
          value={status}
          onChange={applyStatus}
          height={40}
          style={{ marginBottom: 24 }}
        />

        {/* ---------- Coding journal ---------- */}
        <SectionHeading
          icon="notebook-pen"
          eyebrow="What you tried, where you slipped"
          title="Coding journal"
        />

        <JournalField
          key="journal-approach"
          icon="lightbulb"
          title="Initial approach"
          accent={accentForTone('peach')}
          body={journal.approach}
          onChangeBody={patchJournal('approach')}
          placeholder="How did you crack it? Name the pattern."
          style={{ marginBottom: approachError ? 6 : 18 }}
        />
        {approachError ? (
          <AppText variant="caption" color={colors.danger} style={{ marginBottom: 18 }}>
            {approachError}
          </AppText>
        ) : null}
        <JournalField
          key="journal-mistakes"
          icon="alert"
          title="Mistakes made"
          accent={accentForTone('butter')}
          body={journal.mistakes}
          onChangeBody={patchJournal('mistakes')}
          placeholder="Where did you slip — TLE, off-by-one, wrong invariant?"
          style={{ marginBottom: 18 }}
        />
        <JournalField
          key="journal-optimal"
          icon="sparkles"
          title="Optimal solution"
          accent={accentForTone('mint')}
          body={journal.optimal}
          onChangeBody={patchJournal('optimal')}
          placeholder="The clean, intended approach."
          style={{ marginBottom: 18 }}
        />
        <JournalField
          key="journal-interview-tip"
          icon="brain"
          title="Interview tip"
          accent={accentForTone('lavender')}
          body={journal.interviewTip}
          onChangeBody={patchJournal('interviewTip')}
          placeholder="What to mention out loud — trade-offs, follow-ups, the name-drop."
          style={{ marginBottom: notesError ? 6 : 24 }}
        />
        {notesError ? (
          <AppText variant="caption" color={colors.danger} style={{ marginBottom: 24 }}>
            {notesError}
          </AppText>
        ) : null}

        {/* ---------- Complexity ---------- */}
        <SectionHeading icon="activity" title="Complexity" />
        <View className="flex-row" style={{ gap: 10, marginBottom: 24 }}>
          <View style={{ flex: 1 }}>
            <SoftInput
              key="problem-time-complexity"
              label="Time"
              value={journal.timeComplexity}
              onChangeText={patchJournal('timeComplexity')}
              placeholder="O(n)"
              autoCapitalize="none"
              autoCorrect={false}
              error={timeError}
            />
          </View>
          <View style={{ flex: 1 }}>
            <SoftInput
              key="problem-space-complexity"
              label="Space"
              value={journal.spaceComplexity}
              onChangeText={patchJournal('spaceComplexity')}
              placeholder="O(1)"
              autoCapitalize="none"
              autoCorrect={false}
              error={spaceError}
            />
          </View>
        </View>

        {/* ---------- Spaced-repetition note (mint wash) ---------- */}
        <SoftCard tone="mint" radius={13} padding={14} style={{ marginBottom: 24 }}>
          {({ accent }) => (
            <View className="flex-row items-center" style={{ gap: 10 }}>
              <Icon name="repeat" size={18} color={accent} />
              <AppText variant="caption" color={colors.ash} style={{ flex: 1, lineHeight: 17 }}>
                Mark this solved and the first revision is auto-scheduled — the
                spacing ladder adapts as you recall it.
              </AppText>
            </View>
          )}
        </SoftCard>

        {/* ---------- Notes ---------- */}
        {problem.notes ? (
          <>
            <SectionHeading icon="pin" title="Quick note" />
            <SoftCard variant="inset" radius={13} padding={14} style={{ marginBottom: 24 }}>
              <AppText variant="body" color={colors.ash} style={{ lineHeight: 20 }}>
                {problem.notes}
              </AppText>
            </SoftCard>
          </>
        ) : null}

        {/* ---------- Save error ---------- */}
        {saveError ? (
          <View
            style={{
              marginBottom: 14,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: radii.input,
              backgroundColor: colors.dangerWash,
              borderWidth: 1,
              borderColor: colors.danger,
            }}
          >
            <AppText variant="caption" color={colors.danger}>
              {saveError}
            </AppText>
          </View>
        ) : null}

        {/* ---------- Actions: save journal + mark solved ---------- */}
        <View className="flex-row items-center" style={{ gap: 16 }}>
          <PillButton
            label={savedFlash ? 'Saved' : 'Save journal'}
            variant="black"
            size="md"
            disabled={updateProblem.isPending || !journalValid}
            onPress={onSaveJournal}
            icon={
              savedFlash ? (
                <Icon name="check" size={15} color={colors.onPrimary} />
              ) : undefined
            }
          />
          {updateProblem.isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <TextLink
              label="Mark solved"
              onPress={() => applyStatus('SOLVED')}
              icon={<Icon name="check-circle" size={15} color="ink" />}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
