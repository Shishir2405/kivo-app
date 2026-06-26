import React from 'react';
import { Pressable, View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import { Neumorph } from './Neumorph';
import { Icon } from './Icon';
import { colors, fonts } from '@/theme/tokens';

export type CheckboxProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Optional trailing label. */
  label?: string;
  disabled?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Custom neumorphic checkbox — never a native control.
 *
 * Unchecked: a small raised neumorphic tile. Checked: the tile presses in
 * (inset well) and a highlighter-yellow check Icon springs in. The whole row
 * is the press target when a label is provided.
 */
export function Checkbox({
  checked,
  onChange,
  label,
  disabled,
  size = 26,
  style,
}: CheckboxProps) {
  const box = (
    <Neumorph
      variant={checked ? 'inset' : 'raised'}
      radius={8}
      intensity="sm"
      surface={checked ? colors.carbon : colors.canvas}
    >
      <View
        style={{
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
        }}
      >
        <MotiView
          animate={{
            opacity: checked ? 1 : 0,
            scale: checked ? 1 : 0.4,
          }}
          transition={{ type: 'spring', damping: 14, stiffness: 220 }}
        >
          <Icon name="check" size={size * 0.66} color="highlighter" strokeWidth={3} />
        </MotiView>
      </View>
    </Neumorph>
  );

  return (
    <Pressable
      onPress={() => !disabled && onChange(!checked)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          opacity: disabled ? 0.5 : 1,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      {box}
      {label ? (
        <Text
          style={{
            fontFamily: fonts.bodyMedium,
            fontSize: 15,
            color: colors.carbon,
            flexShrink: 1,
          }}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default Checkbox;
