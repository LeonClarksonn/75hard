import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { SocialService } from '@/lib/socialService';
import { useFriends } from '@/contexts/FriendsContextHooks';
import { FriendshipService } from '@/lib/friendshipServiceSimple';
import { useUser } from '@clerk/clerk-expo';

interface SocialFeedProps {
  limit?: number;
  showHeader?: boolean;
}

export default function SocialFeed({ limit = 20, showHeader = true }: SocialFeedProps) {
  const { user } = useUser();
  const { activities, friends, isLoading, refreshData } = useFriends();
  const [refreshing, setRefreshing] = useState(false);
  const [encouragedActivities, setEncouragedActivities] = useState<Set<string>>(new Set());
  
  // Load previously encouraged activities from AsyncStorage
  useEffect(() => {
    const loadEncouragedActivities = async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const stored = await AsyncStorage.getItem(`encouraged_activities_${user?.id}`);
        if (stored) {
          setEncouragedActivities(new Set(JSON.parse(stored)));
        }
      } catch (error) {
        console.error('Failed to load encouraged activities:', error);
      }
    };
    
    if (user?.id) {
      loadEncouragedActivities();
    }
  }, [user?.id]);

  // Filter activities to show only the most recent ones
  const displayActivities = activities.slice(0, limit);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleSendEncouragement = async (activityId: string, userId: string, userName: string) => {
    try {
      const encouragementMessages = [
        "Great job! Keep it up! 💪",
        "You're crushing it! 🔥",
        "Inspiring work! 👏",
        "Keep pushing forward! 🚀",
        "Amazing dedication! ⭐"
      ];
      
      const randomMessage = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
      
      if (!user?.id) {
        Alert.alert('Error', 'You must be logged in to send encouragement');
        return;
      }
      
      console.log('[SocialFeed] Sending encouragement:', {
        from: user.id,
        to: userId,
        activityId,
        message: randomMessage
      });
      
      console.log('[SocialFeed] About to call FriendshipService.sendEncouragement');
      try {
        await FriendshipService.sendEncouragement(user.id, userId, randomMessage, activityId);
        console.log('[SocialFeed] FriendshipService.sendEncouragement completed');
      } catch (err) {
        console.error('[SocialFeed] Error calling sendEncouragement:', err);
        throw err;
      }
      
      Alert.alert('Success', `Encouragement sent to ${userName}!`);
      
      // Mark this activity as encouraged
      const newEncouragedSet = new Set(encouragedActivities).add(activityId);
      setEncouragedActivities(newEncouragedSet);
      
      // Save to AsyncStorage
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem(
          `encouraged_activities_${user.id}`,
          JSON.stringify(Array.from(newEncouragedSet))
        );
      } catch (error) {
        console.error('Failed to save encouraged state:', error);
      }
      
      // Refresh the feed to show the interaction
      await refreshData();
    } catch (error) {
      console.error('Failed to send encouragement:', error);
      Alert.alert('Error', 'Failed to send encouragement');
    }
  };

  const getUserName = (activity: any): string => {
    // For activities, we need to match by InstantDB user ID
    if (activity.user) {
      // Prefer username over name for social feed
      if (activity.user.username) {
        return `@${activity.user.username}`;
      } else if (activity.user.name) {
        return activity.user.name;
      }
    }
    
    // Fallback to friendName/friendUsername if user object is not available
    if (activity.friendUsername) {
      return `@${activity.friendUsername}`;
    } else if (activity.friendName) {
      return activity.friendName;
    }
    
    return 'Someone';
  };

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'task_completed':
        return 'checkmark.circle.fill';
      case 'streak_milestone':
        return 'flame.fill';
      case 'day_completed':
        return 'star.fill';
      case 'challenge_joined':
        return 'person.2.fill';
      case 'friend_added':
        return 'person.badge.plus.fill';
      default:
        return 'bell.fill';
    }
  };

  const getActivityColor = (type: string): string => {
    switch (type) {
      case 'task_completed':
        return '#10b981';
      case 'streak_milestone':
        return '#f59e0b';
      case 'day_completed':
        return '#3b82f6';
      case 'challenge_joined':
        return '#8b5cf6';
      case 'friend_added':
        return '#06b6d4';
      default:
        return '#6b7280';
    }
  };

  if (isLoading && displayActivities.length === 0) {
    return (
      <View style={styles.emptyState}>
        <ThemedText style={styles.emptyStateText}>Loading feed...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Social Feed</ThemedText>
          <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
            <IconSymbol 
              name="arrow.clockwise" 
              size={20} 
              color={refreshing ? "#6b7280" : "#3b82f6"} 
            />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.feedContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {displayActivities.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="bell" size={48} color="#6b7280" />
            <ThemedText style={styles.emptyStateText}>No recent activity</ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              Add friends to see their progress and stay motivated together!
            </ThemedText>
          </View>
        ) : (
          displayActivities.map((activity) => {
            const userName = getUserName(activity);
            const activityMessage = SocialService.formatActivityMessage(activity, userName);
            const activityIcon = getActivityIcon(activity.type);
            const activityColor = getActivityColor(activity.type);
            
            console.log('[SocialFeed] Activity data:', {
              id: activity.id,
              userId: activity.userId,
              clerkUserId: activity.clerkUserId,
              userName
            });

            return (
              <View key={activity.id} style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <View style={styles.activityInfo}>
                    <View style={[styles.activityIcon, { backgroundColor: activityColor }]}>
                      <IconSymbol name={activityIcon} size={16} color="#ffffff" />
                    </View>
                    <View style={styles.activityDetails}>
                      <ThemedText style={styles.activityText}>{activityMessage}</ThemedText>
                      <ThemedText style={styles.activityTime}>
                        {SocialService.getTimeAgo(activity.createdAt)}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Activity-specific content */}
                {activity.type === 'streak_milestone' && activity.data.streakDays && (
                  <View style={styles.milestoneContent}>
                    <View style={styles.milestoneCard}>
                      <IconSymbol name="flame.fill" size={24} color="#f59e0b" />
                      <ThemedText style={styles.milestoneText}>
                        {activity.data.streakDays} Day Streak!
                      </ThemedText>
                    </View>
                  </View>
                )}

                {activity.type === 'task_completed' && activity.data.taskName && (
                  <View style={styles.taskContent}>
                    <View style={styles.taskCard}>
                      <IconSymbol name="checkmark.circle.fill" size={20} color="#10b981" />
                      <ThemedText style={styles.taskName}>
                        {activity.data.taskName}
                      </ThemedText>
                    </View>
                  </View>
                )}

                {/* Interaction buttons */}
                <View style={styles.activityActions}>
                  <TouchableOpacity 
                    style={[
                      styles.encourageButton,
                      encouragedActivities.has(activity.id) && styles.encourageButtonActive
                    ]}
                    onPress={() => {
                      if (!encouragedActivities.has(activity.id)) {
                        handleSendEncouragement(activity.id, activity.clerkUserId || activity.userId, userName);
                      }
                    }}
                    disabled={encouragedActivities.has(activity.id)}
                  >
                    <IconSymbol 
                      name={encouragedActivities.has(activity.id) ? "heart.fill" : "heart"} 
                      size={16} 
                      color="#ef4444" 
                    />
                    <ThemedText style={[
                      styles.encourageText,
                      encouragedActivities.has(activity.id) && styles.encourageTextActive
                    ]}>
                      {encouragedActivities.has(activity.id) ? 'Encouraged' : 'Encourage'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.24,
  },
  feedContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
  activityCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  activityHeader: {
    marginBottom: 12,
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityDetails: {
    flex: 1,
  },
  activityText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#d1d5db',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  milestoneContent: {
    marginBottom: 12,
  },
  milestoneCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  milestoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f59e0b',
  },
  taskContent: {
    marginBottom: 12,
  },
  taskCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  taskName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10b981',
  },
  activityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  encourageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1f2937',
  },
  encourageText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ef4444',
  },
  encourageButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  encourageTextActive: {
    fontWeight: '600',
  },
});