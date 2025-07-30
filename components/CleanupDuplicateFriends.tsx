import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { db, tx } from '@/lib/instant';
import { useUser } from '@clerk/clerk-expo';

export function CleanupDuplicateFriends() {
  const { user } = useUser();
  const [cleaning, setCleaning] = useState(false);
  
  const cleanupDuplicates = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'No user logged in');
      return;
    }
    
    setCleaning(true);
    try {
      const { data } = await db.queryOnce({ friendships: {} });
      
      if (!data?.friendships) {
        Alert.alert('Info', 'No friendships found');
        return;
      }
      
      const friendships = Object.values(data.friendships) as any[];
      const userFriendships = friendships.filter(f => 
        f.clerkRequesterId === user.id || f.clerkReceiverId === user.id
      );
      
      // Group by friend pair
      const friendPairs = new Map<string, any[]>();
      
      userFriendships.forEach(f => {
        // Create a consistent key for each friend pair
        const key = [f.clerkRequesterId, f.clerkReceiverId].sort().join('-');
        if (!friendPairs.has(key)) {
          friendPairs.set(key, []);
        }
        friendPairs.get(key)!.push(f);
      });
      
      let duplicatesRemoved = 0;
      const deleteTxs = [];
      
      // Check for duplicates
      for (const [key, friendshipList] of friendPairs) {
        if (friendshipList.length > 1) {
          console.log(`Found ${friendshipList.length} duplicate friendships for ${key}`);
          
          // Sort by status (accepted first) and then by creation date
          const sorted = friendshipList.sort((a, b) => {
            if (a.status === 'accepted' && b.status !== 'accepted') return -1;
            if (b.status === 'accepted' && a.status !== 'accepted') return 1;
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });
          
          const toKeep = sorted[0];
          console.log(`Keeping friendship ${toKeep.id} with status ${toKeep.status}`);
          
          // Delete the rest
          for (let i = 1; i < sorted.length; i++) {
            const friendship = sorted[i];
            console.log(`Deleting duplicate friendship ${friendship.id} with status ${friendship.status}`);
            deleteTxs.push(tx.friendships[friendship.id].delete());
            duplicatesRemoved++;
          }
        }
      }
      
      if (deleteTxs.length > 0) {
        await db.transact(deleteTxs);
        Alert.alert('Success', `Removed ${duplicatesRemoved} duplicate friendships`);
      } else {
        Alert.alert('Info', 'No duplicate friendships found');
      }
      
    } catch (error: any) {
      console.error('Failed to cleanup duplicates:', error);
      Alert.alert('Error', `Failed to cleanup: ${error.message}`);
    } finally {
      setCleaning(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.button, cleaning && styles.buttonDisabled]} 
        onPress={cleanupDuplicates}
        disabled={cleaning}
      >
        <ThemedText style={styles.buttonText}>
          {cleaning ? 'Cleaning...' : 'Clean Up Duplicate Friendships'}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#ef4444',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});