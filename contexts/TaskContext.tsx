import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '@clerk/clerk-expo';
import { ActivityService } from '@/lib/activityService';

export interface ProgressPhoto {
  id: string;
  uri: string;
  day: number;
  date: string;
  source: 'camera' | 'library';
  timestamp: number;
}

export interface TaskLog {
  workout1?: { completed: boolean; type: string; isOutdoor: boolean };
  workout2?: { completed: boolean; type: string; isOutdoor: boolean };
  dietFollowed: boolean;
  waterCompleted: boolean;
  readingCompleted: boolean;
  bookTitle?: string;
  progressPhotoId?: string;
  progressPhoto?: ProgressPhoto;
}

interface TaskContextType {
  todaysLog: TaskLog | null;
  setTodaysLog: (log: TaskLog) => void;
  updateTask: (taskType: string, completed: boolean, extra?: any) => void;
  allProgressPhotos: ProgressPhoto[];
  addProgressPhoto: (photo: ProgressPhoto) => void;
  getProgressPhotosByDateRange: (startDate: string, endDate: string) => ProgressPhoto[];
  resetProgress: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [todaysLog, setTodaysLog] = useState<TaskLog | null>(null);
  const [allProgressPhotos, setAllProgressPhotos] = useState<ProgressPhoto[]>([]);

  // Get user-specific storage key
  const getStorageKey = (key: string) => {
    if (!user?.id) return null;
    return `${user.id}_${key}`;
  };

  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) {
        // Clear data when no user is logged in
        setTodaysLog(null);
        setAllProgressPhotos([]);
        return;
      }

      try {
        // Load user-specific progress photos
        const photosKey = getStorageKey('progressPhotos');
        if (photosKey) {
          const storedPhotos = await AsyncStorage.getItem(photosKey);
          if (storedPhotos) {
            setAllProgressPhotos(JSON.parse(storedPhotos));
          } else {
            setAllProgressPhotos([]);
          }
        }

        // Load today's log
        const today = new Date().toISOString().split('T')[0];
        const logKey = getStorageKey(`log_${today}`);
        if (logKey) {
          const storedLog = await AsyncStorage.getItem(logKey);
          if (storedLog) {
            setTodaysLog(JSON.parse(storedLog));
          } else {
            setTodaysLog(null);
          }
        }
      } catch (e) {
        console.error('Failed to load user data', e);
      }
    };

    loadUserData();
  }, [user?.id]);

  const addProgressPhoto = async (photo: ProgressPhoto) => {
    if (!user?.id) return;
    
    const updatedPhotos = [...allProgressPhotos, photo];
    setAllProgressPhotos(updatedPhotos);
    
    try {
      const photosKey = getStorageKey('progressPhotos');
      if (photosKey) {
        await AsyncStorage.setItem(photosKey, JSON.stringify(updatedPhotos));
      }
    } catch (e) {
      console.error('Failed to store progress photo', e);
    }
  };

  const getProgressPhotosByDateRange = (startDate: string, endDate: string): ProgressPhoto[] => {
    return allProgressPhotos.filter(photo => {
      const photoDate = new Date(photo.date);
      return photoDate >= new Date(startDate) && photoDate <= new Date(endDate);
    });
  };

  const resetProgress = async () => {
    try {
      // Clear today's log
      setTodaysLog(null);
      
      // Clear all progress photos
      setAllProgressPhotos([]);
      
      // Clear from AsyncStorage if user is logged in
      if (user?.id) {
        const today = new Date().toISOString().split('T')[0];
        const logKey = getStorageKey(`log_${today}`);
        const photosKey = getStorageKey('progress_photos');
        
        if (logKey) {
          await AsyncStorage.removeItem(logKey);
        }
        if (photosKey) {
          await AsyncStorage.removeItem(photosKey);
        }
        
        // Clear all daily logs (optional - you might want to keep history)
        const keys = await AsyncStorage.getAllKeys();
        const userLogKeys = keys.filter(key => key.startsWith(`${user.id}_log_`));
        if (userLogKeys.length > 0) {
          await AsyncStorage.multiRemove(userLogKeys);
        }
      }
      
      console.log('Progress reset successfully');
    } catch (error) {
      console.error('Failed to reset progress:', error);
      throw error;
    }
  };

  const updateTask = async (taskType: string, completed: boolean, extra?: any) => {
    if (!user?.id) return;
    
    const newLog = { ...todaysLog } as TaskLog;
    
    switch (taskType) {
      case 'workout1':
        newLog.workout1 = { completed, type: extra?.type || 'Gym', isOutdoor: extra?.isOutdoor || false };
        break;
      case 'workout2':
        newLog.workout2 = { completed, type: extra?.type || 'Walk', isOutdoor: extra?.isOutdoor || true };
        break;
      case 'diet':
        newLog.dietFollowed = completed;
        break;
      case 'water':
        newLog.waterCompleted = completed;
        break;
      case 'reading':
        newLog.readingCompleted = completed;
        if (extra?.bookTitle) newLog.bookTitle = extra.bookTitle;
        break;
      case 'photo':
        newLog.progressPhotoId = completed ? (extra?.photoId || 'photo-' + Date.now()) : undefined;
        break;
    }
    
    setTodaysLog(newLog);
    
    // Save to user-specific storage
    try {
      const today = new Date().toISOString().split('T')[0];
      const logKey = getStorageKey(`log_${today}`);
      if (logKey) {
        await AsyncStorage.setItem(logKey, JSON.stringify(newLog));
      }
      
      // Log activity to InstantDB for friends to see
      if (completed && user?.id) {
        const taskNames: { [key: string]: string } = {
          workout1: 'Workout 1',
          workout2: 'Outdoor Workout',
          diet: 'Diet',
          water: 'Water Goal',
          reading: 'Reading',
          photo: 'Progress Photo'
        };
        
        const taskDisplayName = taskNames[taskType] || taskType;
        await ActivityService.logTaskCompletion(user.id, taskDisplayName);
        
        // Check if all tasks are completed for the day
        await ActivityService.checkDayCompletion(user.id, newLog);
      }
    } catch (e) {
      console.error('Failed to save task log', e);
    }
  };

  return (
    <TaskContext.Provider value={{ 
      todaysLog, 
      setTodaysLog, 
      updateTask, 
      allProgressPhotos, 
      addProgressPhoto, 
      getProgressPhotosByDateRange,
      resetProgress
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}