import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { useFriends } from '@/contexts/FriendsContextHooks';
import { useUser } from '@clerk/clerk-expo';
import { useCurrentUserData } from '@/lib/useCurrentUserData';

interface LeaderboardProps {
  showHeader?: boolean;
  currentUserId?: string;
}

export default function Leaderboard({ showHeader = true }: LeaderboardProps) {
  const { user } = useUser();
  const { friends, isLoading, refreshData } = useFriends();
  const { currentStreak, longestStreak, userData } = useCurrentUserData();
  const [leaderboardType, setLeaderboardType] = useState<'current_streak' | 'longest_streak'>('current_streak');
  const [refreshing, setRefreshing] = useState(false);

  // Include current user in leaderboard
  const leaderboardUsers = React.useMemo(() => {
    if (!user) return friends;
    
    // Create a user object for the current user
    const currentUser = {
      id: user.id,
      clerkId: user.id,
      name: userData?.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'You',
      username: userData?.username || user.username || user.id,
      email: user.primaryEmailAddress?.emailAddress || '',
      currentStreak: currentStreak,
      longestStreak: longestStreak,
      startDate: userData?.startDate || new Date().toISOString().split('T')[0],
      profilePhoto: userData?.profilePhoto || user.imageUrl,
      preferences: userData?.preferences || {
        useMetricUnits: false,
        notificationsEnabled: true
      },
      createdAt: userData?.createdAt || new Date().toISOString()
    };

    // Combine and sort by selected streak type
    const allUsers = [currentUser, ...friends];
    return allUsers.sort((a, b) => {
      const aValue = leaderboardType === 'current_streak' ? a.currentStreak : a.longestStreak;
      const bValue = leaderboardType === 'current_streak' ? b.currentStreak : b.longestStreak;
      return bValue - aValue;
    });
  }, [friends, user, leaderboardType, currentStreak, longestStreak, userData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const getRankIcon = (rank: number): string => {
    switch (rank) {
      case 1:
        return 'crown.fill';
      case 2:
        return '2.circle.fill';
      case 3:
        return '3.circle.fill';
      default:
        return `${rank}.circle`;
    }
  };

  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1:
        return '#ffd700'; // Gold
      case 2:
        return '#c0c0c0'; // Silver
      case 3:
        return '#cd7f32'; // Bronze
      default:
        return '#6b7280';
    }
  };

  const getStreakValue = (user: any): number => {
    return leaderboardType === 'current_streak' ? user.currentStreak : user.longestStreak;
  };

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Leaderboard</ThemedText>
          <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
            <IconSymbol 
              name="arrow.clockwise" 
              size={20} 
              color={refreshing ? "#6b7280" : "#3b82f6"} 
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Toggle buttons */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            leaderboardType === 'current_streak' && styles.toggleButtonActive
          ]}
          onPress={() => setLeaderboardType('current_streak')}
        >
          <ThemedText style={[
            styles.toggleText,
            leaderboardType === 'current_streak' && styles.toggleTextActive
          ]}>
            Current Streak
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.toggleButton,
            leaderboardType === 'longest_streak' && styles.toggleButtonActive
          ]}
          onPress={() => setLeaderboardType('longest_streak')}
        >
          <ThemedText style={[
            styles.toggleText,
            leaderboardType === 'longest_streak' && styles.toggleTextActive
          ]}>
            Best Streak
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.leaderboardContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyStateText}>Loading leaderboard...</ThemedText>
          </View>
        ) : leaderboardUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="trophy" size={48} color="#6b7280" />
            <ThemedText style={styles.emptyStateText}>No data available</ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              Add friends to see leaderboard rankings!
            </ThemedText>
          </View>
        ) : (
          leaderboardUsers.map((leaderUser, index) => {
            const rank = index + 1;
            const streakValue = getStreakValue(leaderUser);
            const rankIcon = getRankIcon(rank);
            const rankColor = getRankColor(rank);
            const isCurrentUser = leaderUser.clerkId === user?.id;

            return (
              <View
                key={leaderUser.id}
                style={[
                  styles.leaderboardItem,
                  isCurrentUser && styles.currentUserItem
                ]}
              >
                <View style={styles.rankContainer}>
                  <IconSymbol name={rankIcon} size={28} color={rankColor} />
                  <ThemedText style={[styles.rankText, { color: rankColor }]}>
                    #{rank}
                  </ThemedText>
                </View>

                <View style={styles.userInfo}>
                  <View style={styles.userAvatar}>
                    <IconSymbol name="person.circle.fill" size={40} color="#6b7280" />
                    {isCurrentUser && (
                      <View style={styles.currentUserBadge}>
                        <IconSymbol name="person.fill" size={12} color="#3b82f6" />
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.userDetails}>
                    <View style={styles.userNameContainer}>
                      <ThemedText style={styles.userName}>
                        {leaderUser.name}
                        {isCurrentUser && (
                          <ThemedText style={styles.youText}> (You)</ThemedText>
                        )}
                      </ThemedText>
                      <ThemedText style={styles.userUsername}>@{leaderUser.username}</ThemedText>
                    </View>
                    
                    <View style={styles.streakContainer}>
                      <IconSymbol name="flame.fill" size={16} color="#f59e0b" />
                      <ThemedText style={styles.streakText}>
                        {streakValue} day{streakValue !== 1 ? 's' : ''}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                <View style={styles.scoreContainer}>
                  <ThemedText style={styles.scoreValue}>
                    {streakValue}
                  </ThemedText>
                  <ThemedText style={styles.scoreLabel}>
                    {leaderboardType === 'current_streak' ? 'Current' : 'Best'}
                  </ThemedText>
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
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#3b82f6',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  leaderboardContainer: {
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
  leaderboardItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentUserItem: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e293b',
  },
  rankContainer: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 50,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  userAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  currentUserBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  userDetails: {
    flex: 1,
  },
  userNameContainer: {
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  youText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
  },
  userUsername: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
});