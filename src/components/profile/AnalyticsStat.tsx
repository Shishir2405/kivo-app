import React from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';
import { Neumorph } from '@/components/ui/Neumorph';
import { Icon, type IconName } from '@/components/ui/Icon';
import { AppText } from '@/components/ui/Typography';
import { colors, type ColorToken } from '@/theme/tokens';

export type AnalyticsStatProps = {
  /** Vector icon shown in the raised chip (no emoji). */
  icon: IconName;
  /** Big value, e.g. "9.3" or "82". */
  value: string;
  /** Optional small unit appended to the value, e.g. "h" or "pts". */
  unit?: string;
  /** Lowercase descriptor under the value. */
  label: string;
  /** Accent tint behind the icon chip (token or hex). */
  tint?: ColorToken | (string & {});
  /** Icon ink color (token or hex). Defaults to carbon. */
  iconColor?: ColorToken | (string & {});
  /** Stagger index used to delay the mount animation. */
  index?: number;
};

/**
 * One metric tile inside the weekly analytics card. An inset neumorphic well
 * holding a raised tinted icon chip, a Poppins value + optional unit, and a
 * muted label. Springs in on mount with a tiny stagger.
 */
export function AnalyticsStat({
  icon,
  value,
  unit,
  label,
  tint = colors.highlighter,
  iconColor = 'carbon',
  index = 0,
}: AnalyticsStatProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 180, delay: 80 + index * 70 }}
      style={{ flex: 1 }}
    >
      <Neumorph variant="inset" radius={22} intensity="sm" padding={14}>
        <View style={{ gap: 12 }}>
          <Neumorph variant="raised" radius={13} intensity="sm">
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 13,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: tint,
              }}
            >
              <Icon name={icon} size={19} color={iconColor} strokeWidth={2.2} />
            </View>
          </Neumorph>

          <View className="flex-row items-baseline" style={{ gap: 3 }}>
            <AppText variant="headingSm" weight="bold" display>
              {value}
            </AppText>
            {unit ? (
              <AppText variant="caption" weight="semibold" color={colors.textMuted}>
                {unit}
              </AppText>
            ) : null}
          </View>

          <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 12 }}>
            {label}
          </AppText>
        </View>
      </Neumorph>
    </MotiView>
  );
}

export default AnalyticsStat;
