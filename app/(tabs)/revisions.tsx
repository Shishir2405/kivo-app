import React, { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard, WarmCard, CoolCard } from '@/components/ui/SoftCard';
import { Tag } from '@/components/ui/Tag';
import { TextLink } from '@/components/ui/PillButton';
import {
  Icon,
  GrayMark,
  SegmentedTabs,
  type IconName,
  type SegmentedOption,
} from '@/components/ui';
import { RevisionCard } from '@/components/revisions/RevisionCard';
import { RevisionHeatmap } from '@/components/revisions/RevisionHeatmap';
import { StreakChip } from '@/components/revisions/StreakChip';
import {
  partitionRevisions,
  buildActivity,
  calendarChip,
  DIFFICULTY_TONE,
  DIFFICULTY_LABEL,
  type RecallGrade,
  type UpcomingGroup,
} from '@/components/revisions/revisionUtils';
import { useRevisions, useReviewRevision, useProfile } from '@/hooks/api';
import { colors, fonts } from '@/theme/tokens';
import type { Revision } from '@/types/models';

/* ================================================================== */
/* View filter                                                         */
/* ================================================================== */

type QueueView = 'due' | 'upcoming' | 'activity';

const VIEW_SEGMENTS: SegmentedOption<QueueView>[] = [
  { label: 'Due', value: 'due', icon: 'target' },
  { label: 'Upcoming', value: 'upcoming', icon: 'calendar' },
  { label: 'Activity', value: 'activity', icon: 'activity' },
];

/* ================================================================== */
/* Section heading — serif title + optional trailing slot              */
/* ================================================================== */

function SectionHeading({
  title,
  trailing,
}: {
  title: string;
  trailing?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between" style={{ marginBottom: 12 }}>
      <AppText variant="heading" display weight="medium" color={colors.ink}>
        {title}
      </AppText>
      {trailing}
    </View>
  );
}

/* ================================================================== */
/* Wash data figure (apricot / sky) — color as punctuation             */
/* ================================================================== */

function StatFigure({ value, label }: { value: number; label: string }) {
  return (
    <>
      <AppText variant="display" display weight="semibold" color={colors.ink}>
        {value}
      </AppText>
      <AppText variant="caption" color={colors.ash} style={{ marginTop: 2 }}>
        {label}
      </AppText>
    </>
  );
}

/* ================================================================== */
/* Upcoming group — small date chip + the day's revisions              */
/* ================================================================== */

function UpcomingDay({ group, index }: { group: UpcomingGroup; index: number }) {
  const chip = calendarChip(group.dueDate);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 280, delay: Math.min(index, 6) * 60 }}
      style={{ marginBottom: 16 }}
    >
      <View className="flex-row items-center" style={{ gap: 8, marginBottom: 8 }}>
        <View className="flex-row items-baseline" style={{ gap: 4 }}>
          <AppText
            variant="caption"
            weight="medium"
            color={colors.graphite}
            style={{ fontFamily: fonts.sansMedium }}
          >
            {chip.month}
          </AppText>
          <AppText variant="subheading" weight="medium" color={colors.ink}>
            {chip.dayNum}
          </AppText>
        </View>
        <AppText variant="caption" color={colors.graphite}>
          {group.label}
        </AppText>
        <View style={{ flex: 1 }} />
        <Tag label={`${group.items.length}`} tone="neutral" size="sm" />
      </View>

      <SoftCard radius={18} padding={4} flat>
        {group.items.map((rev, i) => (
          <View
            key={rev.id}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 10,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: colors.fog,
            }}
            className="flex-row items-center justify-between"
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <AppText variant="body" weight="medium" color={colors.ink} numberOfLines={1}>
                {rev.problemTitle ?? 'Untitled problem'}
              </AppText>
              <View className="flex-row items-center" style={{ gap: 8, marginTop: 4 }}>
                <Tag
                  label={DIFFICULTY_LABEL[rev.difficulty ?? 'MEDIUM']}
                  tone={DIFFICULTY_TONE[rev.difficulty ?? 'MEDIUM']}
                  size="sm"
                />
                {rev.topicTitle ? (
                  <AppText variant="caption" color={colors.graphite} numberOfLines={1}>
                    {rev.topicTitle}
                  </AppText>
                ) : null}
              </View>
            </View>
            <Icon name="chevron-right" size={16} color="dove" />
          </View>
        ))}
      </SoftCard>
    </MotiView>
  );
}

