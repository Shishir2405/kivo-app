import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { SoftCard, WarmCard, CoolCard } from '@/components/ui/SoftCard';
import { AppText } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors, radii, type ColorToken } from '@/theme/tokens';

export type InfoTileProps = {
  /** Leading icon glyph (small, thin — never an emoji). */
  icon: IconName;
  /** Tint for the leading icon (defaults to graphite). */
  iconColor?: ColorToken | (string & {});
  /** Big value (e.g. "4h 0m" or "55%"). */
  value: string;
  /** Small caption under the value. */
  label: string;
  /** Optional accent for the value text (defaults to Ink). */
  valueColor?: string;
  /** Optional data-wash surface for one highlighted figure. */
  surface?: 'warm' | 'cool';
  style?: StyleProp<ViewStyle>;
};

/**
 * A compact flat Steep stat tile: a small thin icon, a value, and a muted
 * caption. Defaults to a flat white card (Dove hairline + the one shadow);
 * pass `surface="warm"|"cool"` to put a single figure on the apricot / sky wash.
 */
export function InfoTile({
  icon,
  iconColor = 'graphite',
  value,
  label,
  valueColor = colors.ink,
  surface,
  style,
}: InfoTileProps) {
  const body = (
    <View style={{ gap: 6 }}>
      <Icon name={icon} size={16} color={iconColor} />
      <AppText variant="headingSm" weight="medium" color={valueColor} style={{ marginTop: 2 }}>
        {value}
      </AppText>
      <AppText
        variant="caption"
        weight="regular"
        color={colors.graphite}
        style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.6 }}
      >
        {label}
      </AppText>
    </View>
  );

  if (surface === 'warm') {
    return (
      <WarmCard radius={radii.card} padding={14} style={style}>
        {body}
      </WarmCard>
    );
  }
  if (surface === 'cool') {
    return (
      <CoolCard radius={radii.card} padding={14} style={style}>
        {body}
      </CoolCard>
    );
  }
  return (
    <SoftCard radius={radii.card} padding={14} style={style}>
      {body}
    </SoftCard>
  );
}

export default InfoTile;
