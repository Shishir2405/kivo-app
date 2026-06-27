import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { SoftCard } from '@/components/ui/SoftCard';
import { SoftInput } from '@/components/ui/SoftInput';
import { AppText } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors } from '@/theme/tokens';

export type JournalFieldProps = {
  /** Leading icon glyph for the field label (small, thin). */
  icon: IconName;
  /** Field title, e.g. "Approach". */
  title: string;
  /** Body content. When empty, a muted placeholder is shown / typed into. */
  body?: string;
  /** Placeholder shown when there is no body yet. */
  placeholder?: string;
  /** Thin left-rail accent color (defaults to Rust — the key data stroke). */
  accent?: string;
  /**
   * When set, the entry becomes an editable Steep input (multiline) driven by
   * this change handler — the coding-journal capture mode.
   */
  onChangeBody?: (next: string) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * One coding-journal entry: a small icon + title label and either a flat Fog
 * well (read-only) or a Steep multiline input (editable). A thin Rust left rail
 * ties it to the journal. No neumorphism, small type.
 */
export function JournalField({
  icon,
  title,
  body,
  placeholder = 'Nothing captured yet.',
  accent = colors.rust,
  onChangeBody,
  style,
}: JournalFieldProps) {
  const hasBody = !!body && body.trim().length > 0;
  const editable = !!onChangeBody;

  return (
    <View style={style}>
      <View className="flex-row items-center" style={{ gap: 8, marginBottom: 8 }}>
        <View
          style={{
            width: 3,
            height: 16,
            borderRadius: 2,
            backgroundColor: accent,
          }}
        />
        <Icon name={icon} size={15} color="graphite" />
        <AppText variant="subheading" weight="medium" display style={{ fontSize: 15 }}>
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
          style={{ lineHeight: 20, minHeight: 76 }}
        />
      ) : (
        <SoftCard variant="inset" radius={13} padding={14}>
          <AppText
            variant="body"
            color={hasBody ? colors.ash : colors.dove}
            style={{ lineHeight: 20, fontStyle: hasBody ? 'normal' : 'italic' }}
          >
            {hasBody ? body : placeholder}
          </AppText>
        </SoftCard>
      )}
    </View>
  );
}

export default JournalField;
