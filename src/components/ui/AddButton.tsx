import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { fonts, radii, spacing, pressOpacity } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';
import { Icon, type IconName } from './Icon';
import { PillButton } from './PillButton';

/**
 * Create-affordances for the Kivo app.
 *
 * Screens offer "create" from several places — a header "+", a quick-add pill,
 * and an empty-state CTA. These three pieces keep that consistent so a feature
 * agent only wires `onPress` to open its FormSheet.
 *
 * All theme-aware (useTheme), plain Pressables (no Animated wrappers needed).
 */

/* ------------------------------------------------------------------ */
/* AddButton — the header "+" affordance                               */
/* ------------------------------------------------------------------ */

export type AddButtonProps = {
  /** Opens the create sheet. */
  onPress: () => void;
  /** Glyph to show. Defaults to 'plus'. */
  icon?: IconName;
  /** Diameter in px. Defaults to 36 (header-sized). */
  size?: number;
  /** Filled terracotta (default) vs. quiet hairline surface. */
  variant?: 'filled' | 'soft';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * AddButton — a round "+" button for app headers (pass to AppHeader's `right`).
 * Filled terracotta by default (the single accent), or a quiet surface circle.
 */
export function AddButton({
  onPress,
  icon = 'plus',
  size = 36,
  variant = 'filled',
  accessibilityLabel = 'Add',
  style,
}: AddButtonProps) {
  const { colors } = useTheme();
  const filled = variant === 'filled';
  const [pressed, setPressed] = useState(false);

  const baseStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: filled ? colors.primary : colors.surface,
    borderWidth: filled ? 0 : 1,
    borderColor: colors.hairline,
    opacity: pressOpacity({}, { solid: filled }),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: filled ? 0.35 : 0,
    shadowRadius: 12,
    elevation: filled ? 3 : 0,
  };
  // Press feedback (preserved): filled swaps to primaryPressed bg; opacity dips.
  const pressedStyle: ViewStyle = {
    ...(filled ? { backgroundColor: colors.primaryPressed } : null),
    opacity: pressOpacity({ pressed: true }, { solid: filled }),
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[baseStyle, pressed && pressedStyle, style]}
    >
      <Icon name={icon} size={Math.round(size * 0.5)} color={filled ? 'onPrimary' : 'ink'} />
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* QuickAddRow — a full-width dashed "+ Add …" affordance              */
/* ------------------------------------------------------------------ */

export type QuickAddRowProps = {
  /** Opens the create sheet. */
  onPress: () => void;
  /** Row label, e.g. "Add a task". */
  label: string;
  /** Leading glyph. Defaults to 'plus'. */
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
};

/**
 * QuickAddRow — the inline "create" affordance dropped at the top or bottom of a
 * list ("Add a topic", "Add a problem", "Add a task", …). These are PRIMARY
 * create actions, so the row is a FILLED terracotta button (bg colors.primary,
 * onPrimary text + "+" icon) — clearly prominent and readable in BOTH light and
 * dark. (Previously it was a dashed hairline row whose terracotta text read like
 * a faint link and could disappear against the canvas.)
 */
export function QuickAddRow({ onPress, label, icon = 'plus', style }: QuickAddRowProps) {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);
  const baseStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    // soft terracotta glow (matches the PillButton CTA)
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 4,
    opacity: pressOpacity({}, { solid: true }),
  };
  // Press feedback (preserved): primaryPressed bg + solid press opacity.
  const pressedStyle: ViewStyle = {
    backgroundColor: colors.primaryPressed,
    opacity: pressOpacity({ pressed: true }, { solid: true }),
  };
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[baseStyle, pressed && pressedStyle, style]}
    >
      <Icon name={icon} size={16} color="onPrimary" />
      <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 14, color: colors.onPrimary }}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* EmptyStateCTA — illustration-free empty state with a create CTA     */
/* ------------------------------------------------------------------ */

export type EmptyStateCTAProps = {
  /** Glyph shown in the soft circle. */
  icon?: IconName;
  /** Headline, e.g. "No tasks yet". */
  title: string;
  /** Supporting line under the headline. */
  description?: string;
  /** CTA button label. When omitted (and no onAction), no button renders. */
  actionLabel?: string;
  /** Opens the create sheet. */
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * EmptyStateCTA — the shared empty-state pattern: a soft glyph chip, a serif
 * headline, a muted description, and the single filled CTA to create the first
 * item. Use whenever a list comes back empty.
 */
export function EmptyStateCTA({
  icon = 'sparkles',
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateCTAProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.xxl,
          paddingHorizontal: spacing.xl,
          gap: spacing.md,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primaryWash,
        }}
      >
        <Icon name={icon} size={28} color="primary" />
      </View>

      <Text
        style={{
          fontFamily: fonts.serif,
          fontSize: 20,
          color: colors.ink,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>

      {description ? (
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 14,
            color: colors.muted,
            textAlign: 'center',
            lineHeight: 20,
            maxWidth: 280,
          }}
        >
          {description}
        </Text>
      ) : null}

      {actionLabel && onAction ? (
        <View style={{ marginTop: spacing.sm }}>
          <PillButton label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

export default AddButton;
