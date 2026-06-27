import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { PillButton, TextLink } from '@/components/ui/PillButton';
import { Tag } from '@/components/ui/Tag';
import { Icon, type IconName } from '@/components/ui';
import { fonts, radii, motion, pressOpacity } from '@/theme/tokens';
import { useTheme } from '@/theme';
import type { Revision, Confidence } from '@/types/models';
import {
  RECALL_GRADES,
  gradeMeta,
  nextReviewPreview,
  clampConfidence,
  confidenceLabel,
  relativeDueLabel,
  daysFromToday,
  spacingLadder,
  DIFFICULTY_TONE,
  DIFFICULTY_LABEL,
  type RecallGrade,
} from './revisionUtils';

/* ------------------------------------------------------------------ */
/* Confidence meter — 5 thin pips (accent filled / hairline empty)     */
/* ------------------------------------------------------------------ */

function ConfidenceMeter({ value, tint }: { value: Confidence; tint: string }) {
  const { colors } = useTheme();
  const level = clampConfidence(value);
  // Shaky bands keep the warm terracotta warning; solid recall fills with the
  // card's tonal accent so the meter reads as colourful-but-meaningful.
  const fill = level <= 2 ? colors.primary : tint;
  return (
    <View className="flex-row items-center" style={{ gap: 8 }}>
      <View className="flex-row" style={{ gap: 3 }}>
        {[1, 2, 3, 4, 5].map((pip) => (
          <View
            key={pip}
            style={{
              width: 16,
              height: 4,
              borderRadius: 2,
              backgroundColor: pip <= level ? fill : colors.hairline,
            }}
          />
        ))}
      </View>
      <AppText variant="caption" color={colors.muted}>
        {confidenceLabel(level)}
      </AppText>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Spacing ladder — the HTML "Spacing ladder" rail (3·7·15·30·60)      */
/* ------------------------------------------------------------------ */

/**
 * The spaced-repetition rail from the HTML "Revision review" screen. Cleared
 * rungs read as solid mint dots joined by mint connectors; the live rung is a
 * larger terracotta dot with a soft halo; rungs still ahead are hairline
 * outlines on muted connectors. Day numbers sit beneath in mono. Dark-aware.
 */
function SpacingLadder({ revision }: { revision: Revision }) {
  const { colors } = useTheme();
  const steps = spacingLadder(revision);

  const dotColor = (s: (typeof steps)[number]) =>
    s.current ? colors.primary : s.done ? colors.success : 'transparent';

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.hairline,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 14,
        marginBottom: 16,
      }}
    >
      <AppText
        variant="caption"
        weight="semibold"
        color={colors.muted}
        style={{ textAlign: 'center', marginBottom: 14 }}
      >
        Spacing ladder
      </AppText>
      <View className="flex-row items-start justify-between">
        {steps.map((s, i) => {
          const last = i === steps.length - 1;
          const dot = dotColor(s);
          const size = s.current ? 18 : 14;
          // Connector to the next rung is "done" only while both ends are cleared.
          const connectorDone = s.done && (steps[i + 1]?.done || steps[i + 1]?.current);
          return (
            <React.Fragment key={s.days}>
              <View style={{ alignItems: 'center', gap: 6 }}>
                <View
                  style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: dot,
                    borderWidth: dot === 'transparent' ? 2 : 0,
                    borderColor: colors.hairline,
                    ...(s.current
                      ? {
                          shadowColor: colors.primary,
                          shadowOpacity: 0.2,
                          shadowRadius: 4,
                          shadowOffset: { width: 0, height: 0 },
                        }
                      : null),
                  }}
                />
                <AppText
                  variant="caption"
                  weight={s.current ? 'bold' : 'regular'}
                  color={s.current ? colors.primary : colors.muted}
                  style={{ fontFamily: fonts.mono, fontSize: 9 }}
                >
                  {s.days}
                </AppText>
              </View>
              {last ? null : (
                <View
                  style={{
                    flex: 1,
                    height: 2,
                    marginTop: 8,
                    marginHorizontal: -2,
                    backgroundColor: connectorDone ? colors.success : colors.hairline,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Recall-grade option row — full wash, square icon tile (HTML match)  */
/* ------------------------------------------------------------------ */

type GradeVisual = {
  grade: RecallGrade;
  icon: IconName;
  /** Wash bg / hairline / deep accent (the icon-tile fill) all from palette. */
  bg: string;
  border: string;
  tile: string;
  /** Text colours on the wash. */
  titleColor: string;
  subColor: string;
  /** Glyph stroke colour (on the deep tile). */
  glyph: string;
  sub: string;
};

function RecallOption({
  visual,
  selected,
  onPress,
}: {
  visual: GradeVisual;
  selected: boolean;
  onPress: () => void;
}) {
  const meta = gradeMeta(visual.grade);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressOpacity({ pressed }),
        backgroundColor: visual.bg,
        borderWidth: 1,
        borderColor: selected ? visual.tile : visual.border,
        borderRadius: 14,
        paddingVertical: 13,
        paddingHorizontal: 14,
      })}
      className="flex-row items-center"
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: visual.tile,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Icon name={visual.icon} size={17} color={visual.glyph} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText
          variant="body"
          weight="bold"
          color={visual.titleColor}
          style={{ fontFamily: fonts.sansBold }}
        >
          {meta.label}
        </AppText>
        <AppText variant="caption" color={visual.subColor}>
          {visual.sub}
        </AppText>
      </View>
      {selected ? <Icon name="check-circle" size={18} color={visual.tile} /> : null}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Due revision card                                                   */
/* ------------------------------------------------------------------ */

export type RevisionCardProps = {
  revision: Revision;
  index?: number;
  /** Whether a network review is in flight for this card. */
  pending?: boolean;
  onReview: (id: string, grade: RecallGrade) => void;
  onSnooze: (id: string) => void;
  onSkip: (id: string) => void;
};

/**
 * A single due revision (Kivo). A flat surface card with a 1px hairline + the
 * one soft shadow. Tapping "Review" reveals the recall-rating panel from the
 * HTML "Revision review" screen — three full-wash option rows (Easy / Medium /
 * Hard) each telegraphing its next interval. The ONE terracotta pill commits;
 * Snooze / Skip are text links. Fully dark-aware.
 */
export function RevisionCard({
  revision,
  index = 0,
  pending = false,
  onReview,
  onSnooze,
  onSkip,
}: RevisionCardProps) {
  const { colors, toneStyle } = useTheme();
  const [rating, setRating] = useState(false);
  const [grade, setGrade] = useState<RecallGrade>('MEDIUM');

  const meta = gradeMeta(grade);
  const difficulty = revision.difficulty ?? 'MEDIUM';
  const overdue = daysFromToday(revision.dueDate) < 0;

  // Card accent — the deeper terracotta primary keeps the queue cohesive.
  const accent = colors.primary;

  // Grade washes from the active palette (HTML: Easy→mint, Med→butter, Hard→peach).
  const mint = toneStyle('mint');
  const butter = toneStyle('butter');
  const peach = toneStyle('peach');

  const VISUALS: Record<RecallGrade, GradeVisual> = {
    EASY: {
      grade: 'EASY',
      icon: 'check',
      bg: mint.bg,
      border: mint.border,
      tile: colors.success,
      titleColor: mint.accent,
      subColor: colors.mintAccent,
      glyph: colors.inkInverted,
      sub: 'Next review in 30 days',
    },
    MEDIUM: {
      grade: 'MEDIUM',
      icon: 'minus',
      bg: butter.bg,
      border: butter.border,
      tile: colors.butterAccent,
      titleColor: butter.accent,
      subColor: colors.butterAccent,
      glyph: colors.inkInverted,
      sub: 'Next review in 15 days',
    },
    HARD: {
      grade: 'HARD',
      icon: 'repeat',
      bg: peach.bg,
      border: peach.border,
      tile: colors.primary,
      titleColor: peach.accent,
      subColor: colors.peachAccent,
      glyph: colors.inkInverted,
      sub: 'Review again in 3 days',
    },
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: motion.duration.transition,
        delay: Math.min(index, 6) * 60,
      }}
      style={{ marginBottom: 12 }}
    >
      <SoftCard radius={radii.card} padding={14} variant="raised">
        {/* Top row: difficulty overline + cadence meta */}
        <View className="flex-row items-center justify-between" style={{ marginBottom: 10 }}>
          <Tag label={DIFFICULTY_LABEL[difficulty]} tone={DIFFICULTY_TONE[difficulty]} size="sm" />
          <View className="flex-row items-center" style={{ gap: 5 }}>
            <Icon name="repeat" size={13} color={accent} />
            <AppText variant="caption" color={colors.muted}>
              {revision.reviewCount ?? 0}× · every {revision.intervalDays ?? 1}d
            </AppText>
          </View>
        </View>

        {/* Topic overline + serif title (HTML "Graphs · D+15" / "Course Schedule") */}
        {revision.topicTitle ? (
          <AppText
            variant="overline"
            uppercase
            weight="bold"
            color={colors.primaryOnWash}
            style={{ marginBottom: 4 }}
          >
            {revision.topicTitle}
            {Number.isFinite(revision.intervalDays) ? ` · D+${revision.intervalDays}` : ''}
          </AppText>
        ) : null}
        <AppText variant="heading" display weight="medium" color={colors.ink} numberOfLines={2}>
          {revision.problemTitle ?? 'Untitled problem'}
        </AppText>

        {/* Confidence + due meta */}
        <View className="flex-row items-center justify-between" style={{ marginTop: 12 }}>
          <ConfidenceMeter value={revision.confidence} tint={accent} />
          <AppText variant="caption" color={overdue ? colors.primary : colors.muted}>
            {relativeDueLabel(revision.dueDate)}
          </AppText>
        </View>

        {/* Action / rating zone */}
        <AnimatePresence exitBeforeEnter>
          {rating ? (
            <MotiView
              key="rating"
              from={{ opacity: 0, translateY: -6 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'timing', duration: motion.duration.micro }}
              style={{ marginTop: 16 }}
            >
              <SpacingLadder revision={revision} />

              <AppText
                variant="subheading"
                weight="semibold"
                color={colors.ink}
                style={{ textAlign: 'center', marginBottom: 12 }}
              >
                How well did you recall it?
              </AppText>

              <View style={{ gap: 9 }}>
                {RECALL_GRADES.map((g) => (
                  <RecallOption
                    key={g.grade}
                    visual={VISUALS[g.grade]}
                    selected={grade === g.grade}
                    onPress={() => setGrade(g.grade)}
                  />
                ))}
              </View>

              <View
                className="flex-row items-center justify-between"
                style={{ marginTop: 14 }}
              >
                <PillButton
                  label={pending ? 'Saving…' : `Save · next ${nextReviewPreview(revision, meta)}`}
                  variant="primary"
                  size="sm"
                  disabled={pending}
                  onPress={() => onReview(revision.id, grade)}
                  icon={<Icon name="check" size={14} color={colors.onPrimary} />}
                />
                <TextLink label="Cancel" muted size="sm" disabled={pending} onPress={() => setRating(false)} />
              </View>
            </MotiView>
          ) : (
            <MotiView
              key="actions"
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'timing', duration: motion.duration.microFast }}
              className="flex-row items-center justify-between"
              style={{ marginTop: 14 }}
            >
              <PillButton
                label="Review"
                variant="primary"
                size="sm"
                onPress={() => setRating(true)}
                icon={<Icon name="check-circle" size={14} color={colors.onPrimary} />}
              />
              <View className="flex-row items-center" style={{ gap: 16 }}>
                <TextLink label="Snooze" size="sm" onPress={() => onSnooze(revision.id)} />
                <TextLink label="Skip" muted size="sm" onPress={() => onSkip(revision.id)} />
              </View>
            </MotiView>
          )}
        </AnimatePresence>
      </SoftCard>
    </MotiView>
  );
}

export default RevisionCard;
