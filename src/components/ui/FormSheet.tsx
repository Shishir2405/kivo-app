import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts, radii, spacing, componentPadding } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';
import { PillButton, TextLink } from './PillButton';
import { Icon } from './Icon';

/**
 * FormSheet — the ONE themed create/edit sheet for the whole app.
 *
 * A bottom-anchored modal built from plain React-Native primitives:
 *   Modal → scrim → KeyboardAvoidingView → ScrollView → plain <View> body.
 *
 * CRITICAL (do not regress): the body is a PLAIN <View>. NEVER wrap the
 * children (the form fields / <SoftInput>s) in a MotiView or any Reanimated
 * Animated view — that re-renders the field and bounces native focus across
 * the form. Forms live in plain views only.
 *
 * Responsibilities:
 *  - title + optional subtitle header with a close affordance,
 *  - a scrollable body (children = the caller's form fields),
 *  - a footer with the single filled PillButton (save) + a Cancel TextLink,
 *  - pending state (spinner in the CTA, disabled buttons),
 *  - a top-level inline error line for surfaced API errors (never crashes),
 *  - full dark-awareness via useTheme().
 *
 * The caller owns the fields + validation; FormSheet owns the chrome.
 */
export type FormSheetProps = {
  /** Whether the sheet is shown. */
  visible: boolean;
  /** Called when the user dismisses (Cancel, close, scrim, or hardware back). */
  onClose: () => void;
  /** Called when the primary CTA is pressed. */
  onSubmit: () => void;
  /** Sheet heading (e.g. "New task", "Edit note"). */
  title: string;
  /** Optional one-line subtitle under the title. */
  subtitle?: string;
  /** The form fields. MUST be plain <View>/<SoftInput> — never a MotiView. */
  children: React.ReactNode;
  /** Primary CTA label. Defaults to "Save". */
  submitLabel?: string;
  /** Secondary (dismiss) label. Defaults to "Cancel". */
  cancelLabel?: string;
  /** True while the mutation is in flight — disables actions + shows a spinner. */
  pending?: boolean;
  /** Disable the primary CTA (e.g. when validation hasn't passed). */
  submitDisabled?: boolean;
  /** A surfaced API / validation error rendered inline above the footer. */
  error?: string | null;
  /** Optional extra style for the sheet card. */
  style?: StyleProp<ViewStyle>;
};

export function FormSheet({
  visible,
  onClose,
  onSubmit,
  title,
  subtitle,
  children,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  pending = false,
  submitDisabled = false,
  error,
  style,
}: FormSheetProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // While pending, swallow dismiss so an in-flight save isn't interrupted.
  const handleClose = () => {
    if (pending) return;
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Scrim — tap to dismiss. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={handleClose}
          style={{ flex: 1, backgroundColor: colors.overlay }}
        />

        {/* Sheet card — a PLAIN View (no Animated wrapper). */}
        <View
          style={[
            {
              backgroundColor: colors.canvas,
              borderTopLeftRadius: radii.cardLg,
              borderTopRightRadius: radii.cardLg,
              borderTopWidth: 1,
              borderColor: colors.hairline,
              paddingTop: spacing.md,
              maxHeight: '88%',
              shadowColor: colors.shadowTint,
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: isDark ? 0.4 : 0.12,
              shadowRadius: 24,
              elevation: 16,
            },
            style,
          ]}
        >
          {/* Grabber */}
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 4,
              borderRadius: radii.pill,
              backgroundColor: colors.hairline,
              marginBottom: spacing.md,
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              paddingHorizontal: spacing.xl,
              marginBottom: spacing.lg,
            }}
          >
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text
                style={{
                  fontFamily: fonts.serif,
                  fontSize: 22,
                  color: colors.ink,
                }}
                numberOfLines={1}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 13,
                    color: colors.muted,
                    marginTop: 4,
                  }}
                  numberOfLines={2}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>

            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={10}
              disabled={pending}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.hairline,
                opacity: pending ? 0.5 : 1,
              }}
            >
              <Icon name="x" size={16} color="muted" />
            </Pressable>
          </View>

          {/* Body — plain ScrollView wrapping plain View. NO MotiView here. */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingBottom: spacing.md,
            }}
          >
            <View style={{ gap: spacing.lg }}>{children}</View>
          </ScrollView>

          {/* Inline error */}
          {error ? (
            <View
              style={{
                marginHorizontal: spacing.xl,
                marginTop: spacing.sm,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                borderRadius: radii.input,
                backgroundColor: colors.dangerWash,
                borderWidth: 1,
                borderColor: colors.danger,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 13,
                  color: colors.danger,
                }}
              >
                {error}
              </Text>
            </View>
          ) : null}

          {/* Footer */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.lg,
              paddingBottom: insets.bottom + spacing.lg,
              gap: spacing.md,
            }}
          >
            <TextLink label={cancelLabel} onPress={handleClose} disabled={pending} muted />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              {pending ? <ActivityIndicator size="small" color={colors.primary} /> : null}
              <PillButton
                label={submitLabel}
                onPress={onSubmit}
                disabled={pending || submitDisabled}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default FormSheet;
