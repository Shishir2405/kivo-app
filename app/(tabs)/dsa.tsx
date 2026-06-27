import React, { useMemo, useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { GrayMark } from '@/components/ui/AppHeader';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { Icon } from '@/components/ui/Icon';
import { TopicCard } from '@/components/dsa/TopicCard';
import { InfoTile } from '@/components/dsa/InfoTile';
import { SectionHeading } from '@/components/dsa/SectionHeading';
import { ListSkeleton, ErrorState, EmptyState } from '@/components/dsa/StateViews';
import { useDsaTopics } from '@/hooks/api';
import { colors } from '@/theme/tokens';
import type { DsaTopic } from '@/types/models';

/* ================================================================== */
/* Topic filter (segmented control)                                    */
/* ================================================================== */

type TopicFilter = 'all' | 'active' | 'mastered';

const TOPIC_FILTERS: SegmentedOption<TopicFilter>[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Mastered', value: 'mastered' },
];

const MASTERED_THRESHOLD = 80;

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

  const { data, isLoading, isError, error, refetch, isRefetching } = useDsaTopics();
  const [filter, setFilter] = useState<TopicFilter>('all');

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
    <View style={{ flex: 1, backgroundColor: colors.white }}>
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
            tintColor={colors.graphite}
          />
        }
      >
        {/* ---------- Brand watermark ---------- */}
        <GrayMark size={22} style={{ marginBottom: 10 }} />

        {/* ---------- Header ---------- */}
        <View style={{ marginBottom: 16 }}>
          <AppText
            variant="caption"
            weight="medium"
            color={colors.graphite}
            style={{ textTransform: 'uppercase', letterSpacing: 1.4 }}
          >
            Practice
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

        {/* ---------- Summary stats (data washes) ---------- */}
        {topics.length > 0 ? (
          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            className="flex-row"
            style={{ gap: 10, marginBottom: 20 }}
          >
            <InfoTile
              icon="check-circle"
              value={`${summary.totalSolved}`}
              label="Solved"
              surface="cool"
              style={{ flex: 1 }}
            />
            <InfoTile
              icon="trending-up"
              value={`${summary.pct}%`}
              label="Overall"
              valueColor={colors.rust}
              surface="warm"
              style={{ flex: 1 }}
            />
            <InfoTile
              icon="crown"
              value={`${summary.mastered}`}
              label="Mastered"
              style={{ flex: 1 }}
            />
          </MotiView>
        ) : null}

        {/* ---------- Topics ---------- */}
        <SectionHeading
          icon="layers"
          title="All topics"
          trailing={
            topics.length > 0 ? (
              <AppText variant="caption" color={colors.graphite}>
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
          <EmptyState
            icon="layers"
            title="No topics yet"
            body="Topics you track will show up here, with progress and mastery for each."
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
            <Icon name="info" size={13} color="dove" />
            <AppText variant="caption" color={colors.graphite}>
              Tap a topic to see its problems and notes
            </AppText>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
