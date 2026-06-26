import React from 'react';
import {
  View,
  Image,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Icon } from '@/components/ui';
import { AppText } from '@/components/ui/Typography';
import { colors, fonts } from '@/theme/tokens';
import { avatarStackList } from '@/constants/brandAssets';

export type AvatarStackProps = {
  /** Headline number / label, e.g. "12,400+ learners". */
  title?: string;
  /** Sub caption under the title, e.g. "shipping streaks with Kivo". */
  caption?: string;
  /** Avatar diameter in px. */
  size?: number;
  /** Avatar images (defaults to the curated brand stack). */
  avatars?: readonly ImageSourcePropType[];
  /** Show a small yellow "+N" tile after the avatars. */
  overflow?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Overlapping avatar social-proof row built from the brand avatar assets.
 *
 * Avatars overlap with a canvas-colored ring so they read as a stacked group;
 * an optional yellow "+N" tile caps the row, then a two-line title/caption.
 * Local assets only — never hotlinked.
 */
export function AvatarStack({
  title = '12,400+ learners',
  caption = 'shipping streaks with Kivo',
  size = 38,
  avatars = avatarStackList as readonly ImageSourcePropType[],
  overflow,
  style,
}: AvatarStackProps) {
  const ring = 2.5;

  return (
    <View className="flex-row items-center" style={[{ gap: 14 }, style]}>
      <View className="flex-row items-center">
        {avatars.map((src, i) => (
          <Image
            key={i}
            source={src}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: i === 0 ? 0 : -size * 0.32,
              borderWidth: ring,
              borderColor: colors.canvas,
              backgroundColor: colors.hairline,
            }}
          />
        ))}

        {overflow ? (
          <View
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -size * 0.32,
              borderWidth: ring,
              borderColor: colors.canvas,
              backgroundColor: colors.highlighter,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText
              variant="caption"
              weight="bold"
              color={colors.carbon}
              style={{ fontSize: 12, lineHeight: 14 }}
            >
              {`+${overflow}`}
            </AppText>
          </View>
        ) : null}
      </View>

      <View style={{ flex: 1 }}>
        <View className="flex-row items-center" style={{ gap: 6 }}>
          <AppText variant="caption" weight="semibold" color={colors.carbon}>
            {title}
          </AppText>
          <Icon name="badge-check" size={15} color="signal" />
        </View>
        {caption ? (
          <AppText
            variant="caption"
            color={colors.textMuted}
            style={{ fontFamily: fonts.body }}
          >
            {caption}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

export default AvatarStack;
