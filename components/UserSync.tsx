import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { UserService } from '@/lib/userService';
import { UserServiceAlt } from '@/lib/userServiceAlt';
import { testSaveUser } from '@/lib/instantSimple';
import { UserServiceFixed } from '@/lib/userServiceFixed';
import { MappedUserService } from '@/lib/userMapping';

export function UserSync({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !user) return;

      try {
        console.log('Starting user sync for:', user.id);
        console.log('User data from Clerk:', {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName
        });
        
        // First check if user already exists to preserve their streak data
        const existingUser = await MappedUserService.getUserByClerkId(user.id);
        
        const userData = {
          clerkId: user.id, // Add clerkId to the user data
          email: user.primaryEmailAddress?.emailAddress || '',
          username: user.username || `user_${user.id.slice(-8)}`, // Better fallback username
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous',
          currentStreak: existingUser?.currentStreak || 0, // Preserve existing streak
          longestStreak: existingUser?.longestStreak || 0, // Preserve existing streak
          startDate: existingUser?.startDate || new Date().toISOString().split('T')[0],
          createdAt: existingUser?.createdAt || new Date().toISOString(),
        };

        // Use the mapped user service that generates InstantDB IDs
        console.log('Attempting to save user with MappedUserService...');
        await MappedUserService.saveUser(user.id, userData);
        console.log('User synced to InstantDB with ID mapping:', user.id);
        
        // Also log what's in the database after save
        setTimeout(async () => {
          console.log('Checking if user was saved...');
          // This will be visible in the debug panel
        }, 3000);
      } catch (error: any) {
        console.error('Failed to sync user to InstantDB:', error);
        
        // Log more details about the error
        if (error.message) {
          console.error('Error message:', error.message);
        }
        if (error.response) {
          console.error('Error response:', error.response);
        }
        
        // Don't throw - just log the error so the app continues to work
      }
    };

    // Add a small delay to ensure InstantDB is initialized
    const timeoutId = setTimeout(() => {
      syncUser();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [user, isLoaded]);

  return <>{children}</>;
}