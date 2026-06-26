/**
 * Focus Timer — full-screen deep-work studio (`/focus-timer`).
 *
 * A dedicated, calm focus surface that goes beyond the compact tracker-tab
 * widget: a large neumorphic reanimated progress ring, a three-way mode picker
 * (Pomodoro / Deep Focus / Stopwatch) built on the mandated SegmentedTabs (NO
 * radios), big Start/Pause + Reset SoftButtons with vector Icons, a live session
 * counter, and a recent-sessions list that grows as you complete focus blocks.
 *
 * The countdown (and the Stopwatch count-up) run on a real `setInterval` driven
 * by local React state — no fake/mocked ticking. Completed sessions are seeded
 * from `mockStudySessions` and prepended live when a block finishes.
 *
 * Entirely composed from the Aaply neumorphic kit on the graphite-mist canvas.
 * ZERO emoji — every glyph is an <Icon/>. The reanimated SVG ring is reused from
 * the existing `FocusTimerRing` primitive rather than reinvented.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { SoftButton } from '@/components/ui/SoftButton';
import { SoftIconButton } from '@/components/ui/SoftIconButton';
import { Neumorph } from '@/components/ui/Neumorph';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { Tag } from '@/components/ui/Tag';
import { Icon, type IconName } from '@/components/ui/Icon';
import { GrayMark } from '@/components/ui/AppHeader';
import { FocusTimerRing } from '@/components/tracker/FocusTimerRing';

import { colors, radii } from '@/theme/tokens';
import { mockStudySessions, mockSettings } from '@/data/mock';
import type { StudySession } from '@/types/models';

/* ------------------------------------------------------------------ */
/* Mode model                                                          */
/* ------------------------------------------------------------------ */

type TimerMode = 'pomodoro' | 'deep' | 'stopwatch';

type ModeMeta = {
  label: string;
  /** Fixed countdown length in minutes; `null` = open-ended stopwatch. */
  minutes: number | null;
  accent: string;
  icon: IconName;
  blurb: string;
};

const { focusDuration } = mockSettings.preferences;

const MODES: Record<TimerMode, ModeMeta> = {
  pomodoro: {
    label: 'Pomodoro',
    minutes: focusDuration, // honours the user's preferred focus length (25m)
    accent: colors.highlighter,
    icon: 'timer',
    blurb: 'Short, sharp sprint',
  },
  deep: {
    label: 'Deep Focus',
    minutes: 50,
    accent: colors.signal,
    icon: 'brain',
    blurb: 'Long uninterrupted block',
  },
  stopwatch: {
    label: 'Stopwatch',
    minutes: null,
    accent: colors.peach,
    icon: 'activity',
    blurb: 'Open-ended, count up',
  },
};

const MODE_OPTIONS: SegmentedOption<TimerMode>[] = [
  { label: 'Pomodoro', value: 'pomodoro', icon: 'timer' },
  { label: 'Deep Focus', value: 'deep', icon: 'brain' },
  { label: 'Stopwatch', value: 'stopwatch', icon: 'activity' },
];

/** mm:ss for clocks under an hour, h:mm:ss once a stopwatch crosses 60 min. */
function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ */
/* Session row                                                         */
/* ------------------------------------------------------------------ */

