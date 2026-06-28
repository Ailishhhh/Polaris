import React, { useEffect } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { Text } from './Text';

/**
 * The mentor's identity mark. A warm gradient orb with a soft "breathing"
 * pulse when thinking — subtle, never gimmicky.
 */
export function MentorAvatar({
  size = 36,
  thinking = false,
}: {
  size?: number;
  thinking?: boolean;
}) {
  const theme = useTheme();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (thinking) {
      pulse.value = withRepeat(
        withTiming(1.12, { duration: 720, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      pulse.value = withTiming(1, { duration: 240 });
    }
  }, [thinking, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <LinearGradient
        colors={[theme.colors.accent, theme.colors.accentPressed]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* A small editorial "P" mark for Polaris. */}
        <Text
          tint={theme.colors.onAccent}
          style={{ fontFamily: 'Fraunces_700Bold', fontSize: size * 0.5, lineHeight: size * 0.6 }}
        >
          P
        </Text>
      </LinearGradient>
      {thinking ? (
        <View
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: theme.colors.accentSoft,
          }}
        />
      ) : null}
    </Animated.View>
  );
}
