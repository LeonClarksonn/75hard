import { db, tx, id } from './instant';
import { FriendshipService } from './friendshipServiceSimple';
import { UserMapping } from './userMapping';

export class ActivityService {
  // Log task completion
  static async logTaskCompletion(userId: string, taskName: string): Promise<void> {
    try {
      await FriendshipService.createActivity(userId, 'task_completed', {
        taskName,
        completedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log task completion:', error);
    }
  }

  // Log day completion (all tasks done)
  static async logDayCompletion(userId: string, dayNumber: number): Promise<void> {
    try {
      await FriendshipService.createActivity(userId, 'day_completed', {
        dayNumber,
        completedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log day completion:', error);
    }
  }

  // Log streak milestone
  static async logStreakMilestone(userId: string, streakDays: number): Promise<void> {
    try {
      // Only log certain milestones
      const milestones = [7, 14, 21, 30, 50, 75];
      if (milestones.includes(streakDays)) {
        await FriendshipService.createActivity(userId, 'streak_milestone', {
          streakDays,
          achievedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to log streak milestone:', error);
    }
  }

  // Update user streak in database
  static async updateUserStreak(clerkUserId: string, currentStreak: number, longestStreak: number): Promise<void> {
    try {
      // Get the InstantDB ID for the user
      const instantUserId = await UserMapping.getInstantId(clerkUserId);
      
      await db.transact([
        tx.users[instantUserId].update({
          currentStreak,
          longestStreak: Math.max(currentStreak, longestStreak),
        })
      ]);

      // Check for milestone
      await this.logStreakMilestone(clerkUserId, currentStreak);
    } catch (error) {
      console.error('Failed to update user streak:', error);
    }
  }

  // Check if all tasks are completed for today
  static async checkDayCompletion(clerkUserId: string, todaysLog: any, currentUserData?: any): Promise<void> {
    try {
      // Check if all required tasks are completed
      const isComplete = 
        todaysLog?.workout1?.completed &&
        todaysLog?.workout2?.completed &&
        todaysLog?.dietFollowed &&
        todaysLog?.waterCompleted &&
        todaysLog?.readingCompleted &&
        todaysLog?.progressPhotoId;

      if (isComplete && !todaysLog.dayCompletionLogged) {
        // For now, use the current date as day number
        // In a real app, we'd calculate this from the user's start date
        const today = new Date();
        const dayNumber = todaysLog.dayNumber || 1;

        // Log day completion
        await this.logDayCompletion(clerkUserId, dayNumber);

        // Update streak (assuming we track this separately)
        const currentStreak = (currentUserData?.currentStreak || 0) + 1;
        const longestStreak = currentUserData?.longestStreak || 0;
        await this.updateUserStreak(clerkUserId, currentStreak, longestStreak);

        // Also log individual task completions for social feed
        if (todaysLog.workout1?.completed && !todaysLog.workout1Logged) {
          await this.logTaskCompletion(clerkUserId, `${todaysLog.workout1.type} Workout (${todaysLog.workout1.isOutdoor ? 'Outdoor' : 'Indoor'})`);
        }
        if (todaysLog.workout2?.completed && !todaysLog.workout2Logged) {
          await this.logTaskCompletion(clerkUserId, `${todaysLog.workout2.type} Workout (${todaysLog.workout2.isOutdoor ? 'Outdoor' : 'Indoor'})`);
        }
        if (todaysLog.waterCompleted && !todaysLog.waterCompletedLogged) {
          await this.logTaskCompletion(clerkUserId, '1 Gallon of Water');
        }
        if (todaysLog.readingCompleted && !todaysLog.readingCompletedLogged) {
          await this.logTaskCompletion(clerkUserId, `10 Pages of ${todaysLog.bookTitle || 'Reading'}`);
        }
        if (todaysLog.progressPhotoId && !todaysLog.progressPhotoLogged) {
          await this.logTaskCompletion(clerkUserId, 'Progress Photo');
        }
      }
    } catch (error) {
      console.error('Failed to check day completion:', error);
    }
  }
}