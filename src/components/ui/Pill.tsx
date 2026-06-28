import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';

export type PillTone = 'neutral' | 'accent' | 'success' | 'warning' | 'muted';

export function Pill({
  label,
  tone = 'neutral',
  icon,
  style,
}: {
  label: string;
  tone?: PillTone;
  icon?: React.ReactNode;
  style?: ViewStyle;
}) {
  const theme = useTheme();

  const map: Record<PillTone, { bg: string; fg: string }> = {
    neutral: { bg: theme.colors.surfaceSunken, fg: theme.colors.textSecondary },
    accent: { bg: theme.colors.accentSoft, fg: theme.colors.accentSoftText },
    success: { bg: theme.colors.successSoft, fg: theme.colors.success },
    warning: { bg: theme.colors.accentSoft, fg: theme.colors.warning },
    muted: { bg: 'transparent', fg: theme.colors.textMuted },
  };

  const { bg, fg } = map[tone];

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          backgroundColor: bg,
          borderRadius: theme.radii.pill,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: 5,
          gap: 5,
        },
        style,
      ]}
    >
      {icon}
      <Text variant="caption" tint={fg}>
        {label}
      </Text>
    </View>
  );
}
