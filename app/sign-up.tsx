import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableOpacity, TextInput } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSignUp } from '@clerk/clerk-expo';

export default function SignUpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { signUp, setActive } = useSignUp();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!username.match(/^[a-zA-Z0-9_]{3,20}$/)) {
      Alert.alert('Error', 'Username must be 3-20 characters and contain only letters, numbers, and underscores');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!signUp) {
      Alert.alert('Error', 'Sign up service is not available');
      return;
    }

    setLoading(true);

    try {
      // Create user account using Clerk
      const result = await signUp.create({
        emailAddress: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        username: username,
      });

      // Check if email verification is required
      if (result.status === 'missing_requirements') {
        // Send email verification
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        
        Alert.alert(
          'Verification Required',
          'Please check your email for a verification code.',
          [
            {
              text: 'OK',
              onPress: () => router.push('/verify-email')
            }
          ]
        );
      } else if (result.status === 'complete') {
        // Sign up completed successfully
        await setActive({ session: result.createdSessionId });
        
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
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (error.errors && error.errors.length > 0) {
        errorMessage = error.errors[0].message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              <View style={styles.header}>
                <ThemedText type="title" style={styles.title}>
                  Create Account
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                  Start your 75 Hard journey today
                </ThemedText>
              </View>

              <View style={styles.form}>
                <View style={styles.nameRow}>
                  <TextInput
                    style={[styles.input, styles.halfInput, { color: colors.text, borderColor: colors.border }]}
                    placeholder="First Name"
                    placeholderTextColor={colors.tabIconDefault}
                    value={firstName}
                    onChangeText={setFirstName}
                    autoComplete="given-name"
                  />
                  <TextInput
                    style={[styles.input, styles.halfInput, { color: colors.text, borderColor: colors.border }]}
                    placeholder="Last Name"
                    placeholderTextColor={colors.tabIconDefault}
                    value={lastName}
                    onChangeText={setLastName}
                    autoComplete="family-name"
                  />
                </View>

                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  placeholder="Username"
                  placeholderTextColor={colors.tabIconDefault}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoComplete="username"
                />

                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  placeholder="Email"
                  placeholderTextColor={colors.tabIconDefault}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />

                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  placeholder="Password"
                  placeholderTextColor={colors.tabIconDefault}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                />

                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.tabIconDefault}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoComplete="password"
                />

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.tint }]}
                  onPress={handleSignUp}
                  disabled={loading}
                >
                  <ThemedText style={styles.buttonText}>
                    {loading ? 'Creating account...' : 'Sign Up'}
                  </ThemedText>
                </TouchableOpacity>

                <View style={styles.footer}>
                  <ThemedText style={styles.footerText}>
                    Already have an account?{' '}
                  </ThemedText>
                  <TouchableOpacity onPress={() => router.push('/sign-in')}>
                    <ThemedText style={[styles.linkText, { color: colors.tint }]}>
                      Sign In
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  halfInput: {
    width: '48%',
  },
  button: {
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
