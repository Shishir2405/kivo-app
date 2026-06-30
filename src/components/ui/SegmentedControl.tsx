import React, { useMemo } from 'react';
import { Pressable, View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, type IconName } from './Icon';
import { fonts } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

/**
 * SegmentedControl — the Kivo "tablist" (NEW, standalone; replaces SegmentedTabs).
 *
 * A soft track holding N equal segments. Each segment is `flex:1` so they ALWAYS
 * spread evenly (can never overlap or cluster). The ACTIVE segment rides its own
 * raised surface pill (hairline outline + soft lift) with INK label; inactive
 * segments are muted. Fully light/dark aware. No width-measurement / sliding
 * layer — nothing to desync. Drop-in API-compatible with the old SegmentedTabs.
 */
export type SegmentedOption<T extends string> = {
  label: string;
  value: T;
  icon?: IconName;
};

export type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (next: T) => void;
  disabled?: boolean;
  /** Height of the control. */
  height?: number;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled,
  height = 42,
  fullWidth = true,
  style,
}: SegmentedControlProps<T>) {
  const { colors, isDark } = useTheme();
  const activeIndex = useMemo(
    () => Math.max(0, options.findIndex((o) => o.value === value)),
    [options, value],
  );
  const pad = 4;
  const innerRadius = (height - pad * 2) / 2;

  return (
    <View style={[fullWidth ? { alignSelf: 'stretch' } : { alignSelf: 'flex-start' }, style]}>
      <View
        style={{
          width: '100%',
          height,
          flexDirection: 'row',
          alignItems: 'stretch',
          padding: pad,
          gap: 3,
          opacity: disabled ? 0.45 : 1,
          backgroundColor: colors.surfaceAlt,
          borderRadius: height / 2,
          borderWidth: 1,
          borderColor: colors.hairline,
        }}
      >
        {options.map((opt, i) => {
          const active = i === activeIndex;
          return (
            <Pressable
              key={opt.value}
              disabled={disabled}
              onPress={() => onChange(opt.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              android_ripple={{ color: colors.hairline, borderless: false }}
              style={{
                flex: 1,
                minWidth: 0,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                borderRadius: innerRadius,
                backgroundColor: active ? colors.surface : 'transparent',
                borderWidth: active ? 1 : 0,
                borderColor: active ? colors.hairline : 'transparent',
                shadowColor: active ? '#211C17' : 'transparent',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: active ? (isDark ? 0.5 : 0.12) : 0,
                shadowRadius: isDark ? 4 : 3,
                elevation: active ? 2 : 0,
              }}
            >
              {opt.icon ? (
                <Icon name={opt.icon} size={15} color={active ? colors.primary : colors.muted} />
              ) : null}
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: active ? fonts.sansBold : fonts.sansMedium,
                  fontSize: 13,
                  color: active ? colors.ink : colors.muted,
                  letterSpacing: -0.1,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default SegmentedControl;
