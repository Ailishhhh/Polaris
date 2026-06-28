import React from 'react';
import { View, ScrollView, type ViewStyle, type ScrollViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme';

/**
 * Standard screen frame: themed background, safe-area handling, and an optional
 * scroll container. Keeps every screen visually consistent.
 */
export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['top'],
  contentStyle,
  background,
  scrollProps,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
  background?: 'base' | 'alt';
  scrollProps?: ScrollViewProps;
}) {
  const theme = useTheme();
  const bg = background === 'alt' ? theme.colors.backgroundAlt : theme.colors.background;
  const pad: ViewStyle = padded ? { paddingHorizontal: theme.spacing.xl } : {};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={edges}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[pad, { paddingBottom: theme.spacing.huge }, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...scrollProps}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
