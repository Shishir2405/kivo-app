import React, { useState } from 'react';
import { View } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { PillButton, TextLink } from '@/components/ui/PillButton';
import { Tag } from '@/components/ui/Tag';
import { Icon, SegmentedTabs, type SegmentedOption } from '@/components/ui';
import { colors, radii, fonts } from '@/theme/tokens';
import type { Revision, Confidence } from '@/types/models';
import {
  RECALL_GRADES,
  gradeMeta,
  nextReviewPreview,
  clampConfidence,
  confidencePipColor,
  confidenceLabel,
  relativeDueLabel,
  daysFromToday,
  DIFFICULTY_TONE,
  DIFFICULTY_LABEL,
  type RecallGrade,
} from './revisionUtils';

/* ------------------------------------------------------------------ */
/* Confidence meter — 5 thin pips (Ink filled / Dove empty)            */
/* ------------------------------------------------------------------ */

function ConfidenceMeter({ value }: { value: Confidence }) {
  const level = clampConfidence(value);
  const accent = confidencePipColor(level);
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
              backgroundColor: pip <= level ? accent : colors.dove,
            }}
          />
        ))}
      </View>
      <AppText variant="caption" color={colors.graphite}>
        {confidenceLabel(level)}
      </AppText>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Recall-grade segmented control (Hard / Medium / Easy)               */
/* ------------------------------------------------------------------ */

const GRADE_SEGMENTS: SegmentedOption<RecallGrade>[] = RECALL_GRADES.map((m) => ({
  label: m.label,
  value: m.grade,
}));

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
 * A single due revision (Steep). A flat white card with a 1px Dove hairline +
 * the one subtle shadow. Tapping "Review" reveals a minimal segmented control
 * to capture the recall grade — the next-review interval is telegraphed live.
 * The ONE filled Ink pill commits; Snooze / Skip are text links.
 */
export function RevisionCard({
  revision,
  index = 0,
  pending = false,
  onReview,
  onSnooze,
  onSkip,
}: RevisionCardProps) {
  const [rating, setRating] = useState(false);
  const [grade, setGrade] = useState<RecallGrade>('MEDIUM');

  const meta = gradeMeta(grade);
  const difficulty = revision.difficulty ?? 'MEDIUM';
  const overdue = daysFromToday(revision.dueDate) < 0;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300, delay: Math.min(index, 6) * 60 }}
      style={{ marginBottom: 12 }}
    >
      <SoftCard radius={radii.card} padding={14}>
        {/* Top row: difficulty + cadence meta */}
        <View className="flex-row items-center justify-between" style={{ marginBottom: 10 }}>
          <Tag label={DIFFICULTY_LABEL[difficulty]} tone={DIFFICULTY_TONE[difficulty]} size="sm" />
          <View className="flex-row items-center" style={{ gap: 5 }}>
            <Icon name="repeat" size={13} color="graphite" />
            <AppText variant="caption" color={colors.graphite}>
              {revision.reviewCount ?? 0}× · every {revision.intervalDays ?? 1}d
            </AppText>
          </View>
        </View>

        {/* Title + topic */}
        <AppText variant="subheading" weight="medium" color={colors.ink} numberOfLines={2}>
          {revision.problemTitle ?? 'Untitled problem'}
        </AppText>
        {revision.topicTitle ? (
          <View className="flex-row items-center" style={{ gap: 5, marginTop: 3 }}>
            <Icon name="hash" size={12} color="graphite" />
            <AppText variant="caption" color={colors.ash}>
              {revision.topicTitle}
            </AppText>
          </View>
        ) : null}

        {/* Confidence + due meta */}
        <View className="flex-row items-center justify-between" style={{ marginTop: 12 }}>
          <ConfidenceMeter value={revision.confidence} />
          <AppText variant="caption" color={overdue ? colors.rust : colors.graphite}>
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
              transition={{ type: 'timing', duration: 180 }}
              style={{ marginTop: 14 }}
            >
              <View className="flex-row items-center justify-between" style={{ marginBottom: 8 }}>
                <AppText variant="caption" color={colors.graphite}>
                  How well did you recall it?
                </AppText>
                <AppText
                  variant="caption"
                  weight="medium"
                  color={colors.ink}
                  style={{ fontFamily: fonts.sansMedium }}
                >
                  Next {nextReviewPreview(revision, meta)}
                </AppText>
              </View>

              <SegmentedTabs options={GRADE_SEGMENTS} value={grade} onChange={setGrade} height={36} />

              <View className="flex-row items-center justify-between" style={{ marginTop: 12 }}>
                <PillButton
                  label={pending ? 'Saving…' : 'Save review'}
                  variant="black"
                  size="sm"
                  disabled={pending}
                  onPress={() => onReview(revision.id, grade)}
                  icon={<Icon name="check" size={14} color="white" />}
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
              transition={{ type: 'timing', duration: 150 }}
              className="flex-row items-center justify-between"
              style={{ marginTop: 14 }}
            >
              <PillButton
                label="Review"
                variant="black"
                size="sm"
                onPress={() => setRating(true)}
                icon={<Icon name="check-circle" size={14} color="white" />}
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
