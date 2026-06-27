import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { AppText } from '@/components/ui/Typography';
import { SoftCard } from '@/components/ui/SoftCard';
import { Tag } from '@/components/ui/Tag';
import { SoftInput } from '@/components/ui/SoftInput';
import { PillButton, TextLink } from '@/components/ui/PillButton';
import { Icon } from '@/components/ui/Icon';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { ScreenHeader } from '@/components/dsa/ScreenHeader';
import { SectionHeading } from '@/components/dsa/SectionHeading';
import { InfoTile } from '@/components/dsa/InfoTile';
import { JournalField } from '@/components/dsa/JournalField';
import { LoadingState, ErrorState, EmptyState } from '@/components/dsa/StateViews';
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
import { useDsaProblems, useDsaTopics } from '@/hooks/api';
import { colors, pressOpacity } from '@/theme/tokens';
import type { Problem, ProblemStatus } from '@/types/models';

/* ================================================================== */
/* Coding-journal local state (seeded from the problem's fields)       */
/* ================================================================== */

type Journal = {
  approach: string;
  mistakes: string;
  optimal: string;
  edgeCases: string;
  timeComplexity: string;
  spaceComplexity: string;
};

function seedJournal(problem: Problem): Journal {
  return {
    approach: problem.approach ?? '',
    mistakes: '',
    optimal: '',
    edgeCases: '',
    timeComplexity: problem.timeComplexity ?? '',
    spaceComplexity: problem.spaceComplexity ?? '',
  };
}

/* ================================================================== */
/* Status selector (segmented control)                                 */
/* ================================================================== */

const STATUS_OPTIONS: SegmentedOption<ProblemStatus>[] = [
  { label: 'To do', value: 'TODO' },
  { label: 'Tried', value: 'ATTEMPTED' },
  { label: 'Solved', value: 'SOLVED' },
  { label: 'Master', value: 'MASTERED' },
];

/* ================================================================== */
/* Screen                                                              */
/* ================================================================== */

