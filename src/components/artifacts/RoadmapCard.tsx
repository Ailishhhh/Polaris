import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Surface, Text, Pill, Divider, ProgressBar } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import type { Milestone, Phase, Roadmap } from '@/types';
import { MilestoneRow } from './MilestoneRow';

function phaseProgress(phase: Phase): number {
  if (phase.milestones.length === 0) return 0;
  const done = phase.milestones.filter((m) => m.status === 'completed').length;
  return Math.round((done / phase.milestones.length) * 100);
}

function PhaseBlock({
  phase,
  index,
  defaultOpen,
  onToggleMilestone,
}: {
  phase: Phase;
  index: number;
  defaultOpen?: boolean;
  onToggleMilestone?: (m: Milestone) => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(defaultOpen ?? index === 0);
  const progress = phaseProgress(phase);
  const complete = progress === 100;

  return (
    <View style={{ marginBottom: theme.spacing.sm }}>
      <Pressable
        onPress={() => {
          haptics.selection();
          setOpen((o) => !o);
        }}
        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.sm }}
      >
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: complete ? theme.colors.success : theme.colors.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: theme.spacing.md,
          }}
        >
          {complete ? (
            <Ionicons name="checkmark" size={18} color="#fff" />
          ) : (
            <Text variant="label" tint={theme.colors.accentSoftText}>
              {index + 1}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="subheading">{phase.title}</Text>
          <Text variant="caption" color="textMuted">
            {phase.milestones.filter((m) => m.status === 'completed').length}/
            {phase.milestones.length} milestones
          </Text>
        </View>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.colors.textMuted}
        />
      </Pressable>

      <View style={{ marginLeft: 6, marginBottom: theme.spacing.sm }}>
        <ProgressBar value={progress} height={6} />
      </View>

      {open ? (
        <Animated.View entering={FadeIn.duration(180)} style={{ paddingLeft: theme.spacing.xs }}>
          {phase.description ? (
            <Text variant="callout" color="textSecondary" style={{ marginBottom: theme.spacing.xs }}>
              {phase.description}
            </Text>
          ) : null}
          {phase.milestones.map((m, i) => (
            <MilestoneRow
              key={m.id}
              milestone={m}
              onToggle={onToggleMilestone}
              last={i === phase.milestones.length - 1}
            />
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

/**
 * The roadmap artifact. Renders inline in the chat thread (compact) and as the
 * full interactive plan in the Plan view. Tapping a milestone toggles it when
 * `onToggleMilestone` is provided.
 */
export function RoadmapCard({
  roadmap,
  compact = false,
  onToggleMilestone,
  onOpenPlan,
}: {
  roadmap: Roadmap;
  compact?: boolean;
  onToggleMilestone?: (m: Milestone) => void;
  onOpenPlan?: () => void;
}) {
  const theme = useTheme();
  const totalMilestones = roadmap.phases.reduce((n, p) => n + p.milestones.length, 0);
  const doneMilestones = roadmap.phases.reduce(
    (n, p) => n + p.milestones.filter((m) => m.status === 'completed').length,
    0,
  );
  const overall = totalMilestones ? Math.round((doneMilestones / totalMilestones) * 100) : 0;

  return (
    <Surface elevated={1} style={{ marginVertical: theme.spacing.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <Ionicons name="map-outline" size={18} color={theme.colors.accent} />
        <Text variant="overline" color="textMuted" style={{ marginLeft: 6 }}>
          YOUR ROADMAP
        </Text>
        <View style={{ flex: 1 }} />
        <Pill label={`${roadmap.phases.length} phases`} tone="accent" />
      </View>

      <Text variant="heading" style={{ marginBottom: theme.spacing.xs }}>
        {roadmap.overview}
      </Text>

      <View style={{ marginVertical: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text variant="caption" color="textMuted">
            {doneMilestones} of {totalMilestones} milestones
          </Text>
          <Text variant="caption" color="accent">
            {overall}%
          </Text>
        </View>
        <ProgressBar value={overall} />
      </View>

      <Divider spacing={theme.spacing.sm} />

      {(compact ? roadmap.phases.slice(0, 2) : roadmap.phases).map((p, i) => (
        <PhaseBlock
          key={p.id}
          phase={p}
          index={i}
          defaultOpen={!compact && i === 0}
          onToggleMilestone={onToggleMilestone}
        />
      ))}

      {compact && (onOpenPlan || roadmap.phases.length > 2) ? (
        <Pressable
          onPress={() => {
            haptics.selection();
            onOpenPlan?.();
          }}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: theme.spacing.sm }}
        >
          <Text variant="label" color="accent">
            View full plan
          </Text>
          <Ionicons name="arrow-forward" size={15} color={theme.colors.accent} style={{ marginLeft: 4 }} />
        </Pressable>
      ) : null}
    </Surface>
  );
}
