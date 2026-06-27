/**
 * Menu hub ("More") — STEEP.
 *
 * A calm, editorial launcher to every stack route the expansion adds. Flat:
 * grouped lists of compact rows (a small thin icon, a label + subline, a chevron)
 * inside white Cards with a Dove hairline + one subtle shadow — not a puffy grid
 * of tiles. Live counts are pulled from the data hooks (notifications / notes /
 * revisions / achievements) and degrade to a neutral subline while loading or on
 * error, so a failed request never crashes the screen.
 */
import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Tag } from '@/components/ui/Tag';
import { Icon, type IconName } from '@/components/ui/Icon';
import { AppHeader } from '@/components/ui/AppHeader';

import { colors, radii, interaction, pressOpacity } from '@/theme/tokens';
import { useNotifications, useNotes, useRevisions, useAchievements } from '@/hooks/api';

type Tile = {
  key: string;
  label: string;
  sub: string;
  icon: IconName;
  href: Href;
  /** Optional small count badge. */
  badge?: number;
};

type Group = { title: string; tiles: Tile[] };

/* ------------------------------------------------------------------ */
/* Row                                                                */
/* ------------------------------------------------------------------ */

function FeatureRow({ tile, onPress, divider }: { tile: Tile; onPress: () => void; divider?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={tile.label}
      style={({ pressed }) => ({ opacity: pressOpacity({ pressed }) })}
    >
      {({ hovered }: { hovered?: boolean }) => (
      <View
        className="flex-row items-center"
        style={{
          gap: 12,
          paddingVertical: 12,
          paddingHorizontal: hovered ? 8 : 0,
          marginHorizontal: hovered ? -8 : 0,
          borderRadius: hovered ? radii.sm : 0,
          backgroundColor: hovered ? interaction.hoverWash : 'transparent',
          borderTopWidth: divider ? 1 : 0,
          borderTopColor: colors.fog,
        }}
      >
        <Icon name={tile.icon} size={18} color="graphite" />
        <View style={{ flex: 1 }}>
          <AppText variant="subheading" weight="medium" numberOfLines={1}>
            {tile.label}
          </AppText>
          <AppText variant="caption" color={colors.graphite} numberOfLines={1} style={{ marginTop: 1 }}>
            {tile.sub}
          </AppText>
        </View>
        {tile.badge && tile.badge > 0 ? <Tag label={`${tile.badge}`} tone="rust" size="sm" /> : null}
        <Icon name="chevron-right" size={15} color="dove" />
      </View>
      )}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const notifications = useNotifications();
  const notes = useNotes();
  const revisions = useRevisions();
  const achievements = useAchievements();

  const unread = Array.isArray(notifications.data) ? notifications.data.filter((n) => !n.read).length : 0;
  const noteCount = Array.isArray(notes.data) ? notes.data.filter((n) => !n.archived).length : 0;
  const pinnedNotes = Array.isArray(notes.data) ? notes.data.filter((n) => n.pinned && !n.archived).length : 0;
  const dueRevisions = Array.isArray(revisions.data) ? revisions.data.filter((r) => r.dueToday).length : 0;
  const unlocked = Array.isArray(achievements.data) ? achievements.data.filter((a) => a.unlocked).length : 0;
  const achievementsTotal = Array.isArray(achievements.data) ? achievements.data.length : 0;

  const groups: Group[] = [
    {
      title: 'Workspace',
      tiles: [
        {
          key: 'notes',
          label: 'Notes',
          sub: notes.isLoading ? 'Markdown notebook' : `${noteCount} notes · ${pinnedNotes} pinned`,
          icon: 'notebook-pen',
          href: '/notes',
        },
        { key: 'resources', label: 'Resources', sub: 'Saved links & playlists', icon: 'book-open', href: '/resources' },
        { key: 'habits', label: 'Habits', sub: 'Daily routines & streaks', icon: 'repeat', href: '/habits' },
        { key: 'reflections', label: 'Reflections', sub: 'Daily journal', icon: 'book', href: '/reflections' },
      ],
    },
    {
      title: 'Insights',
      tiles: [
        {
          key: 'notifications',
          label: 'Notifications',
          sub: notifications.isLoading ? 'Activity inbox' : unread > 0 ? `${unread} unread` : 'All caught up',
          icon: 'bell',
          href: '/notifications',
          badge: unread,
        },
        {
          key: 'achievements',
          label: 'Achievements',
          sub: achievements.isLoading ? 'Badges & milestones' : `${unlocked} of ${achievementsTotal} unlocked`,
          icon: 'trophy',
          href: '/achievements',
        },
        { key: 'analytics', label: 'Analytics', sub: 'Weekly reports & trends', icon: 'chart', href: '/analytics' },
        {
          key: 'calendar',
          label: 'Calendar',
          sub: revisions.isLoading ? 'Plan your study days' : `${dueRevisions} due today`,
          icon: 'calendar',
          href: '/calendar',
        },
      ],
    },
    {
      title: 'Tools',
      tiles: [
        { key: 'focus', label: 'Focus Timer', sub: 'Deep-work sessions', icon: 'timer', href: '/focus-timer' },
        { key: 'settings', label: 'Settings', sub: 'Profile & preferences', icon: 'settings', href: '/settings' },
      ],
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={{ paddingHorizontal: 20 }}>
        <AppHeader onBack={() => router.back()} />
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
        <View style={{ marginBottom: 18 }}>
          <AppText variant="display" display weight="semibold">
            More
          </AppText>
          <AppText variant="body" color={colors.ash} style={{ marginTop: 4 }}>
            Everything, one tap away
          </AppText>
        </View>

        {groups.map((group) => (
          <View key={group.title} style={{ marginBottom: 20 }}>
            <AppText
              variant="caption"
              color={colors.graphite}
              style={{ letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}
            >
              {group.title}
            </AppText>
            <SoftCard radius={radii.card} padding={12}>
              {group.tiles.map((tile, i) => (
                <FeatureRow key={tile.key} tile={tile} onPress={() => router.push(tile.href)} divider={i > 0} />
              ))}
            </SoftCard>
          </View>
        ))}

        <View className="items-center" style={{ marginTop: 4 }}>
          <AppText variant="caption" color={colors.graphite}>
            Your study toolkit, all in one place.
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}
