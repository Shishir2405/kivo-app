import React from 'react';
import { View } from 'react-native';
import { Neumorph } from '@/components/ui/Neumorph';
import { Icon, type IconName } from '@/components/ui/Icon';
import { AppText } from '@/components/ui/Typography';
import { colors, type ColorToken } from '@/theme/tokens';

export type SectionHeaderProps = {
  icon: IconName;
  title: string;
  subtitle?: string;
  /** Optional right-aligned slot (e.g. a SegmentedTabs range or a Tag). */
  right?: React.ReactNode;
  /** Tint of the lead icon chip. */
  tint?: ColorToken | (string & {});
};

/**
 * Reusable card header: a raised neumorphic icon chip + a Poppins title (and
 * optional caption), with an optional right-aligned control slot. Keeps every
 * section in the profile visually consistent with no emoji anywhere.
 */
export function SectionHeader({
  icon,
  title,
  subtitle,
  right,
  tint = colors.highlighter,
}: SectionHeaderProps) {
  return (
    <View className="flex-row items-center" style={{ gap: 12 }}>
      <Neumorph variant="raised" radius={13} intensity="sm">
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 13,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: tint,
          }}
        >
          <Icon name={icon} size={19} color="carbon" strokeWidth={2.2} />
        </View>
      </Neumorph>

      <View style={{ flex: 1 }}>
        <AppText variant="subheading" weight="bold" display numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText
            variant="caption"
            color={colors.textMuted}
            style={{ fontSize: 12, marginTop: 1 }}
            numberOfLines={1}
          >
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {right ?? null}
    </View>
  );
}

export default SectionHeader;
