import { Tabs } from 'expo-router';
import { TabBar } from '@/components/ui';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...(props as any)} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="chat" options={{ title: 'Mentor' }} />
      <Tabs.Screen name="plan" options={{ title: 'Plan' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
    </Tabs>
  );
}
