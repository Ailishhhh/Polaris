import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Appear, MentorAvatar, Text } from '@/components/ui';
import { Thread, Composer } from '@/components/chat';
import { useMentor } from '@/store';

export default function ChatScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { messages, streamingId, isThinking, sendMessage, regenerateLast, stopStreaming } = useMentor();

  const starters = [
    'I only have 20 minutes today — what should I do?',
    "I'm feeling stuck. Help me get unstuck.",
    'Quiz me on what I learned this week.',
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <MentorAvatar size={34} thinking={isThinking} />
        <View style={{ marginLeft: theme.spacing.md }}>
          <Text variant="subheading">Your mentor</Text>
          <Text variant="caption" color="textMuted">
            {isThinking ? 'thinking…' : streamingId ? 'typing…' : 'remembers everything'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}
      >
        <View style={{ flex: 1 }}>
          <Thread
            messages={messages}
            streamingId={streamingId}
            isThinking={isThinking}
            onRegenerate={regenerateLast}
            onOpenPlan={() => router.push('/(tabs)/plan')}
            header={
              messages.length === 0 ? (
                <Appear>
                  <View style={{ paddingTop: theme.spacing.xl }}>
                    <Text variant="title">Where do you want to go today?</Text>
                    <Text variant="callout" color="textSecondary" style={{ marginTop: theme.spacing.sm }}>
                      Ask me anything — your goal, a concept, a hard day. I remember your roadmap,
                      your progress, and where you left off.
                    </Text>
                    <View style={{ marginTop: theme.spacing.xl, gap: theme.spacing.sm }}>
                      {starters.map((s) => (
                        <Pressable
                          key={s}
                          onPress={() => sendMessage(s)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: theme.spacing.md,
                            backgroundColor: theme.colors.surface,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            borderRadius: theme.radii.lg,
                            padding: theme.spacing.lg,
                            ...theme.elevation(1),
                          }}
                        >
                          <Ionicons name="sparkles-outline" size={16} color={theme.colors.accent} />
                          <Text variant="callout" tint={theme.colors.text} style={{ flex: 1 }}>
                            {s}
                          </Text>
                          <Ionicons name="arrow-forward" size={15} color={theme.colors.textMuted} />
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </Appear>
              ) : null
            }
          />
        </View>

        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.sm,
            paddingBottom: Platform.OS === 'ios' ? theme.spacing.sm : theme.spacing.md,
          }}
        >
          <Composer onSend={sendMessage} onStop={stopStreaming} isStreaming={!!streamingId} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
