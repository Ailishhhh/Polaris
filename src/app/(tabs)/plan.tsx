import { useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import { Appear, Pill, Screen, Surface, Text } from '@/components/ui';
import { RoadmapCard } from '@/components/artifacts';
import { MilestoneCoachSheet } from '@/components/ai';
import { useMentor } from '@/store';
import type { Milestone } from '@/types';

const CATEGORY_LABEL: Record<string, string> = {
  trading: 'Trading',
  art: 'Art',
  fitness: 'Fitness',
  coding: 'Coding',
  exams: 'Exams',
  startup: 'Startup',
  music: 'Music',
  language: 'Language',
  other: 'Goal',
};

export default function PlanScreen() {
  const theme = useTheme();
  const { goal, roadmap, toggleMilestone } = useMentor();
  const [coachMilestone, setCoachMilestone] = useState<Milestone | null>(null);

  return (
    <Screen scroll>
      <Appear>
        <View style={{ paddingTop: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <Text variant="overline" color="textMuted">
            THE PLAN
          </Text>
          <Text variant="title" style={{ marginTop: 4 }}>
            {goal?.title ?? 'Your roadmap'}
          </Text>
          {goal ? (
            <View style={{ marginTop: theme.spacing.sm }}>
              <Pill label={CATEGORY_LABEL[goal.category] ?? 'Goal'} tone="accent" />
            </View>
          ) : null}
        </View>
      </Appear>

      {roadmap ? (
        <Appear index={1}>
          <RoadmapCard
            roadmap={roadmap}
            onToggleMilestone={toggleMilestone}
            onCoachMilestone={setCoachMilestone}
          />
        </Appear>
      ) : (
        <Surface variant="sunken" bordered={false} style={{ alignItems: 'center', paddingVertical: theme.spacing.huge }}>
          <Text variant="callout" color="textSecondary" center>
            Your roadmap will appear here once it&apos;s generated.
          </Text>
        </Surface>
      )}

      <Text variant="caption" color="textMuted" center style={{ marginTop: theme.spacing.xl }}>
        Tap a milestone to complete it, or tap{' '}
        <Text variant="caption" color="accent">
          Coach
        </Text>{' '}
        for an AI plan to crush it.
      </Text>

      <MilestoneCoachSheet milestone={coachMilestone} onClose={() => setCoachMilestone(null)} />
    </Screen>
  );
}
