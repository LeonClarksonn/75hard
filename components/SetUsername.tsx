import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUser } from '@clerk/clerk-expo';
import { MappedUserService } from '@/lib/userMapping';

interface SetUsernameProps {
  visible: boolean;
  onClose: () => void;
}

export function SetUsername({ visible, onClose }: SetUsernameProps) {
  const { user } = useUser();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetUsername = async () => {
    if (!user) return;

    // Validate username
    if (!username.match(/^[a-zA-Z0-9_]{3,20}$/)) {
      Alert.alert('Error', 'Username must be 3-20 characters and contain only letters, numbers, and underscores');
      return;
    }

    setLoading(true);
    try {
      // Update username in Clerk
      await user.update({
        username: username,
      });

      // Update in InstantDB
      const userData = {
        email: user.primaryEmailAddress?.emailAddress || '',
        username: username,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous',
        currentStreak: 0,
        longestStreak: 0,
        startDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };

      await MappedUserService.saveUser(user.id, userData);

      Alert.alert('Success', 'Username set successfully!', [
        { text: 'OK', onPress: onClose }
      ]);
    } catch (error: any) {
      console.error('Failed to set username:', error);
      
      let errorMessage = 'Failed to set username. Please try again.';
      if (error.errors && error.errors[0]?.message) {
        errorMessage = error.errors[0].message;
      } else if (error.message?.includes('username_taken')) {
        errorMessage = 'This username is already taken. Please choose another.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <ThemedText style={styles.title}>Set Your Username</ThemedText>
          <ThemedText style={styles.subtitle}>
            Choose a username to help friends find you
          </ThemedText>

          <TextInput
            style={[styles.input, { 
              color: colors.text, 
              borderColor: colors.border,
              backgroundColor: colors.background 
            }]}
            placeholder="Username"
            placeholderTextColor={colors.tabIconDefault}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoFocus={true}
          />

          <ThemedText style={styles.hint}>
            3-20 characters, letters, numbers, and underscores only
          </ThemedText>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <ThemedText style={styles.cancelButtonText}>Later</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton, { backgroundColor: colors.tint }]}
              onPress={handleSetUsername}
              disabled={loading || !username}
            >
              <ThemedText style={styles.submitButtonText}>
                {loading ? 'Setting...' : 'Set Username'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitButton: {},
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});