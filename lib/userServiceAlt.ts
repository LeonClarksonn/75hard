import { db, id } from './instant';

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

export class UserServiceAlt {
  // Alternative approach using direct transact
  static async saveUser(user: User): Promise<void> {
    try {
      console.log('Saving user to InstantDB (alternative method):', user);
      
      if (!user.id) {
        throw new Error('User ID is required');
      }
      
      // Try the simplest possible transaction first
      const response = await db.transact([
        ['update', 'users', user.id, { email: user.email }]
      ]);
      
      console.log('Basic save successful, now updating all fields...');
      
      // If basic save works, update with all fields
      const fullResponse = await db.transact([
        ['update', 'users', user.id, {
          email: user.email,
          username: user.username,
          name: user.name || '',
          currentStreak: user.currentStreak || 0,
          longestStreak: user.longestStreak || 0,
          startDate: user.startDate || new Date().toISOString().split('T')[0],
          createdAt: user.createdAt || new Date().toISOString(),
        }]
      ]);
      
      console.log('User saved successfully to InstantDB');
    } catch (error: any) {
      console.error('Failed to save user to InstantDB (alt):', error);
      console.error('Error details:', {
        message: error.message,
        type: error.type,
        code: error.code,
      });
      
      // Try one more time with absolute minimal data
      try {
        console.log('Attempting minimal save...');
        await db.transact([
          ['update', 'users', user.id, { username: user.username || user.id }]
        ]);
        console.log('Minimal save successful');
      } catch (minimalError) {
        console.error('Even minimal save failed:', minimalError);
      }
    }
  }
}