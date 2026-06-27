import React from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';

import { Neumorph } from '@/components/ui/Neumorph';
import { SoftIconButton } from '@/components/ui/SoftIconButton';
import { DotGridBackground } from '@/components/ui/DotGridBackground';
import { Icon, type IconName } from '@/components/ui';
import { AppText } from '@/components/ui/Typography';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { useTheme } from '@/theme';

export type AuthScaffoldProps = {
  /** Icon shown in the raised badge tile above the heading. */
  badgeIcon: IconName;
  /** Tone token used to wash the badge icon. */
  badgeTone?: 'highlighter' | 'signal' | 'peach' | 'success';
  title: string;
  subtitle: string;
  onBack: () => void;
  /** Form body (inputs etc.). */
  children: React.ReactNode;
  /** Pinned footer block (CTA + switch link). */
  footer: React.ReactNode;
};

/**
 * Shared neumorphic scaffold for the login + register screens.
 *
 * Provides the dot-grid canvas, keyboard handling, a soft back button + brand
 * lockup top bar, an animated icon-badge heading block (vector Icon, never an
 * emoji), a scrollable form region, and a pinned footer. Keeps the two auth
 * forms perfectly consistent.
 */
export function AuthScaffold({
  badgeIcon,
  badgeTone = 'highlighter',
  title,
  subtitle,
  onBack,
  children,
  footer,
}: AuthScaffoldProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Wash the badge tile from the active palette (dark-aware).
  const badgeWash: Record<NonNullable<AuthScaffoldProps['badgeTone']>, string> = {
    highlighter: colors.butter,
    signal: colors.sky,
    peach: colors.peach,
    success: colors.successWash,
  };

  return (
    <DotGridBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 14,
            paddingBottom: insets.bottom + 28,
            paddingHorizontal: 28,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar: back + lockup */}
          <View className="flex-row items-center justify-between">
            <SoftIconButton onPress={onBack} accessibilityLabel="Go back" size={46}>
              <Icon name="arrow-left" size={20} color="carbon" />
            </SoftIconButton>
            <BrandLogo variant="mark" size={28} />
          </View>

          {/* Heading block with an icon badge */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 460 }}
            style={{ marginTop: 34, gap: 18 }}
          >
            <MotiView
              from={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 13, stiffness: 180, delay: 80 }}
              style={{ alignSelf: 'flex-start' }}
            >
              <Neumorph variant="raised" radius={20} intensity="md" surface={badgeWash[badgeTone]}>
                <View
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={badgeIcon} size={28} color={badgeTone} strokeWidth={2.2} />
                </View>
              </Neumorph>
            </MotiView>

            <View style={{ gap: 10 }}>
              <AppText variant="heading" weight="bold" display>
                {title}
              </AppText>
              <AppText variant="body" color={colors.textMuted} style={{ maxWidth: 330 }}>
                {subtitle}
              </AppText>
            </View>
          </MotiView>

          {/* Form */}
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 140 }}
            style={{ marginTop: 30, gap: 18 }}
          >
            {children}
          </MotiView>

          {/* Footer (pinned to bottom of the scroll area) */}
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 240 }}
            style={{ marginTop: 'auto', paddingTop: 28, gap: 16 }}
          >
            {footer}
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </DotGridBackground>
  );
}

export default AuthScaffold;
