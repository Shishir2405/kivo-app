/**
 * RatingControl — a 1–5 self-rating control for the reflections form (Kivo).
 *
 * NOT a radio group. Five flat segments sit in a row; the selected value (and
 * everything below it) fills terracotta — a calm "fill-up" gauge — on a quiet
 * track with a hairline. Tapping any segment sets the rating with a snappy
 * spring. Fully theme-aware (light / dark) via useTheme().
 */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { motion, pressOpacity } from '@/theme/tokens';
import { useTheme } from '@/theme';
import type { Rating } from '@/types/models';

export type { Rating };

export type RatingControlProps = {
  /** Field label, e.g. "Focus". */
  label: string;
  /** Leading glyph for the label row. */
  icon: IconName;
  value: Rating;
  onChange: (next: Rating) => void;
  /** Short qualitative captions for 1..5 (index 0 = rating 1). */
  captions?: [string, string, string, string, string];
  disabled?: boolean;
};

const VALUES: Rating[] = [1, 2, 3, 4, 5];

const DEFAULT_CAPTIONS: [string, string, string, string, string] = [
  'Very low',
  'Low',
  'Okay',
  'Good',
  'Excellent',
];

export function RatingControl({
  label,
  icon,
  value,
  onChange,
  captions = DEFAULT_CAPTIONS,
  disabled,
}: RatingControlProps) {
  const { colors } = useTheme();
  const [pressedValue, setPressedValue] = useState<Rating | null>(null);
  return (
    <View style={{ opacity: disabled ? 0.5 : 1 }}>
      {/* Label row */}
      <View className="flex-row items-center justify-between" style={{ marginBottom: 10 }}>
        <View className="flex-row items-center" style={{ gap: 7 }}>
          <Icon name={icon} size={16} color={colors.muted} />
          <AppText variant="subheading" weight="medium" color={colors.ink}>
            {label}
          </AppText>
        </View>
        <View className="flex-row items-baseline" style={{ gap: 5 }}>
          <AppText variant="subheading" weight="medium" color={colors.primaryOnWash}>
            {value}
          </AppText>
          <AppText variant="caption" color={colors.muted}>
            / 5 · {captions[value - 1]}
          </AppText>
        </View>
      </View>

      {/* Segment track */}
      <View
        className="flex-row items-center"
        style={{
          gap: 6,
          padding: 4,
          borderRadius: 12,
          backgroundColor: colors.surfaceAlt,
          borderWidth: 1,
          borderColor: colors.hairline,
        }}
      >
        {VALUES.map((v) => {
          const filled = v <= value;
          const pressed = pressedValue === v;
          return (
            <Pressable
              key={v}
              disabled={disabled}
              onPress={() => onChange(v)}
              onPressIn={() => setPressedValue(v)}
              onPressOut={() => setPressedValue(null)}
              accessibilityRole="adjustable"
              accessibilityLabel={`${label} ${v} of 5`}
              accessibilityState={{ selected: v === value }}
              style={{ flex: 1, opacity: pressOpacity({ pressed }, { disabled }) }}
              hitSlop={6}
            >
              <MotiView
                animate={{
                  backgroundColor: filled ? colors.primary : colors.surface,
                }}
                transition={{ type: 'timing', duration: motion.duration.micro }}
                style={{
                  height: 38,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: filled ? 0 : 1,
                  borderColor: colors.hairline,
                }}
              >
                <AppText
                  variant="body"
                  weight={filled ? 'bold' : 'medium'}
                  color={filled ? colors.onPrimary : colors.muted}
                >
                  {v}
                </AppText>
              </MotiView>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default RatingControl;
