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

function GlowBlob({
  color,
  size,
  from,
  to,
  duration,
}: {
  color: string;
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
      { scale: 1 + t.value * 0.2 },
    ],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', width: size, height: size }, style]}>
      <LinearGradient
        colors={[color, 'transparent']}
        start={{ x: 0.5, y: 0.3 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1, borderRadius: size / 2 }}
      />
    </Animated.View>
  );
}

/**
 * Nebula backdrop: a deep cosmic gradient with two slow-drifting glow blobs
 * (violet + magenta) that make every screen feel alive and luminous. Pure
 * Expo Go (gradients + Reanimated); GPU shader sparkle comes with the build.
 */
export function AmbientBackground({ aura = true }: { aura?: boolean }) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={theme.gradients.ambient}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {aura ? (
        <>
          <GlowBlob
            color={theme.gradients.aura}
            size={width * 1.1}
            from={{ x: -width * 0.3, y: -height * 0.08 }}
            to={{ x: width * 0.05, y: height * 0.08 }}
            duration={16000}
          />
          <GlowBlob
            color={theme.gradients.auraAlt}
            size={width * 0.95}
            from={{ x: width * 0.45, y: height * 0.55 }}
            to={{ x: width * 0.2, y: height * 0.72 }}
            duration={21000}
          />
        </>
      ) : null}
    </View>
  );
}
