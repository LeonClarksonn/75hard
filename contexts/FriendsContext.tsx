import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '@clerk/clerk-expo';
import { FriendshipService } from '@/lib/friendshipService';
import { UserService } from '@/lib/userService';
import { db } from '@/lib/instant';

export interface Friend {
  id: string;
  name: string;
  username: string;
  email: string;
  currentStreak: number;
  longestStreak: number;
  startDate: string;
  profilePhoto?: string;
  isOnline?: boolean;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  requesterId: string;
  receiverId: string;
  requesterName: string;
  requesterUsername: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface SocialActivity {
  id: string;
  userId: string;
  friendName: string;
  friendUsername: string;
  type: 'task_completed' | 'day_completed' | 'streak_milestone' | 'friend_added';
  data: any;
  createdAt: string;
}

interface FriendsContextType {
  friends: Friend[];
  friendRequests: { incoming: FriendRequest[]; outgoing: FriendRequest[] };
  activities: SocialActivity[];
  isLoading: boolean;
  // Friend management
  addFriend: (friend: Friend) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  // Friend requests
  sendFriendRequest: (friendData: Omit<Friend, 'id' | 'createdAt'>) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  // Activities
  addActivity: (activity: Omit<SocialActivity, 'id' | 'createdAt'>) => Promise<void>;
  // Search
  searchFriends: (query: string) => Friend[];
  // Leaderboard
  getLeaderboard: () => (Friend & { rank: number })[];
  // Utility
  refreshData: () => Promise<void>;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export function FriendsProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }>({
    incoming: [],
    outgoing: []
  });
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Storage keys
  const FRIENDS_KEY = 'friends_data';
  const FRIEND_REQUESTS_KEY = 'friend_requests_data';
  const ACTIVITIES_KEY = 'activities_data';

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Initialize with some demo data if empty
  useEffect(() => {
    const initializeDemoData = async () => {
      if (friends.length === 0 && !isLoading) {
        const demoFriends: Friend[] = [
          {
            id: 'demo-friend-1',
            name: 'Alex Johnson',
            username: 'alexfit',
            email: 'alex@example.com',
            currentStreak: 15,
            longestStreak: 18,
            startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            isOnline: true,
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'demo-friend-2',
            name: 'Sarah Chen',
            username: 'sarahstrong',
            email: 'sarah@example.com',
            currentStreak: 23,
            longestStreak: 25,
            startDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            isOnline: false,
            createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'demo-friend-3',
            name: 'Mike Torres',
            username: 'miketough',
            email: 'mike@example.com',
            currentStreak: 8,
            longestStreak: 12,
            startDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            isOnline: true,
            createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];

        // Add demo friends
        for (const friend of demoFriends) {
          await addFriend(friend);
        }

        // Add some demo activities
        const demoActivities = [
          {
            userId: 'demo-friend-2',
            friendName: 'Sarah Chen',
            friendUsername: 'sarahstrong',
            type: 'day_completed' as const,
            data: {}
          },
          {
            userId: 'demo-friend-1',
            friendName: 'Alex Johnson',
            friendUsername: 'alexfit',
            type: 'streak_milestone' as const,
            data: { streakDays: 15 }
          },
          {
            userId: 'demo-friend-3',
            friendName: 'Mike Torres',
            friendUsername: 'miketough',
            type: 'task_completed' as const,
            data: { taskName: 'Morning Workout' }
          }
        ];

        for (const activity of demoActivities) {
          await addActivity(activity);
        }

        // Add a demo friend request
        const demoRequest: FriendRequest = {
          id: 'demo-request-1',
          requesterId: 'demo-user-4',
          receiverId: user?.id || 'guest',
          requesterName: 'Emma Wilson',
          requesterUsername: 'emmawilson',
          status: 'pending',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        };

        const updatedRequests = {
          incoming: [demoRequest],
          outgoing: []
        };
        await saveFriendRequests(updatedRequests);
      }
    };

    initializeDemoData();
  }, [friends.length, isLoading]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [friendsData, requestsData, activitiesData] = await Promise.all([
        AsyncStorage.getItem(FRIENDS_KEY),
        AsyncStorage.getItem(FRIEND_REQUESTS_KEY),
        AsyncStorage.getItem(ACTIVITIES_KEY)
      ]);

      if (friendsData) {
        setFriends(JSON.parse(friendsData));
      }
      
      if (requestsData) {
        setFriendRequests(JSON.parse(requestsData));
      }
      
      if (activitiesData) {
        setActivities(JSON.parse(activitiesData));
      }
    } catch (error) {
      console.error('Failed to load friends data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFriends = async (newFriends: Friend[]) => {
    try {
      await AsyncStorage.setItem(FRIENDS_KEY, JSON.stringify(newFriends));
      setFriends(newFriends);
    } catch (error) {
      console.error('Failed to save friends data:', error);
    }
  };

  const saveFriendRequests = async (newRequests: { incoming: FriendRequest[]; outgoing: FriendRequest[] }) => {
    try {
      await AsyncStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(newRequests));
      setFriendRequests(newRequests);
    } catch (error) {
      console.error('Failed to save friend requests data:', error);
    }
  };

  const saveActivities = async (newActivities: SocialActivity[]) => {
    try {
      await AsyncStorage.setItem(ACTIVITIES_KEY, JSON.stringify(newActivities));
      setActivities(newActivities);
    } catch (error) {
      console.error('Failed to save activities data:', error);
    }
  };

  const addFriend = async (friend: Friend) => {
    const newFriend: Friend = {
      ...friend,
      id: friend.id || `friend-${Date.now()}`,
      createdAt: friend.createdAt || new Date().toISOString()
    };
    
    const updatedFriends = [...friends, newFriend];
    await saveFriends(updatedFriends);
    
    // Add activity
    await addActivity({
      userId: newFriend.id,
      friendName: newFriend.name,
      friendUsername: newFriend.username,
      type: 'friend_added',
      data: {}
    });
  };

  const removeFriend = async (friendId: string) => {
    const updatedFriends = friends.filter(f => f.id !== friendId);
    await saveFriends(updatedFriends);
  };

  const sendFriendRequest = async (friendData: Omit<Friend, 'id' | 'createdAt'>) => {
    const requestId = `request-${Date.now()}`;
    const newRequest: FriendRequest = {
      id: requestId,
      requesterId: user?.id || 'guest',
      receiverId: `user-${Date.now()}`, // This would be the target user's ID
      requesterName: 'You', // Current user's name
      requesterUsername: 'currentuser', // Current user's username
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const updatedRequests = {
      ...friendRequests,
      outgoing: [...friendRequests.outgoing, newRequest]
    };
    
    await saveFriendRequests(updatedRequests);
    
    // Simulate accepting the request after a delay (for demo purposes)
    setTimeout(async () => {
      await addFriend({
        id: `friend-${Date.now()}`,
        ...friendData,
        createdAt: new Date().toISOString()
      });
      
      // Remove from outgoing requests
      const finalRequests = {
        ...friendRequests,
        outgoing: friendRequests.outgoing.filter(req => req.id !== requestId)
      };
      await saveFriendRequests(finalRequests);
    }, 2000);
  };

  const acceptFriendRequest = async (requestId: string) => {
    const request = friendRequests.incoming.find(req => req.id === requestId);
    if (!request) return;

    // Add as friend
    const newFriend: Friend = {
      id: request.requesterId,
      name: request.requesterName,
      username: request.requesterUsername,
      email: `${request.requesterUsername}@example.com`,
      currentStreak: Math.floor(Math.random() * 30) + 1,
      longestStreak: Math.floor(Math.random() * 50) + 1,
      startDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    await addFriend(newFriend);

    // Remove from incoming requests
    const updatedRequests = {
      ...friendRequests,
      incoming: friendRequests.incoming.filter(req => req.id !== requestId)
    };
    await saveFriendRequests(updatedRequests);
  };

  const rejectFriendRequest = async (requestId: string) => {
    const updatedRequests = {
      ...friendRequests,
      incoming: friendRequests.incoming.filter(req => req.id !== requestId)
    };
    await saveFriendRequests(updatedRequests);
  };

  const addActivity = async (activity: Omit<SocialActivity, 'id' | 'createdAt'>) => {
    const newActivity: SocialActivity = {
      ...activity,
      id: `activity-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    const updatedActivities = [newActivity, ...activities].slice(0, 50); // Keep only last 50 activities
    await saveActivities(updatedActivities);
  };

  const searchFriends = (query: string): Friend[] => {
    if (!query.trim()) return friends;
    
    const lowercaseQuery = query.toLowerCase();
    return friends.filter(friend => 
      friend.name.toLowerCase().includes(lowercaseQuery) ||
      friend.username.toLowerCase().includes(lowercaseQuery)
    );
  };

  const getLeaderboard = (): (Friend & { rank: number })[] => {
    const sortedFriends = [...friends]
      .sort((a, b) => b.currentStreak - a.currentStreak)
      .map((friend, index) => ({
        ...friend,
        rank: index + 1
      }));
    
    return sortedFriends;
  };

  const refreshData = async () => {
    await loadData();
  };

  return (
    <FriendsContext.Provider value={{
      friends,
      friendRequests,
      activities,
      isLoading,
      addFriend,
      removeFriend,
      sendFriendRequest,
      acceptFriendRequest,
      rejectFriendRequest,
      addActivity,
      searchFriends,
      getLeaderboard,
      refreshData
    }}>
      {children}
    </FriendsContext.Provider>
  );
}

export function useFriends() {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
}
