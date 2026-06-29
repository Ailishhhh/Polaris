import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { haptics } from '@/lib/haptics';
import { Text } from './Text';

// Minimal shape of what we use from the navigator (avoids a hard dependency import).
interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string) => void;
  };
}

const TABS: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; iconOutline: keyof typeof Ionicons.glyphMap }> = {
  index: { label: 'Today', icon: 'sunny', iconOutline: 'sunny-outline' },
  chat: { label: 'Mentor', icon: 'chatbubble-ellipses', iconOutline: 'chatbubble-ellipses-outline' },
  plan: { label: 'Plan', icon: 'map', iconOutline: 'map-outline' },
  progress: { label: 'Progress', icon: 'trending-up', iconOutline: 'trending-up-outline' },
};

/**
 * Floating glass pill tab bar — inset, semi-transparent, hovering above the
 * content, with a spring-animated active indicator that slides between tabs.
 * Inspired by the iOS 26 / WhatsApp Liquid Glass tab bars.
 */
export function TabBar({ state, navigation }: TabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dark = theme.scheme === 'dark';
  const routes = state.routes.filter((r) => TABS[r.name]);

  const [width, setWidth] = useState(0);
  const slot = width > 0 ? width / routes.length : 0;
  const tx = useSharedValue(0);

  useEffect(() => {
    if (slot > 0) tx.value = withSpring(state.index * slot, { damping: 18, stiffness: 170, mass: 0.7 });
  }, [state.index, slot, tx]);

  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));

  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.sm,
        paddingBottom: Math.max(insets.bottom, theme.spacing.md),
        backgroundColor: 'transparent',
      }}
    >
      <BlurView
        intensity={dark ? 40 : 60}
        tint={dark ? 'dark' : 'light'}
        style={{
          height: 64,
          borderRadius: 32,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.65)',
          ...theme.elevation(3),
        }}
      >
        {/* translucent fill for legibility over any content */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: dark ? 'rgba(29,24,19,0.55)' : 'rgba(255,255,255,0.45)' },
          ]}
        />

        <View style={{ flex: 1, position: 'relative' }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {/* sliding active indicator */}
          {slot > 0 ? (
            <Animated.View style={[{ position: 'absolute', top: 8, bottom: 8, width: slot }, indicatorStyle]}>
              <View
                style={{
                  flex: 1,
                  marginHorizontal: 8,
                  borderRadius: theme.radii.pill,
                  backgroundColor: theme.colors.accentSoft,
                }}
              />
            </Animated.View>
          ) : null}

          {/* tab items */}
          <View style={{ flexDirection: 'row', flex: 1 }}>
            {routes.map((route, i) => {
              const focused = state.index === i;
              const cfg = TABS[route.name];
              const color = focused ? theme.colors.accentSoftText : theme.colors.textMuted;
              return (
                <Pressable
                  key={route.key}
                  onPress={() => {
                    haptics.selection();
                    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                    if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                  }}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }}
                >
                  <Ionicons name={focused ? cfg.icon : cfg.iconOutline} size={21} color={color} />
                  <Text
                    tint={color}
                    style={{ fontFamily: focused ? 'Inter_600SemiBold' : 'Inter_500Medium', fontSize: 10, letterSpacing: 0.2 }}
                  >
                    {cfg.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </BlurView>
    </View>
  );
}
