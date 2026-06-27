import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { SoftCard } from '@/components/ui/SoftCard';
import { AppText } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { radii, type CardTone, type ColorToken } from '@/theme/tokens';
import { useTheme } from '@/theme';

/** Tones InfoTile renders on. Full wash set + legacy warm/cool aliases. */
export type InfoTileSurface = CardTone | 'warm' | 'cool';

/** Normalise the surface prop (incl. legacy warm/cool) to a wash CardTone. */
function resolveSurface(surface?: InfoTileSurface): CardTone {
  if (!surface) return 'default';
  if (surface === 'warm') return 'peach';
  if (surface === 'cool') return 'sky';
  return surface;
}

export type InfoTileProps = {
  /** Leading icon glyph (small, thin — never an emoji). */
  icon: IconName;
  /**
   * Tint for the leading icon. When omitted on a washed tile it auto-takes the
   * tone's deeper accent so the glyph matches the wash; on a plain white tile it
   * defaults to Graphite.
   */
  iconColor?: ColorToken | (string & {});
  /** Big value (e.g. "4h 0m" or "55%"). */
  value: string;
  /** Small caption under the value. */
  label: string;
  /** Optional accent for the value text (defaults to Ink for contrast). */
  valueColor?: string;
  /**
   * Optional soft-wash surface for one highlighted figure:
   * 'peach' | 'sky' | 'mint' | 'lavender' | 'butter' (legacy 'warm'/'cool'
   * accepted). The icon picks up the matching wash accent automatically.
   */
  surface?: InfoTileSurface;
  style?: StyleProp<ViewStyle>;
};

/**
 * A compact flat Steep stat tile: a small thin icon, a value, and a muted
 * caption. Defaults to a flat white card (Dove hairline + the one shadow); pass
 * `surface` to put a single figure on a soft wash. On a wash the glyph takes
 * the tone's deeper accent so the tile reads colorful-but-calm; text stays
 * Ink/Graphite for contrast.
 */
export function InfoTile({
  icon,
  iconColor,
  value,
  label,
  valueColor,
  surface,
  style,
}: InfoTileProps) {
  const { colors, accentForTone } = useTheme();
  const tone = resolveSurface(surface);
  // On a wash the glyph matches the tone; on a plain surface it stays quiet.
  const resolvedIconColor =
    iconColor ?? (tone === 'default' ? colors.muted : accentForTone(tone));

  return (
    <SoftCard tone={tone} radius={radii.card} padding={14} style={style}>
      <View style={{ gap: 6 }}>
        <Icon name={icon} size={16} color={resolvedIconColor} />
        <AppText
          variant="headingSm"
          weight="medium"
          color={valueColor ?? colors.ink}
          style={{ marginTop: 2 }}
        >
          {value}
        </AppText>
        <AppText
          variant="caption"
          weight="regular"
          color={colors.muted}
          style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.6 }}
        >
          {label}
        </AppText>
      </View>
    </SoftCard>
  );
}

export default InfoTile;
