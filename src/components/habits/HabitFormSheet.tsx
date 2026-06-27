import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { FormSheet } from '@/components/ui/FormSheet';
import { SoftInput } from '@/components/ui/SoftInput';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { AppText } from '@/components/ui/Typography';
import { useTheme } from '@/theme';
import { useCreateHabit, useUpdateHabit } from '@/hooks/api';
import type { Habit } from '@/types/models';

/* ------------------------------------------------------------------ */
/* HabitFormSheet — the ONE create/edit sheet for habits.              */
/*                                                                     */
/* Wraps the shared FormSheet. With `habit` set it edits via            */
/* useUpdateHabit, otherwise it creates via useCreateHabit. Fields are   */
/* plain Views/SoftInputs (never inside a MotiView).                     */
/* ------------------------------------------------------------------ */

type TargetValue = '3' | '5' | '7';

const TARGET_OPTIONS: SegmentedOption<TargetValue>[] = [
  { label: '3 / wk', value: '3' },
  { label: '5 / wk', value: '5' },
  { label: 'Daily', value: '7' },
];

function nearestTarget(n: number): TargetValue {
  if (n >= 7) return '7';
  if (n >= 5) return '5';
  return '3';
}

/* ------------------------------------------------------------------ */
/* Validation — mirrors the backend habits.validator.ts rules.         */
/*  name (title): required, min 1, max 120                              */
/*  target:       a fixed 3/5/7 segmented choice → always valid        */
/* ------------------------------------------------------------------ */

const NAME_MAX = 120;

type HabitErrors = {
  title?: string;
};

function validateHabit(fields: { title: string }): HabitErrors {
  const errors: HabitErrors = {};
  const name = fields.title.trim();
  if (name.length === 0) errors.title = 'Name is required';
  else if (name.length > NAME_MAX)
    errors.title = `Name must be at most ${NAME_MAX} characters`;
  return errors;
}

export type HabitFormSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** When set, edits this habit; otherwise creates a new one. */
  habit?: Habit | null;
};

export function HabitFormSheet({ visible, onClose, habit }: HabitFormSheetProps) {
  const { colors } = useTheme();
  const isEdit = !!habit;

  const create = useCreateHabit();
  const update = useUpdateHabit();
  const active = isEdit ? update : create;

  const [title, setTitle] = useState('');
  const [target, setTarget] = useState<TargetValue>('7');

  // Per-field errors (shown after a submit attempt; cleared as fixed).
  const [errors, setErrors] = useState<HabitErrors>({});

  useEffect(() => {
    if (!visible) return;
    setErrors({});
    create.reset();
    update.reset();
    if (habit) {
      setTitle(habit.title ?? '');
      setTarget(nearestTarget(habit.targetPerWeek ?? 7));
    } else {
      setTitle('');
      setTarget('7');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, habit?.id]);

  // Live validity drives the disabled state of the submit button.
  const liveErrors = validateHabit({ title });
  const canSubmit = Object.keys(liveErrors).length === 0;

  const apiError = useMemo(
    () => (isEdit ? update.error?.message : create.error?.message) ?? null,
    [isEdit, create.error, update.error],
  );

  const clearError = (field: keyof HabitErrors) =>
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const submit = () => {
    const found = validateHabit({ title });
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setErrors({});

    const trimmedTitle = title.trim();
    const targetPerWeek = Number(target);

    if (isEdit && habit) {
      update.mutate(
        { id: habit.id, patch: { title: trimmedTitle, targetPerWeek } },
        { onSuccess: onClose },
      );
    } else {
      create.mutate(
        { title: trimmedTitle, targetPerWeek },
        { onSuccess: onClose },
      );
    }
  };

  return (
    <FormSheet
      visible={visible}
      onClose={onClose}
      onSubmit={submit}
      title={isEdit ? 'Edit habit' : 'New habit'}
      subtitle={
        isEdit ? 'Update the details below.' : 'Pick one routine and grow the streak.'
      }
      submitLabel={isEdit ? 'Save changes' : 'Add habit'}
      pending={active.isPending}
      submitDisabled={!canSubmit}
      error={apiError}
    >
      <SoftInput
        label="Habit name"
        placeholder="e.g. Read for 20 minutes"
        value={title}
        onChangeText={(t) => {
          setTitle(t);
          clearError('title');
        }}
        autoFocus={!isEdit}
        returnKeyType="done"
        maxLength={NAME_MAX}
        error={errors.title}
      />

      <View>
        <AppText
          variant="caption"
          color={colors.muted}
          weight="medium"
          style={{ marginBottom: 6 }}
        >
          Weekly target
        </AppText>
        <SegmentedTabs options={TARGET_OPTIONS} value={target} onChange={setTarget} />
      </View>
    </FormSheet>
  );
}

export default HabitFormSheet;
