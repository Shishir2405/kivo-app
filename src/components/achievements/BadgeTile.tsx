/**
 * BadgeTile — one badge in the achievements grid (Steep).
 *
 * Earned → a flat white card (hairline + the one subtle shadow) with a small
 * wash medallion, the title, and an XP/date line. Locked → a quiet Fog well
 * with a monochrome glyph, a thin Ink progress meter and the remaining
 * percentage. Flat, compact, monochrome with a single wash voice per badge.
 */
import React from 'react';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/ui/SoftCard';
import { Icon, type IconName } from '@/components/ui/Icon';
import { AppText } from '@/components/ui/Typography';
import { colors, spacing, interaction } from '@/theme/tokens';

import { type Accent, ACCENT_INK, ACCENT_WASH } from './accents';

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
  onPress,
}: BadgeTileProps) {
  const wash = ACCENT_WASH[tone];
  const ink = ACCENT_INK[tone];
  const pct = Math.max(0, Math.min(100, progress));

  return (
    <View style={{ width: '47.5%', flexGrow: 1 }}>
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
                backgroundColor: unlocked ? wash : colors.white,
                borderWidth: 1,
                borderColor: unlocked ? 'transparent' : colors.dove,
              }}
            >
              <Icon
                name={icon}
                size={18}
                color={unlocked ? ink : colors.dove}
                weight="light"
              />
            </View>
            <Icon
              name={unlocked ? 'badge-check' : 'lock'}
              size={15}
              color={unlocked ? 'ink' : 'dove'}
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
              color={colors.graphite}
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
              <AppText variant="caption" weight="medium" color={colors.ink}>
                +{xp} XP
              </AppText>
              {unlockedLabel ? (
                <AppText variant="caption" color={colors.graphite}>
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
                  backgroundColor: colors.white,
                  borderWidth: 1,
                  borderColor: colors.dove,
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
                <AppText variant="caption" color={colors.graphite}>
                  {pct}%
                </AppText>
                <AppText variant="caption" color={colors.graphite}>
                  +{xp} XP
                </AppText>
              </View>
            </View>
          )}
        </Card>
      </Pressable>
    </View>
  );
}

export default BadgeTile;
