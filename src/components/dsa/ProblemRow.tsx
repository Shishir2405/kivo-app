import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { SoftCard } from '@/components/ui/SoftCard';
import { AppText } from '@/components/ui/Typography';
import { Tag } from '@/components/ui/Tag';
import { Icon } from '@/components/ui/Icon';
import {
  DIFFICULTY_LABEL,
  DIFFICULTY_TONE,
  statusColor,
  STATUS_ICON,
  STATUS_LABEL,
  STATUS_TONE,
} from './dsaMeta';
import { interaction, pressOpacity } from '@/theme/tokens';
import { useTheme } from '@/theme';
import type { Problem } from '@/types/models';

export type ProblemRowProps = {
  problem: Problem;
  onPress?: () => void;
  index?: number;
};

/**
 * A flat Steep problem row: a small thin status glyph (Rust when solved), the
 * title + an optional bookmark tick, a difficulty + status tag pair, an optional
 * source label, and a chevron. Dove hairline + the one subtle shadow.
 */
export function ProblemRow({ problem, onPress }: ProblemRowProps) {
  const { colors, accentForTone } = useTheme();
  const statusStroke = statusColor(problem.status, colors, accentForTone);
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{
        opacity: pressOpacity({ pressed }, { solid: true }),
        transform: [{ scale: pressed ? interaction.pressScale : 1 }],
      }}
    >
      <SoftCard radius={14} padding={12}>
        <View className="flex-row items-center" style={{ gap: 10 }}>
          {/* Status glyph */}
          <Icon name={STATUS_ICON[problem.status]} size={17} color={statusStroke} />

          <View style={{ flex: 1 }}>
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <AppText
                variant="body"
                weight="medium"
                numberOfLines={1}
                style={{ flexShrink: 1 }}
              >
                {problem.title}
              </AppText>
              {problem.bookmarked ? (
                <Icon name="bookmark" size={13} color="rust" weight="fill" />
              ) : null}
            </View>

            <View className="flex-row items-center flex-wrap" style={{ gap: 6, marginTop: 6 }}>
              <Tag
                label={DIFFICULTY_LABEL[problem.difficulty]}
                tone={DIFFICULTY_TONE[problem.difficulty]}
                size="sm"
              />
              <Tag label={STATUS_LABEL[problem.status]} tone={STATUS_TONE[problem.status]} size="sm" />
              {problem.source ? (
                <AppText variant="caption" color={colors.muted} style={{ fontSize: 10.5 }}>
                  {problem.source}
                </AppText>
              ) : null}
            </View>
          </View>

          <Icon name="chevron-right" size={16} color="hairline" />
        </View>
      </SoftCard>
    </Pressable>
  );
}

export default ProblemRow;
