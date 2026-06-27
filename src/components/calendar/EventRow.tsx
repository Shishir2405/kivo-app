/**
 * A single calendar-event row (STEEP) — shared by the Agenda view and the
 * selected-day list under the month grid.
 *
 * Flat: a small time rail, the title + subtitle column, and a small type Tag.
 * Done events recede (Fog surface, a Graphite check) so what's left to do leads.
 * One subtle shadow + Dove hairline, no neumorphism. Vector Icons only.
 */
import React from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Tag } from '@/components/ui/Tag';
import { Icon } from '@/components/ui/Icon';
import { colors, radii } from '@/theme/tokens';
import type { CalendarEvent } from '@/types/models';

import { ACCENT_TONE, TYPE_META, timeLabel, type Accent } from './calendarMeta';

export type EventRowProps = {
  event: CalendarEvent;
  index: number;
};

export function EventRow({ event }: EventRowProps) {
  const accent = event.accent as Accent;
  const meta = TYPE_META[event.type];
  const done = !!event.done;

  return (
    <SoftCard
      variant={done ? 'inset' : 'raised'}
      radius={radii.card}
      padding={12}
      flat={done}
    >
      <View className="flex-row items-center" style={{ gap: 12 }}>
        {/* Time rail. */}
        <View style={{ width: 50, alignItems: 'flex-start' }}>
          {event.time ? (
            <>
              <AppText variant="subheading" weight="medium" color={colors.ink}>
                {timeLabel(event.time).replace(/ (AM|PM)$/, '')}
              </AppText>
              <AppText variant="caption" color={colors.graphite} style={{ marginTop: 1 }}>
                {timeLabel(event.time).slice(-2)}
              </AppText>
            </>
          ) : (
            <AppText variant="caption" color={colors.graphite}>
              All day
            </AppText>
          )}
        </View>

        {/* Title + subtitle. */}
        <View style={{ flex: 1 }}>
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <AppText
              variant="body"
              weight="medium"
              numberOfLines={1}
              style={{ flex: 1 }}
              color={done ? colors.graphite : colors.ink}
            >
              {event.title}
            </AppText>
            {done ? <Icon name="check-circle" size={15} color="graphite" /> : null}
          </View>
          {event.subtitle ? (
            <AppText
              variant="caption"
              color={colors.graphite}
              numberOfLines={1}
              style={{ marginTop: 2 }}
            >
              {event.subtitle}
            </AppText>
          ) : null}
        </View>

        {/* Type tag. */}
        <Tag label={meta.label} tone={done ? 'neutral' : ACCENT_TONE[accent]} size="sm" />
      </View>
    </SoftCard>
  );
}

export default EventRow;
