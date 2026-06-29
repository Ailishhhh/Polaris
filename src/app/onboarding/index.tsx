import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { AmbientBackground, Button, MentorAvatar, Text } from '@/components/ui';
import { Composer, MarkdownMessage, ThinkingIndicator } from '@/components/chat';
import { useAuth, useMentor } from '@/store';
import { streamOnboarding } from '@/lib/api';
import { haptics } from '@/lib/haptics';
import type { GoalCategory, OnboardingSketch } from '@/types';

interface Turn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const VALID_CATEGORIES: GoalCategory[] = [
  'trading', 'art', 'fitness', 'coding', 'exams', 'startup', 'music', 'language', 'other',
];

const OPENER =
  "Hey — I'm Polaris. Think of me as a mentor in your corner.\n\nWhat's something you want to get better at? Or if there's something on your mind right now, just say it.";

/**
 * Organic onboarding. No forms — a real conversation. Polaris chats, helps on
 * demand, and quietly infers the user's goal/level/time/why. A "Build my plan"
 * affordance appears only once it understands a goal; nothing is forced.
 */
export default function Onboarding() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuth((s) => s.user);
  const completeOnboarding = useMentor((s) => s.completeOnboarding);

  const [turns, setTurns] = useState<Turn[]>([
    { id: 'opener', role: 'assistant', content: OPENER },
  ]);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [sketch, setSketch] = useState<OnboardingSketch | null>(null);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const scrollEnd = () =>
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

  const send = async (text: string) => {
    const history = turns.map((t) => ({ role: t.role, content: t.content }));
    const userTurn: Turn = { id: `u-${Date.now()}`, role: 'user', content: text };
    const replyId = `a-${Date.now()}`;
    setTurns((t) => [...t, userTurn, { id: replyId, role: 'assistant', content: '' }]);
    setStreamingId(replyId);
    setThinking(true);
    setError(null);
    scrollEnd();

    try {
      await streamOnboarding(
        { history, message: text },
        {
          onToken: (chunk) => {
            setThinking(false);
            setTurns((t) =>
              t.map((x) => (x.id === replyId ? { ...x, content: x.content + chunk } : x)),
            );
            scrollEnd();
          },
          onProfile: (s) => setSketch(s),
        },
      );
    } catch {
      setError('I lost the connection for a second. Try sending that again.');
    } finally {
      setStreamingId(null);
      setThinking(false);
    }
  };

  const canBuild = !!sketch?.goalTitle && !building;

  const build = async () => {
    if (!user || !sketch?.goalTitle) return;
    setBuilding(true);
    setError(null);
    haptics.medium();
    const category: GoalCategory =
      sketch.category && VALID_CATEGORIES.includes(sketch.category) ? sketch.category : 'other';
    try {
      await completeOnboarding(user.id, {
        displayName: sketch.displayName,
        age: null,
        title: sketch.goalTitle,
        summary: sketch.goalTitle,
        category,
        context: {
          level: sketch.level,
          weeklyHours: sketch.weeklyHours,
          motivation: sketch.motivation,
          constraints: null,
          targetDate: null,
        },
        transcript: turns.map((t) => ({ role: t.role, content: t.content })),
      });
      haptics.success();
      router.replace('/(tabs)');
    } catch (e) {
      setBuilding(false);
      setError(e instanceof Error ? e.message : 'Could not build your plan. Try again.');
    }
  };

  if (building) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <AmbientBackground />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xxl }}>
          <MentorAvatar size={64} thinking />
          <Text variant="title" center style={{ marginTop: theme.spacing.xl }}>
            Mapping your path…
          </Text>
          <Text variant="callout" color="textSecondary" center style={{ marginTop: theme.spacing.sm }}>
            Turning everything you told me into phases, milestones, and a first day.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
      <AmbientBackground />
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.md,
        }}
      >
        <MentorAvatar size={34} thinking={thinking} />
        <View style={{ marginLeft: theme.spacing.md }}>
          <Text variant="subheading">Polaris</Text>
          <Text variant="caption" color="textMuted">
            {thinking ? 'thinking…' : streamingId ? 'typing…' : 'getting to know you'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.xl,
            paddingTop: theme.spacing.sm,
            paddingBottom: theme.spacing.xl,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollEnd}
        >
          {turns.map((t) =>
            t.role === 'assistant' ? (
              <Animated.View
                key={t.id}
                entering={FadeInDown.duration(300)}
                style={{ flexDirection: 'row', marginVertical: theme.spacing.sm }}
              >
                <MentorAvatar size={30} />
                <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
                  {t.content.length > 0 ? (
                    <MarkdownMessage content={t.content} />
                  ) : (
                    <View style={{ height: 4 }} />
                  )}
                  {streamingId === t.id && t.content.length > 0 ? (
                    <Text tint={theme.colors.accent} style={{ marginTop: -6 }}>
                      ▍
                    </Text>
                  ) : null}
                </View>
              </Animated.View>
            ) : (
              <Animated.View
                key={t.id}
                entering={FadeInDown.duration(240)}
                style={{ alignItems: 'flex-end', marginVertical: theme.spacing.xs }}
              >
                <View
                  style={{
                    maxWidth: '85%',
                    backgroundColor: theme.colors.bubbleUser,
                    borderRadius: theme.radii.xl,
                    borderTopRightRadius: theme.radii.sm,
                    paddingHorizontal: theme.spacing.lg,
                    paddingVertical: theme.spacing.md,
                  }}
                >
                  <Text tint={theme.colors.bubbleUserText}>{t.content}</Text>
                </View>
              </Animated.View>
            ),
          )}
          {thinking ? <ThinkingIndicator /> : null}
          {error ? (
            <Text variant="caption" tint={theme.colors.danger} style={{ marginTop: theme.spacing.sm }}>
              {error}
            </Text>
          ) : null}
        </ScrollView>

        {/* Build affordance — appears only once Polaris understands a goal. */}
        {canBuild ? (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={{ paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.sm }}
          >
            <Button
              label="Build my plan"
              fullWidth
              icon={<Ionicons name="sparkles" size={16} color={theme.colors.onAccent} />}
              onPress={build}
            />
            <Text variant="caption" color="textMuted" center style={{ marginTop: 6 }}>
              or keep chatting — I&apos;ll map it whenever you&apos;re ready
            </Text>
          </Animated.View>
        ) : null}

        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.sm,
            paddingBottom: Platform.OS === 'ios' ? theme.spacing.sm : theme.spacing.md,
          }}
        >
          <Composer
            onSend={send}
            isStreaming={!!streamingId}
            placeholder="Talk to Polaris…"
            autoFocus
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
