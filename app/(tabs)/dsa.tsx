import React, { useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { Icon } from '@/components/ui/Icon';
import { GrayMark } from '@/components/ui/AppHeader';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { StreakBadge } from '@/components/StreakBadge';
import { RoadmapChip } from '@/components/dsa/RoadmapChip';
import { TopicCard } from '@/components/dsa/TopicCard';
import { SectionHeading } from '@/components/dsa/SectionHeading';
import { ProgressBar } from '@/components/dsa/ProgressBar';
import { ACCENT_HEX } from '@/components/dsa/dsaMeta';
import { GroupIllustration53Svg } from '@/constants/brandAssets';
import { colors } from '@/theme/tokens';
import { mockRoadmaps, mockTopics, mockProfile } from '@/data/mock';
import type { Roadmap, DsaTopic } from '@/types/models';

/* ================================================================== */
/* Topic filter (segmented control — replaces any radio group)         */
/* ================================================================== */

type TopicFilter = 'all' | 'active' | 'mastered';

const TOPIC_FILTERS: SegmentedOption<TopicFilter>[] = [
  { label: 'All', value: 'all', icon: 'layers' },
  { label: 'Active', value: 'active', icon: 'activity' },
  { label: 'Mastered', value: 'mastered', icon: 'crown' },
];

/* ================================================================== */
/* Hero — the selected roadmap's summary                               */
/* ================================================================== */

function RoadmapHero({ roadmap, topics }: { roadmap: Roadmap; topics: DsaTopic[] }) {
  const accentHex = ACCENT_HEX[roadmap.accent];

  return (
    <SoftCard radius={36} intensity="lg" padding={22}>
      <View className="flex-row items-start" style={{ gap: 14 }}>
        {/* Glyph medallion */}
        <Neumorph variant="inset" radius={20} intensity="sm">
          <View style={{ width: 58, height: 58, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={roadmap.emoji} size={28} color={accentHex} strokeWidth={2.2} />
          </View>
        </Neumorph>

        <View style={{ flex: 1 }}>
          <AppText
            variant="caption"
            weight="semibold"
            color={colors.textSubtle}
            style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' }}
          >
            Active sheet
          </AppText>
          <AppText variant="subheading" display weight="bold" style={{ marginTop: 2, fontSize: 22 }}>
            {roadmap.title}
          </AppText>
          {roadmap.curator ? (
            <View className="flex-row items-center" style={{ gap: 5, marginTop: 4 }}>
              <Icon name="user" size={13} color="textSubtle" />
              <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 12.5 }}>
                {roadmap.curator}
              </AppText>
            </View>
          ) : null}
        </View>

        {/* Completion stat */}
        <Neumorph variant="inset" radius={20} intensity="sm" padding={12}>
          <View style={{ alignItems: 'center', minWidth: 60 }}>
            <AppText variant="heading" display weight="bold" color={accentHex} style={{ fontSize: 28 }}>
              {roadmap.progress}
            </AppText>
            <AppText
              variant="caption"
              weight="semibold"
              color={colors.textSubtle}
              style={{ fontSize: 10, marginTop: -2 }}
            >
              % DONE
            </AppText>
          </View>
        </Neumorph>
      </View>

      <AppText variant="body" color={colors.textMuted} style={{ marginTop: 16, lineHeight: 22 }}>
        {roadmap.description}
      </AppText>

      {/* Progress */}
      <View style={{ marginTop: 18, gap: 8 }}>
        <ProgressBar progress={roadmap.progress} color={accentHex} height={12} />
        <View className="flex-row items-center justify-between">
          <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 12.5 }}>
            {roadmap.solvedProblems} of {roadmap.totalProblems} solved
          </AppText>
          <AppText variant="caption" weight="semibold" color={colors.carbon} style={{ fontSize: 12.5 }}>
            {topics.length} topics
          </AppText>
        </View>
      </View>

      {/* Meta chips */}
      <View className="flex-row" style={{ gap: 10, marginTop: 18 }}>
        <MetaCell icon="calendar" label="Est. time" value={`${roadmap.estimatedWeeks ?? '—'} wks`} />
        <MetaCell icon="trending-up" label="Level" value={roadmap.level ?? '—'} />
      </View>
    </SoftCard>
  );
}

function MetaCell({ icon, label, value }: { icon: 'calendar' | 'trending-up'; label: string; value: string }) {
  return (
    <Neumorph variant="raised" radius={16} intensity="sm" padding={12} style={{ flex: 1 }}>
      <View className="flex-row items-center" style={{ gap: 9 }}>
        <Neumorph variant="inset" radius={10} intensity="sm">
          <View style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size={16} color="carbon" strokeWidth={2.2} />
          </View>
        </Neumorph>
        <View style={{ flex: 1 }}>
          <AppText
            variant="caption"
            weight="medium"
            color={colors.textSubtle}
            style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}
          >
            {label}
          </AppText>
          <AppText variant="body" weight="bold" numberOfLines={1} style={{ fontSize: 13.5 }}>
            {value}
          </AppText>
        </View>
      </View>
    </Neumorph>
  );
}

