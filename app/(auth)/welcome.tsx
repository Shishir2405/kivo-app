import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';

import { colors } from '@/theme/tokens';
import { useAuthStore, useUiStore } from '@/store';
import { mockProfile } from '@/data/mock';
import { AppText } from '@/components/ui/Typography';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { PillButton } from '@/components/ui/PillButton';
import { Tag } from '@/components/ui/Tag';
import { Neumorph } from '@/components/ui/Neumorph';
import { DotGridBackground } from '@/components/ui/DotGridBackground';
import { Icon } from '@/components/ui';
import { AvatarStack, FeatureRow } from '@/components/auth';

/**
 * Welcome / hero — the first surface a new user lands on.
 *
 * Neumorphic graphite-mist canvas + dot grid texture, the Kivo lockup, a fully
 * typographic Poppins-700 headline (vector Icon accent, ZERO emoji), three
 * value-prop FeatureRows, a brand AvatarStack social-proof row, and the yellow
 * + black PillButton CTA pair.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const setHasSeenWelcome = useUiStore((s) => s.setHasSeenWelcome);

  const handleGetStarted = () => {
    setHasSeenWelcome(true);
    router.push('/(auth)/register');
  };

  const handleLogIn = () => {
    setHasSeenWelcome(true);
    router.push('/(auth)/login');
  };

  // Quick-peek shortcut: hop straight into the app with the mock profile.
  const handleSkip = () => {
    setHasSeenWelcome(true);
    login({ user: mockProfile });
    router.replace('/(tabs)');
  };

  return (
    <DotGridBackground>
      <HeroContent
        onGetStarted={handleGetStarted}
        onLogIn={handleLogIn}
        onSkip={handleSkip}
      />
    </DotGridBackground>
  );
}

const FEATURES = [
  { icon: 'compass', label: 'Curated roadmaps — Striver, Blind 75, NeetCode 150', tone: 'signal' },
  { icon: 'repeat', label: 'Spaced-repetition revisions so it actually sticks', tone: 'peach' },
  { icon: 'flame', label: 'A streak that keeps you showing up every day', tone: 'annotation' },
] as const;

function HeroContent({
  onGetStarted,
  onLogIn,
  onSkip,
}: {
  onGetStarted: () => void;
  onLogIn: () => void;
  onSkip: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top + 22,
        paddingBottom: insets.bottom + 26,
        paddingHorizontal: 28,
      }}
    >
      {/* Brand lockup */}
      <MotiView
        from={{ opacity: 0, translateY: -8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 460 }}
        className="flex-row items-center justify-between"
      >
        <BrandLogo variant="lockup" size={30} />
        <Tag
          label="DSA, daily"
          tone="yellow"
          size="sm"
          icon={<Icon name="calendar-check" size={13} color="carbon" />}
        />
      </MotiView>

      {/* Hero block */}
      <View style={{ flex: 1, justifyContent: 'center', gap: 26 }}>
        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 520, delay: 120 }}
          style={{ gap: 18 }}
        >
          <View style={{ alignSelf: 'flex-start' }}>
            <Tag
              label="Your coding companion"
              tone="neutral"
              size="md"
              icon={<Icon name="sparkles" size={13} color="textMuted" />}
            />
          </View>

          {/* Fully typographic headline — vector Icon accent, no emoji. */}
          <View style={{ gap: 6 }}>
            <AppText variant="headingLg" weight="bold" display style={{ fontSize: 46, lineHeight: 50 }}>
              Crack DSA
            </AppText>
            <AppText variant="headingLg" weight="bold" display style={{ fontSize: 46, lineHeight: 50 }}>
              one problem
            </AppText>
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <AppText variant="headingLg" weight="bold" display style={{ fontSize: 46, lineHeight: 50 }}>
                a day
              </AppText>
              <MotiView
                from={{ opacity: 0, scale: 0.6, rotate: '-12deg' }}
                animate={{ opacity: 1, scale: 1, rotate: '0deg' }}
                transition={{ type: 'spring', damping: 12, stiffness: 170, delay: 320 }}
              >
                <Neumorph variant="raised" radius={16} intensity="md" surface={colors.highlighter}>
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="flame" size={28} color="carbon" strokeWidth={2.2} />
                  </View>
                </Neumorph>
              </MotiView>
            </View>
          </View>

          <AppText
            variant="subheading"
            weight="regular"
            color={colors.textMuted}
            style={{ maxWidth: 330 }}
          >
            Build the habit, land the offer. Kivo turns prep into a streak you
            never want to break.
          </AppText>
        </MotiView>

        {/* Value props */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 520, delay: 240 }}
        >
          <FeatureRow items={FEATURES.map((f) => ({ ...f }))} />
        </MotiView>

        {/* Social-proof avatar stack */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 520, delay: 340 }}
        >
          <AvatarStack overflow={9} />
        </MotiView>
      </View>

      {/* CTA pair — yellow primary stays FLAT, black companion below it */}
      <MotiView
        from={{ opacity: 0, translateY: 18 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 520, delay: 440 }}
        style={{ gap: 12 }}
      >
        <PillButton
          label="Get started"
          variant="yellow"
          size="lg"
          fullWidth
          onPress={onGetStarted}
          trailingIcon={<Icon name="arrow-right" size={20} color="carbon" />}
        />
        <PillButton
          label="Log in"
          variant="black"
          size="lg"
          fullWidth
          onPress={onLogIn}
        />

        <View className="flex-row items-center justify-center" style={{ marginTop: 4, gap: 6 }}>
          <AppText
            variant="caption"
            weight="medium"
            color={colors.textSubtle}
            onPress={onSkip}
            suppressHighlighting
          >
            Just looking around? Skip for now
          </AppText>
          <Icon name="chevron-right" size={15} color="textSubtle" />
        </View>
      </MotiView>
    </View>
  );
}
