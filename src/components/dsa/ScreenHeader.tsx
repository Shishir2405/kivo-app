import React from 'react';
import { View, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@/theme/tokens';

export type ScreenHeaderProps = {
  /** Small uppercase eyebrow label above the title (e.g. "Topic"). */
  eyebrow?: string;
  /** Main header title (editorial serif). */
  title?: string;
  /** Optional trailing element (e.g. a bookmark text link). */
  trailing?: React.ReactNode;
  /** Override the back action (defaults to router.back()). */
  onBack?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * A flat Steep detail-screen header: a thin back chevron on the left, an
 * optional eyebrow + serif title block, and an optional trailing slot. No
 * neumorphic button — small, quiet, premium.
 */
export function ScreenHeader({
  eyebrow,
  title,
  trailing,
  onBack,
  style,
}: ScreenHeaderProps) {
  const router = useRouter();
  const handleBack =
    onBack ??
    (() => {
      if (router.canGoBack()) router.back();
    });

  return (
    <View className="flex-row items-center" style={[{ gap: 10 }, style]}>
      <Pressable
        onPress={handleBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={10}
        style={{ marginLeft: -4 }}
      >
        <Icon name="chevron-left" size={22} color="ink" />
      </Pressable>

      {(eyebrow || title) && (
        <View style={{ flex: 1 }}>
          {eyebrow ? (
            <AppText
              variant="caption"
              weight="medium"
              color={colors.graphite}
              style={{ fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase' }}
            >
              {eyebrow}
            </AppText>
          ) : null}
          {title ? (
            <AppText variant="headingSm" display numberOfLines={1} style={{ marginTop: eyebrow ? 1 : 0 }}>
              {title}
            </AppText>
          ) : null}
        </View>
      )}

      {trailing ? <View style={{ marginLeft: 8 }}>{trailing}</View> : null}
    </View>
  );
}

export default ScreenHeader;