export default function ProblemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const problemsQuery = useDsaProblems();
  const topicsQuery = useDsaTopics();

  const problem = useMemo<Problem | undefined>(
    () => (problemsQuery.data ?? []).find((p) => p.id === id),
    [problemsQuery.data, id],
  );
  const topic = useMemo(
    () => (topicsQuery.data ?? []).find((t) => t.id === problem?.topicId),
    [topicsQuery.data, problem],
  );

  const [status, setStatus] = useState<ProblemStatus>('TODO');
  const [bookmarked, setBookmarked] = useState(false);
  const [journal, setJournal] = useState<Journal>({
    approach: '',
    mistakes: '',
    optimal: '',
    edgeCases: '',
    timeComplexity: '',
    spaceComplexity: '',
  });

  // Seed local edit state once the problem resolves (id change = new problem).
  useEffect(() => {
    if (problem) {
      setStatus(problem.status);
      setBookmarked(problem.bookmarked ?? false);
      setJournal(seedJournal(problem));
    }
  }, [problem?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function patchJournal(key: keyof Journal) {
    return (next: string) => setJournal((j) => ({ ...j, [key]: next }));
  }

  const handleBack = () => {
    if (router.canGoBack()) router.back();
  };

  /* ---- Loading ---- */
  if (problemsQuery.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16 }}>
          <ScreenHeader eyebrow="Problem" title="Loading…" onBack={handleBack} style={{ marginBottom: 20 }} />
          <LoadingState label="Loading problem" />
        </View>
      </View>
    );
  }

  /* ---- Error ---- */
  if (problemsQuery.isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16 }}>
          <ScreenHeader eyebrow="Problem" title="Couldn't load" onBack={handleBack} style={{ marginBottom: 20 }} />
          <ErrorState
            error={problemsQuery.error}
            onRetry={() => void problemsQuery.refetch()}
            title="Couldn't load problem"
          />
        </View>
      </View>
    );
  }

  /* ---- Not found ---- */
  if (!problem) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16 }}>
          <ScreenHeader eyebrow="Problem" title="Not found" onBack={handleBack} style={{ marginBottom: 20 }} />
          <EmptyState
            icon="alert"
            title="This problem doesn't exist"
            body="It may have been removed. Go back and pick another problem."
          />
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <Pressable
              onPress={handleBack}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressOpacity({ pressed }) })}
            >
              <AppText variant="body" weight="medium" color={colors.ink}>
                Back
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const platform = problem.platform ?? (problem.source ?? 'Practice').split(' ')[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: 40,
        }}
      >
        {/* ---------- Header ---------- */}
        <ScreenHeader
          eyebrow={topic ? topic.title : 'Problem'}
          title={problem.title}
          onBack={handleBack}
          trailing={
            <Pressable
              onPress={() => setBookmarked((b) => !b)}
              hitSlop={10}
              accessibilityLabel="Bookmark problem"
              style={({ pressed }) => ({ opacity: pressOpacity({ pressed }) })}
            >
              <Icon
                name="bookmark"
                size={20}
                color={bookmarked ? 'rust' : 'graphite'}
                weight={bookmarked ? 'fill' : 'light'}
              />
            </Pressable>
          }
          style={{ marginBottom: 20 }}
        />

        {/* ---------- Title / source / tags ---------- */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 320 }}
        >
          <SoftCard radius={18} padding={16} style={{ marginBottom: 16 }}>
            <View className="flex-row items-center" style={{ gap: 10 }}>
              <Icon name={STATUS_ICON[status]} size={18} color={STATUS_COLOR[status]} />
              <View style={{ flex: 1 }}>
                {problem.source ? (
                  <AppText
                    variant="caption"
                    weight="medium"
                    color={colors.graphite}
                    style={{ fontSize: 10.5, letterSpacing: 0.6, textTransform: 'uppercase' }}
                  >
                    {problem.source}
                  </AppText>
                ) : null}
                <AppText variant="heading" display numberOfLines={2} style={{ marginTop: problem.source ? 1 : 0 }}>
                  {problem.title}
                </AppText>
              </View>
            </View>

            <View className="flex-row flex-wrap items-center" style={{ gap: 6, marginTop: 12 }}>
              <Tag
                label={DIFFICULTY_LABEL[problem.difficulty]}
                tone={DIFFICULTY_TONE[problem.difficulty]}
                size="sm"
                icon={<Icon name={DIFFICULTY_ICON[problem.difficulty]} size={11} color={colors.graphite} />}
              />
              <Tag label={STATUS_LABEL[status]} tone={STATUS_TONE[status]} size="sm" />
              {(problem.tags ?? []).map((t) => (
                <Tag key={t} label={t} tone="neutral" size="sm" />
              ))}
            </View>
          </SoftCard>
        </MotiView>

        {/* ---------- Meta: attempts / last attempt / platform ---------- */}
        <View className="flex-row" style={{ gap: 10, marginBottom: 22 }}>
          <InfoTile icon="repeat" value={String(problem.attempts ?? 0)} label="Attempts" style={{ flex: 1 }} />
          <InfoTile
            icon="calendar"
            value={formatShortDate(problem.lastAttemptedAt)}
            label="Last tried"
            style={{ flex: 1 }}
          />
          <InfoTile icon="code" value={platform} label="Platform" style={{ flex: 1 }} />
        </View>

        {/* ---------- Status selector (segmented) ---------- */}
        <SectionHeading icon="flag" title="Status" />
        <SegmentedTabs
          options={STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
          height={40}
          style={{ marginBottom: 24 }}
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
          style={{ marginBottom: 18 }}
        />
        <JournalField
          icon="alert"
          title="Mistakes"
          body={journal.mistakes}
          onChangeBody={patchJournal('mistakes')}
          placeholder="Where did you slip — TLE, off-by-one, wrong invariant?"
          style={{ marginBottom: 18 }}
        />
        <JournalField
          icon="sparkles"
          title="Optimal solution"
          body={journal.optimal}
          onChangeBody={patchJournal('optimal')}
          placeholder="The clean, intended approach."
          style={{ marginBottom: 18 }}
        />
        <JournalField
          icon="target"
          title="Edge cases"
          body={journal.edgeCases}
          onChangeBody={patchJournal('edgeCases')}
          placeholder="Empty input, duplicates, overflow…"
          style={{ marginBottom: 24 }}
        />

        {/* ---------- Complexity ---------- */}
        <SectionHeading icon="activity" title="Complexity" />
        <View className="flex-row" style={{ gap: 10, marginBottom: 24 }}>
          <View style={{ flex: 1 }}>
            <SoftInput
              label="Time"
              value={journal.timeComplexity}
              onChangeText={patchJournal('timeComplexity')}
              placeholder="O(n)"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={{ flex: 1 }}>
            <SoftInput
              label="Space"
              value={journal.spaceComplexity}
              onChangeText={patchJournal('spaceComplexity')}
              placeholder="O(1)"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* ---------- Notes ---------- */}
        {problem.notes ? (
          <>
            <SectionHeading icon="pin" title="Quick note" />
            <SoftCard variant="inset" radius={13} padding={14} style={{ marginBottom: 24 }}>
              <AppText variant="body" color={colors.ash} style={{ lineHeight: 20 }}>
                {problem.notes}
              </AppText>
            </SoftCard>
          </>
        ) : null}

        {/* ---------- Actions: ONE filled Ink CTA + a text link ---------- */}
        <View className="flex-row items-center" style={{ gap: 16 }}>
          <PillButton
            label="Mark solved"
            variant="black"
            size="md"
            onPress={() => setStatus('SOLVED')}
          />
          <TextLink
            label="Schedule review"
            onPress={() => {}}
            icon={<Icon name="calendar-check" size={15} color="ink" />}
          />
        </View>
      </ScrollView>
    </View>
  );
}
