import React, { useMemo, useState } from 'react';
import { Pressable, View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import { Icon, type IconName } from './Icon';
import { fonts, motion } from '@/theme/tokens';
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
 * Kivo segmented control — a soft track holding a raised pill that SPRINGS
 * under the active segment (the HTML's `transition: left .42s
 * cubic-bezier(.34,1.56,.64,1)` overshoot). Active label = ink; inactive =
 * muted. Theme-aware.
 *
 * Layout is MEASURED: we read the track width via onLayout and size each
 * segment in px, then slide the pill with a numeric translateX, so it never
 * desyncs from layout.
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
  const count = Math.max(1, options.length);
  const activeIndex = useMemo(
    () => Math.max(0, options.findIndex((o) => o.value === value)),
    [options, value],
  );
  const pad = 3;
  const [trackW, setTrackW] = useState(0);
  const segW = trackW > 0 ? (trackW - pad * 2) / count : 0;

  return (
    <View style={[fullWidth ? { alignSelf: 'stretch' } : { alignSelf: 'flex-start' }, style]}>
      <View
        onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
        style={{
          height,
          flexDirection: 'row',
          padding: pad,
          position: 'relative',
          opacity: disabled ? 0.45 : 1,
          backgroundColor: colors.surfaceAlt,
          borderRadius: height / 2,
          borderWidth: 1,
          borderColor: colors.hairline,
        }}
      >
        {/* Sliding raised pill — measured px width + spring translateX. */}
        {segW > 0 ? (
          <MotiView
            animate={{ translateX: pad + activeIndex * segW }}
            transition={motion.springSnappy}
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: pad,
              bottom: pad,
              left: 0,
              width: segW,
              borderRadius: (height - pad * 2) / 2,
              backgroundColor: colors.surface,
              shadowColor: colors.shadowTint,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDark ? 0.4 : 0.1,
              shadowRadius: 3,
              elevation: 2,
            }}
          />
        ) : null}

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
                zIndex: 1,
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
