import React, { useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Neumorph } from '@/components/ui/Neumorph';
import { Tag } from '@/components/ui/Tag';
import { SoftButton } from '@/components/ui/SoftButton';
import { SoftInput } from '@/components/ui/SoftInput';
import { SoftIconButton } from '@/components/ui/SoftIconButton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { ScreenHeader } from '@/components/dsa/ScreenHeader';
import { SectionHeading } from '@/components/dsa/SectionHeading';
import { JournalField } from '@/components/dsa/JournalField';
import {
  DIFFICULTY_ICON,
  DIFFICULTY_LABEL,
  DIFFICULTY_TONE,
  STATUS_COLOR,
  STATUS_ICON,
  STATUS_LABEL,
  STATUS_TONE,
  formatShortDate,
} from '@/components/dsa/dsaMeta';
import { GroupIllustration53Svg } from '@/constants/brandAssets';
import { colors } from '@/theme/tokens';
import { mockProblems, mockTopics } from '@/data/mock';
import type { Problem, ProblemStatus } from '@/types/models';

/* ================================================================== */
/* Coding-journal seed content (deterministic per problem)             */
/* ================================================================== */

type Journal = {
  approach: string;
  mistakes: string;
  optimal: string;
  edgeCases: string;
  timeComplexity: string;
  spaceComplexity: string;
};

const JOURNALS: Record<string, Journal> = {
  p_1: {
    approach:
      'Single pass with a hash map of value -> index. For each number, check if its complement (target - num) was already seen; if so, return both indices.',
    mistakes:
      'First tried the brute-force O(n^2) double loop and TLE-d on large inputs. Also returned the value instead of the index on the first attempt.',
    optimal:
      'Hash map in one pass. Insert as you go so you never use the same element twice. No sorting needed — order is preserved.',
    edgeCases:
      'Duplicate values that sum to the target (e.g. [3,3], target 6); negative numbers; exactly two elements; no valid pair.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
  },
  p_3: {
    approach:
      'Put every number in a hash set. Only start counting a streak from a sequence head — a number x with no x-1 present — then walk x+1, x+2, ... upward.',
    mistakes:
      'Counted streaks from every element, turning it accidentally O(n^2). Forgot to dedupe, so duplicates inflated the length.',
    optimal:
      'The "start only from heads" trick guarantees each element is visited at most twice across the whole run, giving linear time.',
    edgeCases:
      'Empty array; all duplicates; a single element; negative numbers; already-consecutive input.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
  },
};

const DEFAULT_JOURNAL: Journal = {
  approach:
    'Identify the underlying pattern first — hash map, two pointers, BFS/DFS, or DP — then dry-run on a tiny input before writing code.',
  mistakes:
    'Watch for off-by-one errors on boundaries and forgetting to handle the empty / single-element input.',
  optimal:
    'Reduce repeated work by memoizing or pre-processing; aim to drop a nested loop into a single linear pass where possible.',
  edgeCases:
    'Empty input, single element, all-equal values, and the maximum-size input for the time limit.',
  timeComplexity: 'O(n)',
  spaceComplexity: 'O(1)',
};

function seedJournal(problem: Problem): Journal {
  const base = JOURNALS[problem.id] ?? DEFAULT_JOURNAL;
  return {
    ...base,
    // Prefer the structured fields from the data layer when present.
    approach: problem.approach ?? base.approach,
    timeComplexity: problem.timeComplexity ?? base.timeComplexity,
    spaceComplexity: problem.spaceComplexity ?? base.spaceComplexity,
  };
}

/* ================================================================== */
/* Meta pill                                                           */
/* ================================================================== */

function MetaPill({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <Neumorph variant="raised" radius={18} intensity="sm" padding={14} style={{ flex: 1 }}>
      <View style={{ gap: 8 }}>
        <Neumorph variant="inset" radius={11} intensity="sm">
          <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size={17} color="carbon" strokeWidth={2.2} />
          </View>
        </Neumorph>
        <AppText variant="body" weight="bold" numberOfLines={1}>
          {value}
        </AppText>
        <AppText
          variant="caption"
          weight="medium"
          color={colors.textSubtle}
          style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.8 }}
        >
          {label}
        </AppText>
      </View>
    </Neumorph>
  );
}

