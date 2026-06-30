/**
 * Focus Timer — a calm STEEP deep-work studio (`/focus-timer`).
 *
 * Flat & editorial: the foundation's `FocusTimerRing` (Dove track + Rust arc) at
 * the centre, a three-way mode picker on the Steep SegmentedTabs, ONE Ink pill
 * CTA (Start / Pause) with a Reset TextLink, a live session counter, and a
 * recent-sessions list. The recent list is wired to the live `/study-sessions`
 * endpoint via `useStudySessions()` (loading / error / empty states).
 *
 * CRUD: completed focus blocks are PERSISTED through `useCreateStudySession`
 * (they reappear from the server in the recent list). Sessions can also be
 * added manually (header "+", quick-add row, empty-state CTA), tapped to edit
 * and long-pressed to delete — all through the study-session mutation hooks via
 * the shared FormSheet. The countdown / stopwatch run on a real `setInterval`.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui/Typography';
import { SoftCard, WarmCard, CoolCard } from '@/components/ui/SoftCard';
import { PillButton, TextLink } from '@/components/ui/PillButton';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { Tag } from '@/components/ui/Tag';
import { Icon, type IconName } from '@/components/ui/Icon';
import { AppHeader } from '@/components/ui/AppHeader';
import { FocusTimerRing } from '@/components/tracker/FocusTimerRing';
import { Skeleton, SkeletonText } from '@/components/ui';
import { AddButton, QuickAddRow, EmptyStateCTA, FormSheet, SoftInput } from '@/components/ui';
import { MotiView } from 'moti';

import { radii, motion, interaction } from '@/theme/tokens';
import { useTheme } from '@/theme';
import { mockSettings } from '@/data/mock';
import {
  useStudySessions,
  useCreateStudySession,
  useUpdateStudySession,
  useDeleteStudySession,
} from '@/hooks/api';
import type { StudySession } from '@/types/models';

/* ------------------------------------------------------------------ */
/* Mode model                                                          */
/* ------------------------------------------------------------------ */

type TimerMode = 'pomodoro' | 'deep' | 'stopwatch';

type ModeMeta = {
  label: string;
  /** Fixed countdown length in minutes; `null` = open-ended stopwatch. */
  minutes: number | null;
  icon: IconName;
  blurb: string;
};

const { focusDuration } = mockSettings.preferences;

const MODES: Record<TimerMode, ModeMeta> = {
  pomodoro: { label: 'Pomodoro', minutes: focusDuration, icon: 'timer', blurb: 'Short, sharp sprint' },
  deep: { label: 'Deep Focus', minutes: 50, icon: 'brain', blurb: 'Long uninterrupted block' },
  stopwatch: { label: 'Stopwatch', minutes: null, icon: 'activity', blurb: 'Open-ended, count up' },
};

const MODE_OPTIONS: SegmentedOption<TimerMode>[] = [
  { label: 'Pomodoro', value: 'pomodoro', icon: 'timer' },
  { label: 'Deep Focus', value: 'deep', icon: 'brain' },
  { label: 'Stopwatch', value: 'stopwatch', icon: 'activity' },
];

const TODAY = '2026-06-26';

/* ------------------------------------------------------------------ */
/* Study-session field limits (mirror the backend validator)           */
/* ------------------------------------------------------------------ */

// topicName: optional, max 200 chars.
const TOPIC_MAX = 200;
// durationMinutes: integer, non-negative, max 1440. A logged session needs > 0.
const DURATION_MIN = 1;
const DURATION_MAX = 1440;
// problemsSolved is a UX-only field; keep it a sane non-negative whole number.
const SOLVED_MAX = 1000;

