import React from 'react';
import { Pressable, View } from 'react-native';
import { MotiView } from 'moti';
import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { AppText } from '@/components/ui/Typography';
import { Tag } from '@/components/ui/Tag';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from './ProgressBar';
import { DIFFICULTY_LABEL, DIFFICULTY_TONE, masteryMeta } from './dsaMeta';
import { colors } from '@/theme/tokens';
import type { DsaTopic } from '@/types/models';

export type TopicCardProps = {
  topic: DsaTopic;
  onPress?: () => void;
  /** Stagger index for the mount animation. */
  index?: number;
};

/**
 * A topic row card for the DSA list: an inset icon medallion + title, difficulty
 * + mastery tags, a solved/total counter and a neumorphic progress bar with the
 * percentage. Every glyph is rendered through the Icon system (no emoji).
 */
export function TopicCard({ topic, onPress, index = 0 }: TopicCardProps) {
  const mastery = masteryMeta(topic.mastery ?? topic.progress);
  const barColor = topic.progress >= 60 ? colors.success : colors.highlighter;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 420, delay: 80 + index * 70 }}
    >
      <Pressable onPress={onPress}>
        <SoftCard radius={28} padding={18}>
          <View style={{ gap: 14 }}>
            {/* Header row */}
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <Neumorph variant="inset" radius={16} intensity="sm">
                <View
                  style={{
                    width: 46,
                    height: 46,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={topic.emoji} size={22} color="carbon" strokeWidth={2.2} />
                </View>
              </Neumorph>

              <View style={{ flex: 1 }}>
                <AppText variant="subheading" weight="bold" display numberOfLines={1}>
                  {topic.title}
                </AppText>
                <AppText
                  variant="caption"
                  color={colors.textMuted}
                  numberOfLines={1}
                  style={{ fontSize: 12.5, marginTop: 1 }}
                >
                  {topic.description}
                </AppText>
              </View>

              <Icon name="chevron-right" size={20} color="textSubtle" />
            </View>

            {/* Meta row */}
            <View className="flex-row items-center flex-wrap" style={{ gap: 8 }}>
              <Tag
                label={DIFFICULTY_LABEL[topic.difficulty]}
                tone={DIFFICULTY_TONE[topic.difficulty]}
                size="sm"
              />
              <Tag label={mastery.label} tone={mastery.tone} size="sm" />
              <Tag
                label={`${topic.solvedProblems}/${topic.totalProblems} solved`}
                tone="neutral"
                size="sm"
              />
            </View>

            {/* Progress */}
            <View style={{ gap: 6 }}>
              <ProgressBar progress={topic.progress} color={barColor} delay={120 + index * 70} />
              <View className="flex-row items-center justify-between">
                <AppText variant="caption" color={colors.textSubtle} style={{ fontSize: 11.5 }}>
                  Progress
                </AppText>
                <AppText variant="caption" weight="bold" color={colors.carbon} style={{ fontSize: 12 }}>
                  {topic.progress}%
                </AppText>
              </View>
            </View>
          </View>
        </SoftCard>
      </Pressable>
    </MotiView>
  );
}

export default TopicCard;
