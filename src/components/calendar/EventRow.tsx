/**
 * A single calendar-event row — shared by the Agenda view and the selected-day
 * list under the month grid.
 *
 * Layout: a leading time/all-day rail, a neumorphic glyph chip tinted by the
 * event accent, the title + subtitle column, and a trailing type tag. Done
 * events recede (muted surface, strike-style check) so what's left to do leads.
 *
 * Pure Aaply kit — vector Icons only, ZERO emoji.
 */
import React from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { Icon } from '@/components/ui/Icon';
import { colors, radii } from '@/theme/tokens';
import type { CalendarEvent } from '@/types/models';

import {
  ACCENT_HEX,
  ACCENT_WASH,
  TYPE_META,
  timeLabel,
  type Accent,
} from './calendarMeta';

export type EventRowProps = {
  event: CalendarEvent;
  index: number;
};

export function EventRow({ event, index }: EventRowProps) {
  const accent = event.accent as Accent;
  const accentHex = ACCENT_HEX[accent];
  const glyphInk = accent === 'highlighter' ? colors.carbon : accentHex;
  const meta = TYPE_META[event.type];
  const done = !!event.done;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 280, delay: 40 + index * 45 }}
    >
      <SoftCard
        variant={done ? 'flat' : 'raised'}
        radius={radii.sm + 8}
        intensity="sm"
        padding={14}
        surface={done ? '#ededed' : colors.canvas}
        style={{ opacity: done ? 0.92 : 1, overflow: 'hidden' }}
      >
        {/* Accent rail down the left edge (only for active items). */}
        {!done ? (
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

        <View className="flex-row items-center" style={{ gap: 12 }}>
          {/* Time rail. */}
          <View style={{ width: 52, alignItems: 'flex-start' }}>
            {event.time ? (
              <>
                <AppText variant="body" weight="bold" style={{ fontSize: 15 }}>
                  {timeLabel(event.time).replace(/ (AM|PM)$/, '')}
                </AppText>
                <AppText
                  variant="caption"
                  color={colors.textSubtle}
                  style={{ fontSize: 11, marginTop: 1 }}
                >
                  {timeLabel(event.time).slice(-2)}
                </AppText>
              </>
            ) : (
              <View className="flex-row items-center" style={{ gap: 4 }}>
                <Icon name="sun" size={13} color="textSubtle" strokeWidth={2.2} />
                <AppText variant="caption" color={colors.textSubtle} style={{ fontSize: 11 }}>
                  All day
                </AppText>
              </View>
            )}
          </View>

          {/* Glyph chip. */}
          <Neumorph
            variant={done ? 'flat' : 'inset'}
            radius={13}
            intensity="sm"
            padding={10}
            surface={done ? ACCENT_WASH[accent] : colors.canvas}
          >
            <Icon name={event.icon} size={19} color={glyphInk} strokeWidth={2.2} />
          </Neumorph>

          {/* Title + subtitle. */}
          <View style={{ flex: 1 }}>
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <AppText
                variant="body"
                weight={done ? 'medium' : 'bold'}
                numberOfLines={1}
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: done ? colors.textMuted : colors.carbon,
                }}
              >
                {event.title}
              </AppText>
              {done ? (
                <Icon name="check-circle-filled" size={17} color="success" strokeWidth={2.2} />
              ) : null}
            </View>
            {event.subtitle ? (
              <AppText
                variant="caption"
                color={colors.textMuted}
                numberOfLines={1}
                style={{ fontSize: 12.5, marginTop: 2 }}
              >
                {event.subtitle}
              </AppText>
            ) : null}
          </View>

          {/* Type glyph badge. */}
          <Neumorph variant="inset" radius={9} intensity="sm" padding={7} surface={colors.canvas}>
            <Icon name={meta.icon} size={14} color={accent} strokeWidth={2.3} />
          </Neumorph>
        </View>
      </SoftCard>
    </MotiView>
  );
}

export default EventRow;
