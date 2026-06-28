import React, { useCallback, useRef } from 'react';
import { View } from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useTheme } from '@/theme';
import type { ChatMessage } from '@/types';
import { MessageBubble } from './MessageBubble';
import { ThinkingIndicator } from './ThinkingIndicator';

type Row =
  | { kind: 'message'; message: ChatMessage }
  | { kind: 'thinking' }
  | { kind: 'header'; node: React.ReactNode };

/**
 * The conversation thread. Renders messages with FlashList, shows the thinking
 * state while waiting for the first token, and keeps the latest content in
 * view as the mentor streams.
 */
export function Thread({
  messages,
  streamingId,
  isThinking,
  onRegenerate,
  onOpenPlan,
  header,
}: {
  messages: ChatMessage[];
  streamingId?: string | null;
  isThinking?: boolean;
  onRegenerate?: () => void;
  onOpenPlan?: () => void;
  header?: React.ReactNode;
}) {
  const theme = useTheme();
  const listRef = useRef<FlashListRef<Row>>(null);

  const rows: Row[] = [
    ...(header ? [{ kind: 'header', node: header } as Row] : []),
    ...messages.map((m) => ({ kind: 'message', message: m }) as Row),
    ...(isThinking ? [{ kind: 'thinking' } as Row] : []),
  ];

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Row }) => {
      if (item.kind === 'header') return <View>{item.node}</View>;
      if (item.kind === 'thinking') return <ThinkingIndicator />;
      return (
        <MessageBubble
          message={item.message}
          isStreaming={item.message.id === streamingId}
          onRegenerate={
            item.message.role === 'assistant' && item.message.id !== streamingId
              ? onRegenerate
              : undefined
          }
          onOpenPlan={onOpenPlan}
        />
      );
    },
    [streamingId, onRegenerate, onOpenPlan],
  );

  return (
    <FlashList
      ref={listRef}
      data={rows}
      renderItem={renderItem}
      keyExtractor={(item, i) =>
        item.kind === 'message' ? item.message.id : `${item.kind}-${i}`
      }
      contentContainerStyle={{
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.xxl,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      onContentSizeChange={scrollToEnd}
    />
  );
}
