import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ProgressPhoto } from '@/contexts/TaskContext';

interface PhotoViewerProps {
  photo: ProgressPhoto | null;
  visible: boolean;
  onClose: () => void;
}

export function PhotoViewer({ photo, visible, onClose }: PhotoViewerProps) {
  if (!photo) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSourceIcon = (source: 'camera' | 'library') => {
    return source === 'camera' ? 'camera.fill' : 'photo.fill';
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={onClose}
        >
          <IconSymbol name="xmark.circle.fill" size={32} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>

        <View style={styles.imageContainer}>
          <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="contain" />
          
          <View style={styles.overlay}>
            <View style={styles.photoInfo}>
              <ThemedText style={styles.dayText}>Day {photo.day}</ThemedText>
              <ThemedText style={styles.dateText}>{formatDate(photo.date)}</ThemedText>
              
              <View style={styles.sourceContainer}>
                <IconSymbol 
                  name={getSourceIcon(photo.source)} 
                  size={16} 
                  color="#9ca3af" 
                />
                <ThemedText style={styles.sourceText}>
                  {photo.source === 'camera' ? 'Taken with camera' : 'Selected from library'}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
  },
  imageContainer: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.8,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 20,
  },
  photoInfo: {
    alignItems: 'center',
  },
  dayText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    color: '#e5e7eb',
    marginBottom: 12,
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