function todayKey(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function relativeDay(date: string): string {
  const key = String(date).slice(0, 10);
  if (key === TODAY || key === todayKey()) return 'Today';
  if (key === '2026-06-25') return 'Yesterday';
  const d = new Date(`${key}T00:00:00`);
  if (Number.isNaN(d.getTime())) return key;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ------------------------------------------------------------------ */
/* Session row — tap to edit, long-press to delete                     */
/* ------------------------------------------------------------------ */

function SessionRow({
  session,
  fresh,
  divider,
  onEdit,
  onDelete,
}: {
  session: StudySession;
  fresh?: boolean;
  divider?: boolean;
  onEdit: (s: StudySession) => void;
  onDelete: (s: StudySession) => void;
}) {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={() => onEdit(session)}
      onLongPress={() => onDelete(session)}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityLabel={`${session.topic}, ${session.minutes} minutes. Tap to edit, long-press to delete.`}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[{ opacity: 1 }, pressed && { opacity: interaction.pressOpacity }]}
    >
      <View
        className="flex-row items-center"
        style={{
          gap: 12,
          paddingVertical: 11,
          borderTopWidth: divider ? 1 : 0,
          borderTopColor: colors.hairline,
        }}
      >
        {/* Peach wash icon tile — the session log's colored voice in the HTML. */}
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.peach,
          }}
        >
          <Icon name="timer" size={15} color="rust" />
        </View>
        <View style={{ flex: 1 }}>
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <AppText variant="subheading" weight="medium" numberOfLines={1} style={{ flexShrink: 1 }}>
              {session.topic}
            </AppText>
            {fresh ? <Tag label="New" tone="ink" size="sm" /> : null}
          </View>
          <AppText variant="caption" color={colors.muted} style={{ marginTop: 1 }}>
            {relativeDay(session.date)}
            {session.problemsSolved > 0 ? ` · ${session.problemsSolved} solved` : ''}
          </AppText>
        </View>
        <View className="items-end">
          <AppText
            variant="subheading"
            weight="semibold"
            color={colors.primaryOnWash}
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {session.minutes}
          </AppText>
          <AppText variant="caption" color={colors.muted}>
            min
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Wash stat figure                                                    */
/* ------------------------------------------------------------------ */

