import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Appear, Button, Pill, ProgressBar, Screen, Skeleton, Surface, Text, Divider } from '@/components/ui';
import { TaskCard } from '@/components/artifacts';
import { DailyBriefing } from '@/components/ai';
import { useMentor } from '@/store';
import { haptics } from '@/lib/haptics';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const prettyDate = () =>
  new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

export default function Today() {
  const theme = useTheme();
  const { profile, goal, roadmap, todayTasks, streak, momentum, refreshTodayTasks, toggleTask, skipTask } =
    useMentor();
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    if (goal && todayTasks.length === 0) {
      setLoadingTasks(true);
      refreshTodayTasks().finally(() => setLoadingTasks(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal?.id]);

  const activeMilestone = roadmap?.phases.flatMap((p) => p.milestones).find((m) => m.status === 'active');
  const currentPhase = roadmap?.phases.find((p) => p.status === 'active') ?? roadmap?.phases[0];
  const phaseTotal = currentPhase?.milestones.length ?? 0;
  const phaseDone = currentPhase?.milestones.filter((m) => m.status === 'completed').length ?? 0;
  const phasePct = phaseTotal ? Math.round((phaseDone / phaseTotal) * 100) : 0;

  const doneCount = todayTasks.filter((t) => t.status === 'done').length;
  const allDone = todayTasks.length > 0 && doneCount === todayTasks.length;

  return (
    <Screen scroll>
      {/* Header */}
      <Appear>
        <View style={{ paddingTop: theme.spacing.lg }}>
          <Text variant="overline" color="textMuted">
            {prettyDate().toUpperCase()}
          </Text>
          <Text
            style={{
              fontFamily: 'Fraunces_600SemiBold',
              fontSize: 34,
              lineHeight: 40,
              letterSpacing: -0.5,
              color: theme.colors.text,
              marginTop: 6,
            }}
          >
            {greeting()}
            {profile?.displayName ? `, ${profile.displayName}` : ''}.
          </Text>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.lg, marginBottom: theme.spacing.xs }}>
            <Pill
              label={`${streak.current} day streak`}
              tone={streak.current > 0 ? 'accent' : 'neutral'}
              icon={<Ionicons name="flame" size={13} color={streak.current > 0 ? theme.colors.accentSoftText : theme.colors.textMuted} />}
            />
            <Pill label={`${momentum} momentum`} tone="success" />
          </View>
        </View>
      </Appear>

      {/* Proactive briefing */}
      {goal ? (
        <Appear index={1}>
          <View style={{ marginBottom: theme.spacing.lg }}>
            <DailyBriefing />
          </View>
        </Appear>
      ) : null}

      {/* Current focus + phase progress */}
      {currentPhase ? (
        <Appear index={2}>
          <Surface elevated={1} style={{ marginBottom: theme.spacing.lg }}>
            <Text variant="overline" color="textMuted">
              CURRENT FOCUS
            </Text>
            <Text variant="heading" style={{ marginTop: 4 }}>
              {currentPhase.title}
            </Text>
            {activeMilestone ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.sm }}>
                <Ionicons name="flag-outline" size={16} color={theme.colors.accent} />
                <Text variant="callout" color="textSecondary" style={{ marginLeft: 6, flex: 1 }}>
                  {activeMilestone.title}
                </Text>
              </View>
            ) : null}
            {phaseTotal > 0 ? (
              <View style={{ marginTop: theme.spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text variant="caption" color="textMuted">
                    {phaseDone} of {phaseTotal} milestones
                  </Text>
                  <Text variant="caption" color="accent">
                    {phasePct}%
                  </Text>
                </View>
                <ProgressBar value={phasePct} height={6} />
              </View>
            ) : null}
          </Surface>
        </Appear>
      ) : null}

      {/* Today's tasks */}
      <Appear index={3}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
          <Text variant="heading">Today</Text>
          <View style={{ flex: 1 }} />
          {todayTasks.length > 0 ? (
            <Text variant="caption" color={allDone ? 'success' : 'textMuted'}>
              {doneCount}/{todayTasks.length} done
            </Text>
          ) : null}
        </View>

        {loadingTasks && todayTasks.length === 0 ? (
          <View>
            {[0, 1, 2].map((i) => (
              <Surface key={i} padding="md" style={{ marginBottom: theme.spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Skeleton width={26} height={26} radius={13} />
                  <View style={{ flex: 1, marginLeft: theme.spacing.md, gap: 8 }}>
                    <Skeleton width="70%" height={14} />
                    <Skeleton width="45%" height={11} />
                  </View>
                </View>
              </Surface>
            ))}
          </View>
        ) : todayTasks.length === 0 ? (
          <Surface variant="sunken" bordered={false} style={{ alignItems: 'center', paddingVertical: theme.spacing.xl }}>
            <Text variant="callout" color="textSecondary" center style={{ marginBottom: theme.spacing.md }}>
              No tasks yet for today.
            </Text>
            <Button
              label="Plan my day"
              size="sm"
              onPress={() => {
                setLoadingTasks(true);
                refreshTodayTasks().finally(() => setLoadingTasks(false));
              }}
            />
          </Surface>
        ) : (
          <>
            {todayTasks.map((t) => (
              <TaskCard key={t.id} task={t} onToggle={toggleTask} onSkip={skipTask} />
            ))}
            {allDone ? (
              <Animated.View
                entering={FadeIn.duration(400)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: theme.spacing.xs }}
              >
                <Ionicons name="sparkles" size={15} color={theme.colors.accent} />
                <Text variant="callout" color="accent" style={{ marginLeft: 6 }}>
                  All done today — momentum earned.
                </Text>
              </Animated.View>
            ) : null}
          </>
        )}
      </Appear>

      <Divider spacing={theme.spacing.xl} />

      <Appear index={4}>
        <CheckInCard />
      </Appear>
    </Screen>
  );
}

