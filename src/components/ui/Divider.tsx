import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';

export function Divider({ spacing = 0, inset = 0 }: { spacing?: number; inset?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: spacing,
        marginHorizontal: inset,
      }}
    />
  );
}