/* ================================================================== */
/* Status selector (segmented control — replaces the radio row)        */
/* ================================================================== */

const STATUS_OPTIONS: SegmentedOption<ProblemStatus>[] = [
  { label: 'To do', value: 'TODO', icon: STATUS_ICON.TODO },
  { label: 'Tried', value: 'ATTEMPTED', icon: STATUS_ICON.ATTEMPTED },
  { label: 'Solved', value: 'SOLVED', icon: STATUS_ICON.SOLVED },
  { label: 'Master', value: 'MASTERED', icon: STATUS_ICON.MASTERED },
];

/* ================================================================== */
/* Screen                                                              */
/* ================================================================== */

export default function ProblemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const problem = useMemo<Problem | undefined>(
    () => mockProblems.find((p) => p.id === id),
    [id],
  );
  const topic = useMemo(
    () => mockTopics.find((t) => t.id === problem?.topicId),
    [problem],
  );

  const [status, setStatus] = useState<ProblemStatus>(problem?.status ?? 'TODO');
  const [bookmarked, setBookmarked] = useState(problem?.bookmarked ?? false);
  const [journal, setJournal] = useState<Journal>(() =>
    problem ? seedJournal(problem) : DEFAULT_JOURNAL,
  );

  function patchJournal(key: keyof Journal) {
    return (next: string) => setJournal((j) => ({ ...j, [key]: next }));
  }

  /* ---- Not-found fallback ---- */
  if (!problem) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20 }}>
          <ScreenHeader eyebrow="Problem" title="Not found" />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
          <GroupIllustration53Svg width={140} height={112} />
          <AppText variant="subheading" weight="bold" display style={{ textAlign: 'center' }}>
            This problem doesn't exist
          </AppText>
        </View>
      </View>
    );
  }

  const platform = problem.platform ?? (problem.source ?? 'LeetCode').split(' ')[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 48,
        }}
      >
        {/* ---------- Header ---------- */}
        <ScreenHeader
          eyebrow={topic ? topic.title : 'Problem'}
          title={problem.title}
          trailing={
            <SoftIconButton
              size={46}
              active={bookmarked}
              onPress={() => setBookmarked((b) => !b)}
              accessibilityLabel="Bookmark problem"
            >
              <Icon
                name="bookmark"
                size={20}
                color={bookmarked ? 'carbon' : 'textMuted'}
                fill={bookmarked ? colors.highlighter : 'none'}
              />
            </SoftIconButton>
          }
          style={{ marginBottom: 22 }}
        />

        {/* ---------- Title / platform / difficulty / status ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 360 }}
        >
          <SoftCard radius={36} intensity="lg" padding={22} style={{ marginBottom: 24 }}>
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <Neumorph variant="inset" radius={18} intensity="sm">
                <View style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon
                    name={STATUS_ICON[status]}
                    size={26}
                    color={STATUS_COLOR[status]}
                    strokeWidth={2.2}
                  />
                </View>
              </Neumorph>
              <View style={{ flex: 1 }}>
                <AppText
                  variant="caption"
                  weight="semibold"
                  color={colors.textSubtle}
                  style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' }}
                >
                  {problem.source ?? 'Practice problem'}
                </AppText>
                <AppText variant="subheading" display weight="bold" style={{ marginTop: 2, fontSize: 21 }}>
                  {problem.title}
                </AppText>
              </View>
            </View>

            <View className="flex-row flex-wrap items-center" style={{ gap: 8, marginTop: 16 }}>
              <Tag
                label={DIFFICULTY_LABEL[problem.difficulty]}
                tone={DIFFICULTY_TONE[problem.difficulty]}
                icon={<Icon name={DIFFICULTY_ICON[problem.difficulty]} size={13} color={colors.carbon} />}
              />
              <Tag
                label={STATUS_LABEL[status]}
                tone={STATUS_TONE[status]}
                icon={<Icon name={STATUS_ICON[status]} size={13} color={STATUS_COLOR[status]} />}
              />
              {problem.tags.map((t) => (
                <Tag key={t} label={t} tone="neutral" size="sm" />
              ))}
            </View>
          </SoftCard>
        </MotiView>

        {/* ---------- Meta: attempts / last attempt / platform ---------- */}
        <View className="flex-row" style={{ gap: 12, marginBottom: 26 }}>
          <MetaPill icon="repeat" label="Attempts" value={String(problem.attempts)} />
          <MetaPill icon="calendar" label="Last tried" value={formatShortDate(problem.lastAttemptedAt)} />
          <MetaPill icon="code" label="Platform" value={platform} />
        </View>

        {/* ---------- Status selector (segmented, no radio) ---------- */}
        <SectionHeading icon="flag" title="Status" />
        <SegmentedTabs
          options={STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
          height={52}
          style={{ marginBottom: 28 }}
        />

        {/* ---------- Coding journal ---------- */}
        <SectionHeading
          icon="notebook-pen"
          eyebrow="What you tried, where you slipped"
          title="Coding journal"
        />

        <JournalField
          icon="lightbulb"
          title="Approach"
          body={journal.approach}
          onChangeBody={patchJournal('approach')}
          placeholder="How did you crack it? Name the pattern."
          accent={colors.signal}
          style={{ marginBottom: 22 }}
        />
        <JournalField
          icon="alert"
          title="Mistakes"
          body={journal.mistakes}
          onChangeBody={patchJournal('mistakes')}
          placeholder="Where did you slip — TLE, off-by-one, wrong invariant?"
          accent={colors.annotation}
          style={{ marginBottom: 22 }}
        />
        <JournalField
          icon="sparkles"
          title="Optimal solution"
          body={journal.optimal}
          onChangeBody={patchJournal('optimal')}
          placeholder="The clean, intended approach."
          accent={colors.highlighter}
          style={{ marginBottom: 22 }}
        />
        <JournalField
          icon="target"
          title="Edge cases"
          body={journal.edgeCases}
          onChangeBody={patchJournal('edgeCases')}
          placeholder="Empty input, duplicates, overflow..."
          accent={colors.peach}
          style={{ marginBottom: 28 }}
        />

        {/* ---------- Complexity ---------- */}
        <SectionHeading icon="activity" title="Complexity" />
        <View className="flex-row" style={{ gap: 12, marginBottom: 28 }}>
          <View style={{ flex: 1, gap: 8 }}>
            <SoftInput
              label="Time"
              value={journal.timeComplexity}
              onChangeText={patchJournal('timeComplexity')}
              placeholder="O(n)"
              autoCapitalize="none"
              autoCorrect={false}
              leading={<Icon name="clock" size={18} color="signal" />}
            />
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <SoftInput
              label="Space"
              value={journal.spaceComplexity}
              onChangeText={patchJournal('spaceComplexity')}
              placeholder="O(1)"
              autoCapitalize="none"
              autoCorrect={false}
              leading={<Icon name="layers" size={18} color="peach" />}
            />
          </View>
        </View>

        {/* ---------- Notes ---------- */}
        {problem.notes ? (
          <>
            <SectionHeading icon="pin" title="Quick note" />
            <SoftCard variant="inset" radius={24} padding={18} style={{ marginBottom: 28 }}>
              <AppText variant="body" color={colors.textMuted} style={{ lineHeight: 23 }}>
                {problem.notes}
              </AppText>
            </SoftCard>
          </>
        ) : null}

        {/* ---------- Actions ---------- */}
        <View className="flex-row" style={{ gap: 12 }}>
          <SoftButton
            label="Mark solved"
            variant="yellow"
            size="md"
            fullWidth
            onPress={() => setStatus('SOLVED')}
            style={{ flex: 1 }}
          />
          <SoftButton
            label="Schedule review"
            variant="carbon"
            size="md"
            fullWidth
            onPress={() => {}}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
