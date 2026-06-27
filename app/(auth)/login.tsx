import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';

import { spacing, radii, motion } from '@/theme/tokens';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/store';
import {
  AppText,
  PillButton,
  TextLink,
  SoftInput,
  AppHeader,
  Icon,
} from '@/components/ui';
import { GoogleSignInButton } from '@/components/auth';

/** Small "or" divider — two hairlines with a quiet caption. */
function OrDivider() {
  const { colors } = useTheme();
  return (
    <View className="flex-row items-center" style={{ gap: spacing.md }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.hairline }} />
      <AppText variant="caption" color={colors.muted}>
        or
      </AppText>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.hairline }} />
    </View>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Log in — matches the HTML "Log in" mockup, wired to the REAL auth store.
 *
 * Terracotta ring badge, serif "Welcome back" heading, email + password fields,
 * the single terracotta CTA, an "or" divider, Continue with Google, and a
 * "New here? Create account" footer.
 * Dark-aware via useTheme() with a staggered entrance. Validation shows inline
 * field errors; an auth failure shows inline form error text. The store's
 * `login` NEVER throws, so submit can't crash — on success we replace to (tabs).
 */
export default function LoginScreen() {
  const router = useRouter();
  const { colors, shadow } = useTheme();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address';
    if (password.length < 6) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (loading) return;
    if (!validate()) return;
    const result = await login(email.trim(), password);
    if (result.ok) {
      router.replace('/(tabs)');
    } else {
      setFormError(result.error ?? 'Could not sign in. Please try again.');
    }
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(auth)/onboarding');
  };

  // Memoized once so each MotiView keeps a STABLE prop reference across
  // re-renders. Recreating these objects on every keystroke can make Moti
  // re-process and steal focus from the field you're typing in.
  const ENTER = useMemo(() => {
    const e = (delay: number) =>
      ({
        from: { opacity: 0, translateY: 8 },
        animate: { opacity: 1, translateY: 0 },
        transition: { type: 'timing', duration: motion.duration.transition, delay },
      }) as const;
    return { head: e(60), form: e(140), actions: e(220), footer: e(300) };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        // iOS: pad for the keyboard. Android: rely on native windowSoftInputMode
        // `adjustResize` + the ScrollView — using `height` here double-resizes the
        // container and makes the focused field jump around while typing.
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing.xl,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppHeader onBack={goBack} hideMark />

          {/* Badge + heading block — matches the HTML terracotta ring tile */}
          <MotiView {...ENTER.head} style={{ marginTop: spacing.lg, gap: spacing.lg }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: radii.frame,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                ...shadow,
              }}
            >
              <View
                style={{
                  width: 15,
                  height: 15,
                  borderRadius: 8,
                  borderWidth: 2.5,
                  borderColor: colors.peach,
                }}
              />
            </View>
            <View style={{ gap: spacing.xs }}>
              <AppText variant="headingLg" display>
                Welcome back
              </AppText>
              <AppText variant="body" color={colors.muted} style={{ maxWidth: 320 }}>
                Let&apos;s keep the streak alive.
              </AppText>
            </View>
          </MotiView>

          {/* Form — NOT wrapped in an animated view: re-rendering a MotiView on
              every keystroke remounts the focused TextInput on Android and bounces
              focus to the next field. A plain View keeps focus rock-solid. */}
          <View style={{ marginTop: spacing.xl, gap: spacing.lg }}>
            <SoftInput
              key="login-email"
              label="Email"
              placeholder="you@kivo.app"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
                if (formError) setFormError(null);
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <View style={{ gap: spacing.sm }}>
              <SoftInput
                key="login-password"
                ref={passwordRef}
                label="Password"
                placeholder="Your password"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                  if (formError) setFormError(null);
                }}
                error={errors.password}
                secureTextEntry={!show}
                autoCapitalize="none"
                autoComplete="password"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                trailing={
                  <Pressable
                    onPress={() => setShow((v) => !v)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={show ? 'Hide password' : 'Show password'}
                  >
                    <Icon name={show ? 'eye-off' : 'eye'} size={17} color={colors.muted} />
                  </Pressable>
                }
              />
            </View>

            {formError ? (
              <View className="flex-row items-center" style={{ gap: spacing.sm }}>
                <Icon name="alert" size={15} color={colors.danger} />
                <AppText variant="caption" color={colors.danger} style={{ flex: 1 }}>
                  {formError}
                </AppText>
              </View>
            ) : null}
          </View>

          {/* Primary action + social */}
          <MotiView {...ENTER.actions} style={{ marginTop: spacing.lg, gap: spacing.lg }}>
            <PillButton
              label={loading ? 'Signing in…' : 'Log in'}
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
              onPress={handleSubmit}
            />

            <OrDivider />

            <GoogleSignInButton
              disabled={loading}
              onError={(msg) => setFormError(msg || null)}
              onSuccess={() => router.replace('/(tabs)')}
            />
          </MotiView>

          {/* Footer — pinned to bottom of the scroll area */}
          <MotiView
            {...ENTER.footer}
            style={{ marginTop: 'auto', paddingTop: spacing.xl }}
          >
            <View className="flex-row items-center justify-center" style={{ gap: spacing.xs }}>
              <AppText variant="caption" color={colors.muted}>
                New here?
              </AppText>
              <TextLink
                label="Create account"
                size="sm"
                onPress={() => router.replace('/(auth)/register')}
              />
            </View>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
