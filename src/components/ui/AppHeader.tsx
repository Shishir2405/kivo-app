import React from 'react';
import { View, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import KivoMark from '../../../assets/brand/kivo-mark.svg';
import { MARK_ASPECT } from '@/components/brand/BrandLogo';
import { Neumorph } from './Neumorph';
import { Icon } from './Icon';
import { AppText } from './Typography';
import { colors } from '@/theme/tokens';

/**
 * GrayMark — the small, quiet Kivo brand watermark.
 *
 * The redesigned mark bakes its highlighter-yellow fill into the SVG, so we
 * can't recolor individual paths from props. To read as a MUTED / gray brand
 * watermark (per the "a little bit gray logo at the top near the time" request)
 * we render it at a low opacity over the canvas — it whispers the brand without
 * competing with the screen's content or its full-color lockup elsewhere.
 */
export function GrayMark({
  size = 24,
  opacity = 0.5,
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
  /** Optional centered/inline title (Poppins, via AppText). */
  title?: string;
  /** Optional trailing action slot (e.g. a SoftIconButton). */
  right?: React.ReactNode;
  /** When provided, renders a neumorphic back button that calls this. */
  onBack?: () => void;
  /** Mark height in px (~22–26 reads as a subtle watermark). */
  markSize?: number;
  /** Override the muted opacity of the gray mark. */
  markOpacity?: number;
  /** Add the safe-area top inset as padding so it sits under the status bar. */
  withInset?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * AppHeader — a thin, consistent top bar that respects the status-bar safe area
 * and carries a SMALL, muted/gray Kivo mark up near the system clock.
 *
 * Layout: [ back? + gray mark + title? ] ............................ [ right? ]
 *
 * It is intentionally subtle and non-intrusive. Screens that already own a rich
 * title block can drop in <GrayMark /> directly instead of this whole bar; this
 * component is for the common "back / title / action" pattern.
 */
export function AppHeader({
  title,
  right,
  onBack,
  markSize = 24,
  markOpacity = 0.5,
  withInset = true,
  style,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        {
          paddingTop: withInset ? insets.top + 6 : 6,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 44,
        },
        style,
      ]}
    >
      {/* Leading cluster: optional back, the gray mark, optional title. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <Neumorph variant="raised" radius={22} intensity="sm" surface={colors.canvas}>
              <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="chevron-left" size={22} color="carbon" />
              </View>
            </Neumorph>
          </Pressable>
        ) : null}

        <GrayMark size={markSize} opacity={markOpacity} />

        {title ? (
          <AppText variant="body" weight="bold" numberOfLines={1} style={{ fontSize: 16, flexShrink: 1 }}>
            {title}
          </AppText>
        ) : null}
      </View>

      {right ? <View style={{ marginLeft: 12 }}>{right}</View> : null}
    </View>
  );
}

export default AppHeader;
