import { useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { Button, MentorAvatar, Screen, Text } from '@/components/ui';
import { useAuth } from '@/store';
import { isConfigured } from '@/lib/config';

/**
 * Warm first-run welcome. Growth-first: one tap to start (anonymous), with an
 * optional email path for people who want to keep their journey across devices.
 */
export default function SignIn() {
  const theme = useTheme();
  const router = useRouter();
  const { startAnonymously, signInWithPassword, signUpWithPassword } = useAuth();

  const [mode, setMode] = useState<'welcome' | 'email'>('welcome');
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setError(null);
    setLoading(true);
    try {
      await fn();
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'space-between', paddingVertical: theme.spacing.xxl }}
      >
        <Animated.View entering={FadeIn.duration(500)} style={{ marginTop: theme.spacing.huge }}>
          <MentorAvatar size={64} />
          <Text variant="display" style={{ marginTop: theme.spacing.xl }}>
            Polaris
          </Text>
          <Text variant="body" color="textSecondary" style={{ marginTop: theme.spacing.sm, maxWidth: 320 }}>
            Your AI mentor for any goal. Pick a destination — trading, art, fitness, code, exams,
            anything — and Polaris guides you from 0 to 100, one day at a time.
          </Text>
        </Animated.View>

        {!isConfigured ? (
          <View
            style={{
              backgroundColor: theme.colors.accentSoft,
              borderRadius: theme.radii.md,
              padding: theme.spacing.lg,
            }}
          >
            <Text variant="callout" tint={theme.colors.accentSoftText}>
              Supabase isn&apos;t configured yet. Add your keys to .env (see .env.example) to enable
              sign-in.
            </Text>
          </View>
        ) : null}

        <Animated.View entering={FadeInUp.duration(500).delay(120)} style={{ gap: theme.spacing.md }}>
          {mode === 'welcome' ? (
            <>
              <Button
                label="Start your journey"
                fullWidth
                loading={loading}
                onPress={() => run(startAnonymously)}
              />
              <Button
                label="I have an account"
                variant="ghost"
                fullWidth
                onPress={() => setMode('email')}
              />
            </>
          ) : (
            <View style={{ gap: theme.spacing.md }}>
              <Field
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
              <Field placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
              <Button
                label={isSignUp ? 'Create account' : 'Sign in'}
                fullWidth
                loading={loading}
                onPress={() =>
                  run(() =>
                    isSignUp
                      ? signUpWithPassword(email.trim(), password)
                      : signInWithPassword(email.trim(), password),
                  )
                }
              />
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                <Text variant="callout" color="textSecondary">
                  {isSignUp ? 'Already have an account?' : 'New here?'}
                </Text>
                <Text variant="callout" color="accent" onPress={() => setIsSignUp((v) => !v)}>
                  {isSignUp ? 'Sign in' : 'Create one'}
                </Text>
              </View>
              <Text variant="caption" color="textMuted" center onPress={() => setMode('welcome')}>
                Back
              </Text>
            </View>
          )}

          {error ? (
            <Text variant="caption" tint={theme.colors.danger} center>
              {error}
            </Text>
          ) : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Field(props: React.ComponentProps<typeof TextInput>) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.colors.textMuted}
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
      style={{
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
        color: theme.colors.text,
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
      }}
    />
  );
}
