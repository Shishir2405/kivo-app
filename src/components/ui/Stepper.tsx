import React, { useState } from 'react';
import { Pressable, View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';
import { Neumorph } from './Neumorph';
import { Icon } from './Icon';
import { fonts } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

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
  const { colors } = useTheme();
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
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <Neumorph variant={pressed ? 'inset' : 'raised'} radius={SIZE / 2}>
        <View
          style={{
            width: SIZE,
            height: SIZE,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={20} color={colors.primary} weight="bold" />
        </View>
      </Neumorph>
    </Pressable>
  );
}

/**
 * A compact +/- numeric stepper for goals and counts. The value sits in a
 * central well and pops on every change. Clamps to [min, max]. Theme-aware.
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
  const { colors } = useTheme();
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
                  fontFamily: fonts.serifSemibold,
                  fontSize: 22,
                  color: colors.ink,
                }}
              >
                {value}
              </Text>
            </MotiView>
          </AnimatePresence>
          {suffix ? (
            <Text
              style={{
                fontFamily: fonts.sansMedium,
                fontSize: 13,
                color: colors.muted,
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
