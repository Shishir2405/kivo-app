import React, { forwardRef, useMemo, useState } from 'react';
import { View, Pressable, type TextInput } from 'react-native';
import { MotiView } from 'moti';
import { SoftInput, type SoftInputProps } from '@/components/ui/SoftInput';
import { Icon } from '@/components/ui';
import { AppText } from '@/components/ui/Typography';
import { colors } from '@/theme/tokens';

export type PasswordStrength = {
  /** 0 (empty) .. 4 (strong). */
  score: number;
  label: string;
  color: string;
};

/** Cheap, dependency-free password strength heuristic. */
export function scorePassword(pw: string): PasswordStrength {
  if (!pw) return { score: 0, label: '', color: colors.hairline };

  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score += 1;
  score = Math.min(score, 4);

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const tones = [
    colors.hairline,
    colors.annotation,
    colors.peach,
    colors.signal,
    colors.success,
  ];
  return { score, label: labels[score], color: tones[score] };
}

export type PasswordFieldProps = Omit<SoftInputProps, 'trailing' | 'secureTextEntry'> & {
  /** Show the animated 4-segment strength meter under the field. */
  showStrength?: boolean;
};

/**
 * Password SoftInput with a neumorphic eye Icon toggle (vector, never an emoji
 * or "Show/Hide" text) and an optional animated strength meter — used by both
 * the login (no meter) and register (meter on) screens.
 */
export const PasswordField = forwardRef<TextInput, PasswordFieldProps>(
  function PasswordField({ showStrength = false, value, ...rest }, ref) {
    const [visible, setVisible] = useState(false);

    const strength = useMemo(
      () => scorePassword(typeof value === 'string' ? value : ''),
      [value],
    );

    return (
      <View>
        <SoftInput
          ref={ref}
          value={value}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          {...rest}
          trailing={
            <Pressable
              onPress={() => setVisible((v) => !v)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            >
              <Icon
                name={visible ? 'eye-off' : 'eye'}
                size={20}
                color="textMuted"
                strokeWidth={2}
              />
            </Pressable>
          }
        />

        {showStrength && strength.score > 0 ? (
          <View style={{ marginTop: 12, marginHorizontal: 4, gap: 8 }}>
            <View className="flex-row items-center" style={{ gap: 6 }}>
              {[1, 2, 3, 4].map((seg) => {
                const filled = seg <= strength.score;
                return (
                  <MotiView
                    key={seg}
                    animate={{
                      backgroundColor: filled ? strength.color : colors.hairline,
                    }}
                    transition={{ type: 'timing', duration: 220 }}
                    style={{ flex: 1, height: 5, borderRadius: 3 }}
                  />
                );
              })}
            </View>
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Icon
                name={strength.score >= 3 ? 'check-circle' : 'info'}
                size={14}
                color={strength.score >= 3 ? 'success' : 'textSubtle'}
              />
              <AppText variant="caption" weight="medium" color={strength.color}>
                {strength.label} password
              </AppText>
            </View>
          </View>
        ) : null}
      </View>
    );
  },
);

export default PasswordField;
