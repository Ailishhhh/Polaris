import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Text } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import type { Milestone } from '@/types';

export function MilestoneRow({
  milestone,
  onToggle,
  onCoach,
  last,
}: {
  milestone: Milestone;
  onToggle?: (m: Milestone) => void;
  onCoach?: (m: Milestone) => void;
  last?: boolean;
}) {
  const theme = useTheme();
  const done = milestone.status === 'completed';

  const icon = done ? 'checkmark-circle' : milestone.status === 'active' ? 'ellipse-outline' : 'lock-closed';
  const iconColor = done
    ? theme.colors.success
    : milestone.status === 'active'
      ? theme.colors.accent
      : theme.colors.textMuted;

  return (
    <Pressable
      disabled={!onToggle}
      onPress={() => {
        haptics.success();
        onToggle?.(milestone);
      }}
      style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: theme.spacing.sm }}
    >
      {/* timeline rail */}
      <View style={{ alignItems: 'center', marginRight: theme.spacing.md }}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={22} color={iconColor} />
        {!last ? (
          <View
            style={{
              width: 2,
              flex: 1,
              minHeight: 14,
              marginTop: 4,
              backgroundColor: theme.colors.border,
            }}
          />
        ) : null}
      </View>
      <View style={{ flex: 1, paddingBottom: theme.spacing.xs }}>
        <Text
          variant="subheading"
          tint={done ? theme.colors.textMuted : theme.colors.text}
          style={done ? { textDecorationLine: 'line-through' } : undefined}
        >
          {milestone.title}
        </Text>
        {milestone.description ? (
          <Text variant="callout" color="textSecondary" style={{ marginTop: 2 }}>
            {milestone.description}
          </Text>
        ) : null}
      </View>

      {/* Generative coaching trigger — the AI reaching into the plan. */}
      {onCoach ? (
        <Pressable
          hitSlop={10}
          onPress={(e) => {
            // Don't also toggle the milestone.
            e.stopPropagation?.();
            haptics.selection();
            onCoach(milestone);
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: theme.colors.accentSoft,
            borderRadius: theme.radii.pill,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: 5,
            marginLeft: theme.spacing.sm,
            marginTop: 2,
          }}
        >
          <Ionicons name="sparkles" size={12} color={theme.colors.accentSoftText} />
          <Text variant="caption" tint={theme.colors.accentSoftText}>
            Coach
          </Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}
