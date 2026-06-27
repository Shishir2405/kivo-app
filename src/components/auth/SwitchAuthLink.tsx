import React from 'react';
import { View, Pressable } from 'react-native';
import { AppText } from '@/components/ui/Typography';
import { useTheme } from '@/theme';

export type SwitchAuthLinkProps = {
  prompt: string;
  action: string;
  onPress: () => void;
};

/** Centered "prompt + tappable action" row used in the auth footers. */
export function SwitchAuthLink({ prompt, action, onPress }: SwitchAuthLinkProps) {
  const { colors } = useTheme();
  return (
    <View className="flex-row items-center justify-center" style={{ gap: 6 }}>
      <AppText variant="caption" color={colors.muted}>
        {prompt}
      </AppText>
      <Pressable onPress={onPress} hitSlop={8}>
        <AppText variant="caption" weight="bold" color={colors.primary}>
          {action}
        </AppText>
      </Pressable>
    </View>
  );
}

export default SwitchAuthLink;
