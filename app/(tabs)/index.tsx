import { StyleSheet, ScrollView, View, TouchableOpacity, Animated, SafeAreaView, StatusBar, Alert, Modal, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { db } from '@/lib/instant';
import { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useTaskContext, ProgressPhoto } from '@/contexts/TaskContext';
import { useUser, WaterUtils } from '@/contexts/UserContext';
import { NotificationService } from '@/lib/notificationService';
import { useUser as useClerkUser } from '@clerk/clerk-expo';
import { SetUsername } from '@/components/SetUsername';
import { useEncouragements } from '@/lib/useEncouragements';

type TaskItemProps = {
  title: string;
  subtitle?: string;
  completed: boolean;
  onPress: () => void;
  icon: string;
  isRemoving?: boolean;
};

function TaskItem({ title, subtitle, completed, onPress, icon, isRemoving = false }: TaskItemProps) {
  const isWaterOrPhoto = title === 'Drink Water' || title === 'Progress Photo';
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const backgroundColorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRemoving) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isRemoving]);

  const handlePress = () => {
    if (!completed) {
      // Animate completion first
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onPress();
      });
    } else {
      onPress();
    }
  };

  const onGestureEvent = (event: any) => {
    const { translationX } = event.nativeEvent;
    
    if (translationX < 0 && !completed) {
      // Only allow left swipe for incomplete tasks
      swipeAnim.setValue(translationX);
      
      // Change background color as user swipes
      const progress = Math.min(-translationX / 100, 1);
      backgroundColorAnim.setValue(progress);
    }
  };

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      
      if (translationX < -100 && !completed) {
        // Swipe threshold reached - complete the task
        onPress();
      } else {
        // Snap back to original position
        Animated.parallel([
          Animated.spring(swipeAnim, {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.timing(backgroundColorAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
        ]).start();
      }
    }
  };

  const backgroundColor = backgroundColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [completed ? '#1e40af' : '#1a1a1a', '#dc2626'],
  });
  
  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          { translateX: slideAnim },
          { scale: scaleAnim }
        ],
      }}
    >
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        enabled={!completed && !isRemoving}
      >
        <Animated.View
          style={{
            transform: [{ translateX: swipeAnim }],
          }}
        >
          <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
            <Animated.View style={[
              styles.taskItem,
              { backgroundColor }
            ]}>
              <View style={styles.taskIcon}>
                <IconSymbol 
                  name={icon} 
                  size={24} 
                  color={completed ? '#3b82f6' : '#9ca3af'} 
                />
              </View>
              <View style={styles.taskContent}>
                <ThemedText type="defaultSemiBold" style={{fontSize: 17, fontWeight: '600', letterSpacing: -0.24, color: '#e5e7eb'}}>{title}</ThemedText>
                {subtitle && <ThemedText style={[styles.taskSubtitle, {color: '#9ca3af'}]}>{subtitle}</ThemedText>}
              </View>
              <IconSymbol 
                name={completed ? "checkmark.square.fill" : (isWaterOrPhoto ? "plus.square" : "square")} 
                size={28} 
                color={completed ? '#3b82f6' : '#6b7280'} 
              />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { todaysLog, updateTask, addProgressPhoto, allProgressPhotos, resetProgress } = useTaskContext();
  const { preferences, currentWaterIntake, addWaterIntake, initializeNotifications } = useUser();
  const { user: clerkUser } = useClerkUser();
  const { encouragements, isLoading: loadingEncouragements } = useEncouragements();
  const [removingTasks, setRemovingTasks] = useState<Set<string>>(new Set());
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [waterInputValue, setWaterInputValue] = useState('');
  const [unreadEncouragements, setUnreadEncouragements] = useState(0);
  const today = new Date().toISOString().split('T')[0];

  const currentUser = {
    id: 'guest',
    name: 'Guest User',
    currentStreak: 1,
    startDate: new Date().toISOString().split('T')[0],
  };

  const startDate = new Date(currentUser.startDate);
  const currentDate = new Date();
  const dayNumber = Math.min(Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1, 75);

  // Check if user is logged in
  useEffect(() => {
    console.log('[HomeScreen] Current user:', clerkUser?.id);
  }, [clerkUser]);

  // Track previously seen encouragements
  const [seenEncouragementIds, setSeenEncouragementIds] = useState<Set<string>>(new Set());
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  // Track unread encouragements and send notifications for new ones
  useEffect(() => {
    console.log('[HomeScreen] Encouragements updated:', {
      loading: loadingEncouragements,
      count: encouragements?.length || 0,
      encouragements,
      currentUserId: clerkUser?.id
    });
    
    if (encouragements && encouragements.length > 0) {
      // On first load, mark all existing encouragements as seen
      if (isFirstLoad) {
        const existingIds = new Set(encouragements.map((enc: any) => enc.id));
        setSeenEncouragementIds(existingIds);
        setIsFirstLoad(false);
      } else {
        // Check for new encouragements
        encouragements.forEach((enc: any) => {
          if (!seenEncouragementIds.has(enc.id)) {
            // This is a new encouragement, send notification
            console.log('[HomeScreen] New encouragement detected, sending notification');
            NotificationService.sendEncouragementNotification(
              enc.senderName || 'Someone',
              enc.message
            );
            
            // Mark as seen
            setSeenEncouragementIds(prev => new Set(prev).add(enc.id));
          }
        });
      }
      
      // Count recent encouragements (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentCount = encouragements.filter((enc: any) => 
        new Date(enc.createdAt) > oneDayAgo
      ).length;
      setUnreadEncouragements(recentCount);
    }
  }, [encouragements, loadingEncouragements]);

  // Initialize notifications when screen loads
  useEffect(() => {
    const setupNotifications = async () => {
      if (preferences.notificationsEnabled) {
        await initializeNotifications();
      }
    };
    
    setupNotifications();
  }, [preferences.notificationsEnabled]);

  // Check if user needs to set username
  useEffect(() => {
    console.log('Checking username - clerkUser:', clerkUser);
    console.log('Username exists?', clerkUser?.username);
    
    if (clerkUser && !clerkUser.username) {
      console.log('User needs to set username, showing modal...');
      // Small delay to avoid showing immediately on load
      const timer = setTimeout(() => {
        setShowUsernameModal(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [clerkUser]);

  // Set status bar to dark when this screen is focused
  useFocusEffect(
    useRef(() => {
      StatusBar.setBarStyle('dark-content', true);
      return () => {
        // Optionally reset when leaving
      };
    }).current
  );
  
  // Extract task states from today's log
  const todayPhoto = allProgressPhotos.find(photo => photo.day === dayNumber);
  const tasks = {
    workout1: todaysLog?.workout1?.completed || false,
    workout2: todaysLog?.workout2?.completed || false,
    diet: todaysLog?.dietFollowed || false,
    water: todaysLog?.waterCompleted || false,
    reading: todaysLog?.readingCompleted || false,
    photo: !!todayPhoto || !!todaysLog?.progressPhotoId,
  };

  const handleRestart = () => {
    Alert.alert(
      "Reset Progress",
      "Are you sure you want to restart your 75 Hard challenge? This will reset all progress back to Day 1 and cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              // Reset all progress
              await resetProgress();
              Alert.alert('Success', 'Your progress has been reset. You are now back at Day 1!');
            } catch (error) {
              console.error('Failed to reset progress:', error);
              Alert.alert('Error', 'Failed to reset progress. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handlePhotoOption = async (option: 'camera' | 'library') => {
    console.log('Photo option selected:', option);
    setShowPhotoModal(false);
    
    // Add a small delay to ensure modal closes before opening picker
    await new Promise(resolve => setTimeout(resolve, 100));
    
    let result;
    
    try {
      if (option === 'camera') {
        // Request camera permissions
        console.log('Requesting camera permissions...');
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        console.log('Camera permission status:', status);
        
        if (status !== 'granted') {
          Alert.alert(
            'Camera Permission Required', 
            'Please enable camera access in your device settings to take progress photos.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        // Launch camera
        console.log('Launching camera...');
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        });
      } else {
        // Request media library permissions
        console.log('Requesting media library permissions...');
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('Media library permission status:', status);
        
        if (status !== 'granted') {
          Alert.alert(
            'Photos Permission Required', 
            'Please enable photo library access in your device settings to select progress photos.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        // Launch image picker
        console.log('Launching image picker...');
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        });
      }
      
      console.log('Image picker result:', result);
    } catch (error) {
      console.error('Error in handlePhotoOption:', error);
      Alert.alert(
        'Error', 
        'Failed to open photo picker. Make sure you have the proper permissions enabled and try again.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Check if user selected an image
    if (!result.canceled && result.assets[0]) {
      // Create photo object with real data
      const photo: ProgressPhoto = {
        id: 'photo-' + Date.now(),
        uri: result.assets[0].uri,
        day: dayNumber,
        date: today,
        source: option,
        timestamp: Date.now()
      };
      
      // Store the photo in the context
      await addProgressPhoto(photo);
      
      // Update task completion
      updateTask('photo', true, { 
        photoId: photo.id,
        photoSource: option,
        photoUri: result.assets[0].uri 
      });
      
      // Send completion notification
      if (preferences.notifications.taskCompletions) {
        NotificationService.sendTaskCompletionNotification('Progress Photo');
      }
      
      setRemovingTasks(prev => new Set(prev).add('photo'));
      setTimeout(() => {
        setRemovingTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete('photo');
          return newSet;
        });
      }, 300);
      
      Alert.alert('Success', 'Progress photo added successfully!');
    } else {
      console.log('User cancelled photo selection');
    }
  };

  const handleWaterIntake = async () => {
    const amount = parseFloat(waterInputValue);
    
    if (isNaN(amount) || amount <= 0) {
      const unit = preferences.useMetricUnits ? 'milliliters' : 'ounces';
      Alert.alert('Invalid Amount', `Please enter a valid number of ${unit}.`);
      return;
    }
    
    try {
      // Add water intake (context handles unit conversion)
      const unit = preferences.useMetricUnits ? 'ml' : 'oz';
      await addWaterIntake(amount, unit);
      
      // Check if reached goal (128 oz = 1 gallon)
      const goalOz = WaterUtils.getGoalInOz();
      if (currentWaterIntake >= goalOz) {
        updateTask('water', true);
        
        // Send completion notification
        if (preferences.notifications.taskCompletions) {
          NotificationService.sendTaskCompletionNotification('Water Goal');
        }
        
        setRemovingTasks(prev => new Set(prev).add('water'));
        setTimeout(() => {
          setRemovingTasks(prev => {
            const newSet = new Set(prev);
            newSet.delete('water');
            return newSet;
          });
        }, 300);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update water intake. Please try again.');
    }
    
    setWaterInputValue('');
    setShowWaterModal(false);
  };

  const handleTaskToggle = async (taskType: string) => {
    const isCurrentlyCompleted = tasks[taskType as keyof typeof tasks];
    
    // Special handling for water task
    if (taskType === 'water' && !isCurrentlyCompleted) {
      setShowWaterModal(true);
      return;
    }
    
    // Special handling for photo task
    if (taskType === 'photo' && !isCurrentlyCompleted) {
      setShowPhotoModal(true);
      return;
    }
    
    if (!isCurrentlyCompleted) {
      // Mark as removing to trigger animation
      setRemovingTasks(prev => new Set(prev).add(taskType));
      
      // Wait for animation to start, then update state
      setTimeout(() => {
        const extra: any = {};
        
        switch (taskType) {
          case 'workout1':
            extra.type = 'Gym';
            extra.isOutdoor = false;
            break;
          case 'workout2':
            extra.type = 'Walk';
            extra.isOutdoor = true;
            break;
          case 'reading':
            extra.bookTitle = 'My Book';
            break;
        }
        
        updateTask(taskType, true, extra);
        
        // Send task completion notification if enabled
        if (preferences.notifications.taskCompletions) {
          const taskNames = {
            workout1: 'Workout 1',
            workout2: 'Outdoor Workout',
            diet: 'Diet',
            reading: 'Reading',
          };
          const taskName = taskNames[taskType as keyof typeof taskNames];
          if (taskName) {
            NotificationService.sendTaskCompletionNotification(taskName);
          }
        }
        
        // Remove from removing set after animation completes
        setTimeout(() => {
          setRemovingTasks(prev => {
            const newSet = new Set(prev);
            newSet.delete(taskType);
            return newSet;
          });
        }, 300);
      }, 300);
    }
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: '#c02425'}]}>
      <LinearGradient
        colors={['#c02425', '#f0cb35']}
        style={styles.gradient}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
              <IconSymbol name="arrow.clockwise" size={28} color="#ffffff" />
            </TouchableOpacity>
            <ThemedText style={styles.dayIndicator}>{dayNumber}</ThemedText>
            <ThemedText type="subtitle" style={[styles.sectionTitle, {color: '#e5e7eb'}]}>Today&apos;s Tasks</ThemedText>
          </View>
          <View style={styles.tasksContainer}>
          
          {(!tasks.workout1 || removingTasks.has('workout1')) && (
            <TaskItem
              title="Workout 1"
              subtitle="45 minutes"
              completed={tasks.workout1}
              onPress={() => handleTaskToggle('workout1')}
              icon="figure.run"
              isRemoving={removingTasks.has('workout1')}
            />
          )}
          
          {(!tasks.workout2 || removingTasks.has('workout2')) && (
            <TaskItem
              title="Workout 2"
              subtitle="45 minutes (outdoor)"
              completed={tasks.workout2}
              onPress={() => handleTaskToggle('workout2')}
              icon="sun.max.fill"
              isRemoving={removingTasks.has('workout2')}
            />
          )}
          
          {(!tasks.diet || removingTasks.has('diet')) && (
            <TaskItem
              title="Follow Diet"
              subtitle="No cheat meals or alcohol"
              completed={tasks.diet}
              onPress={() => handleTaskToggle('diet')}
              icon="leaf.fill"
              isRemoving={removingTasks.has('diet')}
            />
          )}
          
          {(!tasks.water || removingTasks.has('water')) && (
            <TaskItem
              title="Drink Water"
              subtitle={preferences.useMetricUnits ? "3.8 liters" : "1 gallon (128 oz)"}
              completed={tasks.water}
              onPress={() => handleTaskToggle('water')}
              icon="drop.fill"
              isRemoving={removingTasks.has('water')}
            />
          )}
          
          {(!tasks.reading || removingTasks.has('reading')) && (
            <TaskItem
              title="Read"
              subtitle="10 pages of non-fiction"
              completed={tasks.reading}
              onPress={() => handleTaskToggle('reading')}
              icon="book.fill"
              isRemoving={removingTasks.has('reading')}
            />
          )}
          
          {(!tasks.photo || removingTasks.has('photo')) && (
            <TaskItem
              title="Progress Photo"
              subtitle="Take daily photo"
              completed={tasks.photo}
              onPress={() => handleTaskToggle('photo')}
              icon="camera.fill"
              isRemoving={removingTasks.has('photo')}
            />
          )}
          </View>
        </ScrollView>
      </LinearGradient>
      
      <Modal
        visible={showWaterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWaterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Add Water Intake</ThemedText>
            <ThemedText style={styles.waterProgress}>
              {WaterUtils.formatWaterAmount(currentWaterIntake, preferences.useMetricUnits)} / {WaterUtils.getGoalInUnit(preferences.useMetricUnits)}
            </ThemedText>
            
            <View style={styles.waterInputContainer}>
              <TextInput
                style={styles.waterInput}
                value={waterInputValue}
                onChangeText={setWaterInputValue}
                keyboardType="numeric"
                placeholder={`Enter ${preferences.useMetricUnits ? 'milliliters' : 'ounces'}`}
                placeholderTextColor="#6b7280"
                autoFocus={true}
              />
              <ThemedText style={styles.ozLabel}>{preferences.useMetricUnits ? 'ml' : 'oz'}</ThemedText>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setWaterInputValue('');
                  setShowWaterModal(false);
                }}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleWaterIntake}
              >
                <ThemedText style={styles.addButtonText}>Add</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <Modal
        visible={showPhotoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Progress Photo</ThemedText>
            <ThemedText style={styles.photoSubtitle}>Choose how to add your photo</ThemedText>
            
            <View style={styles.photoOptions}>
              <TouchableOpacity 
                style={styles.photoButton}
                onPress={() => handlePhotoOption('camera')}
              >
                <IconSymbol name="camera.fill" size={32} color="#ffffff" />
                <ThemedText style={styles.photoButtonText}>Take Photo</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.photoButton}
                onPress={() => handlePhotoOption('library')}
              >
                <IconSymbol name="photo.fill" size={32} color="#ffffff" />
                <ThemedText style={styles.photoButtonText}>Choose from Library</ThemedText>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowPhotoModal(false)}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
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
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 80,
    position: 'relative',
  },
  restartButton: {
    position: 'absolute',
    top: 10,
    right: 20,
    padding: 12,
    borderRadius: 25,
    zIndex: 10,
  },
  dayIndicator: {
    fontSize: 96,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -2,
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 5,
    lineHeight: 100,
    fontFamily: 'Impact',
  },
  userName: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  tasksContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    marginBottom: 20,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.24,
    textAlign: 'left',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 28,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  taskIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  taskContent: {
    flex: 1,
  },
  taskSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.6,
    marginTop: 2,
    letterSpacing: -0.24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  waterProgress: {
    fontSize: 18,
    color: '#3b82f6',
    marginBottom: 24,
    fontWeight: '600',
  },
  waterInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  waterInput: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
  ozLabel: {
    fontSize: 20,
    color: '#9ca3af',
    marginLeft: 12,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  photoSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 16,
  },
  photoOptions: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  photoButton: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  photoButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
});