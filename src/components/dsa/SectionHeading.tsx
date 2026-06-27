import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors, type ColorToken } from '@/theme/tokens';

export type SectionHeadingProps = {
  /** Leading icon glyph (small, thin, monochrome). */
  icon: IconName;
  /** Small uppercase eyebrow above the title. */
  eyebrow?: string;
  /** Section title (editorial serif). */
  title: string;
  /** Optional trailing node (e.g. a counter or a text link). */
  trailing?: React.ReactNode;
  /** Tint for the leading icon (defaults to graphite). */
  iconColor?: ColorToken | (string & {});
  style?: StyleProp<ViewStyle>;
};

/**
 * A flat Steep section header: a small thin icon, an optional uppercase
 * eyebrow, a small serif title, and an optional trailing slot. No neumorphic
 * chip — chrome is quiet, the title does the talking.
 */
export function SectionHeading({
  icon,
  eyebrow,
  title,
  trailing,
  iconColor = 'graphite',
  style,
}: SectionHeadingProps) {
  return (
    <View
      className="flex-row items-center"
      style={[{ gap: 8, marginBottom: 12 }, style]}
    >
      <Icon name={icon} size={16} color={iconColor} />

      <View style={{ flex: 1 }}>
        {eyebrow ? (
          <AppText
            variant="caption"
            weight="medium"
            color={colors.graphite}
            style={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 10.5 }}
          >
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="headingSm" display style={{ marginTop: eyebrow ? 1 : 0 }}>
          {title}
        </AppText>
      </View>

      {trailing ? <View>{trailing}</View> : null}
    </View>
  );
}

export default SectionHeading;
