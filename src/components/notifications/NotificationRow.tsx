/**
 * A single notification row for the Notifications history screen (STEEP).
 *
 * Flat & calm: a small thin glyph, the title + body text column, and a meta line
 * with relative time. Unread rows read as a white raised Card with a small Ink
 * dot; read rows recede to a quiet Fog inset so the eye is pulled to what still
 * needs attention. One subtle shadow + Dove hairline, no neumorphism.
 *
 * Vector Icons only, ZERO emoji.
 */
import React from 'react';
import { View, Pressable } from 'react-native';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Icon } from '@/components/ui/Icon';
import { colors, radii, interaction, pressOpacity } from '@/theme/tokens';
import type { AppNotification } from '@/types/models';

export type NotificationAccent = AppNotification['accent'];

export type NotificationRowProps = {
  notification: AppNotification;
  onPress: (id: string) => void;
  /** Index within its section (kept for API compat; entrance is instant now). */
  index: number;
};

export function NotificationRow({ notification, onPress }: NotificationRowProps) {
  const { read } = notification;

  return (
    <Pressable
      onPress={() => onPress(notification.id)}
      accessibilityRole="button"
      accessibilityLabel={`${notification.title}. ${read ? 'Read' : 'Unread'}`}
      accessibilityState={{ selected: !read }}
      style={({ pressed }) => ({
        opacity: pressOpacity({ pressed }, { solid: true }),
        transform: [{ scale: pressed ? interaction.pressScale : 1 }],
      })}
    >
      <SoftCard variant={read ? 'inset' : 'raised'} radius={radii.card} padding={13}>
        <View className="flex-row items-start" style={{ gap: 11 }}>
          {/* Leading glyph — small, thin, monochrome. */}
          <View style={{ marginTop: 1 }}>
            <Icon name={notification.icon} size={17} color={read ? 'graphite' : 'ink'} />
          </View>

          {/* Title + body. */}
          <View style={{ flex: 1 }}>
            <View className="flex-row items-start" style={{ gap: 8 }}>
              <AppText
                variant="subheading"
                weight="medium"
                numberOfLines={2}
                style={{ flex: 1 }}
                color={read ? colors.ash : colors.ink}
              >
                {notification.title}
              </AppText>
              {!read ? (
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    backgroundColor: colors.rust,
                    marginTop: 6,
                  }}
                />
              ) : null}
            </View>

            <AppText variant="body" color={colors.ash} numberOfLines={2} style={{ marginTop: 2 }}>
              {notification.body}
            </AppText>

            <View className="flex-row items-center" style={{ gap: 6, marginTop: 7 }}>
              <AppText variant="caption" color={colors.graphite}>
                {relativeTime(notification.createdAt)}
              </AppText>
              {notification.href ? (
                <>
                  <View
                    style={{ width: 2.5, height: 2.5, borderRadius: 999, backgroundColor: colors.dove }}
                  />
                  <AppText variant="caption" color={colors.graphite}>
                    Tap to open
                  </AppText>
                </>
              ) : null}
            </View>
          </View>
        </View>
      </SoftCard>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Relative-time helper                                                */
/* ------------------------------------------------------------------ */

/**
 * Compact, human relative time ("Just now", "3h ago", "Mon"). Pinned to the
 * app's deterministic "now" so the mock data reads consistently.
 */
const NOW = new Date('2026-06-26T11:30:00Z').getTime();
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Math.max(0, NOW - then);
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return WEEKDAYS[new Date(iso).getDay()];
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** True when an ISO timestamp falls on the app's TODAY (2026-06-26, UTC). */
export function isToday(iso: string): boolean {
  return iso.slice(0, 10) === '2026-06-26';
}

export default NotificationRow;
