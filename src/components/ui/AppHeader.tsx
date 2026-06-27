import React from 'react';
import { View, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import KivoMark from '../../../assets/brand/kivo-mark.svg';
import { MARK_ASPECT } from '@/components/brand/BrandLogo';
import { Icon } from './Icon';
import { AppText } from './Typography';

/**
 * GrayMark — the small, quiet Kivo brand watermark near the status bar.
 *
 * Rendered at a low opacity so it whispers the brand without competing with
 * content. The only brand asset Steep keeps.
 */
export function GrayMark({
  size = 20,
  opacity = 0.45,
  style,
}: {
  size?: number;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[{ opacity }, style]}
    >
      <KivoMark width={size * MARK_ASPECT} height={size} />
    </View>
  );
}

export type AppHeaderProps = {
  /** Optional title. Renders as a small editorial serif heading. */
  title?: string;
  /** Optional trailing action slot (prefer a TextLink). */
  right?: React.ReactNode;
  /** When provided, renders a flat back affordance that calls this. */
  onBack?: () => void;
  /** Mark height in px. */
  markSize?: number;
  /** Override the muted opacity of the gray mark. */
  markOpacity?: number;
  /** Hide the gray brand mark entirely (default shows it). */
  hideMark?: boolean;
  /** Add the safe-area top inset as padding so it sits under the status bar. */
  withInset?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * AppHeader — a thin, refined Steep top bar. Respects the status-bar safe area.
 *
 * Layout: [ back? + gray mark? + title? ] ......................... [ right? ]
 *
 * Small and quiet. Back is a flat chevron (no neumorphic button). The title is
 * an editorial serif headingSm. Screens with a rich title block can drop in
 * <GrayMark /> directly instead.
 */
export function AppHeader({
  title,
  right,
  onBack,
  markSize = 20,
  markOpacity = 0.45,
  hideMark = false,
  withInset = true,
  style,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        {
          paddingTop: withInset ? insets.top + 4 : 4,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 40,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={10}
            style={{ marginLeft: -4 }}
          >
            <Icon name="chevron-left" size={22} color="ink" />
          </Pressable>
        ) : null}

        {!hideMark ? <GrayMark size={markSize} opacity={markOpacity} /> : null}

        {title ? (
          <AppText variant="headingSm" display numberOfLines={1} style={{ flexShrink: 1 }}>
            {title}
          </AppText>
        ) : null}
      </View>

      {right ? <View style={{ marginLeft: 12 }}>{right}</View> : null}
    </View>
  );
}

export default AppHeader;
