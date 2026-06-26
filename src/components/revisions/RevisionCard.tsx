import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { SoftButton } from '@/components/ui/SoftButton';
import { Neumorph } from '@/components/ui/Neumorph';
import { Tag } from '@/components/ui/Tag';
import { Icon, SegmentedTabs, type SegmentedOption } from '@/components/ui';
import { colors, fonts, radii } from '@/theme/tokens';
import type { Revision, Confidence } from '@/types/models';
import {
  RECALL_GRADES,
  gradeMeta,
  nextReviewPreview,
  type RecallGrade,
  DIFFICULTY_TONE,
  DIFFICULTY_LABEL,
  confidenceColor,
  confidenceLabel,
} from './revisionUtils';

/* ------------------------------------------------------------------ */
/* Confidence meter — 5 pips coloured by current confidence            */
/* ------------------------------------------------------------------ */

function ConfidenceMeter({ level }: { level: Confidence }) {
  const accent = confidenceColor(level);
  return (
    <View className="flex-row items-center" style={{ gap: 9 }}>
      <View className="flex-row" style={{ gap: 4 }}>
        {[1, 2, 3, 4, 5].map((pip) => {
          const on = pip <= level;
          return (
            <MotiView
              key={pip}
              animate={{
                backgroundColor: on ? accent : '#d7d7d7',
                scale: on ? 1 : 0.82,
              }}
              transition={{ type: 'timing', duration: 240 }}
              style={{ width: 18, height: 6, borderRadius: 3 }}
            />
          );
        })}
      </View>
      <AppText variant="caption" weight="medium" color={colors.textMuted} style={{ fontSize: 11 }}>
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
  icon: m.icon,
}));

/* ------------------------------------------------------------------ */
/* Due-today revision card                                             */
/* ------------------------------------------------------------------ */

export type RevisionCardProps = {
  revision: Revision;
  index?: number;
  onComplete: (id: string, grade: RecallGrade) => void;
  onSnooze: (id: string) => void;
  onSkip: (id: string) => void;
};

/**
 * A single due-today revision.
 *
 * Tapping "Review" flips the card into rating mode, where a custom
 * `SegmentedTabs` segmented control (NOT a radio group) captures the recall
 * grade — a sliding highlighter-yellow pill telegraphs the next-review interval
 * live. "Save review" commits; Snooze pushes it a day; Skip drops it from the
 * queue. On commit the card plays a soft success flourish before it animates
 * out. All actions are local-state only.
 */
