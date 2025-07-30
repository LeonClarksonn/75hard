import { init, tx, id } from '@instantdb/react-native';
import { schema } from './instantSchema';

const APP_ID = process.env.EXPO_PUBLIC_INSTANT_APP_ID;

if (!APP_ID) {
  throw new Error('Missing EXPO_PUBLIC_INSTANT_APP_ID environment variable');
}

export const db = init({
  appId: APP_ID,
  schema,
});

export { tx, id };

export type User = {
  id: string;
  clerkId: string;
  email: string;
  username: string;
  name: string;
  profilePhoto?: string;
  currentStreak: number;
  longestStreak: number;
  startDate: string;
  preferences: {
    useMetricUnits: boolean;
    notificationsEnabled: boolean;
  };
  createdAt: string;
};

export type DailyLog = {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  workout1?: {
    completed: boolean;
    type: string;
    isOutdoor: boolean;
  };
  workout2?: {
    completed: boolean;
    type: string;
    isOutdoor: boolean;
  };
  dietFollowed: boolean;
  waterCompleted: boolean;
  waterIntakeOz: number; // Track actual water intake
  readingCompleted: boolean;
  bookTitle?: string;
  progressPhotoId?: string;
  progressPhotoUri?: string; // Local photo URI
  completedAt?: string;
  createdAt: string;
};

export type Friendship = {
  id: string;
  requesterId: string;
  receiverId: string;
  clerkRequesterId: string;
  clerkReceiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
};

export type SocialActivity = {
  id: string;
  userId: string;
  type: 'task_completed' | 'streak_milestone' | 'challenge_joined' | 'day_completed' | 'friend_added';
  data: {
    taskName?: string;
    streakDays?: number;
    challengeId?: string;
    friendName?: string;
  };
  isPublic: boolean;
  createdAt: string;
};

export type Encouragement = {
  id: string;
  fromUserId: string;
  toUserId: string;
  activityId?: string; // Optional - can be a general encouragement
  message: string;
  type: 'encouragement' | 'celebration' | 'motivation';
  createdAt: string;
};

export type Challenge = {
  id: string;
  createdBy: string;
  title: string;
  description: string;
  type: 'group_75hard' | 'streak_challenge' | 'task_challenge';
  startDate: string;
  endDate?: string;
  isPublic: boolean;
  participantCount: number;
  createdAt: string;
};

export type ChallengeParticipant = {
  id: string;
  challengeId: string;
  userId: string;
  joinedAt: string;
  isActive: boolean;
};