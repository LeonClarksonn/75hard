import { StyleSheet, StatusBar, ScrollView, View, TouchableOpacity, SafeAreaView, Modal, TextInput, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import SocialFeed from '@/components/SocialFeed';
import Leaderboard from '@/components/Leaderboard';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import QRCodeScanner from '@/components/QRCodeScanner';
import { useFocusEffect } from '@react-navigation/native';
import { useRef, useState, useEffect } from 'react';
import { useFriends } from '@/contexts/FriendsContextHooks';
import { DemoSocialService } from '@/lib/socialService';
import { UserService } from '@/lib/userService';
import { useUserSearch } from '@/lib/instantHooks';
import { useUser as useClerkUser } from '@clerk/clerk-expo';

type Friend = {
  id: string;
  name: string;
  currentStreak: number;
  dayNumber: number;
  completedToday: number;
  totalTasks: number;
  isOnline: boolean;
};

type Activity = {
  id: string;
  friendName: string;
  action: string;
  time: string;
};

export default function FriendsScreen() {
  // Set status bar to light when this screen is focused
  useFocusEffect(
    useRef(() => {
      StatusBar.setBarStyle('light-content', true);
      return () => {
        // Cleanup
      };
    }).current
  );

  // Get current user
  const { user: clerkUser } = useClerkUser();
  
  // State management
  const {
    friends,
    friendRequests,
    activities,
    isLoading,
    refreshData,
    acceptFriendRequest,
    rejectFriendRequest,
    sendFriendRequest
  } = useFriends();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'activity' | 'leaderboard'>('friends');
  
  // Add friend modal state
  const [addFriendModalVisible, setAddFriendModalVisible] = useState(false);
  const [addFriendTab, setAddFriendTab] = useState<'search' | 'qr' | 'scan'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use the hook-based search directly without intermediate state
  const { filteredUsers, isLoading: searchLoading } = useUserSearch(searchQuery, clerkUser?.id || null);

  // Load initial data
  useEffect(() => {
    refreshData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      await refreshData();
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load friends data');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleAddFriend = () => {
    setAddFriendModalVisible(true);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  // Derive search results directly
  const searchResults = searchQuery.trim().length >= 2 ? (filteredUsers || []) : [];
  const isSearching = searchQuery.trim().length >= 2 && searchLoading;

  const handleSendFriendRequest = async (userId: string, userName: string, userData?: any) => {
    try {
      // Use the userData passed from search results instead of querying again
      const targetUser = userData || { 
        id: userId, 
        username: userName,
        name: userName,
        email: '',
        currentStreak: 0,
        longestStreak: 0,
        startDate: new Date().toISOString().split('T')[0]
      };
      
      // Create friend object from user data
      const friendData = {
        ...targetUser,
        clerkId: targetUser.clerkId || userId, // Include clerkId for the new system
      };
      
      await sendFriendRequest(friendData);
      Alert.alert('Success', `Friend request sent to ${targetUser.username || userName}`);
      setAddFriendModalVisible(false);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to send friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  const calculateProgress = (user: any) => {
    const startDate = new Date(user.startDate);
    const today = new Date();
    const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.min(daysSinceStart, 75);
  };

  const isUserAlreadyFriend = (userId: string) => {
    return friends.some(friend => friend.id === userId);
  };

  const hasPendingRequest = (userId: string) => {
    return friendRequests.outgoing.some(req => req.receiverId === userId);
  };

  const handleQRCodeScanned = async (friendCode: string) => {
    console.log('QR Code Scanned:', friendCode);
    try {
      // Parse the friend code URL to extract user info
      let userId: string = '';
      let username: string = '';

      // Try to parse as URL first
      if (friendCode.includes('add-friend') || friendCode.includes('userId')) {
        try {
          const url = new URL(friendCode);
          userId = url.searchParams.get('userId') || '';
          username = url.searchParams.get('username') || '';
          console.log('Parsed from URL - userId:', userId, 'username:', username);
        } catch (urlError) {
          console.log('Failed to parse as URL:', urlError);
        }
      }
      
      // If URL parsing failed, try JSON format
      if (!userId && !username) {
        try {
          const parsed = JSON.parse(friendCode);
          if (parsed.userId && parsed.username) {
            userId = parsed.userId;
            username = parsed.username;
            console.log('Parsed from JSON - userId:', userId, 'username:', username);
          }
        } catch (jsonError) {
          console.log('Failed to parse as JSON:', jsonError);
        }
      }

      if (!userId || !username) {
        throw new Error(`Invalid friend code format. Scanned: ${friendCode.substring(0, 100)}`);
      }

      // Check if already friends or has pending request
      if (isUserAlreadyFriend(userId)) {
        Alert.alert('Already Friends', `You're already friends with @${username}`);
        return;
      }

      if (hasPendingRequest(userId)) {
        Alert.alert('Request Pending', `You already sent a friend request to @${username}`);
        return;
      }

      // Create friend data directly from QR code info
      // The user should already exist in InstantDB if they generated a QR code
      const friendData = {
        id: userId,
        name: username,
        username: username,
        email: '',
        currentStreak: 0,
        longestStreak: 0,
        startDate: new Date().toISOString().split('T')[0],
        completedToday: 0,
        dayNumber: 1,
        isOnline: false,
        totalTasks: 0,
        clerkId: userId // Pass the clerk ID for the friend request
      };
      
      // Send friend request using context
      await sendFriendRequest(friendData);
      Alert.alert('Success', `Friend request sent to @${username}!`);
      
      // Close modal and refresh data
      setAddFriendModalVisible(false);
      setAddFriendTab('search');
      await refreshData();
      
    } catch (error) {
      console.error('Failed to process friend code:', error);
      Alert.alert('Error', 'Invalid friend code. Please try again.');
    }
  };

  // These functions are now handled by the context
  // const handleAcceptFriendRequest and handleDeclineFriendRequest
  // are replaced by acceptFriendRequest and rejectFriendRequest from context

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <ThemedText style={styles.loadingText}>Loading friends...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Social</ThemedText>
        <TouchableOpacity style={styles.addButton} onPress={handleAddFriend}>
          <IconSymbol name="person.badge.plus" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <IconSymbol 
            name="person.2" 
            size={16} 
            color={activeTab === 'friends' ? '#ffffff' : '#9ca3af'} 
          />
          <ThemedText style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
          onPress={() => setActiveTab('activity')}
        >
          <IconSymbol 
            name="bell" 
            size={16} 
            color={activeTab === 'activity' ? '#ffffff' : '#9ca3af'} 
          />
          <ThemedText style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>
            Activity
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <IconSymbol 
            name="trophy" 
            size={16} 
            color={activeTab === 'leaderboard' ? '#ffffff' : '#9ca3af'} 
          />
          <ThemedText style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>
            Leaderboard
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'friends' && (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {/* Pending Friend Requests */}
            {friendRequests.incoming.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Friend Requests ({friendRequests.incoming.length})</ThemedText>
                {friendRequests.incoming.map((request) => (
                  <View key={request.id} style={styles.requestCard}>
                    <View style={styles.requestInfo}>
                      <IconSymbol name="person.circle" size={40} color="#6b7280" />
                      <View style={styles.requestDetails}>
                        <ThemedText style={styles.requestName}>{request.requesterName}</ThemedText>
                        <ThemedText style={styles.requestTime}>
                          {/* Calculating 'time ago' in component for now */}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.requestActions}>
                      <TouchableOpacity 
                        style={styles.acceptButton}
                        onPress={() => acceptFriendRequest(request.id)}
                      >
                        <IconSymbol name="checkmark" size={16} color="#ffffff" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.declineButton}
                        onPress={() => rejectFriendRequest(request.id)}
                      >
                        <IconSymbol name="xmark" size={16} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>My Friends ({friends.length})</ThemedText>
              
              {friends.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconSymbol name="person.2" size={48} color="#6b7280" />
                  <ThemedText style={styles.emptyStateText}>No friends yet</ThemedText>
                  <ThemedText style={styles.emptyStateSubtext}>Add friends to see their progress and stay motivated together!</ThemedText>
                </View>
              ) : (
                friends.map((friend) => (
                  <View key={friend.id} style={styles.friendCard}>
                    <View style={styles.friendInfo}>
                      <View style={styles.friendHeader}>
                        <View style={styles.friendName}>
                          <IconSymbol name="person.circle.fill" size={40} color="#6b7280" />
                          <View style={styles.nameContainer}>
                            <ThemedText style={styles.friendNameText}>{friend.name}</ThemedText>
                            <ThemedText style={styles.friendUsername}>@{friend.username}</ThemedText>
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.friendStats}>
                        <View style={styles.statItem}>
                          <ThemedText style={styles.statNumber}>{friend.currentStreak}</ThemedText>
                          <ThemedText style={styles.statLabel}>Day Streak</ThemedText>
                        </View>
                        <View style={styles.statItem}>
                          <ThemedText style={styles.statNumber}>{calculateProgress(friend)}/75</ThemedText>
                          <ThemedText style={styles.statLabel}>Progress</ThemedText>
                        </View>
                        <View style={styles.statItem}>
                          <ThemedText style={styles.statNumber}>{friend.longestStreak}</ThemedText>
                          <ThemedText style={styles.statLabel}>Best Streak</ThemedText>
                        </View>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        )}

        {activeTab === 'activity' && (
          <SocialFeed limit={20} showHeader={false} />
        )}

        {activeTab === 'leaderboard' && (
          <Leaderboard showHeader={false} />
        )}
      </View>

      {/* Add Friend Modal */}
      <Modal
        visible={addFriendModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setAddFriendModalVisible(false);
          setAddFriendTab('search');
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setAddFriendModalVisible(false);
              setAddFriendTab('search');
            }}>
              <ThemedText style={styles.cancelButton}>Cancel</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.modalTitle}>Add Friend</ThemedText>
            <View style={styles.placeholder} />
          </View>

          {/* Add Friend Tabs */}
          <View style={styles.addFriendTabs}>
            <TouchableOpacity
              style={[styles.addFriendTab, addFriendTab === 'search' && styles.addFriendTabActive]}
              onPress={() => setAddFriendTab('search')}
            >
              <IconSymbol 
                name="magnifyingglass" 
                size={16} 
                color={addFriendTab === 'search' ? '#ffffff' : '#9ca3af'} 
              />
              <ThemedText style={[styles.addFriendTabText, addFriendTab === 'search' && styles.addFriendTabTextActive]}>
                Search
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.addFriendTab, addFriendTab === 'qr' && styles.addFriendTabActive]}
              onPress={() => setAddFriendTab('qr')}
            >
              <IconSymbol 
                name="qrcode" 
                size={16} 
                color={addFriendTab === 'qr' ? '#ffffff' : '#9ca3af'} 
              />
              <ThemedText style={[styles.addFriendTabText, addFriendTab === 'qr' && styles.addFriendTabTextActive]}>
                My QR
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.addFriendTab, addFriendTab === 'scan' && styles.addFriendTabActive]}
              onPress={() => setAddFriendTab('scan')}
            >
              <IconSymbol 
                name="camera" 
                size={16} 
                color={addFriendTab === 'scan' ? '#ffffff' : '#9ca3af'} 
              />
              <ThemedText style={[styles.addFriendTabText, addFriendTab === 'scan' && styles.addFriendTabTextActive]}>
                Scan
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <View style={styles.addFriendTabContent}>
            {addFriendTab === 'search' && (
              <>
                <View style={styles.searchContainer}>
                  <View style={styles.searchInputContainer}>
                    <IconSymbol name="magnifyingglass" size={20} color="#6b7280" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search by username or name"
                      placeholderTextColor="#6b7280"
                      value={searchQuery}
                      onChangeText={handleSearch}
                      autoFocus={addFriendTab === 'search'}
                    />
                    {isSearching && (
                      <ActivityIndicator size="small" color="#3b82f6" />
                    )}
                  </View>
                </View>

                <ScrollView style={styles.searchResults}>
                  {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                    <View style={styles.noResults}>
                      <ThemedText style={styles.noResultsText}>No users found</ThemedText>
                    </View>
                  )}
                  
                  {searchResults.map((user) => (
                    <View key={user.id} style={styles.searchResultItem}>
                      <View style={styles.searchResultInfo}>
                        <IconSymbol name="person.circle.fill" size={40} color="#6b7280" />
                        <View style={styles.searchResultDetails}>
                          <ThemedText style={styles.searchResultName}>{user.name}</ThemedText>
                          <ThemedText style={styles.searchResultUsername}>@{user.username}</ThemedText>
                          <ThemedText style={styles.searchResultStreak}>
                            {user.currentStreak} day streak
                          </ThemedText>
                        </View>
                      </View>
                      
                      {isUserAlreadyFriend(user.id) ? (
                        <View style={styles.alreadyFriendButton}>
                          <ThemedText style={styles.alreadyFriendText}>Friends</ThemedText>
                        </View>
                      ) : hasPendingRequest(user.id) ? (
                        <View style={styles.pendingButton}>
                          <ThemedText style={styles.pendingText}>Pending</ThemedText>
                        </View>
                      ) : (
                        <TouchableOpacity 
                          style={styles.addFriendButton}
                          onPress={() => handleSendFriendRequest(user.id, user.name, user)}
                        >
                          <ThemedText style={styles.addFriendButtonText}>Add</ThemedText>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </>
            )}

            {addFriendTab === 'qr' && (
              <>
                <QRCodeGenerator
                  userId={clerkUser?.id || 'guest'}
                  username={clerkUser?.username || 'guest'}
                />
              </>
            )}

            {addFriendTab === 'scan' && (
              <QRCodeScanner
                onCodeScanned={handleQRCodeScanned}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  addButton: {
    padding: 8,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  feedSection: {
    flex: 1,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  activeTabText: {
    color: '#ffffff',
  },
  tabContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
    letterSpacing: -0.24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  friendCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  friendInfo: {
    gap: 16,
  },
  friendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendName: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nameContainer: {
    marginLeft: 12,
    flex: 1,
  },
  friendNameText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  friendStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestDetails: {
    marginLeft: 12,
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  requestTime: {
    fontSize: 14,
    color: '#9ca3af',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#10b981',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#ef4444',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButton: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  placeholder: {
    width: 60,
  },
  addFriendTabs: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 4,
  },
  addFriendTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  addFriendTabActive: {
    backgroundColor: '#3b82f6',
  },
  addFriendTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  addFriendTabTextActive: {
    color: '#ffffff',
  },
  addFriendTabContent: {
    flex: 1,
  },
  searchContainer: {
    padding: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: 20,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  searchResultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchResultDetails: {
    marginLeft: 12,
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  searchResultUsername: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 2,
  },
  searchResultStreak: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  addFriendButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addFriendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  alreadyFriendButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  alreadyFriendText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  pendingButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pendingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
});