export function RevisionCard({
  revision,
  index = 0,
  onComplete,
  onSnooze,
  onSkip,
}: RevisionCardProps) {
  const [mode, setMode] = useState<'idle' | 'rating' | 'done'>('idle');
  const [grade, setGrade] = useState<RecallGrade>('MEDIUM');

  const meta = gradeMeta(grade);

  function commit() {
    setMode('done');
    // Let the success flourish breathe before the parent removes the card.
    setTimeout(() => onComplete(revision.id, grade), 560);
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 340, delay: index * 70 }}
      style={{ marginBottom: 14 }}
    >
      <SoftCard radius={radii.card} intensity="md" padding={18}>
        {/* Top row: difficulty + interval meta */}
        <View className="flex-row items-center justify-between" style={{ marginBottom: 12 }}>
          <Tag
            label={DIFFICULTY_LABEL[revision.difficulty]}
            tone={DIFFICULTY_TONE[revision.difficulty]}
            size="sm"
          />
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <Icon name="repeat" size={13} color="textSubtle" strokeWidth={2.2} />
            <AppText variant="caption" color={colors.textSubtle} style={{ fontSize: 11 }}>
              {revision.reviewCount}x reviewed · every {revision.intervalDays}d
            </AppText>
          </View>
        </View>

        {/* Title + topic */}
        <View className="flex-row items-start" style={{ gap: 12 }}>
          <Neumorph variant="raised" radius={14} intensity="sm">
            <View
              style={{
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="brain" size={22} color="carbon" strokeWidth={2.1} />
            </View>
          </Neumorph>
          <View style={{ flex: 1 }}>
            <AppText variant="subheading" weight="bold" color={colors.carbon} numberOfLines={2}>
              {revision.problemTitle}
            </AppText>
            <View className="flex-row items-center" style={{ gap: 6, marginTop: 3 }}>
              <Icon name="hash" size={12} color="textSubtle" strokeWidth={2.4} />
              <AppText variant="caption" color={colors.textMuted}>
                {revision.topicTitle}
              </AppText>
            </View>
          </View>
        </View>

        {/* Confidence meter */}
        <View style={{ marginTop: 14 }}>
          <ConfidenceMeter level={revision.confidence} />
        </View>

        {/* Action / rating zone */}
        <AnimatePresence exitBeforeEnter>
          {mode === 'done' ? (
            <MotiView
              key="done"
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', damping: 14, stiffness: 180 }}
              className="flex-row items-center"
              style={{ marginTop: 16, gap: 10 }}
            >
              <Neumorph variant="raised" radius={radii.pill} intensity="sm" surface={colors.highlighter}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="check" size={20} color="carbon" strokeWidth={3} />
                </View>
              </Neumorph>
              <View style={{ flex: 1 }}>
                <AppText variant="body" weight="bold" color={colors.carbon}>
                  Review saved
                </AppText>
                <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 11 }}>
                  Next up {nextReviewPreview(revision, meta)}
                </AppText>
              </View>
            </MotiView>
          ) : mode === 'rating' ? (
            <MotiView
              key="rating"
              from={{ opacity: 0, translateY: -8 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'timing', duration: 220 }}
              style={{ marginTop: 16 }}
            >
              <View className="flex-row items-center justify-between" style={{ marginBottom: 10 }}>
                <AppText
                  variant="caption"
                  weight="semibold"
                  color={colors.textSubtle}
                  style={{ textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 10 }}
                >
                  How well did you recall it?
                </AppText>
                <View className="flex-row items-center" style={{ gap: 5 }}>
                  <Icon name="calendar" size={12} color="textSubtle" strokeWidth={2.2} />
                  <Text
                    style={{
                      fontFamily: fonts.bodyMedium,
                      fontSize: 11,
                      color: meta.accentHex,
                    }}
                  >
                    {nextReviewPreview(revision, meta)}
                  </Text>
                </View>
              </View>

              {/* The recall grade — a custom segmented control, never radios. */}
              <SegmentedTabs
                options={GRADE_SEGMENTS}
                value={grade}
                onChange={setGrade}
                height={50}
              />

              <View className="flex-row items-center" style={{ marginTop: 14, gap: 10 }}>
                <SoftButton
                  label="Save review"
                  variant="yellow"
                  size="sm"
                  onPress={commit}
                  style={{ flex: 1 }}
                  icon={<Icon name="check" size={15} color="carbon" strokeWidth={3} />}
                />
                <Pressable
                  onPress={() => setMode('idle')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel rating"
                >
                  <Neumorph variant="raised" radius={radii.pill} intensity="sm">
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name="x" size={18} color="textMuted" strokeWidth={2.4} />
                    </View>
                  </Neumorph>
                </Pressable>
              </View>
            </MotiView>
          ) : (
            <MotiView
              key="actions"
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'timing', duration: 200 }}
              className="flex-row items-center"
              style={{ marginTop: 16, gap: 10 }}
            >
              <SoftButton
                label="Review"
                variant="yellow"
                size="sm"
                onPress={() => setMode('rating')}
                style={{ flex: 1 }}
                icon={<Icon name="check-circle" size={16} color="carbon" strokeWidth={2.4} />}
              />
              <SoftButton
                label="Snooze"
                variant="neutral"
                size="sm"
                onPress={() => onSnooze(revision.id)}
                icon={<Icon name="clock" size={15} color="carbon" strokeWidth={2.2} />}
              />
              <Pressable
                onPress={() => onSkip(revision.id)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Skip revision"
              >
                <Neumorph variant="raised" radius={radii.pill} intensity="sm">
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="x" size={18} color="textMuted" strokeWidth={2.4} />
                  </View>
                </Neumorph>
              </Pressable>
            </MotiView>
          )}
        </AnimatePresence>
      </SoftCard>
    </MotiView>
  );
}

export default RevisionCard;
