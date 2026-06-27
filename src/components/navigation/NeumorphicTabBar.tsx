import React, { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { fonts, motion } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';
import { Icon, type IconName } from '@/components/ui/Icon';

/**
 * Kivo floating-dock bottom nav.
 *
 * A floating surface pill (hairline + one soft shadow) with a TERRACOTTA-WASH
 * indicator that SPRING-slides under the active tab (the HTML dock's overshoot
 * pill). The active icon/label go terracotta, inactive are muted. Geometry is
 * measured (onLayout) so the indicator translateX is exact. Fully theme-aware:
 * in dark it becomes a translucent warm-dark dock. (Filename kept for the
 * existing import.)
 */
type TabRouteName = 'index' | 'dsa' | 'revisions' | 'tracker' | 'profile';

const TABS: { name: TabRouteName; label: string; icon: IconName }[] = [
  { name: 'index', label: 'Home', icon: 'home' },
  { name: 'dsa', label: 'DSA', icon: 'code' },
  { name: 'revisions', label: 'Revise', icon: 'repeat' },
  { name: 'tracker', label: 'Tracker', icon: 'calendar' },
  { name: 'profile', label: 'Profile', icon: 'user' },
];

const PAD = 6;

export function NeumorphicTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, shadow } = useTheme();
  const [dockW, setDockW] = useState(0);
  const count = TABS.length;
  const tabW = dockW > 0 ? (dockW - PAD * 2) / count : 0;

  const activeIndex = Math.max(
    0,
    TABS.findIndex((t) => {
      const r = state.routes.find((rt) => rt.name === t.name);
      return r ? state.routes.findIndex((x) => x.key === r.key) === state.index : false;
    }),
  );

  // Active accents follow the HTML: terracotta for the active tab.
  const activeColor = colors.primary;
  const indicatorBg = colors.primaryWash;

  return (
    <View
      style={{
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 10),
        backgroundColor: 'transparent',
      }}
    >
      <View
        onLayout={(e) => setDockW(e.nativeEvent.layout.width)}
        style={[
          {
            flexDirection: 'row',
            position: 'relative',
            padding: PAD,
            backgroundColor: colors.surface,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.hairline,
          },
          shadow,
        ]}
      >
        {/* Sliding terracotta-wash indicator (spring overshoot). */}
        {tabW > 0 ? (
          <MotiView
            animate={{ translateX: PAD + activeIndex * tabW }}
            transition={motion.springSnappy}
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: PAD,
              bottom: PAD,
              left: 0,
              width: tabW,
              borderRadius: 999,
              backgroundColor: indicatorBg,
            }}
          />
        ) : null}

        {TABS.map((tab) => {
          const route = state.routes.find((r) => r.name === tab.name);
          if (!route) return null;
          const idx = state.routes.findIndex((r) => r.key === route.key);
          const focused = state.index === idx;

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
              hitSlop={4}
              style={({ pressed }) => [
                { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center', gap: 3, zIndex: 1 },
                pressed && { opacity: 0.6 },
              ]}
            >
              <Icon
                name={tab.icon}
                size={20}
                color={focused ? activeColor : colors.muted}
                weight={focused ? 'regular' : 'regular'}
              />
              <Text
                style={{
                  fontFamily: fonts.sansSemibold,
                  fontSize: 9.5,
                  letterSpacing: -0.1,
                  color: focused ? activeColor : colors.muted,
                }}
                numberOfLines={1}
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

export default NeumorphicTabBar;
