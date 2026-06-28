import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { MentorAvatar, Text } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import type { ChatMessage } from '@/types';
import { MarkdownMessage } from './MarkdownMessage';
import { ArtifactRenderer } from '@/components/artifacts';

/**
 * A single message in the thread. User messages are warm tinted bubbles;
 * mentor messages render full markdown with the avatar plus copy/regenerate
 * affordances. Artifacts render as cards beneath the text.
 */
export function MessageBubble({
  message,
  isStreaming,
  onRegenerate,
  onOpenPlan,
}: {
  message: ChatMessage;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onOpenPlan?: () => void;
}) {
  const theme = useTheme();
  const isUser = message.role === 'user';

  const copy = async () => {
    await Clipboard.setStringAsync(message.content);
    haptics.success();
  };

  if (isUser) {
    return (
      <Animated.View
        entering={FadeInDown.duration(220)}
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
          <Text variant="body" tint={theme.colors.bubbleUserText}>
            {message.content}
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(240)}
      style={{ flexDirection: 'row', marginVertical: theme.spacing.sm }}
    >
      <MentorAvatar size={32} />
      <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
        {message.content.length > 0 ? (
          <MarkdownMessage content={message.content} />
        ) : null}

        {message.artifact ? (
          <ArtifactRenderer artifact={message.artifact} onOpenPlan={onOpenPlan} />
        ) : null}

        {!isStreaming && message.content.length > 0 ? (
          <View style={{ flexDirection: 'row', marginTop: theme.spacing.xs, gap: theme.spacing.lg }}>
            <Pressable onPress={copy} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="copy-outline" size={15} color={theme.colors.textMuted} />
              <Text variant="caption" color="textMuted" style={{ marginLeft: 4 }}>
                Copy
              </Text>
            </Pressable>
            {onRegenerate ? (
              <Pressable
                onPress={() => {
                  haptics.selection();
                  onRegenerate();
                }}
                hitSlop={8}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Ionicons name="refresh" size={15} color={theme.colors.textMuted} />
                <Text variant="caption" color="textMuted" style={{ marginLeft: 4 }}>
                  Regenerate
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}
