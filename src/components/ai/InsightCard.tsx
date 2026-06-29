import React, { useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Surface, Text } from '@/components/ui';
import { useMentor } from '@/store';
import { streamInsight } from '@/lib/api';
import { useStreamedText } from '@/hooks/useStreamedText';
import { haptics } from '@/lib/haptics';
import { StreamingDots } from './StreamingDots';

/**
 * A reflective, streamed read on the user's progress — honest, specific, and
 * tied to their real momentum/streak. Refreshable.
 */
export function InsightCard() {
  const theme = useTheme();
  const currentMemory = useMentor((s) => s.currentMemory);
  const { text, streaming, error, run } = useStreamedText();
  const started = useRef(false);

  const start = () => {
    const mem = currentMemory();
    if (mem) run((h) => streamInsight(mem, h));
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Surface elevated={1}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <Ionicons name="sparkles" size={15} color={theme.colors.accent} />
        <Text variant="overline" color="textMuted" style={{ marginLeft: 6, flex: 1 }}>
          POLARIS · REFLECTION
        </Text>
        <Pressable
          hitSlop={10}
          disabled={streaming}
          onPress={() => {
            haptics.selection();
            start();
          }}
        >
          <Ionicons
            name="refresh"
            size={16}
            color={streaming ? theme.colors.textMuted : theme.colors.textSecondary}
          />
        </Pressable>
      </View>
      {text.length === 0 && streaming ? (
        <StreamingDots />
      ) : error && !text ? (
        <Text variant="callout" color="textMuted">
          Couldn&apos;t load a reflection right now.
        </Text>
      ) : (
        <Text variant="body">
          {text}
          {streaming ? <Text tint={theme.colors.accent}>▍</Text> : null}
        </Text>
      )}
    </Surface>
  );
}
