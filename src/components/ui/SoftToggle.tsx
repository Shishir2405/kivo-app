import React from 'react';
import { Pressable, View } from 'react-native';
import { MotiView } from 'moti';
import { colors } from '@/theme/tokens';

export type SoftToggleProps = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
};

/**
 * Steep switch — minimal & flat. The track is Ink when on, Dove-on-Fog when
 * off; a small white thumb slides. No neumorphism, single soft thumb shadow.
 */
export function SoftToggle({ value, onValueChange, disabled }: SoftToggleProps) {
  const W = 44;
  const H = 26;
  const KNOB = 20;
  const travel = W - KNOB - 6;

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      hitSlop={6}
      style={({ pressed }) => ({ opacity: disabled ? 0.4 : pressed ? 0.7 : 1 })}
    >
      <View
        style={{
          width: W,
          height: H,
          borderRadius: H / 2,
          justifyContent: 'center',
          backgroundColor: value ? colors.ink : colors.fog,
          borderWidth: 1,
          borderColor: value ? colors.ink : colors.dove,
        }}
      >
        <MotiView
          animate={{ translateX: value ? travel : 3 }}
          transition={{ type: 'timing', duration: 160 }}
          style={{
            width: KNOB,
            height: KNOB,
            borderRadius: KNOB / 2,
            backgroundColor: colors.white,
            shadowColor: '#17191c',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.15,
            shadowRadius: 2,
            elevation: 2,
          }}
        />
      </View>
    </Pressable>
  );
}

export default SoftToggle;
