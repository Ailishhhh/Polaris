import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import { MentorAvatar, Text } from '@/components/ui';
import { useMentor } from '@/store';
import { streamBriefing } from '@/lib/api';
import { useStreamedText } from '@/hooks/useStreamedText';
import { StreamingDots } from './StreamingDots';

function partLabel(): string {
  const h = new Date().getHours();
  if (h < 12) return 'MORNING BRIEFING';
  if (h < 18) return 'AFTERNOON BRIEFING';
  return 'EVENING BRIEFING';
}

/**
 * Proactive, ambient intelligence on the Today surface — the mentor noticing
 * where you are and telling you the one thing that matters right now. Streams
 * in on load. Fails silently (it's an enhancement, never a blocker).
 */
export function DailyBriefing() {
  const theme = useTheme();
  const currentMemory = useMentor((s) => s.currentMemory);
  const momentum = useMentor((s) => s.momentum);
  const { text, streaming, error, run } = useStreamedText();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    const mem = currentMemory();
    if (!mem) return;
    started.current = true;
    run((h) => streamBriefing(mem, h));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [momentum]);

  if (error && !text) return null;

  return (
    <LinearGradient
      colors={[theme.colors.accentSoft, theme.colors.surface]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: theme.radii.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.lg,
        ...theme.elevation(1),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <MentorAvatar size={26} thinking={streaming && text.length === 0} />
        <Text variant="overline" color="textMuted" style={{ marginLeft: theme.spacing.sm }}>
          POLARIS · {partLabel()}
        </Text>
      </View>
      {text.length === 0 && streaming ? (
        <StreamingDots />
      ) : (
        <Text variant="body" tint={theme.colors.text}>
          {text}
          {streaming ? <Text tint={theme.colors.accent}>▍</Text> : null}
        </Text>
      )}
    </LinearGradient>
  );
}
