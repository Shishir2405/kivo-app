import React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';

import { useTheme } from '@/theme';
import { useAuthStore } from '@/store';
import { useUiStore } from '@/store';

/**
 * Entry gate.
 *
 * The animated in-app splash is rendered globally by the root layout and flips
 * `useUiStore.splashDone` when it finishes. Until then we hold on a blank
 * canvas (the splash sits on top). Once done, we redirect:
 *   - authenticated                       -> (tabs) dashboard
 *   - not authed & onboarding not seen     -> (auth)/onboarding
 *   - otherwise                            -> (auth)/login
 */
export default function Index() {
  const { colors } = useTheme();
  const splashDone = useUiStore((s) => s.splashDone);
  const onboardingSeen = useUiStore((s) => s.onboardingSeen);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!splashDone) {
    return <View style={{ flex: 1, backgroundColor: colors.canvas }} />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  if (!onboardingSeen) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <Redirect href="/(auth)/login" />;
}
