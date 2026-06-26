import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  Image,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { Tag } from '@/components/ui/Tag';
import { Icon, GrayMark, SegmentedTabs, type IconName, type SegmentedOption } from '@/components/ui';
import { Heatmap } from '@/components/Heatmap';
import { RevisionCard } from '@/components/revisions/RevisionCard';
import { StreakChip } from '@/components/revisions/StreakChip';
import {
  groupUpcoming,
  applyGrade,
  snoozeRevision,
  gradeMeta,
  calendarChip,
  buildRevisionHeatmap,
  DIFFICULTY_TONE,
  DIFFICULTY_LABEL,
  type RecallGrade,
  type UpcomingGroup,
} from '@/components/revisions/revisionUtils';
import { illustrationAssets } from '@/constants/brandAssets';
import { colors, fonts, radii } from '@/theme/tokens';
import { mockRevisions, mockProfile } from '@/data/mock';
import { scheduleLocalReminder } from '@/services/notifications';
import type { Revision } from '@/types/models';

/* ================================================================== */
/* Queue view filter                                                   */
/* ================================================================== */

type QueueView = 'today' | 'upcoming' | 'activity';

const VIEW_SEGMENTS: SegmentedOption<QueueView>[] = [
  { label: 'Due', value: 'today', icon: 'target' },
  { label: 'Upcoming', value: 'upcoming', icon: 'calendar' },
  { label: 'Activity', value: 'activity', icon: 'activity' },
];

/* ================================================================== */
/* Section header — icon chip + eyebrow + title (+ trailing slot)      */
/* ================================================================== */

function SectionHeader({
  eyebrow,
  title,
  icon,
  trailing,
  style,
}: {
  eyebrow: string;
  title: string;
  icon: IconName;
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View className="flex-row items-center justify-between" style={[{ marginBottom: 16 }, style]}>
      <View className="flex-row items-center" style={{ flex: 1, gap: 12 }}>
        <Neumorph variant="raised" radius={14} intensity="sm">
          <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size={20} color="carbon" strokeWidth={2.1} />
          </View>
        </Neumorph>
        <View style={{ flex: 1 }}>
          <AppText
            variant="caption"
            weight="semibold"
            color={colors.textSubtle}
            style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 10.5 }}
          >
            {eyebrow}
          </AppText>
          <AppText variant="headingSm" weight="bold" color={colors.carbon} style={{ marginTop: 1, fontSize: 22 }}>
            {title}
          </AppText>
        </View>
      </View>
      {trailing}
    </View>
  );
}

/* ================================================================== */
/* Stat pill — one figure inside an inset neumorphic well              */
/* ================================================================== */

function StatPill({
  value,
  label,
  icon,
  accent,
}: {
  value: string;
  label: string;
  icon: IconName;
  accent: string;
}) {
  return (
    <Neumorph variant="inset" radius={radii.sm + 8} intensity="sm" style={{ flex: 1 }}>
      <View style={{ paddingVertical: 16, paddingHorizontal: 10, alignItems: 'center' }}>
        <Icon name={icon} size={18} color={accent} strokeWidth={2.3} />
        <Text
          style={{
            fontFamily: fonts.displayBold,
            fontSize: 26,
            color: accent,
            letterSpacing: -1,
            marginTop: 6,
          }}
        >
          {value}
        </Text>
        <AppText
          variant="caption"
          weight="medium"
          color={colors.textMuted}
          style={{ fontSize: 10.5, marginTop: 2, textAlign: 'center' }}
        >
          {label}
        </AppText>
      </View>
    </Neumorph>
  );
}

/* ================================================================== */
/* Empty state — nothing due today (brand illustration)                */
/* ================================================================== */

