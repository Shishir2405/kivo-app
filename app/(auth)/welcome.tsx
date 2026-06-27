import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Image } from 'expo-image';

import { KIVO_MARK, MARK_ASPECT } from '@/components/brand/BrandLogo';
import { spacing, radii, motion } from '@/theme/tokens';
import { useTheme } from '@/theme';
import { useUiStore } from '@/store';
import { AppText, PillButton, TextLink, Icon } from '@/components/ui';

/** Three short value lines — typography does the talking, color as punctuation. */
const VALUE_POINTS = [
  'Curated DSA roadmaps — Striver, Blind 75, NeetCode 150.',
  'Spaced-repetition revisions so it actually sticks.',
  'A daily streak that keeps you showing up.',
] as const;

/**
 * Welcome — the first surface a new user lands on.
 *
 * Calm and editorial: the Kivo mark, the terracotta ring badge that recurs
 * across onboarding, a serif display headline, three short value lines, the
 * single terracotta CTA, and a quiet text link to log in. Dark-aware via
 * useTheme(); cream/warm-dark canvas, tight spacing, a staggered entrance.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, shadow } = useTheme();
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
        backgroundColor: colors.canvas,
        paddingTop: insets.top + spacing.xl,
        paddingBottom: insets.bottom + spacing.xl,
        paddingHorizontal: spacing.xl,
      }}
    >
      {/* Quiet brand mark */}
      <MotiView
        from={{ opacity: 0, translateY: -6 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: motion.duration.transition }}
      >
        <Image
          source={KIVO_MARK}
          style={{ width: 30 * MARK_ASPECT, height: 30 }}
          contentFit="contain"
        />
      </MotiView>

      {/* Editorial headline + value points */}
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.xxl }}>
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: motion.duration.transition, delay: 80 }}
          style={{ gap: spacing.lg }}
        >
          {/* Terracotta ring badge — the recurring onboarding glyph */}
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: radii.frame,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              ...shadow,
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 3,
                borderColor: colors.peach,
              }}
            />
          </View>

          <View style={{ gap: spacing.md }}>
            <AppText variant="caption" italic color={colors.primaryOnWash}>
              learn · remember · grow
            </AppText>
            <AppText variant="display" display>
              Crack DSA, one problem a day.
            </AppText>
            <AppText
              variant="subheading"
              weight="regular"
              color={colors.muted}
              style={{ maxWidth: 320 }}
            >
              Build the habit, land the offer. Kivo turns prep into a streak you
              never want to break.
            </AppText>
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: motion.duration.transition, delay: 180 }}
          style={{ gap: spacing.md }}
        >
          {VALUE_POINTS.map((point) => (
            <View key={point} className="flex-row items-start" style={{ gap: spacing.md }}>
              <View style={{ paddingTop: 3 }}>
                <Icon name="check" size={15} color={colors.primary} />
              </View>
              <AppText variant="body" color={colors.muted} style={{ flex: 1 }}>
                {point}
              </AppText>
            </View>
          ))}
        </MotiView>
      </View>

      {/* Single terracotta CTA + text link to log in */}
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: motion.duration.transition, delay: 280 }}
        style={{ gap: spacing.lg }}
      >
        <PillButton
          label="Get started"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleGetStarted}
          trailingIcon={<Icon name="arrow-right" size={16} color={colors.onPrimary} />}
        />
        <View className="flex-row items-center justify-center" style={{ gap: spacing.xs }}>
          <AppText variant="caption" color={colors.muted}>
            Already have an account?
          </AppText>
          <TextLink label="Log in" size="sm" onPress={handleLogIn} />
        </View>
      </MotiView>
    </View>
  );
}
