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
import { colors, fonts, radii } from '@/theme/tokens';

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
 * Custom dropdown / select — never the native Picker.
 *
 * The trigger is an inset neumorphic well (matching SoftInput). Tapping it
 * opens a neumorphic bottom-sheet that springs up; each row carries an
 * optional Icon and the selected row shows a highlighter-yellow check.
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
            fontFamily: fonts.bodyMedium,
            fontSize: 14,
            color: colors.carbon,
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
              minHeight: 54,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              borderRadius: radii.input,
            }}
          >
            {selected?.icon ? (
              <Icon name={selected.icon} size={18} color="carbon" />
            ) : null}
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontFamily: fonts.body,
                fontSize: 16,
                color: selected ? colors.carbon : colors.textSubtle,
              }}
            >
              {selected ? selected.label : placeholder}
            </Text>
            <Icon name="chevron-down" size={20} color="textMuted" />
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
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.28)', justifyContent: 'flex-end' }}
        >
          <MotiView
            from={{ translateY: 40, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          >
            {/* Stop propagation so taps inside don't close the sheet. */}
            <Pressable onPress={() => {}}>
              <View
                style={{
                  backgroundColor: colors.canvas,
                  borderTopLeftRadius: radii.cardLg,
                  borderTopRightRadius: radii.cardLg,
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
                      fontFamily: fonts.displaySemibold,
                      fontSize: 18,
                      color: colors.carbon,
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
                        <Neumorph
                          variant={isActive ? 'inset' : 'raised'}
                          radius={radii.input}
                          intensity="sm"
                          surface={isActive ? colors.highlighter : colors.canvas}
                        >
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 12,
                              paddingVertical: 14,
                              paddingHorizontal: 16,
                              borderRadius: radii.input,
                            }}
                          >
                            {opt.icon ? (
                              <Icon
                                name={opt.icon}
                                size={20}
                                color="carbon"
                                strokeWidth={isActive ? 2.4 : 2}
                              />
                            ) : null}
                            <Text
                              style={{
                                flex: 1,
                                fontFamily: isActive ? fonts.bodyBold : fonts.bodyMedium,
                                fontSize: 16,
                                color: colors.carbon,
                              }}
                            >
                              {opt.label}
                            </Text>
                            {isActive ? (
                              <Icon name="check" size={20} color="carbon" strokeWidth={3} />
                            ) : null}
                          </View>
                        </Neumorph>
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
