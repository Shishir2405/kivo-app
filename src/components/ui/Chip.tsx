import React from 'react';
import { Pressable, View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, type IconName } from './Icon';
import { colors, fonts, radii, interaction } from '@/theme/tokens';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Steep chip — a small flat pill. Idle: white with a Dove hairline, Ash text.
 * Selected: filled Ink with white text. No neumorphism.
 */
export function Chip({ label, selected, onPress, icon, disabled, style }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [{ opacity: disabled ? 0.4 : pressed ? 0.6 : 1 }, style]}
    >
      {({ pressed, hovered }) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingVertical: 5,
            paddingHorizontal: 11,
            borderRadius: radii.pill,
            backgroundColor: selected
              ? colors.ink
              : hovered && !pressed
                ? interaction.hoverWash
                : colors.white,
            borderWidth: 1,
            borderColor: selected ? colors.ink : pressed ? colors.ink : colors.dove,
          }}
        >
          {icon ? (
            <Icon name={icon} size={13} color={selected ? 'white' : 'graphite'} />
          ) : null}
          <Text
            style={{
              fontFamily: fonts.sansMedium,
              fontSize: 13,
              color: selected ? colors.white : colors.ash,
            }}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export type ChipOption<T extends string> = {
  label: string;
  value: T;
  icon?: IconName;
};

export type ChipGroupSingleProps<T extends string> = {
  options: ChipOption<T>[];
  multiple?: false;
  value: T | null;
  onChange: (next: T) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export type ChipGroupMultiProps<T extends string> = {
  options: ChipOption<T>[];
  multiple: true;
  value: T[];
  onChange: (next: T[]) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export type ChipGroupProps<T extends string> =
  | ChipGroupSingleProps<T>
  | ChipGroupMultiProps<T>;

/**
 * A wrapping group of selectable chips. Single-select (default) toggles one
 * value; `multiple` toggles a set.
 */
export function ChipGroup<T extends string>(props: ChipGroupProps<T>) {
  const { options, disabled, style } = props;

  function isSelected(v: T): boolean {
    return props.multiple ? props.value.includes(v) : props.value === v;
  }

  function toggle(v: T) {
    if (props.multiple) {
      const set = new Set(props.value);
      if (set.has(v)) set.delete(v);
      else set.add(v);
      props.onChange(Array.from(set));
    } else {
      props.onChange(v);
    }
  }

  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, style]}>
      {options.map((opt) => (
        <Chip
          key={opt.value}
          label={opt.label}
          icon={opt.icon}
          selected={isSelected(opt.value)}
          disabled={disabled}
          onPress={() => toggle(opt.value)}
        />
      ))}
    </View>
  );
}

export default Chip;
