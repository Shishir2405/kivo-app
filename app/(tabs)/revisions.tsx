import React, { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
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
  Skeleton,
  SkeletonText,
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
import {
  useRevisions,
  useReviewRevision,
  useSnoozeRevision,
  useSkipRevision,
  useProfile,
} from '@/hooks/api';
import { fonts, motion } from '@/theme/tokens';
import { useTheme } from '@/theme';
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

function SectionHeading({ title, trailing }: { title: string; trailing?: React.ReactNode }) {
  const { colors } = useTheme();
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
/* Wash data figure — the key stat takes the card's tonal accent       */
/* ================================================================== */

function StatFigure({
  value,
  label,
  icon,
  accent,
}: {
  value: number;
  label: string;
  icon?: IconName;
  accent: string;
}) {
  const { colors } = useTheme();
  return (
    <>
      <View className="flex-row items-center" style={{ gap: 6, marginBottom: 2 }}>
        {icon ? <Icon name={icon} size={15} color={accent} /> : null}
        <AppText variant="caption" color={colors.muted}>
          {label}
        </AppText>
      </View>
      <AppText variant="display" display weight="semibold" color={accent}>
        {value}
      </AppText>
    </>
  );
}

/* ================================================================== */
/* Upcoming group — small date chip + the day's revisions              */
/* ================================================================== */

function UpcomingDay({ group, index }: { group: UpcomingGroup; index: number }) {
  const { colors } = useTheme();
  const chip = calendarChip(group.dueDate);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: motion.duration.transition,
        delay: Math.min(index, 6) * 60,
      }}
      style={{ marginBottom: 16 }}
    >
      <View className="flex-row items-center" style={{ gap: 8, marginBottom: 8 }}>
        <View className="flex-row items-baseline" style={{ gap: 4 }}>
          <AppText
            variant="caption"
            weight="medium"
            color={colors.muted}
            style={{ fontFamily: fonts.sansMedium }}
          >
            {chip.month}
          </AppText>
          <AppText variant="subheading" weight="medium" color={colors.ink}>
            {chip.dayNum}
          </AppText>
        </View>
        <AppText variant="caption" color={colors.muted}>
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
              borderTopColor: colors.hairline,
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
                  <AppText variant="caption" color={colors.muted} numberOfLines={1}>
                    {rev.topicTitle}
                  </AppText>
                ) : null}
              </View>
            </View>
            <Icon name="chevron-right" size={16} color={colors.muted} />
          </View>
        ))}
      </SoftCard>
    </MotiView>
  );
}

/* ================================================================== */
/* State blocks — error / empty / loading                              */
/* ================================================================== */

function CenterNote({
  icon,
  title,
  body,
  tone = 'mint',
  action,
}: {
  icon: IconName;
  title: string;
  body: string;
  tone?: 'mint' | 'sky' | 'peach' | 'default';
  action?: React.ReactNode;
}) {
  const { colors, toneStyle } = useTheme();
  const t = toneStyle(tone);
  return (
    <SoftCard variant="inset" radius={20} padding={28}>
      <View style={{ alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: t.bg,
            borderWidth: 1,
            borderColor: t.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={28} color={t.accent} />
        </View>
        <AppText
          variant="heading"
          display
          weight="medium"
          color={colors.ink}
          style={{ textAlign: 'center' }}
        >
          {title}
        </AppText>
        <AppText variant="body" color={colors.muted} style={{ textAlign: 'center', maxWidth: 280 }}>
          {body}
        </AppText>
        {action ? <View style={{ marginTop: 4 }}>{action}</View> : null}
      </View>
    </SoftCard>
  );
}

function CaughtUp({ streak }: { streak: number }) {
  const { colors, toneStyle } = useTheme();
  const mint = toneStyle('mint');
  return (
    <SoftCard variant="inset" radius={20} padding={28}>
      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: mint.bg,
            borderWidth: 1,
            borderColor: mint.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 22,
          }}
        >
          <Icon name="check" size={44} color={colors.success} />
        </View>
        <View className="flex-row items-baseline" style={{ gap: 6, marginBottom: 8 }}>
          <AppText variant="heading" display weight="medium" color={colors.ink} style={{ textAlign: 'center' }}>
            You’re all caught up
          </AppText>
          <Icon name="sparkles" size={16} color={colors.primary} />
        </View>
        <AppText
          variant="body"
          color={colors.muted}
          style={{ textAlign: 'center', maxWidth: 280, marginBottom: streak > 0 ? 22 : 0 }}
        >
          All revisions done. The next batch arrives soon — go enjoy your win.
        </AppText>
        {streak > 0 ? (
          <View
            className="flex-row items-center"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.hairline,
              borderRadius: 14,
              paddingVertical: 12,
              paddingHorizontal: 18,
              gap: 10,
            }}
          >
            <Icon name="flame" size={20} color={colors.primary} />
            <View>
              <AppText variant="subheading" display weight="semibold" color={colors.ink}>
                {streak} days
              </AppText>
              <AppText variant="caption" color={colors.muted}>
                streak extended
              </AppText>
            </View>
          </View>
        ) : null}
      </View>
    </SoftCard>
  );
}

