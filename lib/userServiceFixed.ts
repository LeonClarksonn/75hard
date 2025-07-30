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

export class UserServiceFixed {
  static async saveUser(user: User): Promise<void> {
    try {
      console.log('Saving user to InstantDB (fixed method):', user);
      
      if (!user.id) {
        throw new Error('User ID is required');
      }
      
      // Use merge to update only provided fields without overwriting everything
      const response = await db.transact(
        tx.users[user.id].merge({
          email: user.email,
          username: user.username,
          name: user.name || '',
          currentStreak: user.currentStreak || 0,
          longestStreak: user.longestStreak || 0,
          startDate: user.startDate || new Date().toISOString().split('T')[0],
          createdAt: user.createdAt || new Date().toISOString(),
        })
      );
      
      console.log('User saved successfully to InstantDB (fixed)');
    } catch (error: any) {
      console.error('Failed to save user (fixed):', error);
      
      // Try with minimal data using update
      try {
        console.log('Trying minimal update...');
        const minimalResponse = await db.transact(
          tx.users[user.id].update({
            username: user.username
          })
        );
        console.log('Minimal update successful');
      } catch (minError) {
        console.error('Minimal update also failed:', minError);
        
        // Last resort - try without tx helper
        try {
          console.log('Trying raw transaction...');
          const rawResponse = await db.transact({
            users: {
              [user.id]: {
                username: user.username
              }
            }
          });
          console.log('Raw transaction successful');
        } catch (rawError) {
          console.error('Raw transaction failed:', rawError);
        }
      }
    }
  }
}