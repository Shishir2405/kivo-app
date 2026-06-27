/**
 * Edit Profile (Kivo).
 *
 * A focused editor for the signed-in user's identity — name, bio and the
 * self-set daily problem goal — wired to PATCH /users/me via `useUpdateProfile`.
 * Seeded from the live `/auth/me` payload (read through `useProfile`), with a
 * loading / error state on the read and inline validation + surfaced API errors
 * on the write. On success it refreshes both the `profile` and `account` queries
 * (the profile/settings screens read the latter) and pops back.
 *
 * GUARDRAILS honoured:
 *  - all color from useTheme() (light + dark),
 *  - the editable text fields live in PLAIN <View>s (never a MotiView),
 *  - submit validates, disables while pending, surfaces API errors inline,
 *    and never crashes the screen.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { AppText } from '@/components/ui/Typography';
import { SoftInput } from '@/components/ui/SoftInput';
import { PillButton, TextLink } from '@/components/ui/PillButton';
import { Stepper } from '@/components/ui/Stepper';
import { Icon } from '@/components/ui/Icon';
import { AppHeader } from '@/components/ui/AppHeader';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';

import { Eyebrow } from '@/components/account/SteepParts';

import { spacing, radii } from '@/theme/tokens';
import { useTheme } from '@/theme';
import { useProfile, useUpdateProfile } from '@/hooks/api';

// Backend: displayName min 1 / max 120, bio is free text. We keep tighter,
// sensible UX caps (name 60, bio 240) which stay well inside the backend max.
const NAME_MIN = 1;
const NAME_MAX = 60;
const BIO_MAX = 240;
// Backend dailyProblemGoal: integer 0–100. UI stepper is bounded 1–20, but we
// validate the wider numeric contract too so it can never POST out of range.
const GOAL_MIN = 1;
const GOAL_MAX = 100;

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, toneStyle } = useTheme();
  const qc = useQueryClient();

  const profile = useProfile();
  const update = useUpdateProfile();
  const p = profile.data;

  // Local form state, seeded once from the live profile.
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [dailyGoal, setDailyGoal] = useState(3);
  const [seeded, setSeeded] = useState(false);
  const [touched, setTouched] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!p || seeded) return;
    setName(p.name ?? '');
    setBio(p.bio ?? '');
    setDailyGoal(p.dailyGoal ?? 3);
    setSeeded(true);
  }, [p, seeded]);

  const mint = toneStyle('mint');
  const initial = (name.trim().slice(0, 1) || p?.name?.slice(0, 1) || 'K').toUpperCase();

  // ---- Per-field validation (matches the backend contract) ----
  const trimmedName = name.trim();
  const nameRequiredErr =
    trimmedName.length < NAME_MIN ? 'Name is required' : undefined;
  const nameTooLong =
    trimmedName.length > NAME_MAX
      ? `Name must be at most ${NAME_MAX} characters`
      : undefined;
  // Required error only surfaces once touched; length errors surface live.
  const nameError = nameTooLong ?? (touched ? nameRequiredErr : undefined);

  const bioTooLong =
    bio.trim().length > BIO_MAX ? `Bio must be at most ${BIO_MAX} characters` : undefined;

  const goalOutOfRange =
    !Number.isInteger(dailyGoal) || dailyGoal < GOAL_MIN || dailyGoal > GOAL_MAX
      ? `Daily goal must be a whole number between ${GOAL_MIN} and ${GOAL_MAX}`
      : undefined;

  // What actually changed vs. the seeded profile.
  const dirty = useMemo(() => {
    if (!p) return false;
    return (
      name.trim() !== (p.name ?? '') ||
      bio.trim() !== (p.bio ?? '') ||
      dailyGoal !== (p.dailyGoal ?? 3)
    );
  }, [p, name, bio, dailyGoal]);

  const formValid = !nameRequiredErr && !nameTooLong && !bioTooLong && !goalOutOfRange;
  const canSubmit = formValid && dirty && !update.isPending;

  const submit = () => {
    setTouched(true);
    setLocalError(null);
    if (nameRequiredErr) {
      setLocalError(nameRequiredErr);
      return;
    }
    if (nameTooLong || bioTooLong || goalOutOfRange) {
      setLocalError(
        nameTooLong ?? bioTooLong ?? goalOutOfRange ?? 'Please fix the highlighted fields',
      );
      return;
    }
    update.mutate(
      { name: trimmedName, bio: bio.trim(), dailyGoal },
      {
        onSuccess: () => {
          // Profile + Settings screens read the mapped `account` query.
          void qc.invalidateQueries({ queryKey: ['account', 'me'] });
          router.back();
        },
      },
    );
  };

  const error = localError ?? (update.isError ? update.error?.message ?? 'Could not save your profile' : null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <AppHeader
          title="Edit profile"
          onBack={() => router.back()}
          withInset
          right={
            <TextLink
              label="Save"
              onPress={submit}
              disabled={!canSubmit}
              icon={<Icon name="check" size={15} color={canSubmit ? 'primary' : 'muted'} />}
            />
          }
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
      >
        <View style={{ marginBottom: spacing.xl, gap: 2 }}>
          <Eyebrow label="Your identity" />
          <AppText variant="headingLg" display weight="medium">
            Make Kivo yours
          </AppText>
        </View>

        {/* ---------- Read state: loading / error ---------- */}
        {profile.isLoading && !p ? (
          <View style={{ gap: spacing.xl }}>
            <View style={{ alignItems: 'center', gap: spacing.md }}>
              <Skeleton width={78} height={78} radius={9999} />
              <Skeleton width={140} height={16} radius={8} />
            </View>
            <SkeletonText lines={3} />
          </View>
        ) : profile.isError && !p ? (
          <View
            style={{
              padding: spacing.lg,
              borderRadius: radii.card,
              backgroundColor: colors.dangerWash,
              borderWidth: 1,
              borderColor: colors.danger,
              gap: spacing.sm,
            }}
          >
            <AppText variant="subheading" weight="medium" color={colors.danger}>
              Couldn&rsquo;t load your profile
            </AppText>
            <AppText variant="caption" color={colors.muted}>
              {profile.error?.message ?? 'Please try again.'}
            </AppText>
            <View style={{ alignSelf: 'flex-start', marginTop: spacing.xs }}>
              <TextLink
                label="Try again"
                onPress={() => void profile.refetch()}
                icon={<Icon name="refresh" size={14} color="ink" />}
              />
            </View>
          </View>
        ) : (
          <>
            {/* ---------- Avatar preview (initials) ---------- */}
            <View style={{ alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl }}>
              <View
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 9999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: mint.bg,
                  borderWidth: 1,
                  borderColor: mint.border,
                }}
              >
                <AppText variant="headingLg" display weight="semibold" color={mint.accent}>
                  {initial}
                </AppText>
              </View>
              {p?.email ? (
                <AppText variant="caption" color={colors.muted}>
                  {p.email}
                </AppText>
              ) : null}
            </View>

            {/* ---------- Fields — PLAIN Views only ---------- */}
            <View style={{ gap: spacing.lg }}>
              <View>
                <SoftInput
                  label="Display name"
                  value={name}
                  onChangeText={(v) => {
                    setName(v);
                    if (!touched) setTouched(true);
                    if (localError) setLocalError(null);
                  }}
                  placeholder="Your name"
                  maxLength={NAME_MAX + 1}
                  autoCapitalize="words"
                  returnKeyType="next"
                  error={nameError}
                />
              </View>

              <View>
                <SoftInput
                  label="Bio"
                  value={bio}
                  onChangeText={(v) => {
                    setBio(v);
                    if (localError) setLocalError(null);
                  }}
                  placeholder="A line about what you're working toward"
                  multiline
                  numberOfLines={3}
                  maxLength={BIO_MAX + 1}
                  style={{ minHeight: 72, textAlignVertical: 'top' }}
                  error={bioTooLong}
                />
                <AppText
                  variant="caption"
                  color={bio.length > BIO_MAX ? colors.danger : colors.muted}
                  style={{ marginTop: 6, textAlign: 'right' }}
                >
                  {bio.length}/{BIO_MAX}
                </AppText>
              </View>

              {/* Daily goal stepper (mirrors the profile/preferences daily goal). */}
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: spacing.md,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.md,
                    borderRadius: radii.card,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: goalOutOfRange ? colors.danger : colors.hairline,
                  }}
                >
                  <View style={{ flex: 1, gap: 1 }}>
                    <AppText variant="subheading" weight="regular">
                      Daily goal
                    </AppText>
                    <AppText variant="caption" color={colors.muted}>
                      Problems to solve each day
                    </AppText>
                  </View>
                  <Stepper
                    value={dailyGoal}
                    onChange={(v) => {
                      setDailyGoal(v);
                      if (localError) setLocalError(null);
                    }}
                    min={GOAL_MIN}
                    max={20}
                    suffix="/ day"
                  />
                </View>
                {goalOutOfRange ? (
                  <AppText variant="caption" color={colors.danger} style={{ marginTop: 6 }}>
                    {goalOutOfRange}
                  </AppText>
                ) : null}
              </View>
            </View>

            {/* ---------- Inline error ---------- */}
            {error ? (
              <View
                style={{
                  marginTop: spacing.lg,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  borderRadius: radii.input,
                  backgroundColor: colors.dangerWash,
                  borderWidth: 1,
                  borderColor: colors.danger,
                }}
              >
                <AppText variant="caption" color={colors.danger}>
                  {error}
                </AppText>
              </View>
            ) : null}

            {/* ---------- Save / Cancel ---------- */}
            <View style={{ marginTop: spacing.xl, gap: spacing.md, alignItems: 'center' }}>
              <PillButton
                label={update.isPending ? 'Saving…' : 'Save changes'}
                onPress={submit}
                disabled={!canSubmit}
                icon={
                  update.isPending ? undefined : <Icon name="check" size={15} color="onPrimary" />
                }
                fullWidth
              />
              <TextLink label="Cancel" onPress={() => router.back()} muted disabled={update.isPending} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
