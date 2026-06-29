import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { Button, MentorAvatar, Screen, Text } from '@/components/ui';
import { Composer, ThinkingIndicator } from '@/components/chat';
import { useAuth, useMentor } from '@/store';
import { haptics } from '@/lib/haptics';
import type { GoalCategory } from '@/types';

type StepId = 'name' | 'goal' | 'category' | 'level' | 'time' | 'why' | 'build';

interface Turn {
  role: 'mentor' | 'user';
  text: string;
}

const CATEGORIES: { label: string; value: GoalCategory }[] = [
  { label: 'Trading', value: 'trading' },
  { label: 'Art', value: 'art' },
  { label: 'Fitness', value: 'fitness' },
  { label: 'Coding', value: 'coding' },
  { label: 'Exams', value: 'exams' },
  { label: 'Startup', value: 'startup' },
  { label: 'Music', value: 'music' },
  { label: 'Language', value: 'language' },
  { label: 'Something else', value: 'other' },
];

const LEVELS = ['Total beginner', 'I know some basics', 'Intermediate', 'Pretty advanced'];
const TIME = [
  { label: '1–2 hrs / week', hours: 2 },
  { label: '3–5 hrs / week', hours: 4 },
  { label: '6–10 hrs / week', hours: 8 },
  { label: '10+ hrs / week', hours: 12 },
];

/**
 * Conversational onboarding. The mentor asks a few warm questions, captures the
 * goal + context, then generates the roadmap and drops the user into the app.
 */