/** Daily check-in: mood + note -> adaptive mentor reply. */
function CheckInCard() {
  const theme = useTheme();
  const submitCheckIn = useMentor((s) => s.submitCheckIn);
  const [mood, setMood] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [reply, setReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const moods = ['😞', '😕', '😐', '🙂', '🤩'];

  const submit = async () => {
    setLoading(true);
    try {
      const r = await submitCheckIn(mood, note);
      setReply(r);
      haptics.success();
    } catch {
      setReply('I could not reach your mentor just now. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  if (reply) {
    return (
      <Animated.View entering={FadeIn.duration(300)}>
        <Surface elevated={1}>
          <Text variant="overline" color="textMuted">
            FROM YOUR MENTOR
          </Text>
          <Text variant="body" style={{ marginTop: theme.spacing.sm }}>
            {reply}
          </Text>
        </Surface>
      </Animated.View>
    );
  }

  return (
    <Surface elevated={1}>
      <Text variant="heading">Daily check-in</Text>
      <Text variant="callout" color="textSecondary" style={{ marginTop: 4 }}>
        How did today go? Your mentor adapts to this.
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: theme.spacing.lg }}>
        {moods.map((face, i) => {
          const selected = mood === i + 1;
          return (
            <Pressable
              key={i}
              onPress={() => {
                haptics.selection();
                setMood(i + 1);
              }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? theme.colors.accentSoft : theme.colors.surfaceSunken,
                borderWidth: selected ? 1 : 0,
                borderColor: theme.colors.accent,
              }}
            >
              <Text style={{ fontSize: 22 }}>{face}</Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Anything on your mind? (optional)"
        placeholderTextColor={theme.colors.textMuted}
        multiline
        style={{
          backgroundColor: theme.colors.surfaceSunken,
          borderRadius: theme.radii.md,
          padding: theme.spacing.md,
          minHeight: 56,
          color: theme.colors.text,
          fontFamily: 'Inter_400Regular',
          fontSize: 15,
          marginBottom: theme.spacing.lg,
          textAlignVertical: 'top',
        }}
      />

      <Button
        label="Send check-in"
        fullWidth
        loading={loading}
        disabled={mood === null}
        onPress={submit}
      />
    </Surface>
  );
}
