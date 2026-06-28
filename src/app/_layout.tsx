import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useAppFonts, useTheme } from '@/theme';
import { useAuth, useMentor } from '@/store';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Navigator() {
  const theme = useTheme();
  const fontsLoaded = useAppFonts();
  const initialized = useAuth((s) => s.initialized);
  const initAuth = useAuth((s) => s.init);
  const user = useAuth((s) => s.user);
  const hydrate = useMentor((s) => s.hydrate);
  const reset = useMentor((s) => s.reset);

  // Wire up the auth listener once.
  useEffect(() => initAuth(), [initAuth]);

  // Load (or clear) the user's journey whenever the signed-in user changes.
  useEffect(() => {
    if (user) hydrate(user.id);
    else reset();
  }, [user, hydrate, reset]);

  const ready = fontsLoaded && initialized;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <Navigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
