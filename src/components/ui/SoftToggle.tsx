import React from 'react';
import { Pressable, View } from 'react-native';
import { MotiView } from 'moti';
import { Neumorph } from './Neumorph';
import { colors } from '@/theme/tokens';

export type SoftToggleProps = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
};

/**
 * A neumorphic switch. The track is an inset well; the thumb is a raised knob
 * that slides and the track tints highlighter-yellow when on.
 */
export function SoftToggle({ value, onValueChange, disabled }: SoftToggleProps) {
  const W = 56;
  const H = 32;
  const KNOB = 24;
  const travel = W - KNOB - 4;

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Neumorph variant="inset" radius={H / 2}>
        <View
          style={{
            width: W,
            height: H,
            borderRadius: H / 2,
            justifyContent: 'center',
            backgroundColor: value ? colors.highlighter : '#e9e9e9',
          }}
        >
          <MotiView
            animate={{ translateX: value ? travel : 2 }}
            transition={{ type: 'timing', duration: 180 }}
            style={{
              width: KNOB,
              height: KNOB,
              borderRadius: KNOB / 2,
              backgroundColor: colors.paper,
              marginLeft: 2,
              // single soft shadow on the knob
              shadowColor: 'rgba(0,0,0,0.25)',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 1,
              shadowRadius: 3,
              elevation: 3,
            }}
          />
        </View>
      </Neumorph>
    </Pressable>
  );
}

export default SoftToggle;
