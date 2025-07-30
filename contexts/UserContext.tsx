import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '@/lib/instant';
import { DemoUserService } from '@/lib/dataService';
import { NotificationService, DEFAULT_NOTIFICATION_SETTINGS } from '@/lib/notificationService';

type NotificationSettings = {
  waterReminders: boolean;
  workoutReminders: boolean;
  readingReminder: boolean;
  endOfDayReminder: boolean;
  motivationalMessages: boolean;
  taskCompletions: boolean;
  streakMilestones: boolean;
  workout1Time: { hour: number; minute: number };
  workout2Time: { hour: number; minute: number };
  readingTime: { hour: number; minute: number };
  endOfDayTime: number;
};

type UserPreferences = {
  useMetricUnits: boolean;
  notificationsEnabled: boolean;
  notifications: NotificationSettings;
};

type UserContextType = {
  preferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  currentWaterIntake: number;
  addWaterIntake: (amount: number, unit: 'oz' | 'ml') => Promise<void>;
  resetWaterIntake: () => void;
  initializeNotifications: () => Promise<boolean>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

type UserProviderProps = {
  children: ReactNode;
};

export function UserProvider({ children }: UserProviderProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    useMetricUnits: false,
    notificationsEnabled: true,
    notifications: DEFAULT_NOTIFICATION_SETTINGS,
  });
  const [currentWaterIntake, setCurrentWaterIntake] = useState(0); // Always store in oz

  // Helper functions for unit conversion
  const ozToMl = (oz: number) => Math.round(oz * 29.5735);
  const mlToOz = (ml: number) => ml / 29.5735;
  const ozToLiters = (oz: number) => oz * 0.0295735;

  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    const updatedPrefs = { ...preferences, ...newPrefs };
    setPreferences(updatedPrefs);
    
    // If notifications were toggled, update notification scheduling
    if ('notificationsEnabled' in newPrefs) {
      await updateNotificationScheduling(updatedPrefs);
    }
    
    console.log('Updated preferences:', updatedPrefs);
  };

  const updateNotificationSettings = async (newSettings: Partial<NotificationSettings>) => {
    const updatedNotifications = { ...preferences.notifications, ...newSettings };
    const updatedPrefs = { 
      ...preferences, 
      notifications: updatedNotifications 
    };
    
    setPreferences(updatedPrefs);
    
    // Update notification scheduling if notifications are enabled
    if (preferences.notificationsEnabled) {
      await updateNotificationScheduling(updatedPrefs);
    }
    
    console.log('Updated notification settings:', updatedNotifications);
  };

  const updateNotificationScheduling = async (prefs: UserPreferences) => {
    if (!prefs.notificationsEnabled) {
      await NotificationService.cancelAllNotifications();
      return;
    }

    const { notifications } = prefs;
    
    // Schedule different types of reminders based on settings
    await NotificationService.scheduleWaterReminders(notifications.waterReminders);
    await NotificationService.scheduleWorkoutReminders(
      notifications.workoutReminders,
      notifications.workout1Time,
      notifications.workout2Time
    );
    await NotificationService.scheduleReadingReminder(
      notifications.readingReminder,
      notifications.readingTime
    );
    await NotificationService.scheduleEndOfDayReminder(
      notifications.endOfDayReminder,
      notifications.endOfDayTime
    );
  };

  const initializeNotifications = async (): Promise<boolean> => {
    const success = await NotificationService.initialize();
    
    if (success && preferences.notificationsEnabled) {
      await updateNotificationScheduling(preferences);
    }
    
    return success;
  };

  const addWaterIntake = async (amount: number, unit: 'oz' | 'ml') => {
    // Convert to oz if needed (we store everything in oz)
    const ouncesToAdd = unit === 'ml' ? mlToOz(amount) : amount;
    
    // For now, just update local state
    const newTotal = currentWaterIntake + ouncesToAdd;
    setCurrentWaterIntake(newTotal);
    
    console.log('Added water:', { amount, unit, ouncesToAdd, newTotal });
  };

  const resetWaterIntake = () => {
    setCurrentWaterIntake(0);
  };

  // Load initial data (for now using local state)
  useEffect(() => {
    console.log('User context initialized');
  }, []);

  const value: UserContextType = {
    preferences,
    updatePreferences,
    updateNotificationSettings,
    currentWaterIntake,
    addWaterIntake,
    resetWaterIntake,
    initializeNotifications,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Helper functions that can be used throughout the app
export const WaterUtils = {
  ozToMl: (oz: number) => Math.round(oz * 29.5735),
  mlToOz: (ml: number) => ml / 29.5735,
  ozToLiters: (oz: number) => (oz * 0.0295735).toFixed(1),
  getGoalInUnit: (useMetric: boolean) => useMetric ? '3.8L' : '128 oz',
  getGoalInOz: () => 128,
  formatWaterAmount: (oz: number, useMetric: boolean) => {
    if (useMetric) {
      const ml = Math.round(oz * 29.5735);
      if (ml >= 1000) {
        return `${(ml / 1000).toFixed(1)}L`;
      }
      return `${ml}ml`;
    }
    return `${Math.round(oz)} oz`;
  },
};