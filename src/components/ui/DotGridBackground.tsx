import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '@/theme/tokens';

export type DotGridBackgroundProps = {
  children?: React.ReactNode;
  /** Canvas fill. Steep default is pure white. */
  background?: string;
  /** @deprecated Steep has no dot grid; ignored. */
  dotColor?: string;
  /** @deprecated ignored. */
  spacing?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Steep canvas — a plain flat surface. The old "working-surface" dot-grid
 * texture is gone (Steep lets data + typography do the talking). Kept as a
 * no-op wrapper so existing screens keep working; renders a clean white canvas.
 */
export function DotGridBackground({
  children,
  background = colors.white,
  style,
}: DotGridBackgroundProps) {
  return <View style={[{ flex: 1, backgroundColor: background }, style]}>{children}</View>;
}

export default DotGridBackground;
