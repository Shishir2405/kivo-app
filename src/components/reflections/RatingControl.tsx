/**
 * RatingControl — a 1–5 self-rating control for the reflections form.
 *
 * NOT a radio group. Five neumorphic pips sit in one inset well; the selected
 * value and everything below it fill highlighter-yellow (a "fill-up" gauge),
 * with the active pip springing slightly larger. Tapping any pip sets the
 * rating. Reads as a tactile soft-UI gauge, consistent with the kit.
 */
import React from 'react';
import { Pressable, View } from 'react-native';
import { MotiView } from 'moti';

import { Neumorph } from '@/components/ui/Neumorph';
import { AppText } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors } from '@/theme/tokens';
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
      <View
        className="flex-row items-center justify-between"
        style={{ marginBottom: 10 }}
      >
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <Icon name={icon} size={16} color="carbon" strokeWidth={2.2} />
          <AppText variant="body" weight="semibold">
            {label}
          </AppText>
        </View>
        <View className="flex-row items-center" style={{ gap: 6 }}>
          <AppText variant="subheading" display weight="bold">
            {value}
          </AppText>
          <AppText
            variant="caption"
            color={colors.textMuted}
            style={{ fontSize: 12 }}
          >
            / 5 · {captions[value - 1]}
          </AppText>
        </View>
      </View>

      {/* Pip well */}
      <Neumorph variant="inset" radius={18}>
        <View
          className="flex-row items-center"
          style={{ padding: 8, gap: 8 }}
        >
          {VALUES.map((v) => {
            const filled = v <= value;
            const active = v === value;
            return (
              <Pressable
                key={v}
                disabled={disabled}
                onPress={() => onChange(v)}
                accessibilityRole="adjustable"
                accessibilityLabel={`${label} ${v} of 5`}
                accessibilityState={{ selected: active }}
                style={{ flex: 1 }}
                hitSlop={6}
              >
                <MotiView
                  animate={{ scale: active ? 1.06 : 1 }}
                  transition={{ type: 'spring', damping: 16, stiffness: 220 }}
                >
                  <View
                    style={{
                      height: 38,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: filled
                        ? colors.highlighter
                        : '#e0e0e0',
                    }}
                  >
                    <AppText
                      variant="caption"
                      weight={active ? 'bold' : 'medium'}
                      color={filled ? colors.carbon : colors.textSubtle}
                      style={{ fontSize: 14 }}
                    >
                      {v}
                    </AppText>
                  </View>
                </MotiView>
              </Pressable>
            );
          })}
        </View>
      </Neumorph>
    </View>
  );
}

export default RatingControl;
