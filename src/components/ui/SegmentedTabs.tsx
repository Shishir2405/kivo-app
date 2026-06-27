import React, { useMemo } from 'react';
import { Pressable, View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import { Icon, type IconName } from './Icon';
import { colors, fonts } from '@/theme/tokens';

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
 * Steep segmented control — flat & minimal. A Fog track with a 1px Dove
 * hairline; a small Ink pill slides under the active segment (white label).
 * Inactive labels are Graphite. No neumorphism.
 */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  disabled,
  height = 36,
  fullWidth = true,
  style,
}: SegmentedTabsProps<T>) {
  const count = options.length;
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
          padding: pad,
          position: 'relative',
          opacity: disabled ? 0.4 : 1,
          backgroundColor: colors.fog,
          borderRadius: height / 2,
          borderWidth: 1,
          borderColor: colors.dove,
        }}
      >
        {/* Sliding active pill */}
        <MotiView
          animate={{ left: `${(activeIndex / count) * 100}%` }}
          transition={{ type: 'timing', duration: 180 }}
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: pad,
            bottom: pad,
            left: 0,
            width: `${100 / count}%`,
            paddingHorizontal: pad / 2,
          }}
        >
          <View
            style={{
              flex: 1,
              marginHorizontal: pad / 2,
              borderRadius: (height - pad * 2) / 2,
              backgroundColor: colors.ink,
            }}
          />
        </MotiView>

        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              disabled={disabled}
              onPress={() => onChange(opt.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => ({
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                borderRadius: (height - pad * 2) / 2,
                opacity: pressed && !active ? 0.6 : 1,
              })}
            >
              {opt.icon ? (
                <Icon name={opt.icon} size={15} color={active ? 'white' : 'graphite'} />
              ) : null}
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: fonts.sansMedium,
                  fontSize: 13,
                  color: active ? colors.white : colors.graphite,
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
