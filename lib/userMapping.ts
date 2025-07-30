import { db, tx, id } from './instant';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Since InstantDB only works with their generated IDs,
// we need to map Clerk user IDs to InstantDB IDs

export class UserMapping {
  private static MAPPING_KEY = 'clerk_to_instant_mapping';
  
  // Get or create InstantDB ID for a Clerk user
  static async getInstantId(clerkUserId: string): Promise<string> {
    try {
      // Check if we already have a mapping
      const mappings = await this.getMappings();
      
      if (mappings[clerkUserId]) {
        return mappings[clerkUserId];
      }
      
      // Create new InstantDB ID
      const instantId = id();
      
      // Save the mapping
      mappings[clerkUserId] = instantId;
      await AsyncStorage.setItem(this.MAPPING_KEY, JSON.stringify(mappings));
      
      return instantId;
    } catch (error) {
      console.error('Failed to get/create InstantDB ID:', error);
      throw error;
    }
  }
  
  // Get all mappings
  static async getMappings(): Promise<Record<string, string>> {
    try {
      const stored = await AsyncStorage.getItem(this.MAPPING_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to get mappings:', error);
      return {};
    }
  }
  
  // Get Clerk ID from InstantDB ID
  static async getClerkId(instantId: string): Promise<string | null> {
    try {
      const mappings = await this.getMappings();
      
      // Find the Clerk ID for this Instant ID
      for (const [clerkId, instId] of Object.entries(mappings)) {
        if (instId === instantId) {
          return clerkId;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get Clerk ID:', error);
      return null;
    }
  }
}

// New user service that uses mapped IDs
export class MappedUserService {
  static async saveUser(clerkUserId: string, userData: any): Promise<void> {
    try {
      // Get or create InstantDB ID for this Clerk user
      const instantId = await UserMapping.getInstantId(clerkUserId);
      
      console.log('Saving user with mapped ID:', { 
        clerkId: clerkUserId, 
        instantId,
        data: userData 
      });
      
      // Save to InstantDB with the generated ID
      await db.transact([
        tx.users[instantId].update({
          clerkId: clerkUserId, // Store the Clerk ID as a field
          email: userData.email,
          username: userData.username,
          name: userData.name || '',
          currentStreak: userData.currentStreak || 0,
          longestStreak: userData.longestStreak || 0,
          startDate: userData.startDate || new Date().toISOString().split('T')[0],
          createdAt: userData.createdAt || new Date().toISOString(),
        })
      ]);
      
      console.log('User saved successfully with mapped ID');
    } catch (error) {
      console.error('Failed to save user with mapped ID:', error);
      throw error;
    }
  }
  
  // Get user by Clerk ID
  static async getUserByClerkId(clerkUserId: string): Promise<any | null> {
    try {
      // Query InstantDB for user with this Clerk ID
      const { data } = await db.queryOnce({
        users: {
          $: {
            where: {
              clerkId: clerkUserId
            },
            limit: 1
          }
        }
      });
      
      if (!data?.users) {
        return null;
      }
      
      const users = Array.isArray(data.users) ? data.users : Object.values(data.users);
      return users[0] || null;
    } catch (error) {
      console.error('Failed to get user by Clerk ID:', error);
      return null;
    }
  }
  
  // Search users by username, considering the mapping
  static async searchUsers(query: string, currentClerkUserId?: string): Promise<any[]> {
    try {
      // Get current user's Instant ID to exclude from results
      const currentInstantId = currentClerkUserId 
        ? await UserMapping.getInstantId(currentClerkUserId)
        : null;
      
      // This would need to use InstantDB's query hooks in the component
      // For now, return empty array
      console.log('Search not implemented yet - use hooks in component');
      return [];
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  }
}