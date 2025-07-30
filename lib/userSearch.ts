import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StoredUser {
  id: string;
  email: string;
  name?: string;
  username?: string;
  currentStreak?: number;
  longestStreak?: number;
  startDate?: string;
}

export class UserSearchService {
  private static ALL_USERS_KEY = 'all_registered_users';

  // Register a user when they sign up or login
  static async registerUser(user: StoredUser) {
    try {
      const allUsersJson = await AsyncStorage.getItem(this.ALL_USERS_KEY);
      const allUsers: StoredUser[] = allUsersJson ? JSON.parse(allUsersJson) : [];
      
      // Update or add user
      const existingIndex = allUsers.findIndex(u => u.id === user.id);
      if (existingIndex >= 0) {
        allUsers[existingIndex] = user;
      } else {
        allUsers.push(user);
      }
      
      await AsyncStorage.setItem(this.ALL_USERS_KEY, JSON.stringify(allUsers));
      console.log('User registered in search index:', user.username);
    } catch (error) {
      console.error('Failed to register user:', error);
    }
  }

  // Search for users by username or email
  static async searchUsers(query: string, currentUserId?: string): Promise<StoredUser[]> {
    try {
      const allUsersJson = await AsyncStorage.getItem(this.ALL_USERS_KEY);
      if (!allUsersJson) return [];
      
      const allUsers: StoredUser[] = JSON.parse(allUsersJson);
      const searchTerm = query.toLowerCase();
      
      return allUsers.filter(user => {
        // Don't include current user in results
        if (user.id === currentUserId) return false;
        
        // Search by username or email
        const usernameMatch = user.username?.toLowerCase().includes(searchTerm);
        const emailMatch = user.email.toLowerCase().includes(searchTerm);
        const nameMatch = user.name?.toLowerCase().includes(searchTerm);
        
        return usernameMatch || emailMatch || nameMatch;
      });
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  }

  // Get a specific user by ID
  static async getUserById(userId: string): Promise<StoredUser | null> {
    try {
      const allUsersJson = await AsyncStorage.getItem(this.ALL_USERS_KEY);
      if (!allUsersJson) return null;
      
      const allUsers: StoredUser[] = JSON.parse(allUsersJson);
      return allUsers.find(u => u.id === userId) || null;
    } catch (error) {
      console.error('Failed to get user by ID:', error);
      return null;
    }
  }
}