import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { haptics } from '@/lib/haptics';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  haptic?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth,
  icon,
  style,
  haptic = true,
}: ButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isDisabled = disabled || loading;

  const heights: Record<Size, number> = { sm: 38, md: 48, lg: 56 };
  const paddings: Record<Size, number> = { sm: theme.spacing.lg, md: theme.spacing.xl, lg: theme.spacing.xxl };

  const surface: Record<Variant, ViewStyle> = {
    primary: { backgroundColor: theme.colors.accent },
    secondary: { backgroundColor: theme.colors.surfaceSunken, borderWidth: 1, borderColor: theme.colors.border },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: theme.colors.danger },
  };

  const textTint: Record<Variant, string> = {
    primary: theme.colors.onAccent,
    secondary: theme.colors.text,
    ghost: theme.colors.accent,
    danger: '#FFFFFF',
  };

  // The hero action glows in its own accent so it's unmistakably primary.
  const glow: Record<Variant, ViewStyle> = {
    primary: {
      shadowColor: theme.colors.accent,
      shadowOpacity: 0.45,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    danger: {
      shadowColor: theme.colors.danger,
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 },
      elevation: 6,
    },
    secondary: {},
    ghost: {},
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 90 });
        if (haptic) haptics.light();
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 140 });
      }}
      style={[
        styles.base,
        surface[variant],
        {
          height: heights[size],
          paddingHorizontal: paddings[size],
          borderRadius: theme.radii.pill,
          opacity: isDisabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        isDisabled ? null : glow[variant],
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textTint[variant]} />
      ) : (
        <View style={styles.row}>
          {icon ? <View style={{ marginRight: theme.spacing.sm }}>{icon}</View> : null}
          <Text variant={size === 'sm' ? 'subheading' : 'subheading'} tint={textTint[variant]}>
            {label}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: { justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
