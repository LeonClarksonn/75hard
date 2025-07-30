import { db, tx, id } from './instant';
import { UserMapping } from './userMapping';

export class FriendshipService {
  // Create a new friend request
  static async sendFriendRequest(clerkRequesterId: string, clerkReceiverId: string): Promise<string> {
    try {
      // Prevent self-friending
      if (clerkRequesterId === clerkReceiverId) {
        throw new Error('Cannot send friend request to yourself');
      }
      
      // Map Clerk IDs to InstantDB IDs
      const requesterId = await UserMapping.getInstantId(clerkRequesterId);
      const receiverId = await UserMapping.getInstantId(clerkReceiverId);
      
      const friendshipId = id();
      
      await db.transact([
        tx.friendships[friendshipId].update({
          requesterId,
          receiverId,
          clerkRequesterId, // Store original Clerk IDs too
          clerkReceiverId,
          status: 'pending',
          createdAt: new Date().toISOString(),
        })
      ]);
      
      // Create activity for friend request sent
      await this.createActivity(clerkRequesterId, 'friend_added', { friendId: clerkReceiverId });
      
      return friendshipId;
    } catch (error) {
      console.error('Failed to send friend request:', error);
      throw error;
    }
  }

  // Accept a friend request
  static async acceptFriendRequest(friendshipId: string): Promise<void> {
    try {
      await db.transact([
        tx.friendships[friendshipId].update({
          status: 'accepted'
        })
      ]);
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      throw error;
    }
  }

  // Reject a friend request
  static async rejectFriendRequest(friendshipId: string): Promise<void> {
    try {
      await db.transact([
        tx.friendships[friendshipId].update({
          status: 'rejected'
        })
      ]);
    } catch (error) {
      console.error('Failed to reject friend request:', error);
      throw error;
    }
  }

  // Remove a friend (delete the friendship)
  static async removeFriend(userId: string, friendId: string): Promise<void> {
    try {
      // Since we can't query in React Native, we'll need to pass the friendship ID
      // or handle this in the component that has access to the data
      console.log('Remove friend called for:', userId, friendId);
      // The actual deletion will need to be handled by the component with the friendship ID
    } catch (error) {
      console.error('Failed to remove friend:', error);
      throw error;
    }
  }

  // Create a social activity
  static async createActivity(
    clerkUserId: string, 
    type: 'task_completed' | 'day_completed' | 'streak_milestone' | 'friend_added',
    data: any
  ): Promise<void> {
    try {
      // Map Clerk ID to InstantDB ID
      const userId = await UserMapping.getInstantId(clerkUserId);
      const activityId = id();
      
      await db.transact([
        tx.socialActivities[activityId].update({
          userId,
          clerkUserId, // Store original Clerk ID too
          type,
          data,
          isPublic: true,
          createdAt: new Date().toISOString(),
        })
      ]);
    } catch (error) {
      console.error('Failed to create activity:', error);
    }
  }

  // Send encouragement
  static async sendEncouragement(
    fromUserId: string,
    toUserId: string,
    message: string,
    activityId?: string
  ): Promise<void> {
    try {
      const encouragementId = id();
      
      console.log('[FriendshipService] Creating encouragement with ID:', encouragementId);
      console.log('[FriendshipService] Encouragement data:', {
        fromUserId,
        toUserId,
        activityId,
        message,
        type: 'encouragement',
        createdAt: new Date().toISOString(),
      });
      
      await db.transact([
        tx.encouragements[encouragementId].update({
          fromUserId,
          toUserId,
          activityId,
          message,
          type: 'encouragement',
          createdAt: new Date().toISOString(),
        })
      ]);
      
      console.log('[FriendshipService] Encouragement saved successfully');
      
      // Verify the save by querying back
      const verifyQuery = await db.queryOnce({
        encouragements: {
          $: {
            where: {
              id: encouragementId
            }
          }
        }
      });
      
      console.log('[FriendshipService] Verification query result:', {
        found: !!verifyQuery.data?.encouragements,
        encouragement: verifyQuery.data?.encouragements ? Object.values(verifyQuery.data.encouragements)[0] : null
      });
    } catch (error) {
      console.error('[FriendshipService] Failed to send encouragement - Full error:', error);
      throw error;
    }
  }
}