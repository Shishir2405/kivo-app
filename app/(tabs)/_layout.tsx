import React from 'react';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '@/theme/tokens';
import { NeumorphicTabBar } from '@/components/navigation/NeumorphicTabBar';

/**
 * Main app tabs with the floating neumorphic bottom bar.
 *
 * Five tabs (order matters — matches NeumorphicTabBar):
 *   index=Dashboard, dsa=DSA, revisions=Revisions, tracker=Tracker, profile=Profile.
 *
 * Screen agents only add the corresponding screen files in this folder; all
 * five Tabs.Screen entries are declared here.
 */
export default function TabsLayout() {
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
