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
import { MentorAvatar, Text } from '@/components/ui';

function Dot({ delay }: { delay: number }) {
  const theme = useTheme();
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 320, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 320, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      ),
    );
  }, [delay, t]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + t.value * 0.65,
    transform: [{ translateY: -t.value * 3 }],
  }));
  return (
    <Animated.View
      style={[
        { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.textMuted, marginRight: 4 },
        style,
      ]}
    />
  );
}

/** The elegant animated "thinking" state shown before tokens stream in. */
export function ThinkingIndicator() {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: theme.spacing.sm }}>
      <MentorAvatar size={32} thinking />
      <View
        style={{
          marginLeft: theme.spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.bubbleAssistant,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.lg,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.md,
        }}
      >
        <Dot delay={0} />
        <Dot delay={160} />
        <Dot delay={320} />
        <Text variant="caption" color="textMuted" style={{ marginLeft: 6 }}>
          thinking
        </Text>
      </View>
    </View>
  );
}
