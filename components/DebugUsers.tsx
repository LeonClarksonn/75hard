import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useAllUsers } from '@/lib/instantHooks';
import { db } from '@/lib/instant';
import { useUser } from '@clerk/clerk-expo';

export function DebugUsers() {
  const { user: clerkUser } = useUser();
  const { data, isLoading, error } = useAllUsers();
  
  // Also try to get testusers collection
  const testQuery = db.useQuery({ testusers: {} });
  
  const users = data?.users ? Object.entries(data.users) : [];
  const testUsers = testQuery.data?.testusers ? Object.values(testQuery.data.testusers) : [];
  
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>All Users in InstantDB:</ThemedText>
      
      {isLoading && <ThemedText>Loading...</ThemedText>}
      {error && <ThemedText style={styles.error}>Error: {error.message}</ThemedText>}
      
      <ScrollView style={styles.userList}>
        {users.length === 0 ? (
          <ThemedText style={styles.noUsers}>No users found in database</ThemedText>
        ) : (
          users.map(([key, user]: [string, any]) => (
            <View key={key} style={styles.userItem}>
              <ThemedText style={styles.userHeader}>
                Index Key: {key}
              </ThemedText>
              <ThemedText style={styles.userInfo}>
                ID: {user.id}
              </ThemedText>
              <ThemedText style={styles.userInfo}>
                Clerk ID: {user.clerkId || 'Not set'}
              </ThemedText>
              <ThemedText style={styles.userInfo}>
                Username: {user.username || 'Not set'}
              </ThemedText>
              <ThemedText style={styles.userInfo}>
                Email: {user.email || 'Not set'}
              </ThemedText>
              <ThemedText style={styles.userInfo}>
                Name: {user.name || 'Not set'}
              </ThemedText>
              <ThemedText style={styles.userInfo}>
                Is Current User: {user.clerkId === clerkUser?.id ? 'YES' : 'NO'}
              </ThemedText>
            </View>
          ))
        )}
      </ScrollView>
      
      <ThemedText style={styles.hint}>
        Total users: {users.length}
      </ThemedText>
      
      {testUsers.length > 0 && (
        <>
          <ThemedText style={styles.title}>Test Users:</ThemedText>
          <ScrollView style={styles.userList}>
            {testUsers.map((user: any) => (
              <View key={user.id} style={styles.userItem}>
                <ThemedText style={styles.userInfo}>
                  Test ID: {user.id}
                </ThemedText>
                <ThemedText style={styles.userInfo}>
                  Data: {JSON.stringify(user)}
                </ThemedText>
              </View>
            ))}
          </ScrollView>
        </>
      )}
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
  userList: {
    maxHeight: 300,
  },
  userItem: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
  },
  userHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fbbf24',
    marginBottom: 5,
  },
  userInfo: {
    fontSize: 12,
    color: '#e5e7eb',
    marginBottom: 2,
  },
  noUsers: {
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