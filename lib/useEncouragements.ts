import { db } from './instant';
import { useUser } from '@clerk/clerk-expo';

export function useEncouragements() {
  const { user } = useUser();
  
  console.log('[useEncouragements] Current user:', user?.id);
  
  if (!user?.id) {
    return { data: null, isLoading: false, encouragements: [] };
  }
  
  // Query encouragements where the current user is the recipient
  const query = {
    encouragements: {
      $: {
        where: {
          toUserId: user.id
        },
        limit: 50
      }
    },
    users: {}
  };
  
  console.log('[useEncouragements] Query for user:', user.id);
  
  const result = db.useQuery(query);
  
  console.log('[useEncouragements] Query result:', {
    hasData: !!result.data,
    encouragementCount: result.data?.encouragements ? Object.keys(result.data.encouragements).length : 0,
    encouragements: result.data?.encouragements
  });
  
  // Process encouragements to include sender info
  let encouragements = [];
  
  if (result.data?.encouragements) {
    // Check if it's an array or object
    const encouragementsData = result.data.encouragements;
    const encouragementsList = Array.isArray(encouragementsData) 
      ? encouragementsData 
      : Object.values(encouragementsData);
    
    const users = result.data?.users || {};
    const usersList = Array.isArray(users) ? users : Object.values(users);
    
    encouragements = encouragementsList.map((enc: any) => {
      // Find sender by matching Clerk ID
      const sender = usersList.find((u: any) => u.clerkId === enc.fromUserId);
      
      console.log('[useEncouragements] Processing encouragement:', {
        from: enc.fromUserId,
        to: enc.toUserId,
        foundSender: !!sender,
        senderName: sender?.username || sender?.name
      });
      
      return {
        ...enc,
        senderName: sender?.username || sender?.name || 'Someone',
        sender
      };
    });
  }
  
  return {
    ...result,
    encouragements
  };
}