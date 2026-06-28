import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Button, Divider, MomentumRing, ProgressBar, Screen, Surface, Text } from '@/components/ui';
import { useAuth, useMentor } from '@/store';

function Stat({ value, label, icon }: { value: string; label: string; icon: keyof typeof Ionicons.glyphMap }) {
  const theme = useTheme();
  return (
    <Surface style={{ flex: 1, alignItems: 'center' }} padding="lg">
      <Ionicons name={icon} size={20} color={theme.colors.accent} />
      <Text variant="title" style={{ marginTop: theme.spacing.sm }}>
        {value}
      </Text>
      <Text variant="caption" color="textMuted" center>
        {label}
      </Text>
    </Surface>
  );
}

export default function ProgressScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { goal, roadmap, momentum, streak } = useMentor();
  const signOut = useAuth((s) => s.signOut);

  const milestones = roadmap?.phases.flatMap((p) => p.milestones) ?? [];
  const doneMilestones = milestones.filter((m) => m.status === 'completed').length;

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <Screen scroll>
      <View style={{ paddingTop: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
        <Text variant="overline" color="textMuted">
          YOUR PROGRESS
        </Text>
        <Text variant="title" style={{ marginTop: 4 }}>
          The journey so far
        </Text>
      </View>

      <Surface elevated={2} style={{ alignItems: 'center', paddingVertical: theme.spacing.xxl }}>
        <MomentumRing value={momentum} size={150} />
        <Text variant="callout" color="textSecondary" center style={{ marginTop: theme.spacing.lg, maxWidth: 260 }}>
          {momentum < 15
            ? 'Every journey starts with a single step. Keep showing up.'
            : momentum < 60
              ? "You're building real momentum. Stay consistent."
              : 'Incredible progress — your goal is in sight.'}
        </Text>
      </Surface>

      <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
        <Stat value={`${streak.current}`} label="day streak" icon="flame-outline" />
        <Stat value={`${streak.longest}`} label="longest streak" icon="trophy-outline" />
        <Stat value={`${doneMilestones}/${milestones.length}`} label="milestones" icon="flag-outline" />
      </View>

      {roadmap ? (
        <Surface elevated={1} style={{ marginTop: theme.spacing.lg }}>
          <Text variant="heading" style={{ marginBottom: theme.spacing.md }}>
            Phases
          </Text>
          {roadmap.phases.map((p, i) => {
            const total = p.milestones.length;
            const done = p.milestones.filter((m) => m.status === 'completed').length;
            const pct = total ? Math.round((done / total) * 100) : 0;
            return (
              <View key={p.id} style={{ marginBottom: i === roadmap.phases.length - 1 ? 0 : theme.spacing.lg }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>
                    {p.title}
                  </Text>
                  <Text variant="caption" color="textMuted">
                    {pct}%
                  </Text>
                </View>
                <ProgressBar value={pct} height={6} />
              </View>
            );
          })}
        </Surface>
      ) : null}

      <Divider spacing={theme.spacing.xl} />

      <Button label="Sign out" variant="secondary" fullWidth onPress={handleSignOut} />
      {goal ? (
        <Text variant="caption" color="textMuted" center style={{ marginTop: theme.spacing.md }}>
          Mentoring you toward: {goal.title}
        </Text>
      ) : null}
    </Screen>
  );
}
