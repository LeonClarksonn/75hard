import { db, tx, id, User, Friendship, SocialActivity, Encouragement, Challenge, ChallengeParticipant } from './instant';

export class SocialService {
  // User Management
  static async createUser(userData: Partial<User>): Promise<string> {
    const userId = id();
    const newUser: User = {
      id: userId,
      email: userData.email || '',
      username: userData.username || '',
      name: userData.name || '',
      profilePhoto: userData.profilePhoto,
      currentStreak: 0,
      longestStreak: 0,
      startDate: new Date().toISOString().split('T')[0],
      preferences: {
        useMetricUnits: false,
        notificationsEnabled: true,
      },
      createdAt: new Date().toISOString(),
      ...userData,
    };

    // In a real app, this would save to the database
    console.log('Creating user:', newUser);
    return userId;
  }

  static async searchUsers(query: string): Promise<User[]> {
    // In a real app, this would search the database
    // For now, return mock users for demonstration
    const mockUsers: User[] = [
      {
        id: 'user-1',
        email: 'alex@example.com',
        username: 'alexfit',
        name: 'Alex Johnson',
        currentStreak: 15,
        longestStreak: 18,
        startDate: '2025-01-15',
        preferences: { useMetricUnits: false, notificationsEnabled: true },
        createdAt: '2025-01-15T00:00:00Z',
      },
      {
        id: 'user-2',
        email: 'sarah@example.com',
        username: 'sarahstrong',
        name: 'Sarah Chen',
        currentStreak: 23,
        longestStreak: 25,
        startDate: '2025-01-08',
        preferences: { useMetricUnits: true, notificationsEnabled: true },
        createdAt: '2025-01-08T00:00:00Z',
      },
      {
        id: 'user-3',
        email: 'mike@example.com',
        username: 'miketough',
        name: 'Mike Torres',
        currentStreak: 8,
        longestStreak: 12,
        startDate: '2025-01-23',
        preferences: { useMetricUnits: false, notificationsEnabled: true },
        createdAt: '2025-01-23T00:00:00Z',
      },
    ];

    return mockUsers.filter(user => 
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      user.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Friendship Management
  static async sendFriendRequest(fromUserId: string, toUserId: string): Promise<string> {
    const friendshipId = id();
    const friendship: Friendship = {
      id: friendshipId,
      requesterId: fromUserId,
      receiverId: toUserId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // In a real app, this would save to database
    console.log('Sending friend request:', friendship);
    
    // Create activity for friend request
    await this.createActivity(fromUserId, 'friend_added', {
      friendName: 'New Friend', // Would get actual name from user lookup
    });

    return friendshipId;
  }

  static async respondToFriendRequest(friendshipId: string, response: 'accepted' | 'rejected'): Promise<void> {
    // In a real app, this would update the database
    console.log('Responding to friend request:', { friendshipId, response });
  }

  static async getFriends(userId: string): Promise<User[]> {
    // Mock friends data - in real app would query database
    return [
      {
        id: 'user-1',
        email: 'alex@example.com',
        username: 'alexfit',
        name: 'Alex Johnson',
        currentStreak: 15,
        longestStreak: 18,
        startDate: '2025-01-15',
        preferences: { useMetricUnits: false, notificationsEnabled: true },
        createdAt: '2025-01-15T00:00:00Z',
      },
      {
        id: 'user-2',
        email: 'sarah@example.com',
        username: 'sarahstrong',
        name: 'Sarah Chen',
        currentStreak: 23,
        longestStreak: 25,
        startDate: '2025-01-08',
        preferences: { useMetricUnits: true, notificationsEnabled: true },
        createdAt: '2025-01-08T00:00:00Z',
      },
      {
        id: 'user-3',
        email: 'mike@example.com',
        username: 'miketough',
        name: 'Mike Torres',
        currentStreak: 8,
        longestStreak: 12,
        startDate: '2025-01-23',
        preferences: { useMetricUnits: false, notificationsEnabled: true },
        createdAt: '2025-01-23T00:00:00Z',
      },
    ];
  }

  static async getPendingFriendRequests(userId: string): Promise<{ incoming: Friendship[]; outgoing: Friendship[] }> {
    // Mock pending requests
    return {
      incoming: [
        {
          id: 'req-1',
          requesterId: 'user-4',
          receiverId: userId,
          status: 'pending',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        },
      ],
      outgoing: [
        {
          id: 'req-2',
          requesterId: userId,
          receiverId: 'user-5',
          status: 'pending',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        },
      ],
    };
  }

  static async removeFriend(userId: string, friendId: string): Promise<void> {
    // In a real app, this would remove the friendship from database
    console.log('Removing friend:', { userId, friendId });
  }

  // Social Activity Management
  static async createActivity(
    userId: string, 
    type: SocialActivity['type'], 
    data: SocialActivity['data'],
    isPublic: boolean = true
  ): Promise<string> {
    const activityId = id();
    const activity: SocialActivity = {
      id: activityId,
      userId,
      type,
      data,
      isPublic,
      createdAt: new Date().toISOString(),
    };

    // In a real app, this would save to database
    console.log('Creating activity:', activity);
    return activityId;
  }

  static async getFriendsActivity(userId: string, limit: number = 20): Promise<SocialActivity[]> {
    // Mock activity data - in real app would query friends' activities
    const mockActivities: SocialActivity[] = [
      {
        id: 'activity-1',
        userId: 'user-2',
        type: 'day_completed',
        data: {},
        isPublic: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      },
      {
        id: 'activity-2',
        userId: 'user-1',
        type: 'streak_milestone',
        data: { streakDays: 15 },
        isPublic: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
      },
      {
        id: 'activity-3',
        userId: 'user-3',
        type: 'task_completed',
        data: { taskName: 'Morning Workout' },
        isPublic: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
      },
      {
        id: 'activity-4',
        userId: 'user-2',
        type: 'task_completed',
        data: { taskName: 'Water Goal' },
        isPublic: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
      },
    ];

    return mockActivities.slice(0, limit);
  }

  // Encouragement System
  static async sendEncouragement(
    fromUserId: string,
    toUserId: string,
    message: string,
    type: Encouragement['type'] = 'encouragement',
    activityId?: string
  ): Promise<string> {
    const encouragementId = id();
    const encouragement: Encouragement = {
      id: encouragementId,
      fromUserId,
      toUserId,
      activityId,
      message,
      type,
      createdAt: new Date().toISOString(),
    };

    // In a real app, this would save to database
    console.log('Sending encouragement:', encouragement);
    return encouragementId;
  }

  static async getEncouragements(userId: string): Promise<Encouragement[]> {
    // Mock encouragements received by user
    return [
      {
        id: 'enc-1',
        fromUserId: 'user-1',
        toUserId: userId,
        message: 'Keep pushing! You got this! 💪',
        type: 'encouragement',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      },
      {
        id: 'enc-2',
        fromUserId: 'user-2',
        toUserId: userId,
        message: 'Amazing streak! So proud of your dedication! 🔥',
        type: 'celebration',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      },
    ];
  }

  // Leaderboard
  static async getLeaderboard(type: 'current_streak' | 'longest_streak' = 'current_streak'): Promise<User[]> {
    const friends = await this.getFriends(DEMO_USER_ID);
    
    // Add current user to leaderboard
    const currentUser: User = {
      id: DEMO_USER_ID,
      email: 'demo@example.com',
      username: 'demouser',
      name: 'Demo User',
      currentStreak: 23, // Mock current streak
      longestStreak: 25,
      startDate: '2025-01-01',
      preferences: { useMetricUnits: false, notificationsEnabled: true },
      createdAt: '2025-01-01T00:00:00Z',
    };

    const allUsers = [currentUser, ...friends];

    // Sort by the requested metric
    if (type === 'current_streak') {
      return allUsers.sort((a, b) => b.currentStreak - a.currentStreak);
    } else {
      return allUsers.sort((a, b) => b.longestStreak - a.longestStreak);
    }
  }

  // Utility functions
  static formatActivityMessage(activity: any, userName: string): string {
    switch (activity.type) {
      case 'task_completed':
        return `${userName} completed ${activity.data?.taskName || 'a task'}`;
      case 'streak_milestone':
        return `${userName} reached a ${activity.data?.streakDays || 0}-day streak! 🔥`;
      case 'day_completed':
        return `${userName} crushed all tasks for day ${activity.data?.dayNumber || ''}! 💪`;
      case 'challenge_joined':
        return `${userName} joined a new challenge`;
      case 'friend_added':
        return `${userName} added ${activity.data?.friendName || 'a new friend'}`;
      default:
        return `${userName} completed an activity`;
    }
  }

  static getTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  }
}

// Convenience functions for the demo user
export const DemoSocialService = {
  searchUsers: (query: string) => SocialService.searchUsers(query),
  sendFriendRequest: (toUserId: string) => SocialService.sendFriendRequest(DEMO_USER_ID, toUserId),
  getFriends: () => SocialService.getFriends(DEMO_USER_ID),
  getFriendsActivity: (limit?: number) => SocialService.getFriendsActivity(DEMO_USER_ID, limit),
  sendEncouragement: (toUserId: string, message: string, type?: Encouragement['type']) => 
    SocialService.sendEncouragement(DEMO_USER_ID, toUserId, message, type),
  getEncouragements: () => SocialService.getEncouragements(DEMO_USER_ID),
  getLeaderboard: (type?: 'current_streak' | 'longest_streak') => SocialService.getLeaderboard(type),
  createActivity: (type: SocialActivity['type'], data: SocialActivity['data']) => 
    SocialService.createActivity(DEMO_USER_ID, type, data),
  getPendingRequests: () => SocialService.getPendingFriendRequests(DEMO_USER_ID),
};