/**
 * Calendar — a neumorphic study planner built entirely from the Aaply kit.
 *
 * Three views, switched with the custom SegmentedTabs (no native picker):
 *   • Month  — a hand-built 6×7 grid (no external calendar lib). Each cell shows
 *              up to three accent event dots; TODAY is a filled highlighter-yellow
 *              chip; the selected day pops as an inset well. Tapping a day reveals
 *              its events below in a SoftCard list.
 *   • Week   — the seven days of the focused week as full-width day cards with
 *              their events inline, today highlighted in highlighter-yellow.
 *   • Agenda — every event sectioned into Today / Upcoming / Earlier with date
 *              sub-headers, type glyph + 12-hour time on each row.
 *
 * A type-filter Chip row narrows what's shown across all three views. Pure
 * vector Icons, ZERO emoji, graphite-mist canvas with soft dual shadows.
 */
import React, { useMemo, useState, useCallback } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { SoftIconButton } from '@/components/ui/SoftIconButton';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Tag } from '@/components/ui/Tag';
import { GrayMark } from '@/components/ui/AppHeader';

import { colors, radii } from '@/theme/tokens';
import { mockCalendarEvents } from '@/data/mock';
import type { CalendarEvent, CalendarEventType } from '@/types/models';

import { EventRow } from '@/components/calendar/EventRow';
import {
  ACCENT_HEX,
  TYPE_META,
  TYPE_ORDER,
  TODAY_KEY,
  WEEKDAY_INITIALS,
  buildMonthGrid,
  monthLabel,
  longDayLabel,
  weekdayName,
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
/** null = the "All" filter. */
type TypeFilter = CalendarEventType | null;

const VIEW_OPTIONS = [
  { label: 'Month', value: 'month' as const, icon: 'grid' as const },
  { label: 'Week', value: 'week' as const, icon: 'list' as const },
  { label: 'Agenda', value: 'agenda' as const, icon: 'calendar-check' as const },
];

const SECTION_GAP = 22;

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [view, setView] = useState<ViewMode>('month');
  const [filter, setFilter] = useState<TypeFilter>(null);
  const [selectedDay, setSelectedDay] = useState<string>(TODAY_KEY);

  // The month/week the grid is focused on (driven by the < > pager).
  const todayParts = parseKey(TODAY_KEY);
  const [focusY, setFocusY] = useState(todayParts.y);
  const [focusM0, setFocusM0] = useState(todayParts.m0);
  const [weekAnchor, setWeekAnchor] = useState(TODAY_KEY);

  /* --------------------------- Derived data --------------------------- */

  const filtered = useMemo<CalendarEvent[]>(
    () => (filter ? mockCalendarEvents.filter((e) => e.type === filter) : mockCalendarEvents),
    [filter],
  );

  const byDay = useMemo(() => indexByDay(filtered), [filtered]);
  const grid = useMemo(() => buildMonthGrid(focusY, focusM0), [focusY, focusM0]);
  const agenda = useMemo(() => buildAgenda(filtered), [filtered]);

  const todaysEvents = byDay.get(TODAY_KEY) ?? [];
  const selectedEvents = byDay.get(selectedDay) ?? [];

  // Headline stat: how many study events sit on TODAY.
  const totalUpcoming = useMemo(
    () => mockCalendarEvents.filter((e) => e.date >= TODAY_KEY && !e.done).length,
    [],
  );

  /* ----------------------------- Pagers ------------------------------- */

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
      const k = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
      return k;
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

  /* ------------------------------ Render ------------------------------ */

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 48,
        }}
      >
        {/* ---------- Top bar ---------- */}
        <View className="flex-row items-center justify-between">
          <SoftIconButton size={44} accessibilityLabel="Go back" onPress={() => router.back()}>
            <Icon name="chevron-left" size={22} color="carbon" />
          </SoftIconButton>
          <GrayMark size={24} />
          <SoftIconButton size={44} accessibilityLabel="Jump to today" onPress={goToday}>
            <Icon name="calendar-check" size={20} color="carbon" />
          </SoftIconButton>
        </View>

        {/* ---------- Header ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 360 }}
          style={{ marginTop: 18, marginBottom: 18 }}
        >
          <View className="flex-row items-center" style={{ gap: 7 }}>
            <Icon name="calendar" size={14} color="peach" strokeWidth={2.25} />
            <AppText
              variant="caption"
              weight="semibold"
              color={colors.textSubtle}
              style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 11 }}
            >
              Calendar
            </AppText>
          </View>
          <AppText variant="heading" display weight="bold" style={{ marginTop: 6 }}>
            Plan your{'\n'}study days
          </AppText>
        </MotiView>

        {/* ---------- Today summary ---------- */}
        <TodaySummary count={todaysEvents.length} upcoming={totalUpcoming} />

        {/* ---------- View switch ---------- */}
        <View style={{ marginTop: SECTION_GAP }}>
          <SegmentedTabs<ViewMode>
            options={VIEW_OPTIONS}
            value={view}
            onChange={setView}
            height={46}
          />
        </View>

        {/* ---------- Type filter chips ---------- */}
        <TypeFilterRow value={filter} onChange={setFilter} />

        {/* ---------- The active view ---------- */}
        <View style={{ marginTop: SECTION_GAP }}>
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
        </View>

        {/* ---------- Legend ---------- */}
        <Legend />
      </ScrollView>
    </View>
  );
}

