import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { db } from '@/lib/instant';

export function DebugFriendships() {
  const { data, isLoading, error } = db.useQuery({ 
    friendships: {},
    users: {} 
  });
  
  const friendships = data?.friendships ? Object.values(data.friendships) : [];
  
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>All Friendships in InstantDB:</ThemedText>
      
      {isLoading && <ThemedText>Loading...</ThemedText>}
      {error && <ThemedText style={styles.error}>Error: {error.message}</ThemedText>}
      
      <ScrollView style={styles.list}>
        {friendships.length === 0 ? (
          <ThemedText style={styles.noData}>No friendships found in database</ThemedText>
        ) : (
          friendships.map((friendship: any) => (
            <View key={friendship.id} style={styles.item}>
              <ThemedText style={styles.info}>
                ID: {friendship.id}
              </ThemedText>
              <ThemedText style={styles.info}>
                Status: {friendship.status || 'Not set'}
              </ThemedText>
              <ThemedText style={styles.info}>
                Requester ID: {friendship.requesterId || 'Not set'}
              </ThemedText>
              <ThemedText style={styles.info}>
                Receiver ID: {friendship.receiverId || 'Not set'}
              </ThemedText>
              <ThemedText style={styles.info}>
                Clerk Requester: {friendship.clerkRequesterId || 'Not set'}
              </ThemedText>
              <ThemedText style={styles.info}>
                Clerk Receiver: {friendship.clerkReceiverId || 'Not set'}
              </ThemedText>
              <ThemedText style={styles.info}>
                Created: {friendship.createdAt || 'Not set'}
              </ThemedText>
            </View>
          ))
        )}
      </ScrollView>
      
      <ThemedText style={styles.hint}>
        Total friendships: {friendships.length}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#ffffff',
  },
  list: {
    maxHeight: 400,
  },
  item: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
  },
  info: {
    fontSize: 12,
    color: '#e5e7eb',
    marginBottom: 2,
  },
  noData: {
    color: '#9ca3af',
    textAlign: 'center',
    padding: 20,
  },
  error: {
    color: '#ef4444',
    marginBottom: 10,
  },
  hint: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 10,
  },
});