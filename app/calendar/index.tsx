/**
 * Calendar — a flat STEEP study planner (no external calendar lib).
 *
 * REAL data only: there is no `/calendar` endpoint, so this screen aggregates
 * the live domain lists — tasks (dueDate), revisions (dueDate), study sessions
 * (date) and reflections (date) — into one `CalendarEvent[]` via
 * `aggregateCalendarEvents`. The mock fallback has been removed. Three views
 * switch with the Steep SegmentedTabs:
 *   • Month  — a hand-built 6×7 grid. TODAY is a small filled Ink chip; the
 *              selected day is a Fog well. Up to three small event dots per
 *              cell. Tapping a day reveals its events below.
 *   • Week   — seven day rows with their events inline.
 *   • Agenda — Today / Upcoming / Earlier sections.
 *
 * CRUD: study sessions can be created (header "+", quick-add row, day CTA) and,
 * once they exist as events, tap-to-edit / long-press-to-delete. All writes go
 * through the shared FormSheet + the study-session mutation hooks; loading /
 * empty / error states are surfaced inline (never crashes).
 */
import React, { useMemo, useState, useCallback } from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { Tag } from '@/components/ui/Tag';
import { AppHeader } from '@/components/ui/AppHeader';
import { TextLink } from '@/components/ui/PillButton';
import { Skeleton, SkeletonText } from '@/components/ui';
import {
  AddButton,
  QuickAddRow,
  EmptyStateCTA,
  FormSheet,
  SoftInput,
} from '@/components/ui';

import { useTheme, motion } from '@/theme';
import { radii, interaction } from '@/theme/tokens';
import type { CalendarEvent, CalendarEventType, StudySession } from '@/types/models';
import {
  useTasks,
  useRevisions,
  useStudySessions,
  useReflections,
  useCreateStudySession,
  useUpdateStudySession,
  useDeleteStudySession,
} from '@/hooks/api';

import { EventRow } from '@/components/calendar/EventRow';
import { aggregateCalendarEvents } from '@/components/calendar/calendarAggregate';
import {
  accentDot,
  TYPE_META,
  TYPE_ORDER,
  TODAY_KEY,
  WEEKDAY_INITIALS,
  buildMonthGrid,
  monthLabel,
  longDayLabel,
  weekKeys,
  startOfWeek,
  isSameMonth,
  indexByDay,
  buildAgenda,
  parseKey,
  timeLabel,
  type GridCell,
  type Accent,
} from '@/components/calendar/calendarMeta';

type ViewMode = 'month' | 'week' | 'agenda';
type TypeFilter = CalendarEventType | null;

const VIEW_OPTIONS = [
  { label: 'Month', value: 'month' as const, icon: 'grid' as const },
  { label: 'Week', value: 'week' as const, icon: 'list' as const },
  { label: 'Agenda', value: 'agenda' as const, icon: 'calendar-check' as const },
];

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Pressable with a static opacity-dip press feedback. NativeWind drops the
 * FUNCTION form of `style`, so press feedback is driven by local state + a
 * static style array instead of `style={({ pressed }) => ...}`.
 */
