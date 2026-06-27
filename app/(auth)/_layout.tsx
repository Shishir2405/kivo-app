import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/theme';

/**
 * Auth flow stack: onboarding -> login / register.
 * Screen files (onboarding.tsx, login.tsx, register.tsx) match the
 * HTML "Auth & onboarding" section. This layout declares the group + shared
 * options and is dark-aware via useTheme() (the stack content background tracks
 * the active canvas so there is no light flash on theme switch).
 */
export default function AuthLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
