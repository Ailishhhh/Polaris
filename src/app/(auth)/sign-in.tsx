import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Button, Divider, MentorAvatar, Surface, Text } from '@/components/ui';
import { useAuth } from '@/store';
import { isConfigured } from '@/lib/config';
import { haptics } from '@/lib/haptics';

/**
 * Welcome / auth — "Liquid Ink": near-monochrome, typography-led, no glass.
 * The wordmark and the type carry the weight; motion is the only flourish.
 */
export default function SignIn() {
  const theme = useTheme();
  const router = useRouter();
  const { startAnonymously, signInWithGoogle, signInWithPassword, signUpWithPassword } = useAuth();

  const [mode, setMode] = useState<'welcome' | 'email'>('welcome');
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<null | 'guest' | 'google' | 'email'>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (which: 'guest' | 'google' | 'email', fn: () => Promise<void>) => {
    setError(null);
    setBusy(which);
    try {
      await fn();
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'space-between', padding: theme.spacing.xl }}
        >
          {/* Brand — type does the talking */}
          <Animated.View entering={FadeIn.duration(650)} style={{ marginTop: theme.spacing.huge }}>
            <MentorAvatar size={56} />
            <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 44, lineHeight: 48, letterSpacing: -0.8, color: theme.colors.text, marginTop: theme.spacing.xl }}>
              Polaris
            </Text>
            <Text
              variant="body"
              color="textSecondary"
              style={{ marginTop: theme.spacing.md, maxWidth: 330, fontSize: 17, lineHeight: 26 }}
            >
              An AI mentor that learns who you are, maps the path, and walks it with you — from 0 to
              100.
            </Text>
          </Animated.View>

          {/* Actions — calm, flat, deliberate */}
          <Animated.View entering={FadeInUp.duration(600).delay(120)}>
            {!isConfigured ? (
              <View
                style={{
                  backgroundColor: theme.colors.accentSoft,
                  borderRadius: theme.radii.md,
                  padding: theme.spacing.lg,
                  marginBottom: theme.spacing.md,
                }}
              >
                <Text variant="callout" tint={theme.colors.accentSoftText}>
                  Supabase isn&apos;t configured yet. Add your keys to .env to enable sign-in.
                </Text>
              </View>
            ) : null}

            {mode === 'welcome' ? (
              <View style={{ gap: theme.spacing.md }}>
                <Button
                  label="Start your journey"
                  fullWidth
                  loading={busy === 'guest'}
                  onPress={() => run('guest', startAnonymously)}
                />
                <GoogleButton loading={busy === 'google'} onPress={() => run('google', signInWithGoogle)} />

                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
                  <View style={{ flex: 1 }}>
                    <Divider />
                  </View>
                  <Text variant="caption" color="textMuted" style={{ marginHorizontal: theme.spacing.md }}>
                    or
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Divider />
                  </View>
                </View>

                <Pressable
                  onPress={() => {
                    haptics.selection();
                    setMode('email');
                  }}
                  style={{ alignItems: 'center', paddingVertical: theme.spacing.sm }}
                >
                  <Text variant="subheading" color="text">
                    Continue with email
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Surface bordered padding="xl" style={{ gap: theme.spacing.md }}>
                <Field placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
                <Field placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
                <Button
                  label={isSignUp ? 'Create account' : 'Sign in'}
                  fullWidth
                  loading={busy === 'email'}
                  onPress={() =>
                    run('email', () =>
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
              </Surface>
            )}

            {error ? (
              <Text variant="caption" tint={theme.colors.danger} center style={{ marginTop: theme.spacing.md }}>
                {error}
              </Text>
            ) : null}

            <Text variant="caption" color="textMuted" center style={{ marginTop: theme.spacing.lg }}>
              Free to start. No pressure, no spam.
            </Text>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function GoogleButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => {
        haptics.light();
        onPress();
      }}
      disabled={loading}
      style={{
        height: 52,
        borderRadius: theme.radii.pill,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.borderStrong,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        opacity: loading ? 0.6 : 1,
      }}
    >
      <Ionicons name="logo-google" size={18} color={theme.colors.text} />
      <Text variant="subheading" color="text">
        Continue with Google
      </Text>
    </Pressable>
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
        backgroundColor: theme.colors.surfaceSunken,
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
