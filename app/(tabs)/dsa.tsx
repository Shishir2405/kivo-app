import React, { useMemo, useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { GrayMark } from '@/components/ui/AppHeader';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { Select } from '@/components/ui/Select';
import { SoftInput } from '@/components/ui/SoftInput';
import { Icon } from '@/components/ui/Icon';
import { AddButton, QuickAddRow, EmptyStateCTA } from '@/components/ui/AddButton';
import { FormSheet } from '@/components/ui/FormSheet';
import { TopicCard } from '@/components/dsa/TopicCard';
import { InfoTile } from '@/components/dsa/InfoTile';
import { SectionHeading } from '@/components/dsa/SectionHeading';
import { ListSkeleton, ErrorState, EmptyState } from '@/components/dsa/StateViews';
import { useDsaTopics, useCreateDsaTopic } from '@/hooks/api';
import { motion } from '@/theme/tokens';
import { useTheme } from '@/theme';
import type { Difficulty, DsaTopic } from '@/types/models';

/* ================================================================== */
/* Topic filter (segmented control)                                    */
/* ================================================================== */

type TopicFilter = 'all' | 'active' | 'mastered';

const TOPIC_FILTERS: SegmentedOption<TopicFilter>[] = [
  { label: 'All', value: 'all' },
  { label: 'In progress', value: 'active' },
  { label: 'Mastered', value: 'mastered' },
];

const MASTERED_THRESHOLD = 80;

const DIFFICULTY_OPTIONS: { label: string; value: Difficulty }[] = [
  { label: 'Easy', value: 'EASY' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Hard', value: 'HARD' },
];

function topicScore(t: DsaTopic): number {
  const score = t.mastery ?? t.progress ?? 0;
  return Number.isFinite(score) ? score : 0;
}

/* ================================================================== */
/* Screen                                                              */
/* ================================================================== */

export default function DsaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, accentForTone } = useTheme();

  const { data, isLoading, isError, error, refetch, isRefetching } = useDsaTopics();
  const [filter, setFilter] = useState<TopicFilter>('all');

  // ---- Create-topic sheet ----
  const createTopic = useCreateDsaTopic();
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDifficulty, setNewDifficulty] = useState<Difficulty>('MEDIUM');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createAttempted, setCreateAttempted] = useState(false);

  // Backend dsa-topic validator: name required, max 120; description max 2000.
  const TITLE_MAX = 120;
  const DESC_MAX = 2000;
  const trimmedTitle = newTitle.trim();
  // Required-empty message is held back until a submit attempt; the length cap
  // surfaces immediately as the user types past it.
  const titleError =
    trimmedTitle.length === 0
      ? createAttempted
        ? 'Give the topic a name.'
        : undefined
      : trimmedTitle.length > TITLE_MAX
      ? `Title must be at most ${TITLE_MAX} characters.`
      : undefined;
  const descError =
    newDescription.trim().length > DESC_MAX ? `Description must be at most ${DESC_MAX} characters.` : undefined;
  const createValid = trimmedTitle.length > 0 && trimmedTitle.length <= TITLE_MAX && !descError;

  const openCreate = () => {
    setNewTitle('');
    setNewDescription('');
    setNewDifficulty('MEDIUM');
    setCreateError(null);
    setCreateAttempted(false);
    setCreateOpen(true);
  };

  const submitCreate = () => {
    if (!createValid) {
      setCreateAttempted(true);
      return;
    }
    setCreateError(null);
    createTopic.mutate(
      {
        title: trimmedTitle,
        description: newDescription.trim() || undefined,
        difficulty: newDifficulty,
      },
      {
        onSuccess: () => setCreateOpen(false),
        onError: (e) => setCreateError(e.message),
      },
    );
  };

  const topics = useMemo<DsaTopic[]>(() => data ?? [], [data]);

  const filteredTopics = useMemo<DsaTopic[]>(() => {
    if (filter === 'all') return topics;
    if (filter === 'mastered') return topics.filter((t) => topicScore(t) >= MASTERED_THRESHOLD);
    return topics.filter((t) => topicScore(t) < MASTERED_THRESHOLD);
  }, [topics, filter]);

  // Aggregate progress across all tracked topics.
  const summary = useMemo(() => {
    const totalSolved = topics.reduce((n, t) => n + (t.solvedProblems ?? 0), 0);
    const totalProblems = topics.reduce((n, t) => n + (t.totalProblems ?? 0), 0);
    const mastered = topics.filter((t) => topicScore(t) >= MASTERED_THRESHOLD).length;
    const pct = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;
    return { totalSolved, totalProblems, mastered, pct };
  }, [topics]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: 120,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
            onRefresh={() => void refetch()}
            tintColor={colors.muted}
          />
        }
      >
        {/* ---------- Brand watermark ---------- */}
        <GrayMark size={22} style={{ marginBottom: 10 }} />

        {/* ---------- Header ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: motion.duration.transition }}
          style={{ marginBottom: 16 }}
        >
          <View className="flex-row items-start justify-between" style={{ gap: 12 }}>
            <View style={{ flex: 1 }}>
              <AppText variant="body" color={colors.muted} weight="medium">
                DSA Mode
              </AppText>
              <AppText variant="headingLg" display style={{ marginTop: 2 }}>
                Topics
              </AppText>
              <AppText variant="body" color={colors.ash} style={{ marginTop: 4 }}>
                {topics.length > 0
                  ? `${summary.totalSolved} of ${summary.totalProblems} problems solved`
                  : 'Your data-structures & algorithms practice'}
              </AppText>
            </View>
            <AddButton onPress={openCreate} accessibilityLabel="New topic" />
          </View>
        </MotiView>

        {/* ---------- Summary stats (data washes) ---------- */}
        {topics.length > 0 ? (
          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: motion.duration.transition, delay: 60 }}
            className="flex-row"
            style={{ gap: 10, marginBottom: 20 }}
          >
            <InfoTile
              icon="check-circle"
              value={`${summary.totalSolved}`}
              label="Solved"
              surface="mint"
              style={{ flex: 1 }}
            />
            <InfoTile
              icon="trending-up"
              value={`${summary.pct}%`}
              label="Overall"
              surface="sky"
              style={{ flex: 1 }}
            />
            <InfoTile
              icon="crown"
              value={`${summary.mastered}`}
              label="Mastered"
              surface="butter"
              style={{ flex: 1 }}
            />
          </MotiView>
        ) : null}

        {/* ---------- Topics ---------- */}
        <SectionHeading
          icon="layers"
          iconColor={accentForTone('lavender')}
          title="All topics"
          trailing={
            topics.length > 0 ? (
              <AppText variant="caption" color={colors.muted}>
                {filteredTopics.length}
              </AppText>
            ) : undefined
          }
        />

        {topics.length > 0 ? (
          <SegmentedTabs
            options={TOPIC_FILTERS}
            value={filter}
            onChange={setFilter}
            style={{ marginBottom: 14 }}
          />
        ) : null}

        {/* States */}
        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : isError ? (
          <ErrorState
            error={error}
            onRetry={() => void refetch()}
            title="Couldn't load topics"
          />
        ) : topics.length === 0 ? (
          <EmptyStateCTA
            icon="layers"
            title="No topics yet"
            description="Add your first topic to start tracking progress and mastery."
            actionLabel="New topic"
            onAction={openCreate}
          />
        ) : filteredTopics.length === 0 ? (
          <EmptyState
            icon={filter === 'mastered' ? 'crown' : 'activity'}
            title="Nothing here yet"
            body={
              filter === 'mastered'
                ? 'No mastered topics yet. Keep solving — topics cross 80% mastery and land here.'
                : 'Nothing in progress right now. Open a topic to start.'
            }
          />
        ) : (
          <View style={{ gap: 10 }}>
            <QuickAddRow label="Add a topic" onPress={openCreate} />
            {filteredTopics.map((topic, i) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                index={i}
                onPress={() => router.push(`/dsa-topic/${topic.id}`)}
              />
            ))}
          </View>
        )}

        {/* Subtle footer link to the full problem bank */}
        {topics.length > 0 ? (
          <View style={{ marginTop: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            <Icon name="info" size={13} color="hairline" />
            <AppText variant="caption" color={colors.muted}>
              Tap a topic to see its problems and notes
            </AppText>
          </View>
        ) : null}
      </ScrollView>

      {/* Create-topic sheet */}
      <FormSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={submitCreate}
        title="New topic"
        subtitle="Track a new data-structure or algorithm area"
        pending={createTopic.isPending}
        submitDisabled={!createValid}
        submitLabel="Create topic"
        error={createTopic.error?.message ?? null}
      >
        <SoftInput
          label="Title"
          placeholder="e.g. Binary Search"
          value={newTitle}
          onChangeText={(t) => {
            setNewTitle(t);
            if (createError) setCreateError(null);
          }}
          error={titleError}
        />
        <SoftInput
          label="Description"
          placeholder="What this topic covers (optional)"
          value={newDescription}
          onChangeText={(t) => {
            setNewDescription(t);
            if (createError) setCreateError(null);
          }}
          multiline
          error={descError}
          style={{ minHeight: 72, textAlignVertical: 'top', paddingTop: 4 }}
        />
        <Select
          label="Difficulty"
          options={DIFFICULTY_OPTIONS}
          value={newDifficulty}
          onChange={setNewDifficulty}
        />
      </FormSheet>
    </View>
  );
}
