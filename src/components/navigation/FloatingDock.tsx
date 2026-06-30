import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { fonts, motion } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

/**
 * FloatingDock — the Kivo bottom navigation (rebuilt from scratch).
 *
 * LAYOUT CONTRACT (bulletproof even spread):
 *   outer wrapper (column)  →  pill row `width:'100%'`, `flexDirection:'row'`
 *   →  five tab cells each `flex:1, minWidth:0`. Because the row fills its
 *   parent and every cell flexes equally, the tabs ALWAYS divide the bar into
 *   five identical columns — they can never cluster to one side regardless of
 *   content width, font metrics, or platform.
 *
 * The active peach indicator is positioned from the *measured cell width*
 * (one onLayout on the row's inner track) and spring-slides under the focused
 * tab. If measurement hasn't landed yet (width 0) the indicator simply stays
 * hidden — the tabs are already laid out correctly without it, so there is no
 * dependency the other way around.
 */
type TabKey = 'index' | 'dsa' | 'revisions' | 'tracker' | 'profile';

const TABS: { name: TabKey; label: string }[] = [
  { name: 'index', label: 'Home' },
  { name: 'dsa', label: 'DSA' },
  { name: 'revisions', label: 'Revise' },
  { name: 'tracker', label: 'Tracker' },
  { name: 'profile', label: 'Profile' },
];

/** Inner padding of the pill (the indicator track inset). */
const PAD = 6;
const PILL_HEIGHT = 60;

function DockIcon({ name, color, focused }: { name: TabKey; color: string; focused: boolean }) {
  const s = {
    stroke: color,
    strokeWidth: focused ? 2.1 : 1.9,
    fill: 'none' as const,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24">
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

export function FloatingDock({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const [trackW, setTrackW] = useState(0);

  // The five visible tabs, paired with their live route (skip any tab whose
  // screen isn't registered) so order + focus stay in lockstep with the router.
  const cells = useMemo(
    () =>
      TABS.map((tab) => state.routes.find((r) => r.name === tab.name))
        .map((route, i) => (route ? { tab: TABS[i], route } : null))
        .filter((c): c is { tab: (typeof TABS)[number]; route: (typeof state.routes)[number] } => c !== null),
    [state.routes],
  );

  const count = cells.length || 1;
  const cellW = trackW > 0 ? trackW / count : 0;
  const activeIndex = Math.max(
    0,
    cells.findIndex(({ route }) => state.routes.indexOf(route) === state.index),
  );

  const pillBg = isDark ? 'rgba(30,26,20,0.97)' : '#FFFFFF';
  const pillBorder = isDark ? '#3A3026' : '#ECE4D7';
  const indicatorBg = isDark ? '#3A2C1A' : '#FAE7DB';
  const activeColor = isDark ? '#E6B08A' : '#C46A3D';
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
        style={{
          width: '100%',
          height: PILL_HEIGHT,
          padding: PAD,
          borderRadius: 26,
          backgroundColor: pillBg,
          borderWidth: 1,
          borderColor: pillBorder,
          shadowColor: '#211C17',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: isDark ? 0.5 : 0.16,
          shadowRadius: 20,
          elevation: 12,
        }}
      >
        {/* Indicator track — its width is what we measure to size each cell. */}
        <View
          onLayout={(e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width)}
          style={{ flex: 1, flexDirection: 'row', width: '100%', position: 'relative' }}
        >
          {/* Spring-sliding peach indicator under the active tab. */}
          {cellW > 0 ? (
            <MotiView
              animate={{ translateX: activeIndex * cellW }}
              transition={motion.springSnappy}
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: cellW,
                borderRadius: 18,
                backgroundColor: indicatorBg,
              }}
            />
          ) : null}

          {cells.map(({ tab, route }) => {
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
                style={{
                  flex: 1,
                  minWidth: 0,
                  zIndex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                }}
              >
                <MotiView
                  animate={{ scale: focused ? 1 : 0.94, translateY: focused ? -1 : 0 }}
                  transition={motion.springSnappy}
                  style={{ alignItems: 'center', justifyContent: 'center' }}
                >
                  <DockIcon name={tab.name} color={color} focused={focused} />
                </MotiView>
                <Text
                  numberOfLines={1}
                  allowFontScaling={false}
                  style={{
                    fontFamily: focused ? fonts.sansSemibold : fonts.sansMedium,
                    fontSize: 10,
                    letterSpacing: 0.1,
                    color,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default FloatingDock;
