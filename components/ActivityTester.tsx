import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useUser } from '@clerk/clerk-expo';
import { FriendshipService } from '@/lib/friendshipServiceSimple';
import { Ionicons } from '@expo/vector-icons';

export function ActivityTester() {
  const { user } = useUser();

  const createTestActivity = async (type: string) => {
    if (!user?.id) return;

    try {
      console.log('Creating test activity for user:', user.id);
      
      // Create different types of activities
      switch (type) {
        case 'task':
          await FriendshipService.createActivity(user.id, 'task_completed', {
            taskName: 'Morning Workout',
            taskType: 'workout1'
          });
          break;
        case 'day':
          await FriendshipService.createActivity(user.id, 'day_completed', {
            dayNumber: 23,
            allTasksCompleted: true
          });
          break;
        case 'streak':
          await FriendshipService.createActivity(user.id, 'streak_milestone', {
            streakDays: 25,
            milestone: '25 days'
          });
          break;
      }
      
      console.log('Activity created successfully');
    } catch (error) {
      console.error('Failed to create activity:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Test Activity Creation</ThemedText>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => createTestActivity('task')}
      >
        <Ionicons name="checkmark-circle" size={20} color="#fff" />
        <ThemedText style={styles.buttonText}>Create Task Activity</ThemedText>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => createTestActivity('day')}
      >
        <Ionicons name="calendar" size={20} color="#fff" />
        <ThemedText style={styles.buttonText}>Create Day Completed</ThemedText>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => createTestActivity('streak')}
      >
        <Ionicons name="flame" size={20} color="#fff" />
        <ThemedText style={styles.buttonText}>Create Streak Milestone</ThemedText>
      </TouchableOpacity>
      
      <ThemedText style={styles.hint}>
        Create activities to test if they show up in the feed with proper usernames
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
    marginBottom: 15,
    color: '#ffffff',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    gap: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 10,
    textAlign: 'center',
  },
});