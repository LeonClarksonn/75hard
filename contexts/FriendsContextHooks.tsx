import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { FriendshipService } from '@/lib/friendshipServiceSimple';
import { UserService } from '@/lib/userService';
import { useFriendsData, useFriendActivities } from '@/lib/instantHooks';
import { db, tx, User as DBUser, Friendship, SocialActivity as DBSocialActivity } from '@/lib/instant';

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
  friendIds?: string[]; // Add for debugging
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
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Use InstantDB hooks for real-time data
  const { data: friendsData, isLoading: loadingFriends } = useFriendsData(user?.id || null);
  const friendIds = useMemo(() => {
    if (!friendsData?.friendships || !friendsData?.users || !user?.id) return [];
    
    const friendships = Object.values(friendsData.friendships) as any[];
    const users = friendsData.users;
    const accepted = friendships.filter(f => f.status === 'accepted');
    
    // Get friend Clerk IDs first
    const friendClerkIds = accepted.map(f => 
      f.clerkRequesterId === user.id ? f.clerkReceiverId : f.clerkRequesterId
    );
    
    // Then get their InstantDB IDs for the activities query
    const allUsers = Object.values(users);
    return friendClerkIds
      .map(clerkId => {
        const user = allUsers.find((u: any) => u.clerkId === clerkId) as any;
        return user?.id;
      })
      .filter(Boolean);
  }, [friendsData, user?.id]);
  
  const { data: activitiesData, isLoading: loadingActivities } = useFriendActivities(friendIds);

  // Process friends from friendships data
  const friends = useMemo(() => {
    if (!friendsData?.friendships || !friendsData?.users || !user?.id) return [];
    
    const friendships = Object.values(friendsData.friendships) as any[];
    const users = friendsData.users;
    
    const acceptedFriendships = friendships.filter(f => f.status === 'accepted');
    
    // We need to get the Clerk IDs of friends, not InstantDB IDs
    const friendClerkIds = acceptedFriendships.map(f => 
      f.clerkRequesterId === user.id ? f.clerkReceiverId : f.clerkRequesterId
    );
    
    // Find users by their Clerk IDs and deduplicate
    const allUsers = Object.values(users);
    const uniqueFriendClerkIds = [...new Set(friendClerkIds)];
    
    const friendsList = uniqueFriendClerkIds
      .map(clerkId => allUsers.find((u: any) => u.clerkId === clerkId))
      .filter(Boolean) as Friend[];
    
    return friendsList;
  }, [friendsData, user?.id]);

  // Process friend requests
  const friendRequests = useMemo(() => {
    if (!friendsData?.friendships || !friendsData?.users || !user?.id) {
      return { incoming: [], outgoing: [] };
    }
    
    const friendships = Object.values(friendsData.friendships) as any[];
    const users = friendsData.users;
    
    const pendingFriendships = friendships.filter(f => f.status === 'pending');
    
    const incoming = pendingFriendships
      .filter(f => f.clerkReceiverId === user.id)
      .map(f => ({
        ...f,
        requester: users[f.requesterId],
        requesterName: users[f.requesterId]?.name,
        requesterUsername: users[f.requesterId]?.username,
      })) as FriendRequest[];
    
    const outgoing = pendingFriendships
      .filter(f => f.clerkRequesterId === user.id)
      .map(f => ({
        ...f,
        receiver: users[f.receiverId],
      })) as FriendRequest[];

    return { incoming, outgoing };
  }, [friendsData, user?.id]);

  // Process activities
  const activities = useMemo(() => {
    if (!activitiesData?.socialActivities || !activitiesData?.users) return [];
    
    const allActivities = Object.values(activitiesData.socialActivities) as any[];
    const users = activitiesData.users;
    
    // Get all users to match by clerkId
    const allUsers = Object.values(users) as any[];
    
    // Filter to only show activities from friends
    const friendActivities = allActivities.filter(activity => {
      // Match by clerkUserId instead of userId since that's what we store in activities
      const activityUser = allUsers.find((u: any) => u.clerkId === activity.clerkUserId);
      return activityUser && friendIds.includes(activityUser.id);
    });
    
    // Sort by creation date, newest first
    const sortedActivities = friendActivities.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return sortedActivities.map(a => {
      // Find user by clerkUserId which is stored in the activity
      const userData = allUsers.find((u: any) => u.clerkId === a.clerkUserId);
      return {
        ...a,
        user: userData,
        friendName: userData?.name,
        friendUsername: userData?.username,
      };
    }) as SocialActivity[];
  }, [activitiesData, friendIds]);

  const isLoading = loadingFriends || loadingActivities;

  // Send friend request
  const sendFriendRequest = async (friendData: Omit<Friend, 'id' | 'createdAt'>) => {
    if (!user?.id) return;

    try {
      // For the search functionality, we need to find the user by their Clerk ID
      // The friendData should contain the clerkId of the target user
      let targetClerkId: string;
      
      if ('clerkId' in friendData && (friendData as any).clerkId) {
        // If we have the clerkId directly (from search results)
        targetClerkId = (friendData as any).clerkId;
      } else {
        // Fallback: try to find by username in the current data
        if (!friendsData?.users) {
          throw new Error('User data not available');
        }
        
        const allUsers = Object.values(friendsData.users);
        const targetUser = allUsers.find((u: any) => 
          u.username === friendData.username || u.email === friendData.email
        );
        
        if (!targetUser || !(targetUser as any).clerkId) {
          throw new Error('User not found. Make sure they have signed in at least once.');
        }
        
        targetClerkId = (targetUser as any).clerkId;
      }
      
      // Check if already friends or has pending request
      const allFriendships = Object.values(friendsData?.friendships || {}) as any[];
      const existingFriendship = allFriendships.find(f => 
        (f.clerkRequesterId === user.id && f.clerkReceiverId === targetClerkId) ||
        (f.clerkReceiverId === user.id && f.clerkRequesterId === targetClerkId)
      );
      
      if (existingFriendship) {
        if (existingFriendship.status === 'accepted') {
          throw new Error('Already friends with this user');
        } else if (existingFriendship.status === 'pending') {
          throw new Error('Friend request already pending');
        }
      }

      // Send the request using Clerk IDs
      await FriendshipService.sendFriendRequest(user.id, targetClerkId);
      
      // Trigger refresh
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to send friend request:', error);
      throw error;
    }
  };

  // Accept friend request
  const acceptFriendRequest = async (requestId: string) => {
    try {
      await FriendshipService.acceptFriendRequest(requestId);
      
      // Create friend added activities
      const request = friendRequests.incoming.find(r => r.id === requestId);
      if (request && user?.id) {
        await FriendshipService.createActivity(user.id, 'friend_added', { 
          friendId: request.requesterId,
          friendName: request.requesterName 
        });
        await FriendshipService.createActivity(request.requesterId, 'friend_added', { 
          friendId: user.id,
          friendName: user.username || 'Friend'
        });
      }
      
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      throw error;
    }
  };

  // Reject friend request
  const rejectFriendRequest = async (requestId: string) => {
    try {
      await FriendshipService.rejectFriendRequest(requestId);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to reject friend request:', error);
      throw error;
    }
  };

  // Remove friend
  const removeFriend = async (friendId: string) => {
    if (!user?.id || !friendsData?.friendships) return;

    try {
      // Find the friendship to delete
      const friendships = Object.values(friendsData.friendships) as any[];
      const friendship = friendships.find(f => 
        f.status === 'accepted' && (
          (f.clerkRequesterId === user.id && f.receiverId === friendId) ||
          (f.clerkReceiverId === user.id && f.requesterId === friendId)
        )
      );

      if (friendship) {
        // Delete the friendship
        await db.transact([
          tx.friendships[friendship.id].delete()
        ]);
      }
      
      setRefreshKey(prev => prev + 1);
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
      setRefreshKey(prev => prev + 1);
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
    setRefreshKey(prev => prev + 1);
  };

  return (
    <FriendsContext.Provider value={{
      friends,
      friendRequests,
      activities,
      isLoading,
      friendIds, // Add for debugging
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