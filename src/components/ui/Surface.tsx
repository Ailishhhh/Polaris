import React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

export interface SurfaceProps extends ViewProps {
  /** Visual tier. `sunken` for inputs/nested, `card` for raised content. */
  variant?: 'card' | 'sunken' | 'flat';
  padding?: keyof ReturnType<typeof usePad>;
  radius?: 'sm' | 'md' | 'lg' | 'xl';
  bordered?: boolean;
  elevated?: 1 | 2 | 3;
}

function usePad() {
  const theme = useTheme();
  return theme.spacing;
}

export function Surface({
  variant = 'card',
  padding = 'lg',
  radius = 'lg',
  bordered = true,
  elevated,
  style,
  children,
  ...rest
}: SurfaceProps) {
  const theme = useTheme();

  const bg: Record<NonNullable<SurfaceProps['variant']>, string> = {
    card: theme.colors.surface,
    sunken: theme.colors.surfaceSunken,
    flat: 'transparent',
  };

  const base: ViewStyle = {
    backgroundColor: bg[variant],
    borderRadius: theme.radii[radius],
    padding: theme.spacing[padding],
    borderWidth: bordered && variant !== 'flat' ? 1 : 0,
    borderColor: theme.colors.border,
  };

  return (
    <View style={[base, elevated ? theme.elevation(elevated) : null, style]} {...rest}>
      {children}
    </View>
  );
}
