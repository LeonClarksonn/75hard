import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/hooks/useColorScheme';
import InstantProvider from './ConvexProvider';
import { ClerkProvider } from './ClerkProvider';
import { TaskProvider } from '@/contexts/TaskContext';
import { UserProvider } from '@/contexts/UserContext';
import { FriendsProvider } from '@/contexts/FriendsContextHooks';
import { UserSync } from '@/components/UserSync';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ClerkProvider>
      <UserSync>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <InstantProvider>
            <UserProvider>
              <TaskProvider>
                <FriendsProvider>
                  <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                    <Stack>
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
                      <Stack.Screen name="sign-up" options={{ headerShown: false }} />
                      <Stack.Screen name="verify-email" options={{ headerShown: false }} />
                      <Stack.Screen name="+not-found" />
                    </Stack>
                    <StatusBar style="auto" />
                  </ThemeProvider>
                </FriendsProvider>
              </TaskProvider>
            </UserProvider>
          </InstantProvider>
        </GestureHandlerRootView>
      </UserSync>
    </ClerkProvider>
  );
}
