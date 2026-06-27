import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from '@/components/ui/Typography';
import { fonts, radii } from '@/theme/tokens';

export type ApproachCardProps = {
  /** One-line / multi-line approach summary captured for the problem. */
  approach: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * The dark "// approach" code card from the DSA problem-detail design — a warm
 * carbon surface with a muted mono comment label and the approach lines in a
 * soft code-cream. This is a code-display affordance, so the surface stays dark
 * in both light and dark themes (matching the HTML), with warm mono ink on top.
 */
export function ApproachCard({ approach, style }: ApproachCardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: '#211C17',
          borderRadius: radii.card,
          padding: 14,
        },
        style,
      ]}
    >
      <AppText
        color="#A89F92"
        style={{ fontFamily: fonts.mono, fontSize: 10.5, marginBottom: 8 }}
      >
        // approach
      </AppText>
      <AppText
        color="#E0D6C8"
        style={{ fontFamily: fonts.mono, fontSize: 11.5, lineHeight: 19 }}
      >
        {approach}
      </AppText>
    </View>
  );
}

export default ApproachCard;
