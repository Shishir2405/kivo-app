import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from '@/components/ui/Typography';
import { Neumorph } from '@/components/ui/Neumorph';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors, radii } from '@/theme/tokens';

/* ================================================================== */
/* Section header                                                      */
/* ================================================================== */

export type SectionHeaderProps = {
  /** Small uppercase eyebrow above the title. */
  eyebrow: string;
  /** The section title. */
  title: string;
  /** Optional leading icon rendered in a small neumorphic well. */
  icon?: IconName;
  /** Tint of the leading icon. */
  iconColor?: string;
  /** Optional trailing slot (e.g. an add button). */
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Consistent section header: small recessed icon chip + uppercase eyebrow +
 * bold title, with an optional trailing action. No emoji — the leading glyph
 * is always a real vector Icon.
 */
export function SectionHeader({
  eyebrow,
  title,
  icon,
  iconColor = colors.carbon,
  trailing,
  style,
}: SectionHeaderProps) {
  return (
    <View
      className="flex-row items-center justify-between"
      style={[{ marginBottom: 16 }, style]}
    >
      <View className="flex-row items-center" style={{ flex: 1, gap: 12 }}>
        {icon ? (
          <Neumorph variant="inset" radius={12} intensity="sm">
            <View
              style={{ width: 38, height: 38 }}
              className="items-center justify-center"
            >
              <Icon name={icon} size={19} color={iconColor} strokeWidth={2.2} />
            </View>
          </Neumorph>
        ) : null}
        <View style={{ flex: 1 }}>
          <AppText
            variant="caption"
            weight="semibold"
            color={colors.textSubtle}
            style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 11 }}
          >
            {eyebrow}
          </AppText>
          <AppText
            variant="headingSm"
            weight="bold"
            color={colors.carbon}
            style={{ marginTop: 1 }}
          >
            {title}
          </AppText>
        </View>
      </View>
      {trailing}
    </View>
  );
}

/* ================================================================== */
/* Empty state                                                         */
/* ================================================================== */

export type EmptyStateProps = {
  icon: IconName;
  title: string;
  body: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * A real empty state — recessed well, big soft icon medallion, encouraging
 * copy. Used when a list (tasks / habits) has no items to show.
 */
export function EmptyState({ icon, title, body, style }: EmptyStateProps) {
  return (
    <Neumorph
      variant="inset"
      radius={radii.card}
      intensity="md"
      padding={28}
      style={style}
    >
      <View className="items-center" style={{ gap: 14 }}>
        <Neumorph variant="raised" radius={28} intensity="sm">
          <View
            style={{ width: 64, height: 64 }}
            className="items-center justify-center"
          >
            <Icon name={icon} size={26} color="textMuted" strokeWidth={2} />
          </View>
        </Neumorph>
        <View className="items-center" style={{ gap: 4 }}>
          <AppText variant="body" weight="bold" color={colors.carbon}>
            {title}
          </AppText>
          <AppText
            variant="caption"
            color={colors.textMuted}
            style={{ textAlign: 'center', maxWidth: 240, lineHeight: 19 }}
          >
            {body}
          </AppText>
        </View>
      </View>
    </Neumorph>
  );
}

/* ================================================================== */
/* Mini stat pill                                                      */
/* ================================================================== */

export type StatPillProps = {
  icon: IconName;
  value: string;
  label: string;
  accent: string;
  style?: StyleProp<ViewStyle>;
};

/** Compact raised stat tile: icon chip + big value + caption. */
export function StatPill({ icon, value, label, accent, style }: StatPillProps) {
  return (
    <Neumorph variant="raised" radius={radii.sm + 8} intensity="sm" padding={14} style={style}>
      <View className="flex-row items-center" style={{ gap: 11 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={19} color="carbon" strokeWidth={2.4} />
        </View>
        <View>
          <AppText
            variant="subheading"
            weight="bold"
            color={colors.carbon}
            style={{ fontSize: 19, lineHeight: 22 }}
          >
            {value}
          </AppText>
          <AppText
            variant="caption"
            color={colors.textSubtle}
            style={{ fontSize: 11, letterSpacing: 0.2 }}
          >
            {label}
          </AppText>
        </View>
      </View>
    </Neumorph>
  );
}
