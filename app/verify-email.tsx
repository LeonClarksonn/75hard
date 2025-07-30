import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableOpacity, TextInput } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSignUp } from '@clerk/clerk-expo';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { signUp, setActive } = useSignUp();

  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyEmail = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    if (!signUp) {
      Alert.alert('Error', 'Sign up session not found');
      return;
    }

    // Clean the verification code (remove any spaces or non-numeric characters)
    const cleanCode = verificationCode.replace(/\s/g, '').replace(/\D/g, '');
    
    if (cleanCode.length !== 6) {
      Alert.alert('Error', 'Please enter a 6-digit verification code');
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting verification with code:', cleanCode);
      console.log('Sign up status:', signUp.status);
      
      // Attempt to complete the sign up with the verification code
      const result = await signUp.attemptEmailAddressVerification({
        code: cleanCode,
      });

      console.log('Verification result:', result);
      console.log('Result status:', result.status);

      if (result.status === 'complete') {
        // Set the active session
        await setActive({ session: result.createdSessionId });
        
        Alert.alert(
          'Success',
          'Email verified successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)')
            }
          ]
        );
      } else if (result.status === 'missing_requirements') {
        console.log('Missing requirements:', result.missingRequirements);
        
        // Check what's missing and try to complete it
        const missingReqs = result.missingRequirements || [];
        
        if (missingReqs.includes('email_address')) {
          Alert.alert('Error', 'Email address verification is still required.');
        } else {
          // Try to complete the sign up process
          try {
            const completeResult = await signUp.create({
              emailAddress: signUp.emailAddress,
              password: signUp.password,
              firstName: signUp.firstName,
              lastName: signUp.lastName,
            });
            
            if (completeResult.status === 'complete') {
              await setActive({ session: completeResult.createdSessionId });
              
              Alert.alert(
                'Success',
                'Account created successfully!',
                [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/(tabs)')
                  }
                ]
              );
            } else {
              Alert.alert('Error', 'Account creation incomplete. Please try signing up again.');
            }
          } catch (completeError: any) {
            console.error('Complete signup error:', completeError);
            Alert.alert('Error', 'Failed to complete account creation. Please try signing up again.');
          }
        }
      } else {
        console.log('Verification incomplete. Status:', result.status);
        console.log('Missing requirements:', result.missingRequirements);
        Alert.alert('Error', `Verification failed. Status: ${result.status}. Please try again.`);
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Invalid verification code. Please try again.';
      
      if (error.errors && error.errors.length > 0) {
        errorMessage = error.errors[0].message;
        console.log('Clerk error message:', errorMessage);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!signUp) {
      Alert.alert('Error', 'Sign up session not found');
      return;
    }

    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      Alert.alert('Success', 'Verification code sent to your email');
    } catch (error: any) {
      console.error('Resend error:', error);
      Alert.alert('Error', 'Failed to resend verification code');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <ThemedText type="title" style={styles.title}>
                Verify Your Email
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                We've sent a verification code to your email address. Please enter it below to complete your registration.
              </ThemedText>
            </View>

            <View style={styles.form}>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="Enter verification code"
                placeholderTextColor={colors.tabIconDefault}
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                autoComplete="sms-otp"
                textAlign="center"
                maxLength={6}
              />

              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.tint }]}
                onPress={handleVerifyEmail}
                disabled={loading}
              >
                <ThemedText style={styles.buttonText}>
                  {loading ? 'Verifying...' : 'Verify Email'}
                </ThemedText>
              </TouchableOpacity>

              <View style={styles.footer}>
                <ThemedText style={styles.footerText}>
                  Didn't receive the code?{' '}
                </ThemedText>
                <TouchableOpacity onPress={handleResendCode}>
                  <ThemedText style={[styles.linkText, { color: colors.tint }]}>
                    Resend Code
                  </ThemedText>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <ThemedText style={[styles.linkText, { color: colors.tabIconDefault }]}>
                  Back to Sign Up
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    height: 60,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 24,
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 4,
  },
  button: {
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
  },
});
