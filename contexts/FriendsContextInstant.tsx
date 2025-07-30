import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { FriendshipService } from '@/lib/friendshipService';
import { UserService } from '@/lib/userService';
import { db, User as DBUser, Friendship, SocialActivity as DBSocialActivity } from '@/lib/instant';

export interface Friend extends DBUser {
  isOnline?: boolean;
}

export interface FriendRequest extends Friendship {
  requesterName?: string;
  requesterUsername?: string;
  requester?: DBUser;
  receiver?: DBUser;
}

export interface SocialActivity extends DBSocialActivity {
  friendName?: string;
  friendUsername?: string;
  user?: DBUser;
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

  // Load data on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      loadData();
      
      // Set up real-time subscriptions
      const unsubscribe = subscribeToChanges();
      
      return () => {
        if (unsubscribe) unsubscribe();
      };
    } else {
      // Clear data when user logs out
      setFriends([]);
      setFriendRequests({ incoming: [], outgoing: [] });
      setActivities([]);
      setIsLoading(false);
    }
  }, [user?.id]);

  // Subscribe to real-time changes
  const subscribeToChanges = () => {
    if (!user?.id) return;

    // Subscribe to friendships changes
    const { unsubscribe: unsubFriendships } = db.subscribeQuery(
      {
        friendships: {
          $: {
            where: {
              or: [
                { requesterId: user.id },
                { receiverId: user.id }
              ]
            }
          }
        },
        users: {},
        socialActivities: {
          $: {
            limit: 50,
            order: {
              createdAt: 'desc'
            }
          }
        }
      },
      (result) => {
        if (result.data) {
          // Update friends and requests based on real-time data
          processFriendshipsData(result.data);
          processActivitiesData(result.data);
        }
      }
    );

    return unsubFriendships;
  };

  // Process friendships data from InstantDB
  const processFriendshipsData = async (data: any) => {
    if (!user?.id || !data.friendships || !data.users) return;

    const friendships = Object.values(data.friendships) as Friendship[];
    const users = data.users;

    // Process accepted friendships (friends)
    const acceptedFriendships = friendships.filter(f => f.status === 'accepted');
    const friendIds = acceptedFriendships.map(f => 
      f.requesterId === user.id ? f.receiverId : f.requesterId
    );
    
    const friendsList = friendIds
      .map(id => users[id])
      .filter(Boolean) as Friend[];
    
    setFriends(friendsList);

    // Process pending requests
    const pendingFriendships = friendships.filter(f => f.status === 'pending');
    
    const incoming = pendingFriendships
      .filter(f => f.receiverId === user.id)
      .map(f => ({
        ...f,
        requester: users[f.requesterId],
        requesterName: users[f.requesterId]?.name,
        requesterUsername: users[f.requesterId]?.username,
      })) as FriendRequest[];
    
    const outgoing = pendingFriendships
      .filter(f => f.requesterId === user.id)
      .map(f => ({
        ...f,
        receiver: users[f.receiverId],
      })) as FriendRequest[];

    setFriendRequests({ incoming, outgoing });
  };

  // Process activities data from InstantDB
  const processActivitiesData = async (data: any) => {
    if (!user?.id || !data.socialActivities || !data.users) return;

    const allActivities = Object.values(data.socialActivities) as DBSocialActivity[];
    const users = data.users;
    
    // Get friend IDs
    const friendIds = friends.map(f => f.id);
    
    // Filter activities from friends
    const friendActivities = allActivities
      .filter(a => friendIds.includes(a.userId))
      .map(a => ({
        ...a,
        user: users[a.userId],
        friendName: users[a.userId]?.name,
        friendUsername: users[a.userId]?.username,
      })) as SocialActivity[];
    
    setActivities(friendActivities);
  };

  // Load initial data
  const loadData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Load friends
      const friendsList = await FriendshipService.getFriends(user.id);
      setFriends(friendsList as Friend[]);

      // Load friend requests
      const requests = await FriendshipService.getPendingRequests(user.id);
      setFriendRequests({
        incoming: requests.incoming as FriendRequest[],
        outgoing: requests.outgoing as FriendRequest[]
      });

      // Load activities
      const friendActivities = await FriendshipService.getFriendActivities(user.id);
      
      // Enrich activities with user data
      const enrichedActivities = await Promise.all(
        friendActivities.map(async (activity) => {
          const userData = await UserService.getUserById(activity.userId);
          return {
            ...activity,
            user: userData || undefined,
            friendName: userData?.name,
            friendUsername: userData?.username,
          };
        })
      );
      
      setActivities(enrichedActivities as SocialActivity[]);
    } catch (error) {
      console.error('Failed to load friends data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Send friend request
  const sendFriendRequest = async (friendData: Omit<Friend, 'id' | 'createdAt'>) => {
    if (!user?.id) return;

    try {
      // Search for user by username or email
      const users = await UserService.searchUsers(friendData.username || friendData.email, user.id);
      
      if (users.length === 0) {
        throw new Error('User not found');
      }

      const targetUser = users[0];
      
      // Check if already friends
      const areFriends = await FriendshipService.areFriends(user.id, targetUser.id);
      if (areFriends) {
        throw new Error('Already friends with this user');
      }

      // Send the request
      await FriendshipService.sendFriendRequest(user.id, targetUser.id);
      
      // Refresh data to get updated state
      await loadData();
    } catch (error) {
      console.error('Failed to send friend request:', error);
      throw error;
    }
  };

  // Accept friend request
  const acceptFriendRequest = async (requestId: string) => {
    try {
      await FriendshipService.acceptFriendRequest(requestId);
      await loadData();
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      throw error;
    }
  };

  // Reject friend request
  const rejectFriendRequest = async (requestId: string) => {
    try {
      await FriendshipService.rejectFriendRequest(requestId);
      await loadData();
    } catch (error) {
      console.error('Failed to reject friend request:', error);
      throw error;
    }
  };

  // Remove friend
  const removeFriend = async (friendId: string) => {
    if (!user?.id) return;

    try {
      await FriendshipService.removeFriend(user.id, friendId);
      await loadData();
    } catch (error) {
      console.error('Failed to remove friend:', error);
      throw error;
    }
  };

  // Add friend (used for QR code scanning)
  const addFriend = async (friend: Friend) => {
    if (!user?.id) return;

    try {
      // Send friend request using the friend's ID
      await FriendshipService.sendFriendRequest(user.id, friend.id);
      await loadData();
    } catch (error) {
      console.error('Failed to add friend:', error);
      throw error;
    }
  };

  // Add activity
  const addActivity = async (activity: Omit<SocialActivity, 'id' | 'createdAt'>) => {
    if (!user?.id) return;

    try {
      await FriendshipService.createActivity(
        activity.userId || user.id,
        activity.type,
        activity.data
      );
      // No need to refresh - real-time subscription will update
    } catch (error) {
      console.error('Failed to add activity:', error);
    }
  };

  // Search friends
  const searchFriends = (query: string): Friend[] => {
    const searchTerm = query.toLowerCase();
    return friends.filter(friend => 
      friend.name.toLowerCase().includes(searchTerm) ||
      friend.username.toLowerCase().includes(searchTerm) ||
      friend.email.toLowerCase().includes(searchTerm)
    );
  };

  // Get leaderboard
  const getLeaderboard = (): (Friend & { rank: number })[] => {
    return [...friends]
      .sort((a, b) => b.currentStreak - a.currentStreak)
      .map((friend, index) => ({ ...friend, rank: index + 1 }));
  };

  // Refresh data
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
      refreshData,
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