function relativeDay(date: string): string {
  // mockStudySessions use the project's TODAY anchor (2026-06-26).
  const today = '2026-06-26';
  if (date === today) return 'Today';
  if (date === '2026-06-25') return 'Yesterday';
  // Fall back to a short month/day label.
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function SessionRow({ session, index, fresh }: { session: StudySession; index: number; fresh?: boolean }) {
  return (
    <MotiView
      from={{ opacity: 0, translateX: fresh ? -14 : 0, translateY: fresh ? 0 : 8 }}
      animate={{ opacity: 1, translateX: 0, translateY: 0 }}
      transition={{ type: 'timing', duration: 320, delay: fresh ? 0 : 40 + index * 35 }}
    >
      <View className="flex-row items-center" style={{ gap: 12, paddingVertical: 10 }}>
        <Neumorph variant="inset" radius={12} intensity="sm" padding={9} surface={colors.canvas}>
          <Icon name="timer" size={18} color="signal" strokeWidth={2.2} />
        </Neumorph>

        <View style={{ flex: 1 }}>
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <AppText variant="body" weight="semibold" numberOfLines={1} style={{ flexShrink: 1 }}>
              {session.topic}
            </AppText>
            {fresh ? <Tag label="New" tone="yellow" size="sm" /> : null}
          </View>
          <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 1, fontSize: 12 }}>
            {relativeDay(session.date)}
            {session.problemsSolved > 0
              ? ` · ${session.problemsSolved} solved`
              : ''}
          </AppText>
        </View>

        <View className="items-end">
          <AppText
            variant="body"
            weight="bold"
            color={colors.carbon}
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {session.minutes}
          </AppText>
          <AppText variant="caption" color={colors.textSubtle} style={{ fontSize: 11 }}>
            min
          </AppText>
        </View>
      </View>
    </MotiView>
  );
}

/* ------------------------------------------------------------------ */
/* Stat pill                                                           */
/* ------------------------------------------------------------------ */

