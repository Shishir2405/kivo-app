import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SoftCard } from '@/components/ui/SoftCard';
import { SoftButton } from '@/components/ui/SoftButton';
import { SoftIconButton } from '@/components/ui/SoftIconButton';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { AppText } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { FocusTimerRing } from '@/components/tracker/FocusTimerRing';
import { colors, radii } from '@/theme/tokens';

type TimerMode = 'pomodoro' | 'deep';

const MODES: Record<
  TimerMode,
  { label: string; minutes: number; accent: string }
> = {
  pomodoro: { label: 'Pomodoro', minutes: 25, accent: colors.highlighter },
  deep: { label: 'Deep Focus', minutes: 50, accent: colors.signal },
};

const MODE_OPTIONS: SegmentedOption<TimerMode>[] = [
  { label: 'Pomodoro', value: 'pomodoro', icon: 'timer' },
  { label: 'Deep Focus', value: 'deep', icon: 'brain' },
];

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export type FocusTimerProps = {
  /** Minutes already focused today, for the footer summary. */
  focusedTodayMinutes?: number;
};

/**
 * The focus-timer card.
 *
 * The mode picker is a {@link SegmentedTabs} segmented control (the mandated
 * replacement for a radio group) — selecting a mode resets the countdown. A
 * neumorphic reanimated ring shows the remaining time; Start / Pause is a
 * primary SoftButton with a play/pause Icon, Reset is a round SoftIconButton.
 */
export function FocusTimer({ focusedTodayMinutes }: FocusTimerProps) {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [running, setRunning] = useState(false);
  const totalSeconds = MODES[mode].minutes * 60;
  const [remaining, setRemaining] = useState(totalSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Simple interval countdown (no persistence needed for the mock).
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

  // Stop automatically when the session completes.
  useEffect(() => {
    if (remaining === 0 && running) {
      setRunning(false);
    }
  }, [remaining, running]);

  const switchMode = useCallback(
    (next: TimerMode) => {
      if (next === mode) return;
      clearTick();
      setRunning(false);
      setMode(next);
      setRemaining(MODES[next].minutes * 60);
    },
    [mode, clearTick],
  );

  const reset = useCallback(() => {
    clearTick();
    setRunning(false);
    setRemaining(totalSeconds);
  }, [clearTick, totalSeconds]);

  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const finished = remaining === 0;
  const accent = MODES[mode].accent;

  return (
    <SoftCard radius={radii.cardLg} intensity="lg" padding={22}>
      {/* Mode segmented control (replaces a radio group). */}
      <SegmentedTabs
        options={MODE_OPTIONS}
        value={mode}
        onChange={switchMode}
        height={50}
      />

      {/* Neumorphic reanimated ring. */}
      <View style={{ alignItems: 'center', marginTop: 26, marginBottom: 22 }}>
        <FocusTimerRing
          progress={progress}
          timeLabel={formatClock(remaining)}
          modeLabel={
            finished ? 'Complete' : running ? 'In session' : MODES[mode].label
          }
          accent={accent}
          running={running}
        />
      </View>

      {/* Controls: primary Start/Pause + round Reset. */}
      <View className="flex-row items-center" style={{ gap: 12 }}>
        <SoftButton
          label={finished ? 'New session' : running ? 'Pause' : 'Start focus'}
          variant={finished ? 'carbon' : running ? 'carbon' : 'yellow'}
          size="md"
          fullWidth
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
              size={18}
              color={finished || running ? 'paper' : 'carbon'}
              strokeWidth={2.4}
              fill={running ? 'paper' : !finished ? 'carbon' : 'none'}
            />
          }
          style={{ flex: 1 }}
        />
        <SoftIconButton
          size={52}
          onPress={reset}
          accessibilityLabel="Reset timer"
        >
          <Icon name="refresh" size={20} color="carbon" strokeWidth={2.2} />
        </SoftIconButton>
      </View>

      {/* Footer summary. */}
      {typeof focusedTodayMinutes === 'number' ? (
        <View
          className="flex-row items-center justify-center"
          style={{ gap: 7, marginTop: 16 }}
        >
          <Icon name="zap" size={14} color="textSubtle" strokeWidth={2.4} />
          <AppText variant="caption" color={colors.textSubtle}>
            {focusedTodayMinutes} min focused today
          </AppText>
        </View>
      ) : null}
    </SoftCard>
  );
}

export default FocusTimer;
