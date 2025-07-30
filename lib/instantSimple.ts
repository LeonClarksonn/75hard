import { init, tx, id } from '@instantdb/react-native';

const APP_ID = process.env.EXPO_PUBLIC_INSTANT_APP_ID;

if (!APP_ID) {
  throw new Error('Missing EXPO_PUBLIC_INSTANT_APP_ID environment variable');
}

// Initialize without schema to test
export const dbSimple = init({
  appId: APP_ID,
});

// Test function to save minimal user data
export async function testSaveUser(userId: string, username: string) {
  try {
    console.log('Test save - attempting to save user:', { userId, username });
    
    // Method 1: Using tx helper with link
    try {
      const result1 = await dbSimple.transact([
        tx.users[userId].link({ username })
      ]);
      console.log('Method 1 (tx helper with link) successful:', result1);
      return true;
    } catch (e1) {
      console.error('Method 1 failed:', e1);
    }
    
    // Method 2: Using array format
    try {
      const result2 = await dbSimple.transact([
        ['update', 'users', userId, { username }]
      ]);
      console.log('Method 2 (array format) successful:', result2);
      return true;
    } catch (e2) {
      console.error('Method 2 failed:', e2);
    }
    
    // Method 3: Create a new ID
    try {
      const newId = id();
      const result3 = await dbSimple.transact([
        tx.testusers[newId].update({ userId, username })
      ]);
      console.log('Method 3 (new collection) successful:', result3);
      return true;
    } catch (e3) {
      console.error('Method 3 failed:', e3);
    }
    
    return false;
  } catch (error) {
    console.error('Test save failed completely:', error);
    return false;
  }
}

export { tx as txSimple, id as idSimple };