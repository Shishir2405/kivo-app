/**
 * BadgeTile — one badge in the achievements grid (Steep).
 *
 * Earned → a flat wash card (hairline + the one subtle shadow) with a small
 * wash medallion, the title, and an XP/date line. Locked → a quiet inset well
 * with a monochrome glyph, a thin Ink progress meter and the remaining
 * percentage. Flat, compact, with a single wash voice per badge. Theme-aware
 * (light/dark) via useTheme(); enters with a small staggered fade-up.
 */
import React from 'react';
import { Pressable, View } from 'react-native';
import { MotiView } from 'moti';

import { Card } from '@/components/ui/SoftCard';
import { Icon, type IconName } from '@/components/ui/Icon';
import { AppText } from '@/components/ui/Typography';
import { useTheme, motion } from '@/theme';
import { spacing, interaction } from '@/theme/tokens';

import { type Accent, resolveAccent, useAccentMaps } from './accents';

export type BadgeTileProps = {
  title: string;
  description: string;
  icon: IconName;
  xp: number;
  tone: Accent;
  unlocked: boolean;
  /** 0–100 progress toward unlocking (only shown when locked). */
  progress: number;
  /** Pretty unlock date label, e.g. "Jan 14". */
  unlockedLabel?: string;
  index: number;
  onPress?: () => void;
};

export function BadgeTile({
  title,
  description,
  icon,
  xp,
  tone,
  unlocked,
  progress,
  unlockedLabel,
  index,
  onPress,
}: BadgeTileProps) {
  const { colors } = useTheme();
  const maps = useAccentMaps();
  const ink = maps.ink[tone];
  const washBorder = maps.border[tone];
  const cardTone = resolveAccent(tone);
  const pct = Math.max(0, Math.min(100, progress));

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: motion.duration.transition,
        delay: Math.min(index, 8) * 45,
      }}
      style={{ width: '47.5%', flexGrow: 1 }}
    >
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole="button"
        accessibilityLabel={`${title}${unlocked ? ', unlocked' : ', locked'}`}
        style={({ pressed }) =>
          onPress && pressed
            ? { opacity: interaction.pressOpacitySolid, transform: [{ scale: interaction.pressScale }] }
            : null
        }
      >
        <Card
          variant={unlocked ? 'raised' : 'inset'}
          tone={unlocked ? cardTone : 'default'}
          radius={18}
          padding={spacing.lg}
          style={{ minHeight: 150 }}
        >
          {/* Medallion + status */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 9999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: unlocked ? washBorder : colors.hairline,
              }}
            >
              <Icon
                name={icon}
                size={18}
                color={unlocked ? ink : colors.muted}
                weight="light"
              />
            </View>
            <Icon
              name={unlocked ? 'badge-check' : 'lock'}
              size={15}
              color={unlocked ? ink : colors.muted}
              weight="light"
            />
          </View>

          {/* Title + description */}
          <View style={{ marginTop: spacing.md, flex: 1 }}>
            <AppText
              variant="subheading"
              weight="medium"
              numberOfLines={1}
              color={unlocked ? colors.ink : colors.ash}
            >
              {title}
            </AppText>
            <AppText
              variant="caption"
              color={colors.muted}
              numberOfLines={2}
              style={{ marginTop: 2 }}
            >
              {description}
            </AppText>
          </View>

          {/* Footer */}
          {unlocked ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginTop: spacing.md,
              }}
            >
              <AppText variant="caption" weight="medium" color={ink}>
                +{xp} XP
              </AppText>
              {unlockedLabel ? (
                <AppText variant="caption" color={colors.ash}>
                  {unlockedLabel}
                </AppText>
              ) : null}
            </View>
          ) : (
            <View style={{ marginTop: spacing.md, gap: 6 }}>
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="caption" color={colors.muted}>
                  {pct}%
                </AppText>
                <AppText variant="caption" color={colors.muted}>
                  +{xp} XP
                </AppText>
              </View>
            </View>
          )}
        </Card>
      </Pressable>
    </MotiView>
  );
}

export default BadgeTile;
