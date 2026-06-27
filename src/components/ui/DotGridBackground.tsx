import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

export type DotGridBackgroundProps = {
  children?: React.ReactNode;
  /** Canvas fill. Defaults to the ACTIVE theme canvas (cream / warm dark). */
  background?: string;
  /** @deprecated Kivo has no dot grid; ignored. */
  dotColor?: string;
  /** @deprecated ignored. */
  spacing?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Kivo canvas — a plain warm surface. The old "working-surface" dot-grid
 * texture is gone (Kivo lets data + typography do the talking). Kept as a
 * thin wrapper so existing screens keep working; fills the ACTIVE theme canvas
 * (cream in light, warm dark in dark) unless `background` overrides it.
 */
export function DotGridBackground({
  children,
  background,
  style,
}: DotGridBackgroundProps) {
  const { colors } = useTheme();
  return (
    <View style={[{ flex: 1, backgroundColor: background ?? colors.canvas }, style]}>
      {children}
    </View>
  );
}

export default DotGridBackground;
