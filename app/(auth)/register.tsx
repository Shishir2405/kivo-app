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
  Checkbox,
  AppHeader,
  Icon,
} from '@/components/ui';
import { GoogleSignInButton } from '@/components/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Three-segment password strength, matching the HTML register meter. */
function scoreThree(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s += 1;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) s += 1;
  return Math.min(s, 3);
}

/**
 * Register — matches the HTML "Create account" mockup, wired to the REAL auth
 * store.
 *
 * Back chevron, serif "Create your account" heading, name / email / password
 * fields with a three-segment strength meter, a Terms checkbox, the single
 * terracotta CTA, Continue with Google, and the Terms & Privacy footnote.
 * Dark-aware via useTheme() with a staggered entrance. Validation shows inline
 * field errors; an auth failure shows inline form error text. The store's
 * `register` NEVER throws, so submit can't crash — on success we replace to
 * (tabs).
 */
export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
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

  const strength = useMemo(() => scoreThree(password), [password]);

  const validate = () => {
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = 'Tell us your name';
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address';
    if (password.length < 8) next.password = 'Use at least 8 characters';
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
    else router.replace('/(auth)/login');
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

          {/* Heading block */}
          <MotiView {...ENTER.head} style={{ marginTop: spacing.lg, gap: spacing.xs }}>
            <AppText variant="headingLg" display>
              Create your account
            </AppText>
            <AppText variant="body" color={colors.muted} style={{ maxWidth: 320 }}>
              Start building your study habit today.
            </AppText>
          </MotiView>

          {/* Form — NOT wrapped in an animated view: re-rendering a MotiView on
              every keystroke remounts the focused TextInput on Android and bounces
              focus to the next field. A plain View keeps focus rock-solid. */}
          <View style={{ marginTop: spacing.xl, gap: spacing.lg }}>
            <SoftInput
              key="register-name"
              label="Name"
              placeholder="Aanya Sharma"
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
              key="register-email"
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

            <View style={{ gap: spacing.md }}>
              <SoftInput
                key="register-password"
                ref={passwordRef}
                label="Password"
                placeholder="At least 8 characters"
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
                    <Icon name={show ? 'eye-off' : 'eye'} size={17} color={colors.muted} />
                  </Pressable>
                }
              />

              {/* Three-segment strength meter — matches the HTML register meter */}
              <View className="flex-row" style={{ gap: spacing.xs }}>
                {[1, 2, 3].map((seg) => (
                  <MotiView
                    key={seg}
                    animate={{
                      backgroundColor:
                        seg <= strength ? colors.success : colors.hairline,
                    }}
                    transition={{ type: 'timing', duration: motion.duration.micro }}
                    style={{ flex: 1, height: 4, borderRadius: radii.pill }}
                  />
                ))}
              </View>
            </View>

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
                  <AppText variant="caption" color={colors.muted} style={{ lineHeight: 18 }}>
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
                  <Icon name="alert" size={14} color={colors.danger} />
                  <AppText variant="caption" color={colors.danger}>
                    {errors.agreed}
                  </AppText>
                </View>
              ) : null}
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
          <MotiView {...ENTER.actions} style={{ marginTop: spacing.lg, gap: spacing.md }}>
            <PillButton
              label={loading ? 'Creating account…' : 'Create account'}
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
              onPress={handleSubmit}
            />
            <AppText
              variant="caption"
              color={colors.muted}
              style={{ textAlign: 'center', lineHeight: 18 }}
            >
              By continuing you agree to our Terms &amp; Privacy Policy.
            </AppText>

            <GoogleSignInButton
              disabled={loading}
              onError={(msg) => setFormError(msg || null)}
              onSuccess={() => router.replace('/(tabs)')}
            />
          </MotiView>

          {/* Footer */}
          <MotiView
            {...ENTER.footer}
            style={{ marginTop: 'auto', paddingTop: spacing.xl }}
          >
            <View className="flex-row items-center justify-center" style={{ gap: spacing.xs }}>
              <AppText variant="caption" color={colors.muted}>
                Already have an account?
              </AppText>
              <TextLink
                label="Log in"
                size="sm"
                onPress={() => router.replace('/(auth)/login')}
              />
            </View>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
