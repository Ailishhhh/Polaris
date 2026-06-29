import React from 'react';
import { View, ScrollView, type ViewStyle, type ScrollViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme';
import { AmbientBackground } from './AmbientBackground';

/**
 * Standard screen frame: atmospheric backdrop, safe-area handling, and an
 * optional scroll container. Keeps every screen visually consistent and gives
 * the whole app a warm, hand-crafted depth.
 */
export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['top'],
  contentStyle,
  ambient = true,
  aura = true,
  scrollProps,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
  ambient?: boolean;
  aura?: boolean;
  scrollProps?: ScrollViewProps;
}) {
  const theme = useTheme();
  const pad: ViewStyle = padded ? { paddingHorizontal: theme.spacing.xl } : {};

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {ambient ? <AmbientBackground aura={aura} /> : null}
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={edges}>
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
    </View>
  );
}
