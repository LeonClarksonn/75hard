import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useFriends } from '@/contexts/FriendsContextHooks';

export function RefreshFriendsButton() {
  const { refreshData } = useFriends();
  
  const handleRefresh = async () => {
    console.log('Manually refreshing friends data...');
    await refreshData();
    console.log('Friends data refreshed');
  };
  
  return (
    <TouchableOpacity style={styles.button} onPress={handleRefresh}>
      <ThemedText style={styles.buttonText}>Manual Refresh Friends</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});