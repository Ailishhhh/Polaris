import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useTheme } from '@/theme';
import { useAuth, useMentor } from '@/store';

/** Entry gate: routes to auth, onboarding, or the app based on state. */
export default function Index() {
  const { session, initialized } = useAuth();
  const { hydrated, goal } = useMentor();

  if (!initialized) return <Splash />;
  if (!session) return <Redirect href="/(auth)/sign-in" />;
  if (!hydrated) return <Splash />;
  if (!goal) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}

function Splash() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
      <ActivityIndicator color={theme.colors.accent} />
    </View>
  );
}
