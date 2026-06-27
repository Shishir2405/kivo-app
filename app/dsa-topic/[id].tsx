import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Tag } from '@/components/ui/Tag';
import { Icon } from '@/components/ui/Icon';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { Select } from '@/components/ui/Select';
import { SoftInput } from '@/components/ui/SoftInput';
import { PillButton, TextLink } from '@/components/ui/PillButton';
import { AddButton, QuickAddRow } from '@/components/ui/AddButton';
import { FormSheet } from '@/components/ui/FormSheet';
import { ScreenHeader } from '@/components/dsa/ScreenHeader';
import { SectionHeading } from '@/components/dsa/SectionHeading';
import { ProgressBar } from '@/components/dsa/ProgressBar';
import { InfoTile } from '@/components/dsa/InfoTile';
import { ProblemRow } from '@/components/dsa/ProblemRow';
import { LoadingState, ListSkeleton, ErrorState, EmptyState } from '@/components/dsa/StateViews';
import {
  difficultyColor,
  DIFFICULTY_ICON,
  DIFFICULTY_LABEL,
  DIFFICULTY_TONE,
  CONFIDENCE_LABEL,
  CONFIDENCE_TONE,
  formatMinutes,
  formatShortDate,
  masteryMeta,
  progressColor,
} from '@/components/dsa/dsaMeta';
import {
  useDsaTopics,
  useDsaProblems,
  useRevisions,
  useUpdateDsaTopic,
  useCompleteDsaTopic,
  useDeleteDsaTopic,
  useCreateProblem,
  useDeleteProblem,
} from '@/hooks/api';
import { motion, pressOpacity } from '@/theme/tokens';
import { useTheme } from '@/theme';
import type { Difficulty, Problem, ProblemStatus, Revision } from '@/types/models';

/* ================================================================== */
/* Problem filter (segmented control)                                  */
/* ================================================================== */

type ProblemFilter = 'all' | 'open' | 'solved';

const PROBLEM_FILTERS: SegmentedOption<ProblemFilter>[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Solved', value: 'solved' },
];

const DONE_STATUSES: ProblemStatus[] = ['SOLVED', 'MASTERED'];

