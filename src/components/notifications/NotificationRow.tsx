/**
 * A single notification row for the Notifications history screen (STEEP).
 *
 * Matches the HTML inbox: a small rounded wash medallion holding a thin glyph,
 * the title + body text column, a relative-time meta line, and a small Rust dot
 * for unread. Unread rows read as a peach-wash raised card; read rows recede to
 * a quiet inset with reduced opacity so the eye is pulled to what still needs
 * attention. Theme-aware (light/dark) via useTheme(); enters with a small
 * staggered fade-up. Vector Icons only, ZERO emoji.
 */
import React from 'react';
import { View, Pressable } from 'react-native';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Icon } from '@/components/ui/Icon';
import { useTheme, motion } from '@/theme';
import { radii, interaction, pressOpacity, type CardTone } from '@/theme/tokens';
import type { AppNotification } from '@/types/models';

export type NotificationAccent = AppNotification['accent'];

export type NotificationRowProps = {
  notification: AppNotification;
  onPress: (id: string) => void;
  /** Index within its section (drives a small entrance stagger). */
  index: number;
};

/** Map a notification accent token onto a curated wash tone. */
function accentTone(accent: NotificationAccent): CardTone {
  switch (accent) {
    case 'signal':
      return 'sky';
    case 'success':
      return 'mint';
    case 'highlighter':
      return 'butter';
    case 'peach':
    case 'annotation':
    default:
      return 'peach';
  }
}

export function NotificationRow({ notification, onPress, index }: NotificationRowProps) {
  const { colors, toneStyle } = useTheme();
  const { read } = notification;
  const tone = accentTone(notification.accent);
  const ts = toneStyle(tone);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: motion.duration.transition,
        delay: Math.min(index, 8) * 45,
      }}
    >
      <Pressable
        onPress={() => onPress(notification.id)}
        accessibilityRole="button"
        accessibilityLabel={`${notification.title}. ${read ? 'Read' : 'Unread'}`}
        accessibilityState={{ selected: !read }}
        style={({ pressed }) => ({
          opacity: read ? 0.7 : pressOpacity({ pressed }, { solid: true }),
          transform: [{ scale: pressed ? interaction.pressScale : 1 }],
        })}
      >
        <SoftCard
          variant={read ? 'inset' : 'raised'}
          tone={read ? 'default' : tone}
          radius={radii.card}
          padding={13}
        >
          <View className="flex-row items-start" style={{ gap: 11 }}>
            {/* Leading wash medallion — colored glyph chip. */}
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: read ? colors.surface : colors.surface,
                borderWidth: 1,
                borderColor: read ? colors.hairline : ts.border,
              }}
            >
              <Icon name={notification.icon} size={16} color={read ? colors.muted : ts.accent} weight="light" />
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
                      backgroundColor: colors.primary,
                      marginTop: 6,
                    }}
                  />
                ) : null}
              </View>

              <AppText variant="body" color={colors.ash} numberOfLines={2} style={{ marginTop: 2 }}>
                {notification.body}
              </AppText>

              <View className="flex-row items-center" style={{ gap: 6, marginTop: 7 }}>
                <AppText variant="caption" color={colors.muted}>
                  {relativeTime(notification.createdAt)}
                </AppText>
                {notification.href ? (
                  <>
                    <View
                      style={{ width: 2.5, height: 2.5, borderRadius: 999, backgroundColor: colors.hairline }}
                    />
                    <AppText variant="caption" color={colors.muted}>
                      Tap to open
                    </AppText>
                  </>
                ) : null}
              </View>
            </View>
          </View>
        </SoftCard>
      </Pressable>
    </MotiView>
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