function StatFigure({ value, label }: { value: string; label: string }) {
  const { colors } = useTheme();
  return (
    <>
      <AppText variant="headingLg" display weight="semibold" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </AppText>
      <AppText variant="caption" color={colors.muted} style={{ marginTop: 2 }}>
        {label}
      </AppText>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function FocusTimerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();

  const sessionsQuery = useStudySessions();
  const createSession = useCreateStudySession();
  const updateSession = useUpdateStudySession();
  const deleteSession = useDeleteStudySession();

  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const meta = MODES[mode];
  const targetSeconds = meta.minutes != null ? meta.minutes * 60 : null;
  const isStopwatch = targetSeconds == null;

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!running) {
      clearTick();
      return;
    }
    intervalRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return clearTick;
  }, [running, clearTick]);

  // Persist a completed focus block to the server (it returns via the query).
  const logSession = useCallback(
    (minutes: number, topic = 'Focus session') => {
      if (minutes <= 0) return;
      setCompletedCount((c) => c + 1);
      createSession.mutate({
        topic,
        minutes,
        problemsSolved: 0,
        date: todayKey(),
      });
    },
    [createSession],
  );

  // Auto-finish a countdown at its target.
  useEffect(() => {
    if (isStopwatch || targetSeconds == null) return;
    if (running && elapsed >= targetSeconds) {
      clearTick();
      setRunning(false);
      logSession(Math.round(targetSeconds / 60), meta.label);
      setElapsed(targetSeconds);
    }
  }, [elapsed, running, isStopwatch, targetSeconds, clearTick, logSession, meta.label]);

  const switchMode = useCallback(
    (next: TimerMode) => {
      if (next === mode) return;
      clearTick();
      setRunning(false);
      setElapsed(0);
      setMode(next);
    },
    [mode, clearTick],
  );

  const finished = !isStopwatch && targetSeconds != null && elapsed >= targetSeconds;

  const reset = useCallback(() => {
    if (isStopwatch && elapsed >= 60) logSession(Math.floor(elapsed / 60));
    clearTick();
    setRunning(false);
    setElapsed(0);
  }, [clearTick, isStopwatch, elapsed, logSession]);

  const toggle = useCallback(() => {
    if (finished) {
      reset();
      return;
    }
    if (isStopwatch && running && elapsed >= 60) {
      logSession(Math.floor(elapsed / 60));
      clearTick();
      setRunning(false);
      setElapsed(0);
      return;
    }
    setRunning((r) => !r);
  }, [finished, isStopwatch, running, elapsed, reset, logSession, clearTick]);

  const remaining = targetSeconds != null ? Math.max(0, targetSeconds - elapsed) : elapsed;
  const progress = isStopwatch
    ? (elapsed % 60) / 60
    : targetSeconds && targetSeconds > 0
      ? remaining / targetSeconds
      : 0;

  const modeLabel = finished ? 'Complete' : running ? 'In session' : isStopwatch ? 'Stopwatch' : meta.label;

  const fetchedSessions = useMemo<StudySession[]>(
    () => (Array.isArray(sessionsQuery.data) ? sessionsQuery.data.filter(Boolean) : []),
    [sessionsQuery.data],
  );

  const totalMinutesToday = useMemo(
    () =>
      fetchedSessions
        .filter((s) => s.date.slice(0, 10) === todayKey() || s.date.slice(0, 10) === TODAY)
        .reduce((sum, s) => sum + s.minutes, 0),
    [fetchedSessions],
  );

  /* ---- Manual create / edit / delete ---- */

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<StudySession | null>(null);
  const [fTopic, setFTopic] = useState('');
  const [fMinutes, setFMinutes] = useState('');
  const [fSolved, setFSolved] = useState('');
  const [formErr, setFormErr] = useState('');

  const openCreate = useCallback(() => {
    setEditing(null);
    setFTopic('');
    setFMinutes('');
    setFSolved('');
    setFormErr('');
    setSheetOpen(true);
  }, []);

  const openEdit = useCallback((s: StudySession) => {
    setEditing(s);
    setFTopic(s.topic ?? '');
    setFMinutes(String(s.minutes ?? ''));
    setFSolved(s.problemsSolved > 0 ? String(s.problemsSolved) : '');
    setFormErr('');
    setSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    setEditing(null);
  }, []);

  // ---- Per-field validation (mirrors the study-session backend contract) ----
  const trimmedTopic = fTopic.trim();
  const topicError = !trimmedTopic
    ? 'Topic is required'
    : trimmedTopic.length > TOPIC_MAX
      ? `Topic must be at most ${TOPIC_MAX} characters`
      : undefined;

  const minutesNum = parseInt(fMinutes, 10);
  const minutesError = !fMinutes.trim()
    ? 'Minutes focused is required'
    : !/^\d+$/.test(fMinutes.trim()) || Number.isNaN(minutesNum)
      ? 'Enter a whole number of minutes'
      : minutesNum < DURATION_MIN
        ? 'Enter at least 1 minute'
        : minutesNum > DURATION_MAX
          ? `Duration must be at most ${DURATION_MAX} minutes`
          : undefined;

  const solvedTrimmed = fSolved.trim();
  const solvedNum = parseInt(fSolved, 10);
  const solvedError =
    solvedTrimmed.length === 0
      ? undefined // optional
      : !/^\d+$/.test(solvedTrimmed) || Number.isNaN(solvedNum)
        ? 'Enter a whole number'
        : solvedNum > SOLVED_MAX
          ? `Must be at most ${SOLVED_MAX}`
          : undefined;

  const topicValid = !topicError;
  const minutesValid = !minutesError;
  const submitDisabled = !topicValid || !minutesValid || !!solvedError;
  const saving = createSession.isPending || updateSession.isPending;

  const submitSession = useCallback(() => {
    if (topicError) {
      setFormErr(topicError);
      return;
    }
    if (minutesError) {
      setFormErr(minutesError);
      return;
    }
    if (solvedError) {
      setFormErr(solvedError);
      return;
    }
    setFormErr('');
    const problemsSolved =
      solvedTrimmed.length === 0 || Number.isNaN(solvedNum) || solvedNum < 0 ? 0 : solvedNum;

    if (editing) {
      updateSession.mutate(
        { id: editing.id, patch: { topic: trimmedTopic, minutes: minutesNum, problemsSolved } },
        { onSuccess: closeSheet, onError: (e) => setFormErr(e.message) },
      );
    } else {
      createSession.mutate(
        { topic: trimmedTopic, minutes: minutesNum, problemsSolved, date: todayKey() },
        { onSuccess: closeSheet, onError: (e) => setFormErr(e.message) },
      );
    }
  }, [topicError, minutesError, solvedError, solvedTrimmed, solvedNum, editing, updateSession, trimmedTopic, minutesNum, closeSheet, createSession]);

  const confirmDelete = useCallback(
    (s: StudySession) => {
      Alert.alert('Delete session?', `“${s.topic}” will be removed.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteSession.mutate(s.id) },
      ]);
    },
    [deleteSession],
  );

  const primaryLabel = finished
    ? 'New session'
    : running
      ? isStopwatch
        ? 'Stop'
        : 'Pause'
      : isStopwatch
        ? 'Start clock'
        : 'Start focus';
  const primaryIcon: IconName = finished ? 'rotate' : running ? (isStopwatch ? 'square' : 'pause') : 'play';

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={{ paddingHorizontal: 20 }}>
        <AppHeader
          onBack={() => router.back()}
          right={
            <View className="flex-row items-center" style={{ gap: 14 }}>
              <TextLink label="Calendar" onPress={() => router.push('/calendar')} muted size="sm" />
              <AddButton onPress={openCreate} accessibilityLabel="Log a study session" />
            </View>
          }
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: insets.bottom + 40,
        }}
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: motion.duration.transition }}
          style={{ marginBottom: 16 }}
        >
          <AppText variant="display" display weight="semibold">
            Focus
          </AppText>
          <AppText variant="body" color={colors.muted} style={{ marginTop: 4 }}>
            Lock in. Make it count.
          </AppText>
        </MotiView>

        {/* Timer card */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: motion.duration.transition, delay: 60 }}
        >
        <SoftCard radius={radii.cardLg} padding={16}>
          <SegmentedTabs options={MODE_OPTIONS} value={mode} onChange={switchMode} />

          <View className="flex-row items-center justify-center" style={{ gap: 6, marginTop: 12 }}>
            <Icon name={meta.icon} size={13} color="graphite" />
            <AppText variant="caption" color={colors.graphite}>
              {meta.blurb}
              {meta.minutes != null ? ` · ${meta.minutes} min` : ''}
            </AppText>
          </View>

          {/* Ring */}
          <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 18 }}>
            <FocusTimerRing
              size={236}
              progress={progress}
              timeLabel={formatClock(isStopwatch ? elapsed : remaining)}
              modeLabel={modeLabel}
            />
          </View>

          {/* Controls — ONE Ink pill + a Reset TextLink */}
          <View className="flex-row items-center justify-center" style={{ gap: 20 }}>
            <PillButton
              label={primaryLabel}
              size="lg"
              onPress={toggle}
              icon={<Icon name={primaryIcon} size={16} color="onPrimary" weight={primaryIcon === 'play' ? 'fill' : 'light'} />}
            />
            <TextLink label="Reset" onPress={reset} icon={<Icon name="refresh" size={14} color="ink" />} />
          </View>

          {/* Counter footer */}
          <View className="flex-row items-center justify-center" style={{ gap: 6, marginTop: 14 }}>
            <Icon name="check-circle" size={13} color="graphite" />
            <AppText variant="caption" color={colors.graphite}>
              {completedCount === 0
                ? 'No sessions completed yet'
                : `${completedCount} session${completedCount === 1 ? '' : 's'} this sitting`}
            </AppText>
          </View>
        </SoftCard>
        </MotiView>

        {/* Today stats */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: motion.duration.transition, delay: 120 }}
          className="flex-row"
          style={{ gap: 10, marginTop: 16 }}
        >
          <WarmCard style={{ flex: 1 }} padding={14}>
            <StatFigure value={`${totalMinutesToday}`} label="min today" />
          </WarmCard>
          <CoolCard style={{ flex: 1 }} padding={14}>
            <StatFigure value={`${completedCount}`} label="completed" />
          </CoolCard>
        </MotiView>

        {/* Recent sessions */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: motion.duration.transition, delay: 180 }}
          style={{ marginTop: 22 }}
        >
          <View className="flex-row items-center" style={{ gap: 8, marginBottom: 10 }}>
            <AppText variant="heading" display weight="medium">
              Recent sessions
            </AppText>
            <View style={{ flex: 1 }} />
            {fetchedSessions.length > 0 ? <Tag label={`${fetchedSessions.length}`} tone="neutral" size="sm" /> : null}
          </View>

          {sessionsQuery.isError ? (
            <SoftCard variant="inset" radius={radii.card} padding={20}>
              <View className="items-center" style={{ gap: 8 }}>
                <Icon name="alert" size={20} color="graphite" />
                <AppText variant="body" color={colors.muted} style={{ textAlign: 'center' }}>
                  {sessionsQuery.error?.message ?? 'Couldn’t load your sessions.'}
                </AppText>
                <TextLink label="Try again" onPress={() => void sessionsQuery.refetch()} icon={<Icon name="repeat" size={14} color="ink" />} />
              </View>
            </SoftCard>
          ) : sessionsQuery.isLoading ? (
            <SoftCard radius={radii.card} padding={12}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  className="flex-row items-center"
                  style={{
                    gap: 12,
                    paddingVertical: 11,
                    borderTopWidth: i > 0 ? 1 : 0,
                    borderTopColor: colors.hairline,
                  }}
                >
                  <Skeleton width={32} height={32} radius={9} />
                  <View style={{ flex: 1 }}>
                    <SkeletonText lines={2} lineHeight={11} gap={6} lastWidth="45%" />
                  </View>
                  <Skeleton width={28} height={16} radius={5} />
                </View>
              ))}
            </SoftCard>
          ) : fetchedSessions.length === 0 ? (
            <EmptyStateCTA
              icon="timer"
              title="No sessions yet"
              description="Start a focus block above, or log one you’ve already done."
              actionLabel="Log a session"
              onAction={openCreate}
            />
          ) : (
            <View style={{ gap: 12 }}>
              <SoftCard radius={radii.card} padding={12}>
                {fetchedSessions.map((session, i) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    divider={i > 0}
                    onEdit={openEdit}
                    onDelete={confirmDelete}
                  />
                ))}
              </SoftCard>
              <QuickAddRow label="Log a session" icon="timer" onPress={openCreate} />
            </View>
          )}
        </MotiView>
      </ScrollView>

      {/* Create / edit study-session sheet */}
      <FormSheet
        visible={sheetOpen}
        onClose={closeSheet}
        onSubmit={submitSession}
        title={editing ? 'Edit session' : 'Log a session'}
        submitLabel={editing ? 'Save' : 'Log session'}
        pending={saving}
        submitDisabled={submitDisabled}
        error={
          formErr ||
          (editing ? updateSession.error?.message : createSession.error?.message) ||
          null
        }
      >
        <SoftInput
          label="Topic"
          value={fTopic}
          onChangeText={(v) => {
            setFTopic(v);
            if (formErr) setFormErr('');
          }}
          placeholder="e.g. Graphs · BFS / DFS"
          autoFocus
          maxLength={TOPIC_MAX + 1}
          returnKeyType="next"
          error={formErr ? topicError : undefined}
        />
        <SoftInput
          label="Minutes focused"
          value={fMinutes}
          onChangeText={(v) => {
            setFMinutes(v);
            if (formErr) setFormErr('');
          }}
          placeholder="e.g. 45"
          keyboardType="number-pad"
          error={formErr ? minutesError : undefined}
        />
        <SoftInput
          label="Problems solved (optional)"
          value={fSolved}
          onChangeText={(v) => {
            setFSolved(v);
            if (formErr) setFormErr('');
          }}
          placeholder="e.g. 3"
          keyboardType="number-pad"
          error={solvedError}
        />
      </FormSheet>
    </View>
  );
}
