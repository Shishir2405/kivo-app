import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Neumorph } from '@/components/ui/Neumorph';
import { Icon, type IconName } from '@/components/ui';
import { AppText } from '@/components/ui/Typography';
import { useTheme } from '@/theme';
import { type ColorToken } from '@/theme/tokens';

export type FeatureItem = {
  icon: IconName;
  label: string;
  /** Color token for the icon chip glyph (defaults to carbon). */
  tone?: ColorToken;
};

export type FeatureRowProps = {
  items: FeatureItem[];
  style?: StyleProp<ViewStyle>;
};

/**
 * A vertical list of value-prop rows for the welcome hero.
 *
 * Each row pairs a raised neumorphic icon tile (vector Icon, never emoji) with a
 * single line of copy — strong, scannable hierarchy under the headline.
 */
export function FeatureRow({ items, style }: FeatureRowProps) {
  const { colors } = useTheme();
  return (
    <View style={[{ gap: 14 }, style]}>
      {items.map((item) => (
        <View key={item.label} className="flex-row items-center" style={{ gap: 14 }}>
          <Neumorph variant="raised" radius={14} intensity="sm">
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={item.icon} size={20} color={item.tone ?? 'carbon'} strokeWidth={2.2} />
            </View>
          </Neumorph>
          <AppText
            variant="body"
            weight="medium"
            color={colors.carbon}
            style={{ flexShrink: 1 }}
          >
            {item.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

export default FeatureRow;
