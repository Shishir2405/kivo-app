import React, { useRef, useState } from 'react';
import { View, Pressable, type TextInput } from 'react-native';
import { useRouter } from 'expo-router';

import { colors } from '@/theme/tokens';
import { useAuthStore, useUiStore } from '@/store';
import { mockProfile } from '@/data/mock';
import { TODAY } from '@/data/mock';
import { AppText } from '@/components/ui/Typography';
import { PillButton } from '@/components/ui/PillButton';
import { SoftInput } from '@/components/ui/SoftInput';
import { Checkbox } from '@/components/ui/Checkbox';
import { Icon } from '@/components/ui';
import {
  AuthScaffold,
  PasswordField,
  SwitchAuthLink,
} from '@/components/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Register — name / email / password fields with a live strength meter, a
 * custom neumorphic Terms Checkbox (no native control), and submit. Vector
 * Icons throughout (ZERO emoji). On submit we flip the auth store with a profile
 * derived from the entered name and replace into (tabs).
 */
export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const pushToast = useUiStore((s) => s.pushToast);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    agreed?: string;
  }>({});

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const validate = () => {
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = 'Tell us your name';
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address';
    if (password.length < 6) next.password = 'Use at least 6 characters';
    if (!agreed) next.agreed = 'Please accept the Terms to continue';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const trimmedName = name.trim();
    const username =
      trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '') ||
      'kivo.user';
    register({
      token: 'mock-token',
      user: {
        ...mockProfile,
        name: trimmedName,
        username,
        email: email.trim(),
        streak: 0,
        longestStreak: 0,
        totalSolved: 0,
        xp: 0,
        level: 1,
        joinedAt: TODAY,
      },
    });
    pushToast({
      id: `joined-${Date.now()}`,
      message: `Welcome to Kivo, ${trimmedName.split(' ')[0]}!`,
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
      badgeIcon="rocket"
      badgeTone="signal"
      title="Start your streak"
      subtitle="Create your account and solve your first problem today."
      onBack={goBack}
      footer={
        <>
          <PillButton
            label="Create account"
            variant="yellow"
            size="lg"
            fullWidth
            onPress={handleSubmit}
            trailingIcon={<Icon name="arrow-right" size={20} color="carbon" />}
          />
          <SwitchAuthLink
            prompt="Already have an account?"
            action="Log in"
            onPress={() => router.replace('/(auth)/login')}
          />
        </>
      }
    >
      <SoftInput
        label="Name"
        placeholder="Aarav Mehta"
        value={name}
        onChangeText={(t) => {
          setName(t);
          if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
        }}
        error={errors.name}
        autoCapitalize="words"
        autoComplete="name"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        leading={<Icon name="user" size={20} color="textMuted" />}
      />

      <SoftInput
        ref={emailRef}
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
        placeholder="At least 6 characters"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
        }}
        error={errors.password}
        autoComplete="password-new"
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        showStrength
        leading={<Icon name="lock" size={20} color="textMuted" />}
      />

      {/* Custom neumorphic Terms agreement — never a native checkbox/radio. */}
      <View style={{ marginTop: 2, gap: 6 }}>
        <View className="flex-row items-start" style={{ gap: 12 }}>
          <Checkbox
            checked={agreed}
            onChange={(next) => {
              setAgreed(next);
              if (errors.agreed) setErrors((e) => ({ ...e, agreed: undefined }));
            }}
            style={{ marginTop: 1 }}
          />
          <Pressable
            style={{ flex: 1 }}
            hitSlop={4}
            onPress={() => {
              setAgreed((a) => !a);
              if (errors.agreed) setErrors((e) => ({ ...e, agreed: undefined }));
            }}
          >
            <AppText variant="caption" color={colors.textMuted} style={{ lineHeight: 20 }}>
              I agree to Kivo&apos;s{' '}
              <AppText variant="caption" weight="bold" color={colors.carbon}>
                Terms
              </AppText>{' '}
              and{' '}
              <AppText variant="caption" weight="bold" color={colors.carbon}>
                Privacy Policy
              </AppText>
              .
            </AppText>
          </Pressable>
        </View>
        {errors.agreed ? (
          <View className="flex-row items-center" style={{ gap: 6, marginLeft: 2 }}>
            <Icon name="alert" size={14} color="annotation" />
            <AppText variant="caption" color={colors.annotation}>
              {errors.agreed}
            </AppText>
          </View>
        ) : null}
      </View>
    </AuthScaffold>
  );
}
