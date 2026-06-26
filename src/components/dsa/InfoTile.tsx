import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Neumorph } from '@/components/ui/Neumorph';
import { AppText } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors, type ColorToken } from '@/theme/tokens';

export type InfoTileProps = {
  /** Leading icon glyph (rendered via the Icon system — never an emoji). */
  icon: IconName;
  /** Tint for the leading icon. */
  iconColor?: ColorToken | (string & {});
  /** Big value (e.g. "4h 0m" or "55%"). */
  value: string;
  /** Small caption under the value. */
  label: string;
  /** Optional accent for the value text. */
  valueColor?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * A compact neumorphic stat tile used in the topic-detail stat grid:
 * an inset icon chip, a large value, and a muted caption.
 */
export function InfoTile({
  icon,
  iconColor = 'carbon',
  value,
  label,
  valueColor = colors.carbon,
  style,
}: InfoTileProps) {
  return (
    <Neumorph variant="raised" radius={20} intensity="sm" padding={14} style={style}>
      <View style={{ gap: 8 }}>
        <Neumorph variant="inset" radius={12} intensity="sm">
          <View style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size={18} color={iconColor} strokeWidth={2.2} />
          </View>
        </Neumorph>
        <AppText variant="subheading" weight="bold" display color={valueColor} style={{ fontSize: 19 }}>
          {value}
        </AppText>
        <AppText
          variant="caption"
          weight="medium"
          color={colors.textSubtle}
          style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}
        >
          {label}
        </AppText>
      </View>
    </Neumorph>
  );
}

export default InfoTile;
