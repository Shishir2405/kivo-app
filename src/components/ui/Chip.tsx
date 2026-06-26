import React from 'react';
import { Pressable, View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import { Neumorph } from './Neumorph';
import { Icon, type IconName } from './Icon';
import { colors, fonts, radii } from '@/theme/tokens';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * A selectable neumorphic chip.
 *
 * Idle: raised gray pill with muted ink. Selected: presses into an inset
 * highlighter-yellow well with carbon ink + a check-mark Icon — the same
 * soft-UI "pressed = active" language used across the kit.
 */
export function Chip({ label, selected, onPress, icon, disabled, style }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={[{ opacity: disabled ? 0.5 : 1 }, style]}
    >
      <Neumorph
        variant={selected ? 'inset' : 'raised'}
        radius={radii.pill}
        intensity="sm"
        surface={selected ? colors.highlighter : colors.canvas}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: radii.pill,
          }}
        >
          {selected ? (
            <MotiView
              from={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 220 }}
            >
              <Icon name="check" size={15} color="carbon" strokeWidth={3} />
            </MotiView>
          ) : icon ? (
            <Icon name={icon} size={15} color="textMuted" strokeWidth={2} />
          ) : null}
          <Text
            style={{
              fontFamily: selected ? fonts.bodyBold : fonts.bodyMedium,
              fontSize: 14,
              color: selected ? colors.carbon : colors.textMuted,
            }}
          >
            {label}
          </Text>
        </View>
      </Neumorph>
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
 * value; `multiple` toggles a set. Lays out as a flexible wrap of <Chip/>s.
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
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, style]}>
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
