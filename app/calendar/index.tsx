/**
 * Calendar — a flat STEEP study planner (no external calendar lib).
 *
 * There is no `/calendar` endpoint, so this reads the deterministic mock
 * (`mockCalendarEvents`) — the only screen here that falls back to mock. Three
 * views switch with the Steep SegmentedTabs:
 *   • Month  — a hand-built 6×7 grid. TODAY is a small filled Ink chip; the
 *              selected day is a Fog well. Up to three small Rust/Ink/Graphite
 *              event dots per cell. Tapping a day reveals its events below.
 *   • Week   — seven day rows with their events inline.
 *   • Agenda — Today / Upcoming / Earlier sections.
 *
 * A flat-Chip type filter narrows all three views. Editorial + flat: serif
 * titles, Inter body, small thin icons, one subtle shadow + Dove hairline.
 */
import React, { useMemo, useState, useCallback } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { Tag } from '@/components/ui/Tag';
import { AppHeader } from '@/components/ui/AppHeader';

import { colors, radii } from '@/theme/tokens';
import { mockCalendarEvents } from '@/data/mock';
import type { CalendarEvent, CalendarEventType } from '@/types/models';

import { EventRow } from '@/components/calendar/EventRow';
import {
  ACCENT_DOT,
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

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/* ================================================================== */
/* Screen                                                              */
/* ================================================================== */

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [view, setView] = useState<ViewMode>('month');
  const [filter, setFilter] = useState<TypeFilter>(null);
  const [selectedDay, setSelectedDay] = useState<string>(TODAY_KEY);

  const todayParts = parseKey(TODAY_KEY);
  const [focusY, setFocusY] = useState(todayParts.y);
  const [focusM0, setFocusM0] = useState(todayParts.m0);
  const [weekAnchor, setWeekAnchor] = useState(TODAY_KEY);

  const filtered = useMemo<CalendarEvent[]>(
    () => (filter ? mockCalendarEvents.filter((e) => e.type === filter) : mockCalendarEvents),
    [filter],
  );

  const byDay = useMemo(() => indexByDay(filtered), [filtered]);
  const grid = useMemo(() => buildMonthGrid(focusY, focusM0), [focusY, focusM0]);
  const agenda = useMemo(() => buildAgenda(filtered), [filtered]);

  const todaysEvents = byDay.get(TODAY_KEY) ?? [];
  const selectedEvents = byDay.get(selectedDay) ?? [];

  const totalUpcoming = useMemo(
    () => mockCalendarEvents.filter((e) => e.date >= TODAY_KEY && !e.done).length,
    [],
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={{ paddingHorizontal: 20 }}>
        <AppHeader
          onBack={() => router.back()}
          right={
            <Pressable onPress={goToday} hitSlop={8} accessibilityLabel="Jump to today">
              <AppText variant="caption" weight="medium" color={colors.ink}>
                Today
              </AppText>
            </Pressable>
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
        <View style={{ marginBottom: 16 }}>
          <AppText variant="display" display weight="semibold">
            Calendar
          </AppText>
          <AppText variant="body" color={colors.ash} style={{ marginTop: 4 }}>
            {todaysEvents.length > 0
              ? `${todaysEvents.length} today · ${totalUpcoming} upcoming`
              : `Nothing today · ${totalUpcoming} upcoming`}
          </AppText>
        </View>

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

        {/* Active view */}
        {view === 'month' ? (
          <MonthView
            grid={grid}
            focusY={focusY}
            focusM0={focusM0}
            byDay={byDay}
            selectedDay={selectedDay}
            onSelectDay={onSelectDay}
            onStep={stepMonth}
            selectedEvents={selectedEvents}
          />
        ) : view === 'week' ? (
          <WeekView anchor={weekAnchor} byDay={byDay} onStep={stepWeek} />
        ) : (
          <AgendaView sections={agenda} />
        )}
      </ScrollView>
    </View>
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
}: {
  grid: GridCell[];
  focusY: number;
  focusM0: number;
  byDay: Map<string, CalendarEvent[]>;
  selectedDay: string;
  onSelectDay: (cell: GridCell) => void;
  onStep: (dir: -1 | 1) => void;
  selectedEvents: CalendarEvent[];
}) {
  return (
    <View>
      <SoftCard radius={radii.card} padding={14}>
        {/* Month pager */}
        <View className="flex-row items-center justify-between" style={{ marginBottom: 12 }}>
          <Pressable onPress={() => onStep(-1)} hitSlop={10} accessibilityLabel="Previous month">
            <Icon name="chevron-left" size={20} color="ink" />
          </Pressable>
          <AppText variant="heading" display weight="medium">
            {monthLabel(focusY, focusM0)}
          </AppText>
          <Pressable onPress={() => onStep(1)} hitSlop={10} accessibilityLabel="Next month">
            <Icon name="chevron-right" size={20} color="ink" />
          </Pressable>
        </View>

        {/* Weekday header */}
        <View className="flex-row" style={{ marginBottom: 4 }}>
          {WEEKDAY_INITIALS.map((d, i) => (
            <View key={`${d}-${i}`} style={{ flex: 1, alignItems: 'center' }}>
              <AppText variant="caption" color={colors.graphite}>
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

      <SelectedDayList dayKey={selectedDay} events={selectedEvents} focusY={focusY} focusM0={focusM0} />
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
  const { isToday, inMonth, day } = cell;
  const dotAccents = events.slice(0, 3).map((e) => e.accent as Accent);
  const overflow = events.length > 3;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${day}, ${events.length} events`}
      accessibilityState={{ selected }}
      style={{ flex: 1, aspectRatio: 1, padding: 2 }}
    >
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 10,
          backgroundColor: isToday ? colors.ink : selected ? colors.fog : 'transparent',
          borderWidth: selected && !isToday ? 1 : 0,
          borderColor: colors.dove,
        }}
      >
        <AppText
          variant="body"
          weight={isToday || selected ? 'medium' : 'regular'}
          color={isToday ? colors.white : inMonth ? colors.ink : colors.dove}
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
                backgroundColor: isToday ? colors.white : ACCENT_DOT[accent],
              }}
            />
          ))}
          {overflow ? (
            <AppText variant="caption" color={isToday ? colors.white : colors.graphite} style={{ fontSize: 8, lineHeight: 8 }}>
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
}: {
  dayKey: string;
  events: CalendarEvent[];
  focusY: number;
  focusM0: number;
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
        <CalendarEmpty
          title={inFocusedMonth ? 'No events this day' : 'Nothing scheduled'}
          body="Pick another day, or add a task, revision or focus session."
        />
      ) : (
        <View style={{ gap: 8 }}>
          {events.map((ev, i) => (
            <EventRow key={ev.id} event={ev} index={i} />
          ))}
        </View>
      )}
    </View>
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
        <Pressable onPress={() => onStep(-1)} hitSlop={10} accessibilityLabel="Previous week">
          <Icon name="chevron-left" size={20} color="ink" />
        </Pressable>
        <AppText variant="heading" display weight="medium">
          {rangeLabel}
        </AppText>
        <Pressable onPress={() => onStep(1)} hitSlop={10} accessibilityLabel="Next week">
          <Icon name="chevron-right" size={20} color="ink" />
        </Pressable>
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
            backgroundColor: today ? colors.ink : colors.fog,
            borderWidth: today ? 0 : 1,
            borderColor: colors.dove,
          }}
        >
          <AppText variant="caption" color={today ? colors.white : colors.graphite} style={{ textTransform: 'uppercase' }}>
            {wdLabel}
          </AppText>
          <AppText variant="heading" display weight="medium" color={today ? colors.white : colors.ink}>
            {p.d}
          </AppText>
        </View>

        {/* Events */}
        <View style={{ flex: 1 }}>
          {events.length === 0 ? (
            <AppText variant="caption" color={colors.graphite}>
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
  const accent = event.accent as Accent;
  const done = !!event.done;
  return (
    <View className="flex-row items-center" style={{ gap: 8 }}>
      <View
        style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: done ? colors.dove : ACCENT_DOT[accent] }}
      />
      <AppText
        variant="body"
        weight="regular"
        color={done ? colors.graphite : colors.ink}
        numberOfLines={1}
        style={{ flex: 1 }}
      >
        {event.title}
      </AppText>
      <AppText variant="caption" color={colors.graphite}>
        {event.time ? timeLabel(event.time) : 'All day'}
      </AppText>
    </View>
  );
}

/* ================================================================== */
/* Agenda view                                                         */
/* ================================================================== */

function AgendaView({ sections }: { sections: ReturnType<typeof buildAgenda> }) {
  if (sections.length === 0) {
    return <CalendarEmpty title="No events match" body="Try a different filter — your study events will appear here." />;
  }

  let rowIndex = 0;
  return (
    <View>
      {sections.map((section) => (
        <View key={section.key} style={{ marginBottom: 20 }}>
          <View className="flex-row items-center" style={{ gap: 8, marginBottom: 12 }}>
            <AppText variant="caption" color={colors.graphite} style={{ letterSpacing: 0.6, textTransform: 'uppercase' }}>
              {section.title}
            </AppText>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.fog }} />
            <Tag
              label={`${section.days.reduce((n, d) => n + d.events.length, 0)}`}
              tone={section.key === 'today' ? 'ink' : 'neutral'}
              size="sm"
            />
          </View>

          {section.days.map((dayGroup) => (
            <View key={dayGroup.key} style={{ marginBottom: 12 }}>
              {section.key !== 'today' ? (
                <AppText variant="caption" color={colors.graphite} style={{ marginBottom: 8 }}>
                  {longDayLabel(dayGroup.key)}
                </AppText>
              ) : null}
              <View style={{ gap: 8 }}>
                {dayGroup.events.map((ev) => (
                  <EventRow key={ev.id} event={ev} index={rowIndex++} />
                ))}
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/* ================================================================== */
/* Shared empty                                                        */
/* ================================================================== */

function CalendarEmpty({ title, body }: { title: string; body: string }) {
  return (
    <SoftCard variant="inset" radius={radii.card} padding={22}>
      <View className="items-center" style={{ gap: 8 }}>
        <Icon name="calendar" size={22} color="graphite" />
        <AppText variant="subheading" weight="medium">
          {title}
        </AppText>
        <AppText variant="body" color={colors.ash} style={{ textAlign: 'center', maxWidth: 260 }}>
          {body}
        </AppText>
      </View>
    </SoftCard>
  );
}
