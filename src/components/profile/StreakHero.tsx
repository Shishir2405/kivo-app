import React from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';
import { Neumorph } from '@/components/ui/Neumorph';
import { Icon } from '@/components/ui/Icon';
import { AppText } from '@/components/ui/Typography';
import { colors } from '@/theme/tokens';

export type StreakHeroProps = {
  /** Current consecutive-day streak. */
  streak: number;
  /** All-time best streak. */
  longestStreak: number;
};

/**
 * The streak summary band. A raised highlighter-yellow flame chip (vector, no
 * emoji) with a gentle breathing pulse, the live count and an encouraging line,
 * and an inset "best" well on the right. Pure soft-UI on the gray canvas.
 */
export function StreakHero({ streak, longestStreak }: StreakHeroProps) {
  const atBest = streak >= longestStreak;

  return (
    <View className="flex-row items-center justify-between" style={{ gap: 14 }}>
      <View className="flex-row items-center" style={{ gap: 14, flex: 1 }}>
        <Neumorph variant="raised" radius={18} intensity="sm">
          <MotiView
            from={{ scale: 0.94 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'timing',
              duration: 1400,
              loop: true,
              repeatReverse: true,
            }}
            style={{
              width: 54,
              height: 54,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.highlighter,
            }}
          >
            <Icon name="flame" size={26} color="carbon" strokeWidth={2.2} />
          </MotiView>
        </Neumorph>

        <View style={{ flex: 1 }}>
          <View className="flex-row items-baseline" style={{ gap: 5 }}>
            <AppText variant="headingSm" weight="bold" display>
              {streak}
            </AppText>
            <AppText variant="body" weight="semibold" color={colors.textMuted}>
              day streak
            </AppText>
          </View>
          <AppText
            variant="caption"
            color={colors.textMuted}
            style={{ marginTop: 2, fontSize: 12 }}
          >
            {atBest ? 'New personal best — keep it lit' : 'On a roll — stay consistent'}
          </AppText>
        </View>
      </View>

      <Neumorph variant="inset" radius={16} intensity="sm" padding={12}>
        <View className="items-center">
          <View className="flex-row items-center" style={{ gap: 4 }}>
            <Icon name="trophy" size={13} color="textMuted" strokeWidth={2.2} />
            <AppText
              variant="caption"
              color={colors.textSubtle}
              style={{ fontSize: 10 }}
            >
              best
            </AppText>
          </View>
          <AppText variant="subheading" weight="bold" display style={{ marginTop: 2 }}>
            {longestStreak}
          </AppText>
        </View>
      </Neumorph>
    </View>
  );
}

export default StreakHero;
