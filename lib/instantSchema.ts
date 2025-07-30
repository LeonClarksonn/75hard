import { i } from '@instantdb/react-native';

// Define the schema for InstantDB
export const schema = i.schema({
  entities: {
    users: i.entity({
      clerkId: i.string(),
      email: i.string(),
      username: i.string(),
      name: i.string(),
      profilePhoto: i.string().optional(),
      currentStreak: i.number(),
      longestStreak: i.number(),
      startDate: i.string(),
      preferences: i.json(),
      createdAt: i.string(),
    }),
    
    dailyLogs: i.entity({
      userId: i.string(),
      date: i.string(),
      workout1: i.json().optional(),
      workout2: i.json().optional(),
      dietFollowed: i.boolean(),
      waterCompleted: i.boolean(),
      waterIntakeOz: i.number(),
      readingCompleted: i.boolean(),
      bookTitle: i.string().optional(),
      progressPhotoId: i.string().optional(),
      progressPhotoUri: i.string().optional(),
      completedAt: i.string().optional(),
      createdAt: i.string(),
    }),
    
    friendships: i.entity({
      requesterId: i.string(),
      receiverId: i.string(),
      clerkRequesterId: i.string(),
      clerkReceiverId: i.string(),
      status: i.string(),
      createdAt: i.string(),
    }),
    
    socialActivities: i.entity({
      userId: i.string(),
      clerkUserId: i.string(),
      type: i.string(),
      data: i.json(),
      isPublic: i.boolean(),
      createdAt: i.string(),
    }),
    
    encouragements: i.entity({
      fromUserId: i.string(),
      toUserId: i.string(),
      activityId: i.string().optional(),
      message: i.string(),
      type: i.string(),
      createdAt: i.string(),
    }),
  },
});