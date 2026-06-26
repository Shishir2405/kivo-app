import React from 'react';
import { View } from 'react-native';
import { Neumorph } from '@/components/ui/Neumorph';
import { AppText } from '@/components/ui/Typography';
import { colors } from '@/theme/tokens';

export type StatTileProps = {
  value: string;
  label: string;
};

/**
 * A small inset stat well used in the profile header strip (solved / goal /
 * joined). Big Poppins value over a muted lowercase label, recessed into the
 * card surface so the trio reads as one carved control.
 */
export function StatTile({ value, label }: StatTileProps) {
  return (
    <Neumorph variant="inset" radius={16} intensity="sm" padding={12} style={{ flex: 1 }}>
      <View className="items-center">
        <AppText variant="subheading" weight="bold" display numberOfLines={1}>
          {value}
        </AppText>
        <AppText
          variant="caption"
          color={colors.textMuted}
          style={{ fontSize: 11, marginTop: 1 }}
        >
          {label}
        </AppText>
      </View>
    </Neumorph>
  );
}

export default StatTile;
