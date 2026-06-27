import React from 'react';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/theme';
import { NeumorphicTabBar } from '@/components/navigation/NeumorphicTabBar';

/**
 * Main app tabs with the floating bottom dock.
 *
 * Five tabs (order matters — matches NeumorphicTabBar):
 *   index=Dashboard, dsa=DSA, revisions=Revisions, tracker=Tracker, profile=Profile.
 *
 * Screen agents only add the corresponding screen files in this folder; all
 * five Tabs.Screen entries are declared here. The scene background reads the
 * ACTIVE palette so the app is dark-aware.
 */
export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      tabBar={(props: BottomTabBarProps) => <NeumorphicTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="dsa" options={{ title: 'DSA' }} />
      <Tabs.Screen name="revisions" options={{ title: 'Revisions' }} />
      <Tabs.Screen name="tracker" options={{ title: 'Tracker' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
