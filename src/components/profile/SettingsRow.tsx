import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Neumorph } from '@/components/ui/Neumorph';
import { Icon, type IconName } from '@/components/ui/Icon';
import { AppText } from '@/components/ui/Typography';
import { colors, type ColorToken } from '@/theme/tokens';

export type SettingsRowProps = {
  /** Vector icon shown in the lead chip (no emoji). */
  icon: IconName;
  title: string;
  /** Right-aligned value text shown before the chevron (e.g. "Light"). */
  value?: string;
  /** Optional accent for the lead icon chip surface. */
  tint?: ColorToken | (string & {});
  onPress?: () => void;
  /** Drop the bottom hairline (last row in a group). */
  last?: boolean;
  /** Tint the title + icon (e.g. annotation-red for "Log out"). */
  danger?: boolean;
};

/**
 * A tappable settings line: a neumorphic icon chip + title on the left, an
 * optional value pill + a chevron on the right. The whole row depresses into an
 * inset well on press for tactile soft-UI feedback.
 */
export function SettingsRow({
  icon,
  title,
  value,
  tint,
  onPress,
  last,
  danger,
}: SettingsRowProps) {
  const [pressed, setPressed] = useState(false);
  const ink = danger ? colors.annotation : colors.carbon;
  const chipBg = danger ? '#fde4e4' : tint ?? '#ececec';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.hairline,
      }}
    >
      <View
        className="flex-row items-center"
        style={{
          paddingVertical: 11,
          gap: 14,
          opacity: pressed ? 0.55 : 1,
        }}
      >
        <Neumorph variant={pressed ? 'inset' : 'raised'} radius={13} intensity="sm">
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 13,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: chipBg,
            }}
          >
            <Icon
              name={icon}
              size={19}
              color={danger ? 'annotation' : 'carbon'}
              strokeWidth={2.1}
            />
          </View>
        </Neumorph>

        <AppText variant="body" weight="medium" color={ink} style={{ flex: 1 }}>
          {title}
        </AppText>

        {value ? (
          <AppText variant="caption" weight="medium" color={colors.textMuted}>
            {value}
          </AppText>
        ) : null}

        <Icon
          name="chevron-right"
          size={18}
          color={danger ? 'annotation' : 'textSubtle'}
          strokeWidth={2.2}
        />
      </View>
    </Pressable>
  );
}

export default SettingsRow;
