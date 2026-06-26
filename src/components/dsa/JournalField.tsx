import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { SoftCard } from '@/components/ui/SoftCard';
import { SoftInput } from '@/components/ui/SoftInput';
import { AppText } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors } from '@/theme/tokens';

export type JournalFieldProps = {
  /** Leading icon glyph for the field label (rendered via the Icon system). */
  icon: IconName;
  /** Field title, e.g. "Approach". */
  title: string;
  /** Body content. When empty, a muted placeholder is shown / typed into. */
  body?: string;
  /** Placeholder shown when there is no body yet. */
  placeholder?: string;
  /** Left rail accent color for the journal entry. */
  accent?: string;
  /**
   * When set, the entry becomes an editable neumorphic SoftInput (multiline)
   * driven by this change handler — the coding-journal capture mode.
   */
  onChangeBody?: (next: string) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * One coding-journal entry: an icon + title label and an inset well holding the
 * note body. A colored left rail ties it to the field's theme. Used for
 * approach / mistakes / optimal solution / edge cases on the problem screen.
 *
 * Read-only by default; pass `onChangeBody` to make it an editable SoftInput.
 */
export function JournalField({
  icon,
  title,
  body,
  placeholder = 'Nothing captured yet.',
  accent = colors.highlighter,
  onChangeBody,
  style,
}: JournalFieldProps) {
  const hasBody = !!body && body.trim().length > 0;
  const editable = !!onChangeBody;

  return (
    <View style={style}>
      <View className="flex-row items-center" style={{ gap: 9, marginBottom: 10 }}>
        <View
          style={{
            width: 6,
            height: 20,
            borderRadius: 3,
            backgroundColor: accent,
          }}
        />
        <Icon name={icon} size={18} color={accent} strokeWidth={2.4} />
        <AppText variant="subheading" weight="bold" display style={{ fontSize: 17 }}>
          {title}
        </AppText>
      </View>

      {editable ? (
        <SoftInput
          value={body ?? ''}
          onChangeText={onChangeBody}
          placeholder={placeholder}
          multiline
          textAlignVertical="top"
          style={{ lineHeight: 23, minHeight: 84 }}
        />
      ) : (
        <SoftCard variant="inset" radius={20} padding={16}>
          <AppText
            variant="body"
            color={hasBody ? colors.carbon : colors.textSubtle}
            style={{ lineHeight: 24, fontStyle: hasBody ? 'normal' : 'italic' }}
          >
            {hasBody ? body : placeholder}
          </AppText>
        </SoftCard>
      )}
    </View>
  );
}

export default JournalField;
