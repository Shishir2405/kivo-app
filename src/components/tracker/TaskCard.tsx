import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';
import { SoftCard } from '@/components/ui/SoftCard';
import { Checkbox } from '@/components/ui/Checkbox';
import { Tag, type TagTone } from '@/components/ui/Tag';
import { AppText } from '@/components/ui/Typography';
import { Neumorph } from '@/components/ui/Neumorph';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors, radii } from '@/theme/tokens';
import type { Task, Priority } from '@/types/models';

const PRIORITY_TONE: Record<Priority, TagTone> = {
  HIGH: 'annotation',
  MEDIUM: 'peach',
  LOW: 'signal',
};

const CATEGORY_TONE: Record<Task['category'], TagTone> = {
  DSA: 'yellow',
  PROJECT: 'signal',
  REVISION: 'peach',
  OTHER: 'neutral',
};

const CATEGORY_ICON: Record<Task['category'], IconName> = {
  DSA: 'code',
  PROJECT: 'folder',
  REVISION: 'repeat',
  OTHER: 'list',
};

/** Pretty due-date: relative for today/tomorrow, else a short label. */
function dueLabel(due: string): { text: string; overdue: boolean } {
  const TODAY = '2026-06-26';
  if (due === TODAY) return { text: 'Today', overdue: false };
  if (due < TODAY) return { text: 'Overdue', overdue: true };
  if (due === '2026-06-27') return { text: 'Tomorrow', overdue: false };
  // Month-day from the ISO date (deterministic, no Date parsing needed for labels).
  const [, mm, dd] = due.split('-');
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = Math.max(0, Math.min(11, Number(mm) - 1));
  return { text: `${MONTHS[monthIdx]} ${Number(dd)}`, overdue: false };
}

export type TaskCardProps = {
  task: Task;
  onToggle: (id: string) => void;
  onToggleChecklistItem: (taskId: string, itemId: string) => void;
};

/**
 * A premium task row.
 *
 * - The complete toggle is the CUSTOM neumorphic {@link Checkbox} — never a
 *   native control. When checked the card sinks to an inset well and the title
 *   strikes through.
 * - A category icon medallion anchors the row; priority / category / due tags
 *   give quick scanning hierarchy.
 * - If the task has a checklist, a progress chip is shown and the card expands
 *   (animated) to reveal sub-step checkboxes.
 */
export function TaskCard({ task, onToggle, onToggleChecklistItem }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);

  const checklist = task.checklist ?? [];
  const hasChecklist = checklist.length > 0;
  const doneCount = useMemo(
    () => checklist.filter((c) => c.done).length,
    [checklist],
  );

  const due = task.dueDate ? dueLabel(task.dueDate) : null;
  const categoryIcon = task.icon ?? CATEGORY_ICON[task.category];

  return (
    <SoftCard
      variant={task.done ? 'inset' : 'raised'}
      radius={radii.sm + 8}
      intensity="sm"
      padding={14}
      style={{ marginBottom: 12 }}
    >
      <View className="flex-row items-start" style={{ gap: 12 }}>
        <Checkbox
          checked={task.done}
          onChange={() => onToggle(task.id)}
          style={{ marginTop: 2 }}
        />

        <Pressable
          style={{ flex: 1 }}
          disabled={!hasChecklist && !task.notes}
          onPress={() => setExpanded((e) => !e)}
        >
          <View className="flex-row items-start" style={{ gap: 10 }}>
            <Neumorph
              variant={task.done ? 'flat' : 'inset'}
              radius={11}
              intensity="sm"
              surface={task.done ? '#e8e8e8' : colors.canvas}
            >
              <View
                style={{ width: 34, height: 34 }}
                className="items-center justify-center"
              >
                <Icon
                  name={categoryIcon}
                  size={17}
                  color={task.done ? 'textSubtle' : 'carbon'}
                  strokeWidth={2.2}
                />
              </View>
            </Neumorph>

            <View style={{ flex: 1 }}>
              <AppText
                variant="body"
                weight="semibold"
                color={task.done ? colors.textMuted : colors.carbon}
                numberOfLines={2}
                style={
                  task.done ? { textDecorationLine: 'line-through' } : undefined
                }
              >
                {task.title}
              </AppText>

              <View
                className="flex-row items-center"
                style={{ gap: 8, marginTop: 9, flexWrap: 'wrap', rowGap: 8 }}
              >
                <Tag
                  label={task.priority}
                  tone={PRIORITY_TONE[task.priority]}
                  size="sm"
                />
                <Tag
                  label={task.category}
                  tone={CATEGORY_TONE[task.category]}
                  size="sm"
                />
                {due ? (
                  <Tag
                    label={due.text}
                    tone={due.overdue ? 'annotation' : 'neutral'}
                    size="sm"
                    icon={
                      <Icon
                        name="clock"
                        size={11}
                        color={due.overdue ? colors.annotation : colors.textMuted}
                        strokeWidth={2.4}
                      />
                    }
                  />
                ) : null}
                {hasChecklist ? (
                  <Tag
                    label={`${doneCount}/${checklist.length}`}
                    tone={doneCount === checklist.length ? 'success' : 'neutral'}
                    size="sm"
                    icon={
                      <Icon
                        name="check-square"
                        size={11}
                        color={
                          doneCount === checklist.length
                            ? '#2c9d5f'
                            : colors.textMuted
                        }
                        strokeWidth={2.2}
                      />
                    }
                  />
                ) : null}
              </View>
            </View>

            {(hasChecklist || task.notes) && !task.done ? (
              <MotiView
                animate={{ rotate: expanded ? '180deg' : '0deg' }}
                transition={{ type: 'timing', duration: 220 }}
                style={{ marginTop: 6 }}
              >
                <Icon
                  name="chevron-down"
                  size={18}
                  color="textSubtle"
                  strokeWidth={2.4}
                />
              </MotiView>
            ) : null}
          </View>
        </Pressable>
      </View>

      {/* Expandable detail: notes + checklist sub-steps. */}
      <AnimatePresence>
        {expanded && !task.done ? (
          <MotiView
            from={{ opacity: 0, translateY: -6 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -6 }}
            transition={{ type: 'timing', duration: 220 }}
            style={{ marginTop: 14, paddingLeft: 2 }}
          >
            <View
              style={{
                height: 1,
                backgroundColor: colors.hairline,
                marginBottom: 14,
              }}
            />
            {task.notes ? (
              <View className="flex-row" style={{ gap: 8, marginBottom: 14 }}>
                <Icon name="info" size={15} color="textSubtle" strokeWidth={2.2} />
                <AppText
                  variant="caption"
                  color={colors.textMuted}
                  style={{ flex: 1, lineHeight: 19 }}
                >
                  {task.notes}
                </AppText>
              </View>
            ) : null}

            {checklist.map((item) => (
              <View
                key={item.id}
                className="flex-row items-center"
                style={{ gap: 11, marginBottom: 10 }}
              >
                <Checkbox
                  checked={item.done}
                  size={22}
                  onChange={() => onToggleChecklistItem(task.id, item.id)}
                />
                <AppText
                  variant="caption"
                  weight="medium"
                  color={item.done ? colors.textSubtle : colors.carbon}
                  style={{
                    flex: 1,
                    fontSize: 14,
                    ...(item.done
                      ? { textDecorationLine: 'line-through' }
                      : null),
                  }}
                >
                  {item.label}
                </AppText>
              </View>
            ))}
          </MotiView>
        ) : null}
      </AnimatePresence>
    </SoftCard>
  );
}

export default TaskCard;
