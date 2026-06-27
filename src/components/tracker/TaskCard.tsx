import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';
import { Card } from '@/components/ui/SoftCard';
import { Checkbox } from '@/components/ui/Checkbox';
import { Tag, type TagTone } from '@/components/ui/Tag';
import { AppText } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { colors, spacing } from '@/theme/tokens';
import type { Task, Priority } from '@/types/models';

/** Today, for relative due labels. Injected so the card stays deterministic. */
const TODAY = '2026-06-27';
const TOMORROW = '2026-06-28';

const PRIORITY_TONE: Record<Priority, TagTone> = {
  HIGH: 'rust',
  MEDIUM: 'warm',
  LOW: 'neutral',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Pretty due-date: relative for today/tomorrow, else a short month-day label. */
function dueLabel(due: string): { text: string; overdue: boolean } {
  const day = due.slice(0, 10);
  if (day === TODAY) return { text: 'Today', overdue: false };
  if (day < TODAY) return { text: 'Overdue', overdue: true };
  if (day === TOMORROW) return { text: 'Tomorrow', overdue: false };
  const [, mm, dd] = day.split('-');
  const monthIdx = Math.max(0, Math.min(11, Number(mm) - 1));
  return { text: `${MONTHS[monthIdx]} ${Number(dd)}`, overdue: false };
}

export type TaskCardProps = {
  task: Task;
  onToggle: (id: string, next: boolean) => void;
  onToggleChecklistItem?: (taskId: string, itemId: string, next: boolean) => void;
};

/**
 * A flat Steep task row.
 *
 * - Complete is the small flat {@link Checkbox} (Ink square + white check). When
 *   done, the title strikes through and the row dims; the surface itself stays
 *   flat white (no inset well, no neumorphism).
 * - Priority / due tags are small Steep chips (color as punctuation only).
 * - If the task has a checklist or notes, the row expands (animated) to reveal
 *   sub-step checkboxes + notes behind a thin Dove divider.
 */
export function TaskCard({ task, onToggle, onToggleChecklistItem }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);

  const checklist = task.checklist ?? [];
  const hasChecklist = checklist.length > 0;
  const hasDetail = hasChecklist || !!task.notes;
  const doneCount = useMemo(() => checklist.filter((c) => c.done).length, [checklist]);

  const due = task.dueDate ? dueLabel(task.dueDate) : null;

  return (
    <Card padding={spacing.md} style={{ marginBottom: spacing.sm }}>
      <View className="flex-row items-start" style={{ gap: spacing.md }}>
        <Checkbox
          checked={task.done}
          onChange={(next) => onToggle(task.id, next)}
          style={{ marginTop: 1 }}
        />

        <Pressable
          style={{ flex: 1 }}
          disabled={!hasDetail}
          onPress={() => setExpanded((e) => !e)}
        >
          <View className="flex-row items-start" style={{ gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <AppText
                variant="body"
                weight="medium"
                color={task.done ? colors.dove : colors.ink}
                numberOfLines={2}
                style={task.done ? { textDecorationLine: 'line-through' } : undefined}
              >
                {task.title}
              </AppText>

              {!task.done && (due || task.priority === 'HIGH' || hasChecklist) ? (
                <View
                  className="flex-row items-center"
                  style={{ gap: 6, marginTop: 7, flexWrap: 'wrap', rowGap: 6 }}
                >
                  {task.priority === 'HIGH' ? (
                    <Tag label="High" tone={PRIORITY_TONE.HIGH} size="sm" />
                  ) : null}
                  {due ? (
                    <Tag
                      label={due.text}
                      tone={due.overdue ? 'rust' : 'neutral'}
                      size="sm"
                    />
                  ) : null}
                  {hasChecklist ? (
                    <Tag
                      label={`${doneCount}/${checklist.length}`}
                      tone="neutral"
                      size="sm"
                    />
                  ) : null}
                </View>
              ) : null}
            </View>

            {hasDetail && !task.done ? (
              <MotiView
                animate={{ rotate: expanded ? '180deg' : '0deg' }}
                transition={{ type: 'timing', duration: 200 }}
                style={{ marginTop: 2 }}
              >
                <Icon name="chevron-down" size={16} color="graphite" />
              </MotiView>
            ) : null}
          </View>
        </Pressable>
      </View>

      {/* Expandable detail: notes + checklist sub-steps. */}
      <AnimatePresence>
        {expanded && !task.done ? (
          <MotiView
            from={{ opacity: 0, translateY: -4 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -4 }}
            transition={{ type: 'timing', duration: 200 }}
            style={{ marginTop: spacing.md }}
          >
            <View
              style={{ height: 1, backgroundColor: colors.dove, marginBottom: spacing.md }}
            />
            {task.notes ? (
              <AppText
                variant="caption"
                color={colors.ash}
                style={{ marginBottom: hasChecklist ? spacing.md : 0 }}
              >
                {task.notes}
              </AppText>
            ) : null}

            {checklist.map((item) => (
              <View
                key={item.id}
                className="flex-row items-center"
                style={{ gap: spacing.sm, marginBottom: spacing.sm }}
              >
                <Checkbox
                  checked={item.done}
                  size={18}
                  onChange={(next) =>
                    onToggleChecklistItem?.(task.id, item.id, next)
                  }
                />
                <AppText
                  variant="caption"
                  color={item.done ? colors.dove : colors.ash}
                  style={{
                    flex: 1,
                    ...(item.done ? { textDecorationLine: 'line-through' } : null),
                  }}
                >
                  {item.label}
                </AppText>
              </View>
            ))}
          </MotiView>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}

export default TaskCard;
