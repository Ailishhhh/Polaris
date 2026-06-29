import React, { useEffect } from 'react';
import { Modal, Pressable, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { MentorAvatar, Text, IconButton } from '@/components/ui';
import { MarkdownMessage } from '@/components/chat';
import { useMentor } from '@/store';
import { streamCoach } from '@/lib/api';
import { useStreamedText } from '@/hooks/useStreamedText';
import { StreamingDots } from './StreamingDots';
import type { Milestone } from '@/types';

/**
 * Generative coaching, on demand. Tap a milestone -> the mentor streams a
 * concrete, level-aware mini-guide for how to actually complete it. This is the
 * AI reaching out of the chatbox and into the plan itself.
 */
export function MilestoneCoachSheet({
  milestone,
  onClose,
}: {
  milestone: Milestone | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  const currentMemory = useMentor((s) => s.currentMemory);
  const { text, streaming, error, run, reset } = useStreamedText();

  useEffect(() => {
    if (!milestone) {
      reset();
      return;
    }
    const mem = currentMemory();
    if (!mem) return;
    run((h) =>
      streamCoach(
        { memory: mem, milestoneTitle: milestone.title, milestoneDescription: milestone.description },
        h,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestone?.id]);

  return (
    <Modal visible={!!milestone} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(180)} style={{ flex: 1, backgroundColor: theme.colors.scrim }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <Animated.View
          entering={SlideInDown.springify().damping(22).mass(0.8)}
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.radii.xl,
            borderTopRightRadius: theme.radii.xl,
            paddingHorizontal: theme.spacing.xl,
            paddingTop: theme.spacing.lg,
            paddingBottom: theme.spacing.huge,
            maxHeight: '80%',
            ...theme.elevation(3),
          }}
        >
          <View style={{ alignItems: 'center', marginBottom: theme.spacing.md }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.colors.borderStrong,
              }}
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md }}>
            <MentorAvatar size={34} thinking={streaming && text.length === 0} />
            <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
              <Text variant="overline" color="textMuted">
                HOW TO CRUSH THIS
              </Text>
              <Text variant="subheading" numberOfLines={2}>
                {milestone?.title ?? ''}
              </Text>
            </View>
            <IconButton name="close" onPress={onClose} tone="soft" size={18} />
          </View>

          {text.length === 0 && streaming ? (
            <View style={{ paddingVertical: theme.spacing.md }}>
              <StreamingDots />
            </View>
          ) : error && !text ? (
            <Text variant="callout" color="textMuted">
              Couldn&apos;t reach your mentor. Try again in a moment.
            </Text>
          ) : (
            <View>
              <MarkdownMessage content={text} />
              {streaming ? (
                <Text tint={theme.colors.accent} style={{ marginTop: -8 }}>
                  ▍
                </Text>
              ) : null}
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
