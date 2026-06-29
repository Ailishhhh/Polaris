import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';

function Dot({ delay }: { delay: number }) {
  const theme = useTheme();
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      ),
    );
  }, [delay, t]);
  const style = useAnimatedStyle(() => ({ opacity: 0.3 + t.value * 0.7, transform: [{ translateY: -t.value * 2 }] }));
  return (
    <Animated.View
      style={[{ width: 5, height: 5, borderRadius: 3, backgroundColor: theme.colors.accent, marginRight: 4 }, style]}
    />
  );
}

/** Compact inline "the mentor is thinking" indicator for AI cards. */
export function StreamingDots() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 20 }}>
      <Dot delay={0} />
      <Dot delay={140} />
      <Dot delay={280} />
    </View>
  );
}
