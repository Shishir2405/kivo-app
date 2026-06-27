/**
 * MilestoneRow — one rung on the streak ladder (Steep).
 *
 * Cleared rungs show a small wash glyph chip, the requirement and the unlock
 * date. Pending rungs show an inset chip, a thin Ink progress meter and the
 * remaining-days countdown. Flat, hairline-divided, with one wash per rung.
 * Theme-aware (light/dark) via useTheme().
 */
import React from 'react';
import { View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';
import { AppText } from '@/components/ui/Typography';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

import { type Accent, useAccentMaps } from './accents';

export type MilestoneRowProps = {
  icon: IconName;
  title: string;
  requirement: string;
  threshold: number;
  /** The user's current best streak (drives unlock + progress). */
  bestStreak: number;
  tone: Accent;
  /** Pretty unlock date label when cleared. */
  unlockedLabel?: string;
  last?: boolean;
  index: number;
};

export function MilestoneRow({
  icon,
  title,
  requirement,
  threshold,
  bestStreak,
  tone,
  unlockedLabel,
  last,
}: MilestoneRowProps) {
  const { colors } = useTheme();
  const maps = useAccentMaps();
  const cleared = bestStreak >= threshold;
  const pct = Math.max(0, Math.min(100, Math.round((bestStreak / threshold) * 100)));
  const remaining = Math.max(0, threshold - bestStreak);
  const wash = maps.wash[tone];
  const ink = maps.ink[tone];
  const washBorder = maps.border[tone];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.hairline,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 9999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: cleared ? wash : colors.surfaceAlt,
          borderWidth: 1,
          borderColor: cleared ? washBorder : colors.hairline,
        }}
      >
        <Icon name={icon} size={16} color={cleared ? ink : colors.muted} weight="light" />
      </View>

      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <AppText
            variant="subheading"
            weight="medium"
            color={cleared ? colors.ink : colors.ash}
            numberOfLines={1}
          >
            {title}
          </AppText>
          {cleared ? <Icon name="check" size={13} color={ink} weight="light" /> : null}
        </View>

        {cleared ? (
          <AppText variant="caption" color={colors.muted}>
            {requirement}
          </AppText>
        ) : (
          <>
            <View
              style={{
                height: 4,
                borderRadius: 9999,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.hairline,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  borderRadius: 9999,
                  backgroundColor: colors.ink,
                }}
              />
            </View>
            <AppText variant="caption" color={colors.muted}>
              {requirement} · {remaining} day{remaining === 1 ? '' : 's'} to go
            </AppText>
          </>
        )}
      </View>

      {cleared && unlockedLabel ? (
        <AppText variant="caption" color={colors.muted}>
          {unlockedLabel}
        </AppText>
      ) : !cleared ? (
        <Icon name="lock" size={15} color={colors.muted} weight="light" />
      ) : null}
    </View>
  );
}

export default MilestoneRow;
