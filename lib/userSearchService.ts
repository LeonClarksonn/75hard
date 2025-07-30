import { db } from './instant';
import { UserMapping } from './userMapping';

// Since we can't query directly in React Native, we need to use hooks
// This service provides search functionality that components can use

export class UserSearchService {
  // Search for users by username using the hook data
  static searchUsersInData(
    allUsers: any[], 
    searchQuery: string, 
    currentClerkUserId?: string
  ): any[] {
    if (!allUsers || !searchQuery) return [];
    
    const searchTerm = searchQuery.toLowerCase().trim();
    
    return allUsers.filter(user => {
      // Skip current user
      if (currentClerkUserId && user.clerkId === currentClerkUserId) {
        return false;
      }
      
      // Search by username, email, or name
      const username = user.username?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      const name = user.name?.toLowerCase() || '';
      
      return (
        username.includes(searchTerm) ||
        email.includes(searchTerm) ||
        name.includes(searchTerm)
      );
    });
  }
  
  // Find a user by username (exact match)
  static findUserByUsername(
    allUsers: any[],
    username: string
  ): any | null {
    if (!allUsers || !username) return null;
    
    const searchUsername = username.toLowerCase().trim();
    
    return allUsers.find(user => 
      user.username?.toLowerCase() === searchUsername
    ) || null;
  }
  
  // Get user display info
  static getUserDisplayInfo(user: any) {
    return {
      id: user.id,
      clerkId: user.clerkId,
      username: user.username || 'Unknown',
      name: user.name || 'Anonymous',
      email: user.email,
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
    };
  }
}