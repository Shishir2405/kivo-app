import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { Neumorph } from '@/components/ui/Neumorph';
import { colors } from '@/theme/tokens';

export type SocialButtonProps = {
  /** A brand SVG component from '@/constants/brandAssets'. */
  Svg: React.ComponentType<SvgProps>;
  /** Glyph tint passed to the brand SVG. */
  tint: string;
  accessibilityLabel: string;
  onPress?: () => void;
};

/**
 * A round community/social button: a raised neumorphic ring around a carbon
 * coin that holds a brand SVG. Depresses into an inset well on press. Local
 * SVG assets only — never hotlinked.
 */
export function SocialButton({ Svg, tint, accessibilityLabel, onPress }: SocialButtonProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Neumorph variant={pressed ? 'inset' : 'raised'} radius={999} intensity="sm">
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.carbon,
            opacity: pressed ? 0.85 : 1,
          }}
        >
          <Svg width={22} height={22} fill={colors.paper} color={tint} />
        </View>
      </Neumorph>
    </Pressable>
  );
}

export default SocialButton;