function AllClear() {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 380 }}
    >
      <SoftCard radius={radii.cardLg} intensity="lg" padding={28}>
        <View style={{ alignItems: 'center' }}>
          {/* Brand mockup illustration with a yellow "all clear" badge */}
          <View style={{ width: 150, height: 188, alignItems: 'center', justifyContent: 'center' }}>
            <Image
              source={illustrationAssets.phoneClear}
              style={{ width: 150, height: 188, resizeMode: 'contain' }}
            />
            <MotiView
              from={{ scale: 0, rotate: '-30deg' }}
              animate={{ scale: 1, rotate: '0deg' }}
              transition={{ type: 'spring', damping: 12, stiffness: 160, delay: 240 }}
              style={{ position: 'absolute', bottom: 6, right: 8 }}
            >
              <Neumorph variant="raised" radius={9999} intensity="sm" surface={colors.highlighter}>
                <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={26} color="carbon" strokeWidth={3} />
                </View>
              </Neumorph>
            </MotiView>
          </View>

          <AppText
            variant="headingSm"
            weight="bold"
            color={colors.carbon}
            style={{ marginTop: 16, textAlign: 'center', fontSize: 24 }}
          >
            All caught up
          </AppText>
          <AppText
            variant="body"
            color={colors.textMuted}
            style={{ marginTop: 6, textAlign: 'center', maxWidth: 270 }}
          >
            No revisions are due today. Your recall is locked in — come back tomorrow to
            keep the streak alive.
          </AppText>
          <View style={{ marginTop: 18 }}>
            <Tag
              label="Inbox zero"
              tone="success"
              icon={<Icon name="sparkles" size={13} color="#2c9d5f" strokeWidth={2.3} />}
            />
          </View>
        </View>
      </SoftCard>
    </MotiView>
  );
}

/* ================================================================== */
/* Upcoming group — calendar chip + the day's revisions                */
/* ================================================================== */

