import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Neumorph } from '@/components/ui/Neumorph';
import { colors, fonts } from '@/theme/tokens';
import { TAB_ICONS, type TabRouteName } from './TabIcons';

const TAB_LABELS: Record<TabRouteName, string> = {
  index: 'Dashboard',
  dsa: 'DSA',
  revisions: 'Revisions',
  tracker: 'Tracker',
  profile: 'Profile',
};

const TAB_ORDER: TabRouteName[] = ['index', 'dsa', 'revisions', 'tracker', 'profile'];

/**
 * Floating neumorphic bottom tab bar.
 *
 * A raised rounded bar hovers above the canvas. The ACTIVE tab is an inset
 * (pressed-in) highlighter-yellow well with its label shown; inactive tabs are
 * icon-only in muted carbon. Used as the expo-router Tabs `tabBar`.
 */
export function NeumorphicTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // Order the visible routes by our canonical order; ignore unknown routes.
  const routes = state.routes.filter((r) =>
    TAB_ORDER.includes(r.name as TabRouteName),
  );

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <Neumorph variant="raised" radius={32} intensity="md" surface={colors.canvas}>
        <View style={styles.bar}>
          {TAB_ORDER.map((name) => {
            const route = routes.find((r) => r.name === name);
            if (!route) return null;

            const routeIndex = state.routes.findIndex((r) => r.key === route.key);
            const focused = state.index === routeIndex;
            const Icon = TAB_ICONS[name];
            const label = TAB_LABELS[name];

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={label}
                style={styles.item}
              >
                {focused ? (
                  <Neumorph variant="inset" radius={20} surface={colors.highlighter}>
                    <MotiView
                      from={{ scale: 0.85, opacity: 0.6 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'timing', duration: 200 }}
                      style={styles.activePill}
                    >
                      <Icon color={colors.carbon} size={22} active />
                      <Text style={styles.activeLabel}>{label}</Text>
                    </MotiView>
                  </Neumorph>
                ) : (
                  <View style={styles.inactive}>
                    <Icon color={colors.textMuted} size={22} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </Neumorph>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 4,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  activeLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.carbon,
    letterSpacing: 0.1,
  },
  inactive: {
    width: 52,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default NeumorphicTabBar;
