import React, { useMemo } from 'react';
import { Pressable, View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, type IconName } from './Icon';
import { fonts } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

export type SegmentedOption<T extends string> = {
  label: string;
  value: T;
  icon?: IconName;
};

export type SegmentedTabsProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (next: T) => void;
  disabled?: boolean;
  /** Height of the control. */
  height?: number;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Kivo segmented control — a soft track holding the segments. The ACTIVE segment
 * gets its own raised surface pill (active label = ink, inactive = muted).
 *
 * No width-measurement / sliding layer: each segment is `flex: 1` and the active
 * one simply renders its own background, so it can never desync, overlap, or cram
 * (the old measured-slide approach was the source of the "not correct" toggle).
 */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  disabled,
  height = 40,
  fullWidth = true,
  style,
}: SegmentedTabsProps<T>) {
  const { colors, isDark } = useTheme();
  const activeIndex = useMemo(
    () => Math.max(0, options.findIndex((o) => o.value === value)),
    [options, value],
  );
  const pad = 3;

  return (
    <View style={[fullWidth ? { alignSelf: 'stretch' } : { alignSelf: 'flex-start' }, style]}>
      <View
        style={{
          height,
          flexDirection: 'row',
          alignItems: 'stretch',
          padding: pad,
          gap: 2,
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
              style={({ pressed }) => ({
                flex: 1,
                minWidth: 0,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                borderRadius: (height - pad * 2) / 2,
                backgroundColor: active ? colors.surface : 'transparent',
                // One soft lift on the active pill.
                shadowColor: active ? colors.shadowTint : 'transparent',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: active ? (isDark ? 0.4 : 0.1) : 0,
                shadowRadius: 3,
                elevation: active ? 2 : 0,
                opacity: pressed && !active ? 0.6 : 1,
              })}
            >
              {opt.icon ? (
                <Icon name={opt.icon} size={15} color={active ? colors.ink : colors.muted} />
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

export default SegmentedTabs;
