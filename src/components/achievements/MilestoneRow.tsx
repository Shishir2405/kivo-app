import React from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';

import { Neumorph } from '@/components/ui/Neumorph';
import { Icon, type IconName } from '@/components/ui/Icon';
import { AppText } from '@/components/ui/Typography';
import { colors } from '@/theme/tokens';

import { type Accent, ACCENT_INK, ACCENT_WASH, onAccentInk } from './accents';

export type MilestoneRowProps = {
  /** Milestone glyph. */
  icon: IconName;
  title: string;
  /** Requirement label, e.g. "7-day streak". */
  requirement: string;
  /** Day threshold to clear this milestone. */
  threshold: number;
  /** The user's current best streak (drives unlock + progress). */
  bestStreak: number;
  tone: Accent;
  /** Pretty unlock date label when cleared, e.g. "Sep 8". */
  unlockedLabel?: string;
  /** Render without the bottom hairline (last row). */
  last?: boolean;
  /** Stagger index. */
  index: number;
};

/**
 * One milestone row on the streak ladder (First Week → One Year).
 *
 * Cleared milestones show a full-color glyph chip, the unlock date, and a small
 * accent "done" pip. Pending milestones show a desaturated chip plus a thin
 * progress meter and the remaining-days countdown — so the ladder reads as a
 * clear, motivating sequence rather than a flat list.
 */
export function MilestoneRow({
  icon,
  title,
  requirement,
  threshold,
  bestStreak,
  tone,
  unlockedLabel,
  last,
  index,
}: MilestoneRowProps) {
  const cleared = bestStreak >= threshold;
  const pct = Math.max(0, Math.min(100, Math.round((bestStreak / threshold) * 100)));
  const remaining = Math.max(0, threshold - bestStreak);

  const ink = ACCENT_INK[tone];
  const wash = ACCENT_WASH[tone];

  return (
    <MotiView
      from={{ opacity: 0, translateX: -12 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 320, delay: 80 + index * 70 }}
    >
      <View
        className="flex-row items-center"
        style={{
          gap: 14,
          paddingVertical: 14,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: colors.hairline,
        }}
      >
        {/* Glyph chip */}
        <Neumorph variant={cleared ? 'raised' : 'inset'} radius={15} intensity="sm">
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 15,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: cleared ? wash : '#e4e4e4',
            }}
          >
            <Icon
              name={icon}
              size={21}
              color={cleared ? ink : colors.textSubtle}
              strokeWidth={2.2}
            />
          </View>
        </Neumorph>

        {/* Label + meta */}
        <View style={{ flex: 1, gap: 5 }}>
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <AppText
              variant="body"
              weight="bold"
              color={cleared ? colors.carbon : colors.textMuted}
              numberOfLines={1}
            >
              {title}
            </AppText>
            {cleared ? (
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: ink,
                }}
              >
                <Icon name="check" size={11} color={onAccentInk(tone)} strokeWidth={3} />
              </View>
            ) : null}
          </View>

          {cleared ? (
            <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 12 }}>
              {requirement}
            </AppText>
          ) : (
            <>
              {/* thin progress meter for pending milestones */}
              <View
                style={{
                  height: 5,
                  borderRadius: 999,
                  backgroundColor: '#dcdcdc',
                  overflow: 'hidden',
                  marginTop: 1,
                }}
              >
                <MotiView
                  from={{ width: '0%' }}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: 'timing', duration: 600, delay: 160 + index * 70 }}
                  style={{ height: 5, borderRadius: 999, backgroundColor: colors.textSubtle }}
                />
              </View>
              <AppText variant="caption" color={colors.textSubtle} style={{ fontSize: 11 }}>
                {requirement} · {remaining} day{remaining === 1 ? '' : 's'} to go
              </AppText>
            </>
          )}
        </View>

        {/* Trailing date / lock */}
        {cleared ? (
          <View className="items-end" style={{ gap: 2 }}>
            <Icon name="calendar-check" size={15} color={tone} strokeWidth={2.2} />
            {unlockedLabel ? (
              <AppText variant="caption" color={colors.textSubtle} style={{ fontSize: 11 }}>
                {unlockedLabel}
              </AppText>
            ) : null}
          </View>
        ) : (
          <Icon name="lock" size={16} color="textSubtle" strokeWidth={2.2} />
        )}
      </View>
    </MotiView>
  );
}

export default MilestoneRow;
