import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Neumorph } from '@/components/ui/Neumorph';
import { AppText } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors, type ColorToken } from '@/theme/tokens';

export type SectionHeadingProps = {
  /** Leading icon glyph in an inset chip (rendered via the Icon system). */
  icon: IconName;
  /** Small uppercase eyebrow above the title. */
  eyebrow?: string;
  /** Section title. */
  title: string;
  /** Optional trailing node (e.g. a counter or an add button). */
  trailing?: React.ReactNode;
  /** Tint for the leading icon. */
  iconColor?: ColorToken | (string & {});
  style?: StyleProp<ViewStyle>;
};

/**
 * A consistent DSA section header: an inset icon chip, an optional uppercase
 * eyebrow, a display title, and an optional trailing slot. Replaces the
 * per-screen emoji+title labels with the shared Icon language.
 */
export function SectionHeading({
  icon,
  eyebrow,
  title,
  trailing,
  iconColor = 'carbon',
  style,
}: SectionHeadingProps) {
  return (
    <View
      className="flex-row items-center"
      style={[{ gap: 12, marginBottom: 14 }, style]}
    >
      <Neumorph variant="inset" radius={13} intensity="sm">
        <View style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={19} color={iconColor} strokeWidth={2.2} />
        </View>
      </Neumorph>

      <View style={{ flex: 1 }}>
        {eyebrow ? (
          <AppText
            variant="caption"
            weight="semibold"
            color={colors.textSubtle}
            style={{ textTransform: 'uppercase', letterSpacing: 1.6, fontSize: 10.5 }}
          >
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="subheading" weight="bold" display style={{ marginTop: eyebrow ? 1 : 0 }}>
          {title}
        </AppText>
      </View>

      {trailing ? <View>{trailing}</View> : null}
    </View>
  );
}

export default SectionHeading;
