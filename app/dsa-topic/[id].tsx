import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Tag } from '@/components/ui/Tag';
import { Icon } from '@/components/ui/Icon';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { ScreenHeader } from '@/components/dsa/ScreenHeader';
import { SectionHeading } from '@/components/dsa/SectionHeading';
import { ProgressBar } from '@/components/dsa/ProgressBar';
import { InfoTile } from '@/components/dsa/InfoTile';
import { ProblemRow } from '@/components/dsa/ProblemRow';
import { LoadingState, ListSkeleton, ErrorState, EmptyState } from '@/components/dsa/StateViews';
import {
  DIFFICULTY_LABEL,
  DIFFICULTY_TONE,
  CONFIDENCE_LABEL,
  CONFIDENCE_TONE,
  formatMinutes,
  formatShortDate,
  masteryMeta,
  progressColor,
} from '@/components/dsa/dsaMeta';
import { useDsaTopics, useDsaProblems, useRevisions } from '@/hooks/api';
import { colors, pressOpacity } from '@/theme/tokens';
import type { Problem, ProblemStatus, Revision } from '@/types/models';

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

/* ================================================================== */
/* Revision-history row (flat, hairline-separated)                     */
/* ================================================================== */

function RevisionHistoryRow({ rev, isLast }: { rev: Revision; isLast: boolean }) {
  return (
    <View
      className="flex-row items-center"
      style={{
        gap: 10,
        paddingVertical: 10,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.dove,
      }}
    >
      <View style={{ flex: 1 }}>
        <AppText variant="body" weight="medium" numberOfLines={1}>
          {rev.problemTitle}
        </AppText>
        <AppText variant="caption" color={colors.graphite} style={{ fontSize: 10.5, marginTop: 2 }}>
          {rev.reviewCount}× · every {rev.intervalDays}d · last {formatShortDate(rev.lastReviewedAt)}
        </AppText>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Tag label={CONFIDENCE_LABEL[rev.confidence] ?? '—'} tone={CONFIDENCE_TONE[rev.confidence] ?? 'neutral'} size="sm" />
        {rev.dueToday ? (
          <AppText variant="caption" weight="medium" color={colors.rust} style={{ fontSize: 10 }}>
            Due today
          </AppText>
        ) : (
          <AppText variant="caption" color={colors.graphite} style={{ fontSize: 10 }}>
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

  const topicsQuery = useDsaTopics();
  const problemsQuery = useDsaProblems();
  const revisionsQuery = useRevisions();

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
      <View style={{ flex: 1, backgroundColor: colors.white }}>
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
      <View style={{ flex: 1, backgroundColor: colors.white }}>
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
      <View style={{ flex: 1, backgroundColor: colors.white }}>
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
  const mastery = masteryMeta(masteryScore);
  const barColor = progressColor(progress);
  const estimatedMinutes = topic.estimatedMinutes ?? 0;
  const estimatedSpent = Math.round((estimatedMinutes * progress) / 100);

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
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
            <Pressable
              onPress={() => setBookmarked((b) => !b)}
              hitSlop={10}
              accessibilityLabel="Bookmark topic"
              style={({ pressed }) => ({ opacity: pressOpacity({ pressed }) })}
            >
              <Icon
                name="bookmark"
                size={20}
                color={bookmarked ? 'rust' : 'graphite'}
                weight={bookmarked ? 'fill' : 'light'}
              />
            </Pressable>
          }
          style={{ marginBottom: 20 }}
        />

        {/* ---------- Hero ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 320 }}
        >
          <SoftCard radius={18} padding={16} style={{ marginBottom: 16 }}>
            <View className="flex-row items-center" style={{ gap: 10 }}>
              <Icon name={topic.emoji} size={18} color="ink" />
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
              <Tag label={DIFFICULTY_LABEL[topic.difficulty]} tone={DIFFICULTY_TONE[topic.difficulty]} size="sm" />
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
                <AppText variant="caption" color={colors.graphite} style={{ fontSize: 11 }}>
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

        {/* ---------- Problems ---------- */}
        <SectionHeading
          icon="list"
          title="Problems"
          trailing={
            problems.length > 0 ? (
              <AppText variant="caption" weight="medium" color={colors.graphite}>
                {doneCount}/{problems.length}
              </AppText>
            ) : undefined
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
          <EmptyState
            icon="list"
            title="No problems yet"
            body="Problems tracked under this topic will appear here."
          />
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
                {filteredProblems.map((p, i) => (
                  <MotiView
                    key={p.id}
                    from={{ opacity: 0, translateY: 6 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 280, delay: 30 + i * 40 }}
                  >
                    <ProblemRow problem={p} onPress={() => router.push(`/problem/${p.id}`)} />
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
    </View>
  );
}
