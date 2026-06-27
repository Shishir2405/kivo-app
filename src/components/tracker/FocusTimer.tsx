import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Card } from '@/components/ui/SoftCard';
import { PillButton, TextLink } from '@/components/ui/PillButton';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { AppText } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { FocusTimerRing } from '@/components/tracker/FocusTimerRing';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme';

type TimerMode = 'pomodoro' | 'deep';

const MODES: Record<TimerMode, { label: string; minutes: number }> = {
  pomodoro: { label: 'Pomodoro', minutes: 25 },
  deep: { label: 'Deep focus', minutes: 50 },
};

const MODE_OPTIONS: SegmentedOption<TimerMode>[] = [
  { label: 'Pomodoro', value: 'pomodoro' },
  { label: 'Deep focus', value: 'deep' },
];

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export type FocusTimerProps = {
  /** Minutes already focused today, for the footer summary. */
  focusedTodayMinutes?: number;
  /**
   * Called once when a full session completes, with the focused minutes + the
   * timer type ('pomodoro' | 'deep') — the screen logs a study-session from
   * here. Wrapped by the caller so a failed write can never crash the timer.
   */
  onSessionComplete?: (minutes: number, mode: 'pomodoro' | 'deep') => void;
};

/**
 * The Steep focus-timer card — flat white, one clean Rust progress ring.
 *
 * Mode is a Steep segmented control (switching resets the countdown). Start /
 * Pause is the single filled Ink pill; Reset is a TextLink (secondary). On
 * completion the parent is notified so it can log a study-session.
 */
export function FocusTimer({ focusedTodayMinutes, onSessionComplete }: FocusTimerProps) {
  const { colors, accentForTone } = useTheme();
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [running, setRunning] = useState(false);
  const totalSeconds = MODES[mode].minutes * 60;
  const [remaining, setRemaining] = useState(totalSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Guard so onSessionComplete fires exactly once per finished session.
  const loggedRef = useRef(false);

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
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return clearTick;
  }, [running, clearTick]);

  // Stop + notify exactly once when the session completes.
  useEffect(() => {
    if (remaining === 0 && running) {
      setRunning(false);
      if (!loggedRef.current) {
        loggedRef.current = true;
        onSessionComplete?.(MODES[mode].minutes, mode);
      }
    }
  }, [remaining, running, mode, onSessionComplete]);

  const switchMode = useCallback(
    (next: TimerMode) => {
      if (next === mode) return;
      clearTick();
      setRunning(false);
      loggedRef.current = false;
      setMode(next);
      setRemaining(MODES[next].minutes * 60);
    },
    [mode, clearTick],
  );

  const reset = useCallback(() => {
    clearTick();
    setRunning(false);
    loggedRef.current = false;
    setRemaining(totalSeconds);
  }, [clearTick, totalSeconds]);

  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const finished = remaining === 0;
  const started = remaining < totalSeconds && !finished;

  return (
    <Card tone="peach" padding={spacing.lg}>
      <SegmentedTabs options={MODE_OPTIONS} value={mode} onChange={switchMode} />

      <View style={{ alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.lg }}>
        <FocusTimerRing
          progress={progress}
          timeLabel={formatClock(remaining)}
          modeLabel={finished ? 'Complete' : running ? 'In session' : MODES[mode].label}
        />
      </View>

      {/* Controls: the ONE filled Ink pill + a Reset TextLink. */}
      <View className="flex-row items-center justify-center" style={{ gap: spacing.lg }}>
        <PillButton
          label={finished ? 'New session' : running ? 'Pause' : started ? 'Resume' : 'Start focus'}
          variant="black"
          size="md"
          onPress={() => {
            if (finished) {
              reset();
            } else {
              setRunning((r) => !r);
            }
          }}
          icon={
            <Icon
              name={finished ? 'rotate' : running ? 'pause' : 'play'}
              size={15}
              color="onPrimary"
            />
          }
        />
        {started || finished ? (
          <TextLink label="Reset" onPress={reset} size="md" muted />
        ) : null}
      </View>

      {typeof focusedTodayMinutes === 'number' ? (
        <View
          className="flex-row items-center justify-center"
          style={{ gap: 6, marginTop: spacing.md }}
        >
          <Icon name="zap" size={13} color={accentForTone('peach')} weight="fill" />
          <AppText variant="caption" color={colors.graphite}>
            {focusedTodayMinutes} min focused today
          </AppText>
        </View>
      ) : null}
    </Card>
  );
}

export default FocusTimer;
