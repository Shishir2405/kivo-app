import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { FormSheet } from '@/components/ui/FormSheet';
import { SoftInput } from '@/components/ui/SoftInput';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { AppText } from '@/components/ui/Typography';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme';
import { useCreateTask, useUpdateTask } from '@/hooks/api';
import type { Task, Priority } from '@/types/models';

/* ------------------------------------------------------------------ */
/* TaskFormSheet — the ONE create/edit sheet for tasks.                */
/*                                                                     */
/* Wraps the shared FormSheet. When `task` is provided it edits via     */
/* useUpdateTask, otherwise it creates via useCreateTask. The caller    */
/* owns visibility; this owns the fields, validation, pending + error.  */
/* All fields are plain Views/SoftInputs (never in a MotiView).         */
/* ------------------------------------------------------------------ */

const PRIORITY_OPTIONS: SegmentedOption<Priority>[] = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
];

/* ------------------------------------------------------------------ */
/* Validation — mirrors the backend tasks.validator.ts rules.          */
/*  title:    required, min 1, max 200                                  */
/*  dueDate:  optional, YYYY-MM-DD and a real calendar date            */
/*  notes:    optional (maps to description), max 5000                  */
/* Update is partial on the backend; the form only sends changed/known */
/* fields, so the same per-field rules apply when a field is present.   */
/* ------------------------------------------------------------------ */

const TITLE_MAX = 200;
const NOTES_MAX = 5000;

/** Strict YYYY-MM-DD shape. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** True for a YYYY-MM-DD string that is also a real calendar date. */
function isRealDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
  );
}

type TaskErrors = {
  title?: string;
  dueDate?: string;
  notes?: string;
};

function validateTask(fields: {
  title: string;
  dueDate: string;
  notes: string;
}): TaskErrors {
  const errors: TaskErrors = {};

  const title = fields.title.trim();
  if (title.length === 0) errors.title = 'Title is required';
  else if (title.length > TITLE_MAX)
    errors.title = `Title must be at most ${TITLE_MAX} characters`;

  const due = fields.dueDate.trim();
  if (due.length > 0 && !isRealDate(due))
    errors.dueDate = 'Enter a valid date like 2026-06-30';

  const notes = fields.notes.trim();
  if (notes.length > NOTES_MAX)
    errors.notes = `Notes must be at most ${NOTES_MAX} characters`;

  return errors;
}

export type TaskFormSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** When set, the sheet edits this task; otherwise it creates a new one. */
  task?: Task | null;
  /** Optional title prefill for the create path (e.g. quick-add). */
  initialTitle?: string;
};

export function TaskFormSheet({ visible, onClose, task, initialTitle }: TaskFormSheetProps) {
  const { colors } = useTheme();
  const isEdit = !!task;

  const create = useCreateTask();
  const update = useUpdateTask();
  const active = isEdit ? update : create;

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Per-field errors (only shown after a submit attempt / once a field is dirty).
  const [errors, setErrors] = useState<TaskErrors>({});

  // Reset / hydrate the form whenever the sheet opens or the target changes.
  useEffect(() => {
    if (!visible) return;
    setErrors({});
    create.reset();
    update.reset();
    if (task) {
      setTitle(task.title ?? '');
      setPriority(task.priority ?? 'MEDIUM');
      setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
      setNotes(task.notes ?? '');
    } else {
      setTitle(initialTitle ?? '');
      setPriority('MEDIUM');
      setDueDate('');
      setNotes('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, task?.id]);

  // Live validity drives the disabled state of the submit button.
  const liveErrors = validateTask({ title, dueDate, notes });
  const canSubmit = Object.keys(liveErrors).length === 0;

  const apiError = useMemo(
    () => (isEdit ? update.error?.message : create.error?.message) ?? null,
    [isEdit, create.error, update.error],
  );

  // Clear a single field error as the user fixes it (re-validate that field).
  const clearError = (field: keyof TaskErrors) =>
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const submit = () => {
    const found = validateTask({ title, dueDate, notes });
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setErrors({});

    const trimmedTitle = title.trim();
    const due = dueDate.trim() ? dueDate.trim() : undefined;
    const note = notes.trim() ? notes.trim() : undefined;

    if (isEdit && task) {
      update.mutate(
        {
          id: task.id,
          patch: { title: trimmedTitle, priority, dueDate: due, notes: note },
        },
        { onSuccess: onClose },
      );
    } else {
      create.mutate(
        { title: trimmedTitle, priority, dueDate: due, notes: note },
        { onSuccess: onClose },
      );
    }
  };

  return (
    <FormSheet
      visible={visible}
      onClose={onClose}
      onSubmit={submit}
      title={isEdit ? 'Edit task' : 'New task'}
      subtitle={isEdit ? 'Update the details below.' : 'Plan your day — add a task.'}
      submitLabel={isEdit ? 'Save changes' : 'Add task'}
      pending={active.isPending}
      submitDisabled={!canSubmit}
      error={apiError}
    >
      <SoftInput
        label="Title"
        placeholder="e.g. Solve two array problems"
        value={title}
        onChangeText={(t) => {
          setTitle(t);
          clearError('title');
        }}
        autoFocus={!isEdit}
        returnKeyType="next"
        maxLength={TITLE_MAX}
        error={errors.title}
      />

      <View>
        <AppText
          variant="caption"
          color={colors.muted}
          weight="medium"
          style={{ marginBottom: 6 }}
        >
          Priority
        </AppText>
        <SegmentedTabs options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />
      </View>

      <SoftInput
        label="Due date (optional)"
        placeholder="YYYY-MM-DD"
        value={dueDate}
        onChangeText={(t) => {
          setDueDate(t);
          clearError('dueDate');
        }}
        autoCapitalize="none"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
        error={errors.dueDate}
      />

      <SoftInput
        label="Notes (optional)"
        placeholder="Anything to remember…"
        value={notes}
        onChangeText={(t) => {
          setNotes(t);
          clearError('notes');
        }}
        multiline
        maxLength={NOTES_MAX}
        style={{ minHeight: 72, paddingTop: spacing.sm }}
        error={errors.notes}
      />
    </FormSheet>
  );
}

export default TaskFormSheet;
