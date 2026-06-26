import React, { useRef, useState } from 'react';
import { View, Pressable, type TextInput } from 'react-native';
import { useRouter } from 'expo-router';

import { colors } from '@/theme/tokens';
import { useAuthStore, useUiStore } from '@/store';
import { mockProfile } from '@/data/mock';
import { AppText } from '@/components/ui/Typography';
import { PillButton } from '@/components/ui/PillButton';
import { SoftInput } from '@/components/ui/SoftInput';
import { Icon } from '@/components/ui';
import {
  AuthScaffold,
  PasswordField,
  SwitchAuthLink,
} from '@/components/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Log in — email + password fields, yellow PillButton submit, link to register.
 * Vector Icons throughout (ZERO emoji). On submit we flip the auth store and
 * replace into (tabs).
 */
export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const pushToast = useUiStore((s) => s.pushToast);

  const [email, setEmail] = useState('aarav@kivo.app');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const passwordRef = useRef<TextInput>(null);

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address';
    if (password.length < 6) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    login({ token: 'mock-token', user: { ...mockProfile, email: email.trim() } });
    pushToast({
      id: `welcome-${Date.now()}`,
      message: `Welcome back, ${mockProfile.name.split(' ')[0]}!`,
      tone: 'success',
    });
    router.replace('/(tabs)');
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(auth)/welcome');
  };

  return (
    <AuthScaffold
      badgeIcon="flame"
      badgeTone="highlighter"
      title="Welcome back"
      subtitle="Log in to keep your streak alive and pick up right where you left off."
      onBack={goBack}
      footer={
        <>
          <PillButton
            label="Log in"
            variant="yellow"
            size="lg"
            fullWidth
            onPress={handleSubmit}
            trailingIcon={<Icon name="arrow-right" size={20} color="carbon" />}
          />
          <SwitchAuthLink
            prompt="New to Kivo?"
            action="Create an account"
            onPress={() => router.replace('/(auth)/register')}
          />
        </>
      }
    >
      <SoftInput
        label="Email"
        placeholder="you@kivo.app"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
        }}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        leading={<Icon name="mail" size={20} color="textMuted" />}
      />

      <PasswordField
        ref={passwordRef}
        label="Password"
        placeholder="Your password"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
        }}
        error={errors.password}
        autoComplete="password"
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        leading={<Icon name="lock" size={20} color="textMuted" />}
      />

      <View className="flex-row justify-end">
        <Pressable hitSlop={6}>
          <AppText variant="caption" weight="medium" color={colors.signal}>
            Forgot password?
          </AppText>
        </Pressable>
      </View>
    </AuthScaffold>
  );
}
