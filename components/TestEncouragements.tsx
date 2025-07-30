import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { db, tx, id } from '@/lib/instant';

export function TestEncouragements() {
  const handleTestCreate = async () => {
    try {
      const testId = id();
      console.log('[TestEncouragements] Creating test encouragement with ID:', testId);
      
      // Try the simplest possible create
      const result = await db.transact([
        tx.encouragements[testId].update({
          fromUserId: 'test-from',
          toUserId: 'test-to',
          message: 'Test message',
          type: 'encouragement',
          createdAt: new Date().toISOString(),
        })
      ]);
      
      console.log('[TestEncouragements] Create result:', result);
      
      // Immediately query
      const query = await db.queryOnce({
        encouragements: {}
      });
      
      console.log('[TestEncouragements] Query result:', {
        hasData: !!query.data,
        encouragements: query.data?.encouragements,
        count: query.data?.encouragements ? Object.keys(query.data.encouragements).length : 0,
        firstItem: query.data?.encouragements ? query.data.encouragements[0] : null,
        isArray: Array.isArray(query.data?.encouragements),
        keys: query.data?.encouragements ? Object.keys(query.data.encouragements).slice(0, 3) : []
      });
    } catch (error) {
      console.error('[TestEncouragements] Error:', error);
    }
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleTestCreate}>
        <ThemedText>Test Create Encouragement</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});