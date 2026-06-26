import React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';

import { colors } from '@/theme/tokens';
import { useAuthStore } from '@/store';
import { useUiStore } from '@/store';

/**
 * Entry gate.
 *
 * The animated in-app splash is rendered globally by the root layout and flips
 * `useUiStore.splashDone` when it finishes. Until then we hold on a blank
 * canvas (the splash sits on top). Once done, we redirect:
 *   - authenticated  -> (tabs) dashboard
 *   - otherwise       -> (auth)/welcome
 */
export default function Index() {
  const splashDone = useUiStore((s) => s.splashDone);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!splashDone) {
    return <View style={{ flex: 1, backgroundColor: colors.canvas }} />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
