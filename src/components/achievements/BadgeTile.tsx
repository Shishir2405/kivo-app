import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { MotiView } from 'moti';

import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { Icon, type IconName } from '@/components/ui/Icon';
import { AppText } from '@/components/ui/Typography';
import { colors } from '@/theme/tokens';

import {
  type Accent,
  ACCENT_INK,
  ACCENT_WASH,
  onAccentInk,
} from './accents';

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
  /** Stagger index for the mount animation. */
  index: number;
  onPress?: () => void;
};

/** Format the XP reward as "+50 XP". */
function xpLabel(xp: number): string {
  return `+${xp} XP`;
}

/**
 * One badge in the achievements grid.
 *
 * Earned → a raised card with a full-color accent medallion that springs in and
 * carries a soft glow ring, a check seal, the title, and an XP/date footer.
 * Locked → a recessed, desaturated card with a grayscale glyph, a lock seal,
 * a muted progress bar and the remaining-progress percentage. The two states
 * are deliberately distinct so earned badges feel rewarding to look at.
 */
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
  const [pressed, setPressed] = useState(false);

  const ink = ACCENT_INK[tone];
  const wash = ACCENT_WASH[tone];
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14, scale: 0.94 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{
        type: 'spring',
        damping: 16,
        stiffness: 180,
        delay: 80 + index * 55,
      }}
      style={{ width: '47.5%', flexGrow: 1 }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        accessibilityRole="button"
        accessibilityLabel={`${title}${unlocked ? ', unlocked' : ', locked'}`}
      >
        <SoftCard
          variant={unlocked ? (pressed ? 'inset' : 'raised') : 'inset'}
          radius={26}
          intensity="md"
          padding={16}
          surface={unlocked ? colors.canvas : '#ededed'}
          style={{ minHeight: 168 }}
        >
          {/* ---------- Medallion + seal ---------- */}
          <View className="flex-row items-start justify-between">
            <View>
              {/* Soft glow ring behind the medallion (earned only). */}
              {unlocked ? (
                <MotiView
                  from={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    type: 'timing',
                    duration: 420,
                    delay: 160 + index * 55,
                  }}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: -6,
                    left: -6,
                    right: -6,
                    bottom: -6,
                    borderRadius: 22,
                    backgroundColor: wash,
                    opacity: 0.55,
                  }}
                />
              ) : null}

              <Neumorph
                variant={unlocked ? 'raised' : 'inset'}
                radius={16}
                intensity="sm"
              >
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: unlocked ? wash : '#e4e4e4',
                  }}
                >
                  <Icon
                    name={icon}
                    size={23}
                    color={unlocked ? ink : colors.textSubtle}
                    strokeWidth={2.2}
                  />
                </View>
              </Neumorph>
            </View>

            {/* Status seal: a check medal for earned, a lock for locked. */}
            {unlocked ? (
              <MotiView
                from={{ opacity: 0, scale: 0.4, rotate: '-30deg' }}
                animate={{ opacity: 1, scale: 1, rotate: '0deg' }}
                transition={{
                  type: 'spring',
                  damping: 12,
                  stiffness: 220,
                  delay: 240 + index * 55,
                }}
              >
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: ink,
                  }}
                >
                  <Icon
                    name="check"
                    size={15}
                    color={onAccentInk(tone)}
                    strokeWidth={3}
                  />
                </View>
              </MotiView>
            ) : (
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#e0e0e0',
                }}
              >
                <Icon name="lock" size={13} color="textSubtle" strokeWidth={2.4} />
              </View>
            )}
          </View>

          {/* ---------- Title + description ---------- */}
          <View style={{ marginTop: 14, flex: 1 }}>
            <AppText
              variant="body"
              weight="bold"
              numberOfLines={1}
              color={unlocked ? colors.carbon : colors.textMuted}
            >
              {title}
            </AppText>
            <AppText
              variant="caption"
              color={unlocked ? colors.textMuted : colors.textSubtle}
              numberOfLines={2}
              style={{ marginTop: 3, fontSize: 12, lineHeight: 16 }}
            >
              {description}
            </AppText>
          </View>

          {/* ---------- Footer: XP + date, or locked progress ---------- */}
          {unlocked ? (
            <View
              className="flex-row items-center justify-between"
              style={{ marginTop: 12 }}
            >
              <View className="flex-row items-center" style={{ gap: 4 }}>
                <Icon name="zap" size={12} color={tone} strokeWidth={2.4} />
                <AppText variant="caption" weight="bold" color={ink} style={{ fontSize: 12 }}>
                  {xpLabel(xp)}
                </AppText>
              </View>
              {unlockedLabel ? (
                <AppText
                  variant="caption"
                  color={colors.textSubtle}
                  style={{ fontSize: 11 }}
                >
                  {unlockedLabel}
                </AppText>
              ) : null}
            </View>
          ) : (
            <View style={{ marginTop: 12, gap: 6 }}>
              {/* Muted inset progress track. */}
              <View
                style={{
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: '#dcdcdc',
                  overflow: 'hidden',
                }}
              >
                <MotiView
                  from={{ width: '0%' }}
                  animate={{ width: `${clampedProgress}%` }}
                  transition={{
                    type: 'timing',
                    duration: 600,
                    delay: 200 + index * 55,
                  }}
                  style={{
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: colors.textSubtle,
                  }}
                />
              </View>
              <View className="flex-row items-center justify-between">
                <AppText
                  variant="caption"
                  color={colors.textSubtle}
                  style={{ fontSize: 11 }}
                >
                  {clampedProgress}% there
                </AppText>
                <AppText
                  variant="caption"
                  weight="medium"
                  color={colors.textMuted}
                  style={{ fontSize: 11 }}
                >
                  {xpLabel(xp)}
                </AppText>
              </View>
            </View>
          )}
        </SoftCard>
      </Pressable>
    </MotiView>
  );
}

export default BadgeTile;
