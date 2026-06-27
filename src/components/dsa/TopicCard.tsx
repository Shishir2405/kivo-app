import React from 'react';
import { Pressable, View } from 'react-native';
import { MotiView } from 'moti';
import { SoftCard } from '@/components/ui/SoftCard';
import { AppText } from '@/components/ui/Typography';
import { Tag } from '@/components/ui/Tag';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from './ProgressBar';
import { DIFFICULTY_LABEL, DIFFICULTY_TONE, masteryMeta, progressColor } from './dsaMeta';
import { motion, interaction, pressOpacity, toneAt } from '@/theme/tokens';
import { useTheme } from '@/theme';
import type { DsaTopic } from '@/types/models';

export type TopicCardProps = {
  topic: DsaTopic;
  onPress?: () => void;
  /** Stagger index for the mount animation. */
  index?: number;
};

/**
 * A flat Steep topic card on a rotating soft wash (peach -> sky -> mint ->
 * lavender -> butter by list index, so a grid looks intentional). A small thin
 * glyph (tinted to the wash accent) + serif title, a one-line description,
 * difficulty + mastery tags, a solved/total counter, and a thin progress rail.
 * Matching hairline + the one subtle shadow. Text stays Ink/Graphite.
 */
export function TopicCard({ topic, onPress, index = 0 }: TopicCardProps) {
  const { colors, accentForTone } = useTheme();
  const progress = Number.isFinite(topic.progress) ? topic.progress : 0;
  const solved = topic.solvedProblems ?? 0;
  const total = topic.totalProblems ?? 0;
  const mastery = masteryMeta(topic.mastery ?? progress, accentForTone, colors);
  const barColor = progressColor(progress, colors);
  const tone = toneAt(index);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: motion.duration.transition, delay: 40 + index * 50 }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          opacity: pressOpacity({ pressed }, { solid: true }),
          transform: [{ scale: pressed ? interaction.pressScale : 1 }],
        })}
      >
        <SoftCard tone={tone} radius={16} padding={14}>
          {({ accent }) => (
          <View style={{ gap: 12 }}>
            {/* Header row */}
            <View className="flex-row items-center" style={{ gap: 10 }}>
              <Icon name={topic.emoji} size={17} color={accent} />

              <View style={{ flex: 1 }}>
                <AppText variant="subheading" weight="medium" display numberOfLines={1}>
                  {topic.title}
                </AppText>
                {topic.description ? (
                  <AppText
                    variant="caption"
                    color={colors.muted}
                    numberOfLines={1}
                    style={{ fontSize: 11.5, marginTop: 1 }}
                  >
                    {topic.description}
                  </AppText>
                ) : null}
              </View>

              <Icon name="chevron-right" size={16} color={accent} />
            </View>

            {/* Meta row */}
            <View className="flex-row items-center flex-wrap" style={{ gap: 6 }}>
              <Tag
                label={DIFFICULTY_LABEL[topic.difficulty]}
                tone={DIFFICULTY_TONE[topic.difficulty]}
                size="sm"
              />
              <Tag label={mastery.label} tone={mastery.tone} size="sm" />
              <Tag label={`${solved}/${total}`} tone="neutral" size="sm" />
            </View>

            {/* Progress */}
            <View style={{ gap: 6 }}>
              <ProgressBar progress={progress} color={barColor} delay={80 + index * 50} />
              <View className="flex-row items-center justify-between">
                <AppText variant="caption" color={colors.muted} style={{ fontSize: 11 }}>
                  Progress
                </AppText>
                <AppText variant="caption" weight="medium" color={colors.ink} style={{ fontSize: 11 }}>
                  {progress}%
                </AppText>
              </View>
            </View>
          </View>
          )}
        </SoftCard>
      </Pressable>
    </MotiView>
  );
}

export default TopicCard;
