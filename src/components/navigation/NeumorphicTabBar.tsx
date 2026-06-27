import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { colors, fonts } from '@/theme/tokens';
import { Icon, type IconName } from '@/components/ui/Icon';

/**
 * Steep bottom tab bar — flat, calm, premium.
 *
 * Every tab uses the SAME vertical layout (Rust dot indicator · phosphor icon ·
 * tiny label) so widths are equal and the bar never shifts when you switch tabs.
 * Active = Rust dot + Ink icon/label; inactive = Graphite, no dot. Flat white bar,
 * hairline top border, compact, with a pressed state. (Filename kept for the
 * existing import; it is NOT neumorphic.)
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

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {TABS.map((tab) => {
        const route = state.routes.find((r) => r.name === tab.name);
        if (!route) return null;

        const routeIndex = state.routes.findIndex((r) => r.key === route.key);
        const focused = state.index === routeIndex;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        const onLongPress = () =>
          navigation.emit({ type: 'tabLongPress', target: route.key });

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={tab.label}
            hitSlop={6}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
          >
            <View style={[styles.dot, focused && styles.dotActive]} />
            <Icon
              name={tab.icon}
              size={22}
              color={focused ? 'ink' : 'graphite'}
              weight={focused ? 'regular' : 'light'}
            />
            <Text
              style={[styles.label, focused ? styles.labelActive : styles.labelInactive]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.dove,
    paddingTop: 7,
    paddingHorizontal: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  itemPressed: { opacity: 0.5 },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginBottom: 2,
    backgroundColor: 'transparent',
  },
  dotActive: { backgroundColor: colors.rust },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    letterSpacing: -0.1,
  },
  labelActive: { color: colors.ink },
  labelInactive: { color: colors.graphite },
});

export default NeumorphicTabBar;
