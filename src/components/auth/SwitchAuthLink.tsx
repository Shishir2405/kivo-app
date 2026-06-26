import React from 'react';
import { View, Pressable } from 'react-native';
import { AppText } from '@/components/ui/Typography';
import { colors } from '@/theme/tokens';

export type SwitchAuthLinkProps = {
  prompt: string;
  action: string;
  onPress: () => void;
};

/** Centered "prompt + tappable action" row used in the auth footers. */
export function SwitchAuthLink({ prompt, action, onPress }: SwitchAuthLinkProps) {
  return (
    <View className="flex-row items-center justify-center" style={{ gap: 6 }}>
      <AppText variant="caption" color={colors.textMuted}>
        {prompt}
      </AppText>
      <Pressable onPress={onPress} hitSlop={8}>
        <AppText variant="caption" weight="bold" color={colors.carbon}>
          {action}
        </AppText>
      </Pressable>
    </View>
  );
}

export default SwitchAuthLink;