const DIFFICULTY_OPTIONS: { label: string; value: Difficulty }[] = [
  { label: 'Easy', value: 'EASY' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Hard', value: 'HARD' },
];

/* ================================================================== */
/* Revision-history row (flat, hairline-separated)                     */
/* ================================================================== */

function RevisionHistoryRow({ rev, isLast }: { rev: Revision; isLast: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      className="flex-row items-center"
      style={{
        gap: 10,
        paddingVertical: 10,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.hairline,
      }}
    >
      <View style={{ flex: 1 }}>
        <AppText variant="body" weight="medium" numberOfLines={1}>
          {rev.problemTitle}
        </AppText>
        <AppText variant="caption" color={colors.muted} style={{ fontSize: 10.5, marginTop: 2 }}>
          {rev.reviewCount}× · every {rev.intervalDays}d · last {formatShortDate(rev.lastReviewedAt)}
        </AppText>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Tag label={CONFIDENCE_LABEL[rev.confidence] ?? '—'} tone={CONFIDENCE_TONE[rev.confidence] ?? 'neutral'} size="sm" />
        {rev.dueToday ? (
          <AppText variant="caption" weight="medium" color={colors.primary} style={{ fontSize: 10 }}>
            Due today
          </AppText>
        ) : (
          <AppText variant="caption" color={colors.muted} style={{ fontSize: 10 }}>
            Next {formatShortDate(rev.dueDate)}
          </AppText>
        )}
      </View>
    </View>
  );
}

/* ================================================================== */
/* Screen                                                              */
/* ================================================================== */

export default function TopicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, accentForTone } = useTheme();

  const topicsQuery = useDsaTopics();
  const problemsQuery = useDsaProblems();
  const revisionsQuery = useRevisions();

  const updateTopic = useUpdateDsaTopic();
  const completeTopic = useCompleteDsaTopic();
  const deleteTopic = useDeleteDsaTopic();
  const createProblem = useCreateProblem();
  const deleteProblem = useDeleteProblem();

  const topic = useMemo(
    () => (topicsQuery.data ?? []).find((t) => t.id === id),
    [topicsQuery.data, id],
  );

  const problems = useMemo<Problem[]>(
    () => (problemsQuery.data ?? []).filter((p) => p.topicId === id),
    [problemsQuery.data, id],
  );

  const revisions = useMemo<Revision[]>(() => {
    if (!topic) return [];
    return (revisionsQuery.data ?? []).filter((r) => r.topicTitle === topic.title);
  }, [revisionsQuery.data, topic]);

  const [bookmarked, setBookmarked] = useState(false);
  const [filter, setFilter] = useState<ProblemFilter>('all');

  // Backend validators: dsa-topic name max 120 / description max 2000;
  // dsa-problem title max 200 / platform(source) max 60.
  const TOPIC_TITLE_MAX = 120;
  const TOPIC_DESC_MAX = 2000;
  const PROBLEM_TITLE_MAX = 200;
  const PROBLEM_SOURCE_MAX = 60;

  // ---- Edit-topic sheet ----
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDifficulty, setEditDifficulty] = useState<Difficulty>('MEDIUM');
  const [editError, setEditError] = useState<string | null>(null);
  const [editAttempted, setEditAttempted] = useState(false);

  // ---- Add-problem sheet ----
  const [problemOpen, setProblemOpen] = useState(false);
  const [problemTitle, setProblemTitle] = useState('');
  const [problemSource, setProblemSource] = useState('');
  const [problemDifficulty, setProblemDifficulty] = useState<Difficulty>('MEDIUM');
  const [problemError, setProblemError] = useState<string | null>(null);
  const [problemAttempted, setProblemAttempted] = useState(false);

  const editTrimmedTitle = editTitle.trim();
  const editTitleError =
    editTrimmedTitle.length === 0
      ? editAttempted
        ? 'Give the topic a name.'
        : undefined
      : editTrimmedTitle.length > TOPIC_TITLE_MAX
      ? `Title must be at most ${TOPIC_TITLE_MAX} characters.`
      : undefined;
  const editDescError =
    editDescription.trim().length > TOPIC_DESC_MAX
      ? `Description must be at most ${TOPIC_DESC_MAX} characters.`
      : undefined;
  const editValid =
    editTrimmedTitle.length > 0 && editTrimmedTitle.length <= TOPIC_TITLE_MAX && !editDescError;

  const problemTrimmedTitle = problemTitle.trim();
  const problemTitleError =
    problemTrimmedTitle.length === 0
      ? problemAttempted
        ? 'Give the problem a name.'
        : undefined
      : problemTrimmedTitle.length > PROBLEM_TITLE_MAX
      ? `Title must be at most ${PROBLEM_TITLE_MAX} characters.`
      : undefined;
  const problemSourceError =
    problemSource.trim().length > PROBLEM_SOURCE_MAX
      ? `Source must be at most ${PROBLEM_SOURCE_MAX} characters.`
      : undefined;
  const problemValid =
    problemTrimmedTitle.length > 0 &&
    problemTrimmedTitle.length <= PROBLEM_TITLE_MAX &&
    !problemSourceError;

  const openEdit = () => {
    if (!topic) return;
    setEditTitle(topic.title);
    setEditDescription(topic.description ?? '');
    setEditDifficulty(topic.difficulty);
    setEditError(null);
    setEditAttempted(false);
    setEditOpen(true);
  };

  const submitEdit = () => {
    if (!topic) return;
    if (!editValid) {
      setEditAttempted(true);
      return;
    }
    setEditError(null);
    updateTopic.mutate(
      {
        id: topic.id,
        patch: { title: editTrimmedTitle, description: editDescription.trim(), difficulty: editDifficulty },
      },
      {
        onSuccess: () => setEditOpen(false),
        onError: (e) => setEditError(e.message),
      },
    );
  };

  const openAddProblem = () => {
    setProblemTitle('');
    setProblemSource('');
    setProblemDifficulty(topic?.difficulty ?? 'MEDIUM');
    setProblemError(null);
    setProblemAttempted(false);
    setProblemOpen(true);
  };

  const submitAddProblem = () => {
    if (!topic) return;
    if (!problemValid) {
      setProblemAttempted(true);
      return;
    }
    setProblemError(null);
    createProblem.mutate(
      {
        topicId: topic.id,
        title: problemTrimmedTitle,
        difficulty: problemDifficulty,
        source: problemSource.trim() || undefined,
      },
      {
        onSuccess: () => setProblemOpen(false),
        onError: (e) => setProblemError(e.message),
      },
    );
  };

  const confirmComplete = () => {
    if (!topic || completeTopic.isPending) return;
    completeTopic.mutate(topic.id, {
      onError: (e) => Alert.alert('Couldn’t update', e.message),
    });
  };

  const confirmDeleteTopic = () => {
    if (!topic || deleteTopic.isPending) return;
    Alert.alert(
      'Delete topic',
      `Remove “${topic.title}” and stop tracking it? This can’t be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteTopic.mutate(topic.id, {
              onSuccess: () => handleBack(),
              onError: (e) => Alert.alert('Couldn’t delete', e.message),
            }),
        },
      ],
    );
  };

  const confirmDeleteProblem = (p: Problem) => {
    if (deleteProblem.isPending) return;
    Alert.alert(
      'Delete problem',
      `Remove “${p.title}”? This can’t be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteProblem.mutate(p.id, {
              onError: (e) => Alert.alert('Couldn’t delete', e.message),
            }),
        },
      ],
    );
  };

  const filteredProblems = useMemo<Problem[]>(() => {
    if (filter === 'all') return problems;
    if (filter === 'solved') return problems.filter((p) => DONE_STATUSES.includes(p.status));
    return problems.filter((p) => !DONE_STATUSES.includes(p.status));
  }, [problems, filter]);

  const doneCount = useMemo(
    () => problems.filter((p) => DONE_STATUSES.includes(p.status)).length,
    [problems],
  );

  const handleBack = () => {
    if (router.canGoBack()) router.back();
  };

  /* ---- Topics still loading: show a quiet loading header ---- */
  if (topicsQuery.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16 }}>
          <ScreenHeader eyebrow="Topic" title="Loading…" style={{ marginBottom: 20 }} />
          <LoadingState label="Loading topic" />
        </View>
      </View>
    );
  }

  /* ---- Topics failed to load ---- */
  if (topicsQuery.isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16 }}>
          <ScreenHeader eyebrow="Topic" title="Couldn't load" style={{ marginBottom: 20 }} />
          <ErrorState
            error={topicsQuery.error}
            onRetry={() => void topicsQuery.refetch()}
            title="Couldn't load topic"
          />
        </View>
      </View>
    );
  }

  /* ---- Not found ---- */
  if (!topic) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16 }}>
          <ScreenHeader eyebrow="Topic" title="Not found" style={{ marginBottom: 20 }} />
          <EmptyState
            icon="alert"
            title="This topic doesn't exist"
            body="It may have been removed. Go back and pick another topic."
          />
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <Pressable
              onPress={handleBack}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressOpacity({ pressed }) })}
            >
              <AppText variant="body" weight="medium" color={colors.ink}>
                Back to topics
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const progress = Number.isFinite(topic.progress) ? topic.progress : 0;
  const masteryScore = topic.mastery ?? progress;
  const mastery = masteryMeta(masteryScore, accentForTone, colors);
  const barColor = progressColor(progress, colors);
  const estimatedMinutes = topic.estimatedMinutes ?? 0;
  const estimatedSpent = Math.round((estimatedMinutes * progress) / 100);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: 40,
        }}
      >
        {/* ---------- Header ---------- */}
        <ScreenHeader
          eyebrow="Topic"
          title={topic.title}
          onBack={handleBack}
          trailing={
            <View className="flex-row items-center" style={{ gap: 14 }}>
              <Pressable
                onPress={openEdit}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Edit topic"
                style={({ pressed }) => ({ opacity: pressOpacity({ pressed }) })}
              >
                <Icon name="pen" size={19} color="muted" />
              </Pressable>
              <Pressable
                onPress={confirmDeleteTopic}
                hitSlop={10}
                disabled={deleteTopic.isPending}
                accessibilityRole="button"
                accessibilityLabel="Delete topic"
                style={({ pressed }) => ({ opacity: deleteTopic.isPending ? 0.4 : pressOpacity({ pressed }) })}
              >
                {deleteTopic.isPending ? (
                  <ActivityIndicator size="small" color={colors.muted} />
                ) : (
                  <Icon name="trash" size={19} color="danger" />
                )}
              </Pressable>
              <Pressable
                onPress={() => setBookmarked((b) => !b)}
                hitSlop={10}
                accessibilityLabel="Bookmark topic"
                style={({ pressed }) => ({ opacity: pressOpacity({ pressed }) })}
              >
                <Icon
                  name="bookmark"
                  size={20}
                  color={bookmarked ? 'primary' : 'muted'}
                  weight={bookmarked ? 'fill' : 'light'}
                />
              </Pressable>
            </View>
          }
          style={{ marginBottom: 20 }}
        />

        {/* ---------- Hero ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: motion.duration.transition }}
        >
          <SoftCard tone="lavender" radius={18} padding={16} style={{ marginBottom: 16 }}>
          {({ accent }) => (
          <>
            <View className="flex-row items-center" style={{ gap: 10 }}>
              <Icon name={topic.emoji} size={18} color={accent} />
              <AppText variant="heading" display style={{ flex: 1 }} numberOfLines={1}>
                {topic.title}
              </AppText>
            </View>

            {topic.description ? (
              <AppText variant="body" color={colors.ash} style={{ marginTop: 8 }}>
                {topic.description}
              </AppText>
            ) : null}

            {/* Tags */}
            <View className="flex-row items-center flex-wrap" style={{ gap: 6, marginTop: 12 }}>
              <Tag
                label={DIFFICULTY_LABEL[topic.difficulty]}
                tone={DIFFICULTY_TONE[topic.difficulty]}
                size="sm"
                icon={<Icon name={DIFFICULTY_ICON[topic.difficulty]} size={11} color={difficultyColor(topic.difficulty, accentForTone)} />}
              />
              <Tag
                label={mastery.label}
                tone={mastery.tone}
                size="sm"
                icon={<Icon name={mastery.icon} size={11} color={mastery.color} />}
              />
            </View>

            {/* Progress */}
            <View style={{ marginTop: 14, gap: 6 }}>
              <ProgressBar progress={progress} color={barColor} height={6} />
              <View className="flex-row items-center justify-between">
                <AppText variant="caption" color={colors.muted} style={{ fontSize: 11 }}>
                  {topic.solvedProblems ?? 0} of {topic.totalProblems ?? 0} solved
                </AppText>
                <AppText variant="caption" weight="medium" color={colors.ink} style={{ fontSize: 11 }}>
                  {progress}%
                </AppText>
              </View>
            </View>

            {/* Tag chips */}
            {topic.tags && topic.tags.length > 0 ? (
              <View className="flex-row flex-wrap" style={{ gap: 6, marginTop: 12 }}>
                {topic.tags.map((t) => (
                  <Tag key={t} label={t} tone="neutral" size="sm" />
                ))}
              </View>
            ) : null}
            </>
          )}
        </SoftCard>
        </MotiView>

        {/* ---------- Stat grid ---------- */}
        <View className="flex-row" style={{ gap: 10, marginBottom: 22 }}>
          <InfoTile
            icon="timer"
            value={formatMinutes(estimatedSpent)}
            label="Time spent"
            style={{ flex: 1 }}
          />
          <InfoTile
            icon="target"
            value={formatMinutes(estimatedMinutes)}
            label="Est. total"
            style={{ flex: 1 }}
          />
          <InfoTile
            icon={mastery.icon}
            value={`${masteryScore}%`}
            label="Mastery"
            valueColor={mastery.color}
            surface="warm"
            style={{ flex: 1 }}
          />
        </View>

        {/* ---------- Mark complete ---------- */}
        <View className="flex-row items-center" style={{ gap: 14, marginBottom: 22 }}>
          <PillButton
            label="Mark mastered"
            variant="black"
            size="md"
            disabled={completeTopic.isPending}
            onPress={confirmComplete}
          />
          {completeTopic.isPending ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        </View>

        {/* ---------- Problems ---------- */}
        <SectionHeading
          icon="list"
          title="Problems"
          trailing={
            <View className="flex-row items-center" style={{ gap: 10 }}>
              {problems.length > 0 ? (
                <AppText variant="caption" weight="medium" color={colors.muted}>
                  {doneCount}/{problems.length}
                </AppText>
              ) : null}
              <AddButton onPress={openAddProblem} size={28} variant="soft" accessibilityLabel="Add problem" />
            </View>
          }
        />

        {problemsQuery.isLoading ? (
          <ListSkeleton rows={3} />
        ) : problemsQuery.isError ? (
          <ErrorState
            error={problemsQuery.error}
            onRetry={() => void problemsQuery.refetch()}
            title="Couldn't load problems"
          />
        ) : problems.length === 0 ? (
          <View style={{ gap: 10 }}>
            <EmptyState
              icon="list"
              title="No problems yet"
              body="Add the first problem to track under this topic."
            />
            <QuickAddRow label="Add a problem" onPress={openAddProblem} />
          </View>
        ) : (
          <>
            <SegmentedTabs
              options={PROBLEM_FILTERS}
              value={filter}
              onChange={setFilter}
              style={{ marginBottom: 12 }}
            />
            {filteredProblems.length === 0 ? (
              <EmptyState
                icon="check-circle"
                title={filter === 'solved' ? 'Nothing solved yet' : 'All clear here'}
                body={
                  filter === 'solved'
                    ? 'No solved problems in this view yet — keep going.'
                    : 'Everything in this view is done. Nice work.'
                }
              />
            ) : (
              <View style={{ gap: 10 }}>
                <QuickAddRow label="Add a problem" onPress={openAddProblem} />
                {filteredProblems.map((p, i) => (
                  <MotiView
                    key={p.id}
                    from={{ opacity: 0, translateY: 6 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: motion.duration.transition, delay: 30 + i * 40 }}
                  >
                    <Pressable
                      onLongPress={() => confirmDeleteProblem(p)}
                      delayLongPress={350}
                      accessibilityLabel={`${p.title}. Long-press to delete.`}
                    >
                      <ProblemRow problem={p} onPress={() => router.push(`/problem/${p.id}`)} />
                    </Pressable>
                  </MotiView>
                ))}
              </View>
            )}
          </>
        )}

        {/* ---------- Revision history ---------- */}
        <View style={{ marginTop: 24 }}>
          <SectionHeading icon="repeat" title="Revision history" />
          {revisionsQuery.isLoading ? (
            <LoadingState label="Loading revisions" />
          ) : revisionsQuery.isError ? (
            <ErrorState
              error={revisionsQuery.error}
              onRetry={() => void revisionsQuery.refetch()}
              title="Couldn't load revisions"
            />
          ) : revisions.length === 0 ? (
            <EmptyState
              icon="repeat"
              title="No revisions yet"
              body="Solve and flag problems to start the spaced-repetition cycle."
            />
          ) : (
            <SoftCard radius={16} padding={14}>
              {revisions.map((rev, i) => (
                <RevisionHistoryRow key={rev.id} rev={rev} isLast={i === revisions.length - 1} />
              ))}
            </SoftCard>
          )}
        </View>
      </ScrollView>

      {/* Edit-topic sheet */}
      <FormSheet
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={submitEdit}
        title="Edit topic"
        pending={updateTopic.isPending}
        submitDisabled={!editValid}
        error={editError ?? updateTopic.error?.message ?? null}
      >
        <SoftInput
          label="Title"
          placeholder="Topic name"
          value={editTitle}
          onChangeText={(t) => {
            setEditTitle(t);
            if (editError) setEditError(null);
          }}
          error={editTitleError}
        />
        <SoftInput
          label="Description"
          placeholder="What this topic covers (optional)"
          value={editDescription}
          onChangeText={(t) => {
            setEditDescription(t);
            if (editError) setEditError(null);
          }}
          multiline
          error={editDescError}
          style={{ minHeight: 72, textAlignVertical: 'top', paddingTop: 4 }}
        />
        <Select
          label="Difficulty"
          options={DIFFICULTY_OPTIONS}
          value={editDifficulty}
          onChange={setEditDifficulty}
        />
      </FormSheet>

      {/* Add-problem sheet */}
      <FormSheet
        visible={problemOpen}
        onClose={() => setProblemOpen(false)}
        onSubmit={submitAddProblem}
        title="Add problem"
        subtitle={topic ? `Under ${topic.title}` : undefined}
        pending={createProblem.isPending}
        submitDisabled={!problemValid}
        submitLabel="Add problem"
        error={problemError ?? createProblem.error?.message ?? null}
      >
        <SoftInput
          label="Title"
          placeholder="e.g. Two Sum"
          value={problemTitle}
          onChangeText={(t) => {
            setProblemTitle(t);
            if (problemError) setProblemError(null);
          }}
          error={problemTitleError}
        />
        <SoftInput
          label="Source"
          placeholder="e.g. LeetCode 1 (optional)"
          value={problemSource}
          onChangeText={(t) => {
            setProblemSource(t);
            if (problemError) setProblemError(null);
          }}
          error={problemSourceError}
        />
        <Select
          label="Difficulty"
          options={DIFFICULTY_OPTIONS}
          value={problemDifficulty}
          onChange={setProblemDifficulty}
        />
      </FormSheet>
    </View>
  );
}
