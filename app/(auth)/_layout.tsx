import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/theme/tokens';

/**
 * Auth flow stack: welcome -> login / register.
 * Screen files (welcome.tsx, login.tsx, register.tsx) are built by the auth
 * screen agent; this layout just declares the group + shared options.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
