import React from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';
import { Neumorph } from './Neumorph';
import { radii, type NeumorphIntensity } from '@/theme/tokens';

export type SoftCardProps = {
  children?: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  intensity?: NeumorphIntensity;
  variant?: 'raised' | 'inset' | 'flat';
  padding?: number;
  surface?: string;
};

/**
 * A raised neumorphic surface for grouping content. The default card radius
 * follows the Aaply spec (30–40). Use `variant="inset"` for wells/empty states.
 */
export function SoftCard({
  children,
  className,
  style,
  radius = radii.card,
  intensity = 'md',
  variant = 'raised',
  padding = 20,
  surface,
}: SoftCardProps) {
  return (
    <Neumorph
      variant={variant}
      radius={radius}
      intensity={intensity}
      padding={padding}
      surface={surface}
      style={style}
    >
      <View className={className}>{children}</View>
    </Neumorph>
  );
}

export default SoftCard;