export default function Onboarding() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const completeOnboarding = useMentor((s) => s.completeOnboarding);

  const [step, setStep] = useState<StepId>('name');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [typing, setTyping] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const answers = useRef<{
    displayName: string | null;
    title: string;
    category: GoalCategory;
    level: string;
    weeklyHours: number;
    motivation: string | null;
  }>({
    displayName: null,
    title: '',
    category: 'other',
    level: '',
    weeklyHours: 4,
    motivation: null,
  });

  const prompts: Record<StepId, string> = {
    name: "Hey — I'm Polaris, your mentor. Before we start, what should I call you?",
    goal: 'Love it. So tell me — what do you want to get good at? Be as specific as you like.',
    category: 'Got it. Which of these fits best?',
    level: 'And honestly — where are you starting from today?',
    time: 'How much time can you realistically give this each week?',
    why: "Last thing: why does this matter to you right now? (This keeps you going on hard days — but you can skip.)",
    build: '',
  };

  // Push the mentor's prompt for a step with a brief "typing" beat.
  const askStep = (id: StepId) => {
    setTyping(true);
    setTimeout(() => {
      setTurns((t) => [...t, { role: 'mentor', text: prompts[id] }]);
      setTyping(false);
    }, 650);
  };

  useEffect(() => {
    askStep('name');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [turns, typing]);

  const advance = (next: StepId, userText: string) => {
    setTurns((t) => [...t, { role: 'user', text: userText }]);
    setStep(next);
    if (next !== 'build') askStep(next);
  };

  const onText = (text: string) => {
    if (step === 'name') {
      answers.current.displayName = text;
      advance('goal', text);
    } else if (step === 'goal') {
      answers.current.title = text;
      advance('category', text);
    } else if (step === 'why') {
      answers.current.motivation = text;
      void build(text);
    }
  };

  const build = async (whyText: string | null) => {
    setTurns((t) => [...t, ...(whyText ? [{ role: 'user' as const, text: whyText }] : [])]);
    setStep('build');
    setTyping(true);
    setError(null);
    if (!user) return;
    try {
      await completeOnboarding(user.id, {
        displayName: answers.current.displayName,
        age: null,
        title: answers.current.title,
        summary: answers.current.title,
        category: answers.current.category,
        context: {
          level: answers.current.level || null,
          weeklyHours: answers.current.weeklyHours,
          motivation: answers.current.motivation,
          constraints: null,
          targetDate: null,
        },
      });
      haptics.success();
      router.replace('/(tabs)');
    } catch (e) {
      setTyping(false);
      const detail = e instanceof Error ? e.message : '';
      setError(
        detail
          ? `Couldn't build your roadmap. ${detail}`
          : 'Couldn\'t build your roadmap. Check your connection and try again.',
      );
    }
  };

  return (
    <Screen edges={['top', 'bottom']} padded={false}>
      <View style={{ paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.md }}>
        <Text variant="overline" color="textMuted">
          GETTING STARTED
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {turns.map((t, i) =>
          t.role === 'mentor' ? (
            <Animated.View
              key={i}
              entering={FadeInDown.duration(260)}
              style={{ flexDirection: 'row', marginVertical: theme.spacing.sm }}
            >
              <MentorAvatar size={30} />
              <View style={{ flex: 1, marginLeft: theme.spacing.md, paddingTop: 2 }}>
                <Text variant="body">{t.text}</Text>
              </View>
            </Animated.View>
          ) : (
            <Animated.View
              key={i}
              entering={FadeInDown.duration(220)}
              style={{ alignItems: 'flex-end', marginVertical: theme.spacing.xs }}
            >
              <View
                style={{
                  backgroundColor: theme.colors.bubbleUser,
                  borderRadius: theme.radii.xl,
                  borderTopRightRadius: theme.radii.sm,
                  paddingHorizontal: theme.spacing.lg,
                  paddingVertical: theme.spacing.md,
                  maxWidth: '85%',
                }}
              >
                <Text tint={theme.colors.bubbleUserText}>{t.text}</Text>
              </View>
            </Animated.View>
          ),
        )}
        {typing ? <ThinkingIndicator /> : null}

        {step === 'build' && !error ? (
          <View style={{ alignItems: 'center', marginTop: theme.spacing.xxl }}>
            <Text variant="heading" center>
              Building your roadmap…
            </Text>
            <Text variant="callout" color="textSecondary" center style={{ marginTop: theme.spacing.sm }}>
              Turning your goal into phases, milestones, and a first day.
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.md }}>
            <Text variant="callout" tint={theme.colors.danger}>
              {error}
            </Text>
            <Button label="Try again" onPress={() => build(null)} />
          </View>
        ) : null}
      </ScrollView>

      {/* Input zone adapts to the current step. */}
      {!typing && step !== 'build' ? (
        <View style={{ paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.md }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {step === 'category' ? (
              <ChipGroup
                options={CATEGORIES.map((c) => c.label)}
                onSelect={(label) => {
                  const found = CATEGORIES.find((c) => c.label === label)!;
                  answers.current.category = found.value;
                  advance('level', label);
                }}
              />
            ) : step === 'level' ? (
              <ChipGroup
                options={LEVELS}
                onSelect={(label) => {
                  answers.current.level = label;
                  advance('time', label);
                }}
              />
            ) : step === 'time' ? (
              <ChipGroup
                options={TIME.map((t) => t.label)}
                onSelect={(label) => {
                  const found = TIME.find((t) => t.label === label)!;
                  answers.current.weeklyHours = found.hours;
                  advance('why', label);
                }}
              />
            ) : step === 'why' ? (
              <View>
                <Composer
                  onSend={onText}
                  placeholder="Why this matters…"
                  autoFocus
                />
                <Pressable onPress={() => build(null)} style={{ alignSelf: 'center', paddingTop: theme.spacing.md }}>
                  <Text variant="caption" color="textMuted">
                    Skip for now
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Composer
                onSend={onText}
                placeholder={step === 'name' ? 'Your name…' : 'Type your answer…'}
                autoFocus
              />
            )}
          </KeyboardAvoidingView>
        </View>
      ) : null}
    </Screen>
  );
}

function ChipGroup({
  options,
  onSelect,
}: {
  options: string[];
  onSelect: (value: string) => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
      {options.map((opt) => (
        <Pressable
          key={opt}
          onPress={() => {
            haptics.selection();
            onSelect(opt);
          }}
          style={{
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.pill,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
          }}
        >
          <Text variant="bodyMedium">{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}
