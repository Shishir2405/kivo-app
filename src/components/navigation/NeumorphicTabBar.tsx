import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { fonts, radii } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';
import { Icon, type IconName } from '@/components/ui/Icon';

/**
 * Kivo floating-dock bottom nav.
 *
 * A floating surface pill (hairline + one soft shadow). Five tabs are evenly
 * distributed (each `flex: 1`), icon stacked over a small label. The ACTIVE tab
 * gets a terracotta-wash rounded pill behind it + terracotta icon/label;
 * inactive are muted. Fully theme-aware. No width-measurement / sliding layer —
 * the active pill is just the focused tab's own background, so the layout can
 * never desync or cram.
 */
type TabRouteName = 'index' | 'dsa' | 'revisions' | 'tracker' | 'profile';

const TABS: { name: TabRouteName; label: string; icon: IconName }[] = [
  { name: 'index', label: 'Home', icon: 'home' },
  { name: 'dsa', label: 'DSA', icon: 'code' },
  { name: 'revisions', label: 'Revise', icon: 'repeat' },
  { name: 'tracker', label: 'Tracker', icon: 'calendar' },
  { name: 'profile', label: 'Profile', icon: 'user' },
];

export function NeumorphicTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, shadow } = useTheme();

  return (
    <View
      style={{
        paddingHorizontal: 14,
        paddingTop: 6,
        paddingBottom: Math.max(insets.bottom, 10),
        backgroundColor: 'transparent',
      }}
    >
      <View
        style={[
          {
            flexDirection: 'row',
            alignSelf: 'stretch',
            alignItems: 'stretch',
            padding: 6,
            gap: 2,
            backgroundColor: colors.surface,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.hairline,
          },
          shadow,
        ]}
      >
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

          const tint = focused ? colors.primary : colors.muted;

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
                minWidth: 0,
                paddingVertical: 7,
                borderRadius: radii.pill,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                backgroundColor: focused ? colors.primaryWash : 'transparent',
                opacity: pressed && !focused ? 0.6 : 1,
              })}
            >
              <Icon name={tab.icon} size={20} color={tint} />
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: focused ? fonts.sansSemibold : fonts.sansMedium,
                  fontSize: 10,
                  letterSpacing: -0.1,
                  color: tint,
                }}
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
