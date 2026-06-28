import React from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { haptics } from '@/lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function IconButton({
  name,
  onPress,
  size = 22,
  color,
  tone = 'plain',
  accessibilityLabel,
  disabled,
  style,
}: {
  name: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  color?: string;
  tone?: 'plain' | 'soft' | 'accent';
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const dimension = size + 20;
  const bg =
    tone === 'soft'
      ? theme.colors.surfaceSunken
      : tone === 'accent'
        ? theme.colors.accent
        : 'transparent';
  const iconColor =
    color ?? (tone === 'accent' ? theme.colors.onAccent : theme.colors.textSecondary);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.9, { duration: 90 });
        haptics.selection();
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 140 });
      }}
      style={[
        {
          width: dimension,
          height: dimension,
          borderRadius: theme.radii.pill,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1,
        },
        animatedStyle,
        style,
      ]}
    >
      <Ionicons name={name} size={size} color={iconColor} />
    </AnimatedPressable>
  );
}
