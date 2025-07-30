import { db, tx, id, Friendship, SocialActivity, Encouragement, User } from './instant';

export class FriendshipService {
  // Create a new friend request
  static async sendFriendRequest(requesterId: string, receiverId: string): Promise<string> {
    try {
      const friendshipId = id();
      
      await db.transact([
        tx.friendships[friendshipId].update({
          id: friendshipId,
          requesterId,
          receiverId,
          status: 'pending',
          createdAt: new Date().toISOString(),
        })
      ]);
      
      // Create activity for friend request sent
      await this.createActivity(requesterId, 'friend_added', { friendId: receiverId });
      
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
      
      // Note: In React Native, we can't directly query like this
      // The activity creation will happen through the component that has access to the data
      // or we need to pass the friendship data to this method
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

  // Get all friends for a user (accepted friendships)
  static async getFriends(userId: string): Promise<User[]> {
    try {
      // Query friendships where user is either requester or receiver with accepted status
      const { data } = await db.queryOnce({
        friendships: {
          $: {
            where: {
              or: [
                { and: [{ requesterId: userId }, { status: 'accepted' }] },
                { and: [{ receiverId: userId }, { status: 'accepted' }] }
              ]
            }
          }
        },
        users: {}
      });

      if (!data?.friendships || !data?.users) {
        return [];
      }

      // Extract friend IDs
      const friendIds = Object.values(data.friendships).map((friendship: any) => {
        return friendship.requesterId === userId ? friendship.receiverId : friendship.requesterId;
      });

      // Return user objects for friends
      return friendIds
        .map(friendId => data.users[friendId])
        .filter(Boolean) as User[];
    } catch (error) {
      console.error('Failed to get friends:', error);
      return [];
    }
  }

  // Get pending friend requests for a user
  static async getPendingRequests(userId: string): Promise<{
    incoming: (Friendship & { requester?: User })[];
    outgoing: (Friendship & { receiver?: User })[];
  }> {
    try {
      const { data } = await db.queryOnce({
        friendships: {
          $: {
            where: {
              and: [
                { status: 'pending' },
                { or: [{ requesterId: userId }, { receiverId: userId }] }
              ]
            }
          }
        },
        users: {}
      });

      if (!data?.friendships) {
        return { incoming: [], outgoing: [] };
      }

      const friendships = Object.values(data.friendships) as Friendship[];
      const users = data.users || {};

      const incoming = friendships
        .filter(f => f.receiverId === userId)
        .map(f => ({
          ...f,
          requester: users[f.requesterId] as User
        }));

      const outgoing = friendships
        .filter(f => f.requesterId === userId)
        .map(f => ({
          ...f,
          receiver: users[f.receiverId] as User
        }));

      return { incoming, outgoing };
    } catch (error) {
      console.error('Failed to get pending requests:', error);
      return { incoming: [], outgoing: [] };
    }
  }

  // Check if two users are friends
  static async areFriends(userId1: string, userId2: string): Promise<boolean> {
    try {
      const { data } = await db.queryOnce({
        friendships: {
          $: {
            where: {
              and: [
                { status: 'accepted' },
                {
                  or: [
                    { and: [{ requesterId: userId1 }, { receiverId: userId2 }] },
                    { and: [{ requesterId: userId2 }, { receiverId: userId1 }] }
                  ]
                }
              ]
            }
          }
        }
      });

      return data?.friendships && Object.keys(data.friendships).length > 0;
    } catch (error) {
      console.error('Failed to check friendship:', error);
      return false;
    }
  }

  // Remove a friend (delete the friendship)
  static async removeFriend(userId: string, friendId: string): Promise<void> {
    try {
      const { data } = await db.queryOnce({
        friendships: {
          $: {
            where: {
              and: [
                { status: 'accepted' },
                {
                  or: [
                    { and: [{ requesterId: userId }, { receiverId: friendId }] },
                    { and: [{ requesterId: friendId }, { receiverId: userId }] }
                  ]
                }
              ]
            }
          }
        }
      });

      if (data?.friendships) {
        const friendshipIds = Object.keys(data.friendships);
        // Delete all matching friendships
        for (const friendshipId of friendshipIds) {
          await db.transact([
            tx.friendships[friendshipId].delete()
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to remove friend:', error);
      throw error;
    }
  }

  // Create a social activity
  static async createActivity(
    userId: string, 
    type: SocialActivity['type'], 
    data: any
  ): Promise<void> {
    try {
      const activityId = id();
      
      await db.transact([
        tx.socialActivities[activityId].update({
          id: activityId,
          userId,
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

  // Get activities from friends
  static async getFriendActivities(userId: string, limit: number = 50): Promise<SocialActivity[]> {
    try {
      // First get all friend IDs
      const friends = await this.getFriends(userId);
      const friendIds = friends.map(f => f.id);
      
      if (friendIds.length === 0) {
        return [];
      }

      // Query activities from friends
      const { data } = await db.queryOnce({
        socialActivities: {
          $: {
            where: {
              userId: { in: friendIds }
            },
            limit,
            order: {
              createdAt: 'desc'
            }
          }
        }
      });

      if (!data?.socialActivities) {
        return [];
      }

      return Object.values(data.socialActivities) as SocialActivity[];
    } catch (error) {
      console.error('Failed to get friend activities:', error);
      return [];
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
      
      await db.transact([
        tx.encouragements[encouragementId].update({
          id: encouragementId,
          fromUserId,
          toUserId,
          activityId,
          message,
          type: 'encouragement',
          createdAt: new Date().toISOString(),
        })
      ]);
    } catch (error) {
      console.error('Failed to send encouragement:', error);
      throw error;
    }
  }

  // Get encouragements for a user
  static async getEncouragements(userId: string): Promise<Encouragement[]> {
    try {
      const { data } = await db.queryOnce({
        encouragements: {
          $: {
            where: {
              toUserId: userId
            },
            order: {
              createdAt: 'desc'
            }
          }
        }
      });

      if (!data?.encouragements) {
        return [];
      }

      return Object.values(data.encouragements) as Encouragement[];
    } catch (error) {
      console.error('Failed to get encouragements:', error);
      return [];
    }
  }
}