/* ================================================================== */
/* Today summary                                                       */
/* ================================================================== */

function TodaySummary({ count, upcoming }: { count: number; upcoming: number }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 380, delay: 60 }}
    >
      <SoftCard radius={radii.card} padding={18} surface={colors.carbon}>
        <View className="flex-row items-center justify-between">
          <View style={{ flex: 1 }}>
            <AppText
              variant="caption"
              weight="bold"
              color="rgba(255,255,255,0.6)"
              style={{ textTransform: 'uppercase', letterSpacing: 1.6, fontSize: 11 }}
            >
              {weekdayName(TODAY_KEY)}
            </AppText>
            <AppText
              variant="headingSm"
              display
              weight="bold"
              color={colors.paper}
              style={{ marginTop: 4 }}
            >
              {longDayLabel(TODAY_KEY)}
            </AppText>
            <AppText
              variant="caption"
              color="rgba(255,255,255,0.7)"
              style={{ marginTop: 6, fontSize: 13 }}
            >
              {count > 0
                ? `${count} ${count === 1 ? 'event' : 'events'} today · ${upcoming} upcoming`
                : `Nothing today · ${upcoming} upcoming`}
            </AppText>
          </View>

          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              backgroundColor: colors.highlighter,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText variant="heading" display weight="bold" color={colors.carbon} style={{ fontSize: 26 }}>
              {parseKey(TODAY_KEY).d}
            </AppText>
          </View>
        </View>
      </SoftCard>
    </MotiView>
  );
}

/* ================================================================== */
/* Type filter chips                                                   */
/* ================================================================== */

function TypeFilterRow({
  value,
  onChange,
}: {
  value: CalendarEventType | null;
  onChange: (next: CalendarEventType | null) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 9, paddingVertical: 2 }}
      style={{ marginTop: 16, marginHorizontal: -20, paddingHorizontal: 20 }}
    >
      <FilterChip
        label="All"
        icon="calendar"
        active={value === null}
        accent="signal"
        onPress={() => onChange(null)}
      />
      {TYPE_ORDER.map((t) => (
        <FilterChip
          key={t}
          label={TYPE_META[t].label}
          icon={TYPE_META[t].icon}
          accent={TYPE_META[t].accent}
          active={value === t}
          onPress={() => onChange(t)}
        />
      ))}
    </ScrollView>
  );
}

function FilterChip({
  label,
  icon,
  accent,
  active,
  onPress,
}: {
  label: string;
  icon: IconName;
  accent: Accent;
  active: boolean;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const accentHex = ACCENT_HEX[accent];
  const ink = active ? (accent === 'highlighter' ? colors.carbon : colors.paper) : colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Neumorph
        variant={active ? 'flat' : pressed ? 'inset' : 'raised'}
        radius={radii.pill}
        intensity="sm"
        surface={active ? accentHex : colors.canvas}
      >
        <View
          className="flex-row items-center"
          style={{ paddingVertical: 9, paddingHorizontal: 15, gap: 7 }}
        >
          <Icon name={icon} size={15} color={active ? ink : accent} strokeWidth={2.3} />
          <AppText variant="caption" weight={active ? 'bold' : 'medium'} color={ink} style={{ fontSize: 13 }}>
            {label}
          </AppText>
        </View>
      </Neumorph>
    </Pressable>
  );
}

/* ================================================================== */
/* Month view — the hand-built grid                                    */
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
    <MotiView
      key="month"
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300 }}
    >
      <SoftCard radius={radii.card} padding={16}>
        {/* Month pager. */}
        <View className="flex-row items-center justify-between" style={{ marginBottom: 14 }}>
          <SoftIconButton size={38} accessibilityLabel="Previous month" onPress={() => onStep(-1)}>
            <Icon name="chevron-left" size={18} color="carbon" />
          </SoftIconButton>
          <AppText variant="subheading" weight="bold" display>
            {monthLabel(focusY, focusM0)}
          </AppText>
          <SoftIconButton size={38} accessibilityLabel="Next month" onPress={() => onStep(1)}>
            <Icon name="chevron-right" size={18} color="carbon" />
          </SoftIconButton>
        </View>

        {/* Weekday header. */}
        <View className="flex-row" style={{ marginBottom: 6 }}>
          {WEEKDAY_INITIALS.map((d, i) => (
            <View key={`${d}-${i}`} style={{ flex: 1, alignItems: 'center' }}>
              <AppText
                variant="caption"
                weight="bold"
                color={i >= 5 ? colors.textSubtle : colors.textMuted}
                style={{ fontSize: 11.5 }}
              >
                {d}
              </AppText>
            </View>
          ))}
        </View>

        {/* 6 weeks. */}
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

      {/* Selected-day events. */}
      <SelectedDayList
        dayKey={selectedDay}
        events={selectedEvents}
        focusY={focusY}
        focusM0={focusM0}
      />
    </MotiView>
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

  // Up to 3 dots; collapse the rest into a "+" mark.
  const dotAccents = events.slice(0, 3).map((e) => e.accent as Accent);
  const overflow = events.length > 3;

  const numColor = !inMonth
    ? colors.textSubtle
    : isToday
      ? colors.carbon
      : colors.carbon;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${day}, ${events.length} events`}
      accessibilityState={{ selected }}
      style={{ flex: 1, aspectRatio: 1, padding: 3 }}
    >
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 13,
          ...(isToday
            ? { backgroundColor: colors.highlighter }
            : selected
              ? {
                  backgroundColor: '#ececec',
                  borderWidth: 1.5,
                  borderColor: 'rgba(174,174,192,0.35)',
                }
              : null),
        }}
      >
        <AppText
          variant="body"
          weight={isToday || selected ? 'bold' : inMonth ? 'medium' : 'regular'}
          color={numColor}
          style={{ fontSize: 14, opacity: inMonth ? 1 : 0.55 }}
        >
          {day}
        </AppText>

        {/* Event dots. */}
        <View
          className="flex-row items-center"
          style={{ gap: 2.5, marginTop: 3, height: 5 }}
        >
          {dotAccents.map((accent, i) => (
            <View
              key={i}
              style={{
                width: 5,
                height: 5,
                borderRadius: 999,
                backgroundColor: isToday ? colors.carbon : ACCENT_HEX[accent],
              }}
            />
          ))}
          {overflow ? (
            <AppText
              variant="caption"
              weight="bold"
              color={isToday ? colors.carbon : colors.textMuted}
              style={{ fontSize: 8, lineHeight: 8 }}
            >
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
  const isToday = dayKey === TODAY_KEY;

  return (
    <View style={{ marginTop: 18 }}>
      <View className="flex-row items-center" style={{ gap: 8, marginBottom: 12 }}>
        <Icon name="calendar-check" size={16} color="carbon" strokeWidth={2.2} />
        <AppText variant="subheading" weight="bold" display style={{ fontSize: 17 }}>
          {isToday ? 'Today' : longDayLabel(dayKey)}
        </AppText>
        {isToday ? <Tag label="Now" tone="yellow" size="sm" /> : null}
        <View style={{ flex: 1 }} />
        {events.length > 0 ? (
          <Tag label={`${events.length}`} tone="neutral" size="sm" />
        ) : null}
      </View>

      {events.length === 0 ? (
        <EmptyState
          title={inFocusedMonth ? 'No events this day' : 'Nothing scheduled'}
          body="Pick another day, or add a task, revision or focus session to fill it in."
        />
      ) : (
        <View style={{ gap: 10 }}>
          {events.map((ev, i) => (
            <EventRow key={ev.id} event={ev} index={i} />
          ))}
        </View>
      )}
    </View>
  );
}

/* ================================================================== */
/* Week view                                                           */
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
  const rangeLabel = `${shortMonth(first.m0)} ${first.d} – ${shortMonth(last.m0)} ${last.d}`;

  return (
    <MotiView
      key="week"
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300 }}
    >
      {/* Week pager. */}
      <View className="flex-row items-center justify-between" style={{ marginBottom: 14 }}>
        <SoftIconButton size={38} accessibilityLabel="Previous week" onPress={() => onStep(-1)}>
          <Icon name="chevron-left" size={18} color="carbon" />
        </SoftIconButton>
        <AppText variant="subheading" weight="bold" display style={{ fontSize: 17 }}>
          {rangeLabel}
        </AppText>
        <SoftIconButton size={38} accessibilityLabel="Next week" onPress={() => onStep(1)}>
          <Icon name="chevron-right" size={18} color="carbon" />
        </SoftIconButton>
      </View>

      <View style={{ gap: 12 }}>
        {days.map((dayKey, i) => (
          <WeekDayCard key={dayKey} dayKey={dayKey} events={byDay.get(dayKey) ?? []} index={i} />
        ))}
      </View>
    </MotiView>
  );
}

function WeekDayCard({
  dayKey,
  events,
  index,
}: {
  dayKey: string;
  events: CalendarEvent[];
  index: number;
}) {
  const isToday = dayKey === TODAY_KEY;
  const p = parseKey(dayKey);
  const wd = new Date(p.y, p.m0, p.d).getDay();
  const wdLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][wd];

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 280, delay: 40 + index * 40 }}
    >
      <SoftCard radius={radii.sm + 10} padding={14}>
        <View className="flex-row items-center" style={{ gap: 12 }}>
          {/* Date chip. */}
          <View
            style={{
              width: 50,
              height: 56,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isToday ? colors.highlighter : '#ececec',
              borderWidth: isToday ? 0 : 1.5,
              borderColor: 'rgba(174,174,192,0.3)',
            }}
          >
            <AppText
              variant="caption"
              weight="bold"
              color={isToday ? colors.carbon : colors.textMuted}
              style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              {wdLabel}
            </AppText>
            <AppText
              variant="subheading"
              weight="bold"
              display
              color={colors.carbon}
              style={{ fontSize: 20, marginTop: 1 }}
            >
              {p.d}
            </AppText>
          </View>

          {/* Events or empty. */}
          <View style={{ flex: 1 }}>
            {events.length === 0 ? (
              <AppText variant="caption" color={colors.textSubtle} style={{ fontSize: 13 }}>
                No events
              </AppText>
            ) : (
              <View style={{ gap: 8 }}>
                {events.map((ev) => (
                  <WeekEventLine key={ev.id} event={ev} />
                ))}
              </View>
            )}
          </View>
        </View>
      </SoftCard>
    </MotiView>
  );
}

function WeekEventLine({ event }: { event: CalendarEvent }) {
  const accent = event.accent as Accent;
  const done = !!event.done;
  return (
    <View className="flex-row items-center" style={{ gap: 9 }}>
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          backgroundColor: ACCENT_HEX[accent],
          opacity: done ? 0.45 : 1,
        }}
      />
      <Icon name={event.icon} size={14} color={done ? 'textSubtle' : accent} strokeWidth={2.3} />
      <AppText
        variant="caption"
        weight={done ? 'regular' : 'medium'}
        color={done ? colors.textSubtle : colors.carbon}
        numberOfLines={1}
        style={{ flex: 1, fontSize: 13 }}
      >
        {event.title}
      </AppText>
      <AppText variant="caption" color={colors.textSubtle} style={{ fontSize: 11 }}>
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
    return (
      <MotiView
        key="agenda-empty"
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300 }}
      >
        <EmptyState
          title="No events match"
          body="Try a different filter — your tasks, revisions and sessions will appear here."
        />
      </MotiView>
    );
  }

  let rowIndex = 0;
  return (
    <MotiView
      key="agenda"
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300 }}
    >
      {sections.map((section) => (
        <View key={section.key} style={{ marginBottom: 24 }}>
          <View className="flex-row items-center" style={{ gap: 8, marginBottom: 14 }}>
            <Icon
              name={
                section.key === 'today'
                  ? 'sun'
                  : section.key === 'upcoming'
                    ? 'arrow-right'
                    : 'clock'
              }
              size={16}
              color="carbon"
              strokeWidth={2.2}
            />
            <AppText
              variant="caption"
              weight="bold"
              color={colors.textMuted}
              style={{ textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 12 }}
            >
              {section.title}
            </AppText>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.hairline }} />
            <Tag
              label={`${section.days.reduce((n, d) => n + d.events.length, 0)}`}
              tone={section.key === 'today' ? 'yellow' : 'neutral'}
              size="sm"
            />
          </View>

          {section.days.map((dayGroup) => (
            <View key={dayGroup.key} style={{ marginBottom: 14 }}>
              {section.key !== 'today' ? (
                <AppText
                  variant="caption"
                  weight="semibold"
                  color={colors.textSubtle}
                  style={{ marginBottom: 8, marginLeft: 2, fontSize: 12.5 }}
                >
                  {longDayLabel(dayGroup.key)}
                </AppText>
              ) : null}
              <View style={{ gap: 10 }}>
                {dayGroup.events.map((ev) => (
                  <EventRow key={ev.id} event={ev} index={rowIndex++} />
                ))}
              </View>
            </View>
          ))}
        </View>
      ))}
    </MotiView>
  );
}

/* ================================================================== */
/* Shared bits                                                         */
/* ================================================================== */

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <SoftCard variant="inset" radius={radii.card} padding={26}>
      <View className="items-center">
        <Neumorph variant="flat" radius={18} padding={14} surface="#ececec">
          <Icon name="calendar" size={26} color="textSubtle" strokeWidth={2} />
        </Neumorph>
        <AppText variant="body" weight="bold" style={{ marginTop: 14 }}>
          {title}
        </AppText>
        <AppText
          variant="caption"
          color={colors.textMuted}
          style={{ marginTop: 4, textAlign: 'center', fontSize: 13, lineHeight: 19 }}
        >
          {body}
        </AppText>
      </View>
    </SoftCard>
  );
}

function Legend() {
  return (
    <View style={{ marginTop: 30 }}>
      <AppText
        variant="caption"
        weight="bold"
        color={colors.textMuted}
        style={{ textTransform: 'uppercase', letterSpacing: 1.4, fontSize: 11, marginBottom: 12 }}
      >
        Legend
      </AppText>
      <SoftCard variant="flat" radius={radii.sm + 8} padding={16} surface="#ededed">
        <View className="flex-row flex-wrap" style={{ gap: 14 }}>
          {TYPE_ORDER.map((t) => (
            <View key={t} className="flex-row items-center" style={{ gap: 7 }}>
              <View
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  backgroundColor: ACCENT_HEX[TYPE_META[t].accent],
                }}
              />
              <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 12.5 }}>
                {TYPE_META[t].label}
              </AppText>
            </View>
          ))}
        </View>
      </SoftCard>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Local pure helpers                                                  */
/* ------------------------------------------------------------------ */

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function shortMonth(m0: number): string {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m0];
}
