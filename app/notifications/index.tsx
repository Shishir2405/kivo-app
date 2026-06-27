/**
 * Notifications — history screen (STEEP).
 *
 * A calm, scannable inbox wired to the live `/notifications` endpoint via
 * `useNotifications()`, grouped into "Today" and "Earlier". Flat NotificationRows
 * (white = unread with a small Rust dot, Fog = read). A SegmentedTabs filter
 * narrows by category; "Mark all read" is a TextLink (the ONE Ink action stays
 * reserved). Read/all-read state is local on top of fetched data. Loading /
 * error / empty states come from the query flags so a failed request never
 * crashes the app.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, type Href as RouterHref } from 'expo-router';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { TextLink } from '@/components/ui/PillButton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { AppHeader } from '@/components/ui/AppHeader';
import { Tag } from '@/components/ui/Tag';

import { colors, radii } from '@/theme/tokens';
import { useNotifications } from '@/hooks/api';
import type { AppNotification, NotificationType } from '@/types/models';
import { NotificationRow, isToday } from '@/components/notifications/NotificationRow';

/* ------------------------------------------------------------------ */
/* Filter model                                                        */
/* ------------------------------------------------------------------ */

type Filter = 'all' | 'reminders' | 'wins' | 'updates';

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

function byNewest(a: AppNotification, b: AppNotification): number {
  return b.createdAt.localeCompare(a.createdAt);
}

/* ------------------------------------------------------------------ */
/* Section header                                                      */
/* ------------------------------------------------------------------ */

function SectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <View className="flex-row items-center" style={{ gap: 10, marginBottom: 10 }}>
      <AppText variant="caption" color={colors.graphite} style={{ letterSpacing: 0.6, textTransform: 'uppercase' }}>
        {label}
      </AppText>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.fog }} />
      <Tag label={`${count}`} tone="neutral" size="sm" />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* State block                                                         */
/* ------------------------------------------------------------------ */

function CenterNote({ icon, title, body, action }: { icon: IconName; title: string; body: string; action?: React.ReactNode }) {
  return (
    <SoftCard variant="inset" radius={radii.cardLg} padding={24}>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Icon name={icon} size={22} color="graphite" />
        <AppText variant="subheading" weight="medium" style={{ textAlign: 'center' }}>
          {title}
        </AppText>
        <AppText variant="body" color={colors.ash} style={{ textAlign: 'center', maxWidth: 280 }}>
          {body}
        </AppText>
        {action ? <View style={{ marginTop: 4 }}>{action}</View> : null}
      </View>
    </SoftCard>
  );
}

const EMPTY_COPY: Record<Filter, { icon: IconName; title: string; sub: string }> = {
  all: { icon: 'check-circle', title: 'You’re all caught up', sub: 'No notifications right now. New activity lands here.' },
  reminders: { icon: 'calendar-check', title: 'Nothing due', sub: 'No reminders in this view — your revisions and tasks are clear.' },
  wins: { icon: 'trophy', title: 'No new wins yet', sub: 'Keep showing up — streaks and achievements appear here.' },
  updates: { icon: 'sparkles', title: 'No updates', sub: 'Weekly reports and system notices show up in this view.' },
};

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data, isLoading, isError, error, refetch, isFetching } = useNotifications();

  // Local read overrides layered over fetched data (read endpoint out of scope).
  const [readOverrides, setReadOverrides] = useState<Record<string, true>>({});
  const [allRead, setAllRead] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const items = useMemo<AppNotification[]>(() => {
    const list = (Array.isArray(data) ? data.filter(Boolean) : []).slice().sort(byNewest);
    return list.map((n) => (allRead || n.id in readOverrides ? { ...n, read: true } : n));
  }, [data, readOverrides, allRead]);

  const unreadTotal = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const markRead = useCallback((id: string) => {
    setReadOverrides((prev) => ({ ...prev, [id]: true }));
  }, []);

  const onRowPress = useCallback(
    (id: string) => {
      markRead(id);
      const target = items.find((n) => n.id === id);
      if (target?.href) router.push(target.href as RouterHref);
    },
    [items, markRead, router],
  );

  const filtered = useMemo(() => items.filter((n) => matchesFilter(n, filter)), [items, filter]);
  const todayItems = useMemo(() => filtered.filter((n) => isToday(n.createdAt)), [filtered]);
  const earlierItems = useMemo(() => filtered.filter((n) => !isToday(n.createdAt)), [filtered]);
  const isEmpty = filtered.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={{ paddingHorizontal: 20 }}>
        <AppHeader
          onBack={() => router.back()}
          right={
            unreadTotal > 0 ? <Tag label={`${unreadTotal} unread`} tone="rust" size="sm" /> : <Tag label="All read" tone="neutral" size="sm" />
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
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => void refetch()}
            tintColor={colors.graphite}
          />
        }
      >
        {/* Header */}
        <View style={{ marginBottom: 16 }}>
          <AppText variant="display" display weight="semibold">
            Notifications
          </AppText>
          <AppText variant="body" color={colors.ash} style={{ marginTop: 4 }}>
            {isError
              ? 'Couldn’t load your activity'
              : unreadTotal > 0
                ? `${unreadTotal} new ${unreadTotal === 1 ? 'update' : 'updates'} to catch up on`
                : 'You are all caught up'}
          </AppText>
        </View>

        {/* States */}
        {isError ? (
          <CenterNote
            icon="alert"
            title="Something went wrong"
            body={error?.message ?? 'We couldn’t reach the server. Pull to refresh or try again.'}
            action={<TextLink label="Try again" onPress={() => void refetch()} icon={<Icon name="repeat" size={14} color="ink" />} />}
          />
        ) : isLoading ? (
          <SoftCard variant="inset" radius={radii.cardLg} padding={28}>
            <View style={{ alignItems: 'center', gap: 12 }}>
              <ActivityIndicator color={colors.ink} />
              <AppText variant="caption" color={colors.graphite}>
                Loading notifications…
              </AppText>
            </View>
          </SoftCard>
        ) : (
          <>
            <SegmentedTabs options={FILTER_OPTIONS} value={filter} onChange={setFilter} style={{ marginBottom: 14 }} />

            <View className="flex-row items-center justify-between" style={{ marginBottom: 14 }}>
              <AppText variant="caption" color={colors.graphite}>
                {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
              </AppText>
              <TextLink label="Mark all read" onPress={() => setAllRead(true)} size="sm" disabled={unreadTotal === 0} muted />
            </View>

            {isEmpty ? (
              <CenterNote icon={EMPTY_COPY[filter].icon} title={EMPTY_COPY[filter].title} body={EMPTY_COPY[filter].sub} />
            ) : (
              <>
                {todayItems.length > 0 ? (
                  <View style={{ marginBottom: 20 }}>
                    <SectionLabel label="Today" count={todayItems.length} />
                    <View style={{ gap: 10 }}>
                      {todayItems.map((n, i) => (
                        <NotificationRow key={n.id} notification={n} onPress={onRowPress} index={i} />
                      ))}
                    </View>
                  </View>
                ) : null}

                {earlierItems.length > 0 ? (
                  <View>
                    <SectionLabel label="Earlier" count={earlierItems.length} />
                    <View style={{ gap: 10 }}>
                      {earlierItems.map((n, i) => (
                        <NotificationRow key={n.id} notification={n} onPress={onRowPress} index={i} />
                      ))}
                    </View>
                  </View>
                ) : null}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
