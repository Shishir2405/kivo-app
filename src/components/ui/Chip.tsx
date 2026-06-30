import React, { useState } from 'react';
import { Pressable, View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, type IconName } from './Icon';
import { fonts, radii, interaction } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Kivo chip — a small flat pill. Idle: surface with a hairline + muted text.
 * Selected: filled TERRACOTTA with inverted text (the HTML "Active" tag).
 * Theme-aware.
 */
export function Chip({ label, selected, onPress, icon, disabled, style }: ChipProps) {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Static wrapper opacity (preserved): disabled 0.45, pressed 0.6, else 1.
  const wrapBase: ViewStyle = { opacity: disabled ? 0.45 : 1 };
  const wrapPressed: ViewStyle = { opacity: 0.6 };

  // Inner chip styling — static, computed from props + press/hover state.
  const chipStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: radii.pill,
    backgroundColor: selected
      ? colors.primary
      : hovered && !pressed
        ? interaction.hoverWash
        : colors.surface,
    borderWidth: 1,
    borderColor: selected ? colors.primary : pressed ? colors.primary : colors.hairline,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[wrapBase, !disabled && pressed && wrapPressed, style]}
    >
      <View style={chipStyle}>
        {icon ? (
          <Icon name={icon} size={13} color={selected ? colors.onPrimary : colors.muted} />
        ) : null}
        <Text
          style={{
            fontFamily: fonts.sansSemibold,
            fontSize: 13,
            // Selected = filled terracotta → onPrimary (cream in BOTH themes).
            // (inkInverted would flip to near-black on terracotta in dark.)
            color: selected ? colors.onPrimary : colors.muted,
          }}
        >
          {label}
        </Text>
      </View>
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
