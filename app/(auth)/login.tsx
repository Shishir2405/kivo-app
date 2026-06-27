import React, { useRef, useState } from 'react';
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

import { colors, spacing } from '@/theme/tokens';
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

/** Small Steep "or" divider — two Dove hairlines with a quiet caption. */
function OrDivider() {
  return (
    <View className="flex-row items-center" style={{ gap: spacing.md }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.dove, opacity: 0.6 }} />
      <AppText variant="caption" color={colors.graphite}>
        or
      </AppText>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.dove, opacity: 0.6 }} />
    </View>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Log in — a small Steep form wired to the REAL auth store.
 *
 * Email + password fields, the single Ink CTA, and a text link to register.
 * Validation shows inline field errors; an auth failure shows inline form error
 * text. The store's `login` NEVER throws, so submit can't crash the app — on
 * success we `router.replace('/(tabs)')`.
 */
export default function LoginScreen() {
  const router = useRouter();
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
    else router.replace('/(auth)/welcome');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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

          {/* Heading block */}
          <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
            <AppText variant="headingLg" display>
              Welcome back
            </AppText>
            <AppText variant="body" color={colors.ash} style={{ maxWidth: 320 }}>
              Log in to keep your streak alive and pick up where you left off.
            </AppText>
          </View>

          {/* Continue with Google — primary social option, on top */}
          <View style={{ marginTop: spacing.xl, gap: spacing.lg }}>
            <GoogleSignInButton
              disabled={loading}
              onError={(msg) => setFormError(msg || null)}
              onSuccess={() => router.replace('/(tabs)')}
            />
            <OrDivider />
          </View>

          {/* Form */}
          <View style={{ marginTop: spacing.lg, gap: spacing.lg }}>
            <SoftInput
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

            <SoftInput
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
                  <Icon name={show ? 'eye-off' : 'eye'} size={17} color="graphite" />
                </Pressable>
              }
            />

            {formError ? (
              <View className="flex-row items-center" style={{ gap: spacing.sm }}>
                <Icon name="alert" size={15} color="danger" />
                <AppText variant="caption" color={colors.danger} style={{ flex: 1 }}>
                  {formError}
                </AppText>
              </View>
            ) : null}
          </View>

          {/* Primary action — sits directly under the form so it stays visible above the keyboard */}
          <View style={{ marginTop: spacing.xl, gap: spacing.lg }}>
            <PillButton
              label={loading ? 'Signing in…' : 'Log in'}
              variant="black"
              size="lg"
              fullWidth
              disabled={loading}
              onPress={handleSubmit}
            />

            <View className="flex-row items-center justify-center" style={{ gap: spacing.xs }}>
              <AppText variant="caption" color={colors.graphite}>
                New to Kivo?
              </AppText>
              <TextLink
                label="Create an account"
                size="sm"
                onPress={() => router.replace('/(auth)/register')}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
