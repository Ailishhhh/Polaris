import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/theme';

/**
 * A frosted-glass surface — content floats above the aurora with a soft blur,
 * a luminous hairline edge, and a faint top sheen. The Expo Go approximation of
 * Liquid Glass (true light-refraction lands with the native build).
 */
export function GlassCard({
  children,
  style,
  intensity = 40,
  padding = 'xl',
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  padding?: 'lg' | 'xl' | 'xxl';
}) {
  const theme = useTheme();
  const dark = theme.scheme === 'dark';

  return (
    <View
      style={[
        {
          borderRadius: theme.radii.xl,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.6)',
          ...theme.elevation(2),
        },
        style,
      ]}
    >
      <BlurView intensity={intensity} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      {/* translucent fill so text stays legible over the blur */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: dark ? 'rgba(29,24,19,0.55)' : 'rgba(255,255,255,0.45)' },
        ]}
      />
      <View style={{ padding: theme.spacing[padding] }}>{children}</View>
    </View>
  );
}
