import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { db, tx, id } from '@/lib/instant';

export function TestDirectSave() {
  const [savedId, setSavedId] = useState<string | null>(null);
  
  const testDirectSave = async () => {
    try {
      const testId = id();
      console.log('Testing direct save with ID:', testId);
      
      // Try the simplest possible save
      await db.transact([
        tx.testusers[testId].update({
          test: 'value',
          timestamp: Date.now()
        })
      ]);
      
      console.log('Direct save successful!');
      setSavedId(testId);
      Alert.alert('Success', `Saved with ID: ${testId}`);
    } catch (error: any) {
      console.error('Direct save failed:', error);
      Alert.alert('Error', error.message);
    }
  };
  
  const checkData = () => {
    // This will trigger a re-render and the hook in DebugUsers should update
    Alert.alert('Check Debug Panel', 'The debug panel below should update with any saved data');
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={testDirectSave}>
        <ThemedText style={styles.buttonText}>Test Direct Save</ThemedText>
      </TouchableOpacity>
      
      {savedId && (
        <>
          <ThemedText style={styles.savedText}>Saved ID: {savedId}</ThemedText>
          <TouchableOpacity style={styles.button} onPress={checkData}>
            <ThemedText style={styles.buttonText}>Refresh Debug Panel</ThemedText>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  button: {
    backgroundColor: '#059669',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  savedText: {
    color: '#10b981',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
});