import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Surface, Text } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import type { DailyTask } from '@/types';

export function TaskCard({
  task,
  onToggle,
  onSkip,
}: {
  task: DailyTask;
  onToggle?: (t: DailyTask) => void;
  onSkip?: (t: DailyTask) => void;
}) {
  const theme = useTheme();
  const done = task.status === 'done';
  const skipped = task.status === 'skipped';

  return (
    <Animated.View entering={FadeIn.duration(220)} layout={LinearTransition.springify()}>
      <Surface
        variant={done ? 'sunken' : 'card'}
        elevated={done ? undefined : 1}
        padding="md"
        style={{ marginBottom: theme.spacing.sm, opacity: skipped ? 0.5 : 1 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Pressable
            hitSlop={10}
            onPress={() => {
              haptics.success();
              onToggle?.(task);
            }}
            style={{ marginRight: theme.spacing.md, paddingTop: 1 }}
          >
            <Ionicons
              name={done ? 'checkmark-circle' : 'ellipse-outline'}
              size={26}
              color={done ? theme.colors.success : theme.colors.borderStrong}
            />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text
              variant="bodyMedium"
              tint={done ? theme.colors.textMuted : theme.colors.text}
              style={done ? { textDecorationLine: 'line-through' } : undefined}
            >
              {task.title}
            </Text>
            {task.detail ? (
              <Text variant="callout" color="textSecondary" style={{ marginTop: 2 }}>
                {task.detail}
              </Text>
            ) : null}
          </View>

          {!done && onSkip ? (
            <Pressable hitSlop={10} onPress={() => onSkip(task)} style={{ paddingLeft: theme.spacing.sm }}>
              <Text variant="caption" color="textMuted">
                Skip
              </Text>
            </Pressable>
          ) : null}
        </View>
      </Surface>
    </Animated.View>
  );
}
