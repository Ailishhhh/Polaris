import React from 'react';
import { type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

/**
 * Expressive, guiding entrance motion (Material 3 Expressive principle: motion
 * should feel natural and direct attention). Content rises and fades in with a
 * spring; pass an `index` to stagger a list/section so the eye is led down.
 */
export function Appear({
  children,
  index = 0,
  delay = 0,
  distance = 14,
  style,
}: {
  children: React.ReactNode;
  index?: number;
  delay?: number;
  distance?: number;
  style?: ViewStyle;
}) {
  return (
    <Animated.View
      entering={FadeInDown.springify()
        .damping(20)
        .mass(0.7)
        .delay(delay + index * 70)
        .withInitialValues({ transform: [{ translateY: distance }], opacity: 0 })}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
