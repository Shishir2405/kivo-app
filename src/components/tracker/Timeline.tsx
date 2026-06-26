import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/ui/Typography';
import { Neumorph } from '@/components/ui/Neumorph';
import { Tag } from '@/components/ui/Tag';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors, radii } from '@/theme/tokens';

export type PlanBlock = {
  time: string;
  title: string;
  detail: string;
  icon: IconName;
  accentHex: string;
  state: 'done' | 'active' | 'upcoming';
};

// Deterministic plan for TODAY (2026-06-26) — no Date.now at module scope.
export const PLAN: PlanBlock[] = [
  {
    time: '08:30',
    title: 'Warm-up: 1 easy array',
    detail: 'Two Sum revisit · 15 min',
    icon: 'grid',
    accentHex: colors.success,
    state: 'done',
  },
  {
    time: '09:00',
    title: 'Deep focus — Graphs',
    detail: 'Course Schedule · topo sort',
    icon: 'globe',
    accentHex: colors.highlighter,
    state: 'active',
  },
  {
    time: '11:30',
    title: 'Review flagged revisions',
    detail: '3 due today · spaced repetition',
    icon: 'repeat',
    accentHex: colors.peach,
    state: 'upcoming',
  },
  {
    time: '16:00',
    title: 'Mock interview prep',
    detail: 'System design read · 45 min',
    icon: 'mail',
    accentHex: colors.signal,
    state: 'upcoming',
  },
];

function TimelineRow({ block, isLast }: { block: PlanBlock; isLast: boolean }) {
  const done = block.state === 'done';
  const active = block.state === 'active';

  return (
    <View className="flex-row" style={{ gap: 14 }}>
      {/* Time column. */}
      <View style={{ width: 44, alignItems: 'flex-end', paddingTop: 1 }}>
        <AppText
          variant="caption"
          weight={active ? 'bold' : 'medium'}
          color={active ? colors.carbon : colors.textSubtle}
          style={{ fontSize: 13, fontVariant: ['tabular-nums'] }}
        >
          {block.time}
        </AppText>
      </View>

      {/* Rail with node. */}
      <View style={{ alignItems: 'center', width: 18 }}>
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: done ? block.accentHex : colors.canvas,
            borderWidth: done ? 0 : 3,
            borderColor: active ? block.accentHex : colors.hairline,
            marginTop: 3,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {done ? (
            <Icon name="check" size={9} color="carbon" strokeWidth={3.5} />
          ) : null}
        </View>
        {!isLast ? (
          <View
            style={{
              flex: 1,
              width: 2,
              backgroundColor: colors.hairline,
              marginTop: 2,
            }}
          />
        ) : null}
      </View>

      {/* Card. */}
      <View style={{ flex: 1, paddingBottom: isLast ? 0 : 14 }}>
        <Neumorph
          variant={active ? 'raised' : 'flat'}
          radius={radii.sm + 6}
          intensity="sm"
          padding={13}
          surface={active ? colors.canvas : '#ededed'}
        >
          <View className="flex-row items-center" style={{ gap: 11 }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 11,
                backgroundColor: active ? block.accentHex : '#e3e3e3',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon
                name={block.icon}
                size={16}
                color={active ? 'carbon' : done ? 'textSubtle' : 'textMuted'}
                strokeWidth={2.2}
              />
            </View>

            <View style={{ flex: 1 }}>
              <AppText
                variant="body"
                weight="semibold"
                color={done ? colors.textMuted : colors.carbon}
                style={done ? { textDecorationLine: 'line-through' } : undefined}
                numberOfLines={1}
              >
                {block.title}
              </AppText>
              <AppText
                variant="caption"
                color={colors.textSubtle}
                style={{ marginTop: 1 }}
                numberOfLines={1}
              >
                {block.detail}
              </AppText>
            </View>

            {active ? (
              <Tag label="Now" tone="yellow" size="sm" />
            ) : done ? (
              <Icon name="check-circle" size={18} color="success" strokeWidth={2.4} />
            ) : null}
          </View>
        </Neumorph>
      </View>
    </View>
  );
}

export type TimelineProps = {
  blocks?: PlanBlock[];
};

/** The daily-planner vertical timeline (done / active / upcoming blocks). */
export function Timeline({ blocks = PLAN }: TimelineProps) {
  return (
    <View>
      {blocks.map((block, i) => (
        <TimelineRow
          key={block.time}
          block={block}
          isLast={i === blocks.length - 1}
        />
      ))}
    </View>
  );
}

export default Timeline;
