import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { db } from '@/lib/instant';
import { useFriends } from '@/contexts/FriendsContextHooks';

export function DebugActivities() {
  const { data, isLoading, error } = db.useQuery({ 
    socialActivities: {
      $: {
        limit: 20
      }
    },
    users: {} 
  });
  
  const { friends, friendIds } = useFriends();
  const activities = data?.socialActivities ? Object.values(data.socialActivities) : [];
  
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Debug: All Activities in DB</ThemedText>
      
      <ThemedText style={styles.info}>
        Friends count: {friends.length}
      </ThemedText>
      <ThemedText style={styles.info}>
        Friend IDs: {friendIds?.join(', ') || 'None'}
      </ThemedText>
      
      {isLoading && <ThemedText>Loading...</ThemedText>}
      {error && <ThemedText style={styles.error}>Error: {error.message}</ThemedText>}
      
      <ScrollView style={styles.list}>
        {activities.length === 0 ? (
          <ThemedText style={styles.noData}>No activities found</ThemedText>
        ) : (
          activities.map((activity: any) => (
            <View key={activity.id} style={styles.item}>
              <ThemedText style={styles.info}>
                Type: {activity.type}
              </ThemedText>
              <ThemedText style={styles.info}>
                User ID: {activity.userId}
              </ThemedText>
              <ThemedText style={styles.info}>
                Clerk ID: {activity.clerkUserId || 'Not set'}
              </ThemedText>
              <ThemedText style={styles.info}>
                Data: {JSON.stringify(activity.data)}
              </ThemedText>
              <ThemedText style={styles.info}>
                Created: {activity.createdAt}
              </ThemedText>
              <ThemedText style={styles.info}>
                User: {data?.users[activity.userId]?.name || 'Unknown'}
              </ThemedText>
              <ThemedText style={styles.info}>
                Username: {data?.users[activity.userId]?.username || 'Not set'}
              </ThemedText>
              <ThemedText style={styles.info}>
                Is friend ID: {friendIds?.includes(activity.userId) ? 'Yes' : 'No'}
              </ThemedText>
            </View>
          ))
        )}
      </ScrollView>
      
      <ThemedText style={styles.hint}>
        Total activities: {activities.length}
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