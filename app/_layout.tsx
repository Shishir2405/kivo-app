import '../global.css';

import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreenModule from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';

import { useAppFonts } from '@/theme/useAppFonts';
import { colors } from '@/theme/tokens';
import { SplashScreen } from '@/components/SplashScreen';
import { useUiStore, useAuthStore } from '@/store';
import { useNotifications } from '@/hooks/useNotifications';
import { queryClient } from '@/services/queryClient';

// Keep the native splash up until fonts are ready and we say so.
SplashScreenModule.preventAutoHideAsync().catch(() => {
  /* ignore — already prevented */
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();
  const splashDone = useUiStore((s) => s.splashDone);
  const setSplashDone = useUiStore((s) => s.setSplashDone);

  // Install the notification handler + best-effort push registration at startup.
  useNotifications();

  // Restore any persisted auth session from AsyncStorage on app start.
  const restoreSession = useAuthStore((s) => s.restoreSession);
  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  // Local gate for the very first animated splash (independent of route).
  const [animatedSplashOver, setAnimatedSplashOver] = useState(false);

  const ready = fontsLoaded || !!fontError;

  // Once fonts are ready, hide the NATIVE splash so our animated one shows.
  const onLayoutRootView = useCallback(async () => {
    if (ready) {
      await SplashScreenModule.hideAsync().catch(() => {});
    }
  }, [ready]);

  useEffect(() => {
    if (ready) {
      SplashScreenModule.hideAsync().catch(() => {});
    }
  }, [ready]);

  const handleSplashFinish = useCallback(() => {
    setAnimatedSplashOver(true);
    setSplashDone(true);
  }, [setSplashDone]);

  if (!ready) {
    // Native splash still showing; render nothing.
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
        <View
          style={{ flex: 1, backgroundColor: colors.canvas }}
          onLayout={onLayoutRootView}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.canvas },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="dsa-topic/[id]" />
            <Stack.Screen name="problem/[id]" />

            {/* Feature stack routes (Menu hub + everything it links to). */}
            <Stack.Screen name="more/index" />
            <Stack.Screen name="notes/index" />
            <Stack.Screen name="notes/[id]" />
            <Stack.Screen name="resources/index" />
            <Stack.Screen name="habits/index" />
            <Stack.Screen name="reflections/index" />
            <Stack.Screen name="reflections/[date]" />
            <Stack.Screen name="notifications/index" />
            <Stack.Screen name="achievements/index" />
            <Stack.Screen name="analytics/index" />
            <Stack.Screen name="calendar/index" />
            <Stack.Screen name="focus-timer/index" />
            <Stack.Screen name="settings/index" />
          </Stack>

          {/* Animated in-app splash overlays everything until it finishes. */}
          {!animatedSplashOver && !splashDone ? (
            <View style={{ ...StyleSheetAbsoluteFill }}>
              <SplashScreen onFinish={handleSplashFinish} />
            </View>
          ) : null}
        </View>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const StyleSheetAbsoluteFill = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};
