import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';

/** A single slow-drifting, soft color "blob" — the living part of the aurora. */
function Blob({
  colors,
  size,
  from,
  to,
  duration,
}: {
  colors: [string, string];
  size: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  duration: number;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [t, duration]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: from.x + (to.x - from.x) * t.value },
      { translateY: from.y + (to.y - from.y) * t.value },
      { scale: 1 + t.value * 0.25 },
    ],
  }));

  return (
    <Animated.View style={[{ position: 'absolute', width: size, height: size }, style]}>
      <LinearGradient
        colors={[colors[0], colors[1], 'transparent']}
        start={{ x: 0.5, y: 0.2 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1, borderRadius: size / 2 }}
      />
    </Animated.View>
  );
}

/**
 * Aurora Glass backdrop: a warm base gradient with slow-drifting color blobs
 * that make the screen feel alive without ever distracting. Pure Expo Go
 * (gradients + Reanimated) — the GPU-shader version comes with the native build.
 */
export function AuroraBackground() {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const dark = theme.scheme === 'dark';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={theme.gradients.ambient} style={StyleSheet.absoluteFill} />
      <Blob
        colors={[theme.colors.accent, theme.gradients.aura]}
        size={width * 0.9}
        from={{ x: -width * 0.2, y: -height * 0.05 }}
        to={{ x: width * 0.1, y: height * 0.12 }}
        duration={14000}
      />
      <Blob
        colors={[theme.colors.accentPressed, theme.gradients.aura]}
        size={width * 0.8}
        from={{ x: width * 0.5, y: height * 0.25 }}
        to={{ x: width * 0.25, y: height * 0.45 }}
        duration={18000}
      />
      <Blob
        colors={[dark ? '#3A4A6B' : '#CBB89B', 'transparent']}
        size={width * 0.7}
        from={{ x: width * 0.1, y: height * 0.6 }}
        to={{ x: width * 0.4, y: height * 0.75 }}
        duration={22000}
      />
    </View>
  );
}
