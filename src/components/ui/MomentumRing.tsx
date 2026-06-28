import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { Text } from './Text';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Circular 0..100 momentum indicator. The arc fills with a warm gradient and
 * animates whenever the value changes — the core "you are moving" signal.
 */
export function MomentumRing({
  value,
  size = 132,
  strokeWidth = 12,
  label = 'momentum',
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(clamped / 100, {
      duration: 900,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [clamped, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="momentumGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={theme.colors.accent} />
            <Stop offset="1" stopColor={theme.colors.accentPressed} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.surfaceSunken}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#momentumGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text variant="title" tint={theme.colors.text}>
          {clamped}
        </Text>
        <Text variant="overline" color="textMuted">
          {label.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

/** Slim horizontal progress used inside cards. */
export function ProgressBar({ value, height = 8 }: { value: number; height?: number }) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(100, value));
  const w = useSharedValue(0);

  useEffect(() => {
    w.value = withTiming(clamped, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [clamped, w]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${w.value}%` }));

  return (
    <View
      style={{
        height,
        backgroundColor: theme.colors.surfaceSunken,
        borderRadius: theme.radii.pill,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[
          { height, borderRadius: theme.radii.pill, backgroundColor: theme.colors.accent },
          fillStyle,
        ]}
      />
    </View>
  );
}
