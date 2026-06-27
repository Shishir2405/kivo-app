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
  Checkbox,
  AppHeader,
  Icon,
} from '@/components/ui';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Register — a small Steep form wired to the REAL auth store.
 *
 * Name / email / password fields and a Terms checkbox. Validation shows inline
 * field errors; an auth failure shows inline form error text. The store's
 * `register` NEVER throws, so submit can't crash the app — on success we
 * `router.replace('/(tabs)')`.
 */
export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    agreed?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  const validate = () => {
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = 'Tell us your name';
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address';
    if (password.length < 6) next.password = 'Use at least 6 characters';
    if (!agreed) next.agreed = 'Please accept the Terms to continue';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (loading) return;
    if (!validate()) return;
    const result = await register(email.trim(), password, name.trim());
    if (result.ok) {
      router.replace('/(tabs)');
    } else {
      setFormError(result.error ?? 'Could not create your account. Please try again.');
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

          {/* Heading block */}
          <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
            <AppText variant="headingLg" display>
              Start your streak
            </AppText>
            <AppText variant="body" color={colors.ash} style={{ maxWidth: 320 }}>
              Create your account and solve your first problem today.
            </AppText>
          </View>

          {/* Form */}
          <View style={{ marginTop: spacing.xxl, gap: spacing.lg }}>
            <SoftInput
              label="Name"
              placeholder="Aarav Mehta"
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
                if (formError) setFormError(null);
              }}
              error={errors.name}
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />

            <SoftInput
              ref={emailRef}
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
              placeholder="At least 6 characters"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                if (formError) setFormError(null);
              }}
              error={errors.password}
              secureTextEntry={!show}
              autoCapitalize="none"
              autoComplete="password-new"
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

            {/* Terms agreement */}
            <View style={{ gap: spacing.xs }}>
              <View className="flex-row items-start" style={{ gap: spacing.md }}>
                <Checkbox
                  checked={agreed}
                  onChange={(next) => {
                    setAgreed(next);
                    if (errors.agreed) setErrors((e) => ({ ...e, agreed: undefined }));
                  }}
                />
                <Pressable
                  style={{ flex: 1 }}
                  hitSlop={4}
                  onPress={() => {
                    setAgreed((a) => !a);
                    if (errors.agreed) setErrors((e) => ({ ...e, agreed: undefined }));
                  }}
                >
                  <AppText variant="caption" color={colors.ash} style={{ lineHeight: 18 }}>
                    I agree to Kivo&apos;s{' '}
                    <AppText variant="caption" weight="medium" color={colors.ink}>
                      Terms
                    </AppText>{' '}
                    and{' '}
                    <AppText variant="caption" weight="medium" color={colors.ink}>
                      Privacy Policy
                    </AppText>
                    .
                  </AppText>
                </Pressable>
              </View>
              {errors.agreed ? (
                <View className="flex-row items-center" style={{ gap: spacing.sm }}>
                  <Icon name="alert" size={14} color="danger" />
                  <AppText variant="caption" color={colors.danger}>
                    {errors.agreed}
                  </AppText>
                </View>
              ) : null}
            </View>

            {formError ? (
              <View className="flex-row items-center" style={{ gap: spacing.sm }}>
                <Icon name="alert" size={15} color="danger" />
                <AppText variant="caption" color={colors.danger} style={{ flex: 1 }}>
                  {formError}
                </AppText>
              </View>
            ) : null}
          </View>

          {/* Footer */}
          <View style={{ marginTop: 'auto', paddingTop: spacing.xxl, gap: spacing.lg }}>
            <PillButton
              label={loading ? 'Creating account…' : 'Create account'}
              variant="black"
              size="lg"
              fullWidth
              disabled={loading}
              onPress={handleSubmit}
            />
            <View className="flex-row items-center justify-center" style={{ gap: spacing.xs }}>
              <AppText variant="caption" color={colors.graphite}>
                Already have an account?
              </AppText>
              <TextLink
                label="Log in"
                size="sm"
                onPress={() => router.replace('/(auth)/login')}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
