import React, { useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { Tag } from '@/components/ui/Tag';
import { Icon, type IconName } from '@/components/ui/Icon';
import { SoftIconButton } from '@/components/ui/SoftIconButton';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { ScreenHeader } from '@/components/dsa/ScreenHeader';
import { SectionHeading } from '@/components/dsa/SectionHeading';
import { ProgressBar } from '@/components/dsa/ProgressBar';
import { InfoTile } from '@/components/dsa/InfoTile';
import { ProblemRow } from '@/components/dsa/ProblemRow';
import {
  ACCENT_HEX,
  CONFIDENCE_LABEL,
  CONFIDENCE_TONE,
  DIFFICULTY_ICON,
  DIFFICULTY_LABEL,
  DIFFICULTY_TONE,
  formatMinutes,
  formatShortDate,
  masteryMeta,
} from '@/components/dsa/dsaMeta';
import { GroupIllustration53Svg } from '@/constants/brandAssets';
import { colors } from '@/theme/tokens';
import { mockProblems, mockRevisions, mockTopics } from '@/data/mock';
import type { Problem, ProblemStatus, Revision } from '@/types/models';

/* ================================================================== */
/* Static curated resources (icon-name labels, no remote URLs)         */
/* ================================================================== */

const RESOURCES: { label: string; meta: string; icon: IconName }[] = [
  { label: 'Pattern cheat-sheet', meta: 'Core templates · PDF', icon: 'file-text' },
  { label: 'Video walkthrough', meta: 'Concept + 3 examples · 28 min', icon: 'play' },
  { label: 'Curated problem set', meta: 'Hand-picked practice order', icon: 'clipboard' },
];

function ResourceRow({ label, meta, icon }: { label: string; meta: string; icon: IconName }) {
  return (
    <View className="flex-row items-center" style={{ gap: 12, paddingVertical: 12 }}>
      <Neumorph variant="inset" radius={14} intensity="sm">
        <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={19} color="carbon" strokeWidth={2.2} />
        </View>
      </Neumorph>
      <View style={{ flex: 1 }}>
        <AppText variant="body" weight="semibold">
          {label}
        </AppText>
        <AppText variant="caption" color={colors.textSubtle} style={{ fontSize: 12, marginTop: 1 }}>
          {meta}
        </AppText>
      </View>
      <Tag label="Open" tone="neutral" size="sm" />
    </View>
  );
}

/* ================================================================== */
/* Revision-history row                                                */
/* ================================================================== */

function RevisionHistoryRow({ rev, isLast }: { rev: Revision; isLast: boolean }) {
  return (
    <View
      className="flex-row items-center"
      style={{
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.hairline,
      }}
    >
      <View style={{ flex: 1 }}>
        <AppText variant="body" weight="semibold" numberOfLines={1}>
          {rev.problemTitle}
        </AppText>
        <View className="flex-row items-center" style={{ gap: 5, marginTop: 3 }}>
          <Icon name="repeat" size={12} color="textSubtle" />
          <AppText variant="caption" color={colors.textSubtle} style={{ fontSize: 12 }}>
            Reviewed {formatShortDate(rev.lastReviewedAt)} · {rev.reviewCount}x · every {rev.intervalDays}d
          </AppText>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Tag label={CONFIDENCE_LABEL[rev.confidence]} tone={CONFIDENCE_TONE[rev.confidence]} size="sm" />
        {rev.dueToday ? (
          <View className="flex-row items-center" style={{ gap: 4 }}>
            <Icon name="alert" size={12} color="annotation" />
            <AppText variant="caption" weight="bold" color={colors.annotation} style={{ fontSize: 11 }}>
              Due today
            </AppText>
          </View>
        ) : (
          <AppText variant="caption" color={colors.textSubtle} style={{ fontSize: 11 }}>
            Next {formatShortDate(rev.dueDate)}
          </AppText>
        )}
      </View>
    </View>
  );
}

/* ================================================================== */
/* Problem filter (segmented control — replaces any radio group)       */
/* ================================================================== */

type ProblemFilter = 'all' | 'open' | 'solved';

const PROBLEM_FILTERS: SegmentedOption<ProblemFilter>[] = [
  { label: 'All', value: 'all', icon: 'list' },
  { label: 'Open', value: 'open', icon: 'circle' },
  { label: 'Solved', value: 'solved', icon: 'check-circle' },
];

const DONE_STATUSES: ProblemStatus[] = ['SOLVED', 'MASTERED'];

/* ================================================================== */
/* Screen                                                              */
/* ================================================================== */

export default function TopicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topic = useMemo(() => mockTopics.find((t) => t.id === id), [id]);

  const problems = useMemo<Problem[]>(
    () => mockProblems.filter((p) => p.topicId === id),
    [id],
  );

  const revisions = useMemo<Revision[]>(() => {
    if (!topic) return [];
    return mockRevisions.filter((r) => r.topicTitle === topic.title);
  }, [topic]);

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

  /* ---- Not-found fallback ---- */
  if (!topic) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20 }}>
          <ScreenHeader eyebrow="Topic" title="Not found" />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
          <GroupIllustration53Svg width={140} height={112} />
          <AppText variant="subheading" weight="bold" display style={{ textAlign: 'center' }}>
            This topic doesn't exist
          </AppText>
        </View>
      </View>
    );
  }

  const masteryScore = topic.mastery ?? topic.progress;
  const mastery = masteryMeta(masteryScore);
  const barColor = topic.progress >= 60 ? colors.success : colors.highlighter;
  const estimatedSpent = Math.round((topic.estimatedMinutes * topic.progress) / 100);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 48,
        }}
      >
        {/* ---------- Header ---------- */}
        <ScreenHeader
          eyebrow="Topic"
          title={topic.title}
          trailing={
            <SoftIconButton
              size={46}
              active={bookmarked}
              onPress={() => setBookmarked((b) => !b)}
              accessibilityLabel="Bookmark topic"
            >
              <Icon
                name="bookmark"
                size={20}
                color={bookmarked ? 'carbon' : 'textMuted'}
                fill={bookmarked ? colors.highlighter : 'none'}
              />
            </SoftIconButton>
          }
          style={{ marginBottom: 22 }}
        />

        {/* ---------- Hero ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 360 }}
        >
          <SoftCard radius={36} intensity="lg" padding={22} style={{ marginBottom: 24 }}>
            <View className="flex-row items-center" style={{ gap: 14 }}>
              <Neumorph variant="inset" radius={22} intensity="sm">
                <View style={{ width: 60, height: 60, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={topic.emoji} size={30} color="carbon" strokeWidth={2.2} />
                </View>
              </Neumorph>
              <View style={{ flex: 1, gap: 8 }}>
                <View className="flex-row items-center flex-wrap" style={{ gap: 8 }}>
                  <Tag
                    label={DIFFICULTY_LABEL[topic.difficulty]}
                    tone={DIFFICULTY_TONE[topic.difficulty]}
                    size="sm"
                    icon={<Icon name={DIFFICULTY_ICON[topic.difficulty]} size={12} color={colors.carbon} />}
                  />
                  <Tag
                    label={mastery.label}
                    tone={mastery.tone}
                    size="sm"
                    icon={<Icon name={mastery.icon} size={12} color={mastery.color} />}
                  />
                </View>
                <AppText variant="body" color={colors.textMuted}>
                  {topic.description}
                </AppText>
              </View>
            </View>

            {/* Progress */}
            <View style={{ marginTop: 20, gap: 8 }}>
              <ProgressBar progress={topic.progress} color={barColor} height={12} />
              <View className="flex-row items-center justify-between">
                <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 12.5 }}>
                  {topic.solvedProblems} of {topic.totalProblems} solved
                </AppText>
                <AppText variant="caption" weight="bold" color={colors.carbon} style={{ fontSize: 13 }}>
                  {topic.progress}% complete
                </AppText>
              </View>
            </View>

            {/* Tag chips */}
            <View className="flex-row flex-wrap" style={{ gap: 8, marginTop: 16 }}>
              {topic.tags.map((t) => (
                <Tag key={t} label={t} tone="neutral" size="sm" />
              ))}
            </View>
          </SoftCard>
        </MotiView>

        {/* ---------- Stat grid: study time + mastery ---------- */}
        <View className="flex-row" style={{ gap: 12, marginBottom: 28 }}>
          <InfoTile
            icon="timer"
            iconColor="signal"
            value={formatMinutes(estimatedSpent)}
            label="Time spent"
            style={{ flex: 1 }}
          />
          <InfoTile
            icon="target"
            iconColor="peach"
            value={formatMinutes(topic.estimatedMinutes)}
            label="Est. total"
            style={{ flex: 1 }}
          />
          <InfoTile
            icon={mastery.icon}
            iconColor={mastery.color}
            value={`${masteryScore}%`}
            label="Mastery"
            valueColor={mastery.color}
            style={{ flex: 1 }}
          />
        </View>

        {/* ---------- Resources ---------- */}
        <SectionHeading icon="book-open" title="Resources" />
        <SoftCard radius={28} padding={16} style={{ marginBottom: 28 }}>
          {RESOURCES.map((r, i) => (
            <View key={r.label}>
              <ResourceRow {...r} />
              {i < RESOURCES.length - 1 ? (
                <View style={{ height: 1, backgroundColor: colors.hairline }} />
              ) : null}
            </View>
          ))}
        </SoftCard>

        {/* ---------- Notes ---------- */}
        <SectionHeading
          icon="notebook-pen"
          title="Notes"
          trailing={
            <SoftIconButton size={40} accessibilityLabel="Add a note" onPress={() => {}}>
              <Icon name="plus" size={18} color="carbon" strokeWidth={2.4} />
            </SoftIconButton>
          }
        />
        <SoftCard variant="inset" radius={24} padding={18} style={{ marginBottom: 28 }}>
          <AppText variant="body" color={colors.textMuted} style={{ lineHeight: 23 }}>
            Build the pattern muscle first: identify whether the problem wants a hash map, two
            pointers, or a sliding window before writing any code. For {topic.title.toLowerCase()},
            dry-run on a tiny input and watch the invariant hold at each step.
          </AppText>
        </SoftCard>

        {/* ---------- Problems ---------- */}
        <SectionHeading
          icon="list"
          title="Problems"
          trailing={
            <View className="flex-row items-center" style={{ gap: 5 }}>
              <Icon name="check-circle" size={15} color="success" />
              <AppText variant="caption" weight="bold" color={colors.textMuted} style={{ fontSize: 12.5 }}>
                {doneCount}/{problems.length}
              </AppText>
            </View>
          }
        />

        {problems.length === 0 ? (
          <SoftCard variant="inset" radius={24} padding={20} style={{ marginBottom: 28 }}>
            <AppText variant="body" color={colors.textMuted} style={{ textAlign: 'center' }}>
              No problems tracked for this topic yet.
            </AppText>
          </SoftCard>
        ) : (
          <>
            <SegmentedTabs
              options={PROBLEM_FILTERS}
              value={filter}
              onChange={setFilter}
              style={{ marginBottom: 16 }}
            />
            {filteredProblems.length === 0 ? (
              <SoftCard variant="inset" radius={24} padding={20} style={{ marginBottom: 28 }}>
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <Icon name="check-circle-filled" size={26} color="success" />
                  <AppText variant="body" color={colors.textMuted} style={{ textAlign: 'center' }}>
                    {filter === 'solved'
                      ? 'No solved problems here yet — keep grinding.'
                      : 'Everything in this view is done. Nice work.'}
                  </AppText>
                </View>
              </SoftCard>
            ) : (
              <View style={{ gap: 12, marginBottom: 28 }}>
                {filteredProblems.map((p, i) => (
                  <MotiView
                    key={p.id}
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 320, delay: 40 + i * 50 }}
                  >
                    <ProblemRow problem={p} onPress={() => router.push(`/problem/${p.id}`)} />
                  </MotiView>
                ))}
              </View>
            )}
          </>
        )}

        {/* ---------- Revision history ---------- */}
        <SectionHeading icon="repeat" title="Revision history" />
        {revisions.length === 0 ? (
          <SoftCard variant="inset" radius={24} padding={20}>
            <AppText variant="body" color={colors.textMuted} style={{ textAlign: 'center' }}>
              No spaced revisions logged yet — solve a few problems to start the review cycle.
            </AppText>
          </SoftCard>
        ) : (
          <SoftCard radius={28} padding={16}>
            {revisions.map((rev, i) => (
              <RevisionHistoryRow key={rev.id} rev={rev} isLast={i === revisions.length - 1} />
            ))}
          </SoftCard>
        )}
      </ScrollView>
    </View>
  );
}
