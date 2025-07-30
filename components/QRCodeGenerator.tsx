import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Share, Image } from 'react-native';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';

interface QRCodeGeneratorProps {
  userId: string;
  username: string;
  onClose?: () => void;
}

export default function QRCodeGenerator({ userId, username, onClose }: QRCodeGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  let qrRef: any = null;

  // Generate the friend code URL that would be encoded in the QR code
  const generateFriendCode = () => {
    // URL format that the scanner expects
    return `https://75hard.app/add-friend?userId=${userId}&username=${username}`;
  };

  const handleShareCode = async () => {
    try {
      const friendCode = generateFriendCode();
      const shareableLink = `https://75hard.app/add-friend?userId=${userId}&username=${username}`;
      await Share.share({
        message: `Add me on 75Hard! My username is @${username}\n\nFriend link: ${shareableLink}`,
        title: 'Add me on 75Hard!',
      });
    } catch (error) {
      console.error('Failed to share friend code:', error);
      Alert.alert('Error', 'Failed to share friend code');
    }
  };

  const handleCopyCode = () => {
    const friendCode = generateFriendCode();
    // In a real app, you'd copy to clipboard
    Alert.alert(
      'Friend Code Copied!', 
      `Your friend code has been copied: ${friendCode}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>My QR Code</ThemedText>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.qrContainer}>
        <View style={styles.qrCodeWrapper}>
          <Image
            source={{
              uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generateFriendCode())}`
            }}
            style={styles.qrCode}
            resizeMode="contain"
          />
        </View>
      </View>

      <View style={styles.userInfo}>
        <ThemedText style={styles.displayName}>@{username}</ThemedText>
        <ThemedText style={styles.instruction}>
          Have your friends scan this code to add you instantly!
        </ThemedText>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShareCode}>
          <IconSymbol name="square.and.arrow.up" size={20} color="#3b82f6" />
          <ThemedText style={styles.actionText}>Share Code</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleCopyCode}>
          <IconSymbol name="doc.on.doc" size={20} color="#3b82f6" />
          <ThemedText style={styles.actionText}>Copy Link</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>
          Your QR code is unique to your account and can be used to quickly add friends
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButton: {
    padding: 8,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrCodeWrapper: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  qrCode: {
    width: 200,
    height: 200,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
  },
});