function UpcomingDay({ group, index }: { group: UpcomingGroup; index: number }) {
  const chip = calendarChip(group.dueDate);

  return (
    <MotiView
      from={{ opacity: 0, translateX: 12 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 340, delay: index * 80 }}
      className="flex-row"
      style={{ gap: 14, marginBottom: 16 }}
    >
      {/* Calendar date chip */}
      <Neumorph variant="raised" radius={radii.sm + 6} intensity="sm">
        <View style={{ width: 58, paddingVertical: 12, alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: fonts.bodyMedium,
              fontSize: 11,
              color: colors.textSubtle,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {chip.month}
          </Text>
          <Text
            style={{
              fontFamily: fonts.displayBold,
              fontSize: 24,
              color: colors.carbon,
              letterSpacing: -1,
              marginTop: 1,
            }}
          >
            {chip.dayNum}
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textSubtle }}>
            {chip.weekday}
          </Text>
        </View>
      </Neumorph>

      {/* The day's revisions */}
      <View style={{ flex: 1 }}>
        <View className="flex-row items-center" style={{ marginBottom: 8, gap: 8 }}>
          <AppText variant="body" weight="bold" color={colors.carbon}>
            {group.label}
          </AppText>
          <Tag label={`${group.items.length}`} tone="neutral" size="sm" />
        </View>

        {group.items.map((rev, i) => (
          <View key={rev.id} style={{ marginBottom: i === group.items.length - 1 ? 0 : 10 }}>
            <Neumorph variant="flat" radius={radii.sm + 6} intensity="sm" padding={14} surface="#ededed">
              <View className="flex-row items-center justify-between" style={{ gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <AppText variant="body" weight="semibold" color={colors.carbon} numberOfLines={1}>
                    {rev.problemTitle}
                  </AppText>
                  <View className="flex-row items-center" style={{ gap: 8, marginTop: 6 }}>
                    <Tag
                      label={DIFFICULTY_LABEL[rev.difficulty]}
                      tone={DIFFICULTY_TONE[rev.difficulty]}
                      size="sm"
                    />
                    <AppText variant="caption" color={colors.textSubtle} style={{ fontSize: 11 }}>
                      {rev.topicTitle}
                    </AppText>
                  </View>
                </View>
                <Icon name="chevron-right" size={18} color="textSubtle" strokeWidth={2.4} />
              </View>
            </Neumorph>
          </View>
        ))}
      </View>
    </MotiView>
  );
}

/* ================================================================== */
/* Inline empty states for the upcoming / activity tabs                */
/* ================================================================== */

function EmptyNote({ icon, text }: { icon: IconName; text: string }) {
  return (
    <SoftCard radius={radii.card} intensity="sm" padding={24}>
      <View style={{ alignItems: 'center' }}>
        <Neumorph variant="inset" radius={9999} intensity="sm">
          <View style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size={24} color="textSubtle" strokeWidth={2} />
          </View>
        </Neumorph>
        <AppText
          variant="body"
          color={colors.textMuted}
          style={{ marginTop: 14, textAlign: 'center', maxWidth: 280 }}
        >
          {text}
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

  const [revisions, setRevisions] = useState<Revision[]>(mockRevisions);
  // Locally completed/skipped revisions drop out of today's queue immediately.
  const [clearedToday, setClearedToday] = useState<string[]>([]);
  const [view, setView] = useState<QueueView>('today');

  // The revision-activity heatmap is deterministic — build once.
  const revisionHeatmap = useMemo(() => buildRevisionHeatmap(182), []);

  const dueToday = useMemo(
    () => revisions.filter((r) => r.dueToday && !clearedToday.includes(r.id)),
    [revisions, clearedToday],
  );

  const upcoming = useMemo(() => groupUpcoming(revisions), [revisions]);

  // Headline stats.
  const totalReviews = useMemo(
    () => revisions.reduce((sum, r) => sum + r.reviewCount, 0),
    [revisions],
  );
  const masteredCount = useMemo(
    () => revisions.filter((r) => r.confidence >= 5).length,
    [revisions],
  );
  const completedTodayCount = clearedToday.length;

  /* ----- Per-card actions (local state only) ----- */

  const handleComplete = useCallback((id: string, grade: RecallGrade) => {
    const meta = gradeMeta(grade);
    setRevisions((prev) => prev.map((r) => (r.id === id ? applyGrade(r, meta) : r)));
    setClearedToday((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const handleSnooze = useCallback(
    (id: string) => {
      const rev = revisions.find((r) => r.id === id);
      setRevisions((prev) => prev.map((r) => (r.id === id ? snoozeRevision(r, 1) : r)));
      setClearedToday((prev) => (prev.includes(id) ? prev : [...prev, id]));

      // Schedule a REAL on-device reminder for the snoozed revision (~24h out).
      // Fires on the phone even offline / with the app closed. Best-effort —
      // a denied permission simply returns null and is ignored.
      if (rev) {
        const when = new Date(Date.now() + 24 * 60 * 60 * 1000);
        void scheduleLocalReminder({
          title: 'Revision due',
          body: `Time to review "${rev.problemTitle}" — keep your recall sharp.`,
          date: when,
          data: { kind: 'revision', revisionId: rev.id },
        });
      }
    },
    [revisions],
  );

  const handleSkip = useCallback((id: string) => {
    setClearedToday((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 130,
        }}
      >
        {/* ---------- Gray brand watermark ---------- */}
        <View style={{ marginBottom: 10 }}>
          <GrayMark size={24} />
        </View>

        {/* ---------- Header ---------- */}
        <View className="flex-row items-start justify-between" style={{ marginBottom: 22 }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <View className="flex-row items-center" style={{ gap: 7, marginBottom: 4 }}>
              <Icon name="repeat" size={13} color="textSubtle" strokeWidth={2.4} />
              <AppText
                variant="caption"
                weight="semibold"
                color={colors.textSubtle}
                style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 11 }}
              >
                Spaced repetition
              </AppText>
            </View>
            <AppText variant="heading" display weight="bold" color={colors.carbon}>
              Revisions
            </AppText>
            <AppText variant="body" color={colors.textMuted} style={{ marginTop: 6 }}>
              {dueToday.length > 0
                ? `${dueToday.length} due today · keep your recall sharp`
                : 'Nothing due — memory locked in'}
            </AppText>
          </View>
          <StreakChip count={mockProfile.streak} />
        </View>

        {/* ---------- Stat summary ---------- */}
        <View className="flex-row" style={{ gap: 12, marginBottom: 24 }}>
          <StatPill value={`${dueToday.length}`} label="Due today" icon="target" accent={colors.annotation} />
          <StatPill
            value={`${completedTodayCount}`}
            label="Reviewed"
            icon="check-circle"
            accent={colors.success}
          />
          <StatPill value={`${masteredCount}`} label="Mastered" icon="award" accent={colors.signal} />
        </View>

        {/* ---------- View switcher (segmented, not radios) ---------- */}
        <SegmentedTabs options={VIEW_SEGMENTS} value={view} onChange={setView} style={{ marginBottom: 26 }} />

        {/* ================= DUE TODAY ================= */}
        {view === 'today' ? (
          <MotiView
            key="today"
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 260 }}
          >
            <SectionHeader
              eyebrow="Review now"
              title="Due Today"
              icon="target"
              trailing={
                dueToday.length > 0 ? (
                  <Tag label={`${dueToday.length} left`} tone="annotation" size="sm" />
                ) : undefined
              }
            />
            {dueToday.length > 0 ? (
              dueToday.map((rev, i) => (
                <RevisionCard
                  key={rev.id}
                  revision={rev}
                  index={i}
                  onComplete={handleComplete}
                  onSnooze={handleSnooze}
                  onSkip={handleSkip}
                />
              ))
            ) : (
              <AllClear />
            )}
          </MotiView>
        ) : null}

        {/* ================= UPCOMING ================= */}
        {view === 'upcoming' ? (
          <MotiView
            key="upcoming"
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 260 }}
          >
            <SectionHeader
              eyebrow="On the horizon"
              title="Upcoming"
              icon="calendar"
              trailing={
                upcoming.length > 0 ? (
                  <Tag label={`${upcoming.length} days`} tone="signal" size="sm" />
                ) : undefined
              }
            />
            {upcoming.length > 0 ? (
              upcoming.map((group, i) => (
                <UpcomingDay key={group.dueDate} group={group} index={i} />
              ))
            ) : (
              <EmptyNote
                icon="calendar-check"
                text="No upcoming reviews scheduled. Solve and flag more problems to build your revision queue."
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
            transition={{ type: 'timing', duration: 260 }}
          >
            <SectionHeader eyebrow="Consistency" title="Review Activity" icon="activity" />
            <SoftCard radius={radii.card} intensity="md" padding={18}>
              <View className="flex-row items-center justify-between" style={{ marginBottom: 16 }}>
                <View>
                  <View className="flex-row items-baseline" style={{ gap: 6 }}>
                    <Text
                      style={{
                        fontFamily: fonts.displayBold,
                        fontSize: 28,
                        color: colors.carbon,
                        letterSpacing: -1,
                      }}
                    >
                      {totalReviews}
                    </Text>
                    <AppText variant="caption" color={colors.textMuted}>
                      reviews logged
                    </AppText>
                  </View>
                  <View className="flex-row items-center" style={{ gap: 6, marginTop: 4 }}>
                    <Icon name="flame" size={13} color="highlighter" strokeWidth={2.3} fill={colors.highlighter} />
                    <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 11 }}>
                      {mockProfile.streak}-day review streak
                    </AppText>
                  </View>
                </View>
                <Tag label="Last 6 months" tone="neutral" size="sm" />
              </View>
              <Heatmap data={revisionHeatmap} range={182} cellSize={12} gap={3} />
            </SoftCard>

            {/* Mastery breakdown well */}
            <View className="flex-row" style={{ gap: 12, marginTop: 16 }}>
              <StatPill
                value={`${completedTodayCount}`}
                label="Reviewed today"
                icon="check-circle"
                accent={colors.success}
              />
              <StatPill
                value={`${dueToday.length}`}
                label="Still due"
                icon="clock"
                accent={colors.annotation}
              />
              <StatPill value={`${masteredCount}`} label="Mastered" icon="award" accent={colors.signal} />
            </View>
          </MotiView>
        ) : null}
      </ScrollView>
    </View>
  );
}
