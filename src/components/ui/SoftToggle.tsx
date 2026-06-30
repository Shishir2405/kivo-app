import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { MotiView } from 'moti';
import { motion } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

export type SoftToggleProps = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
};

/**
 * Kivo switch — minimal & flat (the HTML toggle). The track is TERRACOTTA when
 * on, a hairline-bordered surface when off; a white thumb springs across. One
 * soft thumb shadow, theme-aware.
 */
export function SoftToggle({ value, onValueChange, disabled }: SoftToggleProps) {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);
  const W = 44;
  const H = 26;
  const KNOB = 21;
  const travel = W - KNOB - 4;

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      hitSlop={6}
      style={{ opacity: disabled ? 0.45 : pressed ? 0.7 : 1 }}
    >
      <View
        style={{
          width: W,
          height: H,
          borderRadius: H / 2,
          justifyContent: 'center',
          backgroundColor: value ? colors.primary : colors.surfaceAlt,
          borderWidth: 1,
          borderColor: value ? colors.primary : colors.hairline,
        }}
      >
        <MotiView
          animate={{ translateX: value ? travel : 2 }}
          transition={motion.springSnappy}
          style={{
            width: KNOB,
            height: KNOB,
            borderRadius: KNOB / 2,
            backgroundColor: '#FFFFFF',
            // Faint outline so the white knob stays visible on the light OFF
            // track (surfaceAlt); harmless on the terracotta ON track.
            borderWidth: 1,
            borderColor: value ? 'transparent' : 'rgba(33,28,23,0.12)',
            shadowColor: colors.shadowTint,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 2,
          }}
        />
      </View>
    </Pressable>
  );
}

export default SoftToggle;
