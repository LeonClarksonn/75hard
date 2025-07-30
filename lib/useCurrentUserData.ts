import { db } from './instant';
import { useUser } from '@clerk/clerk-expo';

export function useCurrentUserData() {
  const { user } = useUser();
  
  if (!user?.id) {
    return { 
      data: null, 
      isLoading: false, 
      currentStreak: 0,
      longestStreak: 0,
      userData: null 
    };
  }
  
  // Query for the current user's data
  const query = {
    users: {
      $: {
        where: {
          clerkId: user.id
        },
        limit: 1
      }
    }
  };
  
  const result = db.useQuery(query);
  
  // Extract user data
  const usersData = result.data?.users;
  const usersList = Array.isArray(usersData) ? usersData : Object.values(usersData || {});
  const userData = usersList[0];
  
  console.log('[useCurrentUserData] User data:', {
    clerkId: user.id,
    found: !!userData,
    currentStreak: userData?.currentStreak,
    longestStreak: userData?.longestStreak
  });
  
  return {
    ...result,
    currentStreak: userData?.currentStreak || 0,
    longestStreak: userData?.longestStreak || 0,
    userData
  };
}