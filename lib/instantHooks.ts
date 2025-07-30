import { db } from './instant';

// Hook to get friends and friend requests
export function useFriendsData(clerkUserId: string | null) {
  // Get all friendships where user is involved by Clerk ID
  const friendshipsQuery = clerkUserId ? {
    friendships: {
      $: {
        where: {
          or: [
            { clerkRequesterId: clerkUserId },
            { clerkReceiverId: clerkUserId }
          ]
        }
      }
    },
    users: {},
  } : {};

  return db.useQuery(friendshipsQuery);
}

// Hook to get friend activities
export function useFriendActivities(friendIds: string[]) {
  // Query all recent activities - we'll filter by friends in the component
  const activitiesQuery = {
    socialActivities: {
      $: {
        limit: 100
      }
    },
    users: {}
  };

  const result = db.useQuery(activitiesQuery);
  
  // Return all activities with their user data
  // The filtering by friends will happen in the component
  return result;
}

// Hook to get a single user
export function useUser(userId: string | null) {
  const userQuery = userId ? {
    users: {
      $: {
        where: {
          id: userId
        }
      }
    }
  } : {};

  return db.useQuery(userQuery);
}

// Hook to get all users (for searching)
export function useAllUsers() {
  const result = db.useQuery({
    users: {}
  });
  
  console.log('useAllUsers hook result:', {
    isLoading: result.isLoading,
    error: result.error,
    data: result.data,
    users: result.data?.users ? Object.keys(result.data.users).length : 0
  });
  
  return result;
}

// Hook to search users
export function useUserSearch(searchTerm: string, currentClerkUserId: string | null) {
  const { data, ...rest } = useAllUsers();
  
  if (!data?.users || !searchTerm) {
    return { ...rest, data, filteredUsers: [] };
  }

  const users = Object.values(data.users);
  const filtered = users.filter((user: any) => {
    // Skip current user (check by clerkId)
    if (user.clerkId === currentClerkUserId) return false;
    
    const term = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.name?.toLowerCase().includes(term)
    );
  });

  return { ...rest, data, filteredUsers: filtered };
}