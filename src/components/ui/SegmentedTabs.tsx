import React, { useMemo } from 'react';
import { Pressable, View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import { Neumorph } from './Neumorph';
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
 * Custom segmented control — the engaging replacement for radio groups.
 *
 * The track is one inset neumorphic well. A highlighter-yellow pill slides
 * (spring) to sit under the active segment; the active label/icon flips to
 * carbon for contrast while the rest stay muted. No native radio anywhere.
 */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  disabled,
  height = 48,
  fullWidth = true,
  style,
}: SegmentedTabsProps<T>) {
  const count = options.length;
  const activeIndex = useMemo(
    () => Math.max(0, options.findIndex((o) => o.value === value)),
    [options, value],
  );
  const pad = 5;

  return (
    <View style={[fullWidth ? { alignSelf: 'stretch' } : { alignSelf: 'flex-start' }, style]}>
      <Neumorph variant="inset" radius={height / 2}>
        <View
          style={{
            height,
            flexDirection: 'row',
            padding: pad,
            position: 'relative',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          {/* Sliding active pill — width is a fraction of the track. */}
          <MotiView
            animate={{ left: `${(activeIndex / count) * 100}%` }}
            transition={{ type: 'spring', damping: 18, stiffness: 200 }}
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
                backgroundColor: colors.highlighter,
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
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  borderRadius: (height - pad * 2) / 2,
                }}
              >
                {opt.icon ? (
                  <Icon
                    name={opt.icon}
                    size={17}
                    color={active ? 'carbon' : 'textMuted'}
                    strokeWidth={active ? 2.4 : 2}
                  />
                ) : null}
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: active ? fonts.bodyBold : fonts.bodyMedium,
                    fontSize: 14,
                    color: active ? colors.carbon : colors.textMuted,
                    letterSpacing: 0.1,
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Neumorph>
    </View>
  );
}

export default SegmentedTabs;
