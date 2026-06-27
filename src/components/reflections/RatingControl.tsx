/**
 * RatingControl — a 1–5 self-rating control for the reflections form (STEEP).
 *
 * NOT a radio group. Five flat segments sit in a row; the selected value and
 * everything below it fill Ink (a "fill-up" gauge) on a Fog track with a Dove
 * hairline. Tapping any segment sets the rating. Small, flat, no neumorphism.
 */
import React from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors, pressOpacity } from '@/theme/tokens';
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
  return (
    <View style={{ opacity: disabled ? 0.5 : 1 }}>
      {/* Label row */}
      <View className="flex-row items-center justify-between" style={{ marginBottom: 10 }}>
        <View className="flex-row items-center" style={{ gap: 7 }}>
          <Icon name={icon} size={16} color="graphite" />
          <AppText variant="subheading" weight="medium">
            {label}
          </AppText>
        </View>
        <View className="flex-row items-baseline" style={{ gap: 5 }}>
          <AppText variant="subheading" weight="medium" color={colors.ink}>
            {value}
          </AppText>
          <AppText variant="caption" color={colors.graphite}>
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
          backgroundColor: colors.fog,
          borderWidth: 1,
          borderColor: colors.dove,
        }}
      >
        {VALUES.map((v) => {
          const filled = v <= value;
          return (
            <Pressable
              key={v}
              disabled={disabled}
              onPress={() => onChange(v)}
              accessibilityRole="adjustable"
              accessibilityLabel={`${label} ${v} of 5`}
              accessibilityState={{ selected: v === value }}
              style={({ pressed }) => ({ flex: 1, opacity: pressOpacity({ pressed }, { disabled }) })}
              hitSlop={6}
            >
              <View
                style={{
                  height: 32,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: filled ? colors.ink : colors.white,
                  borderWidth: filled ? 0 : 1,
                  borderColor: colors.dove,
                }}
              >
                <AppText
                  variant="body"
                  weight="medium"
                  color={filled ? colors.white : colors.graphite}
                >
                  {v}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default RatingControl;