function LoadingBlock() {
  return (
    <View>
      {/* Section heading skeleton */}
      <View className="flex-row items-center justify-between" style={{ marginBottom: 14 }}>
        <Skeleton width={140} height={24} radius={8} />
        <Skeleton width={56} height={22} radius={11} />
      </View>
      {[0, 1, 2].map((i) => (
        <MotiView
          key={i}
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: motion.duration.transition, delay: i * 70 }}
          style={{ marginBottom: 12 }}
        >
          <SoftCard radius={20} padding={16}>
            <View className="flex-row items-center justify-between" style={{ marginBottom: 12 }}>
              <Skeleton width={64} height={20} radius={10} />
              <Skeleton width={90} height={14} radius={7} />
            </View>
            <SkeletonText lines={2} />
            <View style={{ height: 14 }} />
            <View className="flex-row items-center justify-between">
              <Skeleton width={120} height={16} radius={8} />
              <Skeleton width={70} height={28} radius={14} />
            </View>
          </SoftCard>
        </MotiView>
      ))}
    </View>
  );
}

/* ================================================================== */
/* Screen                                                              */
/* ================================================================== */

export default function RevisionsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const { data, isLoading, isError, error, refetch, isFetching } = useRevisions();
  const profile = useProfile();
  const reviewMutation = useReviewRevision();
  const snoozeMutation = useSnoozeRevision();
  const skipMutation = useSkipRevision();

  const [view, setView] = useState<QueueView>('due');
  // Revisions cleared locally (reviewed / snoozed / skipped) drop out at once.
  const [cleared, setCleared] = useState<Record<string, true>>({});
  // The id currently being reviewed against the backend (for a pending label).
  const [pendingId, setPendingId] = useState<string | null>(null);
  // A transient banner if a snooze / skip request fails (the card stays cleared
  // optimistically; on failure we restore it and surface the reason).
  const [actionError, setActionError] = useState<string | null>(null);

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
          setCleared((prev) => ({ ...prev, [id]: true }));
        },
      });
    },
    [reviewMutation],
  );

  // Optimistically clear the card, then fire the mutation. On failure restore it
  // and surface the reason; the action never crashes the queue.
  const clearWithMutation = useCallback(
    (
      id: string,
      mutate: (
        id: string,
        opts: { onError: (e: { message: string }) => void },
      ) => void,
      failMsg: string,
    ) => {
      setActionError(null);
      setCleared((prev) => ({ ...prev, [id]: true }));
      mutate(id, {
        onError: (e) => {
          setCleared((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
          setActionError(e.message || failMsg);
        },
      });
    },
    [],
  );

  const handleSnooze = useCallback(
    (id: string) => clearWithMutation(id, snoozeMutation.mutate, 'Couldn’t snooze this revision'),
    [clearWithMutation, snoozeMutation.mutate],
  );

  const handleSkip = useCallback(
    (id: string) => clearWithMutation(id, skipMutation.mutate, 'Couldn’t skip this revision'),
    [clearWithMutation, skipMutation.mutate],
  );

  const onRefresh = useCallback(() => {
    setCleared({});
    setActionError(null);
    void refetch();
  }, [refetch]);

  /* ----- Render ----- */

  const subtitle = isError
    ? 'Couldn’t load your queue'
    : due.length > 0
      ? `${due.length} due · keep your recall sharp`
      : 'Review, rate recall, and watch the next interval adapt';

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 130,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={onRefresh}
            tintColor={colors.muted}
          />
        }
      >
        {/* ---------- Brand mark ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: motion.duration.transition }}
        >
          <View style={{ marginBottom: 10 }}>
            <GrayMark size={22} />
          </View>

          {/* ---------- Header ---------- */}
          <View className="flex-row items-start justify-between" style={{ marginBottom: 18 }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <AppText variant="display" display weight="semibold" color={colors.ink}>
                Revisions
              </AppText>
              <AppText variant="body" color={colors.muted} style={{ marginTop: 4 }}>
                {subtitle}
              </AppText>
            </View>
            {streak > 0 ? <StreakChip count={streak} /> : null}
          </View>

          {/* ---------- Wash stat pair (color as punctuation) ---------- */}
          <View className="flex-row" style={{ gap: 12, marginBottom: 20 }}>
            <WarmCard style={{ flex: 1 }} padding={14}>
              {({ accent }) => <StatFigure value={due.length} label="Due now" accent={accent} />}
            </WarmCard>
            <CoolCard style={{ flex: 1 }} padding={14}>
              {({ accent }) => <StatFigure value={masteredCount} label="Mastered" accent={accent} />}
            </CoolCard>
          </View>

          {/* ---------- View switcher ---------- */}
          <SegmentedTabs
            options={VIEW_SEGMENTS}
            value={view}
            onChange={setView}
            style={{ marginBottom: 22 }}
          />
        </MotiView>

        {/* ----- Transient snooze / skip error ----- */}
        {actionError ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 14,
              backgroundColor: colors.dangerWash,
              borderWidth: 1,
              borderColor: colors.danger,
              marginBottom: 16,
            }}
          >
            <Icon name="alert" size={15} color="danger" />
            <AppText variant="caption" color={colors.danger} style={{ flex: 1 }}>
              {actionError}
            </AppText>
            <TextLink label="Dismiss" muted size="sm" onPress={() => setActionError(null)} />
          </View>
        ) : null}

        {/* ================= STATES ================= */}
        {isError ? (
          <CenterNote
            icon="alert"
            title="Something went wrong"
            tone="peach"
            body={error?.message ?? 'We couldn’t reach the server. Pull to refresh or try again.'}
            action={
              <TextLink
                label="Try again"
                onPress={onRefresh}
                icon={<Icon name="refresh" size={14} color={colors.ink} />}
              />
            }
          />
        ) : isLoading ? (
          <LoadingBlock />
        ) : (
          <>
            {/* ================= DUE ================= */}
            {view === 'due' ? (
              <MotiView
                key="due"
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: motion.duration.transition }}
              >
                <SectionHeading
                  title="Due today"
                  trailing={
                    due.length > 0 ? <Tag label={`${due.length} left`} tone="ink" size="sm" /> : undefined
                  }
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
                  <CaughtUp streak={streak} />
                )}
              </MotiView>
            ) : null}

            {/* ================= UPCOMING ================= */}
            {view === 'upcoming' ? (
              <MotiView
                key="upcoming"
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: motion.duration.transition }}
              >
                <SectionHeading
                  title="Upcoming"
                  trailing={
                    upcoming.length > 0 ? (
                      <Tag label={`${upcoming.length} days`} tone="neutral" size="sm" />
                    ) : undefined
                  }
                />
                {upcoming.length > 0 ? (
                  upcoming.map((group, i) => <UpcomingDay key={group.dueDate} group={group} index={i} />)
                ) : (
                  <CenterNote
                    icon="calendar"
                    tone="sky"
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
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: motion.duration.transition }}
              >
                <SectionHeading title="Review activity" />
                <SoftCard radius={20} padding={16}>
                  <View className="flex-row items-end justify-between" style={{ marginBottom: 16 }}>
                    <View>
                      <View className="flex-row items-baseline" style={{ gap: 6 }}>
                        <AppText variant="headingLg" display weight="semibold" color={colors.ink}>
                          {totalReviews}
                        </AppText>
                        <AppText variant="caption" color={colors.muted}>
                          reviews logged
                        </AppText>
                      </View>
                      {streak > 0 ? (
                        <View className="flex-row items-center" style={{ gap: 5, marginTop: 4 }}>
                          <Icon name="flame" size={13} color={colors.primary} />
                          <AppText variant="caption" color={colors.muted}>
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
                    {({ accent }) => <StatFigure value={due.length} label="Still due" accent={accent} />}
                  </WarmCard>
                  <CoolCard style={{ flex: 1 }} padding={14}>
                    {({ accent }) => (
                      <StatFigure value={masteredCount} label="Mastered" accent={accent} />
                    )}
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
