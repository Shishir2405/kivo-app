/**
 * A single notification row for the Notifications history screen.
 *
 * Layout: a leading neumorphic glyph chip tinted by the notification accent, the
 * title + body text column, and a trailing meta column with the relative time
 * and (when unread) an accent dot. Unread rows read as a raised SoftCard with a
 * subtle accent rail; read rows recede to a flat, muted surface so the eye is
 * pulled to what still needs attention.
 *
 * Composed entirely from the Aaply kit — vector Icons only, ZERO emoji.
 */
import React from 'react';
import { View, Pressable } from 'react-native';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { Icon } from '@/components/ui/Icon';
import { colors, radii } from '@/theme/tokens';
import type { AppNotification } from '@/types/models';

export type NotificationAccent = AppNotification['accent'];

const ACCENT_HEX: Record<NotificationAccent, string> = {
  highlighter: colors.highlighter,
  signal: colors.signal,
  peach: colors.peach,
  annotation: colors.annotation,
  success: colors.success,
};

/** Soft tinted background for the leading glyph well (read state). */
const ACCENT_WASH: Record<NotificationAccent, string> = {
  highlighter: '#f7f6c9',
  signal: '#e1e8ff',
  peach: '#ffe6dd',
  annotation: '#ffe2e2',
  success: '#dff5e8',
};

export type NotificationRowProps = {
  notification: AppNotification;
  onPress: (id: string) => void;
  /** Index within its section, used to stagger the entrance. */
  index: number;
};

export function NotificationRow({ notification, onPress, index }: NotificationRowProps) {
  const [pressed, setPressed] = React.useState(false);
  const { accent, read } = notification;
  const accentHex = ACCENT_HEX[accent];
  // Yellow needs carbon ink to stay legible on the glyph chip.
  const glyphInk = accent === 'highlighter' ? colors.carbon : accentHex;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300, delay: 40 + index * 45 }}
    >
      <Pressable
        onPress={() => onPress(notification.id)}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        accessibilityRole="button"
        accessibilityLabel={`${notification.title}. ${read ? 'Read' : 'Unread'}`}
        accessibilityState={{ selected: !read }}
      >
        <SoftCard
          variant={pressed ? 'inset' : read ? 'flat' : 'raised'}
          radius={radii.sm + 8}
          intensity="sm"
          padding={14}
          surface={read ? '#ededed' : colors.canvas}
          style={{
            opacity: read ? 0.92 : 1,
            overflow: 'hidden',
          }}
        >
          {/* Unread accent rail down the left edge. */}
          {!read ? (
            <View
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                backgroundColor: accentHex,
                borderTopLeftRadius: radii.sm + 8,
                borderBottomLeftRadius: radii.sm + 8,
              }}
            />
          ) : null}

          <View className="flex-row items-start" style={{ gap: 12 }}>
            {/* Leading glyph chip. */}
            <Neumorph
              variant={read ? 'flat' : 'inset'}
              radius={13}
              intensity="sm"
              padding={10}
              surface={read ? ACCENT_WASH[accent] : colors.canvas}
            >
              <Icon name={notification.icon} size={20} color={glyphInk} strokeWidth={2.2} />
            </Neumorph>

            {/* Title + body. */}
            <View style={{ flex: 1 }}>
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <AppText
                  variant="body"
                  weight={read ? 'medium' : 'bold'}
                  numberOfLines={2}
                  style={{ flex: 1, fontSize: 15, lineHeight: 20 }}
                >
                  {notification.title}
                </AppText>
                {!read ? (
                  <View
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 999,
                      backgroundColor: accentHex,
                      marginTop: 4,
                    }}
                  />
                ) : null}
              </View>

              <AppText
                variant="caption"
                color={colors.textMuted}
                numberOfLines={2}
                style={{ marginTop: 3, fontSize: 13, lineHeight: 18 }}
              >
                {notification.body}
              </AppText>

              <View className="flex-row items-center" style={{ gap: 6, marginTop: 8 }}>
                <Icon name="clock" size={12} color="textSubtle" strokeWidth={2.2} />
                <AppText variant="caption" color={colors.textSubtle} style={{ fontSize: 11.5 }}>
                  {relativeTime(notification.createdAt)}
                </AppText>
                {notification.href ? (
                  <>
                    <View
                      style={{
                        width: 3,
                        height: 3,
                        borderRadius: 999,
                        backgroundColor: colors.textSubtle,
                      }}
                    />
                    <AppText variant="caption" color={colors.textSubtle} style={{ fontSize: 11.5 }}>
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
 * Render a compact, human relative time ("just now", "3h ago", "Mon").
 * Pinned to the app's deterministic "now" so the mock data reads consistently
 * (TODAY = 2026-06-26, late morning).
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
