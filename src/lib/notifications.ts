import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

/**
 * Daily accountability nudges — the heartbeat of the moat. Local scheduled
 * notifications (work in a real build, not Expo Go). Foreground notifications
 * show as a banner.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const DAILY_ID = 'polaris-daily-reminder';
const PREF_KEY = 'polaris.reminderEnabled';

/** Imported once at startup so the handler is registered early. */
export function ensureNotificationsSetup() {
  /* handler set at module load above */
}

export async function isReminderEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(PREF_KEY)) === 'true';
}

async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  return status === 'granted';
}

/** Schedule a repeating daily reminder. Returns false if permission denied. */
export async function enableDailyReminder(hour = 19, minute = 0): Promise<boolean> {
  const granted = await requestPermission();
  if (!granted) return false;

  await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_ID,
    content: {
      title: 'Polaris',
      body: "A few minutes today keeps your momentum alive. What's your next step?",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
  await AsyncStorage.setItem(PREF_KEY, 'true');
  return true;
}

export async function disableDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => {});
  await AsyncStorage.setItem(PREF_KEY, 'false');
}
