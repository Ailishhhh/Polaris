import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Appear, Button, Divider, MomentumRing, ProgressBar, Screen, Surface, Text } from '@/components/ui';
import { InsightCard } from '@/components/ai';
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
  const user = useAuth((s) => s.user);
  const isGuest = !!user?.is_anonymous;

  const milestones = roadmap?.phases.flatMap((p) => p.milestones) ?? [];
  const doneMilestones = milestones.filter((m) => m.status === 'completed').length;

  return (
    <Screen scroll>
      <View style={{ paddingTop: theme.spacing.lg, marginBottom: theme.spacing.lg, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text variant="overline" color="textMuted">
            YOUR PROGRESS
          </Text>
          <Text variant="title" style={{ marginTop: 4 }}>
            The journey so far
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/account')}
          hitSlop={10}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.surfaceSunken,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <Ionicons name="person-outline" size={18} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      {isGuest ? (
        <Appear>
          <Pressable onPress={() => router.push('/account')}>
            <LinearGradient
              colors={[theme.colors.accentSoft, theme.colors.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: theme.radii.lg,
                borderWidth: 1,
                borderColor: theme.colors.border,
                padding: theme.spacing.lg,
                marginBottom: theme.spacing.lg,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="shield-checkmark-outline" size={22} color={theme.colors.accent} />
              <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
                <Text variant="subheading">Secure your journey</Text>
                <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                  You&apos;re a guest — add an email so you never lose your progress.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </LinearGradient>
          </Pressable>
        </Appear>
      ) : null}

      <Appear index={1}>
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
      </Appear>

      <Appear index={2}>
        <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
          <Stat value={`${streak.current}`} label="day streak" icon="flame-outline" />
          <Stat value={`${streak.longest}`} label="longest streak" icon="trophy-outline" />
          <Stat value={`${doneMilestones}/${milestones.length}`} label="milestones" icon="flag-outline" />
        </View>
      </Appear>

      {goal ? (
        <Appear index={3}>
          <View style={{ marginTop: theme.spacing.lg }}>
            <InsightCard />
          </View>
        </Appear>
      ) : null}

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

      <Button
        label="Account & settings"
        variant="secondary"
        fullWidth
        onPress={() => router.push('/account')}
      />
      {goal ? (
        <Text variant="caption" color="textMuted" center style={{ marginTop: theme.spacing.md }}>
          Mentoring you toward: {goal.title}
        </Text>
      ) : null}
    </Screen>
  );
}
