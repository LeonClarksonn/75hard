import { init } from '@instantdb/react-native';

const APP_ID = process.env.EXPO_PUBLIC_INSTANT_APP_ID;

if (!APP_ID) {
  throw new Error('Missing EXPO_PUBLIC_INSTANT_APP_ID environment variable');
}

// Initialize a separate instance for auth
export const authDb = init({ 
  appId: APP_ID,
});

// Simple auth-based user creation
export async function createOrUpdateUser(userId: string, userData: any) {
  try {
    console.log('Creating/updating user via auth method:', { userId, userData });
    
    // Try using the auth pattern from InstantDB
    // This might be the expected format for user creation
    const result = await authDb.auth.createUser({
      id: userId,
      email: userData.email,
      ...userData
    });
    
    console.log('Auth method successful:', result);
    return true;
  } catch (error) {
    console.error('Auth method failed:', error);
    
    // Fallback: Try a simple key-value update
    try {
      // InstantDB might expect a different structure for users
      // Let's try treating it as a simple key-value store
      const simpleResult = await authDb.transact({
        __users: {
          [userId]: {
            email: userData.email,
            username: userData.username
          }
        }
      });
      
      console.log('Simple KV method successful:', simpleResult);
      return true;
    } catch (kvError) {
      console.error('KV method also failed:', kvError);
      return false;
    }
  }
}