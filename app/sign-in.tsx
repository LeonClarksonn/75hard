import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableOpacity, TextInput } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSignIn } from '@clerk/clerk-expo';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!isLoaded) return;

    setLoading(true);
    setError('');

    try {
      console.log('Attempting sign in with email:', emailAddress);
      
      const signInAttempt = await signIn.create({
        identifier: emailAddress.toLowerCase().trim(),
        password,
      });

      console.log('Sign in attempt result:', signInAttempt);
      console.log('Sign in status:', signInAttempt.status);

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/(tabs)');
      } else {
        console.error('Sign in incomplete:', JSON.stringify(signInAttempt, null, 2));
        setError('Sign in failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Sign in error:', JSON.stringify(err, null, 2));
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      let errorMessage = 'An error occurred during sign in.';
      
      if (err.errors && err.errors.length > 0) {
        errorMessage = err.errors[0].message;
        console.log('Specific error:', errorMessage);
      }
      
      setError(errorMessage);
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
          <View style={styles.content}>
            <View style={styles.header}>
              <ThemedText type="title" style={styles.title}>
                Welcome Back
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Sign in to continue your 75 Hard journey
              </ThemedText>
            </View>

            <View style={styles.form}>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="Email"
                placeholderTextColor={colors.tabIconDefault}
                value={emailAddress}
                onChangeText={setEmailAddress}
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

              {error ? (
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              ) : null}

              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.tint }]}
                onPress={handleSignIn}
                disabled={loading || !emailAddress || !password}
              >
                <ThemedText style={styles.buttonText}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </ThemedText>
              </TouchableOpacity>

              <View style={styles.footer}>
                <ThemedText style={styles.footerText}>
                  Don't have an account?{' '}
                </ThemedText>
                <TouchableOpacity onPress={() => router.push('/sign-up')}>
                  <ThemedText style={[styles.linkText, { color: colors.tint }]}>
                    Sign Up
                  </ThemedText>
                </TouchableOpacity>
              </View>
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
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
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
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
});
