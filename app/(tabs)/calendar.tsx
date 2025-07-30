import { StyleSheet, ScrollView, View, SafeAreaView, StatusBar, TouchableOpacity, Image, Modal, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTaskContext, ProgressPhoto } from '@/contexts/TaskContext';
import { PhotoViewer } from '@/components/PhotoViewer';
import { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export default function CalendarScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { todaysLog, allProgressPhotos, getProgressPhotosByDateRange } = useTaskContext();
  const [timeRemaining, setTimeRemaining] = useState('');
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  
  // Use actual task data from context

  const mockUser = {
    name: 'Demo User',
    currentStreak: 1,
    longestStreak: 1,
    startDate: new Date().toISOString().split('T')[0], // Today is day 1
  };

  const startDate = new Date(mockUser.startDate);
  const currentDate = new Date();
  const dayNumber = Math.min(Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1, 75);
  
  // Check if there's a photo for today
  const todayPhoto = allProgressPhotos.find(photo => photo.day === dayNumber);
  const photoCompleted = !!todayPhoto || !!todaysLog?.progressPhotoId;
  
  const completedTasks = [
    { name: 'Workout 1', completed: todaysLog?.workout1?.completed, icon: 'figure.run' },
    { name: 'Workout 2', completed: todaysLog?.workout2?.completed, icon: 'sun.max.fill' },
    { name: 'Follow Diet', completed: todaysLog?.dietFollowed, icon: 'leaf.fill' },
    { name: 'Drink Water', completed: todaysLog?.waterCompleted, icon: 'drop.fill' },
    { name: 'Read', completed: todaysLog?.readingCompleted, icon: 'book.fill' },
    { name: 'Progress Photo', completed: photoCompleted, icon: 'camera.fill' },
  ];

  const completedCount = completedTasks.filter(task => task.completed).length;

  // Use real progress photos data
  const allPhotos = allProgressPhotos
    .sort((a, b) => b.day - a.day) // Sort by day descending (most recent first)
    .map(photo => ({
      id: photo.id,
      day: photo.day,
      date: photo.date,
      uri: photo.uri,
    }));

  // Add placeholders for missing days (show all 75 days)
  const photosByDay = new Map(allPhotos.map(photo => [photo.day, photo]));
  const allPhotosWithPlaceholders = Array.from({ length: 75 }, (_, i) => {
    const day = i + 1;
    const existingPhoto = photosByDay.get(day);
    const photoDate = new Date(startDate.getTime() + (day - 1) * 24 * 60 * 60 * 1000);
    const isPastDay = day <= dayNumber;
    const isFutureDay = day > dayNumber;
    
    return existingPhoto || {
      id: `placeholder-${day}`,
      day,
      date: photoDate.toISOString().split('T')[0],
      uri: null,
      isPastDay,
      isFutureDay,
    };
  }).reverse(); // Most recent first

  const recentPhotos = allPhotosWithPlaceholders.slice(0, 4);

  // Set status bar to light when this screen is focused
  useFocusEffect(
    useRef(() => {
      StatusBar.setBarStyle('light-content', true);
      return () => {
        // Cleanup
      };
    }).current
  );

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      
      const diff = endOfDay.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.todaySection}>
          <View style={styles.timerContainer}>
            <ThemedText style={styles.timer}>{timeRemaining}</ThemedText>
            <ThemedText style={styles.timerLabel}>Time Remaining</ThemedText>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statNumber, {color: '#3b82f6'}]}>{allProgressPhotos.length}</ThemedText>
              <ThemedText style={[styles.statLabel, {color: '#9ca3af'}]}>Photos Taken</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statNumber, {color: '#e5e7eb'}]}>{completedCount}</ThemedText>
              <ThemedText style={[styles.statLabel, {color: '#9ca3af'}]}>Tasks Completed</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statNumber, {color: '#10b981'}]}>{dayNumber}</ThemedText>
              <ThemedText style={[styles.statLabel, {color: '#9ca3af'}]}>Current Day</ThemedText>
            </View>
          </View>
          
          <ThemedText type="subtitle" style={[styles.sectionTitle, {color: '#e5e7eb'}]}>Today's Completed Tasks</ThemedText>
          
          <View style={styles.tasksList}>
            {completedTasks.map((task, index) => (
              <View key={index} style={[
                styles.taskItem,
                { backgroundColor: task.completed ? colors.tint + '20' : colors.background + '50' }
              ]}>
                <View style={[
                  styles.taskIcon,
                  { backgroundColor: task.completed ? '#1e40af' : '#2a2a2a' }
                ]}>
                  <IconSymbol 
                    name={task.icon} 
                    size={20} 
                    color={task.completed ? '#3b82f6' : '#6b7280'} 
                  />
                </View>
                <View style={styles.taskContent}>
                  <ThemedText style={[
                    styles.taskName,
                    { color: task.completed ? '#e5e7eb' : '#6b7280' }
                  ]}>
                    {task.name}
                  </ThemedText>
                  <ThemedText style={[
                    styles.taskStatus,
                    { color: task.completed ? '#3b82f6' : '#6b7280' }
                  ]}>
                    {task.completed ? 'Completed' : 'Not completed'}
                  </ThemedText>
                </View>
                {task.completed && (
                  <IconSymbol 
                    name="checkmark.square.fill" 
                    size={24} 
                    color={colors.tint} 
                  />
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.photosSection}>
          <View style={styles.photosSectionHeader}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, {color: '#e5e7eb'}]}>Recent Progress Photos</ThemedText>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => setShowPhotoGallery(true)}
            >
              <ThemedText style={styles.viewAllText}>View All</ThemedText>
              <IconSymbol name="chevron.right" size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
            {recentPhotos.map((photo) => (
              <TouchableOpacity 
                key={photo.id} 
                style={styles.photoItem}
                onPress={() => {
                  if (photo.uri) {
                    const selectedPhotoData = allProgressPhotos.find(p => p.uri === photo.uri);
                    setSelectedPhoto(selectedPhotoData || null);
                  }
                }}
              >
                {photo.uri ? (
                  <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                ) : (
                  <View style={styles.placeholderPhoto}>
                    <IconSymbol name="camera.fill" size={32} color="#6b7280" />
                  </View>
                )}
                <ThemedText style={styles.photoDay}>Day {photo.day}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Photo Gallery Modal */}
      <Modal
        visible={showPhotoGallery}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.galleryContainer}>
          <View style={styles.galleryHeader}>
            <View style={styles.galleryHeaderLeft}>
              <TouchableOpacity onPress={() => setShowPhotoGallery(false)}>
                <IconSymbol name="xmark" size={24} color="#ffffff" />
              </TouchableOpacity>
              <ThemedText style={styles.galleryTitle}>Progress Photos</ThemedText>
            </View>
            <TouchableOpacity 
              style={[styles.compareButton, comparisonMode && styles.compareButtonActive]}
              onPress={() => {
                setComparisonMode(!comparisonMode);
                setSelectedPhotos([]);
              }}
            >
              <IconSymbol name="rectangle.2.swap" size={20} color={comparisonMode ? "#ffffff" : "#3b82f6"} />
              <ThemedText style={[styles.compareButtonText, comparisonMode && styles.compareButtonTextActive]}>
                Compare
              </ThemedText>
            </TouchableOpacity>
          </View>

          {comparisonMode && selectedPhotos.length === 2 && (
            <View style={styles.comparisonView}>
              <View style={styles.comparisonPhoto}>
                <Image source={{ uri: selectedPhotos[0] }} style={styles.comparisonImage} />
                <ThemedText style={styles.comparisonLabel}>Before</ThemedText>
              </View>
              <View style={styles.comparisonPhoto}>
                <Image source={{ uri: selectedPhotos[1] }} style={styles.comparisonImage} />
                <ThemedText style={styles.comparisonLabel}>After</ThemedText>
              </View>
            </View>
          )}

          <ScrollView style={styles.galleryScroll}>
            <View style={styles.photoGrid}>
              {allPhotosWithPlaceholders.map((photo) => (
                <TouchableOpacity 
                  key={photo.id} 
                  style={styles.gridPhotoItem}
                  onPress={() => {
                    if (comparisonMode) {
                      if (!photo.uri) return; // Can't select placeholder photos
                      if (selectedPhotos.includes(photo.uri)) {
                        setSelectedPhotos(selectedPhotos.filter(p => p !== photo.uri));
                      } else if (selectedPhotos.length < 2) {
                        setSelectedPhotos([...selectedPhotos, photo.uri]);
                      }
                    } else {
                      const selectedPhotoData = allProgressPhotos.find(p => p.uri === photo.uri);
                      setSelectedPhoto(selectedPhotoData || null);
                    }
                  }}
                >
                  {photo.uri ? (
                    <Image source={{ uri: photo.uri }} style={styles.gridPhoto} />
                  ) : (
                    <View style={[
                      styles.gridPlaceholder,
                      photo.isFutureDay ? styles.gridPlaceholderFuture : styles.gridPlaceholderPast
                    ]}>
                      <IconSymbol 
                        name={photo.isFutureDay ? "calendar" : "camera.fill"} 
                        size={24} 
                        color={photo.isFutureDay ? "#4b5563" : "#6b7280"} 
                      />
                    </View>
                  )}
                  <View style={styles.gridPhotoOverlay}>
                    <ThemedText style={styles.gridPhotoDay}>Day {photo.day}</ThemedText>
                    {comparisonMode && photo.uri && selectedPhotos.includes(photo.uri) && (
                      <View style={styles.selectedIndicator}>
                        <IconSymbol name="checkmark.circle.fill" size={20} color="#3b82f6" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Single Photo Modal */}
      <PhotoViewer
        photo={selectedPhoto}
        visible={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '500',
    opacity: 0.6,
    marginTop: 4,
    letterSpacing: -0.24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    paddingHorizontal: 16,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 0,
    paddingVertical: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 8,
    minHeight: 80,
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.8,
    textAlign: 'center',
    letterSpacing: -0.08,
    lineHeight: 16,
    paddingHorizontal: 4,
    flexWrap: 'wrap',
  },
  progressBarContainer: {
    paddingHorizontal: 24,
    marginBottom: 36,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.24,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.6,
    letterSpacing: -0.24,
  },
  todaySection: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 40,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 50,
    marginTop: 20,
  },
  timer: {
    fontSize: 48,
    fontWeight: '700',
    color: '#e5e7eb',
    letterSpacing: -1,
    fontFamily: 'Menlo',
    lineHeight: 60,
    paddingVertical: 10,
  },
  timerLabel: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 8,
    fontWeight: '500',
  },
  tasksList: {
    gap: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  taskIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  taskContent: {
    flex: 1,
  },
  taskName: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.24,
  },
  taskStatus: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: -0.24,
  },
  photosSection: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  photosSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  photosContainer: {
    marginHorizontal: -10,
  },
  photoItem: {
    marginHorizontal: 10,
    alignItems: 'center',
  },
  photoImage: {
    width: 80,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
  },
  placeholderPhoto: {
    width: 80,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3a3a3a',
    borderStyle: 'dashed',
  },
  photoDay: {
    fontSize: 12,
    color: '#e5e7eb',
    fontWeight: '600',
    marginTop: 8,
  },
  // Gallery Modal Styles
  galleryContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  galleryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  galleryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  compareButtonActive: {
    backgroundColor: '#3b82f6',
  },
  compareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  compareButtonTextActive: {
    color: '#ffffff',
  },
  comparisonView: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  comparisonPhoto: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonImage: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
  },
  comparisonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    marginTop: 8,
  },
  galleryScroll: {
    flex: 1,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  gridPhotoItem: {
    width: (Dimensions.get('window').width - 64) / 3, // 3 columns with gaps
    position: 'relative',
  },
  gridPhoto: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
  },
  gridPlaceholder: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3a3a3a',
    borderStyle: 'dashed',
  },
  gridPlaceholderPast: {
    backgroundColor: '#2a2a2a',
    borderColor: '#dc2626',
  },
  gridPlaceholderFuture: {
    backgroundColor: '#1a1a1a',
    borderColor: '#374151',
    opacity: 0.6,
  },
  gridPhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  gridPhotoDay: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  selectedIndicator: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 10,
  },
  // Single Photo Modal Styles
  photoModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
  },
  fullPhoto: {
    width: '90%',
    height: '80%',
  },
});