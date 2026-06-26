import React from 'react';
import { Pressable, View } from 'react-native';
import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { AppText } from '@/components/ui/Typography';
import { Tag } from '@/components/ui/Tag';
import { Icon } from '@/components/ui/Icon';
import {
  DIFFICULTY_LABEL,
  DIFFICULTY_TONE,
  STATUS_COLOR,
  STATUS_ICON,
  STATUS_LABEL,
  STATUS_TONE,
} from './dsaMeta';
import { colors } from '@/theme/tokens';
import type { Problem } from '@/types/models';

export type ProblemRowProps = {
  problem: Problem;
  onPress?: () => void;
  index?: number;
};

/**
 * A problem list row: an inset status-icon medallion, title + bookmark, a
 * difficulty + status mastery tag pair, a source label and a chevron. Every
 * glyph is rendered through the Icon system (no emoji).
 */
export function ProblemRow({ problem, onPress }: ProblemRowProps) {
  const statusColor = STATUS_COLOR[problem.status];

  return (
    <Pressable onPress={onPress}>
      <SoftCard radius={22} intensity="sm" padding={14}>
        <View className="flex-row items-center" style={{ gap: 12 }}>
          {/* Status medallion */}
          <Neumorph variant="inset" radius={14} intensity="sm">
            <View
              style={{
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon
                name={STATUS_ICON[problem.status]}
                size={20}
                color={statusColor}
                strokeWidth={2.2}
              />
            </View>
          </Neumorph>

          <View style={{ flex: 1 }}>
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <AppText
                variant="body"
                weight="semibold"
                numberOfLines={1}
                style={{ flexShrink: 1 }}
              >
                {problem.title}
              </AppText>
              {problem.bookmarked ? (
                <Icon name="bookmark" size={15} color="highlighter" fill="highlighter" />
              ) : null}
            </View>

            <View className="flex-row items-center" style={{ gap: 6, marginTop: 7 }}>
              <Tag
                label={DIFFICULTY_LABEL[problem.difficulty]}
                tone={DIFFICULTY_TONE[problem.difficulty]}
                size="sm"
              />
              <Tag label={STATUS_LABEL[problem.status]} tone={STATUS_TONE[problem.status]} size="sm" />
              {problem.source ? (
                <AppText variant="caption" color={colors.textSubtle} style={{ fontSize: 11 }}>
                  {problem.source}
                </AppText>
              ) : null}
            </View>
          </View>

          <Icon name="chevron-right" size={18} color="textSubtle" />
        </View>
      </SoftCard>
    </Pressable>
  );
}

export default ProblemRow;