function PressFade({
  style,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: React.ComponentProps<typeof Pressable>) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      style={[style as any, pressed && { opacity: interaction.pressOpacity }]}
    >
      {children}
    </Pressable>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** A study-session event id is prefixed "session_<id>" by the aggregator. */
function sessionIdFromEvent(ev: CalendarEvent): string | null {
  return ev.id.startsWith('session_') ? ev.id.slice('session_'.length) : null;
}

/* ================================================================== */
/* Screen                                                              */
/* ================================================================== */

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();

  // ---- Real data sources -------------------------------------------------
  const tasksQuery = useTasks();
  const revisionsQuery = useRevisions();
  const sessionsQuery = useStudySessions();
  const reflectionsQuery = useReflections();

  const createSession = useCreateStudySession();
  const updateSession = useUpdateStudySession();
  const deleteSession = useDeleteStudySession();

  const queries = [tasksQuery, revisionsQuery, sessionsQuery, reflectionsQuery];
  const isInitialLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);
  const firstError = queries.find((q) => q.isError)?.error?.message ?? 'Couldn’t load your calendar.';
  const refetchAll = useCallback(() => {
    void tasksQuery.refetch();
    void revisionsQuery.refetch();
    void sessionsQuery.refetch();
    void reflectionsQuery.refetch();
  }, [tasksQuery, revisionsQuery, sessionsQuery, reflectionsQuery]);

  const allEvents = useMemo<CalendarEvent[]>(
    () =>
      aggregateCalendarEvents({
        tasks: tasksQuery.data,
        revisions: revisionsQuery.data,
        sessions: sessionsQuery.data,
        reflections: reflectionsQuery.data,
      }),
    [tasksQuery.data, revisionsQuery.data, sessionsQuery.data, reflectionsQuery.data],
  );

  // ---- View state --------------------------------------------------------
  const [view, setView] = useState<ViewMode>('month');
  const [filter, setFilter] = useState<TypeFilter>(null);
  const [selectedDay, setSelectedDay] = useState<string>(TODAY_KEY);

  const todayParts = parseKey(TODAY_KEY);
  const [focusY, setFocusY] = useState(todayParts.y);
  const [focusM0, setFocusM0] = useState(todayParts.m0);
  const [weekAnchor, setWeekAnchor] = useState(TODAY_KEY);

  // ---- Session create/edit sheet ----------------------------------------
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<StudySession | null>(null);
  const [sheetDay, setSheetDay] = useState<string>(TODAY_KEY);
  const [fTopic, setFTopic] = useState('');
  const [fMinutes, setFMinutes] = useState('');
  const [fSolved, setFSolved] = useState('');
  const [formErr, setFormErr] = useState('');

  const sessionsById = useMemo(() => {
    const m = new Map<string, StudySession>();
    for (const s of sessionsQuery.data ?? []) if (s) m.set(s.id, s);
    return m;
  }, [sessionsQuery.data]);

  const openCreate = useCallback((dayKey: string) => {
    setEditing(null);
    setSheetDay(dayKey);
    setFTopic('');
    setFMinutes('');
    setFSolved('');
    setFormErr('');
    setSheetOpen(true);
  }, []);

  const openEditByEvent = useCallback(
    (ev: CalendarEvent) => {
      const id = sessionIdFromEvent(ev);
      if (!id) return;
      const session = sessionsById.get(id);
      if (!session) return;
      setEditing(session);
      setSheetDay(session.date.slice(0, 10));
      setFTopic(session.topic ?? '');
      setFMinutes(String(session.minutes ?? ''));
      setFSolved(session.problemsSolved > 0 ? String(session.problemsSolved) : '');
      setFormErr('');
      setSheetOpen(true);
    },
    [sessionsById],
  );

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    setEditing(null);
  }, []);

  // Backend study-sessions validator: topicName min 1 / max 200;
  // durationMinutes int nonnegative max 1440 (we require > 0 for a logged focus
  // session). Mirror those limits here so submit is blocked + errors inline.
  const TOPIC_MAX = 200;
  const MINUTES_MAX = 1_440;

  const minutesNum = parseInt(fMinutes, 10);
  const minutesValid =
    !Number.isNaN(minutesNum) && minutesNum > 0 && minutesNum <= MINUTES_MAX;
  const topicTrimmed = fTopic.trim();
  const topicValid = topicTrimmed.length > 0 && topicTrimmed.length <= TOPIC_MAX;
  const submitDisabled = !topicValid || !minutesValid;
  const saving = createSession.isPending || updateSession.isPending;

  const submitSession = useCallback(() => {
    if (topicTrimmed.length === 0) {
      setFormErr('Give the session a topic.');
      return;
    }
    if (topicTrimmed.length > TOPIC_MAX) {
      setFormErr(`Topic must be at most ${TOPIC_MAX} characters.`);
      return;
    }
    if (!minutesValid) {
      setFormErr(`Enter the minutes focused (1–${MINUTES_MAX}).`);
      return;
    }
    setFormErr('');
    const solvedNum = parseInt(fSolved, 10);
    const problemsSolved = Number.isNaN(solvedNum) || solvedNum < 0 ? 0 : solvedNum;

    if (editing) {
      updateSession.mutate(
        {
          id: editing.id,
          patch: { topic: topicTrimmed, minutes: minutesNum, problemsSolved },
        },
        { onSuccess: closeSheet, onError: (e) => setFormErr(e.message) },
      );
    } else {
      createSession.mutate(
        { topic: topicTrimmed, minutes: minutesNum, problemsSolved, date: sheetDay },
        { onSuccess: closeSheet, onError: (e) => setFormErr(e.message) },
      );
    }
  }, [
    topicTrimmed,
    minutesValid,
    fSolved,
    editing,
    updateSession,
    minutesNum,
    closeSheet,
    createSession,
    sheetDay,
  ]);

  const confirmDeleteEvent = useCallback(
    (ev: CalendarEvent) => {
      const id = sessionIdFromEvent(ev);
      if (!id) return;
      Alert.alert('Delete session?', `“${ev.title}” will be removed from your calendar.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteSession.mutate(id),
        },
      ]);
    },
    [deleteSession],
  );

  // ---- Derived view data -------------------------------------------------
  const filtered = useMemo<CalendarEvent[]>(
    () => (filter ? allEvents.filter((e) => e.type === filter) : allEvents),
    [filter, allEvents],
  );

  const byDay = useMemo(() => indexByDay(filtered), [filtered]);
  const grid = useMemo(() => buildMonthGrid(focusY, focusM0), [focusY, focusM0]);
  const agenda = useMemo(() => buildAgenda(filtered), [filtered]);

  const todaysEvents = byDay.get(TODAY_KEY) ?? [];
  const selectedEvents = byDay.get(selectedDay) ?? [];

  const totalUpcoming = useMemo(
    () => allEvents.filter((e) => e.date >= TODAY_KEY && !e.done).length,
    [allEvents],
  );

  const stepMonth = useCallback((dir: -1 | 1) => {
    setFocusM0((prevM0) => {
      let m = prevM0 + dir;
      if (m < 0) {
        m = 11;
        setFocusY((y) => y - 1);
      } else if (m > 11) {
        m = 0;
        setFocusY((y) => y + 1);
      }
      return m;
    });
  }, []);

  const stepWeek = useCallback((dir: -1 | 1) => {
    setWeekAnchor((prev) => {
      const mon = startOfWeek(prev);
      const { y, m0, d } = parseKey(mon);
      const dt = new Date(y, m0, d + dir * 7);
      return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
    });
  }, []);

  const goToday = useCallback(() => {
    const p = parseKey(TODAY_KEY);
    setFocusY(p.y);
    setFocusM0(p.m0);
    setWeekAnchor(TODAY_KEY);
    setSelectedDay(TODAY_KEY);
  }, []);

  const onSelectDay = useCallback((cell: GridCell) => {
    setSelectedDay(cell.key);
    if (!cell.inMonth) {
      const p = parseKey(cell.key);
      setFocusY(p.y);
      setFocusM0(p.m0);
    }
  }, []);

  // ---- Render ------------------------------------------------------------
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={{ paddingHorizontal: 20 }}>
        <AppHeader
          onBack={() => router.back()}
          right={
            <View className="flex-row items-center" style={{ gap: 14 }}>
              <PressFade
                onPress={goToday}
                hitSlop={8}
                accessibilityLabel="Jump to today"
              >
                <AppText variant="caption" weight="medium" color={colors.ink}>
                  Today
                </AppText>
              </PressFade>
              <AddButton
                onPress={() => openCreate(selectedDay)}
                accessibilityLabel="Log a study session"
              />
            </View>
          }
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: insets.bottom + 48,
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
            Calendar
          </AppText>
          <AppText variant="body" color={colors.ash} style={{ marginTop: 4 }}>
            {todaysEvents.length > 0
              ? `${todaysEvents.length} today · ${totalUpcoming} upcoming`
              : `Nothing today · ${totalUpcoming} upcoming`}
          </AppText>
        </MotiView>

        {/* View switch */}
        <SegmentedTabs<ViewMode> options={VIEW_OPTIONS} value={view} onChange={setView} style={{ marginBottom: 12 }} />

        {/* Type filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
        >
          <Chip label="All" icon="calendar" selected={filter === null} onPress={() => setFilter(null)} />
          {TYPE_ORDER.map((t) => (
            <Chip
              key={t}
              label={TYPE_META[t].label}
              icon={TYPE_META[t].icon}
              selected={filter === t}
              onPress={() => setFilter(t)}
            />
          ))}
        </ScrollView>

        {/* Loading / error / active view */}
        {isError && allEvents.length === 0 ? (
          <CalendarError message={firstError} onRetry={refetchAll} />
        ) : isInitialLoading && allEvents.length === 0 ? (
          <CalendarLoading />
        ) : view === 'month' ? (
          <MonthView
            grid={grid}
            focusY={focusY}
            focusM0={focusM0}
            byDay={byDay}
            selectedDay={selectedDay}
            onSelectDay={onSelectDay}
            onStep={stepMonth}
            selectedEvents={selectedEvents}
            onAddSession={openCreate}
            onEditSession={openEditByEvent}
            onDeleteSession={confirmDeleteEvent}
          />
        ) : view === 'week' ? (
          <WeekView anchor={weekAnchor} byDay={byDay} onStep={stepWeek} />
        ) : (
          <AgendaView
            sections={agenda}
            empty={allEvents.length === 0}
            onAdd={() => openCreate(TODAY_KEY)}
            onEditSession={openEditByEvent}
            onDeleteSession={confirmDeleteEvent}
          />
        )}
      </ScrollView>

      {/* Create / edit study-session sheet */}
      <FormSheet
        visible={sheetOpen}
        onClose={closeSheet}
        onSubmit={submitSession}
        title={editing ? 'Edit session' : 'Log a session'}
        subtitle={editing ? undefined : longDayLabel(sheetDay)}
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
          onChangeText={setFTopic}
          placeholder="e.g. Graphs · BFS / DFS"
          maxLength={TOPIC_MAX}
          autoFocus
          returnKeyType="next"
          error={
            topicTrimmed.length > TOPIC_MAX
              ? `Topic must be at most ${TOPIC_MAX} characters.`
              : topicTrimmed.length === 0 && formErr
              ? 'Topic is required'
              : undefined
          }
        />
        <SoftInput
          label="Minutes focused"
          value={fMinutes}
          onChangeText={setFMinutes}
          placeholder="e.g. 45"
          keyboardType="number-pad"
          error={
            !minutesValid && (fMinutes.trim().length > 0 || formErr)
              ? `Enter a number between 1 and ${MINUTES_MAX}`
              : undefined
          }
        />
        <SoftInput
          label="Problems solved (optional)"
          value={fSolved}
          onChangeText={setFSolved}
          placeholder="e.g. 3"
          keyboardType="number-pad"
        />
      </FormSheet>
    </View>
  );
}

/* ================================================================== */
/* Loading + error states                                              */
/* ================================================================== */

function CalendarLoading() {
  const { colors } = useTheme();
  return (
    <View>
      <SoftCard radius={radii.card} padding={14}>
        <Skeleton width="50%" height={18} radius={6} style={{ alignSelf: 'center', marginBottom: 14 }} />
        {[0, 1, 2, 3, 4].map((row) => (
          <View key={row} className="flex-row" style={{ marginBottom: 8, gap: 8 }}>
            {[0, 1, 2, 3, 4, 5, 6].map((c) => (
              <Skeleton key={c} height={34} radius={10} style={{ flex: 1 }} />
            ))}
          </View>
        ))}
      </SoftCard>
      <View style={{ gap: 8, marginTop: 16 }}>
        {[0, 1, 2].map((i) => (
          <SoftCard key={i} radius={radii.card} padding={12}>
            <SkeletonText lines={2} lineHeight={12} gap={8} lastWidth="60%" />
          </SoftCard>
        ))}
      </View>
    </View>
  );
}

function CalendarError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { colors } = useTheme();
  return (
    <SoftCard variant="inset" radius={radii.card} padding={22}>
      <View className="items-center" style={{ gap: 8 }}>
        <Icon name="alert" size={22} color="graphite" />
        <AppText variant="subheading" weight="medium">
          Couldn’t load your calendar
        </AppText>
        <AppText variant="body" color={colors.ash} style={{ textAlign: 'center', maxWidth: 260 }}>
          {message}
        </AppText>
        <TextLink label="Try again" onPress={onRetry} icon={<Icon name="repeat" size={14} color="ink" />} />
      </View>
    </SoftCard>
  );
}

/* ================================================================== */
/* Month view                                                          */
/* ================================================================== */

function MonthView({
  grid,
  focusY,
  focusM0,
  byDay,
  selectedDay,
  onSelectDay,
  onStep,
  selectedEvents,
  onAddSession,
  onEditSession,
  onDeleteSession,
}: {
  grid: GridCell[];
  focusY: number;
  focusM0: number;
  byDay: Map<string, CalendarEvent[]>;
  selectedDay: string;
  onSelectDay: (cell: GridCell) => void;
  onStep: (dir: -1 | 1) => void;
  selectedEvents: CalendarEvent[];
  onAddSession: (dayKey: string) => void;
  onEditSession: (ev: CalendarEvent) => void;
  onDeleteSession: (ev: CalendarEvent) => void;
}) {
  const { colors } = useTheme();
  return (
    <View>
      <SoftCard radius={radii.card} padding={14}>
        {/* Month pager */}
        <View className="flex-row items-center justify-between" style={{ marginBottom: 12 }}>
          <PressFade
            onPress={() => onStep(-1)}
            hitSlop={10}
            accessibilityLabel="Previous month"
          >
            <Icon name="chevron-left" size={20} color="ink" />
          </PressFade>
          <AppText variant="heading" display weight="medium">
            {monthLabel(focusY, focusM0)}
          </AppText>
          <PressFade
            onPress={() => onStep(1)}
            hitSlop={10}
            accessibilityLabel="Next month"
          >
            <Icon name="chevron-right" size={20} color="ink" />
          </PressFade>
        </View>

        {/* Weekday header */}
        <View className="flex-row" style={{ marginBottom: 4 }}>
          {WEEKDAY_INITIALS.map((d, i) => (
            <View key={`${d}-${i}`} style={{ flex: 1, alignItems: 'center' }}>
              <AppText variant="caption" color={colors.muted}>
                {d}
              </AppText>
            </View>
          ))}
        </View>

        {/* Weeks */}
        {chunk(grid, 7).map((row, rowIdx) => (
          <View key={rowIdx} className="flex-row">
            {row.map((cell) => (
              <DayCell
                key={cell.key}
                cell={cell}
                events={byDay.get(cell.key) ?? []}
                selected={cell.key === selectedDay}
                onPress={() => onSelectDay(cell)}
              />
            ))}
          </View>
        ))}
      </SoftCard>

      <SelectedDayList
        dayKey={selectedDay}
        events={selectedEvents}
        focusY={focusY}
        focusM0={focusM0}
        onAddSession={onAddSession}
        onEditSession={onEditSession}
        onDeleteSession={onDeleteSession}
      />
    </View>
  );
}

function DayCell({
  cell,
  events,
  selected,
  onPress,
}: {
  cell: GridCell;
  events: CalendarEvent[];
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { isToday, inMonth, day } = cell;
  const dotAccents = events.slice(0, 3).map((e) => e.accent as Accent);
  const overflow = events.length > 3;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${day}, ${events.length} events`}
      accessibilityState={{ selected }}
      android_ripple={{ color: colors.hairline, borderless: false }}
      style={{ flex: 1, aspectRatio: 1, padding: 2 }}
    >
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 10,
          backgroundColor: isToday ? colors.primary : selected ? colors.surfaceAlt : 'transparent',
          borderWidth: selected && !isToday ? 1 : 0,
          borderColor: colors.hairline,
        }}
      >
        <AppText
          variant="body"
          weight={isToday || selected ? 'medium' : 'regular'}
          color={isToday ? colors.onPrimary : inMonth ? colors.ink : colors.muted}
        >
          {day}
        </AppText>

        {/* Event dots */}
        <View className="flex-row items-center" style={{ gap: 2.5, marginTop: 2, height: 5 }}>
          {dotAccents.map((accent, i) => (
            <View
              key={i}
              style={{
                width: 4,
                height: 4,
                borderRadius: 999,
                backgroundColor: isToday ? colors.onPrimary : accentDot(accent, colors),
              }}
            />
          ))}
          {overflow ? (
            <AppText variant="caption" color={isToday ? colors.onPrimary : colors.muted} style={{ fontSize: 8, lineHeight: 8 }}>
              +
            </AppText>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function SelectedDayList({
  dayKey,
  events,
  focusY,
  focusM0,
  onAddSession,
  onEditSession,
  onDeleteSession,
}: {
  dayKey: string;
  events: CalendarEvent[];
  focusY: number;
  focusM0: number;
  onAddSession: (dayKey: string) => void;
  onEditSession: (ev: CalendarEvent) => void;
  onDeleteSession: (ev: CalendarEvent) => void;
}) {
  const inFocusedMonth = isSameMonth(dayKey, focusY, focusM0);
  const today = dayKey === TODAY_KEY;

  return (
    <View style={{ marginTop: 16 }}>
      <View className="flex-row items-center" style={{ gap: 8, marginBottom: 10 }}>
        <AppText variant="heading" display weight="medium">
          {today ? 'Today' : longDayLabel(dayKey)}
        </AppText>
        {today ? <Tag label="Now" tone="ink" size="sm" /> : null}
        <View style={{ flex: 1 }} />
        {events.length > 0 ? <Tag label={`${events.length}`} tone="neutral" size="sm" /> : null}
      </View>

      {events.length === 0 ? (
        <EmptyStateCTA
          icon="calendar"
          title={inFocusedMonth ? 'No events this day' : 'Nothing scheduled'}
          description="Pick another day, or log a focus session for this date."
          actionLabel="Log a session"
          onAction={() => onAddSession(dayKey)}
        />
      ) : (
        <View style={{ gap: 8 }}>
          {events.map((ev, i) => (
            <CalendarEventCard
              key={ev.id}
              event={ev}
              index={i}
              onEditSession={onEditSession}
              onDeleteSession={onDeleteSession}
            />
          ))}
          <QuickAddRow label="Log a session" icon="timer" onPress={() => onAddSession(dayKey)} style={{ marginTop: 2 }} />
        </View>
      )}
    </View>
  );
}

/* ================================================================== */
/* Editable event card — tap-to-edit / long-press-to-delete sessions   */
/* ================================================================== */

function CalendarEventCard({
  event,
  index,
  onEditSession,
  onDeleteSession,
}: {
  event: CalendarEvent;
  index: number;
  onEditSession: (ev: CalendarEvent) => void;
  onDeleteSession: (ev: CalendarEvent) => void;
}) {
  const isSession = event.id.startsWith('session_');
  if (!isSession) {
    return <EventRow event={event} index={index} />;
  }
  return (
    <PressFade
      onPress={() => onEditSession(event)}
      onLongPress={() => onDeleteSession(event)}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}. Tap to edit, long-press to delete.`}
    >
      <EventRow event={event} index={index} />
    </PressFade>
  );
}

/* ================================================================== */
/* Week view                                                          */
/* ================================================================== */

function WeekView({
  anchor,
  byDay,
  onStep,
}: {
  anchor: string;
  byDay: Map<string, CalendarEvent[]>;
  onStep: (dir: -1 | 1) => void;
}) {
  const days = weekKeys(anchor);
  const first = parseKey(days[0]);
  const last = parseKey(days[6]);
  const rangeLabel = `${MONTHS_SHORT[first.m0]} ${first.d} – ${MONTHS_SHORT[last.m0]} ${last.d}`;

  return (
    <View>
      <View className="flex-row items-center justify-between" style={{ marginBottom: 12 }}>
        <PressFade
          onPress={() => onStep(-1)}
          hitSlop={10}
          accessibilityLabel="Previous week"
        >
          <Icon name="chevron-left" size={20} color="ink" />
        </PressFade>
        <AppText variant="heading" display weight="medium">
          {rangeLabel}
        </AppText>
        <PressFade
          onPress={() => onStep(1)}
          hitSlop={10}
          accessibilityLabel="Next week"
        >
          <Icon name="chevron-right" size={20} color="ink" />
        </PressFade>
      </View>

      <View style={{ gap: 10 }}>
        {days.map((dayKey) => (
          <WeekDayCard key={dayKey} dayKey={dayKey} events={byDay.get(dayKey) ?? []} />
        ))}
      </View>
    </View>
  );
}

function WeekDayCard({ dayKey, events }: { dayKey: string; events: CalendarEvent[] }) {
  const { colors } = useTheme();
  const today = dayKey === TODAY_KEY;
  const p = parseKey(dayKey);
  const wd = new Date(p.y, p.m0, p.d).getDay();
  const wdLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][wd];

  return (
    <SoftCard radius={radii.card} padding={12}>
      <View className="flex-row items-center" style={{ gap: 12 }}>
        {/* Date chip */}
        <View
          style={{
            width: 46,
            height: 50,
            borderRadius: radii.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: today ? colors.primary : colors.surfaceAlt,
            borderWidth: today ? 0 : 1,
            borderColor: colors.hairline,
          }}
        >
          <AppText variant="caption" color={today ? colors.onPrimary : colors.muted} style={{ textTransform: 'uppercase' }}>
            {wdLabel}
          </AppText>
          <AppText variant="heading" display weight="medium" color={today ? colors.onPrimary : colors.ink}>
            {p.d}
          </AppText>
        </View>

        {/* Events */}
        <View style={{ flex: 1 }}>
          {events.length === 0 ? (
            <AppText variant="caption" color={colors.muted}>
              No events
            </AppText>
          ) : (
            <View style={{ gap: 7 }}>
              {events.map((ev) => (
                <WeekEventLine key={ev.id} event={ev} />
              ))}
            </View>
          )}
        </View>
      </View>
    </SoftCard>
  );
}

function WeekEventLine({ event }: { event: CalendarEvent }) {
  const { colors } = useTheme();
  const accent = event.accent as Accent;
  const done = !!event.done;
  return (
    <View className="flex-row items-center" style={{ gap: 8 }}>
      <View
        style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: done ? colors.hairline : accentDot(accent, colors) }}
      />
      <AppText
        variant="body"
        weight="regular"
        color={done ? colors.muted : colors.ink}
        numberOfLines={1}
        style={{ flex: 1 }}
      >
        {event.title}
      </AppText>
      <AppText variant="caption" color={colors.muted}>
        {event.time ? timeLabel(event.time) : 'All day'}
      </AppText>
    </View>
  );
}

/* ================================================================== */
/* Agenda view                                                         */
/* ================================================================== */

function AgendaView({
  sections,
  empty,
  onAdd,
  onEditSession,
  onDeleteSession,
}: {
  sections: ReturnType<typeof buildAgenda>;
  empty: boolean;
  onAdd: () => void;
  onEditSession: (ev: CalendarEvent) => void;
  onDeleteSession: (ev: CalendarEvent) => void;
}) {
  const { colors } = useTheme();
  if (sections.length === 0) {
    return (
      <EmptyStateCTA
        icon="calendar"
        title={empty ? 'Your calendar is clear' : 'No events match'}
        description={
          empty
            ? 'Tasks, revisions, sessions and reflections show up here. Log your first focus session to begin.'
            : 'Try a different filter — your study events will appear here.'
        }
        actionLabel={empty ? 'Log a session' : undefined}
        onAction={empty ? onAdd : undefined}
      />
    );
  }

  let rowIndex = 0;
  return (
    <View>
      <QuickAddRow label="Log a session" icon="timer" onPress={onAdd} style={{ marginBottom: 16 }} />
      {sections.map((section) => (
        <View key={section.key} style={{ marginBottom: 20 }}>
          <View className="flex-row items-center" style={{ gap: 8, marginBottom: 12 }}>
            <AppText variant="caption" color={colors.muted} style={{ letterSpacing: 0.6, textTransform: 'uppercase' }}>
              {section.title}
            </AppText>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.hairline }} />
            <Tag
              label={`${section.days.reduce((n, d) => n + d.events.length, 0)}`}
              tone={section.key === 'today' ? 'ink' : 'neutral'}
              size="sm"
            />
          </View>

          {section.days.map((dayGroup) => (
            <View key={dayGroup.key} style={{ marginBottom: 12 }}>
              {section.key !== 'today' ? (
                <AppText variant="caption" color={colors.muted} style={{ marginBottom: 8 }}>
                  {longDayLabel(dayGroup.key)}
                </AppText>
              ) : null}
              <View style={{ gap: 8 }}>
                {dayGroup.events.map((ev) => (
                  <CalendarEventCard
                    key={ev.id}
                    event={ev}
                    index={rowIndex++}
                    onEditSession={onEditSession}
                    onDeleteSession={onDeleteSession}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
