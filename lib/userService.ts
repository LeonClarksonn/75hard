import { db, tx, id } from './instant';

export interface User {
  id: string;
  email: string;
  username: string;
  name?: string;
  currentStreak?: number;
  longestStreak?: number;
  startDate?: string;
  createdAt?: string;
}

export class UserService {
  // Create or update a user in InstantDB
  static async saveUser(user: User): Promise<void> {
    try {
      console.log('Saving user to InstantDB:', user);
      
      // Validate required fields
      if (!user.id) {
        throw new Error('User ID is required');
      }
      
      // Start with minimal fields and add more gradually
      const userData = {
        email: user.email,
        username: user.username,
        name: user.name || '',
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
        startDate: user.startDate || new Date().toISOString().split('T')[0],
        createdAt: user.createdAt || new Date().toISOString(),
      };
      
      console.log('Attempting to save user data:', userData);
      console.log('User ID:', user.id);
      
      // Use InstantDB's transact to save user
      // Note: Don't include 'id' in the update object - it's already in the path
      const response = await db.transact([
        tx.users[user.id].update(userData)
      ]);
      
      console.log('User saved successfully to InstantDB:', response);
    } catch (error: any) {
      console.error('Failed to save user to InstantDB:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        response: error.response
      });
      throw error;
    }
  }

  // Search users in InstantDB
  static async searchUsers(query: string, currentUserId?: string): Promise<User[]> {
    try {
      console.log('Searching for users with query:', query);
      
      // Query InstantDB for users
      const { data } = await db.queryOnce({
        users: {}
      });
      
      if (!data?.users) {
        console.log('No users found in database');
        return [];
      }

      const searchTerm = query.toLowerCase();
      const users = Object.values(data.users) as User[];
      
      return users.filter(user => {
        // Don't include current user
        if (user.id === currentUserId) return false;
        
        // Search by username, email, or name
        const usernameMatch = user.username?.toLowerCase().includes(searchTerm);
        const emailMatch = user.email?.toLowerCase().includes(searchTerm);
        const nameMatch = user.name?.toLowerCase().includes(searchTerm);
        
        return usernameMatch || emailMatch || nameMatch;
      });
    } catch (error) {
      console.error('Failed to search users in InstantDB:', error);
      return [];
    }
  }

  // Get a specific user by ID from InstantDB
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const { data } = await db.queryOnce({
        users: {
          $: {
            where: {
              id: userId
            }
          }
        }
      });
      
      if (!data?.users || Object.keys(data.users).length === 0) {
        return null;
      }
      
      return Object.values(data.users)[0] as User;
    } catch (error) {
      console.error('Failed to get user by ID from InstantDB:', error);
      return null;
    }
  }

  // Get all users (for debugging)
  static async getAllUsers(): Promise<User[]> {
    try {
      const { data } = await db.queryOnce({
        users: {}
      });
      
      if (!data?.users) {
        return [];
      }
      
      return Object.values(data.users) as User[];
    } catch (error) {
      console.error('Failed to get all users:', error);
      return [];
    }
  }
}