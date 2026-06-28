import React, { useState } from 'react';
import { TextInput, View, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { haptics } from '@/lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const MAX_HEIGHT = 140;
const MIN_HEIGHT = 24;

/**
 * The sacred composer. Grows with the input up to a max, then scrolls. A clear
 * send affordance that activates only when there's something to send and the
 * mentor isn't already replying. Supports a Stop action while streaming.
 */
export function Composer({
  onSend,
  onStop,
  isStreaming,
  placeholder = 'Message your mentor…',
  autoFocus,
}: {
  onSend: (text: string) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const theme = useTheme();
  const [value, setValue] = useState('');
  const [height, setHeight] = useState(MIN_HEIGHT);

  const canSend = value.trim().length > 0;
  const scale = useSharedValue(1);
  const sendStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const submit = () => {
    if (isStreaming) {
      onStop?.();
      return;
    }
    const text = value.trim();
    if (!text) return;
    haptics.medium();
    onSend(text);
    setValue('');
    setHeight(MIN_HEIGHT);
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.xl,
        paddingLeft: theme.spacing.lg,
        paddingRight: 6,
        paddingVertical: 6,
        ...theme.elevation(1),
      }}
    >
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        multiline
        autoFocus={autoFocus}
        onContentSizeChange={(e) =>
          setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, e.nativeEvent.contentSize.height)))
        }
        style={{
          flex: 1,
          color: theme.colors.text,
          fontFamily: 'Inter_400Regular',
          fontSize: 16,
          lineHeight: 22,
          height: height + 16,
          paddingTop: 8,
          paddingBottom: 8,
        }}
      />
      <AnimatedPressable
        onPress={submit}
        onPressIn={() => {
          scale.value = withTiming(0.88, { duration: 90 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 140 });
        }}
        disabled={!canSend && !isStreaming}
        style={[
          {
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: theme.spacing.sm,
            backgroundColor:
              canSend || isStreaming ? theme.colors.accent : theme.colors.surfaceSunken,
          },
          sendStyle,
        ]}
      >
        <Ionicons
          name={isStreaming ? 'stop' : 'arrow-up'}
          size={20}
          color={canSend || isStreaming ? theme.colors.onAccent : theme.colors.textMuted}
        />
      </AnimatedPressable>
    </View>
  );
}
