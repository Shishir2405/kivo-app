/**
 * Focus Timer — a calm STEEP deep-work studio (`/focus-timer`).
 *
 * Flat & editorial: the foundation's `FocusTimerRing` (Dove track + Rust arc) at
 * the centre, a three-way mode picker on the Steep SegmentedTabs, ONE Ink pill
 * CTA (Start / Pause) with a Reset TextLink, a live session counter, and a
 * recent-sessions list. The recent list is wired to the live `/study-sessions`
 * endpoint via `useStudySessions()` (loading / error / empty states); completed
 * focus blocks are prepended live on top.
 *
 * The countdown / stopwatch run on a real `setInterval` driven by local state.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
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

import { colors, radii } from '@/theme/tokens';
import { mockSettings } from '@/data/mock';
import { useStudySessions } from '@/hooks/api';
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

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function relativeDay(date: string): string {
  if (date === TODAY) return 'Today';
  if (date === '2026-06-25') return 'Yesterday';
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ------------------------------------------------------------------ */
/* Session row                                                         */
/* ------------------------------------------------------------------ */

function SessionRow({ session, fresh, divider }: { session: StudySession; fresh?: boolean; divider?: boolean }) {
  return (
    <View
      className="flex-row items-center"
      style={{
        gap: 12,
        paddingVertical: 11,
        borderTopWidth: divider ? 1 : 0,
        borderTopColor: colors.fog,
      }}
    >
      <Icon name="timer" size={17} color="graphite" />
      <View style={{ flex: 1 }}>
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <AppText variant="subheading" weight="medium" numberOfLines={1} style={{ flexShrink: 1 }}>
            {session.topic}
          </AppText>
          {fresh ? <Tag label="New" tone="ink" size="sm" /> : null}
        </View>
        <AppText variant="caption" color={colors.graphite} style={{ marginTop: 1 }}>
          {relativeDay(session.date)}
          {session.problemsSolved > 0 ? ` · ${session.problemsSolved} solved` : ''}
        </AppText>
      </View>
      <View className="items-end">
        <AppText variant="subheading" weight="medium" style={{ fontVariant: ['tabular-nums'] }}>
          {session.minutes}
        </AppText>
        <AppText variant="caption" color={colors.graphite}>
          min
        </AppText>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Wash stat figure                                                    */
/* ------------------------------------------------------------------ */

function StatFigure({ value, label }: { value: string; label: string }) {
  return (
    <>
      <AppText variant="headingLg" display weight="semibold" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </AppText>
      <AppText variant="caption" color={colors.ash} style={{ marginTop: 2 }}>
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

  const sessionsQuery = useStudySessions();

  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [freshSessions, setFreshSessions] = useState<StudySession[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logSeq = useRef(0);

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

  const logSession = useCallback((minutes: number) => {
    if (minutes <= 0) return;
    logSeq.current += 1;
    setFreshSessions((prev) => [
      { id: `live_${logSeq.current}`, date: TODAY, minutes, topic: 'Focus session', problemsSolved: 0 },
      ...prev,
    ]);
    setCompletedCount((c) => c + 1);
  }, []);

  // Auto-finish a countdown at its target.
  useEffect(() => {
    if (isStopwatch || targetSeconds == null) return;
    if (running && elapsed >= targetSeconds) {
      clearTick();
      setRunning(false);
      logSession(Math.round(targetSeconds / 60));
      setElapsed(targetSeconds);
    }
  }, [elapsed, running, isStopwatch, targetSeconds, clearTick, logSession]);

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

  const sessions = useMemo<{ session: StudySession; fresh: boolean }[]>(
    () => [
      ...freshSessions.map((s) => ({ session: s, fresh: true })),
      ...fetchedSessions.map((s) => ({ session: s, fresh: false })),
    ],
    [freshSessions, fetchedSessions],
  );

  const totalMinutesToday = useMemo(
    () =>
      freshSessions.reduce((sum, s) => sum + s.minutes, 0) +
      fetchedSessions.filter((s) => s.date === TODAY).reduce((sum, s) => sum + s.minutes, 0),
    [freshSessions, fetchedSessions],
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
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={{ paddingHorizontal: 20 }}>
        <AppHeader onBack={() => router.back()} right={<TextLink label="Calendar" onPress={() => router.push('/calendar')} muted size="sm" />} />
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
        <View style={{ marginBottom: 16 }}>
          <AppText variant="display" display weight="semibold">
            Focus
          </AppText>
          <AppText variant="body" color={colors.ash} style={{ marginTop: 4 }}>
            Lock in. Make it count.
          </AppText>
        </View>

        {/* Timer card */}
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
              icon={<Icon name={primaryIcon} size={16} color="white" weight={primaryIcon === 'play' ? 'fill' : 'light'} />}
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

        {/* Today stats */}
        <View className="flex-row" style={{ gap: 10, marginTop: 16 }}>
          <WarmCard style={{ flex: 1 }} padding={14}>
            <StatFigure value={`${totalMinutesToday}`} label="min today" />
          </WarmCard>
          <CoolCard style={{ flex: 1 }} padding={14}>
            <StatFigure value={`${completedCount}`} label="completed" />
          </CoolCard>
        </View>

        {/* Recent sessions */}
        <View style={{ marginTop: 22 }}>
          <View className="flex-row items-center" style={{ gap: 8, marginBottom: 10 }}>
            <AppText variant="heading" display weight="medium">
              Recent sessions
            </AppText>
            <View style={{ flex: 1 }} />
            {sessions.length > 0 ? <Tag label={`${sessions.length}`} tone="neutral" size="sm" /> : null}
          </View>

          {sessionsQuery.isError ? (
            <SoftCard variant="inset" radius={radii.card} padding={20}>
              <View className="items-center" style={{ gap: 8 }}>
                <Icon name="alert" size={20} color="graphite" />
                <AppText variant="body" color={colors.ash} style={{ textAlign: 'center' }}>
                  {sessionsQuery.error?.message ?? 'Couldn’t load your sessions.'}
                </AppText>
                <TextLink label="Try again" onPress={() => void sessionsQuery.refetch()} icon={<Icon name="repeat" size={14} color="ink" />} />
              </View>
            </SoftCard>
          ) : sessionsQuery.isLoading && freshSessions.length === 0 ? (
            <SoftCard variant="inset" radius={radii.card} padding={24}>
              <View className="items-center" style={{ gap: 10 }}>
                <ActivityIndicator color={colors.ink} />
                <AppText variant="caption" color={colors.graphite}>
                  Loading sessions…
                </AppText>
              </View>
            </SoftCard>
          ) : sessions.length === 0 ? (
            <SoftCard variant="inset" radius={radii.card} padding={22}>
              <View className="items-center" style={{ gap: 8 }}>
                <Icon name="timer" size={22} color="graphite" />
                <AppText variant="subheading" weight="medium">
                  No sessions yet
                </AppText>
                <AppText variant="body" color={colors.ash} style={{ textAlign: 'center' }}>
                  Start a focus block and it will show up here.
                </AppText>
              </View>
            </SoftCard>
          ) : (
            <SoftCard radius={radii.card} padding={12}>
              {sessions.map(({ session, fresh }, i) => (
                <SessionRow key={session.id} session={session} fresh={fresh} divider={i > 0} />
              ))}
            </SoftCard>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