/* ================================================================== */
/* Empty state                                                         */
/* ================================================================== */

function EmptyTopics({ filter }: { filter: TopicFilter }) {
  const copy =
    filter === 'mastered'
      ? 'No mastered topics in this sheet yet. Keep solving — topics cross 80% mastery and land here.'
      : filter === 'active'
        ? 'Nothing in progress on this sheet right now. Open a topic to start the grind.'
        : 'No topics are tracked on this sheet yet.';

  return (
    <SoftCard variant="inset" radius={28} padding={26}>
      <View style={{ alignItems: 'center', gap: 14 }}>
        <GroupIllustration53Svg width={120} height={96} />
        <AppText variant="subheading" weight="bold" display style={{ textAlign: 'center' }}>
          Nothing here yet
        </AppText>
        <AppText variant="body" color={colors.textMuted} style={{ textAlign: 'center' }}>
          {copy}
        </AppText>
      </View>
    </SoftCard>
  );
}

/* ================================================================== */
/* Screen                                                              */
/* ================================================================== */

export default function DsaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [activeRoadmapId, setActiveRoadmapId] = useState<string>(mockRoadmaps[0].id);
  const [filter, setFilter] = useState<TopicFilter>('all');

  const activeRoadmap = useMemo<Roadmap>(
    () => mockRoadmaps.find((r) => r.id === activeRoadmapId) ?? mockRoadmaps[0],
    [activeRoadmapId],
  );

  // Topics belonging to the active roadmap (indexed by id, order preserved).
  const roadmapTopics = useMemo<DsaTopic[]>(() => {
    return activeRoadmap.topicIds
      .map((tid) => mockTopics.find((t) => t.id === tid))
      .filter((t): t is DsaTopic => Boolean(t));
  }, [activeRoadmap]);

  const filteredTopics = useMemo<DsaTopic[]>(() => {
    if (filter === 'all') return roadmapTopics;
    if (filter === 'mastered') return roadmapTopics.filter((t) => (t.mastery ?? t.progress) >= 80);
    return roadmapTopics.filter((t) => (t.mastery ?? t.progress) < 80);
  }, [roadmapTopics, filter]);

  const totalSolved = useMemo(
    () => mockTopics.reduce((n, t) => n + t.solvedProblems, 0),
    [],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: 130,
        }}
      >
        {/* ---------- Gray brand watermark ---------- */}
        <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
          <GrayMark size={24} />
        </View>

        {/* ---------- Header ---------- */}
        <View
          className="flex-row items-start justify-between"
          style={{ paddingHorizontal: 20, marginBottom: 20 }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <AppText
              variant="caption"
              weight="semibold"
              color={colors.textSubtle}
              style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 11 }}
            >
              Practice
            </AppText>
            <View className="flex-row items-center" style={{ gap: 10, marginTop: 4 }}>
              <Neumorph variant="inset" radius={14} intensity="sm">
                <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="code-xml" size={22} color="carbon" strokeWidth={2.2} />
                </View>
              </Neumorph>
              <AppText variant="heading" display weight="bold" color={colors.carbon}>
                DSA Sheets
              </AppText>
            </View>
            <AppText variant="body" color={colors.textMuted} style={{ marginTop: 8 }}>
              {totalSolved} solved across {mockTopics.length} topics
            </AppText>
          </View>
          <StreakBadge count={mockProfile.streak} size="md" />
        </View>

        {/* ---------- Roadmap selector chips (no radio group) ---------- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            gap: 10,
            paddingBottom: 4,
          }}
          style={{ marginBottom: 22 }}
        >
          {mockRoadmaps.map((rm) => (
            <RoadmapChip
              key={rm.id}
              label={rm.title}
              icon={rm.emoji}
              active={rm.id === activeRoadmapId}
              onPress={() => {
                setActiveRoadmapId(rm.id);
                setFilter('all');
              }}
            />
          ))}
        </ScrollView>

        {/* ---------- Body ---------- */}
        <View style={{ paddingHorizontal: 20 }}>
          <MotiView
            key={activeRoadmapId}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            style={{ marginBottom: 26 }}
          >
            <RoadmapHero roadmap={activeRoadmap} topics={roadmapTopics} />
          </MotiView>

          <SectionHeading icon="layers" eyebrow="Keep climbing" title="Topics" />

          {/* Segmented filter — replaces any radio control */}
          <SegmentedTabs
            options={TOPIC_FILTERS}
            value={filter}
            onChange={setFilter}
            style={{ marginBottom: 18 }}
          />

          {filteredTopics.length === 0 ? (
            <EmptyTopics filter={filter} />
          ) : (
            <View style={{ gap: 14 }}>
              {filteredTopics.map((topic, i) => (
                <TopicCard
                  key={`${activeRoadmapId}-${topic.id}`}
                  topic={topic}
                  index={i}
                  onPress={() => router.push(`/dsa-topic/${topic.id}`)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
