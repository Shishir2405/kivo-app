import React from 'react';
import { View } from 'react-native';
import { Neumorph } from '@/components/ui/Neumorph';
import { Icon, type IconName } from '@/components/ui/Icon';
import { AppText } from '@/components/ui/Typography';
import { SoftToggle } from '@/components/ui/SoftToggle';
import { colors, type ColorToken } from '@/theme/tokens';

export type PrefRowProps = {
  /** Vector icon shown in the lead chip (no emoji). */
  icon: IconName;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  /** Tint of the lead icon chip when the pref is ON. */
  tint?: ColorToken | (string & {});
  /** Drop the bottom hairline (last row in a group). */
  last?: boolean;
};

/**
 * A single notification-preference line: a neumorphic icon chip + title/subtitle
 * on the left, a custom SoftToggle on the right, split by a hairline divider.
 * The chip lights to its accent tint while the toggle is on.
 */
export function PrefRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  tint = colors.highlighter,
  last,
}: PrefRowProps) {
  return (
    <View
      className="flex-row items-center"
      style={{
        paddingVertical: 14,
        gap: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.hairline,
      }}
    >
      <Neumorph variant={value ? 'raised' : 'inset'} radius={13} intensity="sm">
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 13,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: value ? tint : '#ececec',
          }}
        >
          <Icon
            name={icon}
            size={19}
            color={value ? 'carbon' : 'textMuted'}
            strokeWidth={2.1}
          />
        </View>
      </Neumorph>

      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="body" weight="semibold">
          {title}
        </AppText>
        <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 12, lineHeight: 16 }}>
          {subtitle}
        </AppText>
      </View>

      <SoftToggle value={value} onValueChange={onValueChange} />
    </View>
  );
}

export default PrefRow;
