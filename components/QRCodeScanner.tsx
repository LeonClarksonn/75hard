import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, TextInput, Text, Platform } from 'react-native';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';

// Conditionally import camera module
let CameraView: any = null;
let useCameraPermissions: any = null;

try {
  const cameraModule = require('expo-camera');
  CameraView = cameraModule.CameraView;
  useCameraPermissions = cameraModule.useCameraPermissions;
} catch (error) {
  console.log('Camera module not available');
}

interface QRCodeScannerProps {
  onCodeScanned: (friendCode: string) => void;
  onClose?: () => void;
}

export default function QRCodeScanner({ onCodeScanned, onClose }: QRCodeScannerProps) {
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // Only use camera permissions if available
  const cameraPermissionHook = useCameraPermissions ? useCameraPermissions() : [null, null];
  const [permission, requestPermission] = cameraPermissionHook;

  useEffect(() => {
    // Check if camera is available
    setCameraAvailable(!!CameraView && !!useCameraPermissions);
  }, []);

  const handleManualEntry = () => {
    if (manualCode.trim()) {
      onCodeScanned(manualCode.trim());
      setManualCode('');
    } else {
      Alert.alert('Error', 'Please enter a valid friend code');
    }
  };

  const handleStartScanning = async () => {
    if (!cameraAvailable) {
      Alert.alert(
        'Camera Not Available',
        'Camera scanning is not available in Expo Go. Please use a development build or enter the code manually.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access to scan QR codes.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    setIsScanning(true);
    setScanned(false);
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    console.log('QR Scanner: Detected barcode', { type, data, scanned });
    setDebugInfo(`Detected: ${type}`);
    
    if (scanned) return;
    
    setScanned(true);
    
    // Vibrate to indicate scan (if available)
    try {
      const { Haptics } = require('expo-haptics');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      // Haptics not available
    }
    
    console.log('QR Scanner: Processing QR code:', data);
    
    // Check if it's a valid friend code - be more flexible with the check
    if (data && data.length > 0) {
      // Try to parse as JSON first (for custom QR codes)
      try {
        const parsed = JSON.parse(data);
        if (parsed.userId || parsed.username || parsed.type === 'friend') {
          setIsScanning(false);
          onCodeScanned(data);
          return;
        }
      } catch (e) {
        // Not JSON, check if it's a URL or contains friend info
        if (data.includes('add-friend') || data.includes('userId') || data.includes('username')) {
          setIsScanning(false);
          onCodeScanned(data);
          return;
        }
      }
    }
    
    Alert.alert(
      'Invalid QR Code',
      `This QR code doesn't contain friend information.\n\nScanned: ${data.substring(0, 50)}${data.length > 50 ? '...' : ''}`,
      [
        {
          text: 'Try Again',
          onPress: () => {
            setScanned(false);
            setDebugInfo('');
          }
        },
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {
            setIsScanning(false);
            setDebugInfo('');
          }
        }
      ]
    );
  };

  const pasteSampleCode = () => {
    // Simulate pasting a sample friend code with a test user
    const sampleCode = 'https://75hard.app/add-friend?userId=test-user-123&username=testuser';
    setManualCode(sampleCode);
  };

  if (!permission && cameraAvailable) {
    return (
      <View style={styles.container}>
        <ThemedText>Requesting camera permission...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Scan QR Code</ThemedText>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Camera View */}
      {isScanning && cameraAvailable && CameraView ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'aztec', 'datamatrix'],
            }}
          >
            <View style={styles.scanningOverlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
              </View>
              <ThemedText style={styles.scanText}>
                {scanned ? 'Processing...' : 'Position QR code within frame'}
              </ThemedText>
              {debugInfo ? (
                <ThemedText style={styles.debugText}>{debugInfo}</ThemedText>
              ) : null}
            </View>
            
            {/* Cancel button overlay */}
            <TouchableOpacity 
              style={styles.cancelScanButton} 
              onPress={() => {
                setIsScanning(false);
                setScanned(false);
              }}
            >
              <IconSymbol name="xmark.circle.fill" size={40} color="#ffffff" />
            </TouchableOpacity>
          </CameraView>
        </View>
      ) : (
        <>
          {/* Camera placeholder */}
          <View style={styles.cameraContainer}>
            <View style={styles.cameraPlaceholder}>
              <View style={styles.cameraInactive}>
                <IconSymbol name="camera" size={60} color="#6b7280" />
                <ThemedText style={styles.cameraText}>
                  {cameraAvailable ? 'Camera View' : 'Camera Not Available'}
                </ThemedText>
                {!cameraAvailable && (
                  <ThemedText style={styles.cameraHint}>
                    Use manual entry below
                  </ThemedText>
                )}
              </View>
            </View>
          </View>

          {cameraAvailable && (
            <TouchableOpacity 
              style={styles.scanButton} 
              onPress={handleStartScanning}
            >
              <IconSymbol name="camera.circle" size={24} color="#ffffff" />
              <ThemedText style={styles.scanButtonText}>Start Scanning</ThemedText>
            </TouchableOpacity>
          )}
        </>
      )}

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <ThemedText style={styles.dividerText}>
          {cameraAvailable ? 'OR' : 'Enter Code Manually'}
        </ThemedText>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.manualEntry}>
        <ThemedText style={styles.manualTitle}>Friend Code</ThemedText>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.codeInput}
            placeholder="Paste friend code or link here"
            placeholderTextColor="#6b7280"
            value={manualCode}
            onChangeText={setManualCode}
            multiline
            numberOfLines={3}
          />
        </View>
        
        <View style={styles.manualActions}>
          <TouchableOpacity style={styles.pasteButton} onPress={pasteSampleCode}>
            <IconSymbol name="doc.on.clipboard" size={16} color="#3b82f6" />
            <ThemedText style={styles.pasteText}>Try Sample</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.addButton, !manualCode.trim() && styles.addButtonDisabled]} 
            onPress={handleManualEntry}
            disabled={!manualCode.trim()}
          >
            <ThemedText style={[styles.addButtonText, !manualCode.trim() && styles.addButtonTextDisabled]}>
              Add Friend
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>
          {cameraAvailable 
            ? "Point your camera at a friend's QR code or enter their friend code manually"
            : "Enter your friend's code manually or use a development build for camera scanning"}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0a0a',
    padding: 20,
    flex: 1,
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
  cameraContainer: {
    height: 250,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraInactive: {
    alignItems: 'center',
    gap: 8,
  },
  cameraText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  cameraHint: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  scanningOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#3b82f6',
    borderWidth: 4,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanText: {
    marginTop: 20,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  debugText: {
    marginTop: 8,
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  cancelScanButton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2a2a2a',
  },
  dividerText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    paddingHorizontal: 16,
  },
  manualEntry: {
    marginBottom: 24,
  },
  manualTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  codeInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  manualActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    gap: 6,
  },
  pasteText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#374151',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  addButtonTextDisabled: {
    color: '#6b7280',
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