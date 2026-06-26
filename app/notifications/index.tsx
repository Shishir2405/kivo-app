/**
 * Notifications — history screen.
 *
 * A calm, scannable inbox of app activity, grouped into "Today" and "Earlier".
 * Each row carries a typed accent glyph, title, body, relative time and (while
 * unread) an accent dot. Tapping a row marks it read and — when it carries a
 * deep link — navigates to the relevant screen.
 *
 * A filter SegmentedTabs narrows by category (All / Reminders / Wins / Updates)
 * and a "Mark all read" SoftButton clears the unread state in one tap. When a
 * filter has nothing to show, an engaging empty state takes over.
 *
 * State is local (useState seeded from mockNotifications) so the screen is fully
 * interactive without touching shared mocks. Aaply kit only, ZERO emoji.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, type Href as RouterHref } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { SoftButton } from '@/components/ui/SoftButton';
import { SoftIconButton } from '@/components/ui/SoftIconButton';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { Icon } from '@/components/ui/Icon';
import { GrayMark } from '@/components/ui/AppHeader';
import { Tag } from '@/components/ui/Tag';

import { colors, radii } from '@/theme/tokens';
import { mockNotifications } from '@/data/mock';
import type { AppNotification, NotificationType } from '@/types/models';

import { NotificationRow, isToday } from '@/components/notifications/NotificationRow';

/* ------------------------------------------------------------------ */
/* Filter model                                                        */
/* ------------------------------------------------------------------ */

type Filter = 'all' | 'reminders' | 'wins' | 'updates';

/** Which categories each filter surfaces. */
const FILTER_TYPES: Record<Exclude<Filter, 'all'>, NotificationType[]> = {
  reminders: ['REVISION_DUE', 'TASK_DUE', 'HABIT', 'DAILY_GOAL'],
  wins: ['ACHIEVEMENT', 'STREAK', 'FOCUS_SESSION'],
  updates: ['WEEKLY_REPORT', 'SYSTEM'],
};

const FILTER_OPTIONS: SegmentedOption<Filter>[] = [
  { label: 'All', value: 'all' },
  { label: 'Reminders', value: 'reminders' },
  { label: 'Wins', value: 'wins' },
  { label: 'Updates', value: 'updates' },
];

function matchesFilter(n: AppNotification, filter: Filter): boolean {
  if (filter === 'all') return true;
  return FILTER_TYPES[filter].includes(n.type);
}

/** Newest-first by createdAt. */
function byNewest(a: AppNotification, b: AppNotification): number {
  return b.createdAt.localeCompare(a.createdAt);
}

/* ------------------------------------------------------------------ */
/* Section header                                                      */
/* ------------------------------------------------------------------ */

function SectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <View className="flex-row items-center" style={{ gap: 10, marginBottom: 12, marginTop: 4 }}>
      <AppText
        variant="caption"
        weight="bold"
        color={colors.textMuted}
        style={{ textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 12 }}
      >
        {label}
      </AppText>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.hairline }} />
      <Tag label={`${count}`} tone="neutral" size="sm" />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

function EmptyState({ filter }: { filter: Filter }) {
  const copy: Record<Filter, { icon: Parameters<typeof Icon>[0]['name']; title: string; sub: string }> = {
    all: {
      icon: 'check-circle',
      title: "You're all caught up",
      sub: 'No notifications right now. New activity will land here.',
    },
    reminders: {
      icon: 'calendar-check',
      title: 'Nothing due',
      sub: 'No reminders in this view — your revisions and tasks are clear.',
    },
    wins: {
      icon: 'trophy',
      title: 'No new wins yet',
      sub: 'Keep showing up — streaks, achievements and milestones appear here.',
    },
    updates: {
      icon: 'sparkles',
      title: 'No updates',
      sub: 'Weekly reports and system notices will show up in this view.',
    },
  };
  const c = copy[filter];

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 360 }}
      style={{ marginTop: 24 }}
    >
      <SoftCard variant="inset" radius={radii.card} padding={28}>
        <View className="items-center">
          <Neumorph variant="raised" radius={999} intensity="md" padding={20} surface={colors.canvas}>
            <Icon name={c.icon} size={34} color="highlighter" strokeWidth={2.1} />
          </Neumorph>
          <AppText variant="subheading" weight="bold" style={{ marginTop: 18, textAlign: 'center' }}>
            {c.title}
          </AppText>
          <AppText
            variant="caption"
            color={colors.textMuted}
            style={{ marginTop: 6, textAlign: 'center', maxWidth: 260, lineHeight: 19 }}
          >
            {c.sub}
          </AppText>
        </View>
      </SoftCard>
    </MotiView>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [items, setItems] = useState<AppNotification[]>(() =>
    [...mockNotifications].sort(byNewest),
  );
  const [filter, setFilter] = useState<Filter>('all');

  const unreadTotal = useMemo(() => items.filter((n) => !n.read).length, [items]);

  /* ---- mutations ---- */

  const markRead = useCallback((id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })));
  }, []);

  const onRowPress = useCallback(
    (id: string) => {
      markRead(id);
      const target = items.find((n) => n.id === id);
      if (target?.href) {
        // The mock hrefs are valid in-app routes; cast to the router Href union.
        router.push(target.href as RouterHref);
      }
    },
    [items, markRead, router],
  );

  /* ---- derived sections ---- */

  const filtered = useMemo(() => items.filter((n) => matchesFilter(n, filter)), [items, filter]);
  const todayItems = useMemo(() => filtered.filter((n) => isToday(n.createdAt)), [filtered]);
  const earlierItems = useMemo(() => filtered.filter((n) => !isToday(n.createdAt)), [filtered]);
  const isEmpty = filtered.length === 0;

  // Continuous index so the staggered entrance flows across both sections.
  let rowIndex = 0;

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
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <SoftIconButton size={44} accessibilityLabel="Go back" onPress={() => router.back()}>
              <Icon name="chevron-left" size={22} color="carbon" />
            </SoftIconButton>
            <GrayMark size={22} />
          </View>

          {unreadTotal > 0 ? (
            <Tag
              label={`${unreadTotal} unread`}
              tone="annotation"
              size="sm"
              icon={<Icon name="bell" size={12} color={colors.annotation} strokeWidth={2.4} />}
            />
          ) : (
            <Tag
              label="All read"
              tone="success"
              size="sm"
              icon={<Icon name="check" size={12} color="#2c9d5f" strokeWidth={2.6} />}
            />
          )}

          <SoftIconButton
            size={44}
            accessibilityLabel="Notification settings"
            onPress={() => router.push('/settings' as RouterHref)}
          >
            <Icon name="settings" size={20} color="carbon" />
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
            <Icon name="bell" size={14} color="annotation" strokeWidth={2.25} />
            <AppText
              variant="caption"
              weight="semibold"
              color={colors.textSubtle}
              style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 11 }}
            >
              Activity
            </AppText>
          </View>
          <AppText variant="heading" display weight="bold" style={{ marginTop: 6 }}>
            Notifications
          </AppText>
          <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 6, fontSize: 13.5 }}>
            {unreadTotal > 0
              ? `${unreadTotal} new ${unreadTotal === 1 ? 'update' : 'updates'} to catch up on.`
              : 'You are all caught up — nothing new to review.'}
          </AppText>
        </MotiView>

        {/* ---------- Filter ---------- */}
        <SegmentedTabs
          options={FILTER_OPTIONS}
          value={filter}
          onChange={setFilter}
          height={46}
          style={{ marginBottom: 16 }}
        />

        {/* ---------- Mark all read ---------- */}
        <View className="flex-row items-center justify-between" style={{ marginBottom: 18 }}>
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <Icon name="list" size={14} color="textMuted" strokeWidth={2.2} />
            <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 12.5 }}>
              {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
            </AppText>
          </View>

          <SoftButton
            label="Mark all read"
            variant="neutral"
            size="sm"
            fullWidth={false}
            disabled={unreadTotal === 0}
            onPress={markAllRead}
            icon={
              <Icon
                name="check-circle"
                size={16}
                color={unreadTotal === 0 ? 'textSubtle' : 'carbon'}
                strokeWidth={2.2}
              />
            }
            style={{ opacity: unreadTotal === 0 ? 0.55 : 1 }}
          />
        </View>

        {/* ---------- List ---------- */}
        <AnimatePresence>
          {isEmpty ? (
            <EmptyState key={`empty-${filter}`} filter={filter} />
          ) : (
            <MotiView
              key={`list-${filter}`}
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 220 }}
            >
              {todayItems.length > 0 ? (
                <View style={{ marginBottom: 22 }}>
                  <SectionLabel label="Today" count={todayItems.length} />
                  <View style={{ gap: 12 }}>
                    {todayItems.map((n) => (
                      <NotificationRow
                        key={n.id}
                        notification={n}
                        onPress={onRowPress}
                        index={rowIndex++}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {earlierItems.length > 0 ? (
                <View>
                  <SectionLabel label="Earlier" count={earlierItems.length} />
                  <View style={{ gap: 12 }}>
                    {earlierItems.map((n) => (
                      <NotificationRow
                        key={n.id}
                        notification={n}
                        onPress={onRowPress}
                        index={rowIndex++}
                      />
                    ))}
                  </View>
                </View>
              ) : null}
            </MotiView>
          )}
        </AnimatePresence>
      </ScrollView>
    </View>
  );
}
