import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from './ThemedText';
import { db } from '@/lib/instant';

export function DebugEncouragements() {
  // Query ALL encouragements without filtering
  const { data, isLoading, error } = db.useQuery({
    encouragements: {
      $: {
        limit: 10
      }
    }
  });

  console.log('[DebugEncouragements] Query result:', {
    hasData: !!data,
    isLoading,
    error,
    encouragementsData: data?.encouragements,
    count: data?.encouragements ? data.encouragements.length : 0,
    type: Array.isArray(data?.encouragements) ? 'array' : typeof data?.encouragements
  });

  const encouragements = data?.encouragements || [];

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Debug: All Encouragements ({encouragements.length})</ThemedText>
      {isLoading ? (
        <ThemedText>Loading...</ThemedText>
      ) : error ? (
        <ThemedText style={styles.error}>Error: {JSON.stringify(error)}</ThemedText>
      ) : (
        <ScrollView style={styles.list}>
          {encouragements.length === 0 ? (
            <ThemedText style={styles.empty}>No encouragements in database</ThemedText>
          ) : (
            encouragements.slice(0, 10).map((enc: any, index: number) => (
              <View key={enc.id || index} style={styles.item}>
                <ThemedText style={styles.label}>From: {enc.fromUserId?.substring(0, 20)}...</ThemedText>
                <ThemedText style={styles.label}>To: {enc.toUserId?.substring(0, 20)}...</ThemedText>
                <ThemedText style={styles.label}>Message: {enc.message}</ThemedText>
                <ThemedText style={styles.label}>Created: {enc.createdAt ? new Date(enc.createdAt).toLocaleString() : 'Unknown'}</ThemedText>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#ffffff',
  },
  list: {
    maxHeight: 200,
  },
  item: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  empty: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  error: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    paddingVertical: 20,
  },
});