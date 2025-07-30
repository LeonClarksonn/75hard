import { db, tx, id, User, DailyLog } from './instant';

export class DataService {
  // User operations
  static async createUser(userData: Partial<User>): Promise<string> {
    const userId = id();
    // For demo purposes, just return the user ID
    console.log('Creating user:', userData);
    return userId;
  }

  static async updateUserPreferences(userId: string, preferences: Partial<User['preferences']>) {
    // For demo purposes, just log the preferences
    console.log('Updating user preferences:', { userId, preferences });
  }

  static async updateUserStreak(userId: string, currentStreak: number, longestStreak?: number) {
    // For demo purposes, just log the streak update
    console.log('Updating user streak:', { userId, currentStreak, longestStreak });
  }

  // Daily log operations
  static async getTodaysLog(userId: string): Promise<DailyLog | null> {
    const today = new Date().toISOString().split('T')[0];
    
    // For now, return mock data since we're using a demo setup
    // In a real app, you'd query the actual database
    return {
      id: 'demo-log',
      userId,
      date: today,
      dietFollowed: false,
      waterCompleted: false,
      waterIntakeOz: 0,
      readingCompleted: false,
      createdAt: new Date().toISOString(),
    };
  }

  static async createOrUpdateDailyLog(userId: string, logData: Partial<DailyLog>): Promise<void> {
    // For demo purposes, just log the data
    // In production, this would update the actual database
    console.log('Updating daily log:', { userId, logData });
  }

  static async updateWaterIntake(userId: string, ouncesToAdd: number): Promise<number> {
    const todaysLog = await this.getTodaysLog(userId);
    const currentIntake = todaysLog?.waterIntakeOz || 0;
    const newIntake = currentIntake + ouncesToAdd;
    
    await this.createOrUpdateDailyLog(userId, {
      waterIntakeOz: newIntake,
      waterCompleted: newIntake >= 128, // 1 gallon
    });
    
    return newIntake;
  }

  static async completeTask(userId: string, taskType: string, extraData?: any): Promise<void> {
    // For demo purposes, just log the task completion
    console.log('Completing task:', { userId, taskType, extraData });
  }

  // Reset all progress (for restart functionality)
  static async resetProgress(userId: string): Promise<void> {
    // For demo purposes, just log the reset
    console.log('Resetting progress for user:', userId);
  }
}

// Convenience functions for the demo user
export const DemoUserService = {
  getTodaysLog: () => DataService.getTodaysLog(DEMO_USER_ID),
  updateWaterIntake: (ounces: number) => DataService.updateWaterIntake(DEMO_USER_ID, ounces),
  completeTask: (taskType: string, extraData?: any) => DataService.completeTask(DEMO_USER_ID, taskType, extraData),
  updatePreferences: (prefs: Partial<User['preferences']>) => DataService.updateUserPreferences(DEMO_USER_ID, prefs),
  updateStreak: (current: number, longest?: number) => DataService.updateUserStreak(DEMO_USER_ID, current, longest),
  resetProgress: () => DataService.resetProgress(DEMO_USER_ID),
};