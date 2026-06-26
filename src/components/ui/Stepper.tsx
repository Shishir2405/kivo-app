import React, { useState } from 'react';
import { Pressable, View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';
import { Neumorph } from './Neumorph';
import { Icon } from './Icon';
import { colors, fonts } from '@/theme/tokens';

export type StepperProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Optional unit suffix rendered after the value (e.g. "min", "x"). */
  suffix?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

type StepButtonProps = {
  icon: 'plus' | 'minus';
  onPress: () => void;
  disabled?: boolean;
};

function StepButton({ icon, onPress, disabled }: StepButtonProps) {
  const [pressed, setPressed] = useState(false);
  const SIZE = 40;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={icon === 'plus' ? 'Increase' : 'Decrease'}
      style={{ opacity: disabled ? 0.35 : 1 }}
    >
      <Neumorph variant={pressed ? 'inset' : 'raised'} radius={SIZE / 2} intensity="sm">
        <View
          style={{
            width: SIZE,
            height: SIZE,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={20} color="carbon" strokeWidth={2.6} />
        </View>
      </Neumorph>
    </Pressable>
  );
}

/**
 * A compact +/- neumorphic numeric stepper for goals and counts.
 *
 * The two round buttons are raised neumorphic icon buttons that depress on
 * press; the value sits in a central inset well and animates a subtle
 * pop on every change. Clamps to [min, max].
 */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  suffix,
  disabled,
  style,
}: StepperProps) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));

  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: 14, alignSelf: 'flex-start' },
        style,
      ]}
    >
      <StepButton icon="minus" onPress={dec} disabled={disabled || value <= min} />

      <Neumorph variant="inset" radius={14}>
        <View
          style={{
            minWidth: 72,
            height: 48,
            paddingHorizontal: 14,
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: 4,
            borderRadius: 14,
          }}
        >
          <AnimatePresence exitBeforeEnter>
            <MotiView
              key={value}
              from={{ opacity: 0, translateY: 6 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -6 }}
              transition={{ type: 'timing', duration: 140 }}
            >
              <Text
                style={{
                  fontFamily: fonts.displaySemibold,
                  fontSize: 20,
                  color: colors.carbon,
                }}
              >
                {value}
              </Text>
            </MotiView>
          </AnimatePresence>
          {suffix ? (
            <Text
              style={{
                fontFamily: fonts.bodyMedium,
                fontSize: 13,
                color: colors.textMuted,
              }}
            >
              {suffix}
            </Text>
          ) : null}
        </View>
      </Neumorph>

      <StepButton icon="plus" onPress={inc} disabled={disabled || value >= max} />
    </View>
  );
}

export default Stepper;
