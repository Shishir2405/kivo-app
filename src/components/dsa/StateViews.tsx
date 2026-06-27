import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SoftCard } from '@/components/ui/SoftCard';
import { AppText } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { TextLink } from '@/components/ui/PillButton';
import { useTheme } from '@/theme';
import type { ApiError } from '@/services/api';

/* ------------------------------------------------------------------ */
/* Loading                                                            */
/* ------------------------------------------------------------------ */

/** A quiet inline loading well — small spinner + caption. */
export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <SoftCard variant="inset" radius={16} padding={24}>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <ActivityIndicator size="small" color={colors.muted} />
        <AppText variant="caption" color={colors.muted}>
          {label}
        </AppText>
      </View>
    </SoftCard>
  );
}

/** A row of skeleton bars for list placeholders (flat, quiet). */
export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <SoftCard key={i} radius={16} padding={14}>
          <View style={{ gap: 10 }}>
            <View style={{ height: 12, width: '55%', borderRadius: 6, backgroundColor: colors.surfaceAlt }} />
            <View style={{ height: 10, width: '80%', borderRadius: 6, backgroundColor: colors.surfaceAlt }} />
            <View style={{ height: 6, width: '100%', borderRadius: 6, backgroundColor: colors.surfaceAlt }} />
          </View>
        </SoftCard>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Error                                                              */
/* ------------------------------------------------------------------ */

/**
 * A flat error well. Shows the normalised ApiError message and a Retry text
 * link. Never renders raw stack traces — message is already UI-safe.
 */
export function ErrorState({
  error,
  onRetry,
  title = 'Could not load',
}: {
  error?: ApiError | null;
  onRetry?: () => void;
  title?: string;
}) {
  const { colors } = useTheme();
  const message =
    error?.message ?? 'Something went wrong. Please try again.';
  return (
    <SoftCard variant="inset" radius={16} padding={20}>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Icon name="alert" size={20} color="rust" />
        <AppText variant="subheading" weight="medium" display style={{ textAlign: 'center' }}>
          {title}
        </AppText>
        <AppText
          variant="body"
          color={colors.ash}
          style={{ textAlign: 'center', maxWidth: 260 }}
        >
          {message}
        </AppText>
        {onRetry ? (
          <View style={{ marginTop: 4 }}>
            <TextLink label="Try again" onPress={onRetry} icon={<Icon name="refresh" size={15} color="ink" />} />
          </View>
        ) : null}
      </View>
    </SoftCard>
  );
}

/* ------------------------------------------------------------------ */
/* Empty                                                              */
/* ------------------------------------------------------------------ */

/** A flat empty well — small thin icon + a calm line of copy. */
export function EmptyState({
  icon = 'list',
  title,
  body,
}: {
  icon?: IconName;
  title: string;
  body?: string;
}) {
  const { colors } = useTheme();
  return (
    <SoftCard variant="inset" radius={16} padding={22}>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Icon name={icon} size={20} color="muted" />
        <AppText variant="subheading" weight="medium" display style={{ textAlign: 'center' }}>
          {title}
        </AppText>
        {body ? (
          <AppText
            variant="body"
            color={colors.ash}
            style={{ textAlign: 'center', maxWidth: 260 }}
          >
            {body}
          </AppText>
        ) : null}
      </View>
    </SoftCard>
  );
}
