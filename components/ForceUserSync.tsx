import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useUser } from '@clerk/clerk-expo';
import { db, tx, id } from '@/lib/instant';

export function ForceUserSync() {
  const { user } = useUser();
  const [syncing, setSyncing] = useState(false);
  
  const forceSync = async () => {
    if (!user) {
      Alert.alert('Error', 'No user logged in');
      return;
    }
    
    setSyncing(true);
    try {
      // Generate a new InstantDB ID
      const instantId = id();
      
      console.log('Force syncing user:', {
        clerkId: user.id,
        instantId: instantId,
        username: user.username
      });
      
      // Try direct save to users collection
      await db.transact([
        tx.users[instantId].update({
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress || '',
          username: user.username || user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous',
          currentStreak: 0,
          longestStreak: 0,
          startDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
        })
      ]);
      
      Alert.alert('Success', `User synced with ID: ${instantId}`);
      console.log('Force sync successful!');
    } catch (error: any) {
      console.error('Force sync failed:', error);
      Alert.alert('Error', `Failed to sync: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.button, syncing && styles.buttonDisabled]} 
        onPress={forceSync}
        disabled={syncing}
      >
        <ThemedText style={styles.buttonText}>
          {syncing ? 'Syncing...' : 'Force Sync Current User'}
        </ThemedText>
      </TouchableOpacity>
      
      {user && (
        <View style={styles.info}>
          <ThemedText style={styles.infoText}>Current User:</ThemedText>
          <ThemedText style={styles.infoText}>Clerk ID: {user.id}</ThemedText>
          <ThemedText style={styles.infoText}>Username: {user.username || 'Not set'}</ThemedText>
          <ThemedText style={styles.infoText}>Email: {user.primaryEmailAddress?.emailAddress}</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#f59e0b',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    padding: 10,
    backgroundColor: '#1f2937',
    borderRadius: 8,
  },
  infoText: {
    color: '#e5e7eb',
    fontSize: 12,
    marginBottom: 2,
  },
});