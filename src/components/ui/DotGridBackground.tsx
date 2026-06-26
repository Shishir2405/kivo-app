import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Pattern, Circle, Rect } from 'react-native-svg';
import { colors, dotGrid } from '@/theme/tokens';

export type DotGridBackgroundProps = {
  children?: React.ReactNode;
  /** Canvas fill behind the dots. */
  background?: string;
  dotColor?: string;
  spacing?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * The Aaply "working surface" texture — a hairline dot grid (~20px spacing) on
 * the graphite-mist canvas. Rendered as a tiled SVG pattern so it fills any size.
 */
export function DotGridBackground({
  children,
  background = colors.canvas,
  dotColor = dotGrid.color,
  spacing = dotGrid.spacing,
  style,
}: DotGridBackgroundProps) {
  return (
    <View style={[{ flex: 1, backgroundColor: background }, style]}>
      <Svg
        style={{ position: 'absolute', width: '100%', height: '100%' }}
        pointerEvents="none"
      >
        <Defs>
          <Pattern
            id="dotgrid"
            x="0"
            y="0"
            width={spacing}
            height={spacing}
            patternUnits="userSpaceOnUse"
          >
            <Circle
              cx={spacing / 2}
              cy={spacing / 2}
              r={dotGrid.dotSize}
              fill={dotColor}
            />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#dotgrid)" />
      </Svg>
      {children}
    </View>
  );
}

export default DotGridBackground;
