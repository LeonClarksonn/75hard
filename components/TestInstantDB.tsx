import React from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { db, tx, id } from '@/lib/instant';

export function TestInstantDB() {
  const runTests = async () => {
    console.log('Starting InstantDB tests...');
    console.log('Environment check:');
    console.log('APP_ID:', process.env.EXPO_PUBLIC_INSTANT_APP_ID);
    
    const results = [];
    
    // Test 1: Simple ID
    try {
      await db.transact([
        tx.users['test123'].update({ username: 'testuser' })
      ]);
      results.push('✅ Test 1 passed: Simple ID');
    } catch (e) {
      results.push(`❌ Test 1 failed: ${e.message}`);
    }
    
    // Test 2: Generated ID
    try {
      const newId = id();
      await db.transact([
        tx.users[newId].update({ username: 'generated' })
      ]);
      results.push('✅ Test 2 passed: Generated ID');
    } catch (e) {
      results.push(`❌ Test 2 failed: ${e.message}`);
    }
    
    // Test 3: Complex data
    try {
      await db.transact([
        tx.users['test456'].update({
          username: 'complex',
          email: 'test@example.com',
          currentStreak: 5
        })
      ]);
      results.push('✅ Test 3 passed: Complex data');
    } catch (e) {
      results.push(`❌ Test 3 failed: ${e.message}`);
    }
    
    // Test 4: Clerk-like ID
    try {
      const clerkLikeId = 'user_2abcdefghijklmnopqrstuv';
      await db.transact([
        tx.users[clerkLikeId].update({ username: 'clerklike' })
      ]);
      results.push('✅ Test 4 passed: Clerk-like ID');
    } catch (e) {
      results.push(`❌ Test 4 failed: ${e.message}`);
    }
    
    // Test 5: Different namespace
    try {
      await db.transact([
        tx.profiles['test789'].update({ name: 'Test Profile' })
      ]);
      results.push('✅ Test 5 passed: Different namespace');
    } catch (e) {
      results.push(`❌ Test 5 failed: ${e.message}`);
    }
    
    const message = results.join('\n');
    console.log('Test results:', message);
    Alert.alert('InstantDB Test Results', message);
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={runTests}>
        <ThemedText style={styles.buttonText}>Test InstantDB Connection</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});