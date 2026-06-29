import React from 'react';
import { type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

/**
 * Expressive, guiding entrance motion (Material 3 Expressive principle: motion
 * should feel natural and direct attention). Content fades and rises in; pass
 * an `index` to stagger a section so the eye is led down the screen.
 *
 * Kept intentionally simple (duration + delay) — the most stable Reanimated
 * entering path across the New Architecture.
 */
export function Appear({
  children,
  index = 0,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  index?: number;
  delay?: number;
  style?: ViewStyle;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(420).delay(delay + index * 70)} style={style}>
      {children}
    </Animated.View>
  );
}
