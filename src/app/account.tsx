import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Switch, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Appear, Button, Divider, IconButton, MentorAvatar, Screen, Surface, Text } from '@/components/ui';
import { useAuth, useMentor } from '@/store';
import { haptics } from '@/lib/haptics';
import { disableDailyReminder, enableDailyReminder, isReminderEnabled } from '@/lib/notifications';

/**
 * Account screen. For guests it's a warm "secure your journey" upgrade (email +
 * password, same user id = nothing lost). For permanent accounts it shows the
 * email and lets them sign out.
 */
export default function AccountScreen() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const upgradeAccount = useAuth((s) => s.upgradeAccount);
  const signOut = useAuth((s) => s.signOut);
  const profile = useMentor((s) => s.profile);
  const goal = useMentor((s) => s.goal);

  const isGuest = !!user?.is_anonymous;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [reminderOn, setReminderOn] = useState(false);

  useEffect(() => {
    isReminderEnabled().then(setReminderOn);
  }, []);

  const toggleReminder = async (value: boolean) => {
    haptics.selection();
    if (value) {
      const ok = await enableDailyReminder(19, 0);
      if (!ok) {
        setReminderOn(false);
        setError('Enable notifications in your phone settings to get daily reminders.');
        return;
      }
      setReminderOn(true);
    } else {
      await disableDailyReminder();
      setReminderOn(false);
    }
  };

  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  const upgrade = async () => {
    setError(null);
    if (!email.trim() || password.length < 6) {
      setError('Enter an email and a password of at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await upgradeAccount(email.trim(), password);
      haptics.success();
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your account. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <Screen edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
        <Text variant="title" style={{ flex: 1 }}>
          Account
        </Text>
        <IconButton name="close" onPress={close} tone="soft" size={18} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {isGuest && !done ? (
          <Appear>
            <LinearGradient
              colors={[theme.colors.accentSoft, theme.colors.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: theme.radii.lg,
                borderWidth: 1,
                borderColor: theme.colors.border,
                padding: theme.spacing.xl,
                ...theme.elevation(1),
              }}
            >
              <MentorAvatar size={44} />
              <Text variant="heading" style={{ marginTop: theme.spacing.md }}>
                Secure your journey
              </Text>
              <Text variant="callout" color="textSecondary" style={{ marginTop: 6 }}>
                You&apos;re exploring as a guest. Add an email so your roadmap, streaks, memory, and
                everything Polaris knows about you are saved — and you can pick up on any device.
                Nothing you&apos;ve done is lost.
              </Text>

              <View style={{ gap: theme.spacing.md, marginTop: theme.spacing.xl }}>
                <Field placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
                <Field placeholder="Password (min 6 characters)" value={password} onChangeText={setPassword} secureTextEntry />
                {error ? (
                  <Text variant="caption" tint={theme.colors.danger}>
                    {error}
                  </Text>
                ) : null}
                <Button
                  label="Save my account"
                  fullWidth
                  loading={loading}
                  icon={<Ionicons name="shield-checkmark" size={16} color={theme.colors.onAccent} />}
                  onPress={upgrade}
                />
              </View>
            </LinearGradient>
          </Appear>
        ) : null}

        {done ? (
          <Animated.View entering={FadeIn.duration(300)}>
            <Surface elevated={1} style={{ alignItems: 'center', paddingVertical: theme.spacing.xxl }}>
              <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
              <Text variant="heading" center style={{ marginTop: theme.spacing.md }}>
                You&apos;re all set{profile?.displayName ? `, ${profile.displayName}` : ''}.
              </Text>
              <Text variant="callout" color="textSecondary" center style={{ marginTop: 6, maxWidth: 280 }}>
                Your journey is saved to {email.trim()}. You can sign in on any device and pick up
                right where you left off.
              </Text>
              <Button label="Done" style={{ marginTop: theme.spacing.xl }} onPress={close} />
            </Surface>
          </Animated.View>
        ) : null}

        {!isGuest && !done ? (
          <Appear>
            <Surface elevated={1}>
              <Text variant="overline" color="textMuted">
                SIGNED IN AS
              </Text>
              <Text variant="heading" style={{ marginTop: 4 }}>
                {user?.email ?? 'Your account'}
              </Text>
              {goal ? (
                <Text variant="callout" color="textSecondary" style={{ marginTop: theme.spacing.sm }}>
                  Mentoring you toward: {goal.title}
                </Text>
              ) : null}
            </Surface>
          </Appear>
        ) : null}

        {!done ? (
          <Appear index={1}>
            <Surface elevated={1} style={{ marginTop: theme.spacing.lg, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="notifications-outline" size={20} color={theme.colors.accent} />
              <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
                <Text variant="subheading">Daily reminder</Text>
                <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                  A gentle nudge each evening to keep your streak alive.
                </Text>
              </View>
              <Switch
                value={reminderOn}
                onValueChange={toggleReminder}
                trackColor={{ false: theme.colors.surfaceSunken, true: theme.colors.accent }}
                thumbColor="#FFFFFF"
              />
            </Surface>
          </Appear>
        ) : null}

        {!done ? (
          <View style={{ marginTop: theme.spacing.xxl }}>
            <Divider spacing={theme.spacing.lg} />
            <Button label="Sign out" variant="secondary" fullWidth onPress={handleSignOut} />
          </View>
        ) : null}
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
