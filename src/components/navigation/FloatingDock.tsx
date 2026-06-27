import React, { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { fonts, motion } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

/**
 * FloatingDock — the Kivo bottom navigation (NEW, standalone component; replaces
 * the old NeumorphicTabBar). Built to the Kivo.dc design dock.
 *
 * Layout is the canonical, bulletproof pattern: an outer full-width row (default
 * `alignItems:'stretch'`) padded horizontally, holding a pill bar whose five
 * tabs are each `flex:1` — so they ALWAYS spread evenly and can never cluster to
 * one side. A peach indicator spring-slides under the active tab (measured via
 * onLayout). Active = deep terracotta, inactive = muted; dark mode uses the
 * design's warm-dark dock values. This is intentionally NOT the segmented
 * "tablist" component — they are separate.
 */
type TabKey = 'index' | 'dsa' | 'revisions' | 'tracker' | 'profile';

const TABS: { name: TabKey; label: string }[] = [
  { name: 'index', label: 'Home' },
  { name: 'dsa', label: 'DSA' },
  { name: 'revisions', label: 'Revise' },
  { name: 'tracker', label: 'Tracker' },
  { name: 'profile', label: 'Profile' },
];

function DockIcon({ name, color }: { name: TabKey; color: string }) {
  const s = {
    stroke: color,
    strokeWidth: 1.9,
    fill: 'none' as const,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24">
      {name === 'index' ? (
        <>
          <Path d="M3 10.5 12 3l9 7.5" {...s} />
          <Path d="M5 9.5V21h14V9.5" {...s} />
        </>
      ) : null}
      {name === 'dsa' ? <Path d="m8 6-6 6 6 6M16 6l6 6-6 6" {...s} /> : null}
      {name === 'revisions' ? (
        <>
          <Path d="M21 12a9 9 0 1 1-2.6-6.4" {...s} />
          <Path d="M21 3v5h-5" {...s} />
        </>
      ) : null}
      {name === 'tracker' ? (
        <>
          <Rect x={3} y={4.5} width={18} height={17} rx={3} {...s} />
          <Path d="M16 2.5v4M8 2.5v4M3 10h18" {...s} />
        </>
      ) : null}
      {name === 'profile' ? (
        <>
          <Circle cx={12} cy={8} r={4} {...s} />
          <Path d="M4 21c0-4 4-6 8-6s8 2 8 6" {...s} />
        </>
      ) : null}
    </Svg>
  );
}

const PAD = 6;

export function FloatingDock({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const [trackW, setTrackW] = useState(0);
  const cellW = trackW > 0 ? (trackW - PAD * 2) / TABS.length : 0;

  const activeIndex = Math.max(
    0,
    TABS.findIndex((t) => {
      const r = state.routes.find((rt) => rt.name === t.name);
      return r ? state.routes.indexOf(r) === state.index : false;
    }),
  );

  const pillBg = isDark ? 'rgba(30,26,20,0.96)' : '#FFFFFF';
  const pillBorder = isDark ? '#3A3026' : '#EDE6DA';
  const indicatorBg = isDark ? '#3A2C1A' : '#FAE7DB';
  const activeColor = isDark ? '#E6B08A' : '#BD6238';
  const inactiveColor = isDark ? '#8C8377' : '#9A9082';

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 12),
        backgroundColor: 'transparent',
      }}
    >
      <View
        onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
        style={{
          flexDirection: 'row',
          alignItems: 'stretch',
          position: 'relative',
          height: 62,
          padding: PAD,
          borderRadius: 24,
          backgroundColor: pillBg,
          borderWidth: 1,
          borderColor: pillBorder,
          shadowColor: '#211C17',
          shadowOffset: { width: 0, height: 14 },
          shadowOpacity: isDark ? 0.5 : 0.2,
          shadowRadius: 22,
          elevation: 14,
        }}
      >
        {/* Spring-sliding peach indicator under the active tab. */}
        {cellW > 0 ? (
          <MotiView
            animate={{ translateX: PAD + activeIndex * cellW }}
            transition={motion.springSnappy}
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: PAD,
              bottom: PAD,
              left: 0,
              width: cellW,
              borderRadius: 18,
              backgroundColor: indicatorBg,
            }}
          />
        ) : null}

        {TABS.map((tab) => {
          const route = state.routes.find((r) => r.name === tab.name);
          if (!route) return null;
          const focused = state.routes.indexOf(route) === state.index;
          const color = focused ? activeColor : inactiveColor;

          const onPress = () => {
            const ev = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !ev.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={tab.label}
              style={({ pressed }) => ({
                flex: 1,
                alignSelf: 'stretch',
                zIndex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                opacity: pressed && !focused ? 0.6 : 1,
              })}
            >
              <DockIcon name={tab.name} color={color} />
              <Text
                numberOfLines={1}
                style={{ fontFamily: fonts.sansSemibold, fontSize: 9, color }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default FloatingDock;
