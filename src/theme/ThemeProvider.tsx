import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { buildTheme, type Theme, type ColorSchemeName } from './tokens';

const ThemeContext = createContext<Theme>(buildTheme('light'));

/**
 * Provides the active theme based on the OS color scheme. Both light and dark
 * are first-class; we simply follow the system unless overridden.
 */
export function ThemeProvider({
  children,
  forcedScheme,
}: {
  children: React.ReactNode;
  forcedScheme?: ColorSchemeName;
}) {
  const system = useColorScheme();
  const scheme: ColorSchemeName = forcedScheme ?? (system === 'dark' ? 'dark' : 'light');
  const theme = useMemo(() => buildTheme(scheme), [scheme]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/**
 * Build StyleSheet-like styles that depend on the theme, memoized per theme.
 * Usage: const styles = useThemedStyles((t) => ({ ... }))
 */
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [theme, factory]);
}
