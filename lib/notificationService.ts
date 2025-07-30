import { Platform } from 'react-native';

// Dynamic imports to handle missing packages gracefully
let Notifications: any;
let Device: any;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
} catch (error) {
  console.warn('Notification packages not installed. Install with: npm install expo-notifications expo-device');
  // Create mock objects for development
  Notifications = {
    setNotificationHandler: () => {},
    getPermissionsAsync: () => Promise.resolve({ status: 'granted' }),
    requestPermissionsAsync: () => Promise.resolve({ status: 'granted' }),
    setNotificationChannelAsync: () => Promise.resolve(),
    scheduleNotificationAsync: () => Promise.resolve(),
    cancelScheduledNotificationAsync: () => Promise.resolve(),
    cancelAllScheduledNotificationsAsync: () => Promise.resolve(),
    getAllScheduledNotificationsAsync: () => Promise.resolve([]),
    addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
    addNotificationReceivedListener: () => ({ remove: () => {} }),
    AndroidImportance: { HIGH: 'high', DEFAULT: 'default' },
  };
  Device = {
    isDevice: true,
  };
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  private static isInitialized = false;

  // Initialize notification permissions and configuration
  static async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    if (!Device.isDevice) {
      console.log('Must use physical device for push notifications');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get notification permissions');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('75hard-reminders', {
          name: '75 Hard Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3b82f6',
        });

        await Notifications.setNotificationChannelAsync('75hard-water', {
          name: 'Water Reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 200],
          lightColor: '#06b6d4',
        });
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  // Schedule water intake reminders
  static async scheduleWaterReminders(enabled: boolean = true): Promise<void> {
    // Cancel existing water reminders
    await this.cancelNotificationsByIdentifier('water-reminder');

    if (!enabled) return;

    const waterReminderTimes = [
      { hour: 8, minute: 0 },   // 8:00 AM
      { hour: 10, minute: 30 }, // 10:30 AM
      { hour: 13, minute: 0 },  // 1:00 PM
      { hour: 15, minute: 30 }, // 3:30 PM
      { hour: 18, minute: 0 },  // 6:00 PM
      { hour: 20, minute: 0 },  // 8:00 PM
    ];

    for (let i = 0; i < waterReminderTimes.length; i++) {
      const { hour, minute } = waterReminderTimes[i];
      
      await Notifications.scheduleNotificationAsync({
        identifier: `water-reminder-${i}`,
        content: {
          title: '💧 Water Reminder',
          body: 'Time to hydrate! Keep working towards your gallon goal.',
          data: { type: 'water-reminder' },
        },
        trigger: {
          hour,
          minute,
          repeats: true,
        },
      });
    }

    console.log('Water reminders scheduled');
  }

  // Schedule end-of-day check-in reminder
  static async scheduleEndOfDayReminder(enabled: boolean = true, hour: number = 21): Promise<void> {
    await this.cancelNotificationsByIdentifier('end-of-day');

    if (!enabled) return;

    await Notifications.scheduleNotificationAsync({
      identifier: 'end-of-day',
      content: {
        title: '🎯 Daily Check-in',
        body: 'How did your 75 Hard day go? Complete any remaining tasks!',
        data: { type: 'end-of-day' },
      },
      trigger: {
        hour,
        minute: 0,
        repeats: true,
      },
    });

    console.log(`End-of-day reminder scheduled for ${hour}:00`);
  }

  // Schedule workout reminders
  static async scheduleWorkoutReminders(
    enabled: boolean = true, 
    workout1Time: { hour: number; minute: number } = { hour: 7, minute: 0 },
    workout2Time: { hour: number; minute: number } = { hour: 17, minute: 0 }
  ): Promise<void> {
    await this.cancelNotificationsByIdentifier('workout-reminder');

    if (!enabled) return;

    // Workout 1 reminder
    await Notifications.scheduleNotificationAsync({
      identifier: 'workout-reminder-1',
      content: {
        title: '🏋️ Workout 1 Time',
        body: 'Time for your first 45-minute workout of the day!',
        data: { type: 'workout-reminder', workout: 1 },
      },
      trigger: {
        hour: workout1Time.hour,
        minute: workout1Time.minute,
        repeats: true,
      },
    });

    // Workout 2 reminder
    await Notifications.scheduleNotificationAsync({
      identifier: 'workout-reminder-2',
      content: {
        title: '🌞 Outdoor Workout Time',
        body: 'Time for your outdoor workout! Get some fresh air.',
        data: { type: 'workout-reminder', workout: 2 },
      },
      trigger: {
        hour: workout2Time.hour,
        minute: workout2Time.minute,
        repeats: true,
      },
    });

    console.log('Workout reminders scheduled');
  }

  // Schedule reading reminder
  static async scheduleReadingReminder(
    enabled: boolean = true,
    time: { hour: number; minute: number } = { hour: 20, minute: 30 }
  ): Promise<void> {
    await this.cancelNotificationsByIdentifier('reading-reminder');

    if (!enabled) return;

    await Notifications.scheduleNotificationAsync({
      identifier: 'reading-reminder',
      content: {
        title: '📚 Reading Time',
        body: 'Time to read your 10 pages of non-fiction!',
        data: { type: 'reading-reminder' },
      },
      trigger: {
        hour: time.hour,
        minute: time.minute,
        repeats: true,
      },
    });

    console.log('Reading reminder scheduled');
  }

  // Send immediate motivational notification
  static async sendMotivationalNotification(message: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💪 Keep Going!',
        body: message,
        data: { type: 'motivation' },
      },
      trigger: null, // Send immediately
    });
  }

  // Send task completion celebration
  static async sendTaskCompletionNotification(taskName: string): Promise<void> {
    const messages = [
      `Great job completing ${taskName}! 🎉`,
      `${taskName} ✅ - You're crushing it!`,
      `Another step closer to 75! ${taskName} done.`,
      `${taskName} completed! Keep the momentum going! 🔥`,
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎯 Task Complete!',
        body: randomMessage,
        data: { type: 'task-completion', task: taskName },
      },
      trigger: null,
    });
  }

  // Send streak milestone notification
  static async sendStreakMilestone(days: number): Promise<void> {
    const milestones = {
      7: 'One week strong! 🔥',
      14: 'Two weeks of dedication! 💪',
      21: 'Habit forming territory! 🌟',
      30: 'One month milestone! 🎯',
      45: 'Over halfway there! 🚀',
      60: 'The final stretch! 💥',
      75: 'CHAMPION! You did it! 🏆🎉',
    };

    const message = milestones[days as keyof typeof milestones];
    if (!message) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${days} Days Complete!`,
        body: message,
        data: { type: 'streak-milestone', days },
      },
      trigger: null,
    });
  }

  // Send encouragement notification
  static async sendEncouragementNotification(fromUsername: string, message: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `💕 ${fromUsername} sent you encouragement!`,
        body: message,
        data: { type: 'encouragement', from: fromUsername },
      },
      trigger: null, // Send immediately
    });
  }

  // Cancel notifications by identifier pattern
  private static async cancelNotificationsByIdentifier(pattern: string): Promise<void> {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of scheduledNotifications) {
      if (notification.identifier.includes(pattern)) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  }

  // Cancel all 75 Hard notifications
  static async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications canceled');
  }

  // Get scheduled notification count
  static async getScheduledNotificationCount(): Promise<number> {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications.length;
  }

  // Listen for notification responses
  static addNotificationResponseListener(listener: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Listen for foreground notifications
  static addNotificationReceivedListener(listener: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(listener);
  }
}

// Default notification settings
export const DEFAULT_NOTIFICATION_SETTINGS = {
  waterReminders: true,
  workoutReminders: true,
  readingReminder: true,
  endOfDayReminder: true,
  motivationalMessages: true,
  taskCompletions: true,
  streakMilestones: true,
  workout1Time: { hour: 7, minute: 0 },
  workout2Time: { hour: 17, minute: 0 },
  readingTime: { hour: 20, minute: 30 },
  endOfDayTime: 21,
};