import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { colors, spacing } from '@/theme/tokens';

export type PlanState = 'done' | 'active' | 'upcoming';

export type PlanBlock = {
  /** Stable key. */
  id: string;
  /** Short time / order label, e.g. "Now" or "Next". */
  time: string;
  title: string;
  /** Optional secondary line. */
  detail?: string;
  state: PlanState;
};

function TimelineRow({ block, isLast }: { block: PlanBlock; isLast: boolean }) {
  const done = block.state === 'done';
  const active = block.state === 'active';

  // Node fill: Ink for done, Rust ring for active, Dove hairline for upcoming.
  const nodeBg = done ? colors.ink : colors.white;
  const nodeBorder = active ? colors.rust : done ? colors.ink : colors.dove;

  return (
    <View className="flex-row" style={{ gap: spacing.md }}>
      {/* Rail with node. */}
      <View style={{ alignItems: 'center', width: 14 }}>
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: nodeBg,
            borderWidth: active ? 2 : 1,
            borderColor: nodeBorder,
            marginTop: 3,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {done ? <Icon name="check" size={7} color="white" weight="bold" /> : null}
        </View>
        {!isLast ? (
          <View
            style={{ flex: 1, width: 1, backgroundColor: colors.dove, marginTop: 2 }}
          />
        ) : null}
      </View>

      {/* Content. */}
      <View
        style={{ flex: 1, paddingBottom: isLast ? 0 : spacing.md }}
        className="flex-row items-start justify-between"
      >
        <View style={{ flex: 1, paddingRight: spacing.sm }}>
          <AppText
            variant="subheading"
            weight="medium"
            color={done ? colors.dove : colors.ink}
            numberOfLines={1}
            style={done ? { textDecorationLine: 'line-through' } : undefined}
          >
            {block.title}
          </AppText>
          {block.detail ? (
            <AppText
              variant="caption"
              color={colors.graphite}
              numberOfLines={1}
              style={{ marginTop: 1 }}
            >
              {block.detail}
            </AppText>
          ) : null}
        </View>
        <AppText
          variant="caption"
          weight={active ? 'medium' : 'regular'}
          color={active ? colors.rust : colors.graphite}
          style={{ marginTop: 1 }}
        >
          {block.time}
        </AppText>
      </View>
    </View>
  );
}

export type TimelineProps = {
  blocks: PlanBlock[];
};

/** The daily-plan vertical timeline — flat, derived from real tasks. */
export function Timeline({ blocks }: TimelineProps) {
  return (
    <View>
      {blocks.map((block, i) => (
        <TimelineRow key={block.id} block={block} isLast={i === blocks.length - 1} />
      ))}
    </View>
  );
}

export default Timeline;
