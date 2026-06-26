import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { SoftIconButton } from '@/components/ui/SoftIconButton';
import { AppText } from '@/components/ui/Typography';
import { colors } from '@/theme/tokens';

function BackChevron({ color = colors.carbon, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 6l-6 6 6 6"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export type ScreenHeaderProps = {
  /** Small eyebrow label above the title (e.g. "Topic"). */
  eyebrow?: string;
  /** Main header title. */
  title?: string;
  /** Optional trailing element (e.g. a bookmark icon button). */
  trailing?: React.ReactNode;
  /** Override the back action (defaults to router.back()). */
  onBack?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * A detail-screen header: a round neumorphic back button (carbon chevron) on the
 * left, an optional eyebrow + title block, and an optional trailing slot.
 */
export function ScreenHeader({
  eyebrow,
  title,
  trailing,
  onBack,
  style,
}: ScreenHeaderProps) {
  const router = useRouter();
  const handleBack = onBack ?? (() => router.back());

  return (
    <View
      className="flex-row items-center"
      style={[{ gap: 14 }, style]}
    >
      <SoftIconButton size={46} onPress={handleBack} accessibilityLabel="Go back">
        <BackChevron />
      </SoftIconButton>

      {(eyebrow || title) && (
        <View style={{ flex: 1 }}>
          {eyebrow ? (
            <AppText
              variant="caption"
              weight="semibold"
              color={colors.textSubtle}
              style={{ fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase' }}
            >
              {eyebrow}
            </AppText>
          ) : null}
          {title ? (
            <AppText variant="subheading" weight="bold" display numberOfLines={1}>
              {title}
            </AppText>
          ) : null}
        </View>
      )}

      {trailing ? <View>{trailing}</View> : null}
    </View>
  );
}

export default ScreenHeader;
