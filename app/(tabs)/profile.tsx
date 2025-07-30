import { StyleSheet, View, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/ThemedText';
import { useFocusEffect } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { NotificationService } from '@/lib/notificationService';
import { UserService } from '@/lib/userService';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useClerk } from '@clerk/clerk-expo';
import { SetUsername } from '@/components/SetUsername';
import { DebugEncouragements } from '@/components/DebugEncouragements';
import { TestEncouragements } from '@/components/TestEncouragements';
import { useUser as useClerkUser } from '@clerk/clerk-expo';

export default function ProfileScreen() {
  const { preferences, updatePreferences, updateNotificationSettings } = useUser();
  const [showNotificationDetails, setShowNotificationDetails] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const router = useRouter();
  const { signOut } = useClerk();
  const { user: clerkUser } = useClerkUser();
  // Load user info and set status bar to light when this screen is focused
  useFocusEffect(
    useRef(() => {
      StatusBar.setBarStyle('light-content', true);
      loadUserInfo();
      return () => {
        // Cleanup
      };
    }).current
  );

  const loadUserInfo = async () => {
    try {
      const userSession = await AsyncStorage.getItem('userSession');
      if (userSession) {
        const userData = JSON.parse(userSession);
        setUserInfo(userData);
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              // Sign out from Clerk first
              await signOut();
              // Then clear local storage
              await AsyncStorage.removeItem('userSession');
              // Navigate to sign-in
              router.replace('/sign-in');
            } catch (error) {
              console.error('Failed to logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <IconSymbol 
            name="person.circle.fill" 
            size={80} 
            color="#ffffff" 
          />
          <ThemedText style={styles.title}>Settings</ThemedText>
          {userInfo && (
            <>
              <ThemedText style={styles.debugInfo}>{userInfo.email}</ThemedText>
              <ThemedText style={styles.debugInfo}>{userInfo.firstName} {userInfo.lastName}</ThemedText>
            </>
          )}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Preferences</ThemedText>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Units</ThemedText>
              <ThemedText style={styles.settingDescription}>
                {preferences.useMetricUnits ? 'Metric (liters, ml)' : 'Imperial (ounces, lbs)'}
              </ThemedText>
            </View>
            <Switch
              value={preferences.useMetricUnits}
              onValueChange={(value) => updatePreferences({ useMetricUnits: value })}
              trackColor={{ false: '#3a3a3a', true: '#3b82f6' }}
              thumbColor={preferences.useMetricUnits ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Notifications</ThemedText>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Notifications</ThemedText>
              <ThemedText style={styles.settingDescription}>
                {preferences.notificationsEnabled ? 'Enabled' : 'Disabled'}
              </ThemedText>
            </View>
            <Switch
              value={preferences.notificationsEnabled}
              onValueChange={(value) => updatePreferences({ notificationsEnabled: value })}
              trackColor={{ false: '#3a3a3a', true: '#3b82f6' }}
              thumbColor={preferences.notificationsEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          {preferences.notificationsEnabled && (
            <>
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => setShowNotificationDetails(!showNotificationDetails)}
              >
                <View style={styles.settingInfo}>
                  <ThemedText style={styles.settingLabel}>Notification Settings</ThemedText>
                  <ThemedText style={styles.settingDescription}>
                    Customize reminder types and times
                  </ThemedText>
                </View>
                <IconSymbol 
                  name={showNotificationDetails ? "chevron.up" : "chevron.down"} 
                  size={20} 
                  color="#9ca3af" 
                />
              </TouchableOpacity>

              {showNotificationDetails && (
                <View style={styles.detailsContainer}>
                  <View style={styles.detailItem}>
                    <View style={styles.settingInfo}>
                      <ThemedText style={styles.detailLabel}>Water Reminders</ThemedText>
                      <ThemedText style={styles.detailDescription}>
                        Remind you to drink water throughout the day
                      </ThemedText>
                    </View>
                    <Switch
                      value={preferences.notifications.waterReminders}
                      onValueChange={(value) => updateNotificationSettings({ waterReminders: value })}
                      trackColor={{ false: '#3a3a3a', true: '#3b82f6' }}
                      thumbColor={preferences.notifications.waterReminders ? '#ffffff' : '#f4f3f4'}
                    />
                  </View>

                  <View style={styles.detailItem}>
                    <View style={styles.settingInfo}>
                      <ThemedText style={styles.detailLabel}>Workout Reminders</ThemedText>
                      <ThemedText style={styles.detailDescription}>
                        7:00 AM and 5:00 PM workout reminders
                      </ThemedText>
                    </View>
                    <Switch
                      value={preferences.notifications.workoutReminders}
                      onValueChange={(value) => updateNotificationSettings({ workoutReminders: value })}
                      trackColor={{ false: '#3a3a3a', true: '#3b82f6' }}
                      thumbColor={preferences.notifications.workoutReminders ? '#ffffff' : '#f4f3f4'}
                    />
                  </View>

                  <View style={styles.detailItem}>
                    <View style={styles.settingInfo}>
                      <ThemedText style={styles.detailLabel}>Reading Reminder</ThemedText>
                      <ThemedText style={styles.detailDescription}>
                        8:30 PM reminder to read 10 pages
                      </ThemedText>
                    </View>
                    <Switch
                      value={preferences.notifications.readingReminder}
                      onValueChange={(value) => updateNotificationSettings({ readingReminder: value })}
                      trackColor={{ false: '#3a3a3a', true: '#3b82f6' }}
                      thumbColor={preferences.notifications.readingReminder ? '#ffffff' : '#f4f3f4'}
                    />
                  </View>

                  <View style={styles.detailItem}>
                    <View style={styles.settingInfo}>
                      <ThemedText style={styles.detailLabel}>End-of-Day Check-in</ThemedText>
                      <ThemedText style={styles.detailDescription}>
                        9:00 PM reminder to complete remaining tasks
                      </ThemedText>
                    </View>
                    <Switch
                      value={preferences.notifications.endOfDayReminder}
                      onValueChange={(value) => updateNotificationSettings({ endOfDayReminder: value })}
                      trackColor={{ false: '#3a3a3a', true: '#3b82f6' }}
                      thumbColor={preferences.notifications.endOfDayReminder ? '#ffffff' : '#f4f3f4'}
                    />
                  </View>

                  <View style={styles.detailItem}>
                    <View style={styles.settingInfo}>
                      <ThemedText style={styles.detailLabel}>Task Completions</ThemedText>
                      <ThemedText style={styles.detailDescription}>
                        Celebrate when you complete each task
                      </ThemedText>
                    </View>
                    <Switch
                      value={preferences.notifications.taskCompletions}
                      onValueChange={(value) => updateNotificationSettings({ taskCompletions: value })}
                      trackColor={{ false: '#3a3a3a', true: '#3b82f6' }}
                      thumbColor={preferences.notifications.taskCompletions ? '#ffffff' : '#f4f3f4'}
                    />
                  </View>

                  <View style={styles.detailItem}>
                    <View style={styles.settingInfo}>
                      <ThemedText style={styles.detailLabel}>Streak Milestones</ThemedText>
                      <ThemedText style={styles.detailDescription}>
                        Celebrate weekly and milestone achievements
                      </ThemedText>
                    </View>
                    <Switch
                      value={preferences.notifications.streakMilestones}
                      onValueChange={(value) => updateNotificationSettings({ streakMilestones: value })}
                      trackColor={{ false: '#3a3a3a', true: '#3b82f6' }}
                      thumbColor={preferences.notifications.streakMilestones ? '#ffffff' : '#f4f3f4'}
                    />
                  </View>

                  <TouchableOpacity 
                    style={styles.testButton}
                    onPress={async () => {
                      await NotificationService.sendMotivationalNotification("This is a test notification! 💪");
                      Alert.alert("Test Sent", "Check your notifications!");
                    }}
                  >
                    <ThemedText style={styles.testButtonText}>Send Test Notification</ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account</ThemedText>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowUsernameModal(true)}
          >
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Username</ThemedText>
              <ThemedText style={styles.settingDescription}>
                @{clerkUser?.username || 'Tap to set username'}
              </ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>About</ThemedText>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Version</ThemedText>
              <ThemedText style={styles.settingDescription}>1.0.0</ThemedText>
            </View>
          </View>
        </View>
        
        {/* Debug section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Debug</ThemedText>
          <TestEncouragements />
          <DebugEncouragements />
        </View>


        <View style={[styles.section, styles.logoutSection]}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <IconSymbol 
              name="arrow.right.square.fill" 
              size={24} 
              color="#ef4444" 
            />
            <ThemedText style={styles.logoutText}>Logout</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <SetUsername 
        visible={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 15,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 20,
    lineHeight: 40,
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 12,
  },
  userEmail: {
    fontSize: 16,
    color: '#e5e7eb',
    marginTop: 4,
  },
  debugInfo: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
    letterSpacing: -0.24,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 15,
    color: '#9ca3af',
    fontWeight: '500',
  },
  detailsContainer: {
    marginTop: 8,
    paddingLeft: 20,
    borderLeftWidth: 2,
    borderLeftColor: '#3b82f6',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  detailDescription: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  testButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ef4444',
    gap: 12,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ef4444',
  },
  logoutSection: {
    marginTop: 40,
    marginBottom: 40,
  },
});