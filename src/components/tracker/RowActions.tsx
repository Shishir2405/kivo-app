import React from 'react';
import {
  Modal,
  Pressable,
  View,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts, radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme';
import { Icon, type IconName } from '@/components/ui/Icon';

/* ================================================================== */
/* SwipeRow — swipe-left to reveal a destructive Delete action.        */
/*                                                                     */
/* Wraps any row content. Swiping left reveals a red Delete pill;       */
/* releasing past the threshold fires onDelete. Also forwards a         */
/* long-press anywhere on the row to onLongPress (opens the actions     */
/* menu) so users have two discoverable ways to delete/edit.           */
/* ================================================================== */

export type SwipeRowProps = {
  children: React.ReactNode;
  onDelete: () => void;
  onLongPress?: () => void;
  /** Optional disable (e.g. while a mutation is pending). */
  enabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function SwipeRow({
  children,
  onDelete,
  onLongPress,
  enabled = true,
  style,
}: SwipeRowProps) {
  const { colors } = useTheme();
  const ref = React.useRef<SwipeableMethods>(null);

  const renderRightActions = () => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Delete"
      onPress={() => {
        ref.current?.close();
        onDelete();
      }}
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        width: 84,
        marginBottom: spacing.sm,
        borderRadius: radii.card,
        backgroundColor: colors.danger,
      }}
    >
      <Icon name="trash" size={20} color="onPrimary" />
      <Text
        style={{
          fontFamily: fonts.sansSemibold,
          fontSize: 12,
          color: colors.onPrimary,
          marginTop: 4,
        }}
      >
        Delete
      </Text>
    </Pressable>
  );

  return (
    <ReanimatedSwipeable
      ref={ref}
      enabled={enabled}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={renderRightActions}
      containerStyle={style}
    >
      <Pressable
        onLongPress={onLongPress}
        delayLongPress={280}
        accessibilityHint="Long press for more actions"
      >
        {children}
      </Pressable>
    </ReanimatedSwipeable>
  );
}

/* ================================================================== */
/* RowActionsSheet — a small Modal action menu (long-press target).    */
/* ================================================================== */

export type RowAction = {
  key: string;
  label: string;
  icon: IconName;
  destructive?: boolean;
  onPress: () => void;
};

export type RowActionsSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  actions: RowAction[];
};

export function RowActionsSheet({ visible, onClose, title, actions }: RowActionsSheetProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}
      >
        {/* Stop propagation so taps on the card don't dismiss. */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.canvas,
            borderTopLeftRadius: radii.cardLg,
            borderTopRightRadius: radii.cardLg,
            borderTopWidth: 1,
            borderColor: colors.hairline,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.md,
            paddingHorizontal: spacing.lg,
            shadowColor: colors.shadowTint,
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: isDark ? 0.4 : 0.12,
            shadowRadius: 24,
            elevation: 16,
          }}
        >
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

          {title ? (
            <Text
              style={{
                fontFamily: fonts.sansMedium,
                fontSize: 13,
                color: colors.muted,
                paddingHorizontal: spacing.sm,
                marginBottom: spacing.sm,
              }}
              numberOfLines={1}
            >
              {title}
            </Text>
          ) : null}

          {actions.map((a) => (
            <Pressable
              key={a.key}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              onPress={() => {
                onClose();
                a.onPress();
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.sm,
                borderRadius: radii.card,
                backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
              })}
            >
              <Icon name={a.icon} size={18} color={a.destructive ? 'danger' : 'ink'} />
              <Text
                style={{
                  fontFamily: fonts.sansMedium,
                  fontSize: 15,
                  color: a.destructive ? colors.danger : colors.ink,
                }}
              >
                {a.label}
              </Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default SwipeRow;
