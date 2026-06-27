import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';

import KivoMark from '../../assets/brand/kivo-mark.svg';
import { MARK_ASPECT } from '@/components/brand/BrandLogo';
import { colors, spacing } from '@/theme/tokens';
import { useUiStore } from '@/store';
import { AppText, PillButton, TextLink, Icon } from '@/components/ui';

/** Three short value lines — typography does the talking, no imagery. */
const VALUE_POINTS = [
  'Curated DSA roadmaps — Striver, Blind 75, NeetCode 150.',
  'Spaced-repetition revisions so it actually sticks.',
  'A daily streak that keeps you showing up.',
] as const;

/**
 * Welcome — the first surface a new user lands on.
 *
 * Steep & editorial (not a landing page): a quiet Kivo mark, a small serif
 * headline, three short value lines, the single Ink CTA, and a text link to log
 * in. Flat white canvas, tight spacing, color as punctuation.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const setHasSeenWelcome = useUiStore((s) => s.setHasSeenWelcome);

  const handleGetStarted = () => {
    setHasSeenWelcome(true);
    router.push('/(auth)/register');
  };

  const handleLogIn = () => {
    setHasSeenWelcome(true);
    router.push('/(auth)/login');
  };

  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.white,
        paddingTop: insets.top + spacing.xl,
        paddingBottom: insets.bottom + spacing.xl,
        paddingHorizontal: spacing.xl,
      }}
    >
      {/* Quiet brand mark */}
      <MotiView
        from={{ opacity: 0, translateY: -6 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 420 }}
      >
        <KivoMark width={26 * MARK_ASPECT} height={26} />
      </MotiView>

      {/* Editorial headline + value points */}
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.xxl }}>
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 480, delay: 100 }}
          style={{ gap: spacing.md }}
        >
          <AppText variant="display" display>
            Crack DSA, one problem a day.
          </AppText>
          <AppText variant="subheading" weight="regular" color={colors.ash} style={{ maxWidth: 320 }}>
            Build the habit, land the offer. Kivo turns prep into a streak you
            never want to break.
          </AppText>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 480, delay: 200 }}
          style={{ gap: spacing.md }}
        >
          {VALUE_POINTS.map((point) => (
            <View key={point} className="flex-row items-start" style={{ gap: spacing.md }}>
              <View style={{ paddingTop: 3 }}>
                <Icon name="check" size={15} color="rust" />
              </View>
              <AppText variant="body" color={colors.ash} style={{ flex: 1 }}>
                {point}
              </AppText>
            </View>
          ))}
        </MotiView>
      </View>

      {/* Single Ink CTA + text link to log in */}
      <MotiView
        from={{ opacity: 0, translateY: 14 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 480, delay: 320 }}
        style={{ gap: spacing.lg }}
      >
        <PillButton
          label="Get started"
          variant="black"
          size="lg"
          fullWidth
          onPress={handleGetStarted}
          trailingIcon={<Icon name="arrow-right" size={16} color="white" />}
        />
        <View className="flex-row items-center justify-center" style={{ gap: spacing.xs }}>
          <AppText variant="caption" color={colors.graphite}>
            Already have an account?
          </AppText>
          <TextLink label="Log in" size="sm" onPress={handleLogIn} />
        </View>
      </MotiView>
    </View>
  );
}