function StatPill({ icon, value, label, accent }: { icon: IconName; value: string; label: string; accent: string }) {
  return (
    <SoftCard radius={radii.card} intensity="sm" padding={14} style={{ flex: 1 }}>
      <Neumorph variant="inset" radius={11} intensity="sm" padding={8} surface={colors.canvas} style={{ alignSelf: 'flex-start' }}>
        <Icon name={icon} size={17} color={accent} strokeWidth={2.3} />
      </Neumorph>
      <AppText
        variant="subheading"
        weight="bold"
        display
        style={{ marginTop: 10, fontVariant: ['tabular-nums'] }}
      >
        {value}
      </AppText>
      <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 11.5 }}>
        {label}
      </AppText>
    </SoftCard>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function FocusTimerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [running, setRunning] = useState(false);
  /** Seconds elapsed in the current block (drives both countdown + count-up). */
  const [elapsed, setElapsed] = useState(0);
  /** Sessions completed this sitting (counter chip). */
  const [completedCount, setCompletedCount] = useState(0);
  /** Newly-logged sessions, newest first, prepended onto the seed list. */
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

  // Real ticking interval — counts up; countdown modes derive remaining below.
  useEffect(() => {
    if (!running) {
      clearTick();
      return;
    }
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return clearTick;
  }, [running, clearTick]);

  const logSession = useCallback(
    (minutes: number) => {
      if (minutes <= 0) return;
      logSeq.current += 1;
      const entry: StudySession = {
        id: `live_${logSeq.current}`,
        date: '2026-06-26',
        minutes,
        topic: 'Focus session',
        problemsSolved: 0,
      };
      setFreshSessions((prev) => [entry, ...prev]);
      setCompletedCount((c) => c + 1);
    },
    [],
  );

  // Auto-finish a countdown when it hits its target.
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

  const reset = useCallback(() => {
    // A reset on a partially-run stopwatch still logs the work done.
    if (isStopwatch && elapsed >= 60) {
      logSession(Math.floor(elapsed / 60));
    }
    clearTick();
    setRunning(false);
    setElapsed(0);
  }, [clearTick, isStopwatch, elapsed, logSession]);

  const toggle = useCallback(() => {
    if (finished) {
      reset();
      return;
    }
    // Stopwatch "stop" (pause from a running state) banks the elapsed minutes.
    if (isStopwatch && running && elapsed >= 60) {
      logSession(Math.floor(elapsed / 60));
      clearTick();
      setRunning(false);
      setElapsed(0);
      return;
    }
    setRunning((r) => !r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStopwatch, running, elapsed, reset, logSession, clearTick]);

  // Derived display values.
  const remaining = targetSeconds != null ? Math.max(0, targetSeconds - elapsed) : elapsed;
  const finished = !isStopwatch && targetSeconds != null && elapsed >= targetSeconds;

  // Ring progress: countdown depletes from full; stopwatch sweeps each minute
  // so the ring stays alive without a fixed target.
  const progress = isStopwatch
    ? (elapsed % 60) / 60
    : targetSeconds && targetSeconds > 0
      ? remaining / targetSeconds
      : 0;

  const modeLabel = finished
    ? 'Complete'
    : running
      ? 'In session'
      : isStopwatch
        ? 'Stopwatch'
        : meta.label;

  // Recent-sessions list = live sessions first, then the seed history.
  const sessions = useMemo<{ session: StudySession; fresh: boolean }[]>(
    () => [
      ...freshSessions.map((s) => ({ session: s, fresh: true })),
      ...mockStudySessions.map((s) => ({ session: s, fresh: false })),
    ],
    [freshSessions],
  );

  const totalMinutesToday = useMemo(
    () =>
      freshSessions.reduce((sum, s) => sum + s.minutes, 0) +
      mockStudySessions
        .filter((s) => s.date === '2026-06-26')
        .reduce((sum, s) => sum + s.minutes, 0),
    [freshSessions],
  );

  // Primary button copy + glyph.
  const primaryLabel = finished
    ? 'New session'
    : running
      ? isStopwatch
        ? 'Stop'
        : 'Pause'
      : isStopwatch
        ? 'Start clock'
        : 'Start focus';
  const primaryVariant = finished ? 'carbon' : running ? 'carbon' : 'yellow';
  const primaryIcon: IconName = finished ? 'rotate' : running ? (isStopwatch ? 'square' : 'pause') : 'play';
  const primaryInk = finished || running ? 'paper' : 'carbon';

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 40,
        }}
      >
        {/* ---------- Top bar ---------- */}
        <View className="flex-row items-center justify-between">
          <SoftIconButton size={44} accessibilityLabel="Go back" onPress={() => router.back()}>
            <Icon name="chevron-left" size={22} color="carbon" />
          </SoftIconButton>
          <GrayMark size={24} />
          <SoftIconButton size={44} accessibilityLabel="Calendar" onPress={() => router.push('/calendar')}>
            <Icon name="calendar" size={19} color="carbon" />
          </SoftIconButton>
        </View>

        {/* ---------- Header ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 360 }}
          style={{ marginTop: 18, marginBottom: 20 }}
        >
          <View className="flex-row items-center" style={{ gap: 7 }}>
            <Icon name="timer" size={14} color="signal" strokeWidth={2.25} />
            <AppText
              variant="caption"
              weight="semibold"
              color={colors.textSubtle}
              style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 11 }}
            >
              Focus Studio
            </AppText>
          </View>
          <AppText variant="heading" display weight="bold" style={{ marginTop: 6 }}>
            Lock in.{'\n'}Make it count.
          </AppText>
        </MotiView>

        {/* ---------- Timer card ---------- */}
        <SoftCard radius={radii.cardLg} intensity="lg" padding={22}>
          <SegmentedTabs options={MODE_OPTIONS} value={mode} onChange={switchMode} height={50} />

          {/* Mode blurb */}
          <View className="flex-row items-center justify-center" style={{ gap: 6, marginTop: 14 }}>
            <Icon name={meta.icon} size={13} color={meta.accent} strokeWidth={2.4} />
            <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 12.5 }}>
              {meta.blurb}
              {meta.minutes != null ? ` · ${meta.minutes} min` : ''}
            </AppText>
          </View>

          {/* Reanimated ring */}
          <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 22 }}>
            <FocusTimerRing
              size={252}
              progress={progress}
              timeLabel={formatClock(isStopwatch ? elapsed : remaining)}
              modeLabel={modeLabel}
              accent={meta.accent}
              running={running}
            />
          </View>

          {/* Controls */}
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <SoftButton
              label={primaryLabel}
              variant={primaryVariant}
              size="md"
              onPress={toggle}
              icon={
                <Icon
                  name={primaryIcon}
                  size={18}
                  color={primaryInk}
                  strokeWidth={2.4}
                  fill={primaryIcon === 'play' || primaryIcon === 'square' ? primaryInk : 'none'}
                />
              }
              style={{ flex: 1 }}
            />
            <SoftIconButton size={52} onPress={reset} accessibilityLabel="Reset timer">
              <Icon name="refresh" size={20} color="carbon" strokeWidth={2.2} />
            </SoftIconButton>
          </View>

          {/* Session counter footer */}
          <View
            className="flex-row items-center justify-center"
            style={{ gap: 7, marginTop: 16 }}
          >
            <Icon name="check-circle" size={14} color={completedCount > 0 ? 'success' : 'textSubtle'} strokeWidth={2.4} />
            <AppText variant="caption" color={colors.textSubtle}>
              {completedCount === 0
                ? 'No sessions completed yet'
                : `${completedCount} session${completedCount === 1 ? '' : 's'} completed this sitting`}
            </AppText>
          </View>
        </SoftCard>

        {/* ---------- Today stats ---------- */}
        <View className="flex-row" style={{ gap: 12, marginTop: 20 }}>
          <StatPill icon="zap" value={`${totalMinutesToday}`} label="min today" accent={colors.highlighter} />
          <StatPill icon="check-circle" value={`${completedCount}`} label="completed" accent={colors.success} />
          <StatPill icon="flame" value={`${meta.minutes ?? '∞'}`} label={isStopwatch ? 'open run' : 'block size'} accent={colors.peach} />
        </View>

        {/* ---------- Recent sessions ---------- */}
        <View style={{ marginTop: 26 }}>
          <View className="flex-row items-center" style={{ gap: 8, marginBottom: 6 }}>
            <Icon name="clock" size={16} color="carbon" strokeWidth={2.2} />
            <AppText
              variant="caption"
              weight="bold"
              color={colors.textMuted}
              style={{ textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 12 }}
            >
              Recent sessions
            </AppText>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.hairline }} />
            <Tag label={`${sessions.length}`} tone="neutral" size="sm" />
          </View>

          <SoftCard radius={radii.card} intensity="md" padding={16}>
            {sessions.length === 0 ? (
              <View className="items-center" style={{ paddingVertical: 18 }}>
                <Neumorph variant="inset" radius={16} intensity="sm" padding={14} surface={colors.canvas}>
                  <Icon name="timer" size={24} color="textSubtle" strokeWidth={2} />
                </Neumorph>
                <AppText variant="body" weight="semibold" style={{ marginTop: 12 }}>
                  No sessions yet
                </AppText>
                <AppText
                  variant="caption"
                  color={colors.textMuted}
                  style={{ marginTop: 2, textAlign: 'center' }}
                >
                  Start a focus block and it will show up here.
                </AppText>
              </View>
            ) : (
              sessions.map(({ session, fresh }, i) => (
                <React.Fragment key={session.id}>
                  {i > 0 ? (
                    <View style={{ height: 1, backgroundColor: colors.hairline, opacity: 0.7 }} />
                  ) : null}
                  <SessionRow session={session} index={i} fresh={fresh} />
                </React.Fragment>
              ))
            )}
          </SoftCard>
        </View>

        {/* ---------- Tip footer ---------- */}
        <Pressable onPress={() => switchMode('deep')} style={{ marginTop: 20 }}>
          <Neumorph variant="inset" radius={radii.card} intensity="sm" padding={16} surface={colors.canvas}>
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <Icon name="lightbulb" size={20} color="highlighter" strokeWidth={2.3} fill={colors.highlighter} />
              <View style={{ flex: 1 }}>
                <AppText variant="caption" weight="semibold" style={{ fontSize: 13 }}>
                  Chasing flow state?
                </AppText>
                <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 12, marginTop: 1 }}>
                  Deep Focus blocks of 50 minutes beat scattered sprints.
                </AppText>
              </View>
              <Icon name="chevron-right" size={16} color="textSubtle" strokeWidth={2.2} />
            </View>
          </Neumorph>
        </Pressable>
      </ScrollView>
    </View>
  );
}