/* ================================================================== */
/* State blocks — loading / error / empty                              */
/* ================================================================== */

function CenterNote({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <SoftCard variant="inset" radius={20} padding={24}>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Icon name={icon} size={22} color="graphite" />
        <AppText variant="subheading" weight="medium" color={colors.ink} style={{ textAlign: 'center' }}>
          {title}
        </AppText>
        <AppText variant="body" color={colors.ash} style={{ textAlign: 'center', maxWidth: 280 }}>
          {body}
        </AppText>
        {action ? <View style={{ marginTop: 4 }}>{action}</View> : null}
      </View>
    </SoftCard>
  );
}

function LoadingBlock() {
  return (
    <SoftCard variant="inset" radius={20} padding={28}>
      <View style={{ alignItems: 'center', gap: 12 }}>
        <ActivityIndicator color={colors.ink} />
        <AppText variant="caption" color={colors.graphite}>
          Loading your revisions…
        </AppText>
      </View>
    </SoftCard>
  );
}

/* ================================================================== */
/* Screen                                                              */
/* ================================================================== */

export default function RevisionsScreen() {
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError, error, refetch, isFetching } = useRevisions();
  const profile = useProfile();
  const reviewMutation = useReviewRevision();

  const [view, setView] = useState<QueueView>('due');
  // Revisions cleared locally (reviewed / snoozed / skipped) drop out at once.
  const [cleared, setCleared] = useState<Record<string, true>>({});
  // The id currently being reviewed against the backend (for a pending label).
  const [pendingId, setPendingId] = useState<string | null>(null);

  const revisions = useMemo<Revision[]>(
    () => (Array.isArray(data) ? data.filter((r) => r && !cleared[r.id]) : []),
    [data, cleared],
  );

  const { due, upcoming, totalReviews, masteredCount } = useMemo(
    () => partitionRevisions(revisions),
    [revisions],
  );

  const activity = useMemo(() => buildActivity(revisions), [revisions]);
  const streak = profile.data?.streak ?? 0;

  /* ----- Actions ----- */

  const handleReview = useCallback(
    (id: string, _grade: RecallGrade) => {
      setPendingId(id);
      reviewMutation.mutate(id, {
        onSettled: () => {
          setPendingId((curr) => (curr === id ? null : curr));
          // Drop it from the visible queue regardless — a failed call still
          // hides the card locally; the next refetch reconciles real state.
          setCleared((prev) => ({ ...prev, [id]: true }));
        },
      });
    },
    [reviewMutation],
  );

  const handleSnooze = useCallback((id: string) => {
    setCleared((prev) => ({ ...prev, [id]: true }));
  }, []);

  const handleSkip = useCallback((id: string) => {
    setCleared((prev) => ({ ...prev, [id]: true }));
  }, []);

  const onRefresh = useCallback(() => {
    setCleared({});
    void refetch();
  }, [refetch]);

  /* ----- Render ----- */

  const subtitle = isError
    ? 'Couldn’t load your queue'
    : due.length > 0
      ? `${due.length} due · keep your recall sharp`
      : 'Spaced repetition';

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 130,
        }}
        refreshControl={
          <RefreshControl refreshing={isFetching && !isLoading} onRefresh={onRefresh} tintColor={colors.graphite} />
        }
      >
        {/* ---------- Brand mark ---------- */}
        <View style={{ marginBottom: 10 }}>
          <GrayMark size={22} />
        </View>

        {/* ---------- Header ---------- */}
        <View className="flex-row items-start justify-between" style={{ marginBottom: 18 }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <AppText variant="display" display weight="semibold" color={colors.ink}>
              Revisions
            </AppText>
            <AppText variant="body" color={colors.ash} style={{ marginTop: 4 }}>
              {subtitle}
            </AppText>
          </View>
          {streak > 0 ? <StreakChip count={streak} /> : null}
        </View>

        {/* ---------- Wash stat pair (color as punctuation) ---------- */}
        <View className="flex-row" style={{ gap: 12, marginBottom: 20 }}>
          <WarmCard style={{ flex: 1 }} padding={14}>
            <StatFigure value={due.length} label="Due now" />
          </WarmCard>
          <CoolCard style={{ flex: 1 }} padding={14}>
            <StatFigure value={masteredCount} label="Mastered" />
          </CoolCard>
        </View>

        {/* ---------- View switcher ---------- */}
        <SegmentedTabs
          options={VIEW_SEGMENTS}
          value={view}
          onChange={setView}
          style={{ marginBottom: 22 }}
        />

        {/* ================= STATES ================= */}
        {isError ? (
          <CenterNote
            icon="alert"
            title="Something went wrong"
            body={error?.message ?? 'We couldn’t reach the server. Pull to refresh or try again.'}
            action={<TextLink label="Try again" onPress={onRefresh} icon={<Icon name="repeat" size={14} color="ink" />} />}
          />
        ) : isLoading ? (
          <LoadingBlock />
        ) : (
          <>
            {/* ================= DUE ================= */}
            {view === 'due' ? (
              <MotiView
                key="due"
                from={{ opacity: 0, translateY: 6 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 220 }}
              >
                <SectionHeading
                  title="Due today"
                  trailing={due.length > 0 ? <Tag label={`${due.length} left`} tone="ink" size="sm" /> : undefined}
                />
                {due.length > 0 ? (
                  due.map((rev, i) => (
                    <RevisionCard
                      key={rev.id}
                      revision={rev}
                      index={i}
                      pending={pendingId === rev.id}
                      onReview={handleReview}
                      onSnooze={handleSnooze}
                      onSkip={handleSkip}
                    />
                  ))
                ) : (
                  <CenterNote
                    icon="check-circle"
                    title="All caught up"
                    body="No revisions are due. Your recall is locked in — come back tomorrow to keep the streak alive."
                  />
                )}
              </MotiView>
            ) : null}

            {/* ================= UPCOMING ================= */}
            {view === 'upcoming' ? (
              <MotiView
                key="upcoming"
                from={{ opacity: 0, translateY: 6 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 220 }}
              >
                <SectionHeading
                  title="Upcoming"
                  trailing={upcoming.length > 0 ? <Tag label={`${upcoming.length} days`} tone="neutral" size="sm" /> : undefined}
                />
                {upcoming.length > 0 ? (
                  upcoming.map((group, i) => (
                    <UpcomingDay key={group.dueDate} group={group} index={i} />
                  ))
                ) : (
                  <CenterNote
                    icon="calendar"
                    title="Nothing scheduled"
                    body="No upcoming reviews yet. Solve and flag more problems to build your revision queue."
                  />
                )}
              </MotiView>
            ) : null}

            {/* ================= ACTIVITY ================= */}
            {view === 'activity' ? (
              <MotiView
                key="activity"
                from={{ opacity: 0, translateY: 6 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 220 }}
              >
                <SectionHeading title="Review activity" />
                <SoftCard radius={20} padding={16}>
                  <View className="flex-row items-end justify-between" style={{ marginBottom: 16 }}>
                    <View>
                      <View className="flex-row items-baseline" style={{ gap: 6 }}>
                        <AppText variant="headingLg" display weight="semibold" color={colors.ink}>
                          {totalReviews}
                        </AppText>
                        <AppText variant="caption" color={colors.ash}>
                          reviews logged
                        </AppText>
                      </View>
                      {streak > 0 ? (
                        <View className="flex-row items-center" style={{ gap: 5, marginTop: 4 }}>
                          <Icon name="flame" size={13} color="rust" />
                          <AppText variant="caption" color={colors.ash}>
                            {streak}-day streak
                          </AppText>
                        </View>
                      ) : null}
                    </View>
                    <Tag label="Last 17 weeks" tone="neutral" size="sm" />
                  </View>
                  <RevisionHeatmap data={activity} />
                </SoftCard>

                {/* Mastery summary line */}
                <View className="flex-row" style={{ gap: 12, marginTop: 16 }}>
                  <WarmCard style={{ flex: 1 }} padding={14}>
                    <StatFigure value={due.length} label="Still due" />
                  </WarmCard>
                  <CoolCard style={{ flex: 1 }} padding={14}>
                    <StatFigure value={masteredCount} label="Mastered" />
                  </CoolCard>
                </View>
              </MotiView>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
