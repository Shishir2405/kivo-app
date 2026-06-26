/**
 * Menu hub ("More").
 *
 * A neumorphic grid of feature tiles that links to every stack route the
 * expansion adds. Premium, calm, and entirely composed from the Aaply kit —
 * SoftCard tiles on the graphite-mist canvas, vector Icons only, ZERO emoji.
 *
 * Tiles are grouped into "Workspace" (notes/resources/habits/reflections),
 * "Insights" (notifications/achievements/analytics/calendar) and "Tools"
 * (focus timer/settings) so the hub reads as an organised launcher rather than
 * an undifferentiated wall of buttons.
 */
import React, { useCallback } from 'react';
import { View, ScrollView, Pressable, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { SoftIconButton } from '@/components/ui/SoftIconButton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Tag } from '@/components/ui/Tag';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { GrayMark } from '@/components/ui/AppHeader';

import { colors, radii } from '@/theme/tokens';
import {
  mockNotifications,
  mockRevisions,
  mockNotes,
  mockAchievementCatalog,
} from '@/data/mock';

/* ------------------------------------------------------------------ */
/* Tile model                                                          */
/* ------------------------------------------------------------------ */

type Accent = 'highlighter' | 'signal' | 'peach' | 'annotation' | 'success';

const ACCENT_HEX: Record<Accent, ColorValue> = {
  highlighter: colors.highlighter,
  signal: colors.signal,
  peach: colors.peach,
  annotation: colors.annotation,
  success: colors.success,
};

/** Ink that reads on top of each accent chip. */
function accentInk(accent: Accent): string {
  return accent === 'highlighter' ? colors.carbon : colors.paper;
}

type Tile = {
  key: string;
  label: string;
  sub: string;
  icon: IconName;
  accent: Accent;
  href: Href;
  /** Optional small count badge (e.g. unread notifications). */
  badge?: number;
};

type Group = {
  title: string;
  icon: IconName;
  tiles: Tile[];
};

/* ------------------------------------------------------------------ */
/* Tile component                                                      */
/* ------------------------------------------------------------------ */

function FeatureTile({ tile, onPress, index }: { tile: Tile; onPress: () => void; index: number }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 320, delay: 60 + index * 45 }}
      style={{ width: '47.5%', flexGrow: 1 }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        accessibilityRole="button"
        accessibilityLabel={tile.label}
      >
        <SoftCard
          variant={pressed ? 'inset' : 'raised'}
          radius={radii.card}
          intensity="md"
          padding={16}
          style={{ minHeight: 124 }}
        >
          <View className="flex-row items-start justify-between">
            <Neumorph variant="inset" radius={14} intensity="sm" padding={10} surface={colors.canvas}>
              <Icon name={tile.icon} size={22} color={tile.accent} strokeWidth={2.2} />
            </Neumorph>
            {tile.badge && tile.badge > 0 ? (
              <View
                style={{
                  minWidth: 22,
                  height: 22,
                  paddingHorizontal: 6,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: ACCENT_HEX[tile.accent],
                }}
              >
                <AppText variant="caption" weight="bold" color={accentInk(tile.accent)} style={{ fontSize: 11 }}>
                  {tile.badge}
                </AppText>
              </View>
            ) : (
              <Icon name="chevron-right" size={16} color="textSubtle" strokeWidth={2.2} />
            )}
          </View>

          <View style={{ marginTop: 14 }}>
            <AppText variant="body" weight="bold" numberOfLines={1}>
              {tile.label}
            </AppText>
            <AppText
              variant="caption"
              color={colors.textMuted}
              numberOfLines={1}
              style={{ marginTop: 2, fontSize: 12 }}
            >
              {tile.sub}
            </AppText>
          </View>
        </SoftCard>
      </Pressable>
    </MotiView>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const unread = mockNotifications.filter((n) => !n.read).length;
  const dueRevisions = mockRevisions.filter((r) => r.dueToday).length;
  const pinnedNotes = mockNotes.filter((n) => n.pinned && !n.archived).length;
  const unlocked = mockAchievementCatalog.filter((a) => a.unlocked).length;

  const groups: Group[] = [
    {
      title: 'Workspace',
      icon: 'folder',
      tiles: [
        {
          key: 'notes',
          label: 'Notes',
          sub: `${mockNotes.filter((n) => !n.archived).length} notes · ${pinnedNotes} pinned`,
          icon: 'notebook-pen',
          accent: 'highlighter',
          href: '/notes',
        },
        {
          key: 'resources',
          label: 'Resources',
          sub: 'Saved links & playlists',
          icon: 'book-open',
          accent: 'signal',
          href: '/resources',
        },
        {
          key: 'habits',
          label: 'Habits',
          sub: 'Daily routines & streaks',
          icon: 'repeat',
          accent: 'peach',
          href: '/habits',
        },
        {
          key: 'reflections',
          label: 'Reflections',
          sub: 'Daily journal',
          icon: 'book',
          accent: 'success',
          href: '/reflections',
        },
      ],
    },
    {
      title: 'Insights',
      icon: 'activity',
      tiles: [
        {
          key: 'notifications',
          label: 'Notifications',
          sub: unread > 0 ? `${unread} unread` : 'All caught up',
          icon: 'bell',
          accent: 'annotation',
          href: '/notifications',
          badge: unread,
        },
        {
          key: 'achievements',
          label: 'Achievements',
          sub: `${unlocked} of ${mockAchievementCatalog.length} unlocked`,
          icon: 'trophy',
          accent: 'highlighter',
          href: '/achievements',
        },
        {
          key: 'analytics',
          label: 'Analytics',
          sub: 'Weekly reports & trends',
          icon: 'chart',
          accent: 'signal',
          href: '/analytics',
        },
        {
          key: 'calendar',
          label: 'Calendar',
          sub: `${dueRevisions} due today`,
          icon: 'calendar',
          accent: 'peach',
          href: '/calendar',
        },
      ],
    },
    {
      title: 'Tools',
      icon: 'settings',
      tiles: [
        {
          key: 'focus',
          label: 'Focus Timer',
          sub: 'Deep-work sessions',
          icon: 'timer',
          accent: 'signal',
          href: '/focus-timer',
        },
        {
          key: 'settings',
          label: 'Settings',
          sub: 'Profile & preferences',
          icon: 'settings',
          accent: 'success',
          href: '/settings',
        },
      ],
    },
  ];

  const go = useCallback((href: Href) => () => router.push(href), [router]);

  let tileIndex = 0;

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
          <SoftIconButton size={44} accessibilityLabel="Notifications" onPress={go('/notifications')}>
            <Icon name="bell" size={20} color="carbon" />
          </SoftIconButton>
        </View>

        {/* ---------- Header ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 360 }}
          style={{ marginTop: 18, marginBottom: 22 }}
        >
          <View className="flex-row items-center" style={{ gap: 7 }}>
            <Icon name="layers" size={14} color="peach" strokeWidth={2.25} />
            <AppText
              variant="caption"
              weight="semibold"
              color={colors.textSubtle}
              style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 11 }}
            >
              Menu
            </AppText>
          </View>
          <AppText variant="heading" display weight="bold" style={{ marginTop: 6 }}>
            Everything,{'\n'}one tap away
          </AppText>
        </MotiView>

        {/* ---------- Groups ---------- */}
        {groups.map((group) => (
          <View key={group.title} style={{ marginBottom: 26 }}>
            <View className="flex-row items-center" style={{ gap: 8, marginBottom: 14 }}>
              <Icon name={group.icon} size={16} color="carbon" strokeWidth={2.2} />
              <AppText
                variant="caption"
                weight="bold"
                color={colors.textMuted}
                style={{ textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 12 }}
              >
                {group.title}
              </AppText>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.hairline }} />
              <Tag label={`${group.tiles.length}`} tone="neutral" size="sm" />
            </View>

            <View className="flex-row flex-wrap" style={{ gap: 12 }}>
              {group.tiles.map((tile) => {
                const idx = tileIndex++;
                return (
                  <FeatureTile key={tile.key} tile={tile} onPress={go(tile.href)} index={idx} />
                );
              })}
            </View>
          </View>
        ))}

        {/* ---------- Footer ---------- */}
        <View className="items-center" style={{ marginTop: 6 }}>
          <BrandLogo variant="lockup" size={15} color={colors.textSubtle} />
          <AppText variant="caption" color={colors.textSubtle} style={{ marginTop: 8, fontSize: 11 }}>
            Your study toolkit, all in one place.
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}
