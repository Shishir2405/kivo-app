import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  View,
  Text,
  ScrollView,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Neumorph } from './Neumorph';
import { Icon, type IconName } from './Icon';
import { fonts, radii, motion } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

export type SelectOption<T extends string> = {
  label: string;
  value: T;
  icon?: IconName;
};

export type SelectProps<T extends string> = {
  options: SelectOption<T>[];
  value: T | null;
  onChange: (next: T) => void;
  placeholder?: string;
  /** Optional label rendered above the trigger. */
  label?: string;
  /** Title shown at the top of the sheet. */
  title?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Custom dropdown / select — never the native Picker. Theme-aware.
 *
 * The trigger is a quiet well (matching SoftInput). Tapping it opens a Kivo
 * bottom-sheet that springs up on the canvas; each row carries an optional Icon
 * and the selected row fills with the terracotta wash + a terracotta check.
 */
export function Select<T extends string>({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  label,
  title,
  disabled,
  style,
}: SelectProps<T>) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = options.find((o) => o.value === value) ?? null;

  function choose(v: T) {
    onChange(v);
    setOpen(false);
  }

  return (
    <View style={style}>
      {label ? (
        <Text
          style={{
            fontFamily: fonts.sansMedium,
            fontSize: 13,
            color: colors.muted,
            marginBottom: 8,
            marginLeft: 4,
          }}
        >
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ expanded: open, disabled }}
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        <Neumorph variant="inset" radius={radii.input}>
          <View
            style={{
              minHeight: 52,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              borderRadius: radii.input,
            }}
          >
            {selected?.icon ? <Icon name={selected.icon} size={18} color="ink" /> : null}
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontFamily: fonts.sans,
                fontSize: 15,
                color: selected ? colors.ink : colors.muted,
              }}
            >
              {selected ? selected.label : placeholder}
            </Text>
            <Icon name="chevron-down" size={20} color="muted" />
          </View>
        </Neumorph>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}
        >
          <MotiView
            from={{ translateY: 40, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={motion.spring}
          >
            {/* Stop propagation so taps inside don't close the sheet. */}
            <Pressable onPress={() => {}}>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderTopLeftRadius: radii.cardLg,
                  borderTopRightRadius: radii.cardLg,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  paddingTop: 12,
                  paddingBottom: insets.bottom + 16,
                  paddingHorizontal: 16,
                }}
              >
                {/* Grabber */}
                <View
                  style={{
                    alignSelf: 'center',
                    width: 44,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: colors.hairline,
                    marginBottom: 14,
                  }}
                />
                {title ? (
                  <Text
                    style={{
                      fontFamily: fonts.serifSemibold,
                      fontSize: 20,
                      color: colors.ink,
                      marginBottom: 14,
                      marginLeft: 4,
                    }}
                  >
                    {title}
                  </Text>
                ) : null}

                <ScrollView
                  bounces={false}
                  style={{ maxHeight: 360 }}
                  contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
                >
                  {options.map((opt) => {
                    const isActive = opt.value === value;
                    return (
                      <Pressable key={opt.value} onPress={() => choose(opt.value)}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 12,
                            paddingVertical: 14,
                            paddingHorizontal: 16,
                            borderRadius: radii.input,
                            backgroundColor: isActive ? colors.primaryWash : colors.surfaceAlt,
                            borderWidth: 1,
                            borderColor: isActive ? colors.primary : colors.hairline,
                          }}
                        >
                          {opt.icon ? (
                            <Icon
                              name={opt.icon}
                              size={20}
                              color={isActive ? colors.primary : colors.muted}
                            />
                          ) : null}
                          <Text
                            style={{
                              flex: 1,
                              fontFamily: isActive ? fonts.sansSemibold : fonts.sansMedium,
                              fontSize: 15,
                              color: isActive ? colors.primaryOnWash : colors.ink,
                            }}
                          >
                            {opt.label}
                          </Text>
                          {isActive ? <Icon name="check" size={20} color={colors.primary} weight="bold" /> : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </Pressable>
          </MotiView>
        </Pressable>
      </Modal>
    </View>
  );
}

export default